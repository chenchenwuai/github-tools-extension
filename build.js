#!/usr/bin/env node

/**
 * GitHub Tools Extension 构建脚本
 * 用于生成不同平台的扩展包
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const config = {
  sourceDir: __dirname,
  outputDir: path.join(__dirname, 'dist'),
  platforms: ['chrome', 'firefox', 'edge']
};

// 清理输出目录
function cleanOutput() {
  console.log('🧹 清理输出目录...');
  if (fs.existsSync(config.outputDir)) {
    fs.rmSync(config.outputDir, { recursive: true });
  }
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// 复制源文件
function copySourceFiles(targetDir) {
  const filesToCopy = [
    'config.js',
    'content.js',
    'style.css',
    'background.js',
    'popup.html',
    'popup.css',
    'popup.js',
    'logo.png',
    'README.md'
  ];

  filesToCopy.forEach(file => {
    const source = path.join(config.sourceDir, file);
    const target = path.join(targetDir, file);
    
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, target);
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} (文件不存在)`);
    }
  });
}

// 生成Chrome版本manifest
function generateChromeManifest() {
  return {
    "manifest_version": 3,
    "name": "GitHub Tools",
    "version": "1.0.0",
    "description": "在 GitHub 仓库页面显示相关第三方工具链接",
    "icons": {
      "16": "logo.png",
      "48": "logo.png",
      "128": "logo.png"
    },
    "permissions": [
      "activeTab",
      "storage"
    ],
    "content_scripts": [
      {
        "matches": ["https://github.com/*/*"],
        "js": ["config.js", "content.js"],
        "css": ["style.css"],
        "run_at": "document_end"
      }
    ],
    "action": {
      "default_popup": "popup.html",
      "default_title": "GitHub Tools Settings"
    },
    "background": {
      "service_worker": "background.js"
    }
  };
}

// 生成Firefox版本manifest
function generateFirefoxManifest() {
  return {
    "manifest_version": 2,
    "name": "GitHub Tools",
    "version": "1.0.0",
    "description": "在 GitHub 仓库页面显示相关第三方工具链接",
    "icons": {
      "16": "logo.png",
      "48": "logo.png",
      "128": "logo.png"
    },
    "permissions": [
      "activeTab",
      "storage"
    ],
    "content_scripts": [
      {
        "matches": ["https://github.com/*/*"],
        "js": ["config.js", "content.js"],
        "css": ["style.css"],
        "run_at": "document_end"
      }
    ],
    "browser_action": {
      "default_popup": "popup.html",
      "default_title": "GitHub Tools Settings"
    },
    "background": {
      "scripts": ["background.js"],
      "persistent": false
    }
  };
}

// 生成Edge版本manifest (与Chrome相同)
function generateEdgeManifest() {
  return generateChromeManifest();
}

// 构建特定平台
function buildPlatform(platform) {
  console.log(`\n📦 构建 ${platform.toUpperCase()} 版本...`);
  
  const platformDir = path.join(config.outputDir, platform);
  fs.mkdirSync(platformDir, { recursive: true });
  
  // 复制源文件
  copySourceFiles(platformDir);
  
  // 生成对应的manifest.json
  let manifest;
  switch (platform) {
    case 'chrome':
      manifest = generateChromeManifest();
      break;
    case 'firefox':
      manifest = generateFirefoxManifest();
      break;
    case 'edge':
      manifest = generateEdgeManifest();
      break;
    default:
      throw new Error(`不支持的平台: ${platform}`);
  }
  
  // 写入manifest.json
  const manifestPath = path.join(platformDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`  ✅ manifest.json (${platform})`);
  
  // 创建ZIP包
  const zipName = `github-tools-${platform}-v${manifest.version}.zip`;
  const zipPath = path.join(config.outputDir, zipName);
  
  try {
    execSync(`cd "${platformDir}" && zip -r "../${zipName}" .`, { stdio: 'inherit' });
    console.log(`  📦 ${zipName}`);
  } catch (error) {
    console.error(`  ❌ 创建ZIP包失败: ${error.message}`);
  }
}

// 生成发布信息
function generateReleaseInfo() {
  const releaseInfo = {
    version: "1.0.0",
    buildTime: new Date().toISOString(),
    platforms: config.platforms,
    files: []
  };
  
  // 扫描生成的文件
  const files = fs.readdirSync(config.outputDir);
  files.forEach(file => {
    if (file.endsWith('.zip')) {
      const filePath = path.join(config.outputDir, file);
      const stats = fs.statSync(filePath);
      releaseInfo.files.push({
        name: file,
        size: stats.size,
        platform: file.includes('chrome') ? 'chrome' : 
                 file.includes('firefox') ? 'firefox' : 
                 file.includes('edge') ? 'edge' : 'unknown'
      });
    }
  });
  
  // 写入发布信息
  const releaseInfoPath = path.join(config.outputDir, 'release-info.json');
  fs.writeFileSync(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));
  
  console.log('\n📋 发布信息:');
  console.log(`版本: ${releaseInfo.version}`);
  console.log(`构建时间: ${releaseInfo.buildTime}`);
  console.log('生成的文件:');
  releaseInfo.files.forEach(file => {
    console.log(`  📦 ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
  });
}

// 主函数
function main() {
  console.log('🚀 GitHub Tools Extension 构建工具\n');
  
  try {
    // 清理输出目录
    cleanOutput();
    
    // 构建各平台版本
    config.platforms.forEach(platform => {
      buildPlatform(platform);
    });
    
    // 生成发布信息
    generateReleaseInfo();
    
    console.log('\n✅ 构建完成！');
    console.log(`📁 输出目录: ${config.outputDir}`);
    
  } catch (error) {
    console.error('\n❌ 构建失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { main, buildPlatform, config };
