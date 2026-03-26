// ============================================================
//  Weather Dashboard — app.js
//  Author: Jana Elhenawy
//  ⚠️  Replace API_KEY below with your free key from openweathermap.org
// ============================================================

const API_KEY = '8903de7bd4bd145cd70391b459cad54a' ;   // <-- paste your key here
const BASE    = 'https://api.openweathermap.org/data/2.5';

// ─── State ───────────────────────────────────────────────
let units = 'metric';   // 'metric' | 'imperial'
let lastCity = 'Cairo'; // default city on load

// ─── DOM refs ────────────────────────────────────────────
const cityInput    = document.getElementById('city-input');
const searchBtn    = document.getElementById('search-btn');
const metricBtn    = document.getElementById('metric-btn');
const imperialBtn  = document.getElementById('imperial-btn');
const loading      = document.getElementById('loading');
const errorToast   = document.getElementById('error-toast');

// ─── Init ────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => fetchWeather(lastCity));

searchBtn.addEventListener('click', onSearch);
cityInput.addEventListener('keydown', e => { if (e.key === 'Enter') onSearch(); });

metricBtn.addEventListener('click', () => {
  units = 'metric';
  metricBtn.classList.add('active');
  imperialBtn.classList.remove('active');
  fetchWeather(lastCity);
});
imperialBtn.addEventListener('click', () => {
  units = 'imperial';
  imperialBtn.classList.add('active');
  metricBtn.classList.remove('active');
  fetchWeather(lastCity);
});

function onSearch() {
  const city = cityInput.value.trim();
  if (city) fetchWeather(city);
}

// ─── Fetch ───────────────────────────────────────────────
async function fetchWeather(city) {
  showLoading(true);
  try {
    const [current, forecast] = await Promise.all([
      apiFetch(`${BASE}/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${API_KEY}`),
      apiFetch(`${BASE}/forecast?q=${encodeURIComponent(city)}&units=${units}&cnt=40&appid=${API_KEY}`)
    ]);
    lastCity = city;
    renderCurrent(current);
    renderForecast(forecast.list);
    renderHourly(forecast.list);
    document.getElementById('header-city').textContent = `— ${current.name}, ${current.sys.country}`;
  } catch (err) {
    showToast();
  } finally {
    showLoading(false);
  }
}

async function apiFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('API error');
  return res.json();
}

// ─── Render current ──────────────────────────────────────
function renderCurrent(data) {
  const unitSym   = units === 'metric' ? '°C' : '°F';
  const speedUnit = units === 'metric' ? 'km/h' : 'mph';
  const wind      = units === 'metric'
    ? Math.round(data.wind.speed * 3.6)
    : Math.round(data.wind.speed);

  document.getElementById('current-icon').textContent   = weatherEmoji(data.weather[0].id);
  document.getElementById('current-temp').textContent   = `${Math.round(data.main.temp)}${unitSym}`;
  document.getElementById('current-city').textContent   = `${data.name}, ${data.sys.country}`;
  document.getElementById('current-desc').textContent   = data.weather[0].description;
  document.getElementById('current-date').textContent   = formatDate(new Date());
  document.getElementById('humidity').textContent       = `${data.main.humidity}%`;
  document.getElementById('wind').textContent           = `${wind} ${speedUnit}`;
  document.getElementById('feels-like').textContent     = `${Math.round(data.main.feels_like)}${unitSym}`;
  document.getElementById('visibility').textContent     = `${(data.visibility / 1000).toFixed(1)} km`;
  document.getElementById('sunrise').textContent        = formatTime(data.sys.sunrise);
  document.getElementById('sunset').textContent         = formatTime(data.sys.sunset);
  document.getElementById('pressure').textContent       = `${data.main.pressure} hPa`;
  document.getElementById('cloudiness').textContent     = `${data.clouds.all}%`;

  setBodyClass(data.weather[0].id, data.sys.sunrise, data.sys.sunset);
}

// ─── Render 5-day forecast ───────────────────────────────
function renderForecast(list) {
  const unitSym  = units === 'metric' ? '°C' : '°F';
  const daily    = groupByDay(list);
  const grid     = document.getElementById('forecast-grid');
  grid.innerHTML = '';

  Object.entries(daily).slice(0, 5).forEach(([date, items]) => {
    const temps  = items.map(i => i.main.temp);
    const high   = Math.round(Math.max(...temps));
    const low    = Math.round(Math.min(...temps));
    const mid    = items[Math.floor(items.length / 2)];
    const emoji  = weatherEmoji(mid.weather[0].id);
    const label  = formatDay(new Date(date));

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <div class="forecast-day">${label}</div>
      <div class="forecast-icon">${emoji}</div>
      <div class="forecast-high">${high}${unitSym}</div>
      <div class="forecast-low">${low}${unitSym}</div>
      <div class="forecast-desc">${mid.weather[0].description}</div>
    `;
    grid.appendChild(card);
  });
}

// ─── Render hourly strip ─────────────────────────────────
function renderHourly(list) {
  const unitSym = units === 'metric' ? '°C' : '°F';
  const strip   = document.getElementById('hourly-strip');
  strip.innerHTML = '';

  list.slice(0, 8).forEach(item => {
    const time  = new Date(item.dt * 1000);
    const slot  = document.createElement('div');
    slot.className = 'hourly-slot';
    slot.innerHTML = `
      <div class="hourly-time">${formatTime(item.dt)}</div>
      <div class="hourly-icon">${weatherEmoji(item.weather[0].id)}</div>
      <div class="hourly-temp">${Math.round(item.main.temp)}${unitSym}</div>
    `;
    strip.appendChild(slot);
  });
}

// ─── Helpers ─────────────────────────────────────────────
function groupByDay(list) {
  return list.reduce((acc, item) => {
    const date = new Date(item.dt * 1000).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
}
function formatDay(d) {
  return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
}
function formatTime(unixSec) {
  return new Date(unixSec * 1000).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true });
}

function weatherEmoji(id) {
  if (id >= 200 && id < 300) return '⛈';
  if (id >= 300 && id < 400) return '🌧';
  if (id >= 500 && id < 600) return '🌦';
  if (id >= 600 && id < 700) return '❄️';
  if (id >= 700 && id < 800) return '🌫';
  if (id === 800)             return '☀️';
  if (id === 801)             return '🌤';
  if (id === 802)             return '⛅';
  return '☁️';
}

function setBodyClass(id, sunrise, sunset) {
  const now  = Date.now() / 1000;
  const day  = now >= sunrise && now <= sunset;
  document.body.className = '';
  if (id >= 200 && id < 300) document.body.classList.add('stormy');
  else if (id >= 300 && id < 600) document.body.classList.add('rainy');
  else if (id >= 600 && id < 700) document.body.classList.add('snowy');
  else if (id >= 700 && id < 800) document.body.classList.add('foggy');
  else if (id === 800) document.body.classList.add(day ? 'sunny' : 'clear');
  else document.body.classList.add('cloudy');
}

function showLoading(on) { loading.classList.toggle('hidden', !on); }

let toastTimer;
function showToast() {
  errorToast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => errorToast.classList.add('hidden'), 3000);
}
