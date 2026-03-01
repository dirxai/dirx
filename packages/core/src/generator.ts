/**
 * DIR.md generator — produces a DirX service description from structured input.
 *
 * Third-party projects can use this to programmatically generate DIR.md files.
 */

import type { DirxService, DirxEndpoint } from "./types.js";

export interface GenerateOptions {
    includeTimestamp?: boolean;
}

/**
 * Generate a DIR.md markdown string from a DirxService definition.
 */
export function generateDirMd(
    service: DirxService,
    options?: GenerateOptions,
): string {
    const sections: string[] = [];

    sections.push(`# ${service.title}`);
    if (service.description) {
        sections.push(service.description);
    }

    if (service.base_url) {
        sections.push(`## Base URL\n\n\`${service.base_url}\``);
    }

    if (service.actions.length > 0) {
        sections.push(
            `## Actions\n\n${service.actions.map((a) => `- \`${a}\``).join("\n")}`,
        );
    }

    if (service.endpoints.length > 0) {
        const lines: string[] = ["## Endpoints", ""];
        lines.push("| Method | Path | Description |");
        lines.push("|--------|------|-------------|");
        for (const ep of service.endpoints) {
            const desc = ep.description ?? "";
            lines.push(`| ${ep.method} | \`${ep.path}\` | ${desc} |`);
        }
        sections.push(lines.join("\n"));
    }

    if (options?.includeTimestamp) {
        sections.push(
            `---\n\n*Generated at ${new Date().toISOString()}*`,
        );
    }

    return sections.join("\n\n") + "\n";
}

/**
 * Generate a dir.json object from a DirxService definition.
 */
export function generateDirJson(service: DirxService): string {
    return JSON.stringify(service, null, 2);
}
