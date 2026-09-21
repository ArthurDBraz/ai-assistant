import type { ToolSchema } from "../../llm/llm-client.js";
import type { Tool } from "../tool.js";

export class GetCurrentDateTimeTool implements Tool {
    readonly schema: ToolSchema = {
        name: "get_current_datetime",
        description: "Get the current local date and time",
        parameters: {
            type: "object",
            properties: {}
        }
    };

    constructor(
        private readonly timeZone: string,
        private readonly now: () => Date = () => new Date(),
    ) {}

    async execute(): Promise<Record<string, string>> {
        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone: this.timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            weekday: "long",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hourCycle: "h23",
        }).formatToParts(this.now());
        const value = (type: Intl.DateTimeFormatPartTypes) =>
            parts.find((part) => part.type === type)?.value ?? "";
        const date = `${value("year")}-${value("month")}-${value("day")}`;
        const time = `${value("hour")}:${value("minute")}:${value("second")}`;

        return {
            date,
            time,
            datetime: `${date}T${time}`,
            weekday: value("weekday"),
            timeZone: this.timeZone,
        };
    }
}
