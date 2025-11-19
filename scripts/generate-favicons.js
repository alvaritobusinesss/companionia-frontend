const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create public directory if it doesn't exist
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

// Copy the favicon.ico to the root for maximum compatibility
if (fs.existsSync('public/favicon.ico')) {
  fs.copyFileSync('public/favicon.ico', 'favicon.ico');
  console.log('✅ Copied favicon.ico to root');
}

// Generate favicon.ico with multiple sizes using ImageMagick
try {
  // Check if ImageMagick is installed
  execSync('convert --version');
  
  // Generate favicon.ico with multiple sizes (16x16, 32x32, 48x48, 64x64)
  execSync('convert public/favicon.ico -define icon:auto-resize=16,32,48,64 public/favicon.ico');
  console.log('✅ Optimized favicon.ico with multiple sizes');
  
  // Generate PNG variants
  const sizes = [16, 32, 180];
  for (const size of sizes) {
    const output = `public/favicon-${size}x${size}.png`;
    execSync(`convert public/favicon.ico -resize ${size}x${size} ${output}`);
    console.log(`✅ Generated ${output}`);
  }
  
  // Generate apple-touch-icon.png (180x180)
  if (fs.existsSync('public/favicon-180x180.png')) {
    fs.copyFileSync('public/favicon-180x180.png', 'public/apple-touch-icon.png');
    console.log('✅ Generated apple-touch-icon.png');
  }
  
  console.log('\n🎉 Favicons generated successfully!');
  console.log('\nNext steps:');
  console.log('1. Commit and push the changes');
  console.log('2. Deploy to update the favicon on your live site');
  console.log('3. Use Facebook Sharing Debugger to refresh the cache: https://developers.facebook.com/tools/debug/');
} catch (error) {
  console.error('❌ Error generating favicons. Make sure ImageMagick is installed:');
  console.error('   macOS: brew install imagemagick');
  console.error('   Ubuntu/Debian: sudo apt-get install imagemagick');
  console.error('   Windows: https://imagemagick.org/script/download.php');
  process.exit(1);
}
