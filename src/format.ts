/**
 * Output formatting — Unix-style human-readable output.
 *
 * Default: concise plain-text (like ls / grep).
 * --json: full JSON envelope (machine-readable).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LsItem {
    path: string;
    kind?: string;
    title?: string;
    description?: string;
    actions?: string[];
    version?: string;
}

interface SearchResult {
    domain: string;
    title: string;
    description?: string;
    path?: string;
    score?: number;
    matched_endpoints?: EndpointResult[];
}

interface EndpointResult {
    method: string;
    path: string;
    description?: string;
}

interface GatewayResult {
    ok: boolean;
    data?: unknown;
    error?: string;
    path?: string;
    action?: string;
    type?: string;
    meta?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isSearchResults(data: unknown): data is SearchResult[] {
    if (!Array.isArray(data) || data.length === 0) return false;
    const first = data[0] as Record<string, unknown>;
    return typeof first === "object" && first !== null && "domain" in first && ("title" in first || "name" in first);
}

function isEndpointResults(data: unknown): data is EndpointResult[] {
    if (!Array.isArray(data) || data.length === 0) return false;
    const first = data[0] as Record<string, unknown>;
    return typeof first === "object" && first !== null && "method" in first && "path" in first;
}

/**
 * Extract the payload from a gateway response envelope.
 * Handles: {ok, data: {results:[...]}} or {ok, data: {items:[...]}} or {ok, data: [...]} or raw data.
 */
function extractPayload(result: unknown): unknown {
    if (typeof result !== "object" || result === null) return result;
    const obj = result as Record<string, unknown>;
    // Standard envelope: return .data
    if ("ok" in obj && "data" in obj) {
        const data = obj.data;
        // Search results wrapper: {query, results: [...], count}
        if (typeof data === "object" && data !== null && "results" in (data as Record<string, unknown>)) {
            return (data as Record<string, unknown>).results;
        }
        return data;
    }
    // Direct search wrapper (no ok field): {query, results: [...]}
    if ("results" in obj && "query" in obj) return obj.results;
    return result;
}

// ---------------------------------------------------------------------------
// formatLs — list directory entries
// ---------------------------------------------------------------------------

export function formatLs(result: unknown): string {
    const payload = extractPayload(result);

    // Flat string array: ["api.github.com/", ...]
    if (Array.isArray(payload)) {
        if (payload.length === 0) return "(empty)";
        return payload.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).join("\n");
    }

    // Object with items: {items: [...]}
    if (typeof payload === "object" && payload !== null && "items" in (payload as Record<string, unknown>)) {
        const items = (payload as Record<string, unknown>).items as unknown[];
        if (!Array.isArray(items) || items.length === 0) return "(empty)";

        // Check if items are rich objects or plain strings
        const rich = items.some(
            (item) => typeof item === "object" && item !== null && "path" in (item as Record<string, unknown>),
        );

        if (!rich) {
            return items.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).join("\n");
        }

        // Rich items: align path + title columns
        const entries = items as LsItem[];
        const maxPath = Math.min(
            40,
            Math.max(8, ...entries.map((e) => (e.path ?? "").length)),
        );

        return entries
            .map((entry) => {
                const path = entry.path ?? "<unknown>";
                const title = entry.title ?? "";
                if (title) {
                    return `${path.padEnd(maxPath)}  ${title}`;
                }
                return path;
            })
            .join("\n");
    }

    // Fallback
    return JSON.stringify(payload);
}

// ---------------------------------------------------------------------------
// formatGrep — search results
// ---------------------------------------------------------------------------

export function formatGrep(result: unknown): string {
    const payload = extractPayload(result);

    // Domain-level search results
    if (isSearchResults(payload)) {
        if (payload.length === 0) return "(no matches)";

        let domainCount = 0;
        let endpointCount = 0;

        const blocks = payload.map((s) => {
            domainCount++;
            const name = s.title || ((s as unknown as Record<string, unknown>).name as string | undefined) || "";
            const header = name ? `${s.domain}  ${name}` : s.domain;
            const lines: string[] = [header];

            if (s.description) {
                // Truncate long descriptions to first sentence
                const desc = s.description.length > 80 ? s.description.slice(0, 77) + "..." : s.description;
                lines.push(`  ${desc}`);
            }

            const endpoints = s.matched_endpoints;
            if (endpoints && endpoints.length > 0) {
                lines[0] += ` · ${endpoints.length} matched`;
                for (const ep of endpoints) {
                    endpointCount++;
                    const method = (ep.method ?? "").padEnd(6);
                    const desc = ep.description ? `  -- ${ep.description}` : "";
                    lines.push(`    ${method} ${ep.path}${desc}`);
                }
            }
            return lines.join("\n");
        });

        const output = blocks.join("\n\n");
        if (domainCount > 0 || endpointCount > 0) {
            const parts: string[] = [];
            if (domainCount > 0) parts.push(`${domainCount} service${domainCount === 1 ? "" : "s"}`);
            if (endpointCount > 0) parts.push(`${endpointCount} endpoint${endpointCount === 1 ? "" : "s"}`);
            return `${output}\n\n-- ${parts.join(", ")} matched`;
        }
        return output;
    }

    // Endpoint-level search results
    if (isEndpointResults(payload)) {
        if (payload.length === 0) return "(no matches)";
        return payload
            .map((ep) => {
                const method = (ep.method ?? "").padEnd(6);
                const desc = ep.description ? `  -- ${ep.description}` : "";
                return `${method} ${ep.path}${desc}`;
            })
            .join("\n");
    }

    // Fallback
    return JSON.stringify(payload);
}

// ---------------------------------------------------------------------------
// formatCat — read file contents
// ---------------------------------------------------------------------------

export function formatCat(result: unknown): string {
    const payload = extractPayload(result);

    // Plain string content
    if (typeof payload === "string") return payload;

    // Fallback to JSON
    return JSON.stringify(payload);
}

// ---------------------------------------------------------------------------
// formatMutate — write / edit / rm results
// ---------------------------------------------------------------------------

export function formatMutate(result: unknown, verb: string, path: string): string {
    const payload = extractPayload(result);

    if (payload === null || payload === undefined) {
        return `${verb}: ${path}`;
    }
    if (typeof payload === "object" && Object.keys(payload as Record<string, unknown>).length === 0) {
        return `${verb}: ${path}`;
    }

    return `${verb}: ${path}\n${JSON.stringify(payload)}`;
}

// ---------------------------------------------------------------------------
// formatError — error messages to stderr
// ---------------------------------------------------------------------------

export function formatError(result: unknown): string {
    if (typeof result !== "object" || result === null) {
        return String(result);
    }

    const obj = result as Record<string, unknown>;

    // Gateway envelope error: {ok: false, error: "...", ...}
    if ("error" in obj) {
        const err = obj.error;
        if (typeof err === "string") return err;
        if (typeof err === "object" && err !== null) {
            const errObj = err as Record<string, unknown>;
            const code = errObj.code ?? "ERROR";
            const message = errObj.message ?? "unknown error";
            return `${code}: ${message}`;
        }
    }

    return JSON.stringify(obj);
}

// ---------------------------------------------------------------------------
// formatJson — full JSON output (--json mode)
// ---------------------------------------------------------------------------

export function formatJson(result: unknown): string {
    return JSON.stringify(result);
}
