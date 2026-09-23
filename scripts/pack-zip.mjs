import {execFileSync} from "node:child_process";
import {existsSync} from "node:fs";

if (!existsSync("dist/main.js") || !existsSync("dist/manifest.json")) {
  throw new Error("Run pnpm build before packing the zip.");
}

execFileSync("zip", ["-j", "dist/noteferry-companion.zip", "dist/main.js", "dist/manifest.json"], {
  stdio: "inherit"
});
