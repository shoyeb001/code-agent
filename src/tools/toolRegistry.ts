import { z } from "zod";
import { BaseTool, type ToolResult } from "./baseTool.js";
import { ReadFileTool } from "./readFile.js";
import { ListFilesTool } from "./listFiles.js";

export class ToolRegistry {
    private tools = new Map<string, BaseTool<any>>();

    constructor() {
        this.register(new ReadFileTool());
        this.register(new ListFilesTool());
    }

    register(tool: BaseTool<any>): void {
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

        let parsedJson: unknown;

        try {
            parsedJson = JSON.parse(input);
        } catch {
            parsedJson = { path: input.trim() };
        }

        const parsedInput = tool.schema.safeParse(parsedJson);

        if (!parsedInput.success) {
            return {
                success: false,
                output: z.prettifyError(parsedInput.error),
            };
        }

        return tool.execute(parsedInput.data);
    }
}
