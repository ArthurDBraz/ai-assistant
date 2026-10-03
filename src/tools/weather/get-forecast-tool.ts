import type { ToolSchema } from "../../llm/llm-client.js";
import type { Tool } from "../tool.js"
import type { WeatherService } from "./weather-service.js";

export class GetForecastTool implements Tool {

    readonly schema: ToolSchema = {
      name: "get_forecast",
      description: "Get the weather forecast for the current day for a city",
      parameters: {
        type: "object",
        required: ["city"],
        properties: { city: { type: "string", description: "The name of the city" } },
      },
    }
    constructor (private readonly weatherService: WeatherService) {}

    async execute(args: { city?: string }): Promise<unknown> {
      return await this.weatherService.getForecast(args.city ?? "");
    }
}
