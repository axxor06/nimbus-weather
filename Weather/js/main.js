const API_KEY = "1e3e8f230b6064d27976e41163a82b77";
let useCelsius = true;
let rawData    = null;
let rawCurrent = null;

// ── helpers ───────────────────────────────────────────────────────────────────
function getWeatherImg(main){
  const m=(main||"").toLowerCase();
  if(m==="rain"||m==="drizzle")  return"img/rain.png";
  if(m==="clear")                return"img/sun.png";
  if(m==="snow")                 return"img/snow.png";
  if(m==="clouds"||m==="smoke")  return"img/cloud.png";
  if(m==="mist"||m==="fog")      return"img/mist.png";
  if(m==="haze")                 return"img/haze.png";
  if(m==="thunderstorm")         return"img/thunderstorm.png";
  if(m==="wind"||m==="squall")   return"img/wind.png";
  return"img/sun.png";
}
function getGlowColor(main){
  const m=(main||"").toLowerCase();
  if(m==="rain"||m==="drizzle") return"#2e86de";
  if(m==="clear")               return"#f9ca24";
  if(m==="snow")                return"#a8d8ea";
  if(m==="clouds")              return"#636e72";
  if(m==="thunderstorm")        return"#6c5ce7";
  if(m==="haze")                return"#e6a817";
  return"#5eaeff";
}
function cToF(c){return Math.round(c*9/5+32);}
function fmtT(c){return useCelsius?Math.round(c)+"°":cToF(c)+"°";}
function fmtTime(unix){return new Date(unix*1000).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});}
function fmtHour(unix){return new Date(unix*1000).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});}
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function dayName(dtTxt){return DAYS[new Date(dtTxt.split(" ")[0]).getDay()];}
function windDirStr(deg){
  if(deg===undefined)return"--";
  const d=["N","NE","E","SE","S","SW","W","NW"];
  return d[Math.round(deg/45)%8];
}

// ── Weather background + particles ───────────────────────────────────────────
let particleInterval=null;
function setWeatherTheme(main){
  const m=(main||"").toLowerCase();
  const body=document.body;
  body.className="";
  clearInterval(particleInterval);
  document.getElementById("rain-wrap").innerHTML="";
  document.getElementById("snow-wrap").innerHTML="";
  document.getElementById("cloud-drift").innerHTML="";

  if(m==="rain"||m==="drizzle"){
    body.classList.add("weather-rain");
    spawnRain(80);
  } else if(m==="thunderstorm"){
    body.classList.add("weather-storm");
    spawnRain(130);
  } else if(m==="snow"){
    body.classList.add("weather-snow");
    spawnSnow(55);
  } else if(m==="clear"){
    body.classList.add("weather-clear");
    spawnSunRays();
  } else if(m==="clouds"||m==="smoke"){
    body.classList.add("weather-clouds");
    spawnClouds(4);
  } else if(m==="haze"||m==="mist"||m==="fog"){
    body.classList.add("weather-haze");
    spawnClouds(3);
  } else {
    body.classList.add("weather-clouds");
  }
}

function spawnRain(count){
  const wrap=document.getElementById("rain-wrap");
  for(let i=0;i<count;i++){
    const d=document.createElement("div");
    d.className="raindrop";
    const h=Math.random()*22+10;
    d.style.cssText=`
      left:${Math.random()*110-5}%;
      height:${h}px;
      opacity:${0.3+Math.random()*0.5};
      animation-duration:${0.5+Math.random()*0.6}s;
      animation-delay:${Math.random()*2}s;
    `;
    wrap.appendChild(d);
  }
}

function spawnSnow(count){
  const wrap=document.getElementById("snow-wrap");
  for(let i=0;i<count;i++){
    const d=document.createElement("div");
    d.className="snowflake";
    const sz=Math.random()*4+3;
    d.style.cssText=`
      left:${Math.random()*100}%;
      width:${sz}px;height:${sz}px;
      opacity:${0.4+Math.random()*0.5};
      --drift:${(Math.random()-0.5)*60}px;
      animation-duration:${3+Math.random()*4}s;
      animation-delay:${Math.random()*4}s;
    `;
    wrap.appendChild(d);
  }
}

function spawnSunRays(){
  const wrap=document.getElementById("sun-rays");
  wrap.innerHTML="";
  for(let i=0;i<12;i++){
    const r=document.createElement("div");
    r.className="ray";
    r.style.cssText=`
      transform:rotate(${i*30}deg);
      animation-duration:${10+i*1.5}s;
      animation-delay:${i*0.5}s;
      opacity:${0.5+Math.random()*0.5};
    `;
    wrap.appendChild(r);
  }
}

