// Uses Python's standards-compliant csv.DictReader so quoted commas and newlines
// in the supplier sheet are handled as real CSV data.
import { spawnSync } from "node:child_process";

const result = spawnSync("py", ["scripts/build-catalogue.py"], { stdio: "inherit", shell: process.platform === "win32" });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
