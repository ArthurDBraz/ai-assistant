export interface WeatherService {
    getWeather(location: string): Promise<WeatherServiceResponse>;
}

export interface WeatherServiceResponse {
    temperature: number;
    units: string;
}