const fs = require("fs");
const path = require("path");

const runtimeDir = path.join(__dirname, "..", "node_modules", "@prisma", "client", "runtime");

function ensureRuntimeDir() {
  if (!fs.existsSync(runtimeDir)) {
    console.warn(`[prepare-prisma-wasm] Runtime directory not found at ${runtimeDir}, skipping.`);
    return false;
  }
  return true;
}

function createBase64Wrapper(wasmPath) {
  const targetPath = wasmPath.replace(/\.wasm$/, ".wasm-base64.js");
  if (fs.existsSync(targetPath)) {
    return;
  }

  const wasmBuffer = fs.readFileSync(wasmPath);
  const base64 = wasmBuffer.toString("base64");
  const content = `module.exports = { wasm: "${base64}" };`;

  fs.writeFileSync(targetPath, content);
  console.info(`[prepare-prisma-wasm] Created ${path.basename(targetPath)}`);
}

function run() {
  if (!ensureRuntimeDir()) {
    return;
  }

  const entries = fs.readdirSync(runtimeDir);
  const wasmFiles = entries.filter((file) => file.endsWith(".wasm"));

  if (wasmFiles.length === 0) {
    console.warn("[prepare-prisma-wasm] No WASM files found to convert.");
    return;
  }

  wasmFiles.forEach((file) => {
    const wasmPath = path.join(runtimeDir, file);
    createBase64Wrapper(wasmPath);
  });
}

run();
