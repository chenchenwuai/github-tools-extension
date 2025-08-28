// GitHub Tools Extension - 共享配置
// 默认工具配置，供 popup.js 和 content.js 共享使用

// 默认配置选项
const DEFAULT_CONFIG = {
  showDetailedUrls: false // 是否在下拉列表中显示详细URL
};

const DEFAULT_TOOLS = [
  {
    name: 'GitHub.dev',
    url: 'https://github.dev/{owner}/{repo}',
    description: 'GitHub官方在线VS Code编辑器'
  },
  {
    name: 'GitHub1s',
    url: 'https://github1s.com/{owner}/{repo}',
    description: '在VS Code界面中浏览GitHub仓库代码'
  },
  {
    name: 'GitMCP',
    url: 'https://gitmcp.io/{owner}/{repo}',
    description: '为AI助手提供GitHub项目文档和代码访问的MCP服务器'
  },
  {
    name: 'Active Forks',
    url: 'https://github.com/{owner}/{repo}/forks?include=active&page=1&period=&sort_by=last_updated',
    description: '查看最近有更新的活跃fork仓库列表'
  },
  {
    name: 'Sourcegraph',
    url: 'https://sourcegraph.com/github.com/{owner}/{repo}',
    description: '跨仓库代码搜索和浏览'
  }
];

// 导出配置（支持多种模块系统）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEFAULT_TOOLS, DEFAULT_CONFIG };
} else if (typeof window !== 'undefined') {
  window.GitHubToolsConfig = { DEFAULT_TOOLS, DEFAULT_CONFIG };
}
