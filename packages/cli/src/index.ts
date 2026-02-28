/**
 * DirX CLI — Unified Gateway & CLI for Agents.
 *
 * Entry point: registers all commands with Commander.js.
 * Performance: commands use dynamic import() for lazy loading.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Command } from "commander";

const __dirname = dirname(fileURLToPath(import.meta.url));

let version = "0.0.0";
try {
    const pkg = JSON.parse(
        readFileSync(resolve(__dirname, "../package.json"), "utf-8"),
    );
    version = pkg.version;
} catch {
    // running in bundled mode — version will be embedded by tsup
}

const program = new Command();

program
    .name("dirx")
    .description("DirX — Unified Gateway & CLI for Agents")
    .version(version)
    .option("--json", "Output raw JSON instead of human-readable text");

// --- Auth ---
program
    .command("auth")
    .description("Authenticate with the DirX gateway")
    .option("--gateway-url <url>", "Gateway URL (default: https://api.dirx.ai)")
    .action(async (opts: Record<string, string | undefined>) => {
        const { runAuth } = await import("./commands/auth.js");
        await runAuth({ gatewayUrl: opts.gatewayUrl });
    });

// --- Init (local) ---
program
    .command("init")
    .description("Initialize DirX in the current project")
    .argument("[dir]", "Project directory", ".")
    .action(async (dir: string) => {
        const { runInit } = await import("./commands/init.js");
        await runInit(dir);
    });

// --- Generate (local, with optional --register) ---
program
    .command("generate")
    .description("Scan project and generate DIR.md, optionally register")
    .argument("[dir]", "Project directory", ".")
    .option("--register", "Register the service with the gateway after generating")
    .option("--gateway-url <url>", "Gateway URL for registration")
    .option("--token <token>", "Auth token for registration")
    .option("--domain <domain>", "Domain name for the service")
    .action(async (dir: string, opts: Record<string, string | boolean | undefined>) => {
        const { runGenerate } = await import("./commands/generate.js");
        await runGenerate(dir, {
            register: opts.register as boolean | undefined,
            gatewayUrl: opts.gatewayUrl as string | undefined,
            token: opts.token as string | undefined,
            domain: opts.domain as string | undefined,
        });
    });

// --- Claim ---
program
    .command("claim")
    .description("Claim domain ownership via DNS verification")
    .argument("<domain>", "Domain to claim")
    .option("--verify", "Verify DNS record and obtain publish token")
    .option("--gateway-url <url>", "Gateway URL")
    .action(
        async (
            domain: string,
            opts: Record<string, string | boolean | undefined>,
        ) => {
            const { runClaim } = await import("./commands/claim.js");
            const gatewayUrl =
                (opts.gatewayUrl as string | undefined) ??
                process.env.DIRX_GATEWAY_URL ??
                "https://api.dirx.ai";
            await runClaim({
                gatewayUrl,
                domain,
                verify: opts.verify as boolean | undefined,
            });
        },
    );

// --- Register ---
program
    .command("register")
    .description("Register DIR.md with the gateway")
    .option("--gateway-url <url>", "Gateway URL")
    .option("--token <token>", "Auth token (publish token)")
    .option("--domain <domain>", "Domain name for the service")
    .option("--dir <dir>", "Project directory", ".")
    .action(async (opts: Record<string, string | undefined>) => {
        const { runRegister } = await import("./commands/register.js");
        await runRegister({
            gatewayUrl: opts.gatewayUrl,
            token: opts.token,
            domain: opts.domain,
            dir: opts.dir === "." ? process.cwd() : opts.dir,
        });
    });

// --- Status ---
program
    .command("status")
    .description("Show current CLI configuration and auth status")
    .action(async () => {
        const { runStatus } = await import("./commands/status.js");
        await runStatus();
    });

// --- FS commands (ls, cat, read, write, edit, bash, grep) ---
const { registerFsCommands } = await import("./commands/fs.js");
registerFsCommands(program);

// --- Keys command ---
const { registerKeysCommand } = await import("./commands/keys.js");
registerKeysCommand(program);

program.parse();
