import { getWorkingProxy } from "./proxy-handler.js";
import { playWithHLS } from "./hls-handler.js";
import { playIframe } from "./iframe-handler.js";
import { playWithClappr } from "./clappr-handler.js";

const videoPlayer = document.getElementById("video-player");
const iframePlayer = document.getElementById("iframe-player");
const channelNameEl = document.getElementById("current-channel-name");

export async function playSmartStream(originalUrl, label = "Unknown Channel") {
  const type = detectStreamType(originalUrl);
  const proxyURL = await getWorkingProxy(originalUrl);
  const url = proxyURL || originalUrl;

  // Εμφάνιση τίτλου
  if (channelNameEl) channelNameEl.textContent = label;

  // Απόκρυψη iframe / Reset
  iframePlayer.style.display = "none";
  videoPlayer.style.display = "block";
  videoPlayer.src = "";
  videoPlayer.pause();

  switch (type) {
    case "m3u8":
      playWithHLS(url);
      break;

    case "mp4":
    case "webm":
    case "ts":
      playNative(url);
      break;

    case "iframe":
      playIframe(url);
      break;

    case "strm":
      fetch(url)
        .then(res => res.text())
        .then(line => playSmartStream(line.trim(), label));
      break;

    default:
      playWithClappr(url);
      break;
  }
}

function detectStreamType(url) {
  url = url.toLowerCase();
  if (url.includes("iframe:")) return "iframe";
  if (url.endsWith(".m3u8")) return "m3u8";
  if (url.endsWith(".mp4")) return "mp4";
  if (url.endsWith(".webm")) return "webm";
  if (url.endsWith(".ts")) return "ts";
  if (url.endsWith(".strm")) return "strm";
  if (url.endsWith(".mpd")) return "mpd";
  return "unknown";
}

function playNative(url) {
  videoPlayer.src = url;
  videoPlayer.play();
}

import { showEPGFor } from "./epg.js";

export async function playSmartStream(originalUrl, label = "Κανάλι", epgId = null) {
  ...
  showEPGFor(epgId || label);
}


