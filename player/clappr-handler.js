export function playWithClappr(url) {
  const video = document.getElementById("video-player");
  const iframe = document.getElementById("iframe-player");

  // Καθαρίζουμε προηγούμενους players
  video.style.display = "none";
  iframe.style.display = "none";
  document.getElementById("player-container").innerHTML = "";

  // Δημιουργία Clappr div
  const clapprDiv = document.createElement("div");
  clapprDiv.id = "clappr-player";
  clapprDiv.style.width = "100%";
  clapprDiv.style.height = "100%";
  document.getElementById("player-container").appendChild(clapprDiv);

  new Clappr.Player({
    source: url,
    parentId: "#clappr-player",
    autoPlay: true,
    mute: false,
    width: "100%",
    height: "100%",
    mediacontrol: { seekbar: "#0f0", buttons: "#fff" },
  });
}

