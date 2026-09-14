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
import type { PublisherConfig } from "./config/config.js";
import type { OutputPublisher } from "./publishers/output-publisher.js";

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

const publishers = config.publishers.map(createPublisher);
const publisher = new FanoutPublisher(publishers);

const assistant = new Assistant(llmClient, tools, publisher)
await assistant.run(userInput);

function createPublisher(config: PublisherConfig): OutputPublisher {
  switch (config.type) {
    case "console":
      return new ConsolePublisher();
    case "home-assistant":
      return new HomeAssistantPublisher(
        config.baseUrl,
        config.token,
        config.entityId,
      );
  }
}
