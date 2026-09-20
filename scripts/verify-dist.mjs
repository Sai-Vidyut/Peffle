import { readFileSync } from "node:fs";

const cliPath = "dist/cli/bin.js";
const src = readFileSync(cliPath, "utf8");
if (!src.includes('program.command("chat")')) {
  throw new Error(`${cliPath} is missing the chat command (stale dist?)`);
}
if (!src.includes(".version(")) {
  throw new Error(`${cliPath} is missing commander .version()`);
}
console.log("verify:dist ok");
