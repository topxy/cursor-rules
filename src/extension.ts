// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Cursor Rules extension is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('cursor-rules-huasheng.addRules', async (uri?: vscode.Uri) => {
		try {
			// 1. 获取目标路径
			let targetFolder: string;
			if (uri) {
				// 如果是右键点击触发，使用点击的文件夹路径
				targetFolder = uri.fsPath;
			} else {
				// 如果是命令面板触发，使用当前工作区根目录
				const workspaceFolders = vscode.workspace.workspaceFolders;
				if (!workspaceFolders) {
					vscode.window.showErrorMessage('请先打开一个项目文件夹！');
					return;
				}
				targetFolder = workspaceFolders[0].uri.fsPath;
			}

			// 2. 获取规则文件夹列表
			const rulesPath = path.join(context.extensionPath, 'rules');
			const folders = fs.readdirSync(rulesPath).filter(folder => {
				const stat = fs.statSync(path.join(rulesPath, folder));
				return stat.isDirectory() && !folder.startsWith('.');
			});

			// 3. 让用户选择文件夹，并显示描述信息
			const selectedFolder = await vscode.window.showQuickPick(
				folders.map(folder => ({
					label: folder,
					description: getRuleDescription(path.join(rulesPath, folder, '.cursorrules')),
					detail: '点击查看规则预览'
				})), {
					placeHolder: '选择要添加的规则类型',
				}
			);

			if (!selectedFolder) {
				return;
			}

			const sourcePath = path.join(rulesPath, selectedFolder.label, '.cursorrules');
			const targetPath = path.join(targetFolder, '.cursorrules');

			// 4. 检查源文件是否存在
			if (!fs.existsSync(sourcePath)) {
				vscode.window.showErrorMessage(`${selectedFolder.label}文件夹中没有找到.cursorrules文件！`);
				return;
			}

			// 5. 直接询问是否添加规则
			const confirmed = await confirmAction(`是否要添加 ${selectedFolder.label} 的 Cursor 规则？`);
			if (!confirmed) {
				return;
			}

			// 6. 检查目标文件是否存在
			if (fs.existsSync(targetPath)) {
				const action = await vscode.window.showWarningMessage(
					'目标目录已存在.cursorrules文件，请选择操作：',
					'覆盖',
					'合并',
					'取消'
				);

				if (action === '取消' || !action) {
					return;
				}

				if (action === '合并') {
					// 直接合并文件，不显示预览
					const sourceContent = fs.readFileSync(sourcePath, 'utf8');
					const targetContent = fs.readFileSync(targetPath, 'utf8');
					const mergedContent = `# 原有规则\n${targetContent}\n\n# 新增规则\n${sourceContent}`;
					fs.writeFileSync(targetPath, mergedContent);
					vscode.window.showInformationMessage(`成功合并 ${selectedFolder.label} 的 Cursor 规则！`);
					return;
				}
			}

			// 7. 复制或覆盖文件
			fs.copyFileSync(sourcePath, targetPath);
			vscode.window.showInformationMessage(`成功添加 ${selectedFolder.label} 的 Cursor 规则！`);

		} catch (error) {
			vscode.window.showErrorMessage(`添加规则失败: ${error}`);
		}
	});

	context.subscriptions.push(disposable);
}

// 获取规则文件的描述信息（读取文件的前几行作为描述）
function getRuleDescription(rulePath: string): string {
	try {
		if (fs.existsSync(rulePath)) {
			const content = fs.readFileSync(rulePath, 'utf8');
			const firstLines = content.split('\n').slice(0, 2).join(' ').trim();
			return firstLines || '无描述信息';
		}
	} catch (error) {
		console.error('读取规则描述失败:', error);
	}
	return '无描述信息';
}

// 移除 showRulePreview 函数，改为直接显示确认对话框
async function confirmAction(message: string): Promise<boolean> {
	const result = await vscode.window.showInformationMessage(
		message,
		'确认',
		'取消'
	);
	return result === '确认';
}

// This method is called when your extension is deactivated
export function deactivate() {}
