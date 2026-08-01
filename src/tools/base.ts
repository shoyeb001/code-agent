export type ToolResult = {
    success: boolean;
    output: string;
};

export abstract class BaseTool {
    abstract readonly name: string;
    abstract readonly description: string;
    abstract execute(input: string): Promise<ToolResult>;
}
