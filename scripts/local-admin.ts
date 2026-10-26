/**
 * Creates a throwaway admin in the local SQLite database (BULBULA_LOCAL_DB=1 only),
 * for trying the admin on `npm run dev:local`. The credentials are written to
 * bulbula-local.credentials, which git ignores. Never runs against Neon.
 */
import { randomBytes } from "crypto";
import { writeFile } from "fs/promises";
import { getPayload } from "payload";
import config from "@payload-config";

if (process.env.BULBULA_LOCAL_DB !== "1") throw new Error("Only for the local SQLite database: set BULBULA_LOCAL_DB=1.");

const payload = await getPayload({ config });
const email = "local-admin@bulbula.test";
const password = randomBytes(12).toString("base64url");
await payload.delete({ collection: "users", where: { email: { equals: email } } });
await payload.create({ collection: "users", data: { email, password, name: "Local test admin", role: "admin" } });
await writeFile("bulbula-local.credentials", `email=${email}\npassword=${password}\n`);
payload.logger.info(`Local admin written to bulbula-local.credentials`);
process.exit(0);
