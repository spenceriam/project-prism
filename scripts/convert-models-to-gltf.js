/**
 * Model Converter for Project Prism Protocol
 * 
 * This script converts OBJ models to glTF format using the obj2gltf library.
 * It's designed to process the models downloaded from Kenney.nl for the Training Facility.
 * 
 * Usage:
 * 1. Install dependencies: npm install obj2gltf
 * 2. Run: node convert-models-to-gltf.js [input-directory] [output-directory]
 * 
 * Example:
 * node convert-models-to-gltf.js ./downloads/kenney_tower-defense-kit ./src/assets/models/training/environment
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

// Try to import obj2gltf (you'll need to install this)
let obj2gltf;
try {
  obj2gltf = require('obj2gltf');
} catch (error) {
  console.error('Please install obj2gltf: npm install obj2gltf');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const inputDir = args[0] || './downloads';
const outputDir = args[1] || './src/assets/models';

// Configuration for model conversion
const modelMappings = [
  // Tower Defense Kit (environment)
  {
    sourceDir: 'kenney_tower-defense-kit/Models/OBJ format',
    targetDir: 'training/environment',
    models: {
      'towerSquare_bottomA.obj': 'walls.glb',
      'tile.obj': 'floor.glb',
      'towerSquare_roofA.obj': 'ceiling.glb'
    }
  },
  // Furniture Kit (props)
  {
    sourceDir: 'kenney_furniture-kit/Models/OBJ format',
    targetDir: 'training/props',
    models: {
      'tableCross.obj': 'table.glb',
      'chairModernCushion.obj': 'chair.glb',
      'kitchenCabinetUpper.obj': 'locker.glb',
      'computerKeyboard.obj': 'computer.glb'
    }
  },
  // Shooting Gallery (targets)
  {
    sourceDir: 'kenney_shooting-gallery/Models/OBJ format',
    targetDir: 'training/targets',
    models: {
      'target.obj': 'standard.glb',
      'target_stand.obj': 'moving.glb'
    }
  },
  // Weapon Pack (weapons)
  {
    sourceDir: 'kenney_weapon-pack/Models/OBJ format',
    targetDir: 'training/weapons',
    models: {
      'pistol.obj': 'pistol_rack.glb',
      'rifle.obj': 'rifle_rack.glb'
    }
  },
  // Prop Pack (props)
  {
    sourceDir: 'kenney_prop-pack/Models/OBJ format',
    targetDir: 'training/props',
    models: {
      'barrier.obj': 'barrier.glb'
    }
  }
];

/**
 * Convert an OBJ model to glTF format
 * @param {string} objPath - Path to the OBJ file
 * @param {string} gltfPath - Path to save the glTF file
 * @returns {Promise<void>} Promise that resolves when conversion is complete
 */
async function convertObjToGltf(objPath, gltfPath) {
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(gltfPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Convert OBJ to glTF
    console.log(`Converting ${objPath} to ${gltfPath}`);
    const options = {
      binary: true,
      separate: false,
      checkTransparency: true,
      secure: true
    };
    
    await obj2gltf(objPath, {
      ...options,
      outputPath: gltfPath
    });
    
    console.log(`  Conversion successful: ${gltfPath}`);
  } catch (error) {
    console.error(`  Error converting ${objPath}:`, error);
  }
}

/**
 * Find OBJ files in a directory
 * @param {string} dir - Directory to search
 * @returns {Promise<string[]>} Array of OBJ file paths
 */
async function findObjFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      const subFiles = await findObjFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.name.endsWith('.obj')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Process all model mappings
 */
async function processModelMappings() {
  for (const mapping of modelMappings) {
    const sourceDir = path.join(inputDir, mapping.sourceDir);
    const targetDir = path.join(outputDir, mapping.targetDir);
    
    console.log(`Processing models from ${sourceDir}`);
    
    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Process each model
    for (const [sourceName, targetName] of Object.entries(mapping.models)) {
      // Find the source file
      const sourceFiles = await findObjFiles(sourceDir);
      const sourceFile = sourceFiles.find(file => path.basename(file) === sourceName);
      
      if (sourceFile) {
        const targetPath = path.join(targetDir, targetName);
        await convertObjToGltf(sourceFile, targetPath);
      } else {
        console.warn(`  Source file not found: ${sourceName}`);
        
        // Create a placeholder file
        const targetPath = path.join(targetDir, targetName);
        console.log(`  Creating placeholder for ${targetName}`);
        fs.writeFileSync(targetPath, `Placeholder for ${sourceName}`);
      }
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Starting model conversion process...');
  console.log(`Input directory: ${inputDir}`);
  console.log(`Output directory: ${outputDir}`);
  
  try {
    await processModelMappings();
    
    console.log('Model conversion complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Import the converted models into your game');
    console.log('2. Update the asset paths in your code');
    console.log('3. Test the models in the game environment');
    
  } catch (error) {
    console.error('Error during model conversion:', error);
  }
}

// Run the main function
main().catch(console.error);
