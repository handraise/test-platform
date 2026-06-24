// The agent-browser dashboard binds 127.0.0.1 only (no host flag). Forward
// 0.0.0.0:LISTEN -> 127.0.0.1:TARGET so it's reachable via the published port.
// Raw TCP piping passes both HTTP and the live-viewport WebSocket.
import net from "node:net";

const LISTEN = Number(process.env.DASH_PROXY_LISTEN || 4848);
const TARGET = Number(process.env.DASH_PROXY_TARGET || 14848);

net
  .createServer((client) => {
    const upstream = net.connect(TARGET, "127.0.0.1");
    client.pipe(upstream);
    upstream.pipe(client);
    const close = () => {
      client.destroy();
      upstream.destroy();
    };
    client.on("error", close);
    upstream.on("error", close);
  })
  .listen(LISTEN, "0.0.0.0", () =>
    console.log(`dash-proxy: 0.0.0.0:${LISTEN} -> 127.0.0.1:${TARGET}`),
  );
