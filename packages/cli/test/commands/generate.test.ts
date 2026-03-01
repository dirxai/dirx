import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runGenerate } from "../../src/commands/generate.js";

const TMP = join(tmpdir(), `dirx-cli-generate-test-${Date.now()}`);

beforeEach(() => {
    mkdirSync(TMP, { recursive: true });
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
    vi.restoreAllMocks();
});

describe("runGenerate", () => {
    it("fails if dir.json is missing", async () => {
        await runGenerate(TMP);
        expect(process.exitCode).toBe(1);
        process.exitCode = undefined;
    });

    it("scans Express project and finds routes", async () => {
        writeFileSync(
            join(TMP, "package.json"),
            JSON.stringify({ dependencies: { express: "^4.0.0" } }),
        );
        writeFileSync(join(TMP, "dir.json"), JSON.stringify({ title: "test" }));
        mkdirSync(join(TMP, "src"), { recursive: true });
        writeFileSync(
            join(TMP, "src", "app.ts"),
            'app.get("/health", handler);\napp.post("/users", create);',
        );

        await runGenerate(TMP);

        const logs = (console.log as ReturnType<typeof vi.fn>).mock.calls
            .map((c) => c[0])
            .join("\n");
        expect(logs).toContain("express");
        expect(logs).toContain("src/app.ts");
    });

    it("handles generic project with no routes", async () => {
        writeFileSync(join(TMP, "dir.json"), JSON.stringify({ title: "test" }));

        await runGenerate(TMP);

        const logs = (console.log as ReturnType<typeof vi.fn>).mock.calls
            .map((c) => c[0])
            .join("\n");
        expect(logs).toContain("No route definitions detected");
    });
});
