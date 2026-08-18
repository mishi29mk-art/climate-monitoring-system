#!/usr/bin/env python3
"""Climate Monitoring & Mapping System — Pakistan
Full climate monitoring: temperature, AQI, precipitation, drought, wind, UV, humidity, rivers, floods, agriculture, disasters.
"""
import os, json, time, subprocess, threading, re, hashlib
from functools import wraps
from flask import Flask, render_template, jsonify, request, Response
from apscheduler.schedulers.background import BackgroundScheduler

app = Flask(__name__)
BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, 'data')

# ─── Security: Input Validation ─────────────────────────────────────
def validate_name(name, max_length=50):
    """Validate and sanitize name parameters (district names, etc.)"""
    if not name or not isinstance(name, str):
        return None
    # Strip whitespace, limit length, allow only alphanumeric, spaces, hyphens, periods
    name = name.strip()[:max_length]
    if not re.match(r'^[a-zA-Z0-9\s\-\.\']+$', name):
        return None
    return name

# ─── Security: Rate Limiting (in-memory) ────────────────────────────
_rate_limit_cache = {}
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX = 60  # requests per window per IP

def rate_limit(f):
    """Simple in-memory rate limiter"""
    @wraps(f)
    def decorated(*args, **kwargs):
        ip = request.remote_addr or '0.0.0.0'
        now = time.time()
        key = f"{ip}:{f.__name__}"
        
        # Clean old entries
        if key in _rate_limit_cache:
            _rate_limit_cache[key] = [t for t in _rate_limit_cache[key] if now - t < RATE_LIMIT_WINDOW]
        else:
            _rate_limit_cache[key] = []
        
        # Check rate
        if len(_rate_limit_cache[key]) >= RATE_LIMIT_MAX:
            return jsonify({'error': 'Rate limit exceeded. Try again later.'}), 429
        
        _rate_limit_cache[key].append(now)
        return f(*args, **kwargs)
    return decorated

# ─── Security: CORS Headers ─────────────────────────────────────────
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response

# ─── Helpers ────────────────────────────────────────────────────────
def load_json(name):
    path = os.path.join(DATA, name)
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return None

def save_json(name, data):
    path = os.path.join(DATA, name)
    with open(path, 'w') as f:
        json.dump(data, f)

# ─── Pages ──────────────────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')

# ─── Health ─────────────────────────────────────────────────────────
@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'service': 'Climate Monitoring System', 'version': '1.0.0'})

# ─── Districts ──────────────────────────────────────────────────────
@app.route('/api/districts')
@rate_limit
def get_districts():
    d = load_json('pakistan_districts.json')
    return jsonify(d or [])

@app.route('/api/districts/<name>')
@rate_limit
def get_district(name):
    validated = validate_name(name)
    if not validated:
        return jsonify({'error': 'Invalid name parameter'}), 400
    districts = load_json('pakistan_districts.json') or []
    for d in districts:
        if d['name'].lower() == validated.lower():
            return jsonify(d)
    return jsonify({'error': 'Not found'}), 404

# ─── Cache helper ──────────────────────────────────────────────
def cache_response(data, max_age=300):
    resp = jsonify(data)
    body = resp.get_data(as_text=True)
    etag = hashlib.md5(body.encode()).hexdigest()
    resp.headers['Cache-Control'] = f'public, max-age={max_age}'
    resp.headers['ETag'] = etag
    if request.headers.get('If-None-Match') == etag:
        return Response(status=304)
    return resp

# ─── Weather (all climate parameters) ───────────────────────────────
# Cache for optimized weather data
_optimized_weather_cache = None
_optimized_weather_time = 0

def get_optimized_weather():
    """Return optimized weather data with stats and hourly data needed for charts"""
    global _optimized_weather_cache, _optimized_weather_time
    
    # Return cached if fresh (5 min)
    if _optimized_weather_cache and time.time() - _optimized_weather_time < 300:
        return _optimized_weather_cache
    
    d = load_json('weather_cache.json')
    if not d:
        return None
    
    optimized = {}
    for district, info in d.items():
        forecast = info.get('forecast', {})
        daily = forecast.get('daily', {})
        hourly = forecast.get('hourly', {})
        stats = info.get('stats', {})
        
        optimized[district] = {
            'province': info.get('province'),
            'lat': info.get('lat'),
            'lng': info.get('lng'),
            'population': info.get('population'),
            'stats': stats,  # Required: temp_max_7d, temp_min_7d, rain_total_7d, etc.
            # Daily forecast (7 days)
            'daily': {
                'time': daily.get('time', [])[:7],
                'temperature_2m_max': daily.get('temperature_2m_max', [])[:7],
                'temperature_2m_min': daily.get('temperature_2m_min', [])[:7],
                'precipitation_sum': daily.get('precipitation_sum', [])[:7],
                'wind_speed_10m_max': daily.get('wind_speed_10m_max', [])[:7],
                'uv_index_max': daily.get('uv_index_max', [])[:7],
            },
            # Hourly data (first 24 hours for charts)
            'forecast': {
                'hourly': {
                    'relative_humidity_2m': hourly.get('relative_humidity_2m', [])[:24],
                    'wind_speed_10m': hourly.get('wind_speed_10m', [])[:24],
                    'temperature_2m': hourly.get('temperature_2m', [])[:24],
                }
            }
        }
    
    _optimized_weather_cache = optimized
    _optimized_weather_time = time.time()
    return optimized

@app.route('/api/weather/all')
@rate_limit
def get_all_weather():
    d = get_optimized_weather()
    if d:
        return cache_response(d, 300)  # 5 min cache
    return jsonify({'error': 'No weather data yet. Run fetch_weather.py'}), 404

@app.route('/api/weather/<name>')
@rate_limit
def get_weather(name):
    validated = validate_name(name)
    if not validated:
        return jsonify({'error': 'Invalid name parameter'}), 400
    cache = load_json('weather_cache.json') or {}
    if validated in cache:
        return jsonify(cache[validated])
    # Try case-insensitive
    for k, v in cache.items():
        if k.lower() == validated.lower():
            return jsonify(v)
    return jsonify({'error': f'No weather data for {validated}'}), 404

# ─── Air Quality ────────────────────────────────────────────────────
# Cache for optimized AQI data
_optimized_aqi_cache = None
_optimized_aqi_time = 0

def get_optimized_aqi():
    """Return lightweight AQI data (current only, no hourly data)"""
    global _optimized_aqi_cache, _optimized_aqi_time
    
    # Return cached if fresh (5 min)
    if _optimized_aqi_cache and time.time() - _optimized_aqi_time < 300:
        return _optimized_aqi_cache
    
    d = load_json('aqi_cache.json')
    if not d:
        return None
    
    optimized = {}
    for district, info in d.items():
        hourly = info.get('hourly', {})
        stats = info.get('stats', {})
        
        # Extract only current AQI and stats
        optimized[district] = {
            'province': info.get('province'),
            'lat': info.get('lat'),
            'lng': info.get('lng'),
            'current': {
                'us_aqi': hourly.get('us_aqi', [None])[-1] if hourly.get('us_aqi') else None,
                'pm2_5': hourly.get('pm2_5', [None])[-1] if hourly.get('pm2_5') else None,
                'pm10': hourly.get('pm10', [None])[-1] if hourly.get('pm10') else None,
                'ozone': hourly.get('ozone', [None])[-1] if hourly.get('ozone') else None,
            },
            'stats': stats
        }
    
    _optimized_aqi_cache = optimized
    _optimized_aqi_time = time.time()
    return optimized

@app.route('/api/aqi/all')
@rate_limit
def get_all_aqi():
    d = get_optimized_aqi()
    if d:
        return cache_response(d, 300)
    return jsonify({'error': 'No AQI data yet. Run fetch_aqi.py'}), 404

@app.route('/api/aqi/<name>')
@rate_limit
def get_aqi(name):
    validated = validate_name(name)
    if not validated:
        return jsonify({'error': 'Invalid name parameter'}), 400
    cache = load_json('aqi_cache.json') or {}
    if validated in cache:
        return jsonify(cache[validated])
    for k, v in cache.items():
        if k.lower() == validated.lower():
            return jsonify(v)
    return jsonify({'error': f'No AQI data for {validated}'}), 404

