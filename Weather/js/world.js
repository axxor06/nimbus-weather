const API_KEY = "1e3e8f230b6064d27976e41163a82b77";

// Date
const now = new Date();
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
document.getElementById("world-date").textContent =
  `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

// Defaults
const DEFAULT_CITIES = ["London","Paris","New York","Tokyo","Mumbai","Dubai"];

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

let cities = [];
try {
  const stored = localStorage.getItem("nimbus_cities");
  cities = stored ? JSON.parse(stored) : [...DEFAULT_CITIES];
} catch { cities = [...DEFAULT_CITIES]; }

function saveCities() {
  try { localStorage.setItem("nimbus_cities", JSON.stringify(cities)); } catch {}
}

// Drawer toggle
const addBtn    = document.getElementById("add-btn");
const addDrawer = document.getElementById("add-drawer");
const addIcon   = document.getElementById("add-icon");
let drawerOpen  = false;

addBtn.addEventListener("click", () => {
  drawerOpen = !drawerOpen;
  addDrawer.classList.toggle("open", drawerOpen);
  addBtn.classList.toggle("open", drawerOpen);
  if (drawerOpen) document.getElementById("drawer-input").focus();
});

// Add city
async function addCity(name) {
  const msg = document.getElementById("drawer-msg");
  msg.textContent = "Searching…"; msg.className = "drawer-msg";
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?units=metric&q=${encodeURIComponent(name)}&appid=${API_KEY}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const cityName = data.name;
    if (cities.includes(cityName)) {
      msg.textContent = `${cityName} is already added.`; msg.className = "drawer-msg";
      return;
    }
    cities.unshift(cityName);
    saveCities();
    msg.textContent = `✓ Added ${cityName}`; msg.className = "drawer-msg ok";
    document.getElementById("drawer-input").value = "";
    renderCard(cityName, data, true);
    checkEmpty();
  } catch {
    msg.textContent = "City not found."; msg.className = "drawer-msg error";
  }
}

document.getElementById("drawer-go").addEventListener("click", () => {
  const v = document.getElementById("drawer-input").value.trim();
  if (v) addCity(v);
});
document.getElementById("drawer-input").addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const v = document.getElementById("drawer-input").value.trim();
    if (v) addCity(v);
  }
});

// Render
const grid = document.getElementById("city-grid");

function renderSkeleton(id) {
  const div = document.createElement("div");
  div.className = "cc-skeleton";
  div.id = "skel-" + id;
  div.innerHTML = `
    <div class="skel-line short"></div>
    <div class="skel-line icon"></div>
    <div class="skel-line short"></div>
    <div class="skel-line" style="width:70%"></div>
  `;
  grid.prepend(div);
  return div;
}

function renderCard(cityName, data, prepend = false) {
  // Remove skeleton if exists
  const skel = document.getElementById("skel-" + cityName.replace(/\s/g,"_"));
  if (skel) skel.remove();

  // Remove existing card for this city if any
  const old = document.getElementById("card-" + cityName.replace(/\s/g,"_"));
  if (old) old.remove();

  const card = document.createElement("div");
  card.className = "city-card";
  card.id = "card-" + cityName.replace(/\s/g,"_");

  const temp = Math.round(data.main.temp);
  card.innerHTML = `
    <button class="cc-remove" data-city="${cityName}"><i class="fa-solid fa-xmark"></i></button>
    <div class="cc-name">${data.name}</div>
    <div class="cc-country">${data.sys.country}</div>
    <img class="cc-icon" src="${getWeatherImg(data.weather[0].main)}" alt="" />
    <div class="cc-temp">${temp}°</div>
    <div class="cc-desc">${data.weather[0].description}</div>
    <div class="cc-humid"><i class="fa-solid fa-droplet"></i> ${data.main.humidity}%</div>
  `;

  card.querySelector(".cc-remove").addEventListener("click", e => {
    e.stopPropagation();
    card.style.transform = "scale(0.8)"; card.style.opacity = "0";
    setTimeout(() => { card.remove(); }, 300);
    cities = cities.filter(c => c !== cityName);
    saveCities();
    checkEmpty();
  });

  if (prepend) grid.prepend(card);
  else          grid.appendChild(card);
}

async function fetchAndRender(cityName) {
  const skelId = cityName.replace(/\s/g,"_");
  renderSkeleton(skelId);
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?units=metric&q=${encodeURIComponent(cityName)}&appid=${API_KEY}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    renderCard(cityName, data);
  } catch {
    const skel = document.getElementById("skel-" + skelId);
    if (skel) skel.remove();
  }
}

function checkEmpty() {
  const hint = document.getElementById("empty-hint");
  if (cities.length === 0) { hint.style.display = "flex"; }
  else                     { hint.style.display = "none"; }
}

// Init
cities.forEach(c => fetchAndRender(c));
checkEmpty();
