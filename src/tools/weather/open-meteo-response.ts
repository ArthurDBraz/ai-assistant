export interface OpenMeteoResponse {
  latitude: number
  longitude: number
  generationtime_ms: number
  utc_offset_seconds: number
  timezone: string
  timezone_abbreviation: string
  elevation: number
  current_units: CurrentUnits
  current: Current
  daily_units: DailyUnits
  daily: Daily
}

export interface CurrentUnits {
  time: string
  interval: string
  temperature_2m: string
  wind_speed_10m: string
}

export interface Current {
  time: string
  interval: number
  temperature_2m: number
  wind_speed_10m: number
}

export interface DailyUnits {
  time: string
  weather_code: string
  temperature_2m_min: string
  temperature_2m_max: string
}

export interface Daily {
  time: string[]
  weather_code: number[]
  temperature_2m_min: number[]
  temperature_2m_max: number[]
}
