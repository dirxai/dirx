/**
 * Generate command: scan project and update DIR.md/dir.json.
 *
 * Purely local — no network access required.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

const MAX_SCAN_DEPTH = 8;

const SKIP_DIRS = new Set([
    "node_modules", ".git", "target", "__pycache__",
    "vendor", "dist", "build", ".next",
]);

export async function runGenerate(dir: string): Promise<void> {
    const target = dir === "." ? process.cwd() : dir;
    const dirJsonPath = join(target, "dir.json");

    if (!existsSync(dirJsonPath)) {
        console.error(
            `dir.json not found in ${target}. Run 'dirx init' first.`,
        );
        process.exitCode = 1;
        return;
    }

    const { framework } = detectFrameworkFromPackage(target);
    const patterns = getRoutePatterns(framework);
    const routes: RouteHint[] = [];

    if (patterns.length > 0) {
        scanDir(target, target, patterns, framework, routes, 0);
    }

    console.log(`Scanned ${target} (${framework})`);
    if (routes.length > 0) {
        console.log(`\nFound ${routes.length} file(s) with route definitions:\n`);
        for (const r of routes) {
            console.log(`  ${r.file}  (${r.framework})`);
        }
    } else {
        console.log(`\nNo route definitions detected.`);
    }
    console.log(`\nEdit DIR.md and dir.json to describe your API.`);
}

interface RouteHint {
    file: string;
    framework: string;
}

function detectFrameworkFromPackage(target: string): {
    framework: string;
} {
    const pkgPath = join(target, "package.json");
    if (existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
            const deps = {
                ...pkg.dependencies,
                ...pkg.devDependencies,
            };
            if (deps.next) return { framework: "nextjs" };
            if (deps.hono) return { framework: "hono" };
            if (deps.fastify) return { framework: "fastify" };
            if (deps.express) return { framework: "express" };
        } catch {
            // ignore parse errors
        }
    }
    if (existsSync(join(target, "go.mod")))
        return { framework: "go" };
    if (existsSync(join(target, "Cargo.toml")))
        return { framework: "axum" };
    if (
        existsSync(join(target, "requirements.txt")) ||
        existsSync(join(target, "pyproject.toml"))
    )
        return { framework: "fastapi" };
    return { framework: "generic" };
}

function getRoutePatterns(framework: string): string[] {
    switch (framework) {
        case "express":
        case "hono":
        case "fastify":
            return [".get(", ".post(", ".put(", ".delete(", ".patch(", "router."];
        case "nextjs":
            return ["export default", "export async function"];
        case "fastapi":
            return ["@app.get", "@app.post", "@app.put", "@app.delete", "@router."];
        case "go":
            return ["HandleFunc(", "Get(", "Post(", "Put(", "Delete(", "r.Route("];
        case "axum":
            return [".route(", ".get(", ".post(", ".put(", ".delete("];
        default:
            return [];
    }
}

const SCAN_EXTENSIONS = new Set([
    ".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs",
]);

function scanDir(
    root: string,
    dir: string,
    patterns: string[],
    framework: string,
    routes: RouteHint[],
    depth: number,
): void {
    if (depth > MAX_SCAN_DEPTH) return;

    let entries;
    try {
        entries = readdirSync(dir);
    } catch {
        return;
    }

    for (const name of entries) {
        if (SKIP_DIRS.has(name)) continue;
        const fullPath = join(dir, name);

        let stat;
        try {
            stat = statSync(fullPath);
        } catch {
            continue;
        }

        if (stat.isDirectory()) {
            scanDir(root, fullPath, patterns, framework, routes, depth + 1);
            continue;
        }

        if (!stat.isFile()) continue;
        if (!SCAN_EXTENSIONS.has(extname(name))) continue;

        try {
            const content = readFileSync(fullPath, "utf-8");
            if (patterns.some((p) => content.includes(p))) {
                routes.push({
                    file: relative(root, fullPath),
                    framework,
                });
            }
        } catch {
            // skip unreadable files
        }
    }
}
