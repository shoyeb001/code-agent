import { askModel, type ChatMessage } from "./model.js";
import { ToolRegistry } from "./tools/toolRegistry.js";

type ToolCall = {
    type: "tool_call",
    tool: string,
    input: string
}
export class Agent {
    private messages: ChatMessage[];
    private tools: ToolRegistry;
    constructor(systemPrompt?: string) {
        this.tools = new ToolRegistry();
        this.messages = [
            {
                role: "system",
                content: systemPrompt ?? this.createSystemPrompt()
            }
        ]
    }

    public async run(userInput: string): Promise<string> {
        //adding user messages
        this.addUserMessage(userInput);
        const res = await askModel(this.messages);
        const toolCall = this.parseToolCall(res);
        if (!toolCall) {
            this.addAssistantMessage(res);
            return res;
        }
        const toolResult = await this.tools.execute(toolCall.tool, toolCall.input);
        // adding ai meesages
        this.addAssistantMessage(res);
        this.addUserMessage(`
  Calling tool ${toolCall.tool}:

  Success: ${toolResult.success}

  Output:
  ${toolResult.output}.
  `);

        const finalRes = await askModel(this.messages);
        this.addAssistantMessage(finalRes);
        return finalRes;
    }
    public getHistory(): ChatMessage[] {
        return [...this.messages];
    }

    public clearHistory(): void {
        const systemMessage = this.messages[0];
        this.messages = systemMessage ? [systemMessage] : [];
    }
    private addUserMessage(content: string): void {
        this.messages.push({
            role: "user",
            content,
        });
    }

    private addAssistantMessage(content: string): void {
        this.messages.push({
            role: "assistant",
            content,
        });
    }

    private createSystemPrompt(): string {
        return `
           You are a coding agent.

            You can answer normally, or request a tool.

          Available tools:
         ${this.tools.getToolDescriptions()}

          If you need a tool, respond only with valid JSON like this:
      {
       "type": "tool_call",
       "tool": "read_file",
       "input": "src/index.ts"
    }

     Do not wrap JSON in markdown.
     Do not explain when calling a tool.
     If no tool is needed, answer normally.
     `.trim();
    }

    private parseToolCall(response: string): ToolCall | null {
        try {
            const parsed = JSON.parse(response) as Partial<ToolCall>;
            if (
                parsed.type === "tool_call" &&
                typeof parsed.tool === "string" &&
                typeof parsed.input === "string"
            ) {
                return {
                    type: "tool_call",
                    tool: parsed.tool,
                    input: parsed.input,
                };
            }

            return null;
        } catch {
            return null;
        }
    }
}