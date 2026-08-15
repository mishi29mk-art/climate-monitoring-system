#!/usr/bin/env python3
"""Fetch greenhouse gas emissions data from Open-Meteo Air Quality API"""
import json, os, sys
from urllib.request import urlopen
from urllib.error import URLError

DISTRICTS_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'pakistan_districts.json')
CACHE_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'ghg_cache.json')

def fetch_ghg():
    with open(DISTRICTS_FILE) as f:
        districts = json.load(f)
    
    # Build lat/lng lists from list format
    names = [d['name'] for d in districts[:20]]  # Top 20 for GHG monitoring
    lats = ','.join(str(d['lat']) for d in districts[:20])
    lngs = ','.join(str(d['lng']) for d in districts[:20])
    
    url = f'https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lats}&longitude={lngs}&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=Asia/Karachi'
    
    try:
        with urlopen(url, timeout=30) as resp:
            data = json.loads(resp.read())
        
        results = {}
        for i, name in enumerate(names):
            item = data[i] if isinstance(data, list) else data
            c = item.get('current', {})
            d = districts[i]  # list index
            results[name] = {
                'district': name,
                'province': d.get('province', ''),
                'lat': d['lat'],
                'lng': d['lng'],
                'co': c.get('carbon_monoxide', 0),        # µg/m³
                'no2': c.get('nitrogen_dioxide', 0),      # µg/m³
                'so2': c.get('sulphur_dioxide', 0),       # µg/m³
                'o3': c.get('ozone', 0),                   # µg/m³
                'pm25': c.get('pm2_5', 0),
                'pm10': c.get('pm10', 0),
                'aqi': c.get('us_aqi', 0),
                'time': c.get('time', ''),
            }
        
        cache = {'districts': results, 'count': len(results), 'last_fetch': __import__('time').strftime('%Y-%m-%d %H:%M:%S')}
        os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
        with open(CACHE_FILE, 'w') as f:
            json.dump(cache, f)
        
        print(f'GHG data fetched: {len(results)} districts')
    except Exception as e:
        print(f'GHG fetch error: {e}')

if __name__ == '__main__':
    fetch_ghg()
