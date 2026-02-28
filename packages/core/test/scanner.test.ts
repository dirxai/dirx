import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
    detectFramework,
    detectFrameworkFromDeps,
    scanRoutes,
    getRoutePatterns,
    extractRoutesRegex,
    hasDirxSdk,
} from "../src/scanner/index.js";

const TMP = join(tmpdir(), `dirx-scanner-test-${Date.now()}`);

beforeEach(() => {
    mkdirSync(TMP, { recursive: true });
});

afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
});

describe("detectFramework", () => {
    it("detects Go project", () => {
        writeFileSync(join(TMP, "go.mod"), "module example.com/svc\n");
        const result = detectFramework(TMP);
        expect(result).toEqual({ lang: "go", framework: "net/http" });
    });

    it("detects Rust project", () => {
        writeFileSync(join(TMP, "Cargo.toml"), "[package]\nname = \"svc\"\n");
        const result = detectFramework(TMP);
        expect(result).toEqual({ lang: "rust", framework: "axum" });
    });

    it("detects Express project from package.json", () => {
        writeFileSync(
            join(TMP, "package.json"),
            JSON.stringify({ dependencies: { express: "^4.0.0" } }),
        );
        const result = detectFramework(TMP);
        expect(result).toEqual({ lang: "node", framework: "express" });
    });

    it("detects Next.js from package.json", () => {
        writeFileSync(
            join(TMP, "package.json"),
            JSON.stringify({ dependencies: { next: "^14.0.0" } }),
        );
        const result = detectFramework(TMP);
        expect(result).toEqual({ lang: "node", framework: "nextjs" });
    });

    it("detects Hono from package.json", () => {
        writeFileSync(
            join(TMP, "package.json"),
            JSON.stringify({ dependencies: { hono: "^4.0.0" } }),
        );
        const result = detectFramework(TMP);
        expect(result).toEqual({ lang: "node", framework: "hono" });
    });

    it("detects Python project", () => {
        writeFileSync(join(TMP, "requirements.txt"), "fastapi\n");
        const result = detectFramework(TMP);
        expect(result).toEqual({ lang: "python", framework: "fastapi" });
    });

    it("returns generic for unknown project", () => {
        const result = detectFramework(TMP);
        expect(result).toEqual({ lang: "unknown", framework: "generic" });
    });
});

describe("detectFrameworkFromDeps", () => {
    it("returns null when no package.json", () => {
        expect(detectFrameworkFromDeps(TMP)).toBeNull();
    });

    it("returns null for empty deps", () => {
        writeFileSync(join(TMP, "package.json"), JSON.stringify({}));
        expect(detectFrameworkFromDeps(TMP)).toBeNull();
    });
});

describe("hasDirxSdk", () => {
    it("returns true when @dirxai/core is a dependency", () => {
        writeFileSync(
            join(TMP, "package.json"),
            JSON.stringify({ dependencies: { "@dirxai/core": "^0.1.0" } }),
        );
        expect(hasDirxSdk(TMP)).toBe(true);
    });

    it("returns false when not present", () => {
        writeFileSync(
            join(TMP, "package.json"),
            JSON.stringify({ dependencies: { express: "^4.0.0" } }),
        );
        expect(hasDirxSdk(TMP)).toBe(false);
    });
});

describe("getRoutePatterns", () => {
    it("returns patterns for express", () => {
        const patterns = getRoutePatterns("express");
        expect(patterns.length).toBeGreaterThan(0);
        expect(patterns).toContain(".get(");
    });

    it("returns empty for unknown framework", () => {
        expect(getRoutePatterns("unknown")).toEqual([]);
    });

    it("returns patterns for go/net/http", () => {
        const patterns = getRoutePatterns("net/http");
        expect(patterns.length).toBeGreaterThan(0);
    });
});

describe("extractRoutesRegex", () => {
    it("extracts express-style routes", () => {
        const code = `
            app.get("/users", handler);
            app.post("/users", createHandler);
            app.delete("/users/:id", deleteHandler);
        `;
        const routes = extractRoutesRegex(code);
        expect(routes).toEqual([
            { method: "GET", path: "/users" },
            { method: "POST", path: "/users" },
            { method: "DELETE", path: "/users/:id" },
        ]);
    });

    it("returns empty for no routes", () => {
        expect(extractRoutesRegex("const x = 1;")).toEqual([]);
    });
});

describe("scanRoutes", () => {
    it("finds route files in express project", () => {
        writeFileSync(
            join(TMP, "package.json"),
            JSON.stringify({ dependencies: { express: "^4.0.0" } }),
        );
        mkdirSync(join(TMP, "src"), { recursive: true });
        writeFileSync(
            join(TMP, "src", "routes.ts"),
            'app.get("/health", handler);\napp.post("/users", create);',
        );
        writeFileSync(
            join(TMP, "src", "utils.ts"),
            "export function helper() { return 1; }",
        );

        const routes = scanRoutes(TMP, "express");
        expect(routes).toHaveLength(1);
        expect(routes[0].file).toBe("src/routes.ts");
        expect(routes[0].framework).toBe("express");
    });

    it("returns empty for generic framework", () => {
        writeFileSync(join(TMP, "main.ts"), "console.log('hello');");
        const routes = scanRoutes(TMP, "generic");
        expect(routes).toEqual([]);
    });

    it("skips node_modules", () => {
        mkdirSync(join(TMP, "node_modules", "express"), { recursive: true });
        writeFileSync(
            join(TMP, "node_modules", "express", "index.js"),
            'app.get("/", handler);',
        );
        const routes = scanRoutes(TMP, "express");
        expect(routes).toEqual([]);
    });
});
