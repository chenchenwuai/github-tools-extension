# Chrome Web Store 发布指南

## 📋 发布前准备

### 1. 开发者账户注册
- 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
- 使用Google账户登录
- **支付一次性注册费用：$5 USD**
- 完成开发者身份验证

### 2. 扩展打包准备
确保以下文件完整且正确：
- ✅ `manifest.json` - 配置完整，包含图标
- ✅ `logo.png` - 扩展图标（建议128x128px）
- ✅ 所有源代码文件
- ✅ 文档文件（README.md, INSTALL.md等）

## 🎯 发布步骤

### 第一步：创建ZIP包
1. 选择扩展文件夹中的所有文件
2. 创建ZIP压缩包（不要包含文件夹本身）
3. 确保ZIP包大小 < 128MB

**打包命令（可选）：**
```bash
cd /Users/xxcc/code/Personnel/Learning/github-tools-extension
zip -r github-tools-extension.zip . -x "*.git*" "*.DS_Store*" "node_modules/*"
```

### 第二步：上传扩展
1. 登录 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. 点击 **"Add new item"**
3. 上传准备好的ZIP文件
4. 等待上传和初步验证完成

### 第三步：填写商店信息

#### 基本信息
- **扩展名称**: `GitHub Tools`
- **简短描述**: `在GitHub仓库页面快速访问第三方开发工具`
- **详细描述**:
```
GitHub Tools 是一个Chrome浏览器扩展，为GitHub仓库页面提供便捷的第三方工具访问功能。

🎯 主要功能：
• 智能检测GitHub仓库页面
• 快速访问5个内置开发工具
• 支持添加自定义工具链接
• 完整的配置管理和使用统计
• 完美融入GitHub原生界面设计

🛠️ 内置工具：
• GitHub.dev - GitHub官方在线VS Code编辑器
• GitHub1s - VS Code界面浏览GitHub代码
• GitMCP - AI助手的GitHub项目访问服务
• Active Forks - 查看活跃的fork仓库
• Sourcegraph - 跨仓库代码搜索

✨ 特色：
• 无需网络请求，保护隐私安全
• 支持自定义工具和配置导出
• 使用统计和智能推荐
• 响应式设计，支持深色模式

适合开发者、代码审查员和GitHub重度用户使用。
```

#### 图标和截图
- **128x128 图标**: 使用 `logo.png`
- **截图要求**: 1280x800 或 640x400
- **建议准备3-5张截图**:
  1. GitHub页面中的工具下拉菜单
  2. 扩展管理界面 - 工具标签
  3. 扩展管理界面 - 设置标签
  4. 扩展管理界面 - 统计标签
  5. 自定义工具添加界面

#### 分类和标签
- **主要类别**: `Developer Tools`
- **标签**: `github`, `developer-tools`, `productivity`, `code-review`

#### 隐私信息
- **权限说明**:
  - `activeTab`: 检测当前GitHub页面URL
  - `storage`: 保存用户配置和使用统计
- **隐私政策**: 说明不收集用户数据，所有信息本地存储

### 第四步：发布设置

#### 可见性设置
- **公开**: 所有用户可见
- **不公开**: 仅通过链接访问
- **私有**: 仅指定用户可见

#### 定价
- **免费扩展**

#### 地区限制
- **全球发布**（推荐）

## 📝 商店页面优化

### 关键词优化
在描述中包含相关关键词：
- GitHub
- Developer Tools
- Code Review
- VS Code
- Sourcegraph
- Productivity
- Web Development

### 截图建议
1. **主功能截图**: 显示GitHub页面中的工具下拉菜单
2. **管理界面**: 展示扩展的配置功能
3. **工具列表**: 显示内置工具的丰富性
4. **自定义功能**: 展示添加自定义工具的能力

## ⚠️ 审核注意事项

### 常见拒绝原因
- **权限过度**: 只请求必要权限
- **功能不明确**: 确保描述清晰
- **截图质量差**: 使用高质量截图
- **隐私政策缺失**: 说明数据处理方式

### 审核时间
- **首次提交**: 通常1-3个工作日
- **更新版本**: 通常几小时到1天

### 提高通过率
- ✅ 详细的功能描述
- ✅ 高质量的截图和图标
- ✅ 清晰的权限说明
- ✅ 完整的隐私政策
- ✅ 遵循Chrome扩展政策

## 🔄 发布后管理

### 版本更新
1. 修改 `manifest.json` 中的版本号
2. 重新打包ZIP文件
3. 在开发者控制台上传新版本
4. 填写更新说明
5. 提交审核

### 用户反馈
- 定期查看用户评价和反馈
- 及时回复用户问题
- 根据反馈优化功能

### 统计数据
- 监控安装量和活跃用户
- 分析用户使用模式
- 优化扩展性能

## 📞 技术支持

### 有用链接
- [Chrome扩展开发文档](https://developer.chrome.com/docs/extensions/)
- [Chrome Web Store政策](https://developer.chrome.com/docs/webstore/program-policies/)
- [开发者支持](https://support.google.com/chrome_webstore/contact/developer_support)

### 常见问题
**Q: 审核被拒绝怎么办？**
A: 仔细阅读拒绝原因，修改后重新提交

**Q: 如何提高扩展排名？**
A: 优化关键词、提高用户评分、增加安装量

**Q: 可以修改已发布的扩展吗？**
A: 可以，但需要重新审核

---

**准备就绪后，即可开始发布流程！**