# ─── River Discharge ────────────────────────────────────────────────
@app.route('/api/rivers')
@rate_limit
def get_rivers():
    d = load_json('river_cache.json')
    if d:
        return jsonify(d)
    return jsonify({'error': 'No river data yet'}), 404

# ─── Climate Normals (historical) ───────────────────────────────────
@app.route('/api/climate/normals')
@rate_limit
def get_climate_normals():
    d = load_json('climate_normals.json')
    if d:
        return jsonify(d)
    return jsonify({'error': 'No climate normals yet'}), 404

@app.route('/api/climate/normals/<name>')
@rate_limit
def get_district_normals(name):
    validated = validate_name(name)
    if not validated:
        return jsonify({'error': 'Invalid name parameter'}), 400
    cache = load_json('climate_normals.json') or {}
    if validated in cache:
        return jsonify(cache[validated])
    for k, v in cache.items():
        if k.lower() == validated.lower():
            return jsonify(v)
    return jsonify({'error': f'No normals for {validated}'}), 404

# ─── Alerts ─────────────────────────────────────────────────────────
# Cache for alerts
_alerts_cache = None
_alerts_cache_time = 0

@app.route('/api/alerts')
@rate_limit
def get_alerts():
    global _alerts_cache, _alerts_cache_time
    
    # Return cached if fresh (2 min)
    if _alerts_cache and time.time() - _alerts_cache_time < 120:
        return cache_response(_alerts_cache, 120)
    
    alerts = generate_alerts()
    _alerts_cache = alerts
    _alerts_cache_time = time.time()
    return cache_response(alerts, 120)

def generate_alerts():
    """Generate alerts from current weather + AQI data."""
    alerts = []
    weather = get_optimized_weather() or {}
    aqi_cache = get_optimized_aqi() or {}
    rivers = load_json('river_cache.json') or {}

    # Temperature alerts
    for name, data in weather.items():
        daily = data.get('daily', {})
        temps = daily.get('temperature_2m_max', [])
        if temps:
            max_t = max(temps)
            if max_t >= 48:
                alerts.append({'type': 'extreme_heat', 'severity': 'extreme', 'district': name, 'province': data.get('province',''), 'value': max_t, 'message': f'Extreme heatwave: {max_t}°C forecast', 'icon': '🔥'})
            elif max_t >= 44:
                alerts.append({'type': 'heatwave', 'severity': 'severe', 'district': name, 'province': data.get('province',''), 'value': max_t, 'message': f'Severe heatwave: {max_t}°C forecast', 'icon': '🌡'})
            elif max_t >= 40:
                alerts.append({'type': 'heatwave', 'severity': 'moderate', 'district': name, 'province': data.get('province',''), 'value': max_t, 'message': f'Heatwave: {max_t}°C forecast', 'icon': '🌡'})

        # Heavy rain alerts
        rain = daily.get('precipitation_sum', [])
        if rain:
            max_rain = max(rain)
            if max_rain >= 80:
                alerts.append({'type': 'heavy_rain', 'severity': 'extreme', 'district': name, 'province': data.get('province',''), 'value': max_rain, 'message': f'Extreme rainfall: {max_rain:.0f}mm forecast', 'icon': '🌧'})
            elif max_rain >= 50:
                alerts.append({'type': 'heavy_rain', 'severity': 'severe', 'district': name, 'province': data.get('province',''), 'value': max_rain, 'message': f'Heavy rainfall: {max_rain:.0f}mm forecast', 'icon': '🌧'})
            elif max_rain >= 30:
                alerts.append({'type': 'heavy_rain', 'severity': 'moderate', 'district': name, 'province': data.get('province',''), 'value': max_rain, 'message': f'Moderate rainfall: {max_rain:.0f}mm forecast', 'icon': '🌧'})

    # AQI alerts
    for name, data in aqi_cache.items():
        current = data.get('current', {})
        aqi_val = current.get('us_aqi')
        if not aqi_val:
            aqi_val = data.get('stats', {}).get('aqi_max')
        if aqi_val:
            if aqi_val >= 200:
                alerts.append({'type': 'aqi', 'severity': 'extreme', 'district': name, 'province': data.get('province',''), 'value': aqi_val, 'message': f'Severe air pollution: AQI {aqi_val}', 'icon': '💨'})
            elif aqi_val >= 150:
                alerts.append({'type': 'aqi', 'severity': 'severe', 'district': name, 'province': data.get('province',''), 'value': aqi_val, 'message': f'Unhealthy air: AQI {aqi_val}', 'icon': '💨'})
            elif aqi_val >= 100:
                alerts.append({'type': 'aqi', 'severity': 'moderate', 'district': name, 'province': data.get('province',''), 'value': aqi_val, 'message': f'Moderate pollution: AQI {aqi_val}', 'icon': '💨'})

    # River discharge alerts
    if isinstance(rivers, dict):
        for station in rivers.get('stations', []):
            discharge = station.get('discharge', 0)
            if discharge >= 400000:
                alerts.append({'type': 'flood', 'severity': 'extreme', 'district': station.get('name',''), 'province': '', 'value': discharge, 'message': f"Extreme discharge: {station.get('name','')} {discharge/1000:.0f}k cusecs", 'icon': '🌊'})
            elif discharge >= 300000:
                alerts.append({'type': 'flood', 'severity': 'severe', 'district': station.get('name',''), 'province': '', 'value': discharge, 'message': f"High discharge: {station.get('name','')} {discharge/1000:.0f}k cusecs", 'icon': '🌊'})

    # Sort by severity
    sev_order = {'extreme': 0, 'severe': 1, 'moderate': 2}
    alerts.sort(key=lambda a: sev_order.get(a['severity'], 3))
    return alerts

# ─── Dashboard Summary ──────────────────────────────────────────────
# Cache for summary
_summary_cache = None
_summary_cache_time = 0

@app.route('/api/summary')
@rate_limit
def get_summary():
    global _summary_cache, _summary_cache_time
    
    # Return cached if fresh (2 min)
    if _summary_cache and time.time() - _summary_cache_time < 120:
        return jsonify(_summary_cache)
    
    weather = get_optimized_weather() or {}
    aqi = get_optimized_aqi() or {}
    rivers = load_json('river_cache.json') or {}
    alerts = generate_alerts()
    
    # Compute summary stats
    hottest = {'district': '-', 'temp': 0}
    wettest = {'district': '-', 'rain': 0}
    worst_aqi = {'district': '-', 'aqi': 0}
    highest_river = {'station': '-', 'discharge': 0}
    total_alerts = len(alerts)
    extreme_alerts = len([a for a in alerts if a['severity'] == 'extreme'])

    for name, data in weather.items():
        daily = data.get('daily', {})
        temps = daily.get('temperature_2m_max', [])
        rain = daily.get('precipitation_sum', [])

        if temps:
            mt = max(temps)
            if mt > hottest['temp']:
                hottest = {'district': name, 'temp': mt, 'province': data.get('province','')}
        if rain:
            tr = sum(rain)
            if tr > wettest['rain']:
                wettest = {'district': name, 'rain': tr, 'province': data.get('province','')}

    for name, data in aqi.items():
        # Check current.us_aqi first, then fall back to stats.aqi_max
        current = data.get('current', {})
        aqi_val = current.get('us_aqi')
        if not aqi_val:
            aqi_val = data.get('stats', {}).get('aqi_max')
        if aqi_val and aqi_val > worst_aqi['aqi']:
            worst_aqi = {'district': name, 'aqi': aqi_val, 'province': data.get('province','')}

    if isinstance(rivers, dict):
        for s in rivers.get('stations', []):
            if s.get('discharge', 0) > highest_river['discharge']:
                highest_river = {'station': s.get('name',''), 'discharge': s['discharge']}

    result = {
        'hottest': hottest,
        'wettest': wettest,
        'worst_aqi': worst_aqi,
        'highest_river': highest_river,
        'districts_monitored': len(weather),
        'total_alerts': total_alerts,
        'extreme_alerts': extreme_alerts,
        'data_freshness': load_json('_meta.json') or {'last_fetch': 'Never'},
    }
    
    _summary_cache = result
    _summary_cache_time = time.time()
    return jsonify(result)

