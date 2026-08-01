import { BaseTool, type ToolResult } from "./baseTool.js";
import { ReadFileTool } from "./readFile.js";

export class ToolRegistry {
    private tools = new Map<string, BaseTool>();

    constructor() {
        this.register(new ReadFileTool());
    }

    register(tool: BaseTool): void {
        this.tools.set(tool.name, tool);
    }

    getToolDescriptions(): string {
        return [...this.tools.values()]
            .map((tool) => `- ${tool.name}: ${tool.description}`)
            .join("\n");
    }

    async execute(name: string, input: string): Promise<ToolResult> {
        const tool = this.tools.get(name);

        if (!tool) {
            return {
                success: false,
                output: `Unknown tool: ${name}`,
            };
        }

        return tool.execute(input);
    }
}