function spawnClouds(count){
  const wrap=document.getElementById("cloud-drift");
  for(let i=0;i<count;i++){
    const d=document.createElement("div");
    d.className="drift-cloud";
    const h=80+Math.random()*120;
    const w=150+Math.random()*200;
    d.style.cssText=`
      width:${w}px;height:${h}px;
      top:${5+Math.random()*30}%;
      animation-duration:${30+Math.random()*30}s;
      animation-delay:${Math.random()*-20}s;
      opacity:${0.1+Math.random()*0.15};
    `;
    wrap.appendChild(d);
  }
}

// ── Sun Arc ───────────────────────────────────────────────────────────────────
function updateSunArc(sunrise,sunset){
  const now=Date.now()/1000;
  document.getElementById("sunrise-time").textContent=fmtTime(sunrise);
  document.getElementById("sunset-time").textContent=fmtTime(sunset);
  let pct=Math.max(0,Math.min(1,(now-sunrise)/(sunset-sunrise)));
  document.getElementById("sun-arc-bar").style.width=(pct*100)+"%";
  document.getElementById("sun-dot").style.left=(pct*100)+"%";
  const lbl=document.getElementById("sun-arc-time");
  if(now<sunrise)      lbl.textContent="Before sunrise";
  else if(now>sunset)  lbl.textContent="After sunset";
  else                 lbl.textContent=`${Math.round(pct*100)}% daylight passed`;
}

// ── AQI mock (based on humidity + clouds as proxy since free OWM doesn't include AQI in this plan) ──
function renderAQI(humidity,clouds){
  // Derive a rough AQI proxy from humidity & cloud cover
  const raw=Math.min(100,Math.round((humidity*0.4+clouds*0.6)));
  let color,label,pct;
  if(raw<25){color="#2ecc71";label="Good";pct=raw/100*25;}
  else if(raw<50){color="#f1c40f";label="Moderate";pct=25+raw/100*25;}
  else if(raw<75){color="#e67e22";label="Unhealthy";pct=50+raw/100*25;}
  else{color="#e74c3c";label="Hazardous";pct=75+raw/100*25;}
  document.getElementById("aqi-dot").style.background=color;
  document.getElementById("aqi-label").textContent=label;
  const bar=document.getElementById("aqi-bar");
  bar.style.background=color;
  setTimeout(()=>{bar.style.width=Math.min(95,pct+10)+"%";},200);
}

// ── Compass ───────────────────────────────────────────────────────────────────
function updateCompass(deg,speed,gust){
  const needle=document.getElementById("compass-needle");
  setTimeout(()=>{needle.style.transform=`rotate(${deg||0}deg)`;},200);
  document.getElementById("wind-speed-big").textContent=Math.round(speed||0);
  document.getElementById("wind-dir-text").textContent="Direction: "+windDirStr(deg);
  if(gust){
    document.getElementById("wind-gust").textContent="💨 Gusts up to "+Math.round(gust)+" m/s";
  }
}

