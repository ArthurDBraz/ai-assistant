import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { OpenMeteoWeatherService } from "./tools/weather/open-meteo-weather-service.js";
import { loadConfig } from "./config/config.js";
// import { OllamaLLMClient } from "./llm/ollama-llm-client.js";
import type { Tool } from "./tools/tool.js";
import { GetCurrentDateTimeTool } from "./tools/datetime/get-current-datetime-tool.js";
import { GetTemperatureTool } from "./tools/homeassistant/get-temperature-tool.js";
import { Assistant } from "./assistant/assistant.js";
import { FanoutPublisher } from "./publishers/fanout-publisher/fanout-publisher.js";
import { HomeAssistantPublisher } from "./publishers/home-assistant-publisher/home-assistant-publisher.js";
import type { Config } from "./config/config.js";
import type { OutputPublisher } from "./publishers/output-publisher.js";
import { GoogleLlmClient } from "./llm/google-llm-client.js";
import { GetForecastTool } from "./tools/weather/get-forecast-tool.js";
import { HomeAssistantService } from "./tools/homeassistant/home-assistant-service.js";

const options = parseCliOptions();
const userInput = resolvePrompt(options);
const systemPrompt = resolveSystemPrompt(options);

const config = loadConfig()

const weatherService = new OpenMeteoWeatherService(
  config.weather.defaultLatitude,
  config.weather.defaultLongitude,
);

const homeAssistantService = new HomeAssistantService(config.homeassistant.baseUrl, config.homeassistant.token ?? "");

const tools: Tool[] = [
  new GetTemperatureTool(homeAssistantService),
  new GetCurrentDateTimeTool(config.datetime.defaultTimeZone),
  new GetForecastTool(weatherService),
];

//const llmClient = new OllamaLLMClient(config.ollama.host, config.ollama.model);
const llmClient = new GoogleLlmClient(config.gemini.model);

const publishers = [createPublisher(config)];
const publisher = new FanoutPublisher(publishers);

const assistant = new Assistant(llmClient, tools, publisher)
await assistant.run(userInput, systemPrompt);

function parseCliOptions() {
  const { values } = parseArgs({
    options: {
      "prompt-file": {
        type: "string",
        short: "f",
      },
      prompt: {
        type: "string",
        short: "p",
      },
      verbose: {
        type: "boolean",
        short: "v",
        default: false,
      },
    },
  });

  return {
    prompt: values.prompt,
    promptFile: values["prompt-file"],
    verbose: values.verbose,
  };
}

function resolvePrompt(options: ReturnType<typeof parseCliOptions>): string {
  if (options.prompt && options.promptFile) {
    throw new Error("Use either --prompt or --prompt-file, not both");
  }

  if (options.prompt) {
    if (options.verbose) {
      console.error("Using the prompt provided on the command line");
    }
    return options.prompt;
  }

  const promptFile = options.promptFile ?? "prompts/user/current.md";
  if (options.verbose) {
    console.error(`Reading prompt from ${promptFile}`);
  }
  return readFileSync(promptFile, "utf8");
}

function resolveSystemPrompt(options: ReturnType<typeof parseCliOptions>): string {
  const systemPromptFile = "prompts/system/current.md";
  if (options.verbose) {
    console.error(`Reading system prompt from ${systemPromptFile}`);
  }
  return readFileSync(systemPromptFile, "utf8");
}

function createPublisher(config: Config): OutputPublisher {
  if (!config.homeassistant.token) {
      throw new Error("Home Assistant token is required");
  }

  if (!config.homeassistant.entityId) {
      throw new Error("Home Assistant entity ID is required");
  }

  return new HomeAssistantPublisher(
    config.homeassistant.baseUrl,
    config.homeassistant.token,
    config.homeassistant.entityId
  );
}
