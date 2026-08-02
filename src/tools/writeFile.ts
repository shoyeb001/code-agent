// tool for writing files 
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { BaseTool, type ToolResult } from "./baseTool.js";
import { PermissionManager } from "../runtime/permissions.js";

const writeFileSchema = z.object({
    path: z.string().min(1),
    content: z.string(),
});

type WriteFileInput = z.infer<typeof writeFileSchema>;

export class WriteFileTool extends BaseTool<WriteFileInput> {
    readonly name = "write_file";
    readonly description = "Write a file to the project directory. Input should be a JSON object with 'path' and 'content' fields.";

    constructor(
        projectRoot: string = process.cwd(),
        private readonly permissions = new PermissionManager(projectRoot)
    ) {
        super(projectRoot);
    }

    async execute(input: { path: string; content: string; }): Promise<ToolResult> {
        try {
            const filePath = this.permissions.resolveProjectPath(input.path);
            const allowed = await this.permissions.requestPermission(
                'write_file',
                input.path
            );
            if (!allowed) {
                return {
                    success: false,
                    output: "permission denied"
                }
            }
            await mkdir(path.dirname(filePath), { recursive: true });
            await writeFile(filePath, input.content, 'utf8');
            return {
                success: true,
                output: `File written to ${filePath}`
            };
        } catch (error) {
            return {
                success: false,
                output: error instanceof Error ? error.message : String(error),
            }
        }
    }
}