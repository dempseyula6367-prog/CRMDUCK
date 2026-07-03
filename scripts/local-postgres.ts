import path from "node:path";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import net from "node:net";
import EmbeddedPostgres from "embedded-postgres";
import pgClient from "pg";

const port = Number(process.env.LOCAL_POSTGRES_PORT ?? 5432);
const databaseName = process.env.LOCAL_POSTGRES_DATABASE ?? "crm_utf8";
const dataDir = path.join(process.cwd(), ".local-postgres");

const embeddedPg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port,
  persistent: true,
  onLog: () => undefined,
  onError: (message) => {
    if (message == null) return;
    const text = String(message);
    if (!text.includes("database system is ready to accept connections")) {
      console.error(text);
    }
  }
});

async function main() {
  const pgVersionFile = path.join(dataDir, "PG_VERSION");

  try {
    await fs.access(pgVersionFile);
  } catch {
    await fs.rm(dataDir, { recursive: true, force: true });
    await embeddedPg.initialise();
  }

  const alreadyListening = await isPortOpen(port);
  if (!alreadyListening) {
    await startPostgres();
  }

  await waitForDatabaseReady();

  const client = new pgClient.Client({
    host: "127.0.0.1",
    port,
    user: "postgres",
    password: "postgres",
    database: "postgres"
  });
  await client.connect();

  const exists = await client.query(
    "select 1 from pg_database where datname = $1",
    [databaseName]
  );

  if (exists.rowCount === 0) {
    await client.query(
      `create database ${quoteIdentifier(databaseName)} with template template0 encoding 'UTF8' lc_collate 'C' lc_ctype 'C'`
    );
  }

  await client.end();

  console.log(
    `Local PostgreSQL ready at 127.0.0.1:${port}, database ${databaseName}`
  );
}

process.on("SIGINT", async () => {
  await embeddedPg.stop().catch(() => undefined);
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await embeddedPg.stop().catch(() => undefined);
  process.exit(0);
});

main().catch(async (error) => {
  console.error(error);
  await embeddedPg.stop().catch(() => undefined);
  process.exit(1);
});

async function startPostgres() {
  if (process.platform === "win32") {
    const postgresExe = path.join(
      process.cwd(),
      "node_modules",
      "@embedded-postgres",
      "windows-x64",
      "native",
      "bin",
      "postgres.exe"
    );
    const command = `"${postgresExe}" -D "${dataDir}" -p ${port}`;
    const child = spawn("runas", ["/trustlevel:0x20000", command], {
      detached: true,
      stdio: "ignore",
      windowsHide: true
    });
    child.unref();
    return;
  }

  await embeddedPg.start();
}

async function waitForPort(targetPort: number) {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    if (await isPortOpen(targetPort)) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`PostgreSQL did not start on port ${targetPort}.`);
}

async function waitForDatabaseReady() {
  const deadline = Date.now() + 45_000;

  while (Date.now() < deadline) {
    const client = new pgClient.Client({
      host: "127.0.0.1",
      port,
      user: "postgres",
      password: "postgres",
      database: "postgres"
    });

    try {
      await client.connect();
      await client.end();
      return;
    } catch {
      await client.end().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
  }

  throw new Error("PostgreSQL did not become ready in time.");
}

function isPortOpen(targetPort: number) {
  return new Promise<boolean>((resolve) => {
    const socket = net.createConnection(
      { host: "127.0.0.1", port: targetPort },
      () => {
        socket.destroy();
        resolve(true);
      }
    );

    socket.on("error", () => resolve(false));
    socket.setTimeout(500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
