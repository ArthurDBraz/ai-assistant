import type { ToolSchema } from "../../llm/llm-client.js";
import type { HomeAssistantService } from "./home-assistant-service.js";
import type { Tool } from "../tool.js"

export class GetTemperatureTool implements Tool {

  readonly schema: ToolSchema = {
    name: "get_temperature",
    description: "Get the current temperature for a room in the house. The temperature is returned in Celsius.",
    parameters: {
      type: "object",
      required: ["sensor"],
      properties: { sensor: { type: "string", description: "The name of the temperature sensor" } },
      enum: ["living_room_temperature", "bedroom_temperature"], // TODO: This should be dynamic based on the sensors available in Home Assistant, but for now we can hardcode a few common sensors.
    },
  }
  constructor (private readonly homeassistant: HomeAssistantService) {}

  async execute(args: { sensor: string }): Promise<unknown> {
    try {
      const response = await this.homeassistant.getState(`sensor.${args.sensor}`);
      if (!response || !response.state) {
        return { error: `Could not get temperature for sensor ${args.sensor}` };
      }
      return response;
    } catch (error) {
      return { error: `Error occurred while fetching temperature for sensor ${args.sensor}` };
    }
  }
}