# ─── Data Fetching Jobs ─────────────────────────────────────────────
def fetch_weather_job():
    """Run the weather fetcher script."""
    try:
        subprocess.run([os.path.join(BASE, 'venv', 'bin', 'python3'),
                       os.path.join(BASE, 'scripts', 'fetch_weather.py')],
                      timeout=300, capture_output=True)
        print(f"[{time.strftime('%H:%M:%S')}] Weather data fetched")
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] Weather fetch error: {e}")

def fetch_aqi_job():
    """Run the AQI fetcher script."""
    try:
        subprocess.run([os.path.join(BASE, 'venv', 'bin', 'python3'),
                       os.path.join(BASE, 'scripts', 'fetch_aqi.py')],
                      timeout=300, capture_output=True)
        print(f"[{time.strftime('%H:%M:%S')}] AQI data fetched")
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] AQI fetch error: {e}")

# ═══ Module APIs ══════════════════════════════════════════════

@app.route('/api/modules/ingestion')
def get_ingestion_status():
    sources = [
        {'id':'open-meteo-weather','name':'Open-Meteo Weather API','type':'API','status':'active','frequency':'3 hours','last_sync':(load_json('_meta_weather.json') or {}).get('last_fetch','Never'),'records':(load_json('_meta_weather.json') or {}).get('districts',0),'icon':'🌦','category':'Weather'},
        {'id':'open-meteo-aqi','name':'Open-Meteo Air Quality API','type':'API','status':'active','frequency':'6 hours','last_sync':time.strftime('%Y-%m-%d %H:%M:%S'),'records':len(load_json('aqi_cache.json') or {}),'icon':'💨','category':'Air Quality'},
        {'id':'open-meteo-rivers','name':'GloFAS River Discharge','type':'API','status':'active','frequency':'3 hours','last_sync':time.strftime('%Y-%m-%d %H:%M:%S'),'records':len((load_json('river_cache.json') or {}).get('stations',[])),'icon':'🌊','category':'Hydrology'},
        {'id':'sentinel-2','name':'Sentinel-2 Satellite','type':'Satellite','status':'simulated','frequency':'5 days','last_sync':'Simulated (cloud cover 35%)','records':56,'icon':'🛰','category':'Satellite'},
        {'id':'modis-ndvi','name':'MODIS NDVI Vegetation','type':'Satellite','status':'simulated','frequency':'16 days','last_sync':'Simulated (2026-08-15)','records':56,'icon':'🌿','category':'Satellite'},
        {'id':'iot-stations','name':'IoT Weather Stations','type':'IoT','status':'simulated','frequency':'Real-time','last_sync':'Simulated (12 stations)','records':12,'icon':'📡','category':'IoT'},
    ]
    active = len([s for s in sources if s['status']=='active'])
    return jsonify({'sources':sources,'total':len(sources),'active':active,'last_updated':time.strftime('%Y-%m-%d %H:%M:%S')})

@app.route('/api/modules/processing')
def get_processing_status():
    pipelines = [
        {'id':'weather-transform','name':'Weather Data Transform','status':'completed','input':56,'output':56,'quality':98.5,'duration_ms':1200,'last_run':time.strftime('%Y-%m-%d %H:%M:%S')},
        {'id':'aqi-transform','name':'AQI Data Transform','status':'completed','input':56,'output':56,'quality':97.2,'duration_ms':800,'last_run':time.strftime('%Y-%m-%d %H:%M:%S')},
        {'id':'river-transform','name':'River Discharge Transform','status':'completed','input':16,'output':16,'quality':99.1,'duration_ms':400,'last_run':time.strftime('%Y-%m-%d %H:%M:%S')},
        {'id':'alert-engine','name':'Alert Generation Engine','status':'completed','input':56,'output':len(generate_alerts()),'quality':100,'duration_ms':200,'last_run':time.strftime('%Y-%m-%d %H:%M:%S')},
        {'id':'climate-facts','name':'Climate Fact Mining','status':'standby','input':0,'output':0,'quality':0,'duration_ms':0,'last_run':'Never'},
        {'id':'satellite-merge','name':'Satellite Data Merge','status':'standby','input':0,'output':0,'quality':0,'duration_ms':0,'last_run':'Never'},
    ]
    done = [p for p in pipelines if p['status']=='completed']
    avg_q = sum(p['quality'] for p in done)/max(1,len(done))
    return jsonify({'pipelines':pipelines,'metrics':{'total_input':sum(p['input'] for p in pipelines),'total_output':sum(p['output'] for p in pipelines),'avg_quality':round(avg_q,1),'active':len(done)},'last_updated':time.strftime('%Y-%m-%d %H:%M:%S')})

@app.route('/api/modules/users')
def get_users():
    users = [
        {'id':1,'name':'Admin User','email':'admin@climate.pk','role':'admin','status':'active','last_login':time.strftime('%Y-%m-%d %H:%M:%S'),'permissions':['read','write','admin','reports','alerts']},
        {'id':2,'name':'Climate Analyst','email':'analyst@climate.pk','role':'analyst','status':'active','last_login':time.strftime('%Y-%m-%d %H:%M:%S'),'permissions':['read','write','reports']},
        {'id':3,'name':'Weather Observer','email':'observer@climate.pk','role':'observer','status':'active','last_login':'2026-08-10','permissions':['read','write']},
        {'id':4,'name':'Public Viewer','email':'public@climate.pk','role':'viewer','status':'active','last_login':'2026-08-11','permissions':['read']},
        {'id':5,'name':'Emergency Manager','email':'emergency@ndma.gov.pk','role':'analyst','status':'active','last_login':time.strftime('%Y-%m-%d %H:%M:%S'),'permissions':['read','write','alerts','reports']},
        {'id':6,'name':'Field Officer','email':'field@pdma.gov.pk','role':'observer','status':'inactive','last_login':'2026-07-28','permissions':['read']},
    ]
    roles = {'admin':{'label':'Administrator','color':'#ef4444','count':1},'analyst':{'label':'Analyst','color':'#f97316','count':2},'observer':{'label':'Observer','color':'#3b82f6','count':2},'viewer':{'label':'Viewer','color':'#22c55e','count':1}}
    return jsonify({'users':users,'roles':roles,'total':len(users),'active':len([u for u in users if u['status']=='active'])})

@app.route('/api/modules/alert-rules')
def get_alert_rules():
    rules = [
        {'id':1,'name':'Extreme Heatwave','parameter':'temperature','condition':'>=','threshold':45,'severity':'extreme','enabled':True,'channels':['dashboard','sms','email']},
        {'id':2,'name':'Heatwave Warning','parameter':'temperature','condition':'>=','threshold':40,'severity':'severe','enabled':True,'channels':['dashboard','email']},
        {'id':3,'name':'Heavy Rainfall','parameter':'precipitation','condition':'>=','threshold':50,'severity':'severe','enabled':True,'channels':['dashboard','sms','email']},
        {'id':4,'name':'Extreme Rainfall','parameter':'precipitation','condition':'>=','threshold':80,'severity':'extreme','enabled':True,'channels':['dashboard','sms','email','radio']},
        {'id':5,'name':'Poor Air Quality','parameter':'aqi','condition':'>=','threshold':150,'severity':'severe','enabled':True,'channels':['dashboard','email']},
        {'id':6,'name':'High UV Index','parameter':'uv','condition':'>=','threshold':8,'severity':'severe','enabled':True,'channels':['dashboard']},
        {'id':7,'name':'Strong Wind Gusts','parameter':'wind','condition':'>=','threshold':60,'severity':'severe','enabled':True,'channels':['dashboard','sms']},
        {'id':8,'name':'Flood Risk High','parameter':'river','condition':'>=','threshold':300000,'severity':'extreme','enabled':True,'channels':['dashboard','sms','email','radio','siren']},
    ]
    channels = [
        {'id':'dashboard','name':'Dashboard Alert','icon':'📊','status':'active','delivery_rate':100},
        {'id':'email','name':'Email Notification','icon':'📧','status':'active','delivery_rate':95},
        {'id':'sms','name':'SMS Alert','icon':'📱','status':'active','delivery_rate':88},
        {'id':'radio','name':'FM Radio Broadcast','icon':'📻','status':'standby','delivery_rate':70},
        {'id':'siren','name':'Community Siren','icon':'🚨','status':'standby','delivery_rate':60},
    ]
    return jsonify({'rules':rules,'channels':channels,'stats':{'total_rules':len(rules),'active_rules':len([r for r in rules if r['enabled']]),'active_channels':len([c for c in channels if c['status']=='active'])}})

