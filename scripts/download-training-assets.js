/**
 * Asset Downloader for Project Prism Protocol
 * 
 * This script downloads and processes assets for the Training Facility.
 * It downloads textures from ambientCG and models from Kenney.nl,
 * then organizes them according to the project structure.
 * 
 * Usage:
 * 1. Install dependencies: npm install node-fetch decompress
 * 2. Run: node download-training-assets.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

// Try to import node-fetch (you'll need to install this)
let fetch;
try {
  fetch = require('node-fetch');
} catch (error) {
  console.error('Please install node-fetch: npm install node-fetch');
  process.exit(1);
}

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
  texturesDir: path.resolve(__dirname, '../src/assets/textures'),
  modelsDir: path.resolve(__dirname, '../src/assets/models'),
  tempDir: path.resolve(__dirname, '../temp'),
  
  // Texture sources from ambientCG
  textureSources: [
    // Wall textures
    {
      id: 'Concrete016',
      targetDir: 'training/walls',
      files: {
        'Concrete016_1K-JPG_Color.jpg': 'wall_main_diffuse.jpg',
        'Concrete016_1K-JPG_NormalGL.jpg': 'wall_main_normal.jpg',
        'Concrete016_1K-JPG_AmbientOcclusion.jpg': 'wall_main_ao.jpg'
      }
    },
    {
      id: 'MetalPlates006',
      targetDir: 'training/walls',
      files: {
        'MetalPlates006_1K-JPG_Color.jpg': 'wall_trim_diffuse.jpg',
        'MetalPlates006_1K-JPG_NormalGL.jpg': 'wall_trim_normal.jpg',
        'MetalPlates006_1K-JPG_Metalness.jpg': 'wall_trim_metallic.jpg'
      }
    },
    {
      id: 'Concrete034',
      targetDir: 'training/walls',
      files: {
        'Concrete034_1K-JPG_Color.jpg': 'wall_range_diffuse.jpg',
        'Concrete034_1K-JPG_NormalGL.jpg': 'wall_range_normal.jpg'
      }
    },
    
    // Floor textures
    {
      id: 'Tiles074',
      targetDir: 'training/floors',
      files: {
        'Tiles074_1K-JPG_Color.jpg': 'floor_main_diffuse.jpg',
        'Tiles074_1K-JPG_NormalGL.jpg': 'floor_main_normal.jpg',
        'Tiles074_1K-JPG_AmbientOcclusion.jpg': 'floor_main_ao.jpg'
      }
    },
    {
      id: 'Concrete033',
      targetDir: 'training/floors',
      files: {
        'Concrete033_1K-JPG_Color.jpg': 'floor_range_diffuse.jpg',
        'Concrete033_1K-JPG_NormalGL.jpg': 'floor_range_normal.jpg'
      }
    },
    {
      id: 'Asphalt012',
      targetDir: 'training/floors',
      files: {
        'Asphalt012_1K-JPG_Color.jpg': 'floor_course_diffuse.jpg',
        'Asphalt012_1K-JPG_NormalGL.jpg': 'floor_course_normal.jpg'
      }
    },
    
    // Prop textures
    {
      id: 'Metal032',
      targetDir: 'training/props',
      files: {
        'Metal032_1K-JPG_Color.jpg': 'metal_diffuse.jpg',
        'Metal032_1K-JPG_NormalGL.jpg': 'metal_normal.jpg',
        'Metal032_1K-JPG_Metalness.jpg': 'metal_metallic.jpg',
        'Metal032_1K-JPG_Roughness.jpg': 'metal_roughness.jpg'
      }
    },
    {
      id: 'Wood062',
      targetDir: 'training/props',
      files: {
        'Wood062_1K-JPG_Color.jpg': 'wood_diffuse.jpg',
        'Wood062_1K-JPG_NormalGL.jpg': 'wood_normal.jpg',
        'Wood062_1K-JPG_AmbientOcclusion.jpg': 'wood_ao.jpg'
      }
    },
    {
      id: 'Plastic010',
      targetDir: 'training/props',
      files: {
        'Plastic010_1K-JPG_Color.jpg': 'plastic_diffuse.jpg',
        'Plastic010_1K-JPG_NormalGL.jpg': 'plastic_normal.jpg'
      }
    }
  ],
  
  // Model sources from Kenney.nl
  modelSources: [
    {
      name: 'Tower Defense Kit',
      url: 'https://kenney.nl/content/assets/tower-defense-kit',
      targetDir: 'training/environment',
      models: {
        'towerSquare_bottomA.obj': 'walls.glb',
        'tile.obj': 'floor.glb',
        'towerSquare_roofA.obj': 'ceiling.glb'
      }
    },
    {
      name: 'Furniture Kit',
      url: 'https://kenney.nl/content/assets/furniture-kit',
      targetDir: 'training/props',
      models: {
        'tableCross.obj': 'table.glb',
        'chairModernCushion.obj': 'chair.glb',
        'kitchenCabinetUpper.obj': 'locker.glb',
        'computerKeyboard.obj': 'computer.glb'
      }
    },
    {
      name: 'Shooting Gallery',
      url: 'https://kenney.nl/content/assets/shooting-gallery',
      targetDir: 'training/targets',
      models: {
        'target.obj': 'standard.glb',
        'target_stand.obj': 'moving.glb'
      }
    },
    {
      name: 'Weapon Pack',
      url: 'https://kenney.nl/content/assets/weapon-pack',
      targetDir: 'training/weapons',
      models: {
        'pistol.obj': 'pistol_rack.glb',
        'rifle.obj': 'rifle_rack.glb'
      }
    },
    {
      name: 'Prop Pack',
      url: 'https://kenney.nl/content/assets/prop-pack',
      targetDir: 'training/props',
      models: {
        'barrier.obj': 'barrier.glb'
      }
    }
  ],
  
  // Skybox source
  skyboxSource: {
    name: 'Empty Warehouse HDRI',
    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/empty_warehouse_01_1k.hdr',
    targetDir: 'skybox/training'
  }
};

/**
 * Download a file from a URL to a local path
 * @param {string} url - URL of the file to download
 * @param {string} outputPath - Local path to save the file
 * @returns {Promise<void>} Promise that resolves when download is complete
 */
