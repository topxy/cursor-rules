import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface RuleCategory {
    id: string;
    name: string;
    description: string;
    isBuiltin: boolean;
    isModified: boolean;
    lastModified: string;
}

interface ConfigFile {
    version: string;
    lastUpdate: string;
    categories: RuleCategory[];
}

export class RuleManager {
    private userRulesPath: string;
    private configPath: string;
    private config: ConfigFile;

    constructor(private context: vscode.ExtensionContext) {
        // 初始化用户规则目录
        this.userRulesPath = path.join(os.homedir(), '.cursor-rules');
        this.configPath = path.join(this.userRulesPath, 'config.json');
        this.initializeUserRules();
    }

    private initializeUserRules() {
        // 创建用户规则目录（如果不存在）
        if (!fs.existsSync(this.userRulesPath)) {
            fs.mkdirSync(this.userRulesPath, { recursive: true });
            this.copyBuiltinRules();
        }

        // 加载或创建配置文件
        if (fs.existsSync(this.configPath)) {
            this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        } else {
            this.config = this.createInitialConfig();
            this.saveConfig();
        }
    }

    private copyBuiltinRules() {
        const builtinRulesPath = path.join(this.context.extensionPath, 'rules');
        if (fs.existsSync(builtinRulesPath)) {
            this.copyFolderRecursive(builtinRulesPath, this.userRulesPath);
        }
    }

    private copyFolderRecursive(src: string, dest: string) {
        const exists = fs.existsSync(src);
        const stats = exists && fs.statSync(src);
        const isDirectory = exists && stats.isDirectory();

        if (isDirectory) {
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest);
            }
            fs.readdirSync(src).forEach(childItemName => {
                this.copyFolderRecursive(
                    path.join(src, childItemName),
                    path.join(dest, childItemName)
                );
            });
        } else {
            fs.copyFileSync(src, dest);
        }
    }

    private createInitialConfig(): ConfigFile {
        return {
            version: "1.0.0",
            lastUpdate: new Date().toISOString(),
            categories: []
        };
    }

    private saveConfig() {
        fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 4));
    }

    // 获取所有规则
    async getAllRules(): Promise<RuleCategory[]> {
        return this.config.categories;
    }

    // 创建新规则
    async createRule(name: string, description: string): Promise<void> {
        const id = this.generateRuleId(name);
        const rulePath = path.join(this.userRulesPath, name);

        // 创建规则目录
        fs.mkdirSync(rulePath, { recursive: true });

        // 创建空的规则文件
        const ruleFilePath = path.join(rulePath, '.cursorrules');
        fs.writeFileSync(ruleFilePath, '# Role\n# Goal\n');

        // 添加到配置
        this.config.categories.push({
            id,
            name,
            description,
            isBuiltin: false,
            isModified: true,
            lastModified: new Date().toISOString()
        });

        this.saveConfig();
    }

    // 编辑规则
    async editRule(id: string): Promise<void> {
        const rule = this.config.categories.find(r => r.id === id);
        if (!rule) {
            throw new Error('Rule not found');
        }

        const rulePath = path.join(this.userRulesPath, rule.name, '.cursorrules');
        
        // 如果是内置规则且未修改过，先复制到用户目录
        if (rule.isBuiltin && !rule.isModified) {
            const builtinPath = path.join(this.context.extensionPath, 'rules', rule.name, '.cursorrules');
            if (fs.existsSync(builtinPath)) {
                fs.copyFileSync(builtinPath, rulePath);
            }
            rule.isModified = true;
            rule.lastModified = new Date().toISOString();
            this.saveConfig();
        }

        // 打开编辑器
        const doc = await vscode.workspace.openTextDocument(rulePath);
        await vscode.window.showTextDocument(doc);
    }

    // 删除规则
    async deleteRule(id: string): Promise<void> {
        const ruleIndex = this.config.categories.findIndex(r => r.id === id);
        if (ruleIndex === -1) {
            throw new Error('Rule not found');
        }

        const rule = this.config.categories[ruleIndex];
        const rulePath = path.join(this.userRulesPath, rule.name);

        // 只允许删除非内置规则
        if (rule.isBuiltin) {
            throw new Error('Cannot delete built-in rules');
        }

        // 删除规则目录
        if (fs.existsSync(rulePath)) {
            fs.rmSync(rulePath, { recursive: true });
        }

        // 从配置中移除
        this.config.categories.splice(ruleIndex, 1);
        this.saveConfig();
    }

    private generateRuleId(name: string): string {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
} 