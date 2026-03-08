const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

// SVG 文件内容
const iconSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#FFFFFF"/>
  <g transform="translate(262, 312)">
    <rect x="0" y="100" width="100" height="300" rx="4" fill="#000000"/>
    <rect x="0" y="0" width="100" height="220" rx="4" fill="#000000" transform="rotate(18, 50, 200)"/>
    <rect x="400" y="0" width="100" height="220" rx="4" fill="#000000" transform="rotate(-18, 450, 200)"/>
    <rect x="400" y="100" width="100" height="300" rx="4" fill="#000000"/>
  </g>
</svg>`;

const adaptiveIconSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(168, 168)">
    <rect x="0" y="144" width="120" height="400" rx="6" fill="#000000"/>
    <rect x="0" y="0" width="120" height="280" rx="6" fill="#000000" transform="rotate(20, 60, 280)"/>
    <rect x="568" y="0" width="120" height="280" rx="6" fill="#000000" transform="rotate(-20, 628, 280)"/>
    <rect x="568" y="144" width="120" height="400" rx="6" fill="#000000"/>
  </g>
</svg>`;

const splashIconSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#FFFFFF"/>
  <g transform="translate(287, 362)">
    <rect x="0" y="75" width="90" height="225" rx="4" fill="#000000"/>
    <rect x="0" y="0" width="90" height="165" rx="4" fill="#000000" transform="rotate(18, 45, 150)"/>
    <rect x="360" y="0" width="90" height="165" rx="4" fill="#000000" transform="rotate(-18, 405, 150)"/>
    <rect x="360" y="75" width="90" height="225" rx="4" fill="#000000"/>
  </g>
</svg>`;

const faviconSvg = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" fill="#FFFFFF"/>
  <g transform="translate(12, 14)">
    <rect x="0" y="4" width="5" height="16" rx="1" fill="#000000"/>
    <rect x="0" y="0" width="5" height="12" rx="1" fill="#000000" transform="rotate(18, 2.5, 10)"/>
    <rect x="19" y="0" width="5" height="12" rx="1" fill="#000000" transform="rotate(-18, 21.5, 10)"/>
    <rect x="19" y="4" width="5" height="16" rx="1" fill="#000000"/>
  </g>
</svg>`;

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

    // Generate favicon.png (48x48 and 32x32)
    await sharp(Buffer.from(faviconSvg))
      .resize(48, 48)
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));
    console.log('✓ Generated favicon.png (48x48)');

    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
