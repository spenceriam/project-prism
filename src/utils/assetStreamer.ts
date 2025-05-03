import { Scene, Vector3 } from '@babylonjs/core';
import { AssetLoader, ModelLoadResult } from './loader';

/**
 * Configuration for asset streaming
 */
export interface AssetStreamingConfig {
  /** Maximum distance at which assets are loaded */
  loadDistance: number;
  /** Distance at which assets are unloaded */
  unloadDistance: number;
  /** How frequently to check distances (in milliseconds) */
  updateFrequency: number;
  /** Maximum number of assets to load in a single update */
  maxLoadsPerUpdate: number;
  /** Whether to prioritize assets based on distance */
  prioritizeByDistance: boolean;
}

/**
 * Asset streaming entry for a streamable asset
 */
interface StreamableAsset {
  /** Unique identifier for the asset */
  id: string;
  /** File name to load */
  fileName: string;
  /** Position in the world */
  position: Vector3;
  /** Whether the asset is currently loaded */
  isLoaded: boolean;
  /** Priority for loading (lower is higher priority) */
  priority: number;
  /** Callback when the asset is loaded */
  onLoaded?: (result: ModelLoadResult) => void;
  /** Callback when the asset is unloaded */
  onUnloaded?: () => void;
}

/**
 * AssetStreamer handles dynamic loading and unloading of assets based on player position
 * Implements efficient streaming strategies for browser-based game performance
 */
export class AssetStreamer {
  private scene: Scene;
  private assetLoader: AssetLoader;
  private config: AssetStreamingConfig;
  private streamableAssets: Map<string, StreamableAsset>;
  private updateInterval: number | null = null;
  private playerPosition: Vector3;
  private loadQueue: StreamableAsset[] = [];
  private isProcessingQueue: boolean = false;
  
  /**
   * Creates a new AssetStreamer
   * @param scene - The Babylon.js scene
   * @param assetLoader - The AssetLoader instance to use
   * @param config - Configuration for asset streaming
   */
  constructor(
    scene: Scene, 
    assetLoader: AssetLoader, 
    config: AssetStreamingConfig = {
      loadDistance: 100,
      unloadDistance: 150,
      updateFrequency: 1000,
      maxLoadsPerUpdate: 2,
      prioritizeByDistance: true
    }
  ) {
    this.scene = scene;
    this.assetLoader = assetLoader;
    this.config = config;
    this.streamableAssets = new Map();
    this.playerPosition = Vector3.Zero();
  }
  
  /**
   * Starts the asset streaming system
   * @param initialPlayerPosition - Initial player position
   */
  public start(initialPlayerPosition: Vector3): void {
    this.playerPosition = initialPlayerPosition;
    
    // Clear any existing interval
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
    }
    
    // Start the update interval
    this.updateInterval = window.setInterval(
      () => this.update(),
      this.config.updateFrequency
    );
    
