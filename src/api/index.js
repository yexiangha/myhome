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
    return {
      result: {
        city: { City: area.areaName?.[0]?.value || "未知地区" },
        condition: {
          day_weather: cc.weatherDesc?.[0]?.value || "未知",
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
