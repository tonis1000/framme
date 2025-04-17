window.addEventListener("DOMContentLoaded", () => {
  loadSportProgram("playlists/sport-program.txt");
});

async function loadSportProgram(url) {
  try {
    const res = await fetch(url);
    const lines = (await res.text()).split("\n");

    const sidebar = document.getElementById("sidebar");
    let currentDay = "";

    lines.forEach((line) => {
      line = line.trim();
      if (line === "") return;

      if (isDay(line)) {
        currentDay = line;
        const dayHeader = document.createElement("div");
        dayHeader.textContent = line;
        dayHeader.style.color = "red";
        dayHeader.style.fontWeight = "bold";
        dayHeader.style.marginTop = "10px";
        sidebar.appendChild(dayHeader);
      } else {
        const match = line.match(/^(\d{1,2}:\d{2})\s+(.*?)\s+\[(Link[^\]]+)]/);
        if (match) {
          const [_, time, titleWithTeams, firstLink] = match;
          const entry = document.createElement("div");
          entry.className = "sport-entry";

          // Αν το ματς είναι live, βάλε 🔴
          const isLive = checkIfLive(time);
          entry.innerHTML = `${isLive ? '<span class="live-indicator">🔴</span>' : ''}${time} ${titleWithTeams}`;

          // Κρυφά links
          const links = [...line.matchAll(/\[(Link[^\]]+)]/g)].map(m => m[1]);
          const linkContainer = document.createElement("div");
          linkContainer.style.display = "none";

          links.forEach(linkName => {
            const a = document.createElement("a");
            a.href = "#";
            a.className = "link-entry";
            a.textContent = linkName;
            a.addEventListener("click", (e) => {
              e.preventDefault();
              const streamUrl = extractStreamUrl(line, linkName);
              window.playSmartStream("iframe:" + streamUrl, titleWithTeams);
            });
            linkContainer.appendChild(a);
          });

          entry.appendChild(linkContainer);
          entry.addEventListener("click", () => {
            linkContainer.style.display = linkContainer.style.display === "none" ? "block" : "none";
          });

          sidebar.appendChild(entry);
        }
      }
    });
  } catch (err) {
    console.error("❌ Σφάλμα sport program:", err);
  }
}

function isDay(line) {
  return /^[Α-Ωα-ω]+\s\d{1,2}\/\d{1,2}\/\d{4}$/.test(line);
}

function extractStreamUrl(text, label) {
  const regex = new RegExp(`\\[${label}]\\((.*?)\\)`);
  const match = text.match(regex);
  return match ? match[1] : "";
}

function checkIfLive(timeStr) {
  const now = new Date();
  const [h, m] = timeStr.split(":").map(Number);
  const matchTime = new Date();
  matchTime.setHours(h, m, 0, 0);

  const diff = Math.abs(now - matchTime);
  return diff < 100 * 60 * 1000; // 100 λεπτά κοντά στο live
}
