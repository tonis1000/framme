window.addEventListener("DOMContentLoaded", () => {
  loadSportProgram("https://foothubhd.online/program.txt");
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

          const isLive = checkIfLive(time);
          entry.innerHTML = `${isLive ? '<span class="live-indicator">🔴</span>' : ''}${time} ${titleWithTeams}`;

          const links = [...line.matchAll(/\[(Link[^\]]+)]\((.*?)\)/g)];
          const linkContainer = document.createElement("div");
          linkContainer.style.display = "none";

          links.forEach(([full, label, url]) => {
            const a = document.createElement("a");
            a.href = "#";
            a.className = "link-entry";
            a.textContent = label;
            a.addEventListener("click", (e) => {
              e.preventDefault();
              showMatchLogos(titleWithTeams);
window.playSmartStream("iframe:" + url, titleWithTeams);

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
    console.error("❌ Σφάλμα φόρτωσης sport program:", err);
  }
}

function isDay(line) {
  return /^[Α-Ωα-ω]+\s\d{1,2}\/\d{1,2}\/\d{4}$/.test(line);
}

function checkIfLive(timeStr) {
  const now = new Date();
  const [h, m] = timeStr.split(":").map(Number);
  const matchTime = new Date();
  matchTime.setHours(h, m, 0, 0);

  const diff = Math.abs(now - matchTime);
  return diff < 100 * 60 * 1000;
}
async function showMatchLogos(title) {
  const logoData = await fetch("assets/logos/team-logos.json").then(res => res.json());
  const [teamA, teamB] = title.split(" - ").map(t => t.trim());

  const logoA = logoData[teamA];
  const logoB = logoData[teamB];
  const container = document.getElementById("current-channel-name");

  if (logoA && logoB) {
    container.innerHTML = `
      <img src="${logoA}" alt="${teamA}" style="height:30px;vertical-align:middle;margin-right:5px;">
      <strong style="color:white;">VS</strong>
      <img src="${logoB}" alt="${teamB}" style="height:30px;vertical-align:middle;margin-left:5px;">
    `;
  } else {
    container.textContent = title;
  }
}

