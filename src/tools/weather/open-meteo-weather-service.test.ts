import assert from "node:assert/strict";
import test from "node:test";
import { OpenMeteoWeatherService } from "./open-meteo-weather-service.js";

test("retrieves a daily weather and temperature forecast", async () => {
    let requestedUrl: URL | undefined;
    const service = new OpenMeteoWeatherService(51.5, -0.1, async (input) => {
        requestedUrl = new URL(input.toString());
        return new Response(JSON.stringify({
            daily_units: { temperature_2m_max: "°C" },
            daily: {
                time: ["2026-10-01"],
                weather_code: [0],
                temperature_2m_min: [12.3],
                temperature_2m_max: [18.4],
            },
        }));
    });

    const forecast = await service.getForecast("London");

    assert.deepEqual(forecast, {
        day: {
            date: "2026-10-01",
            condition: "clear",
            minimumTemperature: 12.3,
            maximumTemperature: 18.4,
        },
        units: "°C",
    });
    assert.equal(requestedUrl?.origin, "https://api.open-meteo.com");
    assert.equal(requestedUrl?.pathname, "/v1/forecast");
    assert.equal(requestedUrl?.searchParams.get("latitude"), "51.5");
    assert.equal(requestedUrl?.searchParams.get("longitude"), "-0.1");
    assert.equal(requestedUrl?.searchParams.get("daily"), "weather_code,temperature_2m_min,temperature_2m_max");
    assert.equal(requestedUrl?.searchParams.get("timezone"), "auto");
    assert.equal(requestedUrl?.searchParams.get("forecast_days"), "1");
});
