import type { ToolSchema } from "../llm/llm-client.js";

export interface Tool {
    readonly schema: ToolSchema;
    execute(args: Record<string, unknown>): Promise<unknown>;
}
