// The `get_temperature` tool \u2014 self-describing.
//
// Bundles together, for a single tool:
//   - Its schema (what the LLM sees to decide when to call it).
//   - Its `execute` function (what runs when the LLM calls it).
//
// This class depends on the `WeatherService` interface, NOT on
// `OpenMeteoWeatherService`. That means you can swap Open-Meteo for any
// other provider (a mock, another API, a local sensor) by changing which
// `WeatherService` is injected in `main.ts`.
//
// Suggested shape:
//
//   import type { Tool } from "../tool.js";
//   import type { WeatherService } from "./weather-service.js";
//
//   export class GetTemperatureTool implements Tool {
//     readonly schema = {
//       name: "get_temperature",
//       description: "Get the current temperature for a city",
//       parameters: {
//         type: "object",
//         required: ["city"],
//         properties: { city: { type: "string", description: "The name of the city" } },
//       },
//     };
//
//     constructor(private readonly weather: WeatherService, private readonly defaultCity: string) {}
//
//     async execute(args: { city?: string }) {
//       return this.weather.getWeather(args.city ?? this.defaultCity);
//     }
//   }
//
// TODO: implement using the schema block currently in `main.ts` and the
//       `weatherService.getWeather` call in `executeTool`.

import type { ToolSchema } from "../../llm/llm-client.js";
import type { Tool } from "../tool.js"
import type { WeatherService } from "./weather-service.js";

export class GetTemperatureTool implements Tool {

    readonly schema: ToolSchema = {
      name: "get_temperature",
      description: "Get the current temperature for a city",
      parameters: {
        type: "object",
        required: ["city"],
        properties: { city: { type: "string", description: "The name of the city" } },
      },
    }
    constructor (private readonly weatherService: WeatherService) {}

    async execute(args: { city?: string }): Promise<unknown> {
        return await this.weatherService.getWeather(args.city ?? "");
    }
}
