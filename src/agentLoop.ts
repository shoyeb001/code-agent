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
        this.addUserMessage(userInput);

        const executedToolCalls = new Set<string>();

        for (let step = 0; step < 10; step++) {
            const res = await askModel(this.messages);
            const toolCall = this.parseToolCall(res);

            if (!toolCall) {
                if (this.shouldRejectFinalAnswer(userInput, res)) {
                    this.addUserMessage(`
  Your previous answer used guessing language.

  You must inspect the source before answering. Call read_file for the files you are describing.
  Do not answer with words like likely, probably, might, could, seems, or possibly.
  `.trim());

                    continue;
                }

                this.addAssistantMessage(res);
                return res;
            }

            const toolCallKey = `${toolCall.tool}:${toolCall.input}`;

            if (executedToolCalls.has(toolCallKey)) {
                this.addUserMessage(`
  You already called ${toolCall.tool} with this same input:
  ${toolCall.input}

  Do not repeat the same tool call. Use a different tool/input or answer with the information you have.
  `.trim());

                continue;
            }

            executedToolCalls.add(toolCallKey);

            const toolResult = await this.tools.execute(
                toolCall.tool,
                toolCall.input
            );

            this.addAssistantMessage(res);

            this.addUserMessage(`
  Tool result for ${toolCall.tool}:

  Success: ${toolResult.success}

  Output:
  ${toolResult.output}

  Continue working on the original user request.
  If this output is only a file list, read the important files before explaining code behavior.
  `.trim());
        }

        return "Stopped: too many tool calls. Please try a more specific request.";
    }

    private shouldRejectFinalAnswer(
        userInput: string,
        answer: string
    ): boolean {
        const userAskedForCodeExplanation =
            /\b(explain|what is|how does|structure|code|project|folder|file)\b/i.test(userInput);

        const answerSoundsLikeGuess =
            /\b(likely|probably|might|could|seems|possibly)\b/i.test(answer);

        return userAskedForCodeExplanation && answerSoundsLikeGuess;
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
  - When exploring a folder, call list_files with recursive true and maxDepth 3.
  - Do not guess what a file does only from its name.
  - If the user asks to explain code, read the relevant files before answering.
  - If you only have filenames and not file contents, do not explain behavior yet. Call read_file.
  - If your answer would use words like "likely", "probably", "might", or "could", call another tool instead.
  - After receiving a tool result, either call another tool if more information is needed, or answer the user directly.
  - Do not repeat the same tool call with the same input.

  Tool call format:
  {
    "type": "tool_call",
    "tool": "list_files",
    "input": "{\\"path\\":\\"src\\",\\"recursive\\":true,\\"maxDepth\\":3}"
  }

  Examples:

  User: explain the src folder
  Assistant:
  {
    "type": "tool_call",
    "tool": "list_files",
    "input": "{\\"path\\":\\"src\\",\\"recursive\\":true,\\"maxDepth\\":3}"
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
