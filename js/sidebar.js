window.addEventListener("DOMContentLoaded", () => {
  loadTV();
  setupViewButtons();
});

function setupViewButtons() {
  document.getElementById("tv-view-btn").addEventListener("click", loadTV);
  document.getElementById("sport-view-btn").addEventListener("click", loadSport);
}

function loadTV() {
  clearSidebar();
  loadM3UPlaylist("playlists/playlist.m3u");
}

function loadSport() {
  clearSidebar();
  loadSportProgram("https://foothubhd.online/program.txt");
}

function clearSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.innerHTML = "";
}

async function loadM3UPlaylist(url) {
  try {
    const res = await fetch(url);
    const text = await res.text();
    const lines = text.split("\n");

    let channelName = "";
    let tvgId = "";
    const sidebar = document.getElementById("sidebar");

    lines.forEach((line, index) => {
      line = line.trim();

      if (line.startsWith("#EXTINF")) {
        const nameMatch = line.match(/tvg-name="([^"]+)"/);
        const idMatch = line.match(/tvg-id="([^"]+)"/);

        channelName = nameMatch ? nameMatch[1] : "Άγνωστο Κανάλι";
        tvgId = idMatch ? idMatch[1] : null;

      } else if (line && !line.startsWith("#")) {
        const streamURL = line;
        const entry = document.createElement("div");
        entry.className = "channel-entry";
        entry.textContent = channelName;
        entry.addEventListener("click", () => {
          window.playSmartStream(streamURL, channelName, tvgId);
        });
        sidebar.appendChild(entry);
      }
    });
  } catch (err) {
    console.error("❌ Σφάλμα στη φόρτωση playlist:", err);
  }
}


document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase();
      document.querySelectorAll(".channel-entry, .sport-entry").forEach(el => {
        el.style.display = el.textContent.toLowerCase().includes(query) ? "block" : "none";
      });
    });
  }
});

