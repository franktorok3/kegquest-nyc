import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { updateDropHistory, type DropHistory } from "../src/lib/drops/history";
const file = "src/data/beer-drops.json";
let history: DropHistory = {};
if (process.argv.includes("--bootstrap")) {
  const commits = execFileSync("git", ["log", "--reverse", "--format=%H", "--", "src/data/breweries.json"], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  for (const sha of commits) {
    const menus = JSON.parse(execFileSync("git", ["show", `${sha}:src/data/breweries.json`], { encoding: "utf8" }));
    history = updateDropHistory(history, menus);
  }
} else {
  try { history = JSON.parse(await fs.readFile(file, "utf8")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
}
history = updateDropHistory(history, JSON.parse(await fs.readFile("src/data/breweries.json", "utf8")));
await fs.writeFile(file, JSON.stringify(history, null, 2) + "\n");
console.log("Updated first-spotted history for", Object.keys(history).length, "menus");
