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
    gemini: { model: string };
    homeassistant: { baseUrl: string; token?: string | undefined; entityId?: string | undefined };
    weather: {
        defaultLatitude: number;
        defaultLongitude: number;
        defaultCity: string;
    };
    datetime: { defaultTimeZone: string };
}

interface FileConfig {
    ollama: { host: string; model: string };
    homeassistant: {
        baseUrl: string;
        token?: string | undefined;
        tokenEnv?: string | undefined;
        entityId?: string | undefined;
    };
    gemini: { model: string };
    weather: {
        defaultLatitude: number;
        defaultLongitude: number;
        defaultCity: string;
    };
    datetime: { defaultTimeZone: string };
}

export function loadConfig(): Config {
    const path = new URL("../../config.json", import.meta.url);
    const fileConfig: unknown = JSON.parse(readFileSync(path, "utf8"));

    if (!isFileConfig(fileConfig)) {
        throw new Error("config.json has an invalid format");
    }

    const homeAssistantToken = resolveHomeAssistantToken(fileConfig.homeassistant);

    return {
        ollama: fileConfig.ollama,
        gemini: fileConfig.gemini,
        weather: fileConfig.weather,
        datetime: fileConfig.datetime,
        homeassistant: {
            baseUrl: fileConfig.homeassistant.baseUrl,
            token: homeAssistantToken,
            entityId: fileConfig.homeassistant.entityId,
        },
    };
}

function resolveHomeAssistantToken(homeassistant: FileConfig["homeassistant"]): string | undefined {
    if (homeassistant.tokenEnv) {
        return process.env[homeassistant.tokenEnv];
    }
    
    if (homeassistant.token) {
        return homeassistant.token;
    }

    return undefined;
}

function isFileConfig(value: unknown): value is FileConfig {
    if (!isRecord(value)) {
        return false;
    }

    return (
        isRecord(value.ollama) &&
        isString(value.ollama.host) &&
        isString(value.ollama.model) &&
        isRecord(value.homeassistant) &&
        isString(value.homeassistant.baseUrl) &&
        (value.homeassistant.token === undefined || isString(value.homeassistant.token)) &&
        (value.homeassistant.tokenEnv === undefined || isString(value.homeassistant.tokenEnv)) &&
        (value.homeassistant.entityId === undefined || isString(value.homeassistant.entityId)) &&
        isRecord(value.gemini) &&
        isString(value.gemini.model) &&
        isRecord(value.weather) &&
        isNumber(value.weather.defaultLatitude) &&
        isNumber(value.weather.defaultLongitude) &&
        isString(value.weather.defaultCity) &&
        isRecord(value.datetime) &&
        isString(value.datetime.defaultTimeZone)
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
