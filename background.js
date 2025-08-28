// GitHub Tools Extension - Background Script

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
  console.log('GitHub Tools Extension installed', details);
  
  // 设置默认配置
  chrome.storage.sync.set({
    enabledTools: [0, 1, 2, 3, 4, 5], // 默认启用所有工具
    customTools: [],
    usageStats: {}
  });
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'openSettings':
      handleOpenSettings();
      break;
      
    case 'trackUsage':
      handleTrackUsage(message);
      break;
      
    case 'getRepoInfo':
      handleGetRepoInfo(message, sendResponse);
      return true; // 保持消息通道开放
      
    default:
      console.log('Unknown message action:', message.action);
  }
});

// 打开设置页面
function handleOpenSettings() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('popup.html')
  });
}

// 记录工具使用统计
async function handleTrackUsage(message) {
  try {
    const { usageStats } = await chrome.storage.sync.get(['usageStats']);
    const stats = usageStats || {};
    
    const key = `${message.owner}/${message.repo}`;
    if (!stats[key]) {
      stats[key] = {};
    }
    
    if (!stats[key][message.tool]) {
      stats[key][message.tool] = 0;
    }
    
    stats[key][message.tool]++;
    
    await chrome.storage.sync.set({ usageStats: stats });
    
    console.log(`Usage tracked: ${message.tool} for ${key}`);
  } catch (error) {
    console.error('Failed to track usage:', error);
  }
}

// 获取仓库信息（可扩展用于API调用）
async function handleGetRepoInfo(message, sendResponse) {
  try {
    // 这里可以添加GitHub API调用来获取更多仓库信息
    // 目前返回基本信息
    const repoInfo = {
      owner: message.owner,
      repo: message.repo,
      url: `https://github.com/${message.owner}/${message.repo}`
    };
    
    sendResponse({ success: true, data: repoInfo });
  } catch (error) {
    console.error('Failed to get repo info:', error);
    sendResponse({ success: false, error: error.message });
  }
}
