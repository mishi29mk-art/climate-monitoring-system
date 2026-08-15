#!/usr/bin/env python3
"""Fetch air quality data from Open-Meteo Air Quality API for all Pakistan districts."""
import requests, json, time, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(BASE, 'data')
DISTRICTS_FILE = os.path.join(DATA, 'pakistan_districts.json')
CACHE_FILE = os.path.join(DATA, 'aqi_cache.json')

def fetch_aqi(lat, lng):
    """Fetch 7-day hourly air quality from Open-Meteo."""
    url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    params = {
        "latitude": lat, "longitude": lng,
        "hourly": "european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,uv_index",
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
        print(f"[{i+1}/{total}] Fetching AQI {name} ({d['province']})...", end=' ', flush=True)
        try:
            data = fetch_aqi(d['lat'], d['lng'])
            hourly = data.get('hourly', {})

            # Compute stats
            aqi_vals = [v for v in hourly.get('european_aqi', []) if v is not None]
            pm25_vals = [v for v in hourly.get('pm2_5', []) if v is not None]
            pm10_vals = [v for v in hourly.get('pm10', []) if v is not None]
            o3_vals = [v for v in hourly.get('ozone', []) if v is not None]
            no2_vals = [v for v in hourly.get('nitrogen_dioxide', []) if v is not None]

            results[name] = {
                "province": d['province'],
                "lat": d['lat'], "lng": d['lng'],
                "hourly": hourly,
                "stats": {
                    "aqi_max": max(aqi_vals) if aqi_vals else 0,
                    "aqi_avg": sum(aqi_vals)/len(aqi_vals) if aqi_vals else 0,
                    "pm25_max": max(pm25_vals) if pm25_vals else 0,
                    "pm10_max": max(pm10_vals) if pm10_vals else 0,
                    "o3_max": max(o3_vals) if o3_vals else 0,
                    "no2_max": max(no2_vals) if no2_vals else 0,
                },
                "fetched_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }
            print("OK")
            time.sleep(0.25)
        except Exception as e:
            print(f"ERROR: {e}")

    with open(CACHE_FILE, 'w') as f:
        json.dump(results, f)

    print(f"\nDone. {len(results)}/{total} districts AQI cached.")

if __name__ == '__main__':
    main()
