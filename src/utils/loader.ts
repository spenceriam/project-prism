import { Scene, SceneLoader, AbstractMesh, AnimationGroup, Skeleton, ISceneLoaderProgressEvent, TransformNode, Mesh } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

/**
 * Result of loading a 3D model
 */
export interface ModelLoadResult {
  meshes: AbstractMesh[];
  rootNode?: TransformNode;
  animationGroups?: AnimationGroup[];
  skeletons?: Skeleton[];
}

/**
 * Progress information during asset loading
 */
export interface LoadingProgress {
  fileName: string;
  loaded: number;
  total: number;
  progress: number;
}

/**
 * AssetLoader handles loading and managing 3D models and other assets
 * Implements efficient loading strategies for browser-based game performance
 */
export class AssetLoader {
  private scene: Scene;
  private loadedAssets: Map<string, ModelLoadResult>;
  private baseUrl: string;
  private onGlobalProgressCallback?: (progress: number) => void;
  private totalAssets: number = 0;
  private loadedAssetCount: number = 0;
  
  /**
   * Creates a new AssetLoader
   * @param scene - The Babylon.js scene to load assets into
   * @param baseUrl - Base URL for asset paths (default: 'assets/')
   */
  constructor(scene: Scene, baseUrl: string = 'assets/') {
    this.scene = scene;
    this.loadedAssets = new Map();
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  }
  
  /**
   * Sets a callback for global loading progress across all assets
   * @param callback - Function to call with progress (0-1)
   */
  public setGlobalProgressCallback(callback: (progress: number) => void): void {
    this.onGlobalProgressCallback = callback;
  }
  
  /**
   * Updates global progress based on loaded assets
   */
  private updateGlobalProgress(): void {
    if (!this.onGlobalProgressCallback || this.totalAssets === 0) return;
    
    const progress = this.loadedAssetCount / this.totalAssets;
    this.onGlobalProgressCallback(progress);
  }
  