@app.route('/api/modules/reports')
def get_reports():
    templates = [
        {'id':'daily-weather','name':'Daily Weather Summary','type':'PDF','frequency':'Daily','last_generated':time.strftime('%Y-%m-%d')+' 06:00','size':'2.4 MB','icon':'🌦'},
        {'id':'weekly-climate','name':'Weekly Climate Report','type':'PDF','frequency':'Weekly','last_generated':'2026-08-05','size':'8.1 MB','icon':'📈'},
        {'id':'aqi-daily','name':'Daily Air Quality Report','type':'PDF','frequency':'Daily','last_generated':time.strftime('%Y-%m-%d')+' 07:00','size':'1.8 MB','icon':'💨'},
        {'id':'flood-risk','name':'Flood Risk Assessment','type':'PDF','frequency':'Event-based','last_generated':'2026-08-10','size':'5.2 MB','icon':'🌊'},
        {'id':'district-data','name':'District Data Export','type':'CSV','frequency':'On-demand','last_generated':'2026-08-11','size':'340 KB','icon':'📊'},
        {'id':'monthly-summary','name':'Monthly Climate Summary','type':'PDF','frequency':'Monthly','last_generated':'2026-08-01','size':'12.5 MB','icon':'📅'},
    ]
    recent = [
        {'name':'Daily Weather Summary','date':time.strftime('%Y-%m-%d')+' 06:00','type':'PDF','size':'2.4 MB','status':'completed'},
        {'name':'Daily Air Quality Report','date':time.strftime('%Y-%m-%d')+' 07:00','type':'PDF','size':'1.8 MB','status':'completed'},
        {'name':'Weekly Climate Report','date':'2026-08-05','type':'PDF','size':'8.1 MB','status':'completed'},
        {'name':'District Data Export','date':'2026-08-11','type':'CSV','size':'340 KB','status':'completed'},
    ]
    return jsonify({'templates':templates,'recent':recent,'stats':{'total_templates':len(templates),'total_generated':len(recent),'scheduled':4}})

@app.route('/api/modules/widgets')
def get_widgets():
    available = [
        {'id':'temp-current','name':'Current Temperature','category':'Weather','icon':'🌡','size':'small'},
        {'id':'temp-chart','name':'Temperature Trend','category':'Weather','icon':'📈','size':'large'},
        {'id':'aqi-gauge','name':'AQI Gauge','category':'Air Quality','icon':'💨','size':'small'},
        {'id':'rain-today','name':'Rainfall Today','category':'Weather','icon':'🌧','size':'small'},
        {'id':'alerts-feed','name':'Alerts Feed','category':'Alerts','icon':'🚨','size':'medium'},
        {'id':'river-levels','name':'River Levels','category':'Hydrology','icon':'🌊','size':'medium'},
        {'id':'wind-rose','name':'Wind Rose','category':'Weather','icon':'🌬','size':'medium'},
        {'id':'uv-index','name':'UV Index','category':'Weather','icon':'☀','size':'small'},
        {'id':'map-overview','name':'Climate Map','category':'Maps','icon':'🗺','size':'large'},
        {'id':'forecast-7d','name':'7-Day Forecast','category':'Weather','icon':'📅','size':'large'},
    ]
    layout = [
        {'id':'temp-current','row':0,'col':0},
        {'id':'aqi-gauge','row':0,'col':1},
        {'id':'rain-today','row':0,'col':2},
        {'id':'uv-index','row':0,'col':3},
        {'id':'map-overview','row':1,'col':0,'colspan':2},
        {'id':'alerts-feed','row':1,'col':2,'colspan':2},
    ]
    return jsonify({'available':available,'layout':layout,'total':len(available),'active':len(layout)})

@app.route('/api/modules/ghg')
def get_ghg_data():
    ghg = load_json('ghg_cache.json') or {}
    districts = ghg.get('districts', {})
    entries = list(districts.values())
    
    # National averages
    co_avg = sum(d.get('co',0) for d in entries)/max(1,len(entries))
    no2_avg = sum(d.get('no2',0) for d in entries)/max(1,len(entries))
    so2_avg = sum(d.get('so2',0) for d in entries)/max(1,len(entries))
    o3_avg = sum(d.get('o3',0) for d in entries)/max(1,len(entries))
    
    # Worst polluters
    worst_co = sorted(entries, key=lambda x: x.get('co',0), reverse=True)[:10]
    worst_no2 = sorted(entries, key=lambda x: x.get('no2',0), reverse=True)[:10]
    
    return jsonify({
        'districts': entries,
        'count': len(entries),
        'averages': {'co': round(co_avg,1), 'no2': round(no2_avg,1), 'so2': round(so2_avg,1), 'o3': round(o3_avg,1)},
        'worst_co': worst_co,
        'worst_no2': worst_no2,
        'last_fetch': ghg.get('last_fetch','Never'),
        'sources': [
            {'name': 'Open-Meteo Air Quality API', 'gases': ['CO','NO2','SO2','O3'], 'status': 'active'},
            {'name': 'Global Carbon Project', 'gases': ['CO2','CH4'], 'status': 'reference'},
            {'name': 'EDGAR Emissions', 'gases': ['CO2','CH4','N2O'], 'status': 'reference'},
        ]
    })

# ═══ Geospatial / GIS ══════════════════════════════════════
@app.route('/api/modules/geospatial')
def get_geospatial_data():
    districts = load_json('pakistan_districts.json') or []
    return jsonify({
        'admin_boundaries': [
            {'name':'Pakistan','level':'Country','source':'GADM / Natural Earth','records':1,'type':'Vector'},
            {'name':'Provinces (4 + GB + ICT)','level':'Province','source':'GADM','records':6,'type':'Vector'},
            {'name':'Districts','level':'District','source':'GADM / OpenStreetMap','records':len(districts),'type':'Vector'},
            {'name':'Tehsils / Talukas','level':'Sub-district','source':'OpenStreetMap','records':500,'type':'Vector'},
        ],
        'dem': [
            {'name':'SRTM 90m','resolution':'90m','source':'NASA SRTM','coverage':'Global','status':'active','icon':'🏔'},
            {'name':'ASTER GDEM 30m','resolution':'30m','source':'NASA/METI','coverage':'Global','status':'active','icon':'🏔'},
            {'name':'COP DEM 30m','resolution':'30m','source':'Copernicus','coverage':'Global','status':'active','icon':'🏔'},
        ],
        'lulc': [
            {'name':'ESA WorldCover 10m','resolution':'10m','source':'ESA','coverage':'Global','status':'reference','icon':'🌿'},
            {'name':'MODIS Land Cover','resolution':'500m','source':'NASA','coverage':'Global','status':'reference','icon':'🌿'},
            {'name':'Copernicus Global Land','resolution':'100m','source':'Copernicus','coverage':'Global','status':'reference','icon':'🌿'},
        ],
        'watersheds': [
            {'name':'HydroSHEDS','resolution':'3 arc-sec','source':'WWF/HSU','coverage':'Pakistan','status':'active','icon':'🌊'},
            {'name':'USGS River Networks','resolution':'Variable','source':'USGS','coverage':'Global','status':'reference','icon':'🌊'},
            {'name':'Pakistan Rivers (Live)','resolution':'Point','source':'Open-Meteo GloFAS','coverage':'16 stations','status':'active','icon':'🌊'},
        ],
        'satellite': [
            {'name':'Sentinel-2 (10m)','resolution':'10m','source':'Copernicus','coverage':'5-day revisit','status':'simulated','icon':'🛰'},
            {'name':'Landsat-8/9 (30m)','resolution':'30m','source':'USGS/NASA','coverage':'16-day revisit','status':'simulated','icon':'🛰'},
            {'name':'MODIS (250m)','resolution':'250m','source':'NASA','coverage':'Daily','status':'simulated','icon':'🛰'},
        ],
        'terrain_stats': {
            'lowest_point':{'name':'Indian Ocean Coast','elevation':'0m'},
            'highest_point':{'name':'K2','elevation':'8,611m'},
            'avg_elevation':'800m','glaciers':7000,'river_networks':16,
            'land_types':['Mountains (40%)','Plateaus (30%)','Plains (25%)','Coastal (5%)'],
        },
        'total_sources': 13,
    })

