const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = path.join(__dirname, '../public/icons/base-icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Generate each size
    for (const size of sizes) {
      const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
      await sharp(inputFile)
        .resize(size, size)
        .png()
        .toFile(outputFile);
      console.log(`Generated ${size}x${size} icon`);
    }

    // Generate favicon.ico (32x32)
    await sharp(inputFile)
      .resize(32, 32)
      .toFile(path.join(__dirname, '../public/favicon.ico'));
    console.log('Generated favicon.ico');

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
