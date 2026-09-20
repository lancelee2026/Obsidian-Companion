import {build} from "esbuild";
import {cp, mkdir, rm} from "node:fs/promises";

await rm("dist", {recursive: true, force: true});
await mkdir("dist", {recursive: true});

await build({
  entryPoints: {"main": "src/obsidian-main.ts"},
  outfile: "dist/main.js",
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "es2022",
  external: ["obsidian"],
  sourcemap: true,
  logLevel: "info"
});

await cp("obsidian/manifest.json", "dist/manifest.json");
