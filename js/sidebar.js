window.addEventListener("DOMContentLoaded", () => {
  loadM3UPlaylist("playlists/playlist.m3u");
});

async function loadM3UPlaylist(url) {
  try {
    const res = await fetch(url);
    const text = await res.text();
    const lines = text.split("\n");

    let channelName = "";
    const sidebar = document.getElementById("sidebar");

    lines.forEach((line) => {
      line = line.trim();
      if (line.startsWith("#EXTINF")) {
        const match = line.match(/tvg-name="(.*?)"/);
        channelName = match ? match[1] : "Άγνωστο Κανάλι";
      } else if (line && !line.startsWith("#")) {
        const streamURL = line;
        const entry = document.createElement("div");
        entry.className = "channel-entry";
        entry.textContent = channelName;
        entry.addEventListener("click", () => {
          window.playSmartStream(streamURL, channelName);
        });
        sidebar.appendChild(entry);
      }
    });
  } catch (err) {
    console.error("❌ Σφάλμα στη φόρτωση playlist:", err);
  }
}

