import { readFile } from "node:fs/promises";
import { BaseTool, type ToolResult } from "./baseTool.js";

type ReadFileInput = {
    path: string;
};

export class ReadFileTool extends BaseTool {
    readonly name = 'read_file';
    readonly description = 'Read a file from the project folder. Input: {"path":"src/index.ts"}';

    async execute(input: string): Promise<ToolResult> {
        try {
            const parsedInput = this.parseInput(input);
            const filePath = this.resolveProjectPath(parsedInput.path);
            const content = await readFile(filePath, 'utf-8');
            return {
                success: true,
                output: content
            }
        } catch (error) {
            return {
                success: false,
                output: error instanceof Error ? error.message : String(error)
            }
        }
    }

    private parseInput(input: string): ReadFileInput {
        try {
            return this.parseJson<ReadFileInput>(input);
        } catch {
            return { path: input.trim() };
        }
    }
}
