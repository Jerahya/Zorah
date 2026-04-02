#!/usr/bin/env node
// Usage: npm run version:set -- 1.2.3
import { readFileSync, writeFileSync } from "fs";

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error("Usage: npm run version:set -- <major.minor.patch>");
  process.exit(1);
}

const files = [
  {
    path: "package.json",
    update: (raw) => {
      const json = JSON.parse(raw);
      json.version = version;
      return JSON.stringify(json, null, 2) + "\n";
    },
  },
  {
    path: "src-tauri/tauri.conf.json",
    update: (raw) => {
      const json = JSON.parse(raw);
      json.version = version;
      return JSON.stringify(json, null, 2) + "\n";
    },
  },
  {
    path: "src-tauri/Cargo.toml",
    update: (raw) =>
      raw.replace(/^version = "[\d.]+"$/m, `version = "${version}"`),
  },
];

for (const { path, update } of files) {
  const raw = readFileSync(path, "utf8");
  writeFileSync(path, update(raw));
  console.log(`✓ ${path}`);
}

console.log(`\nAll files updated to ${version}`);
