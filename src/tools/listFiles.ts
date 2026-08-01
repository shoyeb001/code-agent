// tool for listing files 
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { BaseTool, type ToolResult } from "./baseTool.js";

const listFilesSchema = z.object({
    path: z.string().optional(),
    recursive: z.boolean().optional(),
    maxDepth: z.number().int().min(0).max(10).optional(),
});

type ListFilesInput = z.infer<typeof listFilesSchema>;

export class ListFilesTool extends BaseTool<ListFilesInput> {
    readonly name = "list_files";
    readonly description = 'List files and folders in the project. For exploring code, use recursive true. Input: {"path":"src","recursive":true,"maxDepth":3}';
    readonly schema = listFilesSchema;

    async execute(input: ListFilesInput): Promise<ToolResult> {
        try {
            const targetPath = this.resolveProjectPath(input.path ?? ".");
            const recursive = input.recursive ?? false;
            const maxDepth = input.maxDepth ?? 3;
            const files = await this.listPath(targetPath, recursive, maxDepth);
            return {
                success: true,
                output: files.join('\n')
            }
        } catch (error) {
            return {
                success: false,
                output: error instanceof Error ? error.message : String(error),
            }
        }
    }

    private async listPath(targetPath: string, recursive: boolean, maxDepth: number, currentDepth = 0): Promise<string[]> {
        const entries = await readdir(targetPath);
        const lines: string[] = [];
        for (const entry of entries.sort()) {
            if (this.shouldSkip(entry)) {
                continue;
            }

            const fullPath = path.join(targetPath, entry);
            const fileStat = await stat(fullPath);
            const relativePath = path.relative(this.projectRoot, fullPath);

            if (fileStat.isDirectory()) {
                lines.push(`${relativePath}/`);

                if (recursive && currentDepth < maxDepth) {
                    const childLines = await this.listPath(
                        fullPath,
                        recursive,
                        maxDepth,
                        currentDepth + 1
                    );

                    lines.push(...childLines);
                }
            } else {
                lines.push(relativePath);
            }
        }

        return lines;
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
