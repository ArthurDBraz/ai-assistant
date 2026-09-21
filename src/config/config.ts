import { readFileSync } from "node:fs";

export type PublisherConfig =
    | { type: "console" }
    | {
          type: "home-assistant";
          baseUrl: string;
          token: string;
          entityId: string;
      };

export interface Config {
    ollama: { host: string; model: string };
    weather: {
        defaultLatitude: number;
        defaultLongitude: number;
        defaultCity: string;
    };
    datetime: { defaultTimeZone: string };
    publishers: PublisherConfig[];
}

interface FileConfig {
    ollama: { host: string; model: string };
    weather: {
        defaultLatitude: number;
        defaultLongitude: number;
        defaultCity: string;
    };
    datetime: { defaultTimeZone: string };
    publishers: FilePublisherConfig[];
}

type FilePublisherConfig =
    | { type: "console" }
    | {
          type: "home-assistant";
          baseUrl: string;
          tokenEnv: string;
          entityId: string;
      };

export function loadConfig(): Config {
    const path = new URL("../../config.json", import.meta.url);
    const fileConfig: unknown = JSON.parse(readFileSync(path, "utf8"));

    if (!isFileConfig(fileConfig)) {
        throw new Error("config.json has an invalid format");
    }

    return {
        ...fileConfig,
        publishers: fileConfig.publishers.map((publisher) => {
            if (publisher.type === "console") {
                return publisher;
            }

            const token = process.env[publisher.tokenEnv];
            if (!token) {
                throw new Error(`missing environment variable: ${publisher.tokenEnv}`);
            }

            return {
                type: "home-assistant",
                baseUrl: publisher.baseUrl,
                token,
                entityId: publisher.entityId,
            };
        }),
    };
}

function isFileConfig(value: unknown): value is FileConfig {
    if (!isRecord(value)) {
        return false;
    }

    return (
        isRecord(value.ollama) &&
        isString(value.ollama.host) &&
        isString(value.ollama.model) &&
        isRecord(value.weather) &&
        isNumber(value.weather.defaultLatitude) &&
        isNumber(value.weather.defaultLongitude) &&
        isString(value.weather.defaultCity) &&
        isRecord(value.datetime) &&
        isString(value.datetime.defaultTimeZone) &&
        Array.isArray(value.publishers) &&
        value.publishers.every(isFilePublisherConfig)
    );
}

function isFilePublisherConfig(value: unknown): value is FilePublisherConfig {
    if (!isRecord(value) || !isString(value.type)) {
        return false;
    }

    if (value.type === "console") {
        return true;
    }

    return (
        value.type === "home-assistant" &&
        isString(value.baseUrl) &&
        isString(value.tokenEnv) &&
        isString(value.entityId)
    );
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
    return typeof value === "string";
}

function isNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}
