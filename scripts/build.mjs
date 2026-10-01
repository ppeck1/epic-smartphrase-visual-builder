import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const templatePath = path.join(root, "src", "index.template.html");
const stylesDir = path.join(root, "src", "styles");
const corePath = path.join(root, "src", "js", "core.js");
const appDir = path.join(root, "src", "js", "app");
const outputPath = path.join(root, "index.html");

function orderedFiles(directory, extension) {
  return fs.readdirSync(directory)
    .filter((name) => name.endsWith(extension))
    .sort((a, b) => a.localeCompare(b, "en"));
}

function readJoined(directory, extension) {
  return orderedFiles(directory, extension)
    .map((name) => `/* Source: ${path.relative(root, path.join(directory, name)).replaceAll("\\", "/")} */\n${fs.readFileSync(path.join(directory, name), "utf8").trim()}`)
    .join("\n\n");
}

const template = fs.readFileSync(templatePath, "utf8");
const styles = readJoined(stylesDir, ".css");
const core = fs.readFileSync(corePath, "utf8").trim();
const application = readJoined(appDir, ".js");

if (!template.includes("<!-- @styles -->") || !template.includes("<!-- @scripts -->")) {
  throw new Error("The HTML template is missing a build placeholder.");
}

const built = template
  .replace("<!-- @styles -->", `<style>\n${styles}\n</style>`)
  .replace("<!-- @scripts -->", `<script>\n${core}\n</script>\n<script>\n"use strict";\n(function () {\n${application}\n})();\n</script>`);

if (process.argv.includes("--check")) {
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : "";
  if (current !== built) {
    console.error("index.html is not current. Run: npm run build");
    process.exitCode = 1;
  } else {
    console.log("index.html matches the modular source.");
  }
} else {
  fs.writeFileSync(outputPath, built);
  console.log(`Built ${path.relative(root, outputPath)} from ${orderedFiles(stylesDir, ".css").length} style modules and ${orderedFiles(appDir, ".js").length} application modules.`);
}
