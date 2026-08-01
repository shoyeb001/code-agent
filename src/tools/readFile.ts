import { readFile } from "node:fs/promises";
import { BaseTool, type ToolResult } from "./baseTool.js";
import path from "node:path";

export class ReadFileTool extends BaseTool {
    readonly name = 'read_file';
    readonly description = "Read a file from the project folder."

    async execute(input: string): Promise<ToolResult> {
        try {
            const filePath = path.resolve(process.cwd(), input);
            const content = await readFile(input, 'utf-8');
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
}