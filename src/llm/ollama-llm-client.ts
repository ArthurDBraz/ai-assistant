// Ollama implementation of `LlmClient`.
//
// Why this file is separate:
//   This is the ONLY file in the codebase that is allowed to import from the
//   `ollama` package. Everything else works through the `LlmClient` interface.
//   Swapping to OpenAI later means writing an `OpenAiLlmClient` next to this
//   one, and changing exactly one line in `main.ts`.
//
// What moves here from `main.ts`:
//   - `new Ollama({ host: ... })` construction (host comes from config).
//   - The `ollama.chat({ model, messages, tools, stream: true, ... })` call.
//   - The translation between Ollama's message/tool-call shape and your
//     own `Message` / `ToolCall` types from `./llm-client.ts`.
//
// Suggested shape:
//
//   import { Ollama } from "ollama";
//   import type { LlmClient, Message, ToolSchema } from "./llm-client.js";
//
//   export class OllamaLlmClient implements LlmClient {
//     constructor(private readonly host: string, private readonly model: string) { ... }
//     async *chat(messages: Message[], tools: ToolSchema[]) { ... }
//   }
//
// TODO: implement using the code currently living in `src/main.ts`.

import type {
    LlmChunk,
    LlmClient,
    Message,
    ToolCall as LocalToolCall,
    ToolSchema,
} from "./llm-client.js";

import {
    Ollama,
    type Message as OllamaMessage,
    type Tool,
    type ToolCall as OllamaToolCall,
} from "ollama";

export class OllamaLLMClient implements LlmClient{

    private readonly ollama: Ollama;

    constructor(
        private readonly host: string,
        private readonly model: string) {
        this.ollama = new Ollama({
            host: this.host
            });
    }

    async *chat(messages: Message[], tools: ToolSchema[]): AsyncIterable<LlmChunk> {
        const stream = await this.ollama.chat({
            model: this.model,
            messages: messages.map(message => this.toOllamaMessage(message)),
            tools: tools.map(tool => this.toOllamaTool(tool)),
            stream: true,
            think: false,
        });

        for await (const chunk of stream) {
            if (chunk.message.content) {
                yield { content: chunk.message.content };
            }
            for (const call of chunk.message.tool_calls ?? []) {
                yield {
                    toolCall: {
                        id: crypto.randomUUID(),
                        name: call.function.name,
                        arguments: call.function.arguments
                    }
                };
            }
            if (chunk.done) yield { done: true };
        }
    }

    private toOllamaTool(toolSchema: ToolSchema): Tool {
        return {
            type: "function",
            function: {
                name: toolSchema.name,
                description: toolSchema.description,
                parameters: toolSchema.parameters
            }
        };
    }

    private toOllamaMessage(message: Message): OllamaMessage {
        const ollamaMessage: OllamaMessage =  {
            content: message.content,
            role: message.role
        }

        if (message.toolCalls) {
            ollamaMessage.tool_calls = message.toolCalls.map(this.toOllamaToolCall)
        }

        if (message.toolName) {
            ollamaMessage.tool_name = message.toolName
        }

        return ollamaMessage;
    }

    private toOllamaToolCall(toolCall: LocalToolCall): OllamaToolCall {
        return {
            function: {
                name: toolCall.name,
                arguments: toolCall.arguments,
            },
        };
    }
}