async function downloadFile(url, outputPath) {
  // Create directory if it doesn't exist
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

/**
 * Download and process textures from ambientCG
 */
async function downloadTextures() {
  console.log('Downloading textures from ambientCG...');
  
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(config.tempDir)) {
    fs.mkdirSync(config.tempDir, { recursive: true });
  }
  
  for (const textureSource of config.textureSources) {
    console.log(`Processing texture: ${textureSource.id}`);
    
    // Download the ZIP file
    const zipUrl = `https://ambientcg.com/get?id=${textureSource.id}_1K-JPG`;
    const zipPath = path.join(config.tempDir, `${textureSource.id}.zip`);
    
    try {
      console.log(`  Downloading ${zipUrl}`);
      await downloadFile(zipUrl, zipPath);
      
      // Extract the ZIP file
      console.log(`  Extracting ${zipPath}`);
      const extractPath = path.join(config.tempDir, textureSource.id);
      await decompress(zipPath, extractPath);
      
      // Copy and rename the texture files
      const targetDir = path.join(config.texturesDir, textureSource.targetDir);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      for (const [sourceName, targetName] of Object.entries(textureSource.files)) {
        // Find the source file (might be in a subdirectory)
        const sourceFiles = await findFiles(extractPath, sourceName);
        if (sourceFiles.length > 0) {
          const sourcePath = sourceFiles[0];
          const targetPath = path.join(targetDir, targetName);
          
          console.log(`  Copying ${sourcePath} -> ${targetPath}`);
          fs.copyFileSync(sourcePath, targetPath);
        } else {
          console.warn(`  Source file not found: ${sourceName}`);
        }
      }
      
      // Clean up
      fs.unlinkSync(zipPath);
      fs.rmSync(extractPath, { recursive: true, force: true });
      
    } catch (error) {
      console.error(`  Error processing ${textureSource.id}:`, error);
    }
  }
}

/**
 * Find files matching a pattern in a directory (recursive)
 * @param {string} dir - Directory to search
 * @param {string} pattern - Filename pattern to match
 * @returns {Promise<string[]>} Array of matching file paths
 */
async function findFiles(dir, pattern) {
  const files = [];
  
  // Read all files in the directory
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  // Check each entry
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively search subdirectories
      const subFiles = await findFiles(fullPath, pattern);
      files.push(...subFiles);
    } else if (entry.name === pattern || entry.name.endsWith(pattern)) {
      // Add matching files
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Download and process models from Kenney.nl
 */
async function downloadModels() {
  console.log('Downloading models from Kenney.nl...');
  
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(config.tempDir)) {
    fs.mkdirSync(config.tempDir, { recursive: true });
  }
  
  for (const modelSource of config.modelSources) {
    console.log(`Processing model pack: ${modelSource.name}`);
    
    // Note: Kenney.nl doesn't have a direct download API, so we'll just create placeholders
    // In a real implementation, you would need to manually download these packs
    
    const targetDir = path.join(config.modelsDir, modelSource.targetDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    for (const [sourceName, targetName] of Object.entries(modelSource.models)) {
      const targetPath = path.join(targetDir, targetName);
      
      // Create placeholder file
      console.log(`  Creating placeholder for ${targetName}`);
      fs.writeFileSync(targetPath, `Placeholder for ${modelSource.name} - ${sourceName}`);
    }
  }
  
  console.log('Note: You will need to manually download model packs from Kenney.nl');
  console.log('and convert them to glTF format using Blender or another tool.');
}

/**
 * Process skybox HDRI to cubemap
 */
async function processSkybox() {
  console.log('Processing skybox...');
  
  // Create skybox directory if it doesn't exist
  const skyboxDir = path.join(config.texturesDir, config.skyboxSource.targetDir);
  if (!fs.existsSync(skyboxDir)) {
    fs.mkdirSync(skyboxDir, { recursive: true });
  }
  
  // Note: Processing an HDRI to cubemap requires specialized tools
  // In a real implementation, you would use a tool like HDRItoEnvMap
  
  // Create placeholder files
  const faces = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
  for (const face of faces) {
    const targetPath = path.join(skyboxDir, `${face}.jpg`);
    console.log(`  Creating placeholder for ${face}.jpg`);
    fs.writeFileSync(targetPath, `Placeholder for ${config.skyboxSource.name} - ${face} face`);
  }
  
  console.log('Note: You will need to manually convert the HDRI to cubemap format');
  console.log('using a tool like HDRItoEnvMap or Blender.');
}

/**
 * Main function
 */
async function main() {
  console.log('Starting asset download process...');
  
  try {
    // Download and process textures
    await downloadTextures();
    
    // Download and process models
    await downloadModels();
    
    // Process skybox
    await processSkybox();
    
    console.log('Asset download complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Manually download model packs from Kenney.nl');
    console.log('2. Convert OBJ models to glTF format using Blender');
    console.log('3. Convert HDRI to cubemap format for the skybox');
    console.log('4. Replace placeholder files with actual assets');
    
  } catch (error) {
    console.error('Error during asset download:', error);
  } finally {
    // Clean up temp directory
    if (fs.existsSync(config.tempDir)) {
      fs.rmSync(config.tempDir, { recursive: true, force: true });
    }
  }
}

// Run the main function
main().catch(console.error);
