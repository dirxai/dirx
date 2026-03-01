import { describe, it, expect } from "vitest";
import { extractPrismaModelNames } from "../src/scanner/schema.js";

describe("extractPrismaModelNames", () => {
    it("extracts model names from Prisma schema", () => {
        const schema = `
            model User {
                id    Int    @id @default(autoincrement())
                name  String
                posts Post[]
            }

            model Post {
                id       Int    @id @default(autoincrement())
                title    String
                authorId Int
                author   User   @relation(fields: [authorId], references: [id])
            }
        `;
        const models = extractPrismaModelNames(schema);
        expect(models).toEqual(["User", "Post"]);
    });

    it("returns empty array for no models", () => {
        expect(extractPrismaModelNames("generator client {}")).toEqual([]);
    });

    it("handles single model", () => {
        const schema = "model Account { id Int @id }";
        expect(extractPrismaModelNames(schema)).toEqual(["Account"]);
    });
});
