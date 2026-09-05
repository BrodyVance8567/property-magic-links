import { createServer } from "node:http";
import { createMagicLinkRequest, InfraiError } from "./magic_link_service.js";

const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/magic-link") { res.writeHead(404).end(); return; }
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const result = await createMagicLinkRequest(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(result));
  } catch (error) {
    const status = error instanceof InfraiError && error.status < 500 ? 400 : 500;
    res.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify({ error: error instanceof Error ? error.message : "request failed" }));
  }
});
server.listen(Number(process.env.PORT ?? 3000), () => console.log("property service listening"));
