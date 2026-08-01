// tool for listing files 
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { BaseTool, type ToolResult } from "./baseTool.js";

type ListFilesInput = {
    path?: string;
    recursive?: boolean;
    maxDepth?: number;
}

export class ListFilesTool extends BaseTool {
    readonly name = "list_files";
    readonly description = 'List files and folders in the project. For exploring code, use recursive true. Input: {"path":"src","recursive":true,"maxDepth":3}';

    async execute(input: string): Promise<ToolResult> {
        try {
            const parsedInput = this.parseInput(input);
            const targetPath = this.resolveProjectPath(parsedInput.path ?? ".");
            const recursive = parsedInput.recursive ?? false;
            const maxDepth = parsedInput.maxDepth ?? 3;
            // const entries = await readdir(targetPath);

            // const lines = await Promise.all(
            //     entries.map(async (entry) => {
            //         const entryPath = path.join(targetPath, entry);
            //         const entryStat = await stat(entryPath);
            //         return entryStat.isDirectory() ? `${entry}/` : entry;
            //     })
            // );
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
    private parseInput(input: string): ListFilesInput {
        if (!input.trim()) return {};

        try {
            return this.parseJson<ListFilesInput>(input);
        } catch (error) {
            throw new Error("Invalid input format for list_files tool");
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