// ── Render ────────────────────────────────────────────────────────────────────
function render(){
  if(!rawData||!rawCurrent)return;
  const cur=rawCurrent;
  const cond=cur.weather[0].main;

  // Theme
  setWeatherTheme(cond);

  // Hero
  document.getElementById("hero-temp").textContent=fmtT(cur.main.temp);
  document.getElementById("hero-desc").textContent=cur.weather[0].description;
  document.getElementById("hero-feels").textContent="Feels like "+fmtT(cur.main.feels_like);
  document.getElementById("hero-icon").src=getWeatherImg(cond);
  document.getElementById("icon-glow").style.background=
    `radial-gradient(circle,${getGlowColor(cond)} 0%,transparent 70%)`;

  // Pills
  document.getElementById("stat-humidity").textContent=cur.main.humidity+"%";
  document.getElementById("stat-wind").textContent=Math.round(cur.wind.speed)+" m/s";
  document.getElementById("stat-pressure").textContent=cur.main.pressure+"";
  document.getElementById("stat-visibility").textContent=
    cur.visibility?(cur.visibility/1000).toFixed(1)+"km":"--";

  // Sun Arc
  updateSunArc(cur.sys.sunrise,cur.sys.sunset);

  // Today
  document.getElementById("today-icon").src=getWeatherImg(cond);
  document.getElementById("today-min").textContent=fmtT(cur.main.temp_min);
  document.getElementById("today-max").textContent=fmtT(cur.main.temp_max);
  document.getElementById("today-label").textContent=cur.weather[0].description;

  // Details
  document.getElementById("detail-cloud").textContent=cur.clouds.all+"%";
  const dp=cur.main.temp-(100-cur.main.humidity)/5;
  document.getElementById("detail-dew").textContent=fmtT(dp);
  document.getElementById("detail-sea").textContent=(cur.main.sea_level||cur.main.pressure)+" hPa";
  const rain3h=cur.rain&&cur.rain["3h"]?cur.rain["3h"].toFixed(1)+" mm":"0 mm";
  document.getElementById("detail-rain").textContent=rain3h;

  // Wind compass
  updateCompass(cur.wind.deg,cur.wind.speed,cur.wind.gust);

  // AQI proxy
  renderAQI(cur.main.humidity,cur.clouds.all);

  // 6-day forecast — pick one slot per day at ~12:00 for consistency
  const list=rawData.list;
  const daily={};
  list.forEach(item=>{
    const date=item.dt_txt.split(" ")[0];
    const hour=item.dt_txt.split(" ")[1];
    if(!daily[date]||(hour>="11:00:00"&&hour<="13:00:00")){
      if(!daily[date]||hour==="12:00:00") daily[date]=item;
    }
  });
  // fallback: first entry per day
  list.forEach(item=>{
    const date=item.dt_txt.split(" ")[0];
    if(!daily[date]) daily[date]=item;
  });

  const fcBox=document.getElementById("forecast-box");
  fcBox.innerHTML="";
  const today=new Date().toISOString().split("T")[0];
  let cnt=0;
  for(const[date,item]of Object.entries(daily)){
    if(date===today||cnt>=6)continue;
    cnt++;
    const div=document.createElement("div");
    div.className="fc-item";
    div.innerHTML=`
      <div class="fc-day">${dayName(item.dt_txt)}</div>
      <img src="${getWeatherImg(item.weather[0].main)}" alt=""/>
      <div class="fc-temp">${fmtT(item.main.temp)}</div>
      <div class="fc-desc">${item.weather[0].description}</div>
    `;
    fcBox.appendChild(div);
  }

  // Hourly (12 slots)
  const hrBox=document.getElementById("hourly-box");
  hrBox.innerHTML="";
  list.slice(0,12).forEach(item=>{
    const div=document.createElement("div");
    div.className="hr-item";
    const pop=item.pop?Math.round(item.pop*100)+"%":"";
    div.innerHTML=`
      <div class="hr-time">${fmtHour(item.dt)}</div>
      <img src="${getWeatherImg(item.weather[0].main)}" alt=""/>
      <div class="hr-temp">${fmtT(item.main.temp)}</div>
      ${pop?`<div class="hr-pop"><i class="fa-solid fa-droplet"></i>${pop}</div>`:""}
    `;
    hrBox.appendChild(div);
  });

  // Updated
  document.getElementById("last-updated").textContent=
    "Updated "+new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});

  // Show app, hide skeleton
  document.getElementById("skeleton-screen").classList.add("hidden");
  document.getElementById("app").classList.add("visible");
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchWeather(lat,lon){
  try{
    const[cur,forecast,geo]=await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`).then(r=>r.json()),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`).then(r=>r.json()),
      fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`).then(r=>r.json()),
    ]);
    const city=(geo[0]&&geo[0].name)?geo[0].name:cur.name;
    document.getElementById("city-name").textContent=city;
    rawCurrent=cur;
    rawData=forecast;
    render();
  }catch(e){
    console.error(e);
    document.getElementById("skeleton-screen").classList.add("hidden");
    document.getElementById("app").classList.add("visible");
  }
}

// ── Unit toggle ───────────────────────────────────────────────────────────────
document.getElementById("unit-toggle").addEventListener("click",()=>{
  useCelsius=!useCelsius;
  document.getElementById("unit-label").textContent=useCelsius?"°C":"°F";
  render();
});

// ── Init ──────────────────────────────────────────────────────────────────────
navigator.geolocation.getCurrentPosition(
  pos=>fetchWeather(pos.coords.latitude,pos.coords.longitude),
  ()=>{
    document.getElementById("city-name").textContent="Kozhikode";
    fetchWeather(11.2588,75.7804); // Kozhikode fallback
  }
);
