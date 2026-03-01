import { describe, it, expect } from "vitest";
import { generateDirMd, generateDirJson } from "../src/generator.js";
import type { DirxService } from "../src/types.js";

const sampleService: DirxService = {
    title: "Weather API",
    description: "Provides weather data for any location.",
    base_url: "https://api.weather.example.com",
    actions: ["ls", "read"],
    endpoints: [
        { path: "/current", method: "GET", description: "Get current weather" },
        { path: "/forecast", method: "GET", description: "Get 5-day forecast" },
    ],
};

describe("generateDirMd", () => {
    it("generates valid markdown with all sections", () => {
        const md = generateDirMd(sampleService);
        expect(md).toContain("# Weather API");
        expect(md).toContain("Provides weather data");
        expect(md).toContain("`https://api.weather.example.com`");
        expect(md).toContain("- `ls`");
        expect(md).toContain("- `read`");
        expect(md).toContain("| GET | `/current` | Get current weather |");
        expect(md).toContain("| GET | `/forecast` | Get 5-day forecast |");
    });

    it("includes timestamp when requested", () => {
        const md = generateDirMd(sampleService, { includeTimestamp: true });
        expect(md).toContain("*Generated at");
    });

    it("handles minimal service", () => {
        const minimal: DirxService = {
            title: "Minimal",
            base_url: "https://example.com",
            actions: [],
            endpoints: [],
        };
        const md = generateDirMd(minimal);
        expect(md).toContain("# Minimal");
        expect(md).not.toContain("## Actions");
        expect(md).not.toContain("## Endpoints");
    });
});

describe("generateDirJson", () => {
    it("produces valid JSON", () => {
        const json = generateDirJson(sampleService);
        const parsed = JSON.parse(json);
        expect(parsed.title).toBe("Weather API");
        expect(parsed.endpoints).toHaveLength(2);
    });
});
