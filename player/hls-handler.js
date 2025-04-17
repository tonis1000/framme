export function playWithHLS(url) {
  const video = document.getElementById("video-player");
  const iframe = document.getElementById("iframe-player");

  iframe.style.display = "none";
  video.style.display = "block";

  // Αν ο browser υποστηρίζει native HLS (π.χ. Safari)
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = url;
    video.play();
    return;
  }

  // Αν υποστηρίζεται HLS.js
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play();
    });

    hls.on(Hls.Events.ERROR, function (event, data) {
      console.error("HLS.js Error:", data);
    });
  } else {
    console.warn("❌ HLS not supported in this browser.");
    video.src = url;
    video.play(); // δοκιμάζει anyway
  }
}

