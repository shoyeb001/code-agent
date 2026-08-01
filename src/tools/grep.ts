// Instead of reading every file, the agent can search first, then read only the relevant files.
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import z from "zod";
import { BaseTool, type ToolResult } from "./baseTool.js";

const grepSchema = z.object({
    pattern: z.string().min(1),
    path: z.string().optional(),
    caseSensitive: z.boolean().optional(),
    maxResults: z.number().int().min(1).max(100).optional(),
});

type GrepInput = z.infer<typeof grepSchema>;

type GrepMatch = {
    filePath: string;
    lineNumber: number;
    line: string;
}

export class GrepTool extends BaseTool<GrepInput> {
    readonly name = "grep";
    readonly description =
        'Search text in project files. Required input: {"pattern":"class Agent","path":"src"}';
    readonly schema = grepSchema;

    public async execute(input: GrepInput): Promise<ToolResult> {
        try {
            const targetPath = this.resolveProjectPath(input.path ?? ".");
            const caseSensitive = input.caseSensitive ?? false;
            const maxResults = input.maxResults ?? 10;
            const files = await this.findFiles(targetPath);
            const results: GrepMatch[] = [];

            for (const file of files) {
                const fileMatches = await this.searchFile(
                    file,
                    input.pattern,
                    caseSensitive
                )
                results.push(...fileMatches);
                if (results.length >= maxResults) {
                    break;
                }
            }
            const limitedMatches = results.slice(0, maxResults);
            return {
                success: true,
                output: this.formatResults(limitedMatches),
            };
        } catch (error) {
            return {
                success: false,
                output: error instanceof Error ? error.message : String(error),
            };
        }
    }
    private async findFiles(targetPath: string): Promise<string[]> {
        const targetStat = await stat(targetPath);

        if (targetStat.isFile()) {
            return this.shouldSearchFile(targetPath) ? [targetPath] : [];
        }

        const entries = await import("node:fs/promises").then((fs) =>
            fs.readdir(targetPath)
        );

        const files: string[] = [];

        for (const entry of entries.sort()) {
            if (this.shouldSkip(entry)) {
                continue;
            }

            const fullPath = path.join(targetPath, entry);
            const entryStat = await stat(fullPath);

            if (entryStat.isDirectory()) {
                const childFiles = await this.findFiles(fullPath);
                files.push(...childFiles);
            } else if (this.shouldSearchFile(fullPath)) {
                files.push(fullPath);
            }
        }

        return files;
    }
    private async searchFile(
        filePath: string,
        pattern: string,
        caseSensitive: boolean
    ): Promise<GrepMatch[]> {
        const content = await readFile(filePath, "utf-8");
        const lines = content.split(/\r?\n/);

        const searchPattern = caseSensitive
            ? pattern
            : pattern.toLowerCase();

        const matches: GrepMatch[] = [];

        lines.forEach((line, index) => {
            const searchableLine = caseSensitive ? line : line.toLowerCase();

            if (searchableLine.includes(searchPattern)) {
                matches.push({
                    filePath: path.relative(this.projectRoot, filePath),
                    lineNumber: index + 1,
                    line: line.trim(),
                });
            }
        });

        return matches;
    }

    private formatResults(matches: GrepMatch[]): string {
        if (matches.length === 0) {
            return "No matches found.";
        }

        return matches
            .map((match) => {
                return `${match.filePath}:${match.lineNumber}: ${match.line}`;
            })
            .join("\n");
    }

    private shouldSearchFile(filePath: string): boolean {
        const allowedExtensions = [
            ".ts",
            ".tsx",
            ".js",
            ".jsx",
            ".json",
            ".md",
            ".txt",
            ".css",
            ".html",
        ];

        return allowedExtensions.includes(path.extname(filePath));
    }

    private shouldSkip(entry: string): boolean {
        return [
            "node_modules",
            "dist",
            ".git",
            ".env",
            ".DS_Store",
        ].includes(entry);
    }

}
