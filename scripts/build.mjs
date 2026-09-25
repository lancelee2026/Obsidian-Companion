import {build} from "esbuild";
import {cp, mkdir, rm} from "node:fs/promises";
import {existsSync} from "node:fs";
import {join} from "node:path";

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

await cp("manifest.json", "dist/manifest.json");

const vaultPlugin = process.env.NOTEFERRY_VAULT_PLUGIN
  ?? join(process.env.HOME ?? "", "Documents/Obsidian Vault/.obsidian/plugins/noteferry-companion");
if (existsSync(vaultPlugin)) {
  await cp("dist/main.js", join(vaultPlugin, "main.js"));
  await cp("dist/main.js.map", join(vaultPlugin, "main.js.map"));
  await cp("dist/manifest.json", join(vaultPlugin, "manifest.json"));
  console.log(`installed to ${vaultPlugin}`);
}
