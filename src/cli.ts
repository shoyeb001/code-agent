import { Agent } from "./agentLoop.js";
const prompt = process.argv.slice(2).join(" ");
if (!prompt) {
    console.error("Please provide a prompt in the command line");
    process.exit(1);
}

const agent = new Agent();
const answer = await agent.run(prompt);
console.log(answer);