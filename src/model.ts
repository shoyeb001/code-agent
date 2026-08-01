import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const token = process.env.HF_TOKEN;
const modelName =
  process.env.HF_MODEL ?? "Qwen/Qwen2.5-Coder-7B-Instruct:fastest";

if (!token) {
  throw new Error("Missing HF_TOKEN in .env");
}

const llm = new ChatOpenAI({
  model: modelName,
  apiKey: token,
  temperature: 0.2,
  maxTokens: 1024,
  configuration: {
    baseURL: "https://router.huggingface.co/v1",
  },
});

function toLangChainMessages(messages: ChatMessage[]): BaseMessage[] {
  return messages.map((message) => {
    if (message.role === "system") {
      return new SystemMessage(message.content);
    }

    if (message.role === "user") {
      return new HumanMessage(message.content);
    }

    return new AIMessage(message.content);
  });
}

export async function askModel(messages: ChatMessage[]): Promise<string> {
  const response = await llm.invoke(toLangChainMessages(messages));

  if (typeof response.content === "string") {
    return response.content;
  }

  return JSON.stringify(response.content);
}
