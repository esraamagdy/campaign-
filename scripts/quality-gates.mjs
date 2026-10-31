import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// A local runner; adding this script does not enable any hosted CI service.
const cwd = fileURLToPath(new URL("../", import.meta.url));
const env = {
  ...process.env,
  AI_MODE: "demo",
  FAL_KEY: "",
  FORMA_LIVE_TESTS: "0",
};
const commands = [
  ["test"],
  ["run", "lint"],
  ["run", "typecheck"],
  ["run", "build", "--", "--webpack"],
  ["run", "test:e2e"],
  ["run", "test:e2e:live"],
];
for (const args of commands) {
  const result = spawnSync("npm", args, { cwd, env, stdio: "inherit" });
  if (result.error) {
    console.error(`Could not start quality check: npm ${args.join(" ")}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
