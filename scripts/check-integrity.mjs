import { spawnSync } from "node:child_process";

const result = spawnSync(
  "git",
  ["status", "--porcelain", "--untracked-files=all"],
  {
    encoding: "utf8",
    shell: false,
    windowsHide: true,
  },
);
if (result.error !== undefined) throw result.error;
if (result.status !== 0) throw new Error(result.stderr || "git status failed.");
if (result.stdout.trim() !== "") {
  throw new Error(
    `Starter execution mutated tracked state:\n${result.stdout.trim()}`,
  );
}
console.log("repository integrity: clean");
