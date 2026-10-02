export interface WeatherService {
    getWeather(location: string): Promise<WeatherServiceResponse>;
    getForecast(location: string): Promise<WeatherForecastResponse>;
}

export interface WeatherServiceResponse {
    temperature: number;
    units: string;
}

export interface WeatherForecastResponse {
    day: WeatherForecastDay;
    units: string;
}

export interface WeatherForecastDay {
    date: string;
    condition: WeatherCondition;
    minimumTemperature: number;
    maximumTemperature: number;
}

export type WeatherCondition =
    | "clear"
    | "partly_cloudy"
    | "fog"
    | "drizzle"
    | "rain"
    | "snow"
    | "rain_showers"
    | "snow_showers"
    | "thunderstorm"
    | "unknown";
