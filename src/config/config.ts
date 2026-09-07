// Typed configuration loaded from environment variables.
//
// Why this exists:
//   The rest of the codebase should never read `process.env` directly.
//   Everything funnels through this file so there is exactly one place that
//   knows which env vars exist, what they mean, and what their defaults are.
//   Swapping environments (dev laptop, Raspberry Pi, container) becomes a
//   matter of changing the `.env` file, not the code.
//
// Suggested shape (fill in yourself):
//
//   export interface Config {
//     ollama: { host: string; model: string };
//     weather: { defaultLatitude: number; defaultLongitude: number; defaultCity: string };
//   }
//
//   export function loadConfig(): Config { ... }
//
// TODO: read `process.env.OLLAMA_HOST`, `OLLAMA_MODEL`,
//       `DEFAULT_LATITUDE`, `DEFAULT_LONGITUDE`, `DEFAULT_CITY`,
//       apply sensible defaults, and export a `Config` object.

export interface Config {
    ollama: { host: string; model: string };
    weather: { defaultLatitude: number; defaultLongitude: number; defaultCity: string };
};

export function loadConfig(): Config {
    const latitude = Number(process.env.DEFAULT_LATITUDE);
    const longitude = Number(process.env.DEFAULT_LONGITUDE);

    return {
        ollama: {
            host: process.env.OLLAMA_HOST ?? "http://localhost:11434",
            model: process.env.OLLAMA_MODEL ?? "llama3.2:3b",
        },
        weather: {
            defaultLatitude: Number.isFinite(latitude) ? latitude : -30.03,
            defaultLongitude: Number.isFinite(longitude) ? longitude : -51.23,
            defaultCity: process.env.DEFAULT_CITY ?? "Porto Alegre",
        },
    };
}