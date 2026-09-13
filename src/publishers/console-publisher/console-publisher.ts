import type { OutputPublisher } from "../output-publisher.js";

export class ConsolePublisher implements OutputPublisher {
    async publish(text: string): Promise<void> {
        console.log(text);
    }
}