    console.log('Asset streaming system started');
  }
  
  /**
   * Stops the asset streaming system
   */
  public stop(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    console.log('Asset streaming system stopped');
  }
  
  /**
   * Updates the player position for distance calculations
   * @param position - New player position
   */
  public updatePlayerPosition(position: Vector3): void {
    this.playerPosition = position;
  }
  
  /**
   * Registers an asset for streaming
   * @param id - Unique identifier for the asset
   * @param fileName - File name to load
   * @param position - Position in the world
   * @param onLoaded - Callback when the asset is loaded
   * @param onUnloaded - Callback when the asset is unloaded
   */
  public registerAsset(
    id: string,
    fileName: string,
    position: Vector3,
    onLoaded?: (result: ModelLoadResult) => void,
    onUnloaded?: () => void
  ): void {
    // Calculate initial priority based on distance
    const distance = Vector3.Distance(position, this.playerPosition);
    const priority = this.config.prioritizeByDistance ? distance : 0;
    
    const asset: StreamableAsset = {
      id,
      fileName,
      position,
      isLoaded: false,
      priority,
      onLoaded,
      onUnloaded
    };
    
    this.streamableAssets.set(id, asset);
    
    // Check if asset should be immediately loaded
    if (distance <= this.config.loadDistance) {
      this.queueAssetForLoading(asset);
    }
  }
  
  /**
   * Unregisters an asset from streaming
   * @param id - Unique identifier for the asset
   * @param forceUnload - Whether to force unload the asset
   */
  public unregisterAsset(id: string, forceUnload: boolean = true): void {
    const asset = this.streamableAssets.get(id);
    if (!asset) return;
    
    // Remove from load queue if present
    this.loadQueue = this.loadQueue.filter(a => a.id !== id);
    
    // Unload if currently loaded
    if (asset.isLoaded && forceUnload) {
      this.unloadAsset(asset);
    }
    
    this.streamableAssets.delete(id);
  }
  
  /**
   * Updates the streaming system, checking distances and loading/unloading assets
   */
  private update(): void {
    // Process assets that need to be loaded or unloaded
    this.streamableAssets.forEach(asset => {
      const distance = Vector3.Distance(asset.position, this.playerPosition);
      
      // Update priority if prioritizing by distance
      if (this.config.prioritizeByDistance) {
        asset.priority = distance;
      }
      
      // Check if asset should be loaded
      if (!asset.isLoaded && distance <= this.config.loadDistance) {
        this.queueAssetForLoading(asset);
      }
      // Check if asset should be unloaded
      else if (asset.isLoaded && distance > this.config.unloadDistance) {
        this.unloadAsset(asset);
      }
    });
    
    // Process the load queue if not already processing
    if (!this.isProcessingQueue && this.loadQueue.length > 0) {
      this.processLoadQueue();
    }
  }
  
  /**
   * Queues an asset for loading
   * @param asset - The asset to queue
   */
  private queueAssetForLoading(asset: StreamableAsset): void {
    // Don't queue if already in queue or already loaded
    if (asset.isLoaded || this.loadQueue.includes(asset)) {
      return;
    }
    
    this.loadQueue.push(asset);
    
    // Sort the queue by priority (lower values = higher priority)
    this.loadQueue.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Processes the load queue, loading assets up to maxLoadsPerUpdate
   */
  private async processLoadQueue(): Promise<void> {
    if (this.loadQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    // Take only the configured maximum number of assets to load
    const assetsToLoad = this.loadQueue.splice(0, this.config.maxLoadsPerUpdate);
    
    // Load each asset
    const loadPromises = assetsToLoad.map(async (asset) => {
      try {
        // Check if the asset is already loaded in the AssetLoader
        let modelResult = this.assetLoader.getLoadedModel(asset.fileName);
        
        // If not loaded, load it
        if (!modelResult) {
          modelResult = await this.assetLoader.loadModel(asset.fileName);
        }
        
        // Update asset state
        asset.isLoaded = true;
        
        // Call the onLoaded callback if provided
        if (asset.onLoaded) {
          asset.onLoaded(modelResult);
        }
        
        return true;
      } catch (error) {
        console.error(`Error loading streamed asset ${asset.id}:`, error);
        // Put back in queue with lower priority for retry
        asset.priority += 10; // Penalize failed loads
        this.queueAssetForLoading(asset);
        return false;
      }
    });
    
    // Wait for all loads to complete
    await Promise.all(loadPromises);
    
    this.isProcessingQueue = false;
    
    // If there are more assets in the queue, process them on the next frame
    if (this.loadQueue.length > 0) {
      requestAnimationFrame(() => this.processLoadQueue());
    }
  }
  
  /**
   * Unloads an asset
   * @param asset - The asset to unload
   */
  private unloadAsset(asset: StreamableAsset): void {
    if (!asset.isLoaded) return;
    
    // Check if any other registered assets use the same file
    let canUnload = true;
    this.streamableAssets.forEach((otherAsset) => {
      if (otherAsset.id !== asset.id && 
          otherAsset.fileName === asset.fileName && 
          otherAsset.isLoaded) {
        canUnload = false;
      }
    });
    
    // Only unload from AssetLoader if no other assets use this file
    if (canUnload) {
      this.assetLoader.disposeModel(asset.fileName);
    }
    
    // Update asset state
    asset.isLoaded = false;
    
    // Call the onUnloaded callback if provided
    if (asset.onUnloaded) {
      asset.onUnloaded();
    }
  }
  
  /**
   * Forces loading of an asset regardless of distance
   * @param id - Unique identifier for the asset
   * @returns Promise that resolves when the asset is loaded
   */
  public async forceLoadAsset(id: string): Promise<ModelLoadResult | undefined> {
    const asset = this.streamableAssets.get(id);
    if (!asset) return undefined;
    
    // If already loaded, return the loaded model
    if (asset.isLoaded) {
      return this.assetLoader.getLoadedModel(asset.fileName);
    }
    
    try {
      // Load the model
      const modelResult = await this.assetLoader.loadModel(asset.fileName);
      
      // Update asset state
      asset.isLoaded = true;
      
      // Call the onLoaded callback if provided
      if (asset.onLoaded) {
        asset.onLoaded(modelResult);
      }
      
      return modelResult;
    } catch (error) {
      console.error(`Error force loading asset ${id}:`, error);
      return undefined;
    }
  }
  
  /**
   * Forces unloading of an asset regardless of distance
   * @param id - Unique identifier for the asset
   */
  public forceUnloadAsset(id: string): void {
    const asset = this.streamableAssets.get(id);
    if (!asset || !asset.isLoaded) return;
    
    this.unloadAsset(asset);
  }
  
  /**
   * Gets statistics about the streaming system
   * @returns Object with statistics
   */
  public getStats(): {
    totalAssets: number;
    loadedAssets: number;
    queuedAssets: number;
    loadDistance: number;
    unloadDistance: number;
  } {
    let loadedCount = 0;
    this.streamableAssets.forEach(asset => {
      if (asset.isLoaded) loadedCount++;
    });
    
    return {
      totalAssets: this.streamableAssets.size,
      loadedAssets: loadedCount,
      queuedAssets: this.loadQueue.length,
      loadDistance: this.config.loadDistance,
      unloadDistance: this.config.unloadDistance
    };
  }
}
