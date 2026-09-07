import type { WeatherService, WeatherServiceResponse } from "./weather-service.js";
import type { OpenMeteoResponse } from "./open-meteo-response.js";

export class OpenMeteoWeatherService implements WeatherService {
    getWeather(location: string): Promise<WeatherServiceResponse>;
    async getWeather(location: string): Promise<WeatherServiceResponse> {

        const latitude : number = -30.03;
        const longitude : number = -51.23;

        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.searchParams.set("latitude", latitude.toString());
        url.searchParams.set("longitude", longitude.toString());
        url.searchParams.set("current", "temperature_2m,wind_speed_10m");

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Open-Meteo request failed: ${response.status}`);
        }

        const openMeteoReponse = (await response.json()) as OpenMeteoResponse;
        return this.mapOpenMeteoToApiReponse(openMeteoReponse);
    }

    private mapOpenMeteoToApiReponse(openMeteoReponse: OpenMeteoResponse): WeatherServiceResponse {
        return {
            temperature: openMeteoReponse.current.temperature_2m,
            units: openMeteoReponse.current_units.temperature_2m
        };
    }
    
}