# Code Agent Development Context

## Goal

Build a Claude Code-style coding agent clone for learning. Keep the implementation class-based and understandable. Use LangChain only as the model wrapper for now; keep tool orchestration, validation, permissions, and execution in our own code.

## Current Architecture

- `src/cli.ts` is the CLI entry point.
- `src/model.ts` wraps the LLM using `ChatOpenAI`.
- `src/agentLoop.ts` owns the agent loop, conversation history, tool-call parsing, duplicate tool-call prevention, and weak-answer rejection.
- `src/tools/baseTool.ts` defines the abstract class for tools.
- `src/tools/toolRegistry.ts` registers tools, parses tool input JSON, validates input with Zod, and executes the selected tool.

## Model Setup

`src/model.ts` now supports Ollama through the OpenAI-compatible endpoint.

Current default `.env` setup:

```env
MODEL_PROVIDER=ollama
OLLAMA_MODEL=qwen3.5:0.8b
OLLAMA_BASE_URL=http://localhost:11434/v1
```

Hugging Face can still be used by setting:

```env
MODEL_PROVIDER=hf
HF_TOKEN=...
HF_MODEL=...
```

## Implemented Tools

### `read_file`

File: `src/tools/readFile.ts`

Purpose: read a file from the project folder.

Input:

```json
{"path":"src/agentLoop.ts"}
```

### `list_files`

File: `src/tools/listFiles.ts`

Purpose: list files and folders. Supports recursive listing.

Input:

```json
{"path":"src","recursive":true,"maxDepth":3}
```

### `grep`

File: `src/tools/grep.ts`

Purpose: search text inside project files and return matching file paths, line numbers, and lines.

Input:

```json
{"pattern":"class Agent","path":"src","caseSensitive":false,"maxResults":20}
```

Verified query:

```bash
npm run dev -- where is Agent class defined?
```

Result: correctly found `Agent` in `src/agentLoop.ts`.

## Tool System Direction

We checked the main Claude Code source. It does not use LangChain or LangGraph for core tool orchestration. It uses a custom tool system:

- tool definitions include schemas
- API layer sends tool schemas to model
- model returns native `tool_use` blocks
- runner validates input
- runner checks permissions
- runner calls the tool
- result is sent back as `tool_result`

For this learning clone, continue with:

```txt
Class-based tools
Zod input schemas
Custom ToolRegistry
Custom Agent loop
Manual JSON tool-call format for now
```

Later, after the loop is clear, native OpenAI/Anthropic tool calling can replace manual JSON parsing if the selected model/provider supports it reliably.

## Important Current Behaviors

`Agent.run()`:

- loops up to 10 steps
- parses model JSON tool calls
- rejects duplicate tool calls with same tool and input
- rejects final answers that sound like guesses for code/project explanation requests
- forces the model to inspect source files instead of guessing from filenames

`parseToolCall()` currently accepts only tool calls with exactly:

```json
{
  "type": "tool_call",
  "tool": "...",
  "input": "..."
}
```

It rejects extra fields like `output`.

## Next Implementation Step

Implement a write/edit safety layer before adding risky tools.

Recommended next order:

1. Add a `PermissionManager` class in `src/runtime/permissions.ts`.
2. Implement `write_file` with permission checks.
3. Implement `edit_file` using exact string replacement.
4. Add a `bash` tool only after permissions are clear.

Suggested `PermissionManager` responsibilities:

- allow read-only tools automatically
- ask or deny write tools by default
- block paths outside project root
- block dangerous shell commands when `bash` is added

## Useful Commands

```bash
cd code-agent
npm run build
npm run dev -- where is Agent class defined?
npm run dev -- what files are in src?
npm run dev -- read package.json
```

If using Ollama:

```bash
ollama serve
ollama list
ollama pull qwen3.5:0.8b
```
