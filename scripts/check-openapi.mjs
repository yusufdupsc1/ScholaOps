import { readFileSync } from "node:fs";

const OPENAPI_PATH = new URL("../docs/openapi/v1.yaml", import.meta.url);
const raw = readFileSync(OPENAPI_PATH, "utf8");

const required = [
  "/students:",
  "/teachers:",
  "/classes:",
  "/attendance:",
  "/grades:",
  "/finance:",
  "/events:",
  "/announcements:",
  "/settings:",
  "/realtime/attendance:",
  "/realtime/announcements:",
  "/realtime/notifications:",
  "/security/2fa:",
  "/push/subscribe:",
];

const missing = required.filter((token) => !raw.includes(token));

if (missing.length > 0) {
  console.error("OpenAPI contract missing required paths:");
  for (const item of missing) {
    console.error(` - ${item}`);
  }
  process.exit(1);
}

console.log("OpenAPI contract check passed.");
