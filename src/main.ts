import { OpenMeteoWeatherService } from "./tools/weather/open-meteo-weather-service.js";
import { loadConfig } from "./config/config.js";
import { OllamaLLMClient } from "./llm/ollama-llm-client.js";
import type { Tool } from "./tools/tool.js";
import { GetCurrentDateTimeTool } from "./tools/datetime/get-current-datetime-tool.js";
import { GetTemperatureTool } from "./tools/weather/get-temperature-tool.js";
import { Assistant } from "./assistant/assistant.js";
import { ConsolePublisher } from "./publishers/console-publisher/console-publisher.js";
import { FanoutPublisher } from "./publishers/fanout-publisher/fanout-publisher.js";
import { HomeAssistantPublisher } from "./publishers/home-assistant-publisher/home-assistant-publisher.js";

const config = loadConfig()

const weatherService = new OpenMeteoWeatherService(
  config.weather.defaultLatitude,
  config.weather.defaultLongitude,
);

const tools: Tool[] = [
  new GetTemperatureTool(weatherService),
  new GetCurrentDateTimeTool()
];

const userInput =
  process.argv.slice(2).join(" ") ||
  `## Context
  You are a personal assistant. You are going to give short answers that need to fit in a card in a dashboard.

  ## Request
  Tell me the temperature and the date in ${config.weather.defaultCity} today and suggest what type of clothing I should wear. Less verbose
  `;

const llmClient = new OllamaLLMClient(config.ollama.host, config.ollama.model);

const consolePublisher = new ConsolePublisher();
const homeAssistantPublisher = new HomeAssistantPublisher(config.publisher.host, config.publisher.token, "input_text.ai_assistant_response")
const publisher = new FanoutPublisher([
    consolePublisher,
    homeAssistantPublisher
  ]
)

const assistant = new Assistant(llmClient, tools, publisher)
await assistant.run(userInput);