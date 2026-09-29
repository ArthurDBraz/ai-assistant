import { GoogleGenAI, type Content, type FunctionDeclaration, type Part } from '@google/genai';
import type { ChatOptions, LlmChunk, LlmClient, Message, ToolSchema } from './llm-client.js';

export class GoogleLlmClient implements LlmClient {

    private readonly ai: GoogleGenAI;

    constructor(private readonly model: string) {
        this.ai = new GoogleGenAI({});
    }

    async *chat(messages: Message[], tools: ToolSchema[], options?: ChatOptions): AsyncIterable<LlmChunk> {
        const systemMessages = messages.filter((message) => message.role === "system");
        const response = await this.ai.models.generateContentStream({
            model: this.model,
            contents: messages
                .filter((message) => message.role !== "system")
                .map(this.toGoogleGenAIMessage),
            config: {
                ...(tools.length > 0 ? { tools: tools.map((tool) => ({
                    functionDeclarations: [this.toGoogleTool(tool)],
                })) } : {}),
                ...(systemMessages.length > 0 ? {
                    systemInstruction: systemMessages.map((message) => message.content).join("\n"),
                } : {}),
                ...(options?.responseFormat ? {
                    responseMimeType: "application/json",
                    responseJsonSchema: options.responseFormat,
                } : {}),
            },
        });

        for await (const chunk of response) {
            if (chunk.text) {
                yield { content: chunk.text };
            }

            for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
                const call = part.functionCall;
                if (!call?.name || !call.args) {
                    continue;
                }

                yield {
                    toolCall: {
                        id: call.id ?? crypto.randomUUID(),
                        name: call.name,
                        arguments: call.args,
                        ...(part.thoughtSignature === undefined
                            ? {}
                            : { thoughtSignature: part.thoughtSignature }),
                    },
                };
            }
        }

        yield { done: true };
    }

    private toGoogleGenAIMessage(message: Message): Content {
        const parts: Part[] = [];

        if (message.content && message.role !== "tool") {
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
                    ...(call.thoughtSignature ? { thoughtSignature: call.thoughtSignature } : {}),
                });
            }
        }

        if (message.role === "tool") {
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
                    id: message.toolCallId ?? "",
                    name: message.toolName ?? "",
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