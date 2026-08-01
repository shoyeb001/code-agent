import { readFile } from "node:fs/promises";
import { z } from "zod";
import { BaseTool, type ToolResult } from "./baseTool.js";

const readFileSchema = z.object({
    path: z.string().min(1),
});

type ReadFileInput = z.infer<typeof readFileSchema>;

export class ReadFileTool extends BaseTool<ReadFileInput> {
    readonly name = 'read_file';
    readonly description = 'Read a file from the project folder. Input: {"path":"src/index.ts"}';
    readonly schema = readFileSchema;

    async execute(input: ReadFileInput): Promise<ToolResult> {
        try {
            const filePath = this.resolveProjectPath(input.path);
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
}
