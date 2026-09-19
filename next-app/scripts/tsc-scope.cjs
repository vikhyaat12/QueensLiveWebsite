/* Scoped typecheck — runs tsc on the whole program but reports only errors in
   the files passed on argv (fast on machines where full tsc is too slow). */
const ts = require("typescript");
const path = require("path");
const fs = require("fs");

const configFile = ts.readConfigFile("./tsconfig.json", ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, ".");
const program = ts.createProgram(parsed.fileNames, parsed.options);

const targets = process.argv.slice(2).map((t) => path.resolve(t));
let errors = 0;
const diagnostics = ts.getPreEmitDiagnostics(program);
for (const d of diagnostics) {
  const f = d.file ? path.resolve(d.file.fileName) : "";
  if (!targets.length || targets.some((t) => f === t)) {
    errors++;
    const pos = d.file && d.start != null ? d.file.getLineAndCharacterOfPosition(d.start) : null;
    console.error(`${d.file ? d.file.fileName : "<global>"}:${pos ? pos.line + 1 : "?"} — ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`);
  }
}
console.log(errors === 0 ? "SCOPED-TSC: CLEAN" : `SCOPED-TSC: ${errors} error(s)`);
process.exit(0); // report-only
