const fs = require('fs');
const path = require('path');

// Create icons directory
const iconDir = 'www/assets/icon';
if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
}

// Simple placeholder icon creation without canvas dependency
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create a simple 1x1 transparent PNG as placeholder
const transparentPNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    'base64'
);

// Create icon files for each size
sizes.forEach(size => {
    const filename = `icon-${size}x${size}.png`;
    const filepath = path.join(iconDir, filename);
    
    try {
        fs.writeFileSync(filepath, transparentPNG);
        console.log(`Created icon: ${filename}`);
    } catch (error) {
        console.error(`Error creating ${filename}:`, error.message);
    }
});

// Create main icon and logo files
fs.writeFileSync(path.join(iconDir, 'icon.png'), transparentPNG);
fs.writeFileSync(path.join(iconDir, 'logo.png'), transparentPNG);

console.log('Icon placeholders created successfully');
console.log('Note: These are placeholder icons. Replace with actual app icons before production.');

// Create a simple favicon
const faviconSVG = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" fill="#2196F3"/>
    <circle cx="16" cy="16" r="10" fill="white"/>
    <text x="16" y="20" text-anchor="middle" fill="#2196F3" font-family="Arial" font-size="8" font-weight="bold">AI</text>
</svg>`;

fs.writeFileSync(path.join(iconDir, 'favicon.svg'), faviconSVG);
console.log('Created favicon.svg');

// Create screenshots directory
const screenshotDir = 'www/assets/screenshots';
if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
    console.log('Created screenshots directory');
}