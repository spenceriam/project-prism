import { Scene, Vector3, Quaternion, SceneLoader, AbstractMesh, TransformNode, Mesh } from '@babylonjs/core';
import { AssetLoader, ModelLoadResult } from './loader';

/**
 * TrainingAssetManager
 * Specialized asset manager for the Training Facility environment
 * Handles loading and managing all assets specific to the training level
 */
export class TrainingAssetManager {
  private scene: Scene;
  private assetLoader: AssetLoader;
  private loadedAssets: Map<string, ModelLoadResult> = new Map();
  private assetInstances: Map<string, AbstractMesh[]> = new Map();

  /**
   * Creates a new TrainingAssetManager
   * @param scene - The Babylon.js scene
   * @param assetLoader - The main asset loader instance
   */
  constructor(scene: Scene, assetLoader: AssetLoader) {
    this.scene = scene;
    this.assetLoader = assetLoader;
  }

  /**
   * Load all Training Facility assets
   * @param onProgress - Optional callback for loading progress
   */
  public async loadAllAssets(
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      console.log('Loading Training Facility assets...');
      
      // Define all assets to load
      const assetList = [
        // Environment assets
        'training/environment/walls',
        'training/environment/floor',
        'training/environment/ceiling',
        
        // Props
        'training/props/table',
        'training/props/rack',
        'training/props/barrier',
        'training/props/chair',
        'training/props/locker',
        'training/props/computer',
        
        // Targets
        'training/targets/standard',
        'training/targets/moving',
        
        // Weapons (for display)
        'training/weapons/pistol_rack',
        'training/weapons/rifle_rack'
      ];
      
      // Track loading progress
      let loaded = 0;
      const total = assetList.length;
      
      // Load each asset
      for (const asset of assetList) {
        try {
          const result = await this.assetLoader.loadModel(asset);
          this.loadedAssets.set(asset, result);
          
          loaded++;
          if (onProgress) {
            onProgress(loaded / total);
          }
          
          console.log(`Loaded asset: ${asset}`);
        } catch (error) {
          console.warn(`Failed to load asset ${asset}:`, error);
          // Continue with other assets even if one fails
        }
      }
      
      console.log('Training Facility assets loaded successfully');
    } catch (error) {
      console.error('Failed to load Training Facility assets:', error);
      throw error;
    }
  }
  
  /**
   * Create an instance of a loaded asset
   * @param assetName - Name of the asset to instance
   * @param instanceName - Name for the new instance
   * @param position - Position for the instance
   * @param rotation - Rotation for the instance (in radians)
   * @param scale - Scale for the instance
   * @returns The created instance or undefined if asset not found
   */
  public createInstance(
    assetName: string,
    instanceName: string,
    position: Vector3,
    rotation: Vector3 = Vector3.Zero(),
    scale: Vector3 = new Vector3(1, 1, 1)
  ): AbstractMesh | undefined {
    const asset = this.loadedAssets.get(assetName);
    if (!asset) {
      console.warn(`Asset ${assetName} not found for instancing`);
      return undefined;
    }
    
    try {
      // Clone the root mesh and its children
      const instance = asset.rootNode?.clone(instanceName, null) as AbstractMesh;
      if (!instance) {
        console.warn(`Failed to create instance of ${assetName}`);
        return undefined;
      }
      
      // Set transform
      instance.position = position;
      instance.rotation = rotation;
      instance.scaling = scale;
      
      // Track the instance
      if (!this.assetInstances.has(assetName)) {
        this.assetInstances.set(assetName, []);
      }
      this.assetInstances.get(assetName)?.push(instance);
      
      return instance;
    } catch (error) {
      console.error(`Error creating instance of ${assetName}:`, error);
      return undefined;
    }
  }
  
  /**
   * Create multiple instances of an asset in a grid pattern
   * @param assetName - Name of the asset to instance
   * @param baseInstanceName - Base name for the instances
   * @param startPosition - Starting position for the grid
   * @param rows - Number of rows
   * @param columns - Number of columns
   * @param spacing - Spacing between instances
   * @param rotation - Rotation for all instances
   * @param scale - Scale for all instances
   * @returns Array of created instances
   */
  public createInstanceGrid(
    assetName: string,
    baseInstanceName: string,
    startPosition: Vector3,
    rows: number,
    columns: number,
    spacing: Vector3,
    rotation: Vector3 = Vector3.Zero(),
    scale: Vector3 = new Vector3(1, 1, 1)
  ): AbstractMesh[] {
    const instances: AbstractMesh[] = [];
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const position = new Vector3(
          startPosition.x + col * spacing.x,
          startPosition.y + row * spacing.y,
          startPosition.z + row * spacing.z
        );
        
        const instanceName = `${baseInstanceName}_${row}_${col}`;
        const instance = this.createInstance(assetName, instanceName, position, rotation, scale);
        
        if (instance) {
          instances.push(instance);
        }
      }
    }
    
    return instances;
  }
  
  /**
   * Get all instances of a specific asset
   * @param assetName - Name of the asset
   * @returns Array of instances or empty array if none found
   */
  public getInstances(assetName: string): AbstractMesh[] {
    return this.assetInstances.get(assetName) || [];
  }
  
  /**
   * Apply optimization to all instances
   * @param enableInstancing - Whether to use hardware instancing
   */
  public optimizeInstances(enableInstancing: boolean = true): void {
    // Implement optimization strategies for instances
    // This could include hardware instancing, LOD, etc.
    console.log('Optimizing Training Facility asset instances...');
    
    // For each asset type, optimize its instances
    for (const [assetName, instances] of this.assetInstances.entries()) {
      if (instances.length > 5 && enableInstancing) {
        console.log(`Applying hardware instancing to ${assetName} (${instances.length} instances)`);
        // Hardware instancing would be implemented here
      }
    }
  }
  
  /**
   * Dispose of all assets and instances
   */
  public dispose(): void {
    // Dispose of all instances
    for (const instances of this.assetInstances.values()) {
      for (const instance of instances) {
        instance.dispose();
      }
    }
    
    this.assetInstances.clear();
    this.loadedAssets.clear();
  }
}
