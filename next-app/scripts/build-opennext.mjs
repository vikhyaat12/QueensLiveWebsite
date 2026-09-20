import { pathToFileURL } from "node:url";
import { join } from "node:path";
import fs from "node:fs";

// Pre-clean output directory cleanly before OpenNext runs to prevent Windows rmSync EPERM
const openNextDir = join(process.cwd(), ".open-next");
if (fs.existsSync(openNextDir)) {
  try {
    fs.rmSync(openNextDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  } catch (e) {
    try {
      for (const file of fs.readdirSync(openNextDir)) {
        fs.rmSync(join(openNextDir, file), { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
      }
    } catch (_) {}
  }
}
// Ensure .next/standalone/.next exists even if Next nested it under package subfolder
const standaloneNext = join(process.cwd(), ".next", "standalone", ".next");
const nestedStandaloneNext = join(process.cwd(), ".next", "standalone", "next-app", ".next");
if (!fs.existsSync(standaloneNext) && fs.existsSync(nestedStandaloneNext)) {
  fs.cpSync(nestedStandaloneNext, standaloneNext, { recursive: true });
}

const utilsPath = pathToFileURL(join(process.cwd(), "node_modules/@opennextjs/cloudflare/dist/cli/commands/utils/utils.js")).href;
const buildPath = pathToFileURL(join(process.cwd(), "node_modules/@opennextjs/cloudflare/dist/cli/build/build.js")).href;

const { compileConfig, getNormalizedOptions, nextAppDir, readWranglerConfig } = await import(utilsPath);
const { build: buildImpl } = await import(buildPath);

async function main() {
  console.log("Building OpenNext Cloudflare bundle...");
  const { config, buildDir } = await compileConfig();
  const options = getNormalizedOptions(config, buildDir);
  const projectOpts = { minify: true, sourceDir: nextAppDir, skipNextBuild: true };
  const wranglerConfig = await readWranglerConfig({});
  await buildImpl(options, config, projectOpts, wranglerConfig, true);
  console.log("OpenNext bundle built successfully.");
}

main().catch((err) => {
  console.error("OpenNext build failed:", err);
  process.exit(1);
});
