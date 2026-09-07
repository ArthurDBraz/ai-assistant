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

export {};
