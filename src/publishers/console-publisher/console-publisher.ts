import type { AssistantResponse, OutputPublisher } from "../output-publisher.js";

export class ConsolePublisher implements OutputPublisher {
    async publish(response: AssistantResponse): Promise<void> {
        console.log(JSON.stringify(response, null, 2));
    }
}