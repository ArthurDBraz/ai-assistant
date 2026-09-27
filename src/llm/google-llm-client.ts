import { GoogleGenAI, type Content, type FunctionDeclaration, type Part } from '@google/genai';
import type { ChatOptions, LlmChunk, LlmClient, Message, ToolSchema } from './llm-client.js';

export class GoogleLlmClient implements LlmClient {

    private readonly ai: GoogleGenAI;

    constructor(private readonly model: string) {
        this.ai = new GoogleGenAI({});
    }

    async *chat(messages: Message[], tools: ToolSchema[], options?: ChatOptions): AsyncIterable<LlmChunk> {
        const response = this.ai.models.generateContent({
            model: this.model,
            contents: messages.map(this.toGoogleGenAIMessage),
            config: {
                ...(tools.length > 0 ? { tools: tools.map((tool) => ({
                    functionDeclarations: [this.toGoogleTool(tool)],
                })) } : {}),
            },
        });

        return (await response).text;
    }

    private toGoogleGenAIMessage(message: Message): Content {
        const parts: Part[] = [];

        if (message.content) {
            parts.push({ text: message.content });
        }

        if (message.toolCalls?.length) {
            for (const call of message.toolCalls) {
                parts.push({
                    functionCall: {
                        id: call.id,
                        name: call.name,
                        args: call.arguments,
                    },
                });
            }
        }

        if (message.role === "tool" && message.toolName && message.toolCallId) {
            let response: Record<string, unknown> = {};

            try {
                const parsed = JSON.parse(message.content);
                response =
                    typeof parsed === "object" && parsed !== null ? parsed : { output: parsed };
            } catch {
                response = { output: message.content };
            }

            parts.push({
                functionResponse: {
                    id: message.toolCallId,
                    name: message.toolName,
                    response,
                },
            });
        }

        return {
            role:
                message.role === "assistant" ? "model" :
                message.role === "tool" ? "user" :
                "user",
            parts,
        };
    }

    private toGoogleTool(tool: ToolSchema): FunctionDeclaration {
        return {
            name: tool.name,
            description: tool.description,
            parametersJsonSchema: tool.parameters,
        };
    }
}