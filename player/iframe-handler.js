export function playIframe(url) {
  const video = document.getElementById("video-player");
  const iframe = document.getElementById("iframe-player");

  video.pause();
  video.src = "";
  video.style.display = "none";

  iframe.style.display = "block";

  // Αν το url είναι τύπου "iframe:https://example.com"
  if (url.startsWith("iframe:")) {
    url = url.replace("iframe:", "").trim();
  }

  iframe.src = url;
}

