// GitHub Tools Extension - Content Script
(function() {
  'use strict';
  
  // 从共享配置文件获取默认工具和配置，如果不可用则使用备用配置
  const DEFAULT_TOOLS = window.GitHubToolsConfig ? window.GitHubToolsConfig.DEFAULT_TOOLS : [];
  
  const DEFAULT_CONFIG = window.GitHubToolsConfig ? window.GitHubToolsConfig.DEFAULT_CONFIG : {
    showDetailedUrls: false
  };
  
  let currentOwner = '';
  let currentRepo = '';
  let toolsContainer = null;
  
  // 初始化
  function init() {
    // 检测是否为仓库页面
    if (!detectRepositoryPage()) {
      return;
    }
    
    // 等待页面加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createToolsUI);
    } else {
      createToolsUI();
    }
    
    // 监听页面变化（GitHub使用PJAX）
    observePageChanges();
  }
  
  // 检测是否为GitHub仓库页面
  function detectRepositoryPage() {
    const path = window.location.pathname;
    
    // 严格匹配 github.com/owner/repo 格式
    // 只匹配 /owner/repo 或 /owner/repo/ (不允许后面有其他路径)
    const match = path.match(/^\/([^\/]+)\/([^\/]+)\/?$/);
    
    if (!match) return false;
    
    const owner = match[1];
    const repo = match[2];
    
    // 排除GitHub的特殊页面和路径
    const excludedOwners = ['settings', 'notifications', 'explore', 'marketplace', 'sponsors', 'orgs', 'enterprises', 'topics', 'collections', 'events', 'new', 'organizations', 'users', 'login', 'join', 'pricing', 'features', 'security', 'team', 'enterprise', 'customer-stories', 'readme', 'site'];
    const excludedRepos = ['settings', 'notifications', 'repositories', 'projects', 'packages', 'stars', 'followers', 'following'];
    
    if (excludedOwners.includes(owner) || excludedRepos.includes(repo)) {
      return false;
    }
    
    // 确保是有效的仓库路径格式
    if (owner.length === 0 || repo.length === 0) {
      return false;
    }
    
    currentOwner = owner;
    currentRepo = repo;
    
    console.log(`GitHub Tools: 检测到仓库 ${owner}/${repo}`);
    return true;
  }
  
  // 创建工具UI
  async function createToolsUI() {
    // 检查是否已存在容器，避免重复插入
    if (document.getElementById('github-tools-extension')) {
      console.log('GitHub Tools: 容器已存在，跳过插入');
      return;
    }
    
    // 移除已存在的工具容器
    removeExistingContainer();
    
    // 查找合适的插入位置
    const insertTarget = findInsertTarget();
    if (!insertTarget) {
      console.log('GitHub Tools: 未找到合适的插入位置');
      return;
    }
    
    // 创建工具容器
    toolsContainer = await createToolsContainer();
    
    // 插入到第一个位置
    if (insertTarget.firstChild) {
      insertTarget.insertBefore(toolsContainer, insertTarget.firstChild);
      console.log('GitHub Tools: UI已插入到第一个位置');
    } else {
      insertTarget.appendChild(toolsContainer);
      console.log('GitHub Tools: UI已插入到容器中');
    }
  }
  
  // 查找插入位置 - 插入到pagehead-actions第一个位置
  function findInsertTarget() {
    // 直接查找pagehead-actions容器
    const pageheadActions = document.querySelector('.pagehead-actions');
    if (pageheadActions) {
      return pageheadActions;
    }
    
    // 如果找不到，回退到原来的位置
    const fallbackTargets = [
      '.Layout-sidebar',
      '.repository-content .Box:first-child',
      '.repository-content',
      '.Layout-main'
    ];
    
    for (const selector of fallbackTargets) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }
    
    return null;
  }
  
  // 创建工具容器
  async function createToolsContainer() {
    const container = document.createElement('li');
    container.id = 'github-tools-extension';
    container.className = 'github-tools-container';
    
    // 创建Watch风格的按钮
    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'github-tools-wrapper';
    
    const button = document.createElement('button');
    button.className = 'github-tools-button btn-sm btn';
    button.type = 'button';
    button.innerHTML = `
      <svg class="octicon octicon-tools" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path fill="none" d="M0 0h24v24H0z"></path><path d="M11.9998 1L6 11H18L11.9998 1ZM11.9998 4.8873L14.4676 9H9.53232L11.9998 4.8873ZM6.75 20C5.23122 20 4 18.7688 4 17.25C4 15.7312 5.23122 14.5 6.75 14.5C8.26878 14.5 9.5 15.7312 9.5 17.25C9.5 18.7688 8.26878 20 6.75 20ZM6.75 22C9.37335 22 11.5 19.8734 11.5 17.25C11.5 14.6266 9.37335 12.5 6.75 12.5C4.12665 12.5 2 14.6266 2 17.25C2 19.8734 4.12665 22 6.75 22ZM15 15.5V19.5H19V15.5H15ZM13 21.5V13.5H21V21.5H13Z"></path></svg>
      <span class="github-tools-text">Links</span>
      <span class="dropdown-caret"></span>
    `;
    
    // 创建下拉菜单
    const dropdown = document.createElement('div');
    dropdown.className = 'github-tools-dropdown';
    dropdown.style.display = 'none';
    
    // 添加工具列表
    await loadAndCreateToolsList(dropdown);
    
    // 绑定事件
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown(dropdown, button);
    });
    
    // 点击外部关闭下拉菜单
    document.addEventListener('click', () => {
      dropdown.style.display = 'none';
      button.classList.remove('selected');
    });
    
    buttonWrapper.appendChild(button);
    container.appendChild(buttonWrapper);
    container.appendChild(dropdown);
    
    return container;
  }
  
  // 加载并创建工具列表
  async function loadAndCreateToolsList(dropdown) {
    try {
      // 从存储中获取用户配置的工具
      const result = await chrome.storage.sync.get(['customTools', 'enabledTools']);
      const customTools = result.customTools || [];
      const enabledTools = result.enabledTools || DEFAULT_TOOLS.map((_, index) => index);
      
      // 合并默认工具和自定义工具
      const allTools = [...DEFAULT_TOOLS, ...customTools];
      
      // 只显示启用的工具
      const enabledToolsList = allTools.filter((_, index) => enabledTools.includes(index));
      
      // 创建工具项
      for (const tool of enabledToolsList) {
        const item = await createToolItem(tool);
        dropdown.appendChild(item);
      }
      
      // 设置选项
      const settingsItem = document.createElement('div');
      settingsItem.className = 'github-tools-item settings';
      settingsItem.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 1L21.5 6.5V17.5L12 23L2.5 17.5V6.5L12 1ZM12 3.311L4.5 7.65311V16.3469L12 20.689L19.5 16.3469V7.65311L12 3.311ZM12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16ZM12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z"></path></svg>
        <span>扩展设置</span>
      `;
      
      settingsItem.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'openSettings' });
        dropdown.style.display = 'none';
      });
      
      dropdown.appendChild(settingsItem);
      
    } catch (error) {
      console.error('GitHub Tools: 加载工具列表失败', error);
      
      // 回退到基本工具列表
      const basicTools = [
        { name: '复制仓库信息', action: 'copy-info', icon: '📋' },
        { name: '复制克隆命令', action: 'copy-clone', icon: '📥' },
        { name: '打开Issues', action: 'open-issues', icon: '🐛' }
      ];
      
      basicTools.forEach(tool => {
        const item = createBasicToolItem(tool);
        dropdown.appendChild(item);
      });
    }
  }
  
  // 获取存储的配置
  async function getStoredConfig() {
    try {
      const result = await chrome.storage.sync.get(['config']);
      return result.config || DEFAULT_CONFIG;
    } catch (error) {
      console.error('获取配置失败:', error);
      return DEFAULT_CONFIG;
    }
  }

  // 创建工具项
  async function createToolItem(tool) {
    const item = document.createElement('div');
    item.className = 'github-tools-item';
    
    const url = tool.url.replace('{owner}', currentOwner).replace('{repo}', currentRepo);
    
    // 获取配置决定是否显示URL
    const config = await getStoredConfig();
    const showUrls = config.showDetailedUrls;
    
    const urlElement = showUrls ? `<div class="tool-url">${url}</div>` : '';
    
    item.innerHTML = `
      <div class="tool-info">
        <div class="tool-name">${tool.name}</div>
        <div class="tool-description">${tool.description}</div>
        ${urlElement}
      </div>
      <svg class="external-link" width="14" height="14"  viewBox="0 0 24 24" fill="currentColor"><path fill="none" d="M0 0h24v24H0z"></path><path d="M10 6V8H5V19H16V14H18V20C18 20.5523 17.5523 21 17 21H4C3.44772 21 3 20.5523 3 20V7C3 6.44772 3.44772 6 4 6H10ZM21 3V11H19L18.9999 6.413L11.2071 14.2071L9.79289 12.7929L17.5849 5H13V3H21Z"></path></svg>
    `;
    
    item.addEventListener('click', () => {
      window.open(url, '_blank');
      
      // 发送使用统计
      chrome.runtime.sendMessage({
        action: 'trackUsage',
        tool: tool.name,
        owner: currentOwner,
        repo: currentRepo
      });
    });
    
    return item;
  }
  
  // 切换下拉菜单显示
  function toggleDropdown(dropdown, button) {
    if (dropdown.style.display === 'none') {
      dropdown.style.display = 'block';
      button.classList.add('selected');
    } else {
      dropdown.style.display = 'none';
      button.classList.remove('selected');
    }
  }
  
  // 移除已存在的容器
  function removeExistingContainer() {
    const existing = document.getElementById('github-tools-extension');
    if (existing) {
      existing.remove();
    }
  }
  
  // 监听页面变化
  function observePageChanges() {
    // GitHub使用PJAX，需要监听pushstate事件
    let lastUrl = location.href;
    let isProcessing = false; // 防止并发执行
    
    const handlePageChange = () => {
      if (isProcessing) return;
      isProcessing = true;
      
      setTimeout(() => {
        if (detectRepositoryPage()) {
          createToolsUI();
        } else {
          removeExistingContainer();
        }
        isProcessing = false;
      }, 500);
    };
    
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        handlePageChange();
      }
    }).observe(document, { subtree: true, childList: true });
    
    // 监听popstate事件
    window.addEventListener('popstate', handlePageChange);
  }
  
  // 启动扩展
  init();
  
})();
