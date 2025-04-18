let epgData = [];

window.addEventListener("DOMContentLoaded", () => {
  fetchEPG("https://iptv-org.github.io/epg/greece.xml");
});

async function fetchEPG(xmlUrl) {
  try {
    const res = await fetch(xmlUrl);
    const xml = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");
    const items = [...doc.querySelectorAll("programme")];

    epgData = items.map(el => ({
      channel: el.getAttribute("channel"),
      start: parseDate(el.getAttribute("start")),
      stop: parseDate(el.getAttribute("stop")),
      title: el.querySelector("title")?.textContent || "",
      desc: el.querySelector("desc")?.textContent || ""
    }));
  } catch (err) {
    console.error("❌ Σφάλμα EPG:", err);
  }
}

function parseDate(str) {
  const y = str.slice(0, 4);
  const m = str.slice(4, 6) - 1;
  const d = str.slice(6, 8);
  const h = str.slice(8, 10);
  const min = str.slice(10, 12);
  return new Date(Date.UTC(y, m, d, h, min));
}

export function showEPGFor(channelName) {
  if (!epgData.length) return;

  const now = new Date();
  const relevant = epgData.filter(p => p.channel.toLowerCase().includes(channelName.toLowerCase()));

  const current = relevant.find(p => now >= p.start && now < p.stop);
  const next = relevant.find(p => p.start > now);

  const el = document.getElementById("current-channel-name");
  if (!el) return;

  let html = `<strong>${channelName}</strong>`;
  if (current) {
    html += `<br>▶️ <strong>${formatTime(current.start)}-${formatTime(current.stop)}</strong>: ${current.title}`;
  }
  if (next) {
    html += `<br>⏭️ <strong>${formatTime(next.start)}-${formatTime(next.stop)}</strong>: ${next.title}`;
  }

  el.innerHTML = html;
}

function formatTime(date) {
  return date.toTimeString().slice(0, 5);
}

