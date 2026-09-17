import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const vite = fileURLToPath(
  new URL("../node_modules/vite/bin/vite.js", import.meta.url),
);
const commands = [
  ["build", "--watch"],
  ["preview", "--host", "127.0.0.1", "--port", "8080", "--strictPort"],
];

const children = commands.map((args) =>
  spawn(process.execPath, [vite, ...args], { stdio: "inherit" }),
);
let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;
  for (const child of children) child.kill();
}

for (const child of children) {
  child.on("error", (error) => {
    console.error(error);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping) stop(code || 1);
  });
}

process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
