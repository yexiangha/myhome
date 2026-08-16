// import axios from "axios";
import fetchJsonp from "fetch-jsonp";

/**
 * 音乐播放器
 */

// 获取音乐播放列表
export const getPlayerList = async (server, type, id) => {
  const res = await fetch(
    `${import.meta.env.VITE_SONG_API}?server=${server}&type=${type}&id=${id}`,
  );
  const data = await res.json();

  if (data[0].url.startsWith("@")) {
    // eslint-disable-next-line no-unused-vars
    const [handle, jsonpCallback, jsonpCallbackFunction, url] = data[0].url.split("@").slice(1);
    const jsonpData = await fetchJsonp(url).then((res) => res.json());
    const domain = (
      jsonpData.req_0.data.sip.find((i) => !i.startsWith("http://ws")) ||
      jsonpData.req_0.data.sip[0]
    ).replace("http://", "https://");

    return data.map((v, i) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: domain + jsonpData.req_0.data.midurlinfo[i].purl,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  } else {
    return data.map((v) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: v.url,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  }
};

/**
 * 一言
 */

// 获取一言数据
export const getHitokoto = async () => {
  const res = await fetch("https://v1.hitokoto.cn");
  return await res.json();
};

/**
 * 天气
 */

// 获取高德地理位置信息
export const getAdcode = async (key) => {
  const res = await fetch(`https://restapi.amap.com/v3/ip?key=${key}`);
  return await res.json();
};

// 获取高德地理天气信息
export const getWeather = async (key, city) => {
  const res = await fetch(
    `https://restapi.amap.com/v3/weather/weatherInfo?key=${key}&city=${city}`,
  );
  return await res.json();
};

// 获取天气 (wttr.in 免 Key 备用接口)
// 原教书先生 api.oioweb.cn 证书已失效，改用 https://wttr.in (IP 定位，无需 Key)
const WIND_DIR_CN = {
  N: "北风", NNE: "东北风", NE: "东北风", ENE: "东北风",
  E: "东风", ESE: "东南风", SE: "东南风", SSE: "东南风",
  S: "南风", SSW: "西南风", SW: "西南风", WSW: "西南风",
  W: "西风", WNW: "西北风", NW: "西北风", NNW: "西北风",
};

// 英文天气现象 -> 中文 (wttr.in 返回值为英文)
const WX_CN = {
  Sunny: "晴", Clear: "晴", "Clear Sunny": "晴", "Clear (night)": "晴",
  "Partly cloudy": "多云", "Partly Cloudy": "多云", Cloudy: "阴", Overcast: "阴",
  Mist: "薄雾", Fog: "雾", "Freezing fog": "冻雾", "Smoky haze": "霾",
  "Light drizzle": "毛毛雨", Drizzle: "毛毛雨", "Heavy drizzle": "大毛毛雨",
  "Light rain": "小雨", "Moderate rain": "中雨", "Heavy rain": "大雨",
  "Patchy rain possible": "局部有雨", "Moderate rain at times": "中雨", "Heavy rain at times": "大雨",
  "Torrential rain shower": "大阵雨", "Light rain shower": "阵雨", "Moderate or heavy rain shower": "阵雨",
  "Light freezing rain": "冻雨", "Heavy freezing rain": "冻雨", "Freezing rain": "冻雨",
  "Light sleet": "雨夹雪", "Heavy sleet": "雨夹雪",
  "Light snow": "小雪", "Moderate snow": "中雪", "Heavy snow": "大雪",
  "Patchy snow possible": "局部有雪", "Light snow showers": "阵雪", "Moderate or heavy snow showers": "阵雪",
  "Blowing snow": "吹雪", Blizzard: "暴风雪",
  Hail: "冰雹", "Light showers of ice pellets": "冰粒", "Moderate or heavy showers of ice pellets": "冰粒",
  "Thundery outbreaks possible": "雷阵雨", "Patchy light rain with thunder": "雷阵雨",
  "Moderate or heavy rain with thunder": "雷阵雨", "Light rain with thunder": "雷阵雨",
  "Heavy rain with thunder": "雷阵雨", Thunderstorm: "雷雨", "Patchy light snow with thunder": "雷雪",
};

// 风速 km/h -> 风力等级
const windLevel = (kmh) => {
  const v = Number(kmh);
  if (Number.isNaN(v)) return "0";
  const table = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117];
  let level = 0;
  for (let i = 0; i < table.length; i++) {
    if (v >= table[i]) level = i + 1;
  }
  return String(level);
};

export const getOtherWeather = async () => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch("https://wttr.in/?format=j1", { signal: controller.signal });
    const data = await res.json();
    const cc = data.current_condition?.[0] || {};
    const area = data.nearest_area?.[0] || {};
    const wx = cc.weatherDesc?.[0]?.value || "未知";
    return {
      result: {
        city: { City: area.areaName?.[0]?.value || "未知地区" },
        condition: {
          day_weather: WX_CN[wx] || wx,
          min_degree: cc.temp_C,
          max_degree: cc.temp_C,
          day_wind_direction: WIND_DIR_CN[cc.winddir16Point] || cc.winddir16Point || "未知",
          day_wind_power: windLevel(cc.windspeedKmph),
        },
      },
    };
  } finally {
    clearTimeout(timer);
  }
};
