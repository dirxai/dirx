/**
 * FS commands: ls, cat, write, edit, rm, bash, grep.
 *
 * ALL commands go through the single /execute endpoint. The CLI sends a plain
 * text command string — it does NOT know Gateway internal API routes.
 */

import type { Command } from "commander";
import { createClient } from "../gateway/client.js";
import { getAuthHint } from "../keys/provider-map.js";

function output(result: unknown): void {
    console.log(JSON.stringify(result, null, 2));
}

/** Extract domain from a DirX path like "/net/api.github.com/..." */
function extractDomain(path: string): string | null {
    // Strip /net/ prefix and get the domain part
    const cleaned = path.replace(/^\/+/, "");
    const segments = cleaned.split("/");
    // Skip namespace (net, skills, etc.) to get domain
    const candidate = segments.length > 1 ? segments[1] : segments[0];
    if (!candidate) return null;
    return candidate.includes(".") ? candidate : null;
}

/** Detect auth-related errors in gateway responses. */
function isAuthError(message: string): boolean {
    if (/Gateway error (401|403):/.test(message)) return true;
    if (
        /Gateway error 500:/.test(message) &&
        /\b(Unauthorized|Unauthenticated|authenticate|API key|api[_-]?key)\b/i.test(
            message,
        )
    )
        return true;
    return false;
}

function handleError(err: unknown, cmdPath?: string): never {
    const message = err instanceof Error ? err.message : String(err);

    if (isAuthError(message)) {
        const domain =
            (cmdPath && extractDomain(cmdPath)) ||
            message.match(/([a-z0-9-]+(?:\.[a-z0-9-]+){1,})/i)?.[1] ||
            null;
        if (domain) {
            const hint = getAuthHint(domain);
            console.error(`Error: Authentication required for ${domain}`);
            if (hint?.guideUrl) {
                console.error(`  Get your key:  ${hint.guideUrl}`);
            } else {
                console.error(
                    `  Get your key:  https://${domain} (check the developer/API settings)`,
                );
            }
            console.error(
                `  Set your key:  dirx keys set ${domain} --token <YOUR_KEY> --sync`,
            );
            console.error(`  Then retry your command.`);
            process.exit(1);
        }
    }

    console.error(JSON.stringify({ error: message }));
    process.exit(1);
}

export function registerFsCommands(program: Command): void {
    program
        .command("ls")
        .description("List directory contents in the DirX path space")
        .argument("[path]", "Directory path (e.g. /net/)", "/")
        .action(async (path: string) => {
            try {
                // Ensure trailing slash is removed except for root path "/"
                let normalizedPath = path.trim();
                if (normalizedPath.length > 1 && normalizedPath.endsWith("/")) {
                    normalizedPath = normalizedPath.replace(/\/+$/, "");
                }
                const client = await createClient();
                const result = await client.execute(`ls ${normalizedPath}`);
                output(result);
            } catch (err) {
                handleError(err, path);
            }
        });

    program
        .command("cat")
        .description("Read file contents from a DirX path")
        .argument("<path>", "File path")
        .action(async (path: string) => {
            try {
                const client = await createClient();
                const result = await client.execute(`cat ${path}`);
                output(result);
            } catch (err) {
                handleError(err, path);
            }
        });

    program
        .command("read")
        .description("Read file contents (alias for cat)")
        .argument("<path>", "File path")
        .action(async (path: string) => {
            try {
                const client = await createClient();
                const result = await client.execute(`cat ${path}`);
                output(result);
            } catch (err) {
                handleError(err, path);
            }
        });

    program
        .command("write")
        .description("Write data to a DirX path")
        .argument("<path>", "File path")
        .option("-d, --data <json>", "JSON data to write")
        .option("-f, --file <file>", "Read data from file")
        .action(
            async (
                path: string,
                opts: { data?: string; file?: string },
            ) => {
                try {
                    let payload = opts.data ?? "";
                    if (opts.file) {
                        const { readFileSync } = await import("node:fs");
                        payload = readFileSync(opts.file, "utf-8");
                    }
                    const client = await createClient();
                    const result = await client.execute(`write ${path} ${payload}`);
                    output(result);
                } catch (err) {
                    handleError(err, path);
                }
            },
        );

    program
        .command("edit")
        .description("Edit (partial update) data at a DirX path")
        .argument("<path>", "File path")
        .option("-d, --data <json>", "JSON data for partial update")
        .option("-f, --file <file>", "Read data from file")
        .action(
            async (
                path: string,
                opts: { data?: string; file?: string },
            ) => {
                try {
                    let payload = opts.data ?? "";
                    if (opts.file) {
                        const { readFileSync } = await import("node:fs");
                        payload = readFileSync(opts.file, "utf-8");
                    }
                    const client = await createClient();
                    const result = await client.execute(`edit ${path} ${payload}`);
                    output(result);
                } catch (err) {
                    handleError(err, path);
                }
            },
        );

    program
        .command("rm")
        .description("Remove a resource at a DirX path")
        .argument("<path>", "Resource path")
        .action(async (path: string) => {
            try {
                const client = await createClient();
                const result = await client.execute(`rm ${path}`);
                output(result);
            } catch (err) {
                handleError(err, path);
            }
        });

    program
        .command("bash")
        .description("Execute a multi-step pipeline on the gateway")
        .argument("<pipeline>", "Pipeline expression")
        .action(async (pipeline: string) => {
            try {
                const client = await createClient();
                const result = await client.execute(`bash ${pipeline}`);
                output(result);
            } catch (err) {
                handleError(err);
            }
        });

    program
        .command("grep")
        .description("Search across services in the DirX path space")
        .argument("<pattern>", "Search pattern")
        .argument("<path>", "Search scope path")
        .action(async (pattern: string, path: string) => {
            try {
                const client = await createClient();
                const result = await client.execute(`grep ${pattern} ${path}`);
                output(result);
            } catch (err) {
                handleError(err, path);
            }
        });
}
