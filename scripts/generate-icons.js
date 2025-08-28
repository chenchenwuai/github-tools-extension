#!/usr/bin/env node

/**
 * 图标生成脚本
 * 从单个源图标生成不同尺寸的图标文件
 */

const fs = require('fs');
const path = require('path');

// 需要的图标尺寸
const iconSizes = [16, 48, 128];

function generateIcons() {
  const sourceIcon = path.join(__dirname, '../logo.png');
  const iconsDir = path.join(__dirname, '../icons');
  
  // 创建icons目录
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  // 检查源图标是否存在
  if (!fs.existsSync(sourceIcon)) {
    console.error('❌ 源图标文件不存在: logo.png');
    console.log('请确保项目根目录有 logo.png 文件');
    return;
  }
  
  console.log('📸 生成不同尺寸的图标...');
  
  // 复制源图标到icons目录
  iconSizes.forEach(size => {
    const targetIcon = path.join(iconsDir, `icon-${size}.png`);
    fs.copyFileSync(sourceIcon, targetIcon);
    console.log(`  ✅ icon-${size}.png`);
  });
  
  // 生成manifest图标配置
  const iconConfig = {};
  iconSizes.forEach(size => {
    iconConfig[size] = `icons/icon-${size}.png`;
  });
  
  console.log('\n📋 Manifest图标配置:');
  console.log(JSON.stringify({ icons: iconConfig }, null, 2));
  
  console.log('\n💡 提示: 如需不同尺寸的图标，请使用图像编辑工具调整尺寸');
}

if (require.main === module) {
  generateIcons();
}

module.exports = { generateIcons };
