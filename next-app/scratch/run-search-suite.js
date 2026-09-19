const { spawnSync } = require("child_process");

const res = spawnSync("node", ["scratch/test-search-suite.mjs"], {
  cwd: "c:\\Project\\QueensCareWebsite\\next-app",
  encoding: "utf-8"
});

console.log(`STDOUT:\n${res.stdout}\nSTDERR:\n${res.stderr}\nEXIT: ${res.status}`);
