const API_KEY = "1e3e8f230b6064d27976e41163a82b77";
let useCelsius = true;
let cachedData = null;
let cachedForecast = null;

const POPULAR = ["Mumbai","Delhi","London","Paris","Tokyo","New York","Dubai","Singapore","Sydney","Berlin","Toronto","Los Angeles","Shanghai","Seoul","Bangkok"];

function getWeatherImg(main) {
  const m = (main || "").toLowerCase();
  if (m === "rain" || m === "drizzle") return "img/rain.png";
  if (m === "clear")                    return "img/sun.png";
  if (m === "snow")                     return "img/snow.png";
  if (m === "clouds" || m === "smoke")  return "img/cloud.png";
  if (m === "mist" || m === "fog")      return "img/mist.png";
  if (m === "haze")                     return "img/haze.png";
  if (m === "thunderstorm")             return "img/thunderstorm.png";
  return "img/sun.png";
}
function cToF(c) { return Math.round(c * 9/5 + 32); }
function fmtT(c) { return useCelsius ? Math.round(c) + "°" : cToF(c) + "°"; }
function fmtTime(unix) {
  return new Date(unix * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function dayName(dtTxt) { return DAYS[new Date(dtTxt.split(" ")[0]).getDay()]; }

function renderResult() {
  if (!cachedData) return;
  const d = cachedData;
  document.getElementById("r-city").textContent    = d.name;
  document.getElementById("r-country").textContent = d.sys.country + " — " + d.weather[0].description;
  document.getElementById("r-temp").textContent    = fmtT(d.main.temp);
  document.getElementById("r-desc").textContent    = d.weather[0].description;
  document.getElementById("r-feels").textContent   = "Feels like " + fmtT(d.main.feels_like);
  document.getElementById("r-icon").src            = getWeatherImg(d.weather[0].main);

  document.getElementById("r-wind").textContent    = Math.round(d.wind.speed) + " m/s";
  document.getElementById("r-humid").textContent   = d.main.humidity + "%";
  document.getElementById("r-pressure").textContent = d.main.pressure + " hPa";
  document.getElementById("r-vis").textContent      = d.visibility ? (d.visibility/1000).toFixed(1) + " km" : "--";
  document.getElementById("r-sunrise").textContent  = fmtTime(d.sys.sunrise);
  document.getElementById("r-sunset").textContent   = fmtTime(d.sys.sunset);
  document.getElementById("r-minmax").textContent   = fmtT(d.main.temp_min) + " / " + fmtT(d.main.temp_max);
  document.getElementById("r-cloud").textContent    = d.clouds.all + "%";

  // 5-day forecast
  if (cachedForecast) {
    const box = document.getElementById("r-forecast");
    box.innerHTML = "";
    const daily = {};
    cachedForecast.list.forEach(item => {
      const date = item.dt_txt.split(" ")[0];
      if (!daily[date]) daily[date] = item;
    });
    const today = new Date().toISOString().split("T")[0];
    let cnt = 0;
    for (const [date, item] of Object.entries(daily)) {
      if (date === today || cnt >= 5) continue;
      cnt++;
      const div = document.createElement("div");
      div.className = "fc-item";
      div.innerHTML = `
        <div class="fc-day">${dayName(item.dt_txt)}</div>
        <img src="${getWeatherImg(item.weather[0].main)}" alt="" />
        <div class="fc-temp">${fmtT(item.main.temp)}</div>
        <div class="fc-desc">${item.weather[0].description}</div>
      `;
      box.appendChild(div);
    }
  }
}

async function doSearch(city) {
  if (!city.trim()) return;
  hideSuggestions();
  try {
    const [curRes, foreRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?units=metric&q=${encodeURIComponent(city)}&appid=${API_KEY}`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?units=metric&q=${encodeURIComponent(city)}&appid=${API_KEY}`)
    ]);
    if (!curRes.ok) throw new Error("not found");
    cachedData     = await curRes.json();
    cachedForecast = foreRes.ok ? await foreRes.json() : null;

    document.getElementById("msg-idle").classList.add("hidden");
    document.getElementById("msg-error").classList.add("hidden");
    document.getElementById("result-area").classList.remove("hidden");
    renderResult();
  } catch {
    cachedData = null;
    document.getElementById("msg-idle").classList.add("hidden");
    document.getElementById("result-area").classList.add("hidden");
    document.getElementById("msg-error").classList.remove("hidden");
  }
}

// Suggestions
const input = document.getElementById("search-input");
const sugBox = document.getElementById("suggestions");
function hideSuggestions() { sugBox.innerHTML = ""; }

input.addEventListener("input", () => {
  const val = input.value.trim().toLowerCase();
  if (!val) { hideSuggestions(); return; }
  const matches = POPULAR.filter(c => c.toLowerCase().startsWith(val)).slice(0, 5);
  if (!matches.length) { hideSuggestions(); return; }
  sugBox.innerHTML = matches.map(c => `
    <div class="sug-item" data-city="${c}">
      <i class="fa-solid fa-location-dot"></i>${c}
    </div>`).join("");
  sugBox.querySelectorAll(".sug-item").forEach(el => {
    el.addEventListener("click", () => {
      input.value = el.dataset.city;
      doSearch(el.dataset.city);
    });
  });
});

document.getElementById("search-btn").addEventListener("click", () => doSearch(input.value));
input.addEventListener("keydown", e => { if (e.key === "Enter") doSearch(input.value); });

// Unit toggle
document.getElementById("unit-toggle").addEventListener("click", function() {
  useCelsius = !useCelsius;
  this.textContent = useCelsius ? "°C" : "°F";
  renderResult();
});

document.addEventListener("click", e => {
  if (!e.target.closest(".search-wrap")) hideSuggestions();
});
