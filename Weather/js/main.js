const API_KEY = "1e3e8f230b6064d27976e41163a82b77";
let useCelsius = true;
let rawData = null; // cached forecast response
let rawCurrent = null;

// ── helpers ──────────────────────────────────────────────────────────────────
function getWeatherImg(main) {
  const m = (main || "").toLowerCase();
  if (m === "rain" || m === "drizzle") return "img/rain.png";
  if (m === "clear")                    return "img/sun.png";
  if (m === "snow")                     return "img/snow.png";
  if (m === "clouds" || m === "smoke")  return "img/cloud.png";
  if (m === "mist" || m === "fog")      return "img/mist.png";
  if (m === "haze")                     return "img/haze.png";
  if (m === "thunderstorm")             return "img/thunderstorm.png";
  if (m === "wind" || m === "squall")   return "img/wind.png";
  return "img/sun.png";
}

function getGlowColor(main) {
  const m = (main || "").toLowerCase();
  if (m === "rain" || m === "drizzle")  return "#2e86de";
  if (m === "clear")                    return "#f9ca24";
  if (m === "snow")                     return "#a8d8ea";
  if (m === "clouds")                   return "#636e72";
  if (m === "thunderstorm")             return "#6c5ce7";
  return "#5eaeff";
}

function cToF(c) { return Math.round(c * 9/5 + 32); }
function formatTemp(c) {
  if (useCelsius) return Math.round(c) + "°";
  return cToF(c) + "°";
}

function windDir(deg) {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function formatTime(unix) {
  return new Date(unix * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatHour(unix) {
  return new Date(unix * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const DAY = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function dayName(dtTxt) {
  return DAY[new Date(dtTxt.split(" ")[0]).getDay()];
}

// ── Sun Arc ───────────────────────────────────────────────────────────────────
function updateSunArc(sunrise, sunset) {
  const now = Date.now() / 1000;
  const rise = sunrise, set = sunset;
  document.getElementById("sunrise-time").textContent = formatTime(rise);
  document.getElementById("sunset-time").textContent  = formatTime(set);

  let pct = Math.max(0, Math.min(1, (now - rise) / (set - rise)));
  const bar  = document.getElementById("sun-arc-bar");
  const dot  = document.getElementById("sun-dot");
  const lbl  = document.getElementById("sun-arc-time");

  bar.style.width = (pct * 100) + "%";
  dot.style.left  = (pct * 100) + "%";

  if (now < rise)      lbl.textContent = "Before sunrise";
  else if (now > set)  lbl.textContent = "After sunset";
  else                 lbl.textContent = `${Math.round(pct * 100)}% of daylight passed`;
}

// ── Render ─────────────────────────────────────────────────────────────────────
function render() {
  if (!rawData || !rawCurrent) return;

  const cur = rawCurrent;
  const condition = cur.weather[0].main;

  // Hero
  document.getElementById("hero-temp").textContent  = formatTemp(cur.main.temp);
  document.getElementById("hero-desc").textContent  = cur.weather[0].description;
  document.getElementById("hero-feels").textContent = "Feels like " + formatTemp(cur.main.feels_like);
  const heroIcon = document.getElementById("hero-icon");
  heroIcon.src = getWeatherImg(condition);

  // Glow
  const glow = document.getElementById("icon-glow");
  glow.style.background = `radial-gradient(circle, ${getGlowColor(condition)} 0%, transparent 70%)`;

  // Stat pills
  document.getElementById("stat-humidity").textContent   = cur.main.humidity + "%";
  document.getElementById("stat-wind").textContent       = Math.round(cur.wind.speed) + " m/s";
  document.getElementById("stat-pressure").textContent   = cur.main.pressure + "";
  document.getElementById("stat-visibility").textContent = cur.visibility ? (cur.visibility / 1000).toFixed(1) + "km" : "--";

  // Sun Arc
  updateSunArc(cur.sys.sunrise, cur.sys.sunset);

  // Today card
  document.getElementById("today-icon").src    = getWeatherImg(condition);
  document.getElementById("today-min").textContent = formatTemp(cur.main.temp_min);
  document.getElementById("today-max").textContent = formatTemp(cur.main.temp_max);
  document.getElementById("today-label").textContent = cur.weather[0].description;

  // Details grid
  document.getElementById("detail-cloud").textContent   = cur.clouds.all + "%";
  const dp = cur.main.temp - (100 - cur.main.humidity) / 5;
  document.getElementById("detail-dew").textContent     = formatTemp(dp);
  document.getElementById("detail-winddir").textContent = cur.wind.deg !== undefined ? windDir(cur.wind.deg) : "--";
  document.getElementById("detail-sea").textContent     = (cur.main.sea_level || cur.main.pressure) + " hPa";

  // 6-day forecast (rawData = /forecast)
  const list = rawData.list;
  const daily = {};
  list.forEach(item => {
    const d = item.dt_txt.split(" ")[0];
    if (!daily[d]) daily[d] = item;
  });

  const fcBox = document.getElementById("forecast-box");
  fcBox.innerHTML = "";
  const today = new Date().toISOString().split("T")[0];
  let count = 0;
  for (const [date, item] of Object.entries(daily)) {
    if (date === today || count >= 6) continue;
    count++;
    const div = document.createElement("div");
    div.className = "fc-item";
    div.innerHTML = `
      <div class="fc-day">${dayName(item.dt_txt)}</div>
      <img src="${getWeatherImg(item.weather[0].main)}" alt="" />
      <div class="fc-temp">${formatTemp(item.main.temp)}</div>
      <div class="fc-desc">${item.weather[0].description}</div>
    `;
    fcBox.appendChild(div);
  }

  // Hourly (next 12 entries = 36h)
  const hrBox = document.getElementById("hourly-box");
  hrBox.innerHTML = "";
  list.slice(0, 12).forEach(item => {
    const div = document.createElement("div");
    div.className = "hr-item";
    const pop = item.pop ? Math.round(item.pop * 100) + "%" : "";
    div.innerHTML = `
      <div class="hr-time">${formatHour(item.dt)}</div>
      <img src="${getWeatherImg(item.weather[0].main)}" alt="" />
      <div class="hr-temp">${formatTemp(item.main.temp)}</div>
      ${pop ? `<div class="hr-pop"><i class="fa-solid fa-droplet"></i> ${pop}</div>` : ""}
    `;
    hrBox.appendChild(div);
  });

  // Last updated
  document.getElementById("last-updated").textContent =
    "Updated " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Fetch ──────────────────────────────────────────────────────────────────────
async function fetchWeather(lat, lon) {
  const [cur, forecast] = await Promise.all([
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`).then(r => r.json()),
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`).then(r => r.json()),
  ]);

  // City name via reverse geo
  const geo = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`).then(r => r.json());
  const city = (geo[0] && geo[0].name) ? geo[0].name : cur.name;
  document.getElementById("city-name").textContent = city;

  rawCurrent = cur;
  rawData    = forecast;

  render();

  document.getElementById("loading-overlay").classList.add("hidden");
}

// ── Unit toggle ────────────────────────────────────────────────────────────────
document.getElementById("unit-toggle").addEventListener("click", () => {
  useCelsius = !useCelsius;
  document.getElementById("unit-label").textContent = useCelsius ? "°C" : "°F";
  render();
});

// ── Init ───────────────────────────────────────────────────────────────────────
navigator.geolocation.getCurrentPosition(
  pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
  ()  => {
    document.getElementById("loading-overlay").classList.add("hidden");
    document.getElementById("city-name").textContent = "Location denied";
    // fallback: Mumbai
    fetchWeather(19.0760, 72.8777);
  }
);
