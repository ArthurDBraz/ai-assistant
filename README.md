# AI Assistant

## Description

AI Assistant is a configurable conversational assistant that combines natural-language interaction with extensible tools and output channels.

## Goal

Provide a simple foundation for building a useful, adaptable assistant that can understand requests, perform actions, and deliver responses in the contexts where they are needed.

## Usage

### Prerequisites

- Node.js 20.6 or later
- npm
- A configured model provider

### Setup

```sh
npm install
cp .env.example .env
```

Update `config.json` and `.env` for the environment. Build and run the assistant with:

```sh
npm run build
npm start
```

By default, the assistant reads the request from `prompts/user/current.md`. Requests can also be supplied directly or from another file:

```sh
npm start -- --prompt "What is the weather?"
npm start -- --prompt-file path/to/prompt.md
```

Use `--verbose` to print prompt-loading details. Run tests with `npm test`.

## Current Tools

- `get_temperature`: retrieves the current temperature for a city.
- `get_current_datetime`: retrieves the current local date and time for the configured time zone.

## Current Integrations

- **Open-Meteo**: weather data source used by the temperature tool.
- **Home Assistant**: optional response publisher that writes the assistant's response to an `input_text` entity.
- **Console**: publishes responses to the terminal.

Home Assistant requires `HOME_ASSISTANT_TOKEN` in `.env` when enabled in `config.json`.

## Current Supported Model Providers

- **Ollama**: connects to an Ollama server using the host and model configured in `config.json`.

The default configuration uses `http://localhost:11434` and `llama3.2:3b`.
