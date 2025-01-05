import * as vscode from 'vscode';

export class RulePanel {
    public static currentPanel: RulePanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, rules: any[]) {
        this._panel = panel;
        this._panel.webview.html = this._getWebviewContent(rules);
        
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public static show(context: vscode.ExtensionContext, rules: any[]) {
        if (RulePanel.currentPanel) {
            RulePanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'cursorRules',
            'Cursor Rules 管理',
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );

        RulePanel.currentPanel = new RulePanel(panel, rules);
    }

    private _getWebviewContent(rules: any[]) {
        return `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { 
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                }
                .rule-card {
                    border: 1px solid #ccc;
                    margin: 10px 0;
                    padding: 15px;
                    border-radius: 5px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .rule-info {
                    flex: 1;
                }
                .rule-actions {
                    display: flex;
                    gap: 10px;
                }
                button {
                    padding: 8px 16px;
                    border-radius: 4px;
                    border: none;
                    cursor: pointer;
                }
                .add-btn {
                    background: #007acc;
                    color: white;
                }
                .edit-btn {
                    background: #4CAF50;
                    color: white;
                }
                .delete-btn {
                    background: #f44336;
                    color: white;
                }
            </style>
        </head>
        <body>
            <h2>Cursor Rules 管理</h2>
            <div id="rules-container">
                ${rules.map(rule => `
                    <div class="rule-card">
                        <div class="rule-info">
                            <h3>${rule.name}</h3>
                            <p>${rule.description}</p>
                        </div>
                        <div class="rule-actions">
                            <button class="add-btn" onclick="addRule('${rule.id}')">添加</button>
                            <button class="edit-btn" onclick="editRule('${rule.id}')">编辑</button>
                            ${!rule.isBuiltin ? `<button class="delete-btn" onclick="deleteRule('${rule.id}')">删除</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                
                function addRule(id) {
                    vscode.postMessage({ command: 'addRule', ruleId: id });
                }
                
                function editRule(id) {
                    vscode.postMessage({ command: 'editRule', ruleId: id });
                }
                
                function deleteRule(id) {
                    vscode.postMessage({ command: 'deleteRule', ruleId: id });
                }
            </script>
        </body>
        </html>`;
    }

    public dispose() {
        RulePanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
} 