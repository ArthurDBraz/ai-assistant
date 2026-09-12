import { OpenMeteoWeatherService } from "./tools/weather/open-meteo-weather-service.js";
import { loadConfig } from "./config/config.js";
import { OllamaLLMClient } from "./llm/ollama-llm-client.js";
import type { Message, ToolCall, ToolSchema } from "./llm/llm-client.js";
import type { Tool } from "./tools/tool.js";
import { GetCurrentDateTimeTool } from "./tools/datetime/get-current-datetime-tool.js";
import { GetTemperatureTool } from "./tools/weather/get-temperature-tool.js";

const config = loadConfig()

const weatherService = new OpenMeteoWeatherService(
  config.weather.defaultLatitude,
  config.weather.defaultLongitude,
);

const tools: Tool[] = [
  new GetTemperatureTool(weatherService),
  new GetCurrentDateTimeTool()
];

const toolSchemas = tools.map((tool) => tool.schema);

const userInput =
  process.argv.slice(2).join(" ") ||
  `## Context
  You are a personal assistant. You are going to give short answers that need to fit in a card in a dashboard.

  ## Request
  Tell me the temperature and the date in ${config.weather.defaultCity} today and suggest what type of clothing I should wear. Less verbose
  `;

const messages: Message[] = [
  {
    role: "user",
    content: userInput,
  },
];

while (true) {

  const llmClient = new OllamaLLMClient(config.ollama.host, config.ollama.model);

  const stream = llmClient.chat(messages, toolSchemas);

  let content = "";
  const toolCalls: ToolCall[] = [];

  for await (const chunk of stream) {
    content += chunk.content ?? "";

    if (chunk.toolCall) {
      toolCalls.push(chunk.toolCall);
    }
  }

  if (toolCalls.length === 0) {
    console.log(content);
    break;
  }

  messages.push({
    role: "assistant",
    content,
    toolCalls: toolCalls,
  });

  for (const call of toolCalls) {
    const result = await executeTool(call);

    messages.push({
      role: "tool",
      toolName: call.name,
      content: JSON.stringify(result),
    });
  }
}

async function executeTool(call: ToolCall) {
  const tool = tools.find(t => t.schema.name === call.name);

  if (tool === undefined) {
    throw Error(`Tool "${call.name}" not found`);
  }

  await tool?.execute(call.arguments);
}

