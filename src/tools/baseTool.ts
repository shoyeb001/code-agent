import path from "node:path";

export type ToolResult = {
    success: boolean;
    output: string;
};

export abstract class BaseTool {
    abstract readonly name: string;
    abstract readonly description: string;

    constructor(protected readonly projectRoot: string = process.cwd()) {}

    abstract execute(input: string): Promise<ToolResult>;

    protected resolveProjectPath(inputPath: string): string {
        const resolvedPath = path.resolve(this.projectRoot, inputPath);
        const relativePath = path.relative(this.projectRoot, resolvedPath);

        if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
            throw new Error(`Path is outside project root: ${inputPath}`);
        }

        return resolvedPath;
    }

    protected parseJson<T>(input: string): T {
        return JSON.parse(input) as T;
    }
}
