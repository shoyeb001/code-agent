import path from "node:path";
import type { z } from "zod";

export type ToolResult = {
    success: boolean;
    output: string;
};

export abstract class BaseTool<TInput> {
    abstract readonly name: string;
    abstract readonly description: string;
    abstract readonly schema: z.ZodType<TInput>;

    constructor(protected readonly projectRoot: string = process.cwd()) { }

    abstract execute(input: TInput): Promise<ToolResult>;

    protected resolveProjectPath(inputPath: string): string {
        const resolvedPath = path.resolve(this.projectRoot, inputPath);
        const relativePath = path.relative(this.projectRoot, resolvedPath);

        if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
            throw new Error(`Path is outside project root: ${inputPath}`);
        }

        return resolvedPath;
    }
}
