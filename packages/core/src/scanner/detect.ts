/**
 * Framework detection from project files and dependencies.
 *
 * Detects language and framework by inspecting dependency manifests
 * (package.json, go.mod, Cargo.toml, requirements.txt, pyproject.toml).
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface DetectedStack {
    lang: string;
    framework: string;
}

const FRAMEWORK_PACKAGES: Record<string, string> = {
    next: "nextjs",
    hono: "hono",
    fastify: "fastify",
    express: "express",
    "@hono/node-server": "hono",
    koa: "koa",
};

/**
 * Detect framework from a project directory by inspecting manifest files.
 */
export function detectFramework(target: string): DetectedStack {
    if (existsSync(join(target, "Cargo.toml"))) {
        return { lang: "rust", framework: "axum" };
    }
    if (existsSync(join(target, "go.mod"))) {
        return { lang: "go", framework: "net/http" };
    }
    if (existsSync(join(target, "package.json"))) {
        const detected = detectFrameworkFromDeps(target);
        if (detected) return { lang: "node", framework: detected };
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

/**
 * Detect framework from package.json dependencies.
 * Returns null if no known framework is found.
 */
export function detectFrameworkFromDeps(target: string): string | null {
    const pkgPath = join(target, "package.json");
    if (!existsSync(pkgPath)) return null;
    try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        const deps: Record<string, string> = {
            ...pkg.dependencies,
            ...pkg.devDependencies,
        };
        for (const [pkg, fw] of Object.entries(FRAMEWORK_PACKAGES)) {
            if (pkg in deps) return fw;
        }
    } catch {
        // ignore parse errors
    }
    return null;
}

/**
 * Check if a project has @dirxai/core in its dependencies.
 */
export function hasDirxSdk(target: string): boolean {
    const pkgPath = join(target, "package.json");
    if (!existsSync(pkgPath)) return false;
    try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        const deps: Record<string, string> = {
            ...pkg.dependencies,
            ...pkg.devDependencies,
        };
        return "@dirxai/core" in deps;
    } catch {
        return false;
    }
}
