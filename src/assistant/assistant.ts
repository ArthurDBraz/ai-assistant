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
    
      return await tool?.execute(call.arguments);
    }
}
