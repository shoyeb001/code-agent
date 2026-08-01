import { askModel, type ChatMessage } from "./model.js";

const prompt = process.argv.slice(2).join(" ");
if (!prompt) {
    console.error("Please provide a prompt in the command line");
    process.exit(1);
}

const messages: ChatMessage[] = [
    {
        role: "system",
        content: "You are a coing agent. Give practical code answers "
    },
    {
        role: "user",
        content: prompt
    }
]

const answer = await askModel(messages);
console.log(answer);