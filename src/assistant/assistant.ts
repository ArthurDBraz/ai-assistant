import type { JsonSchema, LlmClient, Message, ToolCall } from "../llm/llm-client.js";
import type { OutputPublisher } from "../publishers/output-publisher.js";
import type { Tool } from "../tools/tool.js";

type AssistantResponseStatus = "success" | "needs_input" | "error";

interface AssistantResponse {
    response: string;
    intent: string;
    status: AssistantResponseStatus;
    attributes?: Record<string, string | number | boolean>;
}

const assistantResponseSchema: JsonSchema = {
    type: "object",
    properties: {
        response: { type: "string", description: "The human-readable answer to publish." },
        intent: { type: "string", description: "A stable categorisation of the request." },
        status: {
            type: "string",
            description: "Whether the request succeeded, needs more input, or failed.",
            enum: ["success", "needs_input", "error"],
        },
        attributes: {
            type: "object",
            description: "Optional primitive metadata for future entity mappings.",
            additionalProperties: {
                anyOf: [
                    { type: "string" },
                    { type: "number" },
                    { type: "boolean" },
                ],
            },
        },
    },
    required: ["response", "intent", "status"],
    additionalProperties: false,
};

const invalidResponseMessage = "I could not produce a valid response.";

export class Assistant {
    constructor(
        private readonly llmClient: LlmClient,
        private readonly tools: Tool[],
        private readonly publisher: OutputPublisher,
    ) {}

    async run(userInput: string): Promise<void> {

        const messages: Message[] = [{ role: "user", content: userInput }];
        const toolSchemas = this.tools.map((tool) => tool.schema);
        let responseAttempts = 0;
        
        while (true) {
            const stream = this.llmClient.chat(messages, toolSchemas, {
                responseFormat: assistantResponseSchema,
            });

            let content = "";
            const toolCalls: ToolCall[] = [];

            for await (const chunk of stream) {
                content += chunk.content ?? "";

                if (chunk.toolCall) {
                    toolCalls.push(chunk.toolCall);
                }
            }

            if (toolCalls.length === 0) {
                const response = this.parseResponse(content);
                if (response) {
                    await this.publisher.publish(response.response);
                    break;
                }

                if (responseAttempts === 1) {
                    await this.publisher.publish(invalidResponseMessage);
                    break;
                }

                responseAttempts += 1;
                messages.push({ role: "assistant", content });
                messages.push({
                    role: "user",
                    content: "Your previous response did not match the required JSON schema. Return only a valid response matching that schema.",
                });
                continue;
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

    private parseResponse(content: string): AssistantResponse | undefined {
        let value: unknown;
        try {
            value = JSON.parse(content);
        } catch {
            return undefined;
        }

        if (!isRecord(value)
            || !hasOnlyKeys(value, ["response", "intent", "status", "attributes"])
            || typeof value.response !== "string"
            || typeof value.intent !== "string"
            || !isResponseStatus(value.status)
            || (value.attributes !== undefined && !isAttributes(value.attributes))) {
            return undefined;
        }

        return {
            response: value.response,
            intent: value.intent,
            status: value.status,
            ...(value.attributes === undefined ? {} : { attributes: value.attributes }),
        };
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: string[]): boolean {
    return Object.keys(value).every((key) => allowedKeys.includes(key));
}

function isResponseStatus(value: unknown): value is AssistantResponseStatus {
    return value === "success" || value === "needs_input" || value === "error";
}

function isAttributes(value: unknown): value is Record<string, string | number | boolean> {
    return isRecord(value) && Object.values(value).every((attribute) =>
        typeof attribute === "string"
        || typeof attribute === "number"
        || typeof attribute === "boolean",
    );
}
