/**
 * Retro Asset Organizer for Project Prism Protocol
 * 
 * This script helps organize downloaded GoldenEye/N64-style assets into the proper project structure.
 * Place your downloaded asset ZIP files in a 'downloads' folder, then run this script.
 * 
 * Usage:
 * 1. Create a 'downloads' folder in the project root
 * 2. Place downloaded asset ZIP files in the 'downloads' folder
 * 3. Run: node scripts/organize-retro-assets.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

// Try to import decompress (you'll need to install this)
let decompress;
try {
  decompress = require('decompress');
} catch (error) {
  console.error('Please install decompress: npm install decompress');
  process.exit(1);
}

// Configuration
const config = {
  // Base directories
  downloadsDir: path.resolve(__dirname, '../downloads'),
  texturesDir: path.resolve(__dirname, '../src/assets/textures'),
  modelsDir: path.resolve(__dirname, '../src/assets/models'),
  tempDir: path.resolve(__dirname, '../temp'),
  
  // Asset mappings
  assetMappings: [
    // PSX Pistol Pack
    {
      zipPattern: /psx.?pistol/i,
      targetDir: 'training/retro/weapons',
      modelExtensions: ['.obj', '.fbx', '.gltf', '.glb'],
      textureExtensions: ['.png', '.jpg', '.jpeg', '.tga']
    },
    // PSX MP5
    {
      zipPattern: /psx.?mp5/i,
      targetDir: 'training/retro/weapons',
      modelExtensions: ['.obj', '.fbx', '.gltf', '.glb'],
      textureExtensions: ['.png', '.jpg', '.jpeg', '.tga']
    },
    // PSX Misc Gun Pack
    {
      zipPattern: /psx.?(misc|gun)/i,
      targetDir: 'training/retro/weapons',
      modelExtensions: ['.obj', '.fbx', '.gltf', '.glb'],
      textureExtensions: ['.png', '.jpg', '.jpeg', '.tga']
    },
    // PSX Ammo Boxes
    {
      zipPattern: /psx.?ammo/i,
      targetDir: 'training/retro/weapons',
      modelExtensions: ['.obj', '.fbx', '.gltf', '.glb'],
      textureExtensions: ['.png', '.jpg', '.jpeg', '.tga']
    },
    // Classic64 Asset Library
    {
      zipPattern: /classic64/i,
      targetDir: 'training/retro/environment',
      modelExtensions: ['.obj', '.fbx', '.gltf', '.glb'],
      textureExtensions: ['.png', '.jpg', '.jpeg', '.tga']
    },
    // PSX Tools Pack
    {
      zipPattern: /psx.?tools/i,
      targetDir: 'training/retro/props',
      modelExtensions: ['.obj', '.fbx', '.gltf', '.glb'],
      textureExtensions: ['.png', '.jpg', '.jpeg', '.tga']
    },
    // Retro FPS Asset Pack
    {
      zipPattern: /retro.?fps/i,
      targetDir: 'training/retro/props',
      modelExtensions: ['.obj', '.fbx', '.gltf', '.glb'],
      textureExtensions: ['.png', '.jpg', '.jpeg', '.tga']
    },
    // AmbientCG Textures
    {
      zipPattern: /(Concrete|Metal|Tiles|Asphalt|Wood|Plastic)/i,
      targetDir: 'training',
      textureExtensions: ['.png', '.jpg', '.jpeg', '.tga'],
      isTexturePack: true
    }
  ]
};

/**
 * Create directory if it doesn't exist
 * @param {string} dir - Directory path
 */
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Find files with specific extensions in a directory (recursive)
 * @param {string} dir - Directory to search
 * @param {string[]} extensions - File extensions to match
 * @returns {string[]} Array of matching file paths
 */
