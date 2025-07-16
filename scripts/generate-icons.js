import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// iOS requires specific icon sizes for "Add to Home Screen"
const iconSizes = [
  { size: 180, name: 'apple-touch-icon-180x180.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 120, name: 'apple-touch-icon-120x120.png' },
  { size: 76, name: 'apple-touch-icon-76x76.png' },
  { size: 60, name: 'apple-touch-icon-60x60.png' },
  { size: 40, name: 'apple-touch-icon-40x40.png' },
  // Standard PWA icon sizes
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 384, name: 'icon-384x384.png' }
];

async function generateIcons() {
  const svgPath = path.join(__dirname, '../public/pwa-icon.svg');
  const publicDir = path.join(__dirname, '../public');
  
  console.log('Generating PNG icons from SVG...');
  
  for (const icon of iconSizes) {
    try {
      await sharp(svgPath)
        .resize(icon.size, icon.size)
        .png()
        .toFile(path.join(publicDir, icon.name));
      
      console.log(`✅ Generated ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${icon.name}:`, error.message);
    }
  }
  
  console.log('\n🎉 Icon generation complete!');
}

generateIcons().catch(console.error); 