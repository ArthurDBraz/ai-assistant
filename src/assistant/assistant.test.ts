import assert from "node:assert/strict";
import test from "node:test";
import { Assistant } from "./assistant.js";
import type {
    ChatOptions,
    LlmChunk,
    LlmClient,
    Message,
    ToolSchema,
} from "../llm/llm-client.js";
import type { OutputPublisher } from "../publishers/output-publisher.js";
import type { Tool } from "../tools/tool.js";

class FakeLlmClient implements LlmClient {
    readonly calls: { messages: Message[]; options: ChatOptions | undefined }[] = [];

    constructor(private readonly responses: LlmChunk[][]) {}

    async *chat(
        messages: Message[],
        _tools: ToolSchema[],
        options?: ChatOptions,
    ): AsyncIterable<LlmChunk> {
        this.calls.push({ messages, options });
        for (const chunk of this.responses.shift() ?? []) {
            yield chunk;
        }
    }
}

class RecordingPublisher implements OutputPublisher {
    readonly published: string[] = [];

    async publish(text: string): Promise<void> {
        this.published.push(text);
    }
}

test("publishes the display text from a valid structured response", async () => {
    const llmClient = new FakeLlmClient([[{
        content: JSON.stringify({
            response: "It is 20 C.",
            intent: "weather.current",
            status: "success",
            attributes: { temperature: 20 },
        }),
    }]]);
    const publisher = new RecordingPublisher();

    await new Assistant(llmClient, [], publisher).run("What is the temperature?");

    assert.deepEqual(publisher.published, ["It is 20 C."]);
    assert.deepEqual(llmClient.calls[0]?.options?.responseFormat?.required, [
        "response",
        "intent",
        "status",
    ]);
});

test("executes tools before parsing the final structured response", async () => {
    const llmClient = new FakeLlmClient([
        [{ toolCall: { id: "call-1", name: "current_time", arguments: {} } }],
        [{ content: JSON.stringify({
            response: "It is noon.",
            intent: "time.current",
            status: "success",
        }) }],
    ]);
    const publisher = new RecordingPublisher();
    const tool: Tool = {
        schema: {
            name: "current_time",
            description: "Gets the current time",
            parameters: { type: "object", properties: {} },
        },
        async execute() {
            return { time: "12:00" };
        },
    };

    await new Assistant(llmClient, [tool], publisher).run("What time is it?");

    assert.deepEqual(publisher.published, ["It is noon."]);
    assert.equal(llmClient.calls.length, 2);
});

test("retries one invalid response before publishing the corrected display text", async () => {
    const llmClient = new FakeLlmClient([
        [{ content: "not JSON" }],
        [{ content: JSON.stringify({
            response: "Please specify a city.",
            intent: "weather.current",
            status: "needs_input",
        }) }],
    ]);
    const publisher = new RecordingPublisher();

    await new Assistant(llmClient, [], publisher).run("What is the weather?");

    assert.deepEqual(publisher.published, ["Please specify a city."]);
    assert.equal(llmClient.calls.length, 2);
    assert.match(llmClient.calls[1]?.messages.at(-1)?.content ?? "", /did not match/);
});

test("publishes a safe failure message after a second invalid response", async () => {
    const llmClient = new FakeLlmClient([
        [{ content: "not JSON" }],
        [{ content: JSON.stringify({
            response: "Missing fields",
            intent: "greeting",
            status: "success",
            extra: "not allowed",
        }) }],
    ]);
    const publisher = new RecordingPublisher();

    await new Assistant(llmClient, [], publisher).run("Hello");

    assert.deepEqual(publisher.published, ["I could not produce a valid response."]);
    assert.equal(llmClient.calls.length, 2);
});
