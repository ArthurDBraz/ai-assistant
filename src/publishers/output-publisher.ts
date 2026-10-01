export type AssistantResponseStatus = "success" | "needs_input" | "error";

export interface AssistantResponse {
    response: string;
    intent: string;
    status: AssistantResponseStatus;
    attributes?: Record<string, string | number | boolean>;
}

export interface OutputPublisher {
    publish(response: AssistantResponse): Promise<void>;
}