function findFilesByExtension(dir, extensions) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively search subdirectories
      const subFiles = findFilesByExtension(fullPath, extensions);
      files.push(...subFiles);
    } else {
      // Check file extension
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * Process a ZIP file according to the asset mappings
 * @param {string} zipFile - Path to the ZIP file
 */
async function processZipFile(zipFile) {
  const zipFileName = path.basename(zipFile);
  console.log(`Processing ${zipFileName}...`);
  
  // Find matching asset mapping
  const mapping = config.assetMappings.find(m => m.zipPattern.test(zipFileName));
  
  if (!mapping) {
    console.log(`  No mapping found for ${zipFileName}, skipping`);
    return;
  }
  
  // Extract ZIP file to temp directory
  const extractDir = path.join(config.tempDir, path.basename(zipFile, path.extname(zipFile)));
  ensureDirectoryExists(extractDir);
  
  try {
    await decompress(zipFile, extractDir);
    console.log(`  Extracted to ${extractDir}`);
    
    // Process models
    if (mapping.modelExtensions) {
      const modelFiles = findFilesByExtension(extractDir, mapping.modelExtensions);
      if (modelFiles.length > 0) {
        const targetDir = path.join(config.modelsDir, mapping.targetDir);
        ensureDirectoryExists(targetDir);
        
        for (const modelFile of modelFiles) {
          const targetFile = path.join(targetDir, path.basename(modelFile));
          fs.copyFileSync(modelFile, targetFile);
          console.log(`  Copied model: ${path.basename(modelFile)} -> ${targetFile}`);
        }
      }
    }
    
    // Process textures
    if (mapping.textureExtensions) {
      const textureFiles = findFilesByExtension(extractDir, mapping.textureExtensions);
      if (textureFiles.length > 0) {
        let targetDir;
        
        if (mapping.isTexturePack) {
          // For texture packs, determine the appropriate subdirectory based on the file name
          if (/Concrete016|MetalPlates006|Concrete034/i.test(zipFileName)) {
            targetDir = path.join(config.texturesDir, mapping.targetDir, 'walls');
          } else if (/Tiles074|Concrete033|Asphalt012/i.test(zipFileName)) {
            targetDir = path.join(config.texturesDir, mapping.targetDir, 'floors');
          } else if (/Metal032|Wood062|Plastic010/i.test(zipFileName)) {
            targetDir = path.join(config.texturesDir, mapping.targetDir, 'props');
          } else {
            targetDir = path.join(config.texturesDir, mapping.targetDir);
          }
        } else {
          // For model textures, place them alongside the models
          targetDir = path.join(config.modelsDir, mapping.targetDir, 'textures');
        }
        
        ensureDirectoryExists(targetDir);
        
        for (const textureFile of textureFiles) {
          const targetFile = path.join(targetDir, path.basename(textureFile));
          fs.copyFileSync(textureFile, targetFile);
          console.log(`  Copied texture: ${path.basename(textureFile)} -> ${targetFile}`);
        }
      }
    }
    
    console.log(`  Processed ${zipFileName} successfully`);
  } catch (error) {
    console.error(`  Error processing ${zipFileName}:`, error);
  } finally {
    // Clean up temp directory
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Starting asset organization process...');
  
  // Create necessary directories
  ensureDirectoryExists(config.downloadsDir);
  ensureDirectoryExists(config.tempDir);
  ensureDirectoryExists(config.modelsDir);
  ensureDirectoryExists(config.texturesDir);
  
  // Find all ZIP files in the downloads directory
  const zipFiles = findFilesByExtension(config.downloadsDir, ['.zip']);
  
  if (zipFiles.length === 0) {
    console.log('No ZIP files found in the downloads directory.');
    console.log(`Please place your downloaded assets in: ${config.downloadsDir}`);
    return;
  }
  
  console.log(`Found ${zipFiles.length} ZIP files to process`);
  
  // Process each ZIP file
  for (const zipFile of zipFiles) {
    await processZipFile(zipFile);
  }
  
  console.log('Asset organization complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Convert any non-glTF models to glTF format');
  console.log('2. Process textures for N64/GoldenEye style (lower resolution, reduced color palette)');
  console.log('3. Update asset paths in your code');
  
  // Clean up temp directory
  if (fs.existsSync(config.tempDir)) {
    fs.rmSync(config.tempDir, { recursive: true, force: true });
  }
}

// Create downloads directory if it doesn't exist
ensureDirectoryExists(config.downloadsDir);

// Run the main function
main().catch(console.error);
