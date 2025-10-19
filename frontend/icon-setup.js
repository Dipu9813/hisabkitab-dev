const fs = require("fs");
const path = require("path");

// Create simple colored squares as placeholder icons
// In a real app, you'd use proper icon generation tools like @capacitor/assets

const createIcon = (size, outputPath) => {
  // Create SVG icon content
  const svgContent = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial, sans-serif" font-size="${
    size * 0.4
  }" font-weight="bold">₹</text>
</svg>`;

  // Write SVG file (you can convert to PNG using tools like sharp if needed)
  fs.writeFileSync(outputPath.replace(".png", ".svg"), svgContent);

  console.log(`Created icon: ${outputPath}`);
};

// Icon sizes for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(__dirname, "public");

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate icons
iconSizes.forEach((size) => {
  const iconPath = path.join(publicDir, `icon-${size}x${size}.png`);
  createIcon(size, iconPath);
});

console.log("✅ Icon setup completed!");
console.log(
  "📝 Note: SVG icons created. For production, convert to PNG using tools like Sharp or Imagemagick."
);
console.log(
  "💡 Consider using professional icon generation tools like @capacitor/assets for better results."
);
