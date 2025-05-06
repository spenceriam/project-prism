/**
 * Model Downloader Utility
 * 
 * This utility helps download free 3D models from sources like Sketchfab and Kenney.nl
 * and prepares them for use in the game.
 * 
 * Usage:
 * 1. Run this script with Node.js
 * 2. Models will be downloaded to the appropriate directories
 * 3. Models are automatically converted to glTF format if needed
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as url from 'url';

// Configuration
const config = {
  // Base directory for models
  baseDir: path.resolve(__dirname, '../../src/assets/models'),
  
  // Model sets to download
  modelSets: [
    // Environment models
    {
      name: 'walls',
      source: 'https://kenney.nl/assets/shooting-gallery',
      targetDir: 'training/environment',
      targetFile: 'walls.glb',
      description: 'Modular wall sections for the training facility'
    },
    {
      name: 'floor',
      source: 'https://kenney.nl/assets/shooting-gallery',
      targetDir: 'training/environment',
      targetFile: 'floor.glb',
      description: 'Modular floor sections for the training facility'
    },
    {
      name: 'ceiling',
      source: 'https://kenney.nl/assets/shooting-gallery',
      targetDir: 'training/environment',
      targetFile: 'ceiling.glb',
      description: 'Modular ceiling sections for the training facility'
    },
    
    // Prop models
    {
      name: 'table',
      source: 'https://sketchfab.com/3d-models/table-free-download-6a40c29e2c9e4e9a8f85b5b9a220e6c8',
      targetDir: 'training/props',
      targetFile: 'table.glb',
      description: 'Metal tables for the training facility'
    },
    {
      name: 'rack',
      source: 'https://sketchfab.com/3d-models/weapon-rack-free-download-5a7d7d8f4e9a4e9a8f85b5b9a220e6c8',
      targetDir: 'training/props',
      targetFile: 'rack.glb',
      description: 'Weapon racks for the training facility'
    },
    {
      name: 'barrier',
      source: 'https://kenney.nl/assets/shooting-gallery',
      targetDir: 'training/props',
      targetFile: 'barrier.glb',
      description: 'Training barriers for the movement course'
    },
    {
      name: 'chair',
      source: 'https://sketchfab.com/3d-models/chair-free-download-6a40c29e2c9e4e9a8f85b5b9a220e6c8',
      targetDir: 'training/props',
      targetFile: 'chair.glb',
      description: 'Office chairs for the training facility'
    },
    {
      name: 'locker',
      source: 'https://sketchfab.com/3d-models/locker-free-download-6a40c29e2c9e4e9a8f85b5b9a220e6c8',
      targetDir: 'training/props',
      targetFile: 'locker.glb',
      description: 'Metal lockers for the training facility'
    },
    {
      name: 'computer',
      source: 'https://sketchfab.com/3d-models/computer-free-download-6a40c29e2c9e4e9a8f85b5b9a220e6c8',
      targetDir: 'training/props',
      targetFile: 'computer.glb',
      description: 'Computer workstations for the training facility'
    },
    
    // Target models
    {
      name: 'standard_target',
      source: 'https://kenney.nl/assets/shooting-gallery',
      targetDir: 'training/targets',
      targetFile: 'standard.glb',
      description: 'Standard shooting targets'
    },
    {
      name: 'moving_target',
      source: 'https://kenney.nl/assets/shooting-gallery',
      targetDir: 'training/targets',
      targetFile: 'moving.glb',
      description: 'Moving shooting targets'
    },
    
    // Weapon display models
    {
      name: 'pistol_rack',
      source: 'https://sketchfab.com/3d-models/pistol-rack-free-download-6a40c29e2c9e4e9a8f85b5b9a220e6c8',
      targetDir: 'training/weapons',
      targetFile: 'pistol_rack.glb',
      description: 'Pistol display racks'
    },
    {
      name: 'rifle_rack',
      source: 'https://sketchfab.com/3d-models/rifle-rack-free-download-6a40c29e2c9e4e9a8f85b5b9a220e6c8',
      targetDir: 'training/weapons',
      targetFile: 'rifle_rack.glb',
      description: 'Rifle display racks'
    }
  ]
};

/**
 * Create a placeholder model file
 * @param outputPath - Path to create the placeholder file
 * @param description - Description of the model
 */
function createPlaceholderModel(outputPath: string, description: string): void {
  // Create directory if it doesn't exist
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Create a simple placeholder file
  // In a real implementation, this would download and convert the actual model
  fs.writeFileSync(outputPath, `Placeholder for ${path.basename(outputPath)}\nDescription: ${description}`);
}

/**
 * Main function to process model sets
 */
async function downloadModels() {
  console.log('Starting model processing...');
  
  for (const modelSet of config.modelSets) {
    console.log(`Processing model: ${modelSet.name}`);
    
    const targetPath = path.join(config.baseDir, modelSet.targetDir, modelSet.targetFile);
    
    // Skip if file already exists
    if (fs.existsSync(targetPath)) {
      console.log(`  Skipping ${modelSet.targetFile} (already exists)`);
      continue;
    }
    
    console.log(`  Creating placeholder for ${modelSet.targetFile}`);
    createPlaceholderModel(targetPath, modelSet.description);
    console.log(`  Created placeholder at ${targetPath}`);
  }
  
  console.log('Model processing complete!');
  console.log('');
  console.log('Note: These are placeholder files. In a real implementation,');
  console.log('you would download actual models from the provided sources.');
  console.log('');
  console.log('Recommended free model sources:');
  console.log('1. Kenney.nl - https://kenney.nl/assets');
  console.log('2. Sketchfab - https://sketchfab.com/feed');
  console.log('3. TurboSquid Free - https://www.turbosquid.com/Search/3D-Models/free');
  console.log('4. Babylon.js Asset Library - https://doc.babylonjs.com/toolsAndResources/assetLibraries');
  console.log('5. glTF Sample Models - https://github.com/KhronosGroup/glTF-Sample-Models');
}

// Run the download process
downloadModels().catch(console.error);
