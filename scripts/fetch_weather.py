#!/usr/bin/env python3
"""Fetch comprehensive weather data from Open-Meteo for all Pakistan districts."""
import requests, json, time, os, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(BASE, 'data')
DISTRICTS_FILE = os.path.join(DATA, 'pakistan_districts.json')
CACHE_FILE = os.path.join(DATA, 'weather_cache.json')

def fetch_forecast(lat, lng):
    """Fetch 7-day hourly + daily forecast from Open-Meteo."""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat, "longitude": lng,
        "hourly": ",".join([
            "temperature_2m", "relative_humidity_2m", "apparent_temperature",
            "precipitation", "rain", "snowfall", "weather_code",
            "cloud_cover", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m",
            "surface_pressure", "soil_moisture_0_to_7cm", "soil_temperature_0_to_7cm",
            "cape", "et0_fao_evapotranspiration"
        ]),
        "daily": ",".join([
            "temperature_2m_max", "temperature_2m_min", "apparent_temperature_max", "apparent_temperature_min",
            "precipitation_sum", "rain_sum", "snowfall_sum",
            "precipitation_hours", "precipitation_probability_max",
            "wind_speed_10m_max", "wind_gusts_10m_max", "wind_direction_10m_dominant",
            "shortwave_radiation_sum", "uv_index_max", "et0_fao_evapotranspiration"
        ]),
        "timezone": "Asia/Karachi",
        "forecast_days": 7
    }
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()

def main():
    with open(DISTRICTS_FILE) as f:
        districts = json.load(f)

    results = {}
    total = len(districts)
    for i, d in enumerate(districts):
        name = d['name']
        print(f"[{i+1}/{total}] Fetching {name} ({d['province']})...", end=' ', flush=True)
        try:
            data = fetch_forecast(d['lat'], d['lng'])
            # Compute quick stats
            daily = data.get('daily', {})
            temps_max = daily.get('temperature_2m_max', [])
            rain_sum = daily.get('precipitation_sum', [])
            uv_max = daily.get('uv_index_max', [])
            wind_max = daily.get('wind_speed_10m_max', [])
            gusts_max = daily.get('wind_gusts_10m_max', [])

            results[name] = {
                "province": d['province'],
                "lat": d['lat'], "lng": d['lng'],
                "population": d.get('population', 0),
                "forecast": data,
                "stats": {
                    "temp_max_7d": max(temps_max) if temps_max else 0,
                    "temp_min_7d": min(daily.get('temperature_2m_min', [0])) if daily.get('temperature_2m_min') else 0,
                    "rain_total_7d": sum(rain_sum) if rain_sum else 0,
                    "rain_max_daily": max(rain_sum) if rain_sum else 0,
                    "uv_max_7d": max(uv_max) if uv_max else 0,
                    "wind_max_7d": max(wind_max) if wind_max else 0,
                    "gusts_max_7d": max(gusts_max) if gusts_max else 0,
                },
                "fetched_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }
            print("OK")
            time.sleep(0.25)
        except Exception as e:
            print(f"ERROR: {e}")

    with open(CACHE_FILE, 'w') as f:
        json.dump(results, f)

    # Update metadata
    meta = {"last_fetch": time.strftime("%Y-%m-%d %H:%M:%S"), "districts": len(results), "type": "weather"}
    with open(os.path.join(DATA, '_meta_weather.json'), 'w') as f:
        json.dump(meta, f)

    print(f"\nDone. {len(results)}/{total} districts cached.")

if __name__ == '__main__':
    main()
