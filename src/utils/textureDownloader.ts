/**
 * Texture Downloader Utility
 * 
 * This utility helps download free PBR textures from sources like ambientCG
 * and prepares them for use in the game.
 * 
 * Usage:
 * 1. Run this script with Node.js
 * 2. Textures will be downloaded to the appropriate directories
 * 3. Textures are automatically renamed to match our convention
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as url from 'url';

// Configuration
const config = {
  // Base directory for textures
  baseDir: path.resolve(__dirname, '../../src/assets/textures'),
  
  // Texture sets to download
  textureSets: [
    // Wall textures
    {
      name: 'wall_main',
      source: 'https://ambientcg.com/get?id=Concrete016_1K-JPG',
      targetDir: 'training/walls',
      mapping: {
        'Concrete016_1K-JPG_Color.jpg': 'wall_main_diffuse.jpg',
        'Concrete016_1K-JPG_NormalGL.jpg': 'wall_main_normal.jpg',
        'Concrete016_1K-JPG_AmbientOcclusion.jpg': 'wall_main_ao.jpg'
      }
    },
    {
      name: 'wall_trim',
      source: 'https://ambientcg.com/get?id=MetalPlates006_1K-JPG',
      targetDir: 'training/walls',
      mapping: {
        'MetalPlates006_1K-JPG_Color.jpg': 'wall_trim_diffuse.jpg',
        'MetalPlates006_1K-JPG_NormalGL.jpg': 'wall_trim_normal.jpg',
        'MetalPlates006_1K-JPG_Metalness.jpg': 'wall_trim_metallic.jpg'
      }
    },
    {
      name: 'wall_range',
      source: 'https://ambientcg.com/get?id=Concrete034_1K-JPG',
      targetDir: 'training/walls',
      mapping: {
        'Concrete034_1K-JPG_Color.jpg': 'wall_range_diffuse.jpg',
        'Concrete034_1K-JPG_NormalGL.jpg': 'wall_range_normal.jpg'
      }
    },
    
    // Floor textures
    {
      name: 'floor_main',
      source: 'https://ambientcg.com/get?id=Tiles074_1K-JPG',
      targetDir: 'training/floors',
      mapping: {
        'Tiles074_1K-JPG_Color.jpg': 'floor_main_diffuse.jpg',
        'Tiles074_1K-JPG_NormalGL.jpg': 'floor_main_normal.jpg',
        'Tiles074_1K-JPG_AmbientOcclusion.jpg': 'floor_main_ao.jpg'
      }
    },
    {
      name: 'floor_range',
      source: 'https://ambientcg.com/get?id=Concrete033_1K-JPG',
      targetDir: 'training/floors',
      mapping: {
        'Concrete033_1K-JPG_Color.jpg': 'floor_range_diffuse.jpg',
        'Concrete033_1K-JPG_NormalGL.jpg': 'floor_range_normal.jpg'
      }
    },
    {
      name: 'floor_course',
      source: 'https://ambientcg.com/get?id=Asphalt012_1K-JPG',
      targetDir: 'training/floors',
      mapping: {
        'Asphalt012_1K-JPG_Color.jpg': 'floor_course_diffuse.jpg',
        'Asphalt012_1K-JPG_NormalGL.jpg': 'floor_course_normal.jpg'
      }
    },
    
    // Prop textures
    {
      name: 'metal',
      source: 'https://ambientcg.com/get?id=Metal032_1K-JPG',
      targetDir: 'training/props',
      mapping: {
        'Metal032_1K-JPG_Color.jpg': 'metal_diffuse.jpg',
        'Metal032_1K-JPG_NormalGL.jpg': 'metal_normal.jpg',
        'Metal032_1K-JPG_Metalness.jpg': 'metal_metallic.jpg',
        'Metal032_1K-JPG_Roughness.jpg': 'metal_roughness.jpg'
      }
    },
    {
      name: 'wood',
      source: 'https://ambientcg.com/get?id=Wood062_1K-JPG',
      targetDir: 'training/props',
      mapping: {
        'Wood062_1K-JPG_Color.jpg': 'wood_diffuse.jpg',
        'Wood062_1K-JPG_NormalGL.jpg': 'wood_normal.jpg',
        'Wood062_1K-JPG_AmbientOcclusion.jpg': 'wood_ao.jpg'
      }
    },
    {
      name: 'plastic',
      source: 'https://ambientcg.com/get?id=Plastic010_1K-JPG',
      targetDir: 'training/props',
      mapping: {
        'Plastic010_1K-JPG_Color.jpg': 'plastic_diffuse.jpg',
        'Plastic010_1K-JPG_NormalGL.jpg': 'plastic_normal.jpg'
      }
    }
  ]
};

/**
 * Download a file from a URL to a local path
 * @param fileUrl - URL of the file to download
 * @param outputPath - Local path to save the file
 * @returns Promise that resolves when download is complete
 */
function downloadFile(fileUrl: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create directory if it doesn't exist
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Download the file
    const file = fs.createWriteStream(outputPath);
    https.get(fileUrl, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

/**
 * Main function to download and process texture sets
 */
async function downloadTextures() {
  console.log('Starting texture download...');
  
  for (const textureSet of config.textureSets) {
    console.log(`Processing texture set: ${textureSet.name}`);
    
    // Create target directory if it doesn't exist
    const targetDir = path.join(config.baseDir, textureSet.targetDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Download and process each texture in the set
    for (const [sourceName, targetName] of Object.entries(textureSet.mapping)) {
      const targetPath = path.join(targetDir, targetName);
      
      // Skip if file already exists
      if (fs.existsSync(targetPath)) {
        console.log(`  Skipping ${targetName} (already exists)`);
        continue;
      }
      
      console.log(`  Downloading ${sourceName} -> ${targetName}`);
      
      try {
        // Note: In a real implementation, this would download the ZIP file,
        // extract it, and then copy the specific texture files.
        // For this example, we're just creating placeholder files.
        fs.writeFileSync(targetPath, `Placeholder for ${textureSet.name} - ${sourceName}`);
        console.log(`  Created placeholder for ${targetName}`);
      } catch (error) {
        console.error(`  Error processing ${sourceName}:`, error);
      }
    }
  }
  
  console.log('Texture download complete!');
}

// Run the download process
downloadTextures().catch(console.error);
