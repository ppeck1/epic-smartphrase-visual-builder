import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const screenshots = path.join(root, "docs", "screenshots");
const portArg = process.argv.find((value) => /^\d+$/.test(value));
const port = Number(portArg || 9139);
const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"]
]);

function reply(response, status, body, type = "text/plain; charset=utf-8") {
  response.writeHead(status, {"Content-Type": type, "Cache-Control": "no-store"});
  response.end(body);
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || `127.0.0.1:${port}`}`);

  if (request.method === "POST" && url.pathname.startsWith("/__screenshots/")) {
    const name = path.basename(url.pathname);
    if (!/^[a-z0-9-]+\.png$/i.test(name)) return reply(response, 400, "Invalid screenshot name.");
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > 10 * 1024 * 1024) request.destroy();
      else chunks.push(chunk);
    });
    request.on("end", () => {
      fs.mkdirSync(screenshots, {recursive: true});
      fs.writeFileSync(path.join(screenshots, name), Buffer.concat(chunks));
      reply(response, 201, `Saved ${name}.`);
    });
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") return reply(response, 405, "Method not allowed.");
  const relative = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname).replace(/^[/\\]+/, "");
  const requested = path.resolve(root, relative);
  if (requested !== root && !requested.startsWith(`${root}${path.sep}`)) return reply(response, 403, "Forbidden.");
  if (!fs.existsSync(requested) || !fs.statSync(requested).isFile()) return reply(response, 404, "Not found.");
  response.writeHead(200, {"Content-Type": mime.get(path.extname(requested).toLowerCase()) || "application/octet-stream", "Cache-Control": "no-store"});
  if (request.method === "HEAD") response.end();
  else fs.createReadStream(requested).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`SmartPhrase Builder preview: http://127.0.0.1:${port}/`);
});
