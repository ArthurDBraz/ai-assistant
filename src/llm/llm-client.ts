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
//       tools, returning a stream of chunks.
//
//   Downstream code (the assistant, the tools) imports from HERE, not from
//   `ollama`. Only `ollama-llm-client.ts` is allowed to touch the `ollama`
//   package.

// ---------------------------------------------------------------------------
// JSON Schema — the shape used to describe tool parameters.
//
// This is a *tiny* subset of JSON Schema, just enough to describe the kind of
// parameters an LLM tool takes. Every major provider (Ollama, OpenAI,
// Anthropic, Gemini) accepts JSON Schema for parameters, so this stays
// portable across adapters.
//
// If you need richer schemas later (nested objects, arrays of objects,
// unions), extend this — but resist the urge until you actually need it.
// ---------------------------------------------------------------------------

export type JsonSchemaType =
    | "string"
    | "number"
    | "integer"
    | "boolean"
    | "array"
    | "object";

export interface JsonSchemaProperty {
    type: JsonSchemaType;
    description?: string;
    enum?: string[];
    items?: JsonSchemaProperty;
}

export interface JsonSchema {
    type: "object";
    properties: Record<string, JsonSchemaProperty>;
    required?: string[];
}

// ---------------------------------------------------------------------------
// Tool schema — what the LLM sees when deciding whether to call a tool.
//
// The adapter (e.g. `OllamaLlmClient`) wraps this into whatever envelope its
// provider expects. For Ollama that's `{ type: "function", function: {...} }`.
// For OpenAI it's very similar. For Anthropic it's `{ name, description,
// input_schema }`. All of them can be produced from this shape.
// ---------------------------------------------------------------------------

export interface ToolSchema {
    name: string;
    description: string;
    parameters: JsonSchema;
}

// ---------------------------------------------------------------------------
// Tool call — the LLM's request to run a tool.
//
// `id` matters: providers that support parallel tool calls (OpenAI,
// Anthropic) require you to send the tool result back tagged with the same
// id, so they can match request↔response. Ollama doesn't require it today,
// but adapters can synthesise one (e.g. `crypto.randomUUID()`) so the
// interface stays uniform.
//
// `arguments` is always a parsed object here, never a JSON string. OpenAI
// returns arguments as a string (e.g. `'{"city":"Porto Alegre"}'`); its
// adapter parses that before handing the call to the assistant.
// ---------------------------------------------------------------------------

export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Message — the conversation history unit.
//
// Kept intentionally small. Provider-specific fields (thinking tokens,
// images, logprobs) live behind the adapter and don't leak here.
//
// `toolCallId` on a tool result message pairs it with the originating call
// via `ToolCall.id`.
// ---------------------------------------------------------------------------

export type Role = "system" | "user" | "assistant" | "tool";

export interface Message {
    role: Role;
    content: string;
    toolCalls?: ToolCall[];
    toolCallId?: string;
    toolName?: string;
}

// ---------------------------------------------------------------------------
// Chat chunk — one piece of a streamed response.
//
// Streaming is provider-native for Ollama and OpenAI, so it's the useful
// primitive to expose. A non-streaming client is trivially built on top of
// this by collecting all chunks.
//
// A chunk carries either a piece of text (`content`), a completed tool call
// (`toolCall`), or a `done` flag on the final chunk. Adapters decide how
// they slice their provider's stream into these.
// ---------------------------------------------------------------------------

export interface LlmChunk {
    content?: string;
    toolCall?: ToolCall;
    done?: boolean;
}

// ---------------------------------------------------------------------------
// The LLM client interface — the seam.
//
// One method: hand it messages + tool schemas, get back an async stream of
// chunks. Everything else (auth, model selection, host, retries) is a
// concern of the concrete implementation and belongs in its constructor.
// ---------------------------------------------------------------------------

export interface LlmClient {
    chat(messages: Message[], tools: ToolSchema[]): AsyncIterable<LlmChunk>;
}
