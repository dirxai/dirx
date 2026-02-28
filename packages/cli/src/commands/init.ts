/**
 * Init command: initialize a DirX project in the current directory.
 *
 * Purely local — no network access required.
 */

import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export async function runInit(dir: string): Promise<void> {
    const target = dir === "." ? process.cwd() : dir;
    const dirMdPath = join(target, "DIR.md");
    const dirJsonPath = join(target, "dir.json");

    if (existsSync(dirMdPath)) {
        console.log(`Already initialized: ${dirMdPath} exists`);
        return;
    }

    const { lang, framework } = detectFramework(target);

    mkdirSync(target, { recursive: true });

    const mdContent = [
        "# My Service",
        "",
        "Describe your service here.",
        "",
        "## Stack",
        "",
        `- Language: ${lang}`,
        `- Framework: ${framework}`,
        "",
        "## Endpoints",
        "",
        "- `GET /` — health check",
        "",
    ].join("\n");

    const jsonContent = {
        title: "My Service",
        description: "A DirX-compatible service",
        base_url: "https://api.example.com",
        actions: ["ls", "read"],
        endpoints: [
            { path: "/", method: "GET", description: "Health check" },
        ],
    };

    writeFileSync(dirMdPath, mdContent);
    writeFileSync(dirJsonPath, JSON.stringify(jsonContent, null, 2));

    console.log(`Initialized DirX project in ${target}`);
    console.log(`  Detected: ${lang} / ${framework}`);
    console.log(`  Created: DIR.md, dir.json`);
    console.log(`\nNext steps:`);
    console.log(`  1. Edit DIR.md to describe your service`);
    console.log(`  2. Run 'dirx generate' to scan routes`);
    console.log(`  3. Run 'dirx register --domain <your-domain>' to publish`);
}

function detectFramework(target: string): {
    lang: string;
    framework: string;
} {
    if (existsSync(join(target, "Cargo.toml"))) {
        return { lang: "rust", framework: "axum" };
    }
    if (existsSync(join(target, "go.mod"))) {
        return { lang: "go", framework: "net/http" };
    }
    if (existsSync(join(target, "package.json"))) {
        if (
            existsSync(join(target, "next.config.js")) ||
            existsSync(join(target, "next.config.mjs"))
        ) {
            return { lang: "node", framework: "nextjs" };
        }
        return { lang: "node", framework: "express" };
    }
    if (
        existsSync(join(target, "requirements.txt")) ||
        existsSync(join(target, "pyproject.toml"))
    ) {
        return { lang: "python", framework: "fastapi" };
    }
    return { lang: "unknown", framework: "generic" };
}
