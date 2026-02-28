import { describe, it, expect } from "vitest";
import { DirxError, DirxErrorCode } from "../src/errors.js";

describe("DirxError", () => {
    it("creates error with correct code and status", () => {
        const err = new DirxError(DirxErrorCode.UNAUTHORIZED, "no token");
        expect(err.code).toBe("UNAUTHORIZED");
        expect(err.statusCode).toBe(401);
        expect(err.message).toBe("no token");
        expect(err.name).toBe("DirxError");
    });

    it("serializes to JSON", () => {
        const err = new DirxError(DirxErrorCode.NOT_FOUND, "missing");
        const json = err.toJSON();
        expect(json).toEqual({
            code: "NOT_FOUND",
            message: "missing",
            statusCode: 404,
        });
    });

    it("maps all error codes to HTTP status codes", () => {
        const codes = Object.values(DirxErrorCode);
        for (const code of codes) {
            const err = new DirxError(code, "test");
            expect(err.statusCode).toBeGreaterThanOrEqual(400);
            expect(err.statusCode).toBeLessThanOrEqual(599);
        }
    });
});
