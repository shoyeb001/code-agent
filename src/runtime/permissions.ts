// this is permission manager
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export type PermissionAction = 'write_file' | 'edit_file' | 'bash';

export class PermissionManager {
    constructor(private readonly projectRoot: string = process.cwd()) {

    }
    public resolveProjectPath(inputPath: string): string {
        const resolvedPath = path.resolve(this.projectRoot, inputPath);
        const relativePath = path.relative(this.projectRoot, resolvedPath);
        if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
            throw new Error(`Path is outside project root: ${inputPath}`);
        }
        return resolvedPath;
    }

    // get permission from user
    async requestPermission(action: PermissionAction, target: string): Promise<boolean> {
        const rl = readline.createInterface({ input, output });
        try {
            const answer = await rl.question(`Allow ${action} on ${target}? Type "yes" to allow`) // later move to select between yes and know
            return answer.trim().toLowerCase() === 'yes';

        } catch (error) {
            throw new Error(`Something went wrong`);
        } finally {
            rl.close();
        }
    }
}