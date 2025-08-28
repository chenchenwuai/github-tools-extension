#!/usr/bin/env node

/**
 * 开发服务器脚本
 * 监听文件变化并自动重新加载扩展
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DevServer {
  constructor() {
    this.sourceDir = path.resolve(__dirname, '..');
    this.watchedFiles = [
      'manifest.json',
      'config.js',
      'content.js',
      'style.css',
      'background.js',
      'popup.html',
      'popup.css',
      'popup.js'
    ];
    this.isWatching = false;
  }

  // 检查Chrome是否安装
  checkChrome() {
    try {
      execSync('which google-chrome || which google-chrome-stable || which chromium', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  // 显示开发指南
  showDevGuide() {
    console.log('🛠️  GitHub Tools Extension 开发模式\n');
    console.log('📋 开发步骤:');
    console.log('1. 打开 Chrome 浏览器');
    console.log('2. 访问 chrome://extensions/');
    console.log('3. 启用 "开发者模式"');
    console.log('4. 点击 "加载已解压的扩展程序"');
    console.log(`5. 选择文件夹: ${this.sourceDir}`);
    console.log('6. 修改代码后点击扩展的刷新按钮\n');
    
    console.log('📁 项目结构:');
    this.watchedFiles.forEach(file => {
      const exists = fs.existsSync(path.join(this.sourceDir, file));
      console.log(`  ${exists ? '✅' : '❌'} ${file}`);
    });
  }

  // 验证扩展文件
  validateExtension() {
    console.log('\n🔍 验证扩展文件...');
    
    const manifestPath = path.join(this.sourceDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      console.error('❌ manifest.json 文件不存在');
      return false;
    }

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log(`✅ 扩展名称: ${manifest.name}`);
      console.log(`✅ 版本: ${manifest.version}`);
      console.log(`✅ Manifest版本: ${manifest.manifest_version}`);
      
      // 检查必需的权限
      if (manifest.permissions) {
        console.log(`✅ 权限: ${manifest.permissions.join(', ')}`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ manifest.json 格式错误:', error.message);
      return false;
    }
  }

  // 启动文件监听
  startWatching() {
    if (this.isWatching) return;
    
    console.log('\n👀 开始监听文件变化...');
    console.log('按 Ctrl+C 停止监听\n');
    
    this.isWatching = true;
    
    this.watchedFiles.forEach(file => {
      const filePath = path.join(this.sourceDir, file);
      if (fs.existsSync(filePath)) {
        fs.watchFile(filePath, (curr, prev) => {
          if (curr.mtime !== prev.mtime) {
            console.log(`📝 文件已修改: ${file} (${new Date().toLocaleTimeString()})`);
            console.log('💡 请在 chrome://extensions/ 中点击扩展的刷新按钮');
          }
        });
        console.log(`  👀 监听: ${file}`);
      }
    });
  }

  // 停止监听
  stopWatching() {
    if (!this.isWatching) return;
    
    this.watchedFiles.forEach(file => {
      const filePath = path.join(this.sourceDir, file);
      if (fs.existsSync(filePath)) {
        fs.unwatchFile(filePath);
      }
    });
    
    this.isWatching = false;
    console.log('\n🛑 已停止文件监听');
  }

  // 生成开发版本
  buildDev() {
    console.log('\n🔨 生成开发版本...');
    
    const devDir = path.join(this.sourceDir, 'dev-build');
    
    // 清理开发目录
    if (fs.existsSync(devDir)) {
      fs.rmSync(devDir, { recursive: true });
    }
    fs.mkdirSync(devDir, { recursive: true });
    
    // 复制文件
    this.watchedFiles.forEach(file => {
      const source = path.join(this.sourceDir, file);
      const target = path.join(devDir, file);
      
      if (fs.existsSync(source)) {
        fs.copyFileSync(source, target);
        console.log(`  ✅ ${file}`);
      }
    });
    
    // 复制图标
    const logoPath = path.join(this.sourceDir, 'logo.png');
    if (fs.existsSync(logoPath)) {
      fs.copyFileSync(logoPath, path.join(devDir, 'logo.png'));
      console.log('  ✅ logo.png');
    }
    
    console.log(`\n📁 开发版本已生成: ${devDir}`);
    console.log('💡 可以加载此目录作为开发扩展');
  }

  // 启动开发模式
  start() {
    this.showDevGuide();
    
    if (!this.validateExtension()) {
      console.error('\n❌ 扩展验证失败，请检查文件');
      return;
    }
    
    this.buildDev();
    this.startWatching();
    
    // 处理退出信号
    process.on('SIGINT', () => {
      this.stopWatching();
      process.exit(0);
    });
    
    // 保持进程运行
    setInterval(() => {}, 1000);
  }
}

// 主函数
function main() {
  const devServer = new DevServer();
  devServer.start();
}

if (require.main === module) {
  main();
}

module.exports = DevServer;
