import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

// Keep Playwright's short-lived transform cache inside the project so the test
// behaves the same on locked-down Windows machines and ordinary CI runners.
const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(moduleDirectory, "..");
const tempDirectory = path.join(root, ".playwright-tmp");
const cli = path.join(root, "node_modules", "@playwright", "test", "cli.js");

fs.mkdirSync(tempDirectory, {recursive: true});

const result = spawnSync(process.execPath, [cli, "test"], {
  cwd: root,
  env: {
    ...process.env,
    TEMP: tempDirectory,
    TMP: tempDirectory,
    TMPDIR: tempDirectory
  },
  stdio: "inherit"
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