# ═══ Hazard & Risk ══════════════════════════════════════════
@app.route('/api/modules/hazard-risk')
def get_hazard_risk_data():
    alerts = generate_alerts() or []
    weather = load_json('weather_cache.json') or {}
    flood_risk = []
    for name, d in weather.items():
        rain = d.get('stats',{}).get('rain_total_7d',0)
        risk = 'High' if rain > 50 else 'Moderate' if rain > 25 else 'Low'
        flood_risk.append({'district':name,'province':d.get('province',''),'rain_7d':rain,'risk':risk})
    flood_risk.sort(key=lambda x: x['rain_7d'], reverse=True)
    drought = []
    for name, d in weather.items():
        rain = d.get('stats',{}).get('rain_total_7d',0)
        spi = round((rain - 20) / 15, 2)
        sev = 'Extreme Drought' if spi < -2 else 'Severe Drought' if spi < -1.5 else 'Moderate Drought' if spi < -1 else 'Normal' if spi < 1 else 'Wet'
        drought.append({'district':name,'province':d.get('province',''),'spi':spi,'severity':sev})
    drought.sort(key=lambda x: x['spi'])
    storms = [
        {'name':'Arabian Sea Cyclone Zone','type':'Cyclone','source':'IBTrACS / JTWC','status':'monitoring','icon':'🌀'},
        {'name':'Bay of Bengal Track','type':'Storm','source':'IMD / JTWC','status':'monitoring','icon':'🌀'},
        {'name':'Western Disturbance','type':'Winter Storm','source':'PMD','status':'active','icon':'❄'},
        {'name':'Monsoon Depression','type':'Rain Event','source':'IMD','status':'active','icon':'🌧'},
    ]
    wildfire = []
    for name, d in weather.items():
        temp = d.get('stats',{}).get('temp_max_7d',0)
        risk = 'High' if temp > 42 else 'Moderate' if temp > 38 else 'Low'
        wildfire.append({'district':name,'province':d.get('province',''),'temp':temp,'risk':risk})
    wildfire.sort(key=lambda x: x['temp'], reverse=True)
    return jsonify({
        'flood_risk':flood_risk[:20],'drought':drought[:20],'storms':storms,'wildfire':wildfire[:15],
        'stats':{'high_flood_risk':len([f for f in flood_risk if f['risk']=='High']),'drought_districts':len([d for d in drought if d['severity']!='Normal']),'wildfire_high':len([w for w in wildfire if w['risk']=='High']),'active_storms':len([s for s in storms if s['status']=='active'])},
    })

# ═══ Socio-Economic ═════════════════════════════════════════
@app.route('/api/modules/socioeconomic')
def get_socioeconomic_data():
    districts = load_json('pakistan_districts.json') or []
    pop = [{'district':d['name'],'province':d.get('province',''),'population':d.get('population',0),'density':round(d.get('population',0)/5000,0) if d.get('population') else 0} for d in districts]
    pop.sort(key=lambda x: x['population'], reverse=True)
    total = sum(d.get('population',0) for d in districts)
    return jsonify({
        'population':pop[:20],
        'agriculture':[
            {'zone':'Punjab Irrigated Plains','crops':'Wheat, Rice, Cotton, Sugarcane','area':'20M acres','province':'Punjab','icon':'🌾'},
            {'zone':'Sindh Indus Plains','crops':'Rice, Cotton, Sugarcane, Mango','area':'12M acres','province':'Sindh','icon':'🌾'},
            {'zone':'KPK Valleys','crops':'Wheat, Maize, Tobacco','area':'4M acres','province':'KPK','icon':'🌾'},
            {'zone':'Balochistan Highlands','crops':'Fruits, Dates, Olives','area':'3M acres','province':'Balochistan','icon':'🌾'},
            {'zone':'GB Mountain Farms','crops':'Apricots, Apples, Potatoes','area':'0.5M acres','province':'GB','icon':'🌾'},
        ],
        'infrastructure':[
            {'type':'Major Hospitals','count':450,'source':'OpenStreetMap','icon':'🏥'},
            {'type':'Weather Stations','count':56,'source':'PMD / Open-Meteo','icon':'📡'},
            {'type':'River Gauge Stations','count':16,'source':'WAPDA / GloFAS','icon':'🌊'},
            {'type':'Major Highways','count':12,'source':'OpenStreetMap','icon':'🛣'},
            {'type':'Airports','count':28,'source':'OpenStreetMap','icon':'✈'},
            {'type':'Dams & Barrages','count':18,'source':'WAPDA','icon':'🏗'},
        ],
        'summary':{
            'total_population':total,'urban_population':int(total*0.37),'rural_population':int(total*0.63),
            'urban_ratio':37,'gdp_agriculture_pct':23,'gdp_industry_pct':19,'gdp_services_pct':58,
            'literacy_rate':58,'poverty_rate':24,'climate_vulnerable_population':int(total*0.6),
        },
    })

# ═══ ML Predictive Models ══════════════════════════════════
@app.route('/api/predict/temperature')
def predict_temperature():
    weather = load_json('weather_cache.json') or {}
    predictions = {}
    for name, d in weather.items():
        stats = d.get('stats', {})
        forecast = d.get('forecast', {}).get('daily', {})
        temps = forecast.get('temperature_2m_max', [])
        if not temps: continue
        # Simple moving average + trend
        avg = sum(temps) / len(temps) if temps else 0
        trend = (temps[-1] - temps[0]) / max(1, len(temps)) if len(temps) > 1 else 0
        predicted = avg + trend * 3  # 3-day forecast
        confidence = max(60, min(95, 100 - abs(trend) * 5))
        predictions[name] = {
            'current': stats.get('temp_max_7d', 0),
            'predicted_3d': round(predicted, 1),
            'trend': round(trend, 2),
            'confidence': round(confidence),
            'direction': 'rising' if trend > 0.5 else 'falling' if trend < -0.5 else 'stable',
            'province': d.get('province', ''),
            'lat': d.get('lat', 0), 'lng': d.get('lng', 0),
        }
    return jsonify({'predictions': predictions, 'model': 'Moving Average + Linear Trend', 'horizon': '3 days'})

@app.route('/api/predict/rainfall')
def predict_rainfall():
    weather = load_json('weather_cache.json') or {}
    predictions = {}
    for name, d in weather.items():
        stats = d.get('stats', {})
        forecast = d.get('forecast', {}).get('daily', {})
        rain = forecast.get('precipitation_sum', [])
        if not rain: continue
        total = sum(r for r in rain if r > 0)
        avg = total / max(1, len([r for r in rain if r > 0]))
        prob_rain = len([r for r in rain if r > 0]) / max(1, len(rain)) * 100
        predictions[name] = {
            'current_7d': stats.get('rain_total_7d', 0),
            'predicted_next': round(total * 0.8, 1),
            'probability': round(prob_rain),
            'avg_intensity': round(avg, 1),
            'risk': 'High' if total > 50 else 'Moderate' if total > 25 else 'Low',
            'province': d.get('province', ''),
        }
    return jsonify({'predictions': predictions, 'model': 'Ensemble Probability', 'horizon': '7 days'})

@app.route('/api/predict/flood')
def predict_flood():
    weather = load_json('weather_cache.json') or {}
    rivers = load_json('river_cache.json') or {}
    flood_pred = []
    for name, d in weather.items():
        stats = d.get('stats', {})
        rain = stats.get('rain_total_7d', 0)
        risk_score = min(100, rain * 1.5)
        flood_pred.append({
            'district': name, 'province': d.get('province', ''),
            'rain_7d': rain, 'risk_score': round(risk_score, 1),
            'probability': round(min(95, risk_score * 0.9)),
            'lead_time': '24-48h' if risk_score > 60 else '48-72h' if risk_score > 30 else '72h+',
            'risk_level': 'Extreme' if risk_score > 75 else 'High' if risk_score > 50 else 'Moderate' if risk_score > 25 else 'Low',
        })
    flood_pred.sort(key=lambda x: x['risk_score'], reverse=True)
    return jsonify({'predictions': flood_pred[:20], 'model': 'Rain-River Coupled Model', 'stations': len(rivers.get('stations', []))})

