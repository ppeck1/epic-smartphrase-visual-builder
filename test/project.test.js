const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

test("the public release is offline and contains its privacy metadata", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(html, /<meta name="referrer" content="no-referrer">/);
  assert.match(html, /Not connected to Epic/);
  assert.doesNotMatch(html, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon\s*\(/);
});

test("every inline script parses", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  assert.ok(scripts.length >= 2, "expected the shared core and browser application scripts");
  scripts.forEach((source, index) => assert.doesNotThrow(() => new vm.Script(source, {filename: `inline-${index + 1}.js`})));
});

test("editable application source stays split into small concerns", () => {
  const appDir = path.join(root, "src", "js", "app");
  const modules = fs.readdirSync(appDir).filter((name) => name.endsWith(".js"));
  assert.ok(modules.length >= 10, "expected multiple focused application modules");
  for (const name of modules) {
    const lines = fs.readFileSync(path.join(appDir, name), "utf8").split(/\r?\n/).length;
    assert.ok(lines <= 260, `${name} has ${lines} lines; split it before adding more`);
  }
});

test("every source module carries a human handoff note", () => {
  const directories = [path.join(root, "src", "js", "app")];
  for (const directory of directories) {
    for (const name of fs.readdirSync(directory).filter((item) => item.endsWith(".js"))) {
      const source = fs.readFileSync(path.join(directory, name), "utf8");
      assert.match(source, /\* Future work:/, `${name} needs a searchable future-work note`);
    }
  }
});

test("build tools honor the stated Node 18 floor", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(manifest.engines.node, ">=18");

  for (const name of ["build.mjs", "dev-server.mjs"]) {
    const source = fs.readFileSync(path.join(root, "scripts", name), "utf8");
    assert.doesNotMatch(source, /import\.meta\.dirname/, `${name} uses a Node 20.11 API`);
    assert.match(source, /fileURLToPath\(import\.meta\.url\)/, `${name} needs Node 18-compatible module paths`);
  }
});
