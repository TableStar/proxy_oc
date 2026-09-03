// session-proxy.ts
const TARGET = "https://opencode.ai/zen/go";
let sessionId = crypto.randomUUID();

setInterval(
  () => {
    sessionId = crypto.randomUUID();
    console.log(`rotated session -> ${sessionId}`);
  },
  60 * 60 * 1000,
);

Bun.serve({
  port: 8787,
  async fetch(req) {
    const url = new URL(req.url);
    const targetUrl = TARGET + url.pathname + url.search;

    const headers = new Headers(req.headers);
    headers.set("x-opencode-session", sessionId);
    headers.delete("host");

    const res = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
      duplex: "half",
    });

    return new Response(res.body, { status: res.status, headers: res.headers });
  },
});

console.log(`Session proxy on :8787 -> ${TARGET} [${sessionId}]`);
