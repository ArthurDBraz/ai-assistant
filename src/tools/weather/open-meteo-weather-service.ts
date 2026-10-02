import type {
    WeatherCondition,
    WeatherForecastResponse,
    WeatherService,
    WeatherServiceResponse,
} from "./weather-service.js";
import type { OpenMeteoResponse } from "./open-meteo-response.js";

export class OpenMeteoWeatherService implements WeatherService {
    constructor(
        private readonly defaultLatitude: number,
        private readonly defaultLongitude: number,
        private readonly fetchFn: typeof fetch = fetch,
    ) {}

    getWeather(location: string): Promise<WeatherServiceResponse>;
    async getWeather(location: string): Promise<WeatherServiceResponse> {

        const latitude : number = this.defaultLatitude;
        const longitude : number = this.defaultLongitude;

        const openMeteoReponse = await this.fetchForecast(latitude, longitude, "current", "temperature_2m,wind_speed_10m");
        return this.mapOpenMeteoToApiReponse(openMeteoReponse);
    }

    async getForecast(_location: string): Promise<WeatherForecastResponse> {
        const openMeteoResponse = await this.fetchForecast(
            this.defaultLatitude,
            this.defaultLongitude,
            "daily",
            "weather_code,temperature_2m_min,temperature_2m_max",
        );

        const [date] = openMeteoResponse.daily.time;
        const [weatherCode] = openMeteoResponse.daily.weather_code;
        const [minimumTemperature] = openMeteoResponse.daily.temperature_2m_min;
        const [maximumTemperature] = openMeteoResponse.daily.temperature_2m_max;
        if (
            date === undefined ||
            weatherCode === undefined ||
            minimumTemperature === undefined ||
            maximumTemperature === undefined
        ) {
            throw new Error("Open-Meteo response did not include a daily forecast");
        }

        return {
            day: {
                date,
                condition: this.mapWeatherCode(weatherCode),
                minimumTemperature,
                maximumTemperature,
            },
            units: openMeteoResponse.daily_units.temperature_2m_max,
        };
    }

    private mapOpenMeteoToApiReponse(openMeteoReponse: OpenMeteoResponse): WeatherServiceResponse {
        return {
            temperature: openMeteoReponse.current.temperature_2m,
            units: openMeteoReponse.current_units.temperature_2m
        };
    }

    private async fetchForecast(
        latitude: number,
        longitude: number,
        field: "current" | "daily",
        values: string,
    ): Promise<OpenMeteoResponse> {
        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.searchParams.set("latitude", latitude.toString());
        url.searchParams.set("longitude", longitude.toString());
        url.searchParams.set(field, values);
        url.searchParams.set("timezone", "auto");
        if (field === "daily") {
            url.searchParams.set("forecast_days", "1");
        }

        const response = await this.fetchFn(url);
        if (!response.ok) {
            throw new Error(`Open-Meteo request failed: ${response.status}`);
        }

        return (await response.json()) as OpenMeteoResponse;
    }

    private mapWeatherCode(code: number | undefined): WeatherCondition {
        if (code === 0) return "clear";
        if (code === 1 || code === 2 || code === 3) return "partly_cloudy";
        if (code === 45 || code === 48) return "fog";
        if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57) return "drizzle";
        if (code === 61 || code === 63 || code === 65 || code === 66 || code === 67) return "rain";
        if (code === 71 || code === 73 || code === 75 || code === 77) return "snow";
        if (code === 80 || code === 81 || code === 82) return "rain_showers";
        if (code === 85 || code === 86) return "snow_showers";
        if (code === 95 || code === 96 || code === 99) return "thunderstorm";
        return "unknown";
    }
    
}
