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
const provider = process.env.MODEL_PROVIDER ?? "ollama";

if (provider === "hf" && !token) {
  throw new Error("Missing HF_TOKEN in .env");
}

const llm =
  provider === "ollama"
    ? new ChatOpenAI({
        model: process.env.OLLAMA_MODEL ?? "qwen3.5:0.8b",
        apiKey: "ollama",
        temperature: 0.2,
        maxTokens: 1024,
        configuration: {
          baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
        },
      })
    : new ChatOpenAI({
        model:
          process.env.HF_MODEL ?? "Qwen/Qwen2.5-Coder-7B-Instruct:fastest",
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
