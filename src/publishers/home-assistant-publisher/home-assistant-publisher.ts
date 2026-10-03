import type { AssistantResponse, OutputPublisher } from "../output-publisher.js";

export class HomeAssistantPublisher implements OutputPublisher {

    constructor(
        private readonly baseUrl: string,
        private readonly token: string,
        private readonly entityId: string
    ) {}

    async publish(assistantResponse: AssistantResponse): Promise<void> {
        const response = await fetch(
            `${this.baseUrl}/api/states/${this.entityId}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "state": assistantResponse.response.slice(0,255), // Maximum input size
                    "attributes": {
                        "temperature": assistantResponse.attributes?.temperatureC,
                        "forecast": assistantResponse.attributes?.forecast,
                    }
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