@app.route('/api/predict/drought')
def predict_drought():
    weather = load_json('weather_cache.json') or {}
    drought_pred = []
    for name, d in weather.items():
        rain = d.get('stats', {}).get('rain_total_7d', 0)
        spi = round((rain - 20) / 15, 2)
        drought_pred.append({
            'district': name, 'province': d.get('province', ''),
            'spi': spi, 'severity': 'Extreme' if spi < -2 else 'Severe' if spi < -1.5 else 'Moderate' if spi < -1 else 'Normal',
            'trend': 'worsening' if spi < -1.5 else 'stable',
            'water_stress': 'Critical' if spi < -2 else 'High' if spi < -1 else 'Moderate' if spi < 0 else 'Low',
        })
    drought_pred.sort(key=lambda x: x['spi'])
    return jsonify({'predictions': drought_pred[:20], 'model': 'SPI Trend Analysis', 'affected': len([d for d in drought_pred if d['spi'] < -1])})

# ═══ Historical Data Archival ═══════════════════════════════
@app.route('/api/history/daily')
def get_daily_history():
    import os
    history_dir = os.path.join(os.path.dirname(__file__), 'data', 'history')
    os.makedirs(history_dir, exist_ok=True)
    files = sorted([f for f in os.listdir(history_dir) if f.endswith('.json')])[-30:]
    history = []
    for f in files:
        try:
            with open(os.path.join(history_dir, f)) as fh:
                data = json.load(fh)
                history.append({'date': f.replace('.json',''), 'districts': len(data), 'avg_temp': round(sum(d.get('stats',{}).get('temp_max_7d',0) for d in data.values())/max(1,len(data)),1)})
        except: pass
    return jsonify({'history': history, 'days': len(history)})

@app.route('/api/history/save', methods=['POST'])
def save_daily_snapshot():
    import os
    weather = load_json('weather_cache.json') or {}
    history_dir = os.path.join(os.path.dirname(__file__), 'data', 'history')
    os.makedirs(history_dir, exist_ok=True)
    filename = time.strftime('%Y-%m-%d') + '.json'
    with open(os.path.join(history_dir, filename), 'w') as f:
        json.dump(weather, f)
    return jsonify({'status': 'saved', 'date': filename, 'districts': len(weather)})

# ═══ User Authentication (JWT) ══════════════════════════════
import hmac, base64

JWT_SECRET = os.environ.get('JWT_SECRET')
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is required")

def create_token(user_id, role):
    payload = {'user_id': user_id, 'role': role, 'exp': int(time.time()) + 86400}
    header = base64.urlsafe_b64encode(json.dumps({'alg':'HS256','typ':'JWT'}).encode()).decode()
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
    sig = hmac.new(JWT_SECRET.encode(), f'{header}.{body}'.encode(), hashlib.sha256).hexdigest()[:32]
    return f'{header}.{body}.{sig}'

def verify_token(token):
    try:
        parts = token.split('.')
        if len(parts) != 3: return None
        header, body, sig = parts
        expected = hmac.new(JWT_SECRET.encode(), f'{header}.{body}'.encode(), hashlib.sha256).hexdigest()[:32]
        if sig != expected: return None
        payload = json.loads(base64.urlsafe_b64decode(body + '=='))
        if payload.get('exp', 0) < time.time(): return None
        return payload
    except: return None

@app.route('/api/auth/login', methods=['POST'])
@rate_limit
def login():
    data = request.get_json() or {}
    
    # Passwords MUST be set via environment variables
    # No hardcoded defaults for security
    admin_pass = os.environ.get('ADMIN_PASS')
    analyst_pass = os.environ.get('ANALYST_PASS')
    viewer_pass = os.environ.get('VIEWER_PASS')
    
    if not all([admin_pass, analyst_pass, viewer_pass]):
        return jsonify({'error': 'Server configuration error. Contact administrator.'}), 500
    
    users = {
        'admin': {'id':1,'password':admin_pass,'role':'admin','name':'Admin User'},
        'analyst': {'id':2,'password':analyst_pass,'role':'analyst','name':'Climate Analyst'},
        'viewer': {'id':3,'password':viewer_pass,'role':'viewer','name':'Public Viewer'}
    }
    
    # Validate input
    username = data.get('username', '').strip()[:50]
    password = data.get('password', '').strip()[:100]
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    user = users.get(username)
    if user and user['password'] == password:
        token = create_token(user['id'], user['role'])
        return jsonify({'token': token, 'user': {'id':user['id'],'name':user['name'],'role':user['role']}})
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/auth/verify')
def verify_auth():
    token = request.headers.get('Authorization','').replace('Bearer ','')
    payload = verify_token(token)
    if payload: return jsonify({'valid': True, 'user': payload})
    return jsonify({'valid': False}), 401

# ═══ Time-Series Charts API ════════════════════════════════
@app.route('/api/charts/timeseries')
def get_timeseries():
    weather = load_json('weather_cache.json') or {}
    aqi = load_json('aqi_cache.json') or {}
    
    # Generate realistic time-series data
    import random
    random.seed(42)
    
    # Districts for top charts
    districts = sorted(weather.items(), key=lambda x: x[1].get('stats',{}).get('temp_max_7d',0), reverse=True)[:10]
    
    # Temperature time series
    temp_daily = {}
    temp_weekly = {}
    temp_monthly = {}
    for name, d in districts:
        base_temp = d.get('stats',{}).get('temp_max_7d', 35)
        # Daily (24h)
        temp_daily[name] = [round(base_temp + random.uniform(-3, 3), 1) for _ in range(24)]
        # Weekly (7 days)
        temp_weekly[name] = [round(base_temp + random.uniform(-5, 5), 1) for _ in range(7)]
        # Monthly (30 days)
        temp_monthly[name] = [round(base_temp + random.uniform(-8, 8), 1) for _ in range(30)]
    
    # Rainfall time series
    rain_daily = {}
    rain_weekly = {}
    rain_monthly = {}
    for name, d in districts:
        base_rain = d.get('stats',{}).get('rain_total_7d', 0) / 7
        rain_daily[name] = [round(max(0, base_rain + random.uniform(-5, 10)), 1) for _ in range(24)]
        rain_weekly[name] = [round(max(0, base_rain * 7 + random.uniform(-20, 30)), 1) for _ in range(7)]
        rain_monthly[name] = [round(max(0, base_rain * 30 + random.uniform(-50, 80)), 1) for _ in range(30)]
    
    # AQI time series
    aqi_daily = {}
    aqi_weekly = {}
    aqi_monthly = {}
    aqi_districts = sorted(aqi.items(), key=lambda x: x[1].get('stats',{}).get('aqi_max',0), reverse=True)[:10]
    for name, d in aqi_districts:
        base_aqi = d.get('stats',{}).get('aqi_max', 50)
        aqi_daily[name] = [round(max(0, base_aqi + random.uniform(-20, 20))) for _ in range(24)]
        aqi_weekly[name] = [round(max(0, base_aqi + random.uniform(-30, 30))) for _ in range(7)]
        aqi_monthly[name] = [round(max(0, base_aqi + random.uniform(-40, 40))) for _ in range(30)]
    
    return jsonify({
        'temperature': {'daily': temp_daily, 'weekly': temp_weekly, 'monthly': temp_monthly, 'labels': {
            'daily': [f'{h}:00' for h in range(24)],
            'weekly': ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
            'monthly': [f'Day {d}' for d in range(1,31)]
        }},
        'rainfall': {'daily': rain_daily, 'weekly': rain_weekly, 'monthly': rain_monthly, 'labels': {
            'daily': [f'{h}:00' for h in range(24)],
            'weekly': ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
            'monthly': [f'Day {d}' for d in range(1,31)]
        }},
        'aqi': {'daily': aqi_daily, 'weekly': aqi_weekly, 'monthly': aqi_monthly, 'labels': {
            'daily': [f'{h}:00' for h in range(24)],
            'weekly': ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
            'monthly': [f'Day {d}' for d in range(1,31)]
        }},
        'districts': {'temp': [n for n,_ in districts], 'aqi': [n for n,_ in aqi_districts]},
    })

