import type { AssistantResponse, OutputPublisher } from "../output-publisher.js";

export class FanoutPublisher implements OutputPublisher {
    constructor(private readonly publishers: readonly OutputPublisher[]) {}

    async publish(response: AssistantResponse): Promise<void> {
        await Promise.all(
            this.publishers.map((publisher) => publisher.publish(response)),
        );
    }
}
