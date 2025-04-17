const proxyList = [
  "https://tonis-proxy.onrender.com",
  "https://cors-anywhere-production-d9b6.up.railway.app",
  "https://corsproxy.io/?", // fallback generic
];

export async function getWorkingProxy(originalUrl) {
  for (const proxy of proxyList) {
    const testUrl = formatProxyURL(proxy, originalUrl);
    if (await isPlayable(testUrl)) {
      console.log(`✅ Proxy working: ${proxy}`);
      return testUrl;
    }
  }
  console.warn("❌ No working proxy found.");
  return null;
}

function formatProxyURL(proxy, url) {
  if (proxy.endsWith("/")) proxy = proxy.slice(0, -1);
  if (proxy.includes("corsproxy.io")) {
    return `${proxy}${encodeURIComponent(url)}`;
  }
  return `${proxy}/${url}`;
}

async function isPlayable(testUrl) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(testUrl, {
      method: "HEAD",
      mode: "cors",
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return res.ok;
  } catch (err) {
    return false;
  }
}

