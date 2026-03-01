/**
 * Schema extraction from Prisma and other ORM definitions.
 */

/**
 * Extract model names from a Prisma schema file content.
 */
export function extractPrismaModelNames(content: string): string[] {
    const models: string[] = [];
    const regex = /model\s+(\w+)\s*\{/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
        models.push(match[1]);
    }
    return models;
}
