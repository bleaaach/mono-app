const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

// 新的极简图标设计 - 四个圆角矩形模块，右下留白
const iconSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- 圆角背景 -->
  <rect width="1024" height="1024" rx="230" fill="#FFFFFF"/>
  
  <!-- 左上模块 -->
  <rect x="212" y="212" width="280" height="280" rx="40" fill="#1A1A1A"/>
  
  <!-- 右上模块 -->
  <rect x="532" y="212" width="280" height="280" rx="40" fill="#1A1A1A"/>
  
  <!-- 左下模块 -->
  <rect x="212" y="532" width="280" height="280" rx="40" fill="#1A1A1A"/>
  
  <!-- 右下镂空（留白/背景色），代表"极简=留白" -->
</svg>`;

// Android 自适应图标版本（无背景，只保留图形）
const adaptiveIconSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- 左上模块 -->
  <rect x="212" y="212" width="280" height="280" rx="40" fill="#1A1A1A"/>
  
  <!-- 右上模块 -->
  <rect x="532" y="212" width="280" height="280" rx="40" fill="#1A1A1A"/>
  
  <!-- 左下模块 -->
  <rect x="212" y="532" width="280" height="280" rx="40" fill="#1A1A1A"/>
  
  <!-- 右下镂空（留白/背景色），代表"极简=留白" -->
</svg>`;

// 启动屏图标（稍小一点，居中显示）
const splashIconSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- 圆角背景 -->
  <rect width="1024" height="1024" rx="230" fill="#FFFFFF"/>
  
  <!-- 左上模块 -->
  <rect x="262" y="262" width="220" height="220" rx="32" fill="#1A1A1A"/>
  
  <!-- 右上模块 -->
  <rect x="542" y="262" width="220" height="220" rx="32" fill="#1A1A1A"/>
  
  <!-- 左下模块 -->
  <rect x="262" y="542" width="220" height="220" rx="32" fill="#1A1A1A"/>
  
  <!-- 右下镂空（留白/背景色），代表"极简=留白" -->
</svg>`;

// Favicon 版本（小尺寸简化版）
const faviconSvg = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- 圆角背景 -->
  <rect width="48" height="48" rx="10" fill="#FFFFFF"/>
  
  <!-- 左上模块 -->
  <rect x="10" y="10" width="13" height="13" rx="2" fill="#1A1A1A"/>
  
  <!-- 右上模块 -->
  <rect x="25" y="10" width="13" height="13" rx="2" fill="#1A1A1A"/>
  
  <!-- 左下模块 -->
  <rect x="10" y="25" width="13" height="13" rx="2" fill="#1A1A1A"/>
  
  <!-- 右下镂空（留白/背景色），代表"极简=留白" -->
</svg>`;

// Android 图标尺寸配置
const androidIconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

async function generateIcons() {
  try {
    // Generate icon.png (1024x1024)
    await sharp(Buffer.from(iconSvg))
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));
    console.log('✓ Generated icon.png (1024x1024)');

    // Generate adaptive-icon.png (1024x1024)
    await sharp(Buffer.from(adaptiveIconSvg))
      .png()
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    console.log('✓ Generated adaptive-icon.png (1024x1024)');

    // Generate splash-icon.png (1024x1024)
    await sharp(Buffer.from(splashIconSvg))
      .png()
      .toFile(path.join(assetsDir, 'splash-icon.png'));
    console.log('✓ Generated splash-icon.png (1024x1024)');

    // Generate favicon.png (48x48)
    await sharp(Buffer.from(faviconSvg))
      .resize(48, 48)
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));
    console.log('✓ Generated favicon.png (48x48)');

    // Generate Android mipmap icons
    console.log('\n📱 Generating Android mipmap icons...');
    
    for (const [folder, size] of Object.entries(androidIconSizes)) {
      const folderPath = path.join(androidResDir, folder);
      
      // 确保目录存在
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // 生成 ic_launcher.webp (使用带背景的图标)
      await sharp(Buffer.from(iconSvg))
        .resize(size, size)
        .webp({ quality: 90 })
        .toFile(path.join(folderPath, 'ic_launcher.webp'));

      // 生成 ic_launcher_round.webp (圆形图标，使用相同图标)
      await sharp(Buffer.from(iconSvg))
        .resize(size, size)
        .webp({ quality: 90 })
        .toFile(path.join(folderPath, 'ic_launcher_round.webp'));

      // 生成 ic_launcher_foreground.webp (自适应图标前景)
      await sharp(Buffer.from(adaptiveIconSvg))
        .resize(size, size)
        .webp({ quality: 90 })
        .toFile(path.join(folderPath, 'ic_launcher_foreground.webp'));

      console.log(`  ✓ Generated ${folder} icons (${size}x${size})`);
    }

    // 生成 mipmap-anydpi-v26 的 XML 文件
    const anydpiDir = path.join(androidResDir, 'mipmap-anydpi-v26');
    if (!fs.existsSync(anydpiDir)) {
      fs.mkdirSync(anydpiDir, { recursive: true });
    }

    const icLauncherXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;

    fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), icLauncherXml);
    fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), icLauncherXml);
    console.log('  ✓ Generated mipmap-anydpi-v26 XML files');

    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
