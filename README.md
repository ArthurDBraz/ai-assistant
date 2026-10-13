# AI Assistant

## Description

AI Assistant is a Home Assistant weather assistant that combines natural-language requests with weather, date/time, and Home Assistant tools. It publishes structured responses to a configured Home Assistant entity.

## Goal

Provide a focused foundation for delivering current household temperature, daily forecast, and local date/time information through Home Assistant.

## Usage

### Prerequisites

- Node.js 20.6 or later
- npm
- A Gemini API key
- A Home Assistant instance, long-lived access token, and target entity

### Setup

```sh
npm install
cp .env.example .env
```

Add `GEMINI_API_KEY` and `HOME_ASSISTANT_TOKEN` to `.env`. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey), and create a long-lived access token in Home Assistant.

Update `config.json` for the environment:

- `gemini.model` selects the Gemini model.
- `homeassistant.baseUrl`, `homeassistant.tokenEnv`, and `homeassistant.entityId` configure Home Assistant. The configured `tokenEnv` value must name the environment variable containing the token.
- `weather.defaultLatitude` and `weather.defaultLongitude` select the location used for the daily forecast.
- `datetime.defaultTimeZone` selects the time zone used by the date/time tool.

Build and run the assistant with:

```sh
npm run build
npm start
```

By default, the assistant reads the request from `prompts/user/current.md` and the system prompt from `prompts/system/current.md`. Requests can also be supplied directly or from another file:

```sh
npm start -- --prompt "What is the weather?"
npm start -- --prompt-file path/to/prompt.md
```

Use `--verbose` to print prompt-loading details. Run tests with `npm test`.

## Current Tools

- `get_temperature`: retrieves the current temperature from the `living_room_temperature` or `bedroom_temperature` Home Assistant sensor.
- `get_current_datetime`: retrieves the current local date and time for the configured time zone.
- `get_forecast`: retrieves the current day's forecast for the configured Open-Meteo coordinates.

## Current Integrations

- **Home Assistant**: reads the supported temperature sensors and publishes the response to the configured entity through the state API. Published response text is limited to 255 characters.
- **Open-Meteo**: provides the daily forecast, including minimum and maximum temperature and a normalized condition.
- **Google Gemini**: the active model provider. The Gemini client supports streaming responses, tool calls, and structured JSON responses.
- **Ollama**: an Ollama client is included and configured under `ollama` in `config.json`, but the current entry point uses Gemini.

## Response Format

The assistant requires a JSON response containing `response`, `intent`, and `status`. `status` is one of `success`, `needs_input`, or `error`.

When available, `attributes` may include `city`, `temperatureC`, and `forecast`. The Home Assistant publisher writes `temperatureC` and `forecast` as entity attributes. Forecast values are `clear`, `partly_cloudy`, `fog`, `drizzle`, `rain`, `snow`, `rain_showers`, `snow_showers`, `thunderstorm`, or `unknown`.

## Planned Features

- Return sensor data from Home Assistant.
- Add retrieval-augmented generation (RAG) for context.
- Use data to infer when to start giving write access to Home Assistant.
