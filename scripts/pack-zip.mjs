import {readFileSync, writeFileSync, existsSync} from "node:fs";
import {crc32} from "node:zlib";

if (!existsSync("dist/main.js") || !existsSync("dist/manifest.json")) {
  throw new Error("Run pnpm build before packing the zip.");
}

function u16(n) {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(n);
  return buf;
}

function u32(n) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(n >>> 0);
  return buf;
}

function storeEntry(name, data, offset) {
  const nameBuf = Buffer.from(name, "utf8");
  const crc = crc32(data);
  const local = Buffer.concat([
    Buffer.from("PK\x03\x04", "binary"),
    u16(20),
    u16(0),
    u16(0),
    u16(0),
    u16(0),
    u32(crc),
    u32(data.length),
    u32(data.length),
    u16(nameBuf.length),
    u16(0),
    nameBuf,
    data
  ]);
  const central = Buffer.concat([
    Buffer.from("PK\x01\x02", "binary"),
    u16(20),
    u16(20),
    u16(0),
    u16(0),
    u16(0),
    u16(0),
    u32(crc),
    u32(data.length),
    u32(data.length),
    u16(nameBuf.length),
    u16(0),
    u16(0),
    u16(0),
    u16(0),
    u32(0),
    u32(offset),
    nameBuf
  ]);
  return {local, central};
}

const files = [
  {name: "main.js", data: readFileSync("dist/main.js")},
  {name: "manifest.json", data: readFileSync("dist/manifest.json")}
];

const locals = [];
const centrals = [];
let offset = 0;
for (const file of files) {
  const entry = storeEntry(file.name, file.data, offset);
  locals.push(entry.local);
  centrals.push(entry.central);
  offset += entry.local.length;
}

const central = Buffer.concat(centrals);
const eocd = Buffer.concat([
  Buffer.from("PK\x05\x06", "binary"),
  u16(0),
  u16(0),
  u16(files.length),
  u16(files.length),
  u32(central.length),
  u32(offset),
  u16(0)
]);

writeFileSync("dist/noteferry-companion.zip", Buffer.concat([...locals, central, eocd]));
