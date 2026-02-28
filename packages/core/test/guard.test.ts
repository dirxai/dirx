import { describe, it, expect } from "vitest";
import { Guard } from "../src/middleware/guard.js";
import { DirxError } from "../src/errors.js";

describe("Guard", () => {
    it("extracts bearer token from header", () => {
        const guard = new Guard();
        expect(guard.extractToken("Bearer abc123")).toBe("abc123");
        expect(guard.extractToken("bearer xyz")).toBe("xyz");
        expect(guard.extractToken("Basic abc")).toBeNull();
        expect(guard.extractToken(null)).toBeNull();
        expect(guard.extractToken(undefined)).toBeNull();
        expect(guard.extractToken("")).toBeNull();
        expect(guard.extractToken("Bearer")).toBeNull();
    });

    it("throws when required and no header", async () => {
        const guard = new Guard({ required: true });
        await expect(guard.fromHeader(null)).rejects.toThrow(DirxError);
        await expect(guard.fromHeader(null)).rejects.toMatchObject({
            code: "UNAUTHORIZED",
        });
    });

    it("returns null when optional and no header", async () => {
        const guard = new Guard({ required: false });
        const result = await guard.fromHeader(null);
        expect(result).toBeNull();
    });
});
