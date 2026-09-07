import { Ollama, type Message, type Tool, type ToolCall } from "ollama";
import { OpenMeteoWeatherService } from "./tools/weather/open-meteo-weather-service.js";

const ollama = new Ollama({
  host: "http://192.168.0.166:11434",
});

const weatherService = new OpenMeteoWeatherService();

const tools: Tool[] = [
  {
    type: "function",
    function: {
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
  },
  {
    type: "function",
    function: {
      name: "get_current_datetime",
      description: "Get the current date and time"
    },
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
  return method(args.city ?? "Porto Alegre");
}

const userInput =
  process.argv.slice(2).join(" ") ||
  "Tell me the temperature and the date in Porto Alegre today and suggest what type of clothing I should wear. Less verbose";

const messages: Message[] = [
  {
    role: "user",
    content: userInput,
  },
];

while (true) {
  const stream = await ollama.chat({
    model: "llama3.2:3b",
    messages,
    tools,
    stream: true,
    think: false,
  });

  let content = "";
  const toolCalls: ToolCall[] = [];

  for await (const chunk of stream) {
    content += chunk.message.content ?? "";

    if (chunk.message.tool_calls) {
      toolCalls.push(...(chunk.message.tool_calls as ToolCall[]));
    }
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
