export class HomeAssistantService {
    constructor(
        private readonly baseUrl: string,
        private readonly token: string
    ) {}

    async getState(entityId: string): Promise<any> {
        const response = await fetch(
            `${this.baseUrl}/api/states/${entityId}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    "Content-Type": "application/json"
                }
            }
        );
        if (!response.ok) {
            throw new Error(
                `Home Assistant returned ${response.status}: ${await response.text()}`
            )
        }
        return response.json();
    }

    async getStates(): Promise<any> {
        const response = await fetch(
            `${this.baseUrl}/api/states`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    "Content-Type": "application/json"
                }
            }
        );
        if (!response.ok) {
            throw new Error(
                `Home Assistant returned ${response.status}: ${await response.text()}`
            )
        }
        return response.json();
    }

    async setState(entityId: string, state: any): Promise<void> {
        const response = await fetch(
            `${this.baseUrl}/api/states/${entityId}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(state)
            }
        );

        if (!response.ok) {
            throw new Error(
                `Home Assistant returned ${response.status}: ${await response.text()}`
            )
        }
    }
}