  /**
   * Load a glTF model asynchronously
   * @param fileName - The file name of the model
   * @param onProgress - Callback for loading progress
   * @returns Promise with the loaded model result
   */
  public async loadModel(
    fileName: string, 
    onProgress?: (progress: LoadingProgress) => void
  ): Promise<ModelLoadResult> {
    // Check if the model is already loaded
    if (this.loadedAssets.has(fileName)) {
      return this.loadedAssets.get(fileName)!;
    }
    
    // Determine file path - ensure it has the correct extension
    let filePath = `${this.baseUrl}models/${fileName}`;
    if (!filePath.endsWith('.glb') && !filePath.endsWith('.gltf')) {
      filePath += '.glb'; // Default to glb if no extension provided
    }
    
    try {
      this.totalAssets++;
      
      // Set up progress tracking
      const onProgressCallback = (event: ISceneLoaderProgressEvent) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            fileName,
            loaded: event.loaded,
            total: event.total,
            progress: event.loaded / event.total
          });
        }
      };
      
      // Extract the file name without path for the root node name
      const rootNodeName = fileName.split('/').pop()?.split('.')[0] || 'model';
      
      // Load the model
      const result = await SceneLoader.ImportMeshAsync(
        '', // Load all meshes
        filePath, 
        '', 
        this.scene,
        onProgressCallback
      );
      
      // Create a root node to parent all meshes to
      const rootNode = new TransformNode(rootNodeName, this.scene);
      
      // Parent all loaded meshes to the root node
      result.meshes.forEach(mesh => {
        // Only parent top-level meshes
        if (mesh.parent === null) {
          mesh.parent = rootNode;
        }
      });
      
      // Store the result
      const modelResult: ModelLoadResult = {
        meshes: result.meshes,
        rootNode: rootNode,
        animationGroups: result.animationGroups,
        skeletons: result.skeletons
      };
      
      this.loadedAssets.set(fileName, modelResult);
      this.loadedAssetCount++;
      this.updateGlobalProgress();
      
      return modelResult;
    } catch (error) {
      console.error(`Error loading model ${fileName}:`, error);
      this.totalAssets--; // Adjust count since loading failed
      this.updateGlobalProgress();
      throw error;
    }
  }
  
  /**
   * Preload multiple models
   * @param fileNames - Array of file names to preload
   * @param onProgress - Callback for overall loading progress
   * @returns Promise that resolves when all models are loaded
   */
  public async preloadModels(
    fileNames: string[],
    onProgress?: (progress: LoadingProgress) => void
  ): Promise<void> {
    let loaded = 0;
    const total = fileNames.length;
    
    const loadPromises = fileNames.map(async (fileName) => {
      try {
        await this.loadModel(fileName);
        loaded++;
        
        if (onProgress) {
          onProgress({
            fileName,
            loaded,
            total,
            progress: loaded / total
          });
        }
      } catch (error) {
        console.warn(`Failed to preload model ${fileName}:`, error);
        // Continue with other models even if one fails
      }
    });
    
    await Promise.all(loadPromises);
  }
  
  /**
   * Get a previously loaded model
   * @param fileName - The file name of the model
   * @returns The loaded model or undefined if not loaded
   */
  public getLoadedModel(fileName: string): ModelLoadResult | undefined {
    return this.loadedAssets.get(fileName);
  }
  
  /**
   * Clone a loaded model
   * @param fileName - The file name of the original model
   * @param newName - Name for the cloned model
   * @returns The cloned model result or undefined if original not found
   */
  public cloneModel(fileName: string, newName: string): ModelLoadResult | undefined {
    const original = this.loadedAssets.get(fileName);
    if (!original) return undefined;
    
    // Create a new root node
    const rootNode = new TransformNode(newName, this.scene);
    
    // Clone meshes
    const clonedMeshes: AbstractMesh[] = [];
    original.meshes.forEach(mesh => {
      // Only clone top-level meshes (children will be cloned automatically)
      if (mesh.parent === original.rootNode) {
        const clone = mesh.clone(mesh.name + "_" + newName, rootNode);
        if (clone) {
          clonedMeshes.push(clone);
        }
      }
    });
    
    // Clone animation groups if they exist
    const clonedAnimationGroups = original.animationGroups?.map(ag => {
      return ag.clone(ag.name + "_" + newName, (oldTarget) => {
        // Find the corresponding clone for this target
        const meshName = oldTarget.name.split('_')[0]; // Remove any previous clone suffix
        const newTarget = clonedMeshes.find(m => m.name.startsWith(meshName));
        return newTarget || oldTarget;
      });
    });
    
    // Clone skeletons if they exist
    const clonedSkeletons = original.skeletons?.map(skeleton => {
      // Clone with a new name based on the original skeleton name
      return skeleton.clone(`${skeleton.name}_${newName}`, `${skeleton.id}_${newName}`);
    });
    
    return {
      meshes: clonedMeshes,
      rootNode: rootNode,
      animationGroups: clonedAnimationGroups,
      skeletons: clonedSkeletons
    };
  }
  
  /**
   * Create an instance of a loaded model (more efficient than cloning)
   * @param fileName - The file name of the original model
   * @param newName - Name for the instanced model
   * @returns The instanced model or undefined if original not found
   */
  public createModelInstance(fileName: string, newName: string): ModelLoadResult | undefined {
    const original = this.loadedAssets.get(fileName);
    if (!original) return undefined;
    
    // Create a new root node
    const rootNode = new TransformNode(newName, this.scene);
    
    // Create instances of meshes
    const instances: AbstractMesh[] = [];
    original.meshes.forEach(mesh => {
      // Only instance meshes that can be instanced (Mesh type)
      if (mesh instanceof Mesh && mesh.parent === original.rootNode) {
        const instance = (mesh as Mesh).createInstance(mesh.name + "_" + newName);
        instance.parent = rootNode;
        instances.push(instance);
      } else if (mesh.parent === original.rootNode) {
        // For non-instanceable meshes, clone them
        const clone = mesh.clone(mesh.name + "_" + newName, rootNode);
        if (clone) {
          instances.push(clone);
        }
      }
    });
    
    return {
      meshes: instances,
      rootNode: rootNode,
      // Note: Animation groups and skeletons are shared with the original
      animationGroups: original.animationGroups,
      skeletons: original.skeletons
    };
  }
  
  /**
   * Dispose of a loaded model
   * @param fileName - The file name of the model to dispose
   */
  public disposeModel(fileName: string): void {
    const model = this.loadedAssets.get(fileName);
    if (!model) return;
    
    // Dispose of root node (will dispose all children)
    if (model.rootNode) {
      model.rootNode.dispose(false, true);
    } else {
      // If no root node, dispose meshes individually
      model.meshes.forEach(mesh => mesh.dispose(false, true));
    }
    
    // Dispose animation groups
    model.animationGroups?.forEach(ag => ag.dispose());
    
    // Dispose skeletons
    model.skeletons?.forEach(skeleton => skeleton.dispose());
    
    this.loadedAssets.delete(fileName);
    this.loadedAssetCount--;
    this.totalAssets--;
    this.updateGlobalProgress();
  }
  
  /**
   * Dispose of all loaded models
   */
  public disposeAll(): void {
    this.loadedAssets.forEach((_, fileName) => {
      this.disposeModel(fileName);
    });
    
    this.loadedAssets.clear();
    this.loadedAssetCount = 0;
    this.totalAssets = 0;
    this.updateGlobalProgress();
  }
  
  /**
   * Load a texture asynchronously
   * @param fileName - The file name of the texture
   * @returns Promise that resolves when the texture is loaded
   */
  public async loadTexture(fileName: string): Promise<string> {
    const texturePath = `${this.baseUrl}textures/${fileName}`;
    
    // We're just returning the path here as Babylon will handle texture loading
    // when materials are created. This method exists for consistency and future expansion.
    return texturePath;
  }
  
  /**
   * Load an audio file asynchronously
   * @param fileName - The file name of the audio file
   * @returns Promise that resolves with the audio file path
   */
  public async loadAudio(fileName: string): Promise<string> {
    const audioPath = `${this.baseUrl}audio/${fileName}`;
    
    // Similar to textures, we return the path for use with Howler or Babylon's audio system
    return audioPath;
  }
}
