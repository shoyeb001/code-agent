// tool for listing files 
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { BaseTool, type ToolResult } from "./baseTool.js";

type ListFilesInput = {
    path?: string;
}

export class ListFilesTool extends BaseTool {
    readonly name = "list_files";
    readonly description = "List the files in a project folder."

    async execute(input: string): Promise<ToolResult> {
        try {
            const parsedInput = this.parseInput(input);
            const targetPath = this.resolveProjectPath(parsedInput.path ?? ".");
            const entries = await readdir(targetPath);
            const lines = await Promise.all(
                entries.map(async (entry) => {
                    const entryPath = path.join(targetPath, entry);
                    const entryStat = await stat(entryPath);
                    return entryStat.isDirectory() ? `${entry}/` : entry;
                })
            );
            return {
                success: true,
                output: lines.sort().join("\n")
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
}