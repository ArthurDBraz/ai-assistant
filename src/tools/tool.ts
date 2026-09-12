// The `Tool` interface \u2014 the shape every tool in the assistant implements.
//
// Why this exists:
//   Today, a tool is split across two places in `main.ts`:
//     1. An entry in the `tools: Tool[]` array (the schema the LLM sees).
//     2. An entry in `toolMap` (the function that actually runs).
//   These can drift: rename the schema, forget to rename the map key, and
//   you get a runtime error. Self-describing tools bundle both into one
//   object so the compiler catches the mismatch.
//
// Suggested shape:
//
//   import type { ToolSchema } from "../llm/llm-client.js";
//
//   export interface Tool {
//     readonly schema: ToolSchema;
//     execute(args: Record<string, unknown>): Promise<unknown>;
//   }
//
// The assistant loop no longer needs a `toolMap`; it just does:
//
//   const tool = tools.find(t => t.schema.name === call.name);
//   await tool.execute(call.arguments);
//
// TODO: define the `Tool` interface referencing your own `ToolSchema` type
//       (from `../llm/llm-client.ts`), never `ollama`'s `Tool` type.

import type { ToolSchema } from "../llm/llm-client.js";

export interface Tool {
    readonly schema: ToolSchema;
    execute(args: Record<string, unknown>): Promise<unknown>;
}
