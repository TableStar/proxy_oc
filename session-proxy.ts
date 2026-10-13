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
  // default 10s kills streaming responses mid-flight; proxy streams can be quiet for minutes
  idleTimeout: 0,
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
      verbose: true,
    });

    // return new Response(res.body, { status: res.status, headers: res.headers });
    
    const outHeaders = new Headers(res.headers)
    outHeaders.delete('content-encoding')
    outHeaders.delete('content-length')
    outHeaders.delete('transfer-encoding')
    return new Response(res.body, { status: res.status, headers:outHeaders });
  },
  error(err) {
    console.error(`[proxy] upstream failed: ${err}`);
    return new Response("upstream unavailable", { status: 502 });
  },
});

console.log(`Session proxy on :8787 -> ${TARGET} [${sessionId}]`);
