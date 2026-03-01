import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runInit } from "../../src/commands/init.js";

const TMP = join(tmpdir(), `dirx-cli-init-test-${Date.now()}`);

beforeEach(() => {
    mkdirSync(TMP, { recursive: true });
    vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
    vi.restoreAllMocks();
});

describe("runInit", () => {
    it("creates DIR.md and dir.json in target directory", async () => {
        await runInit(TMP);

        expect(existsSync(join(TMP, "DIR.md"))).toBe(true);
        expect(existsSync(join(TMP, "dir.json"))).toBe(true);

        const md = readFileSync(join(TMP, "DIR.md"), "utf-8");
        expect(md).toContain("# My Service");

        const json = JSON.parse(readFileSync(join(TMP, "dir.json"), "utf-8"));
        expect(json.title).toBe("My Service");
        expect(json.endpoints).toHaveLength(1);
    });

    it("skips if DIR.md already exists", async () => {
        const { writeFileSync } = await import("node:fs");
        writeFileSync(join(TMP, "DIR.md"), "existing");

        await runInit(TMP);

        const md = readFileSync(join(TMP, "DIR.md"), "utf-8");
        expect(md).toBe("existing");
    });

    it("detects Go project", async () => {
        const { writeFileSync } = await import("node:fs");
        writeFileSync(join(TMP, "go.mod"), "module example.com/svc\n");

        await runInit(TMP);

        const md = readFileSync(join(TMP, "DIR.md"), "utf-8");
        expect(md).toContain("Language: go");
    });

    it("detects Node.js/Express project", async () => {
        const { writeFileSync } = await import("node:fs");
        writeFileSync(
            join(TMP, "package.json"),
            JSON.stringify({ dependencies: { express: "^4.0.0" } }),
        );

        await runInit(TMP);

        const md = readFileSync(join(TMP, "DIR.md"), "utf-8");
        expect(md).toContain("Language: node");
        expect(md).toContain("Framework: express");
    });
});
