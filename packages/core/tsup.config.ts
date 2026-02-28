import { defineConfig } from "tsup";

export default defineConfig({
    entry: [
        "src/index.ts",
        "src/testing.ts",
        "src/scanner/index.ts",
        "src/types.ts",
    ],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
});
