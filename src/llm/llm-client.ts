// The LLM boundary.
//
// Why this exists:
//   Today, `main.ts` imports `Message`, `Tool`, `ToolCall` directly from the
//   `ollama` package. That means `ollama` types have leaked all through the
//   app, and swapping to OpenAI/Anthropic would touch every file that
//   mentions those types.
//
//   This module owns the vocabulary of "talking to an LLM":
//     - Your own `Message`, `ToolCall`, tool schema types.
//     - The `LlmClient` interface: a single method to run a chat turn with
//       tools, returning a stream (or the aggregated response).
//
//   Downstream code (the assistant, the tools) imports from HERE, not from
//   `ollama`. Only `ollama-llm-client.ts` is allowed to touch the `ollama`
//   package.
//
// Suggested shape (fill in yourself):
//
//   export interface Message { role: "user" | "assistant" | "tool"; content: string; ... }
//   export interface ToolCall { name: string; arguments: Record<string, unknown>; }
//   export interface ToolSchema { name: string; description: string; parameters?: ... }
//
//   export interface LlmClient {
//     chat(messages: Message[], tools: ToolSchema[]): AsyncIterable<LlmChunk>;
//   }
//
// TODO: define the shape of a message, a tool call, and the LlmClient
//       interface. Re-export nothing from `ollama` \u2014 mirror the types.

export {};
