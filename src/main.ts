import { Ollama, type Message, type Tool, type ToolCall } from "ollama";
import { OpenMeteoWeatherService } from "./tools/weather/open-meteo-weather-service.js";
import { loadConfig } from "./config/config.js";
import { OllamaLLMClient } from "./llm/ollama-llm-client.js";
import type { ToolSchema } from "./llm/llm-client.js";

const config = loadConfig()

const ollama = new Ollama({
  host: config.ollama.host,
});

const weatherService = new OpenMeteoWeatherService(
  config.weather.defaultLatitude,
  config.weather.defaultLongitude,
);

const tools: ToolSchema[] = [
  {
      name: "get_temperature",
      description: "Get the current temperature for a city",
      parameters: {
        type: "object",
        required: ["city"],
        properties: {
          city: { type: "string", description: "The name of the city" },
        },
      },
  },
  {
      name: "get_current_datetime",
      description: "Get the current date and time",
      parameters: {
        type: "object",
        properties: {}
      }
  },
];

async function getCurrentDateTime() : Promise<Date> {
  return new Date();
}

const toolMap: Record<string, Function> = {
  get_temperature: weatherService.getWeather.bind(weatherService),
  get_current_datetime: getCurrentDateTime
}



async function executeTool(call: ToolCall): Promise<any> {

  const method = toolMap[call.function.name]

  if (!method) {
    throw new Error(`Unknown tool: ${call.function.name}`);
  }

  const args = call.function.arguments as { city?: string };
  return method(args.city ?? config.weather.defaultCity);
}

const userInput =
  process.argv.slice(2).join(" ") ||
  `Tell me the temperature and the date in ${config.weather.defaultCity} today and suggest what type of clothing I should wear. Less verbose`;

const messages: Message[] = [
  {
    role: "user",
    content: userInput,
  },
];

while (true) {

  const llmClient = new OllamaLLMClient(config.ollama.host, config.ollama.model);

  const stream = llmClient.chat([], tools);

  let content = "";
  const toolCalls: ToolCall[] = [];

  for await (const chunk of stream) {
    content += chunk.content ?? "";
  }

  if (toolCalls.length === 0) {
    console.log(content);
    break;
  }

  messages.push({
    role: "assistant",
    content,
    tool_calls: toolCalls,
  });

  for (const call of toolCalls) {
    const result = await executeTool(call);

    messages.push({
      role: "tool",
      tool_name: call.function.name,
      content: JSON.stringify(result),
    });
  }
}
