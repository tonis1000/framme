import { getWorkingProxy } from "./proxy-handler.js";
import { playWithHLS } from "./hls-handler.js";
import { playIframe } from "./iframe-handler.js";
import { playWithClappr } from "./clappr-handler.js";
import { showEPGFor } from "./epg.js";

const videoPlayer = document.getElementById("video-player");
const iframePlayer = document.getElementById("iframe-player");
const channelNameEl = document.getElementById("current-channel-name");

export async function playSmartStream(originalUrl, label = "Κανάλι", epgId = null) {
  const type = detectStreamType(originalUrl);
  const proxyURL = await getWorkingProxy(originalUrl);
  const url = proxyURL || originalUrl;

  // Εμφάνιση τίτλου (θα το αντικατασταθεί αν υπάρχει EPG ή logos)
  if (channelNameEl) {
    channelNameEl.innerHTML = `<strong>${label}</strong>`;
  }

  // Απόκρυψη iframe, reset video
  iframePlayer.style.display = "none";
  iframePlayer.src = "";
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
        .then(line => playSmartStream(line.trim(), label, epgId));
      break;

    default:
      playWithClappr(url);
      break;
  }

  // ➕ Εμφάνιση EPG, αν υπάρχει
  showEPGFor(epgId || label);
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
