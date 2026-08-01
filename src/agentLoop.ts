import { askModel, type ChatMessage } from "./model.js";

export class Agent {
    private messages: ChatMessage[];
    constructor(systemPrompt?: string) {
        this.messages = [
            {
                role: "system",
                content: systemPrompt ?? "You are a helpful assistant."
            }
        ]
    }

    public async run(userInput: string): Promise<string> {
        //adding user messages
        this.addUserMessage(userInput);
        const answer = await askModel(this.messages);
        // adding ai meesages
        this.addAssistantMessage(answer);
        return answer;
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
}