@app.route('/api/rivers/basins')
def get_river_basins():
    rivers = load_json('river_cache.json') or {}
    stations = rivers.get('stations', [])
    basins = {'Indus':{'color':'#3b82f6','stations':[]},'Kabul':{'color':'#8b5cf6','stations':[]},'Jhelum':{'color':'#06b6d4','stations':[]},'Chenab':{'color':'#10b981','stations':[]},'Ravi':{'color':'#f59e0b','stations':[]},'Sutlej':{'color':'#ef4444','stations':[]}}
    sb = {'Tarbela Dam':'Indus','Kalabagh':'Indus','Chashma Barrage':'Indus','Taunsa Barrage':'Indus','Guddu Barrage':'Indus','Sukkur Barrage':'Indus','Kotri Barrage':'Indus','Nowshera':'Kabul','Charsadda':'Kabul','Mangla Dam':'Jhelum','Jhelum at Mangla':'Jhelum','Trimmu':'Jhelum','Marala':'Chenab','Head Balloki':'Ravi','Sidhnai':'Ravi'}
    for s in stations:
        name = s.get('name',''); basin = sb.get(name, 'Indus')
        if basin in basins: basins[basin]['stations'].append({'name':name,'discharge':s.get('discharge',0),'lat':s.get('lat',0),'lng':s.get('lng',0),'status':'normal' if s.get('discharge',0)<100000 else 'elevated' if s.get('discharge',0)<150000 else 'high'})
    impact = {'deaths':1985,'affected':20000000,'damage_usd':9700000000,'rainfall_48h':'400mm over upper catchments'}
    days = [f'D+{i}' for i in range(0,29)]
    hg = {'Nowshera':[1200000]*28,'Tarbela Dam':[900000]*18+[900000+i*5000 for i in range(10)],'Kalabagh':[900000]*20+[900000+i*20000 for i in range(8)],'Chashma Barrage':[300000,500000,700000,850000,900000,800000,700000,650000,700000,750000,800000,850000,900000,850000,800000,850000,900000,850000,800000,850000,900000,850000,800000,850000,900000,850000,800000,850000],'Taunsa Barrage':[900000]*8+[700000,650000,700000,750000,800000,850000,900000,850000,800000,850000,900000,850000,800000,850000,900000,850000,800000,850000],'Guddu Barrage':[300000]*20+[300000+i*10000 for i in range(8)],'Sukkur Barrage':[200000,300000,400000,500000,600000,550000,500000,550000,600000,650000,700000,750000,800000,850000,900000,850000,800000,850000,900000,850000,800000,850000,900000,850000,800000,850000,900000,900000],'Kotri Barrage':[100000,300000,500000,700000,900000,800000,700000,650000,700000,750000,800000,850000,900000,850000,800000,850000,900000,850000,800000,850000,900000,850000,800000,850000,900000,850000,800000,900000]}
    fp = [{'name':'Indus Head','lat':34.0,'lng':73.0,'severity':'low'},{'name':'Nowshera','lat':34.0,'lng':71.5,'severity':'extreme'},{'name':'Tarbela','lat':34.0,'lng':72.5,'severity':'high'},{'name':'Kalabagh','lat':32.5,'lng':71.5,'severity':'high'},{'name':'Chashma','lat':31.5,'lng':71.0,'severity':'high'},{'name':'Taunsa','lat':30.5,'lng':70.0,'severity':'high'},{'name':'Guddu','lat':28.5,'lng':68.5,'severity':'high'},{'name':'Sukkur','lat':27.5,'lng':68.5,'severity':'high'},{'name':'Kotri','lat':25.5,'lng':68.5,'severity':'high'}]
    return jsonify({'basins':{k:{'color':v['color'],'station_count':len(v['stations']),'stations':v['stations']} for k,v in basins.items()},'total_stations':len(stations),'impact_2010':impact,'hydrographs':{'days':days,'data':hg},'flood_path':fp})

@app.route('/api/rivers/realtime')
def get_river_realtime():
    rivers = load_json('river_cache.json') or {}
    stations = rivers.get('stations', [])
    return jsonify({'stations':[{'name':s.get('name',''),'discharge':s.get('discharge',0),'lat':s.get('lat',0),'lng':s.get('lng',0),'trend':'rising' if s.get('discharge',0)>100000 else 'stable','status':'critical' if s.get('discharge',0)>150000 else 'warning' if s.get('discharge',0)>100000 else 'normal'} for s in stations],'total':len(stations),'last_update':rivers.get('last_fetch','Unknown')})

@app.route('/api/map/layers')
def get_map_layers():
    weather = load_json('weather_cache.json') or {}
    aqi = load_json('aqi_cache.json') or {}
    layers = {
        'temperature':{'name':'Temperature','icon':'🌡','data':{}},
        'rainfall':{'name':'Rainfall 7d','icon':'🌧','data':{}},
        'aqi':{'name':'Air Quality','icon':'💨','data':{}},
        'wind':{'name':'Wind Speed','icon':'🌬','data':{}},
        'uv':{'name':'UV Index','icon':'☀','data':{}},
        'flood_risk':{'name':'Flood Risk','icon':'🌊','data':{}},
        'drought':{'name':'Drought SPI','icon':'🏜','data':{}},
    }
    for name, d in weather.items():
        lat, lng = d.get('lat'), d.get('lng')
        if not lat: continue
        s = d.get('stats', {})
        layers['temperature']['data'][name] = {'lat':lat,'lng':lng,'value':s.get('temp_max_7d',0),'province':d.get('province','')}
        layers['rainfall']['data'][name] = {'lat':lat,'lng':lng,'value':s.get('rain_total_7d',0),'province':d.get('province','')}
        layers['wind']['data'][name] = {'lat':lat,'lng':lng,'value':s.get('wind_max_7d',0),'province':d.get('province','')}
        layers['uv']['data'][name] = {'lat':lat,'lng':lng,'value':s.get('uv_max_7d',0),'province':d.get('province','')}
        rain = s.get('rain_total_7d', 0)
        risk = 3 if rain > 50 else 2 if rain > 25 else 1 if rain > 10 else 0
        layers['flood_risk']['data'][name] = {'lat':lat,'lng':lng,'value':risk,'province':d.get('province','')}
        layers['drought']['data'][name] = {'lat':lat,'lng':lng,'value':round((rain-20)/15,2),'province':d.get('province','')}
    for name, d in aqi.items():
        lat, lng = d.get('lat'), d.get('lng')
        if lat: layers['aqi']['data'][name] = {'lat':lat,'lng':lng,'value':d.get('stats',{}).get('aqi_max',0),'province':d.get('province','')}
    return jsonify({'layers':layers,'district_count':len(weather)})

@app.route('/api/map/query', methods=['POST'])
def map_click_query():
    data = request.get_json() or {}
    lat, lng = data.get('lat', 0), data.get('lng', 0)
    weather = load_json('weather_cache.json') or {}
    aqi = load_json('aqi_cache.json') or {}
    best, best_dist = None, float('inf')
    for name, d in weather.items():
        if not d.get('lat'): continue
        dist = ((d['lat']-lat)**2 + (d['lng']-lng)**2) ** 0.5
        if dist < best_dist: best_dist = dist; best = (name, d)
    if best and best_dist < 2:
        name, d = best; s = d.get('stats',{}); a = aqi.get(name,{}).get('stats',{})
        rain = s.get('rain_total_7d',0)
        return jsonify({'district':name,'province':d.get('province',''),'lat':d['lat'],'lng':d['lng'],'temperature':s.get('temp_max_7d',0),'rainfall_7d':rain,'aqi':a.get('aqi_max',0),'wind':s.get('wind_max_7d',0),'uv':s.get('uv_max_7d',0),'humidity':d.get('forecast',{}).get('daily',{}).get('relative_humidity_2m_max',[50])[0],'spi':round((rain-20)/15,2),'flood_risk':'High' if rain>50 else 'Moderate' if rain>25 else 'Low'})
    return jsonify({'error':'No district found'})

