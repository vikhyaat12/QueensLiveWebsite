const { spawnSync } = require("child_process");
const fs = require("fs");

const res = spawnSync("node", ["scratch/test-universal-promotions-suite.mjs"], {
  cwd: "c:\\Project\\QueensCareWebsite\\next-app",
  encoding: "utf-8"
});

const out = `STDOUT:\n${res.stdout}\nSTDERR:\n${res.stderr}\nEXIT: ${res.status}\n`;
fs.writeFileSync("scratch/debug-result.txt", out, "utf-8");
console.log(out);
