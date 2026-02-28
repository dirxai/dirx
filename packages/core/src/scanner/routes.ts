/**
 * Route extraction from source code.
 *
 * Uses pattern matching to detect route definitions across
 * multiple frameworks (Express, Hono, Fastify, Next.js, FastAPI, Go, Axum).
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

export interface RouteHint {
    file: string;
    framework: string;
}

const MAX_SCAN_DEPTH = 8;

const SKIP_DIRS = new Set([
    "node_modules", ".git", "target", "__pycache__",
    "vendor", "dist", "build", ".next",
]);

const SCAN_EXTENSIONS = new Set([
    ".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs",
]);

/**
 * Get route detection patterns for a given framework.
 */
export function getRoutePatterns(framework: string): string[] {
    switch (framework) {
        case "express":
        case "hono":
        case "fastify":
        case "koa":
            return [".get(", ".post(", ".put(", ".delete(", ".patch(", "router."];
        case "nextjs":
            return ["export default", "export async function"];
        case "fastapi":
            return ["@app.get", "@app.post", "@app.put", "@app.delete", "@router."];
        case "go":
        case "net/http":
            return ["HandleFunc(", "Get(", "Post(", "Put(", "Delete(", "r.Route("];
        case "axum":
            return [".route(", ".get(", ".post(", ".put(", ".delete("];
        default:
            return [];
    }
}

/**
 * Extract routes from source code using regex.
 * Returns method + path pairs found in the content.
 */
export function extractRoutesRegex(
    content: string,
): { method: string; path: string }[] {
    const regex = /\.\s*(get|post|put|patch|delete)\s*\(\s*["'`](\/[^"'`]*)["'`]/gi;
    const results: { method: string; path: string }[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
        results.push({
            method: match[1].toUpperCase(),
            path: match[2],
        });
    }
    return results;
}

/**
 * Scan a directory tree for files containing route definitions.
 */
export function scanRoutes(
    root: string,
    framework: string,
): RouteHint[] {
    const patterns = getRoutePatterns(framework);
    if (patterns.length === 0) return [];

    const routes: RouteHint[] = [];
    walkDir(root, root, patterns, framework, routes, 0);
    return routes;
}

function walkDir(
    root: string,
    dir: string,
    patterns: string[],
    framework: string,
    routes: RouteHint[],
    depth: number,
): void {
    if (depth > MAX_SCAN_DEPTH) return;

    let entries: string[];
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
            walkDir(root, fullPath, patterns, framework, routes, depth + 1);
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
