import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entry = fileURLToPath(import.meta.resolve("flowtract"));
let directory = path.dirname(entry);
let manifestPath;
while (directory !== path.dirname(directory)) {
  const candidate = path.join(directory, "package.json");
  try {
    const manifest = JSON.parse(await readFile(candidate, "utf8"));
    if (manifest.name === "flowtract") {
      manifestPath = candidate;
      if (manifest.version !== "0.1.0") {
        throw new Error(
          `Expected flowtract@0.1.0, received ${String(manifest.version)}.`,
        );
      }
      break;
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  directory = path.dirname(directory);
}
if (manifestPath === undefined)
  throw new Error("Unable to locate the installed Flowtract manifest.");
const relative = path.relative(root, manifestPath).replaceAll("\\", "/");
if (!relative.startsWith("node_modules/flowtract/")) {
  throw new Error(
    `Flowtract must resolve from the registry installation, received ${relative}.`,
  );
}
console.log("registry dependency: flowtract@0.1.0");