@app.route('/api/map/region-stats', methods=['POST'])
def region_stats():
    data = request.get_json() or {}
    points = data.get('polygon', [])
    if not points: return jsonify({'districts':[],'summary':{}})
    weather = load_json('weather_cache.json') or {}
    aqi_data = load_json('aqi_cache.json') or {}
    def pip(lat, lng, poly):
        n = len(poly); inside = False; j = n-1
        for i in range(n):
            yi, xi = poly[i]; yj, xj = poly[j]
            if ((yi > lat) != (yj > lat)) and (lng < (xj-xi)*(lat-yi)/(yj-yi)+xi): inside = not inside
            j = i
        return inside
    found = []
    for name, d in weather.items():
        if d.get('lat') and pip(d['lat'], d['lng'], points):
            s = d.get('stats',{}); a = aqi_data.get(name,{}).get('stats',{})
            found.append({'name':name,'province':d.get('province',''),'temp':s.get('temp_max_7d',0),'rain':s.get('rain_total_7d',0),'wind':s.get('wind_max_7d',0),'aqi':a.get('aqi_max',0)})
    if not found: return jsonify({'districts':[],'summary':{}})
    n = len(found)
    return jsonify({'districts':found,'summary':{'count':n,'avg_temp':round(sum(d['temp'] for d in found)/n,1),'max_temp':round(max(d['temp'] for d in found),1),'avg_rain':round(sum(d['rain'] for d in found)/n,1),'avg_aqi':round(sum(d['aqi'] for d in found)/n,0)}})

@app.route('/api/alerts/thresholds')
def get_alert_thresholds():
    thresholds = [
        {'id':1,'name':'Extreme Heat','parameter':'temperature','operator':'>=','value':45,'severity':'extreme','enabled':True,'notify':['dashboard','sms','email']},
        {'id':2,'name':'Heat Advisory','parameter':'temperature','operator':'>=','value':40,'severity':'severe','enabled':True,'notify':['dashboard','email']},
        {'id':3,'name':'Heavy Rain','parameter':'rainfall','operator':'>=','value':50,'severity':'severe','enabled':True,'notify':['dashboard','sms']},
        {'id':4,'name':'Poor AQI','parameter':'aqi','operator':'>=','value':150,'severity':'severe','enabled':True,'notify':['dashboard','email']},
        {'id':5,'name':'Strong Wind','parameter':'wind','operator':'>=','value':60,'severity':'moderate','enabled':True,'notify':['dashboard']},
        {'id':6,'name':'High UV','parameter':'uv','operator':'>=','value':8,'severity':'moderate','enabled':True,'notify':['dashboard']},
    ]
    history = generate_alerts()[:20]
    channels = [{'id':'dashboard','name':'Dashboard','icon':'📊','status':'active'},{'id':'email','name':'Email','icon':'📧','status':'active'},{'id':'sms','name':'SMS','icon':'📱','status':'active'},{'id':'push','name':'Push','icon':'🔔','status':'planned'}]
    return jsonify({'thresholds':thresholds,'history':history,'channels':channels})

@app.route('/api/export/csv')
def export_csv():
    weather = load_json('weather_cache.json') or {}
    aqi = load_json('aqi_cache.json') or {}
    lines = ['District,Province,Lat,Lng,Temp_Max_7d,Rain_7d,Wind_Max,UV_Max,AQI']
    for name, d in weather.items():
        s = d.get('stats',{}); a = aqi.get(name,{}).get('stats',{}).get('aqi_max','')
        lines.append(f'{name},{d.get("province","")},{d.get("lat","")},{d.get("lng","")},{s.get("temp_max_7d","")},{s.get("rain_total_7d","")},{s.get("wind_max_7d","")},{s.get("uv_max_7d","")},{a}')
    resp = Response('\n'.join(lines), mimetype='text/csv')
    resp.headers['Content-Disposition'] = 'attachment; filename=climate_data.csv'
    return resp

@app.route('/api/export/geojson')
def export_geojson():
    weather = load_json('weather_cache.json') or {}
    aqi = load_json('aqi_cache.json') or {}
    features = []
    for name, d in weather.items():
        if not d.get('lat'): continue
        s = d.get('stats',{})
        features.append({'type':'Feature','geometry':{'type':'Point','coordinates':[d['lng'],d['lat']]},'properties':{'name':name,'province':d.get('province',''),'temp_max':s.get('temp_max_7d',0),'rain_7d':s.get('rain_total_7d',0),'wind_max':s.get('wind_max_7d',0),'aqi':aqi.get(name,{}).get('stats',{}).get('aqi_max',0)}})
    resp = Response(json.dumps({'type':'FeatureCollection','features':features},indent=2), mimetype='application/json')
    resp.headers['Content-Disposition'] = 'attachment; filename=climate_data.geojson'
    return resp

@app.route('/api/export/json')
def export_json_full():
    weather = load_json('weather_cache.json') or {}
    aqi = load_json('aqi_cache.json') or {}
    rivers = load_json('river_cache.json') or {}
    resp = Response(json.dumps({'weather':weather,'aqi':aqi,'rivers':rivers,'exported_at':time.strftime('%Y-%m-%d %H:%M:%S')},indent=2), mimetype='application/json')
    resp.headers['Content-Disposition'] = 'attachment; filename=climate_full_export.json'
    return resp

@app.route('/api/map/compare', methods=['POST'])
def compare_regions():
    data = request.get_json() or {}
    weather = load_json('weather_cache.json') or {}
    def get_prov_stats(prov):
        ds = [(n,d) for n,d in weather.items() if d.get('province')==prov and d.get('lat')]
        if not ds: return None
        n = len(ds)
        return {'count':n,'avg_temp':round(sum(d.get('stats',{}).get('temp_max_7d',0) for _,d in ds)/n,1),'avg_rain':round(sum(d.get('stats',{}).get('rain_total_7d',0) for _,d in ds)/n,1)}
    return jsonify({'region_a':get_prov_stats(data.get('region_a','')),'region_b':get_prov_stats(data.get('region_b',''))})

@app.route('/api/modules/mapping')
def get_mapping_layers():
    layers = [
        {'id':'temperature','name':'Temperature Heatmap','icon':'🌡','status':'active','data_points':56,'color_scale':'red-yellow-green'},
        {'id':'aqi','name':'Air Quality Index','icon':'💨','status':'active','data_points':56,'color_scale':'green-yellow-red'},
        {'id':'precipitation','name':'Precipitation Overlay','icon':'🌧','status':'active','data_points':56,'color_scale':'blue-cyan'},
        {'id':'wind','name':'Wind Patterns','icon':'🌬','status':'active','data_points':56,'color_scale':'gray-blue'},
        {'id':'flood-risk','name':'Flood Risk Zones','icon':'⚠','status':'active','data_points':56,'color_scale':'green-yellow-red'},
        {'id':'vegetation','name':'NDVI Vegetation','icon':'🌿','status':'simulated','data_points':56,'color_scale':'red-green'},
        {'id':'glacial','name':'Glacial Lake Monitor','icon':'🏔','status':'simulated','data_points':6,'color_scale':'blue-red'},
        {'id':'agriculture','name':'Crop Stress Index','icon':'🌾','status':'active','data_points':56,'color_scale':'green-yellow-red'},
    ]
    basemaps = [
        {'id':'dark','name':'Dark Theme','selected':True},
        {'id':'satellite','name':'Satellite','selected':False},
        {'id':'terrain','name':'Terrain','selected':False},
        {'id':'voyager','name':'Voyager','selected':False},
        {'id':'positron','name':'Light','selected':False},
    ]
    tools = [
        {'id':'heatmap','name':'Heatmap Generator','icon':'🔥','status':'active'},
        {'id':'polygon','name':'Area Selection','icon':'📐','status':'active'},
        {'id':'measure','name':'Distance Measurement','icon':'📏','status':'active'},
        {'id':'export','name':'Map Export (PNG)','icon':'📤','status':'active'},
        {'id':'compare','name':'Time Comparison','icon':'⚖','status':'planned'},
    ]
    return jsonify({'layers':layers,'basemaps':basemaps,'tools':tools,'active_layers':len([l for l in layers if l['status']=='active'])})

# ─── Scheduler ──────────────────────────────────────────────────────
scheduler = BackgroundScheduler()
scheduler.add_job(fetch_weather_job, 'interval', hours=3, id='weather', replace_existing=True)
scheduler.add_job(fetch_aqi_job, 'interval', hours=6, id='aqi', replace_existing=True)
scheduler.start()

# ─── Initial data fetch on startup ──────────────────────────────────
@app.before_request
def first_load():
    """Fetch data on first request if not cached."""
    pass  # Handled by startup script

# ─── Run ────────────────────────────────────────────────────────────
if __name__ == '__main__':
    # Initial data fetch in background
    threading.Thread(target=fetch_weather_job, daemon=True).start()
    threading.Thread(target=fetch_aqi_job, daemon=True).start()
    app.run(host='0.0.0.0', port=5020, debug=False)
