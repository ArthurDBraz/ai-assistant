import type { OutputPublisher } from "../output-publisher.js";

export class HomeAssistantPublisher implements OutputPublisher {

    constructor(
        private readonly baseUrl: string,
        private readonly token: string,
        private readonly entityId: string
    ) {}

    async publish(text: string): Promise<void> {
        const response = await fetch(
            `${this.baseUrl}/api/services/input_text/set_value`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "entity_id": this.entityId,
                    value: text.slice(0,255), // Maximum input size
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                `Home Assistant returned ${response.status}: ${await response.text()}`
            )
        }
    }
}