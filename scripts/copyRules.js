const fs = require('fs');
const path = require('path');

// 确保 rules 目录存在
const rulesDir = path.join(__dirname, '..', 'rules');
if (!fs.existsSync(rulesDir)) {
    fs.mkdirSync(rulesDir);
}

// 复制 .cursor-rules 中的内容到 rules 目录
const sourceDir = path.join(__dirname, '..', '.cursor-rules');
if (fs.existsSync(sourceDir)) {
    fs.readdirSync(sourceDir).forEach(file => {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(rulesDir, file);
        
        if (fs.statSync(sourcePath).isDirectory()) {
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true });
            }
            
            // 复制 .cursorrules 文件
            const sourceRuleFile = path.join(sourcePath, '.cursorrules');
            const targetRuleFile = path.join(targetPath, '.cursorrules');
            if (fs.existsSync(sourceRuleFile)) {
                fs.copyFileSync(sourceRuleFile, targetRuleFile);
            }
        }
    });
} 