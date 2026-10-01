import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

// Convert the module URL explicitly to keep the documented Node 18 floor.
const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(moduleDirectory, "..");
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

function readNormalized(filename) {
  return fs.readFileSync(filename, "utf8").replace(/\r\n/g, "\n");
}

function readJoined(directory, extension) {
  return orderedFiles(directory, extension)
    .map((name) => `/* Source: ${path.relative(root, path.join(directory, name)).replaceAll("\\", "/")} */\n${readNormalized(path.join(directory, name)).trim()}`)
    .join("\n\n");
}

const template = readNormalized(templatePath);
const styles = readJoined(stylesDir, ".css");
const core = readNormalized(corePath).trim();
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
