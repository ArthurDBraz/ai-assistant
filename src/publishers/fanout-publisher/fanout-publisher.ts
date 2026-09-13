import type { OutputPublisher } from "../output-publisher.js";

export class FanoutPublisher implements OutputPublisher {
    constructor(private readonly publishers: readonly OutputPublisher[]) {}

    async publish(text: string): Promise<void> {
        await Promise.all(
            this.publishers.map((publisher) => publisher.publish(text)),
        );
    }
}
