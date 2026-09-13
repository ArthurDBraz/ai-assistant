// The chat loop \u2014 the app's brain, but only in terms of interfaces.
//
// Why this exists:
//   `main.ts` today contains a big `while (true)` loop that:
//     1. Streams a chat response from Ollama.
//     2. Aggregates content + tool calls.
//     3. If the LLM asked for tools, runs them and loops.
//     4. Otherwise prints the final answer and exits.
//
//   That logic is the *assistant*. It shouldn't live in the composition root
//   (`main.ts`) because then `main.ts` is doing two jobs \u2014 wiring things up
//   AND running the show. Pulling the loop out into an `Assistant` class
//   leaves `main.ts` as a tiny recipe: "build these pieces, hand them to
//   Assistant, go".
//
//   Crucially, this class knows about ZERO concrete implementations. It
//   takes an `LlmClient`, a list of `Tool`s, and an `OutputPublisher`.
//   That's what makes it testable: pass fakes in a test, no network needed.
//
// Suggested shape:
//
//   import type { LlmClient, Message } from "../llm/llm-client.js";
//   import type { Tool } from "../tools/tool.js";
//   import type { OutputPublisher } from "../publishers/output-publisher.js";
//
//   export class Assistant {
//     constructor(
//       private readonly llm: LlmClient,
//       private readonly tools: Tool[],
//       private readonly publisher: OutputPublisher,
//     ) {}
//
//     async run(userInput: string): Promise<void> {
//       const messages: Message[] = [{ role: "user", content: userInput }];
//       while (true) {
//         // 1. stream chat from this.llm.chat(messages, tools.map(t => t.schema))
//         // 2. collect content + tool calls
//         // 3. if no tool calls: await this.publisher.publish(content); return
//         // 4. else: for each call, find tool, execute, append tool message, loop
//       }
//     }
//   }
//
// TODO: move the `while (true)` block, `executeTool`, and the surrounding
//       state from `main.ts` into this class. Replace the direct `ollama`
//       usage with `this.llm.chat(...)`. Replace `console.log(content)` with
//       `this.publisher.publish(content)`.

import type { LlmClient, Message, ToolCall } from "../llm/llm-client.js";
import type { OutputPublisher } from "../publishers/output-publisher.js";
import type { Tool } from "../tools/tool.js";

export class Assistant {
    constructor(
        private readonly llmClient: LlmClient,
        private readonly tools: Tool[],
        private readonly publisher: OutputPublisher,
    ) {}

    async run(userInput: string): Promise<void> {

        const messages: Message[] = [{ role: "user", content: userInput }];
        const toolSchemas = this.tools.map((tool) => tool.schema);
        
        while (true) {
            const stream = this.llmClient.chat(messages, toolSchemas);

            let content = "";
            const toolCalls: ToolCall[] = [];

            for await (const chunk of stream) {
                content += chunk.content ?? "";

                if (chunk.toolCall) {
                    toolCalls.push(chunk.toolCall);
                }
            }

            if (toolCalls.length === 0) {
                await this.publisher.publish(content);
                break;
            }

            messages.push({
                role: "assistant",
                content,
                toolCalls: toolCalls,
            });

            for (const call of toolCalls) {
                const result = await this.executeTool(call);

                messages.push({
                    role: "tool",
                    toolName: call.name,
                    content: JSON.stringify(result),
                });
            }
        }
    }

    private async executeTool(call: ToolCall) {
      const tool = this.tools.find(t => t.schema.name === call.name);
    
      if (tool === undefined) {
        throw Error(`Tool "${call.name}" not found`);
      }
    
      await tool?.execute(call.arguments);
    }
}
