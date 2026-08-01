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
        //adding agent loop calling
        for (let step = 0; step < 5; step++) {
            const res = await askModel(this.messages);
            console.log("Model response:", res);
            const toolCall = this.parseToolCall(res);
            console.log("Parsed tool call:", toolCall);
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
        }

        return "Stopped: too many tool calls. Please try a more specific request.";
        // const finalRes = await askModel(this.messages);
        // this.addAssistantMessage(finalRes);
        // return finalRes;
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

  You can either:
  1. Answer normally, if you already know the answer.
  2. Call a tool, if you need project/file information.

  Available tools:
  ${this.tools.getToolDescriptions()}

  Rules:
  - If the user asks about files, folders, project structure, source code, package.json, or implementation details, you MUST call a tool.
  - Do not describe the tools to the user.
  - Do not say which tools are available.
  - When calling a tool, respond ONLY with valid JSON.
  - Do not wrap JSON in markdown.
  - Do not add explanation before or after JSON.

  Tool call format:
  {
    "type": "tool_call",
    "tool": "list_files",
    "input": "{\\"path\\":\\".\\"}"
  }

  Examples:

  User: what files are in this project?
  Assistant:
  {
    "type": "tool_call",
    "tool": "list_files",
    "input": "{\\"path\\":\\".\\"}"
  }

  User: read package.json
  Assistant:
  {
    "type": "tool_call",
    "tool": "read_file",
    "input": "{\\"path\\":\\"package.json\\"}"
  }

  User: hello
  Assistant:
  Hello! How can I help?
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