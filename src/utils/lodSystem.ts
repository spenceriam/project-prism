import { Scene, Mesh, MeshBuilder, Vector3, Material, AbstractMesh, Camera, Color3 } from '@babylonjs/core';

/**
 * Configuration for a LOD level
 */
export interface LODLevelConfig {
  /** Distance at which this LOD level becomes active */
  distance: number;
  /** Percentage of triangles to keep (0-1) for mesh simplification */
  quality: number;
  /** Whether to use a simplified material at this level */
  useSimplifiedMaterial?: boolean;
}

/**
 * Configuration for the LOD system
 */
export interface LODSystemConfig {
  /** Whether to enable automatic LOD generation */
  autoGenerate: boolean;
  /** Whether to show debug visualization of LOD levels */
  showDebug: boolean;
  /** How frequently to update LOD levels (in milliseconds) */
  updateFrequency: number;
  /** Default LOD levels if not specified per mesh */
  defaultLevels: LODLevelConfig[];
}

/**
 * LODSystem handles Level of Detail management for optimizing rendering performance
 * Implements efficient LOD strategies for browser-based game performance
 */
export class LODSystem {
  private scene: Scene;
  private config: LODSystemConfig;
  private managedMeshes: Map<string, AbstractMesh> = new Map();
  private updateInterval: number | null = null;
  private camera: Camera;
  
  /**
   * Creates a new LODSystem
   * @param scene - The Babylon.js scene
   * @param camera - The camera to use for distance calculations
   * @param config - Configuration for the LOD system
   */
  constructor(
    scene: Scene,
    camera: Camera,
    config: LODSystemConfig = {
      autoGenerate: true,
      showDebug: false,
      updateFrequency: 1000,
      defaultLevels: [
        { distance: 0, quality: 1.0 },
        { distance: 20, quality: 0.75 },
        { distance: 50, quality: 0.5 },
        { distance: 100, quality: 0.25 }
      ]
    }
  ) {
    this.scene = scene;
    this.camera = camera;
    this.config = config;
  }
  
  /**
   * Starts the LOD system
   */
  public start(): void {
    // Clear any existing interval
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
    }
    
    // Start the update interval for dynamic LOD adjustments
    this.updateInterval = window.setInterval(
      () => this.update(),
      this.config.updateFrequency
    );
    
    console.log('LOD system started');
  }
  
  /**
   * Stops the LOD system
   */
  public stop(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    console.log('LOD system stopped');
  }
  
  /**
   * Registers a mesh with the LOD system
   * @param mesh - The mesh to register
   * @param levels - Optional custom LOD levels for this mesh
   * @param generateImmediately - Whether to generate LOD meshes immediately
   */
  public registerMesh(
    mesh: AbstractMesh,
    levels?: LODLevelConfig[],
    generateImmediately: boolean = true
  ): void {
    if (!(mesh instanceof Mesh)) {
      console.warn(`Cannot register non-Mesh object ${mesh.name} with LOD system`);
      return;
    }
    
    // Store the mesh
    this.managedMeshes.set(mesh.id, mesh);
    
    // Generate LOD meshes if requested
    if (generateImmediately && this.config.autoGenerate) {
      this.generateLODsForMesh(mesh as Mesh, levels || this.config.defaultLevels);
    }
  }
  
  /**
   * Unregisters a mesh from the LOD system
   * @param meshId - The ID of the mesh to unregister
   * @param disposeLODs - Whether to dispose LOD meshes
   */
  public unregisterMesh(meshId: string, disposeLODs: boolean = true): void {
    const mesh = this.managedMeshes.get(meshId);
    if (!mesh) return;
    
    // Remove LOD levels if requested
    if (disposeLODs && mesh instanceof Mesh) {
      // Remove LOD levels one by one if the method exists
      if (typeof mesh.getLODLevels === 'function' && typeof mesh.removeLODLevel === 'function') {
        try {
          const lodLevels = [...mesh.getLODLevels()];
          lodLevels.forEach(level => {
            if (level.mesh) {
              mesh.removeLODLevel(level.mesh);
            }
          });
        } catch (error) {
          console.warn(`Error removing LOD levels from ${mesh.name}:`, error);
        }
      }
    }
    
    this.managedMeshes.delete(meshId);
  }
  
  /**
   * Generates LOD levels for a mesh
   * @param mesh - The mesh to generate LODs for
   * @param levels - The LOD levels to generate
   */
  public generateLODsForMesh(mesh: Mesh, levels: LODLevelConfig[]): void {
    // Sort levels by distance (ascending)
    const sortedLevels = [...levels].sort((a, b) => a.distance - b.distance);
    
    // Remove any existing LOD meshes
    const existingLODs = this.scene.meshes.filter(m => 
      m.name.startsWith(mesh.name + '_LOD_')
    );
    
    // If the mesh has LOD capabilities, remove any existing LOD levels
    if (typeof mesh.getLODLevels === 'function' && typeof mesh.removeLODLevel === 'function') {
      try {
        const lodLevels = mesh.getLODLevels();
        // We need to create a copy of the array since we're modifying it during iteration
        [...lodLevels].forEach(level => {
          if (level.mesh && level.mesh.name.startsWith(mesh.name + '_LOD_')) {
            mesh.removeLODLevel(level.mesh);
          }
        });
      } catch (error) {
        console.warn(`Error removing LOD levels from ${mesh.name}:`, error);
      }
    }
    
    // Dispose existing LOD meshes
    existingLODs.forEach(lodMesh => {
      lodMesh.dispose();
    });
    
    // Skip the first level (it's the original mesh)
    for (let i = 1; i < sortedLevels.length; i++) {
      const level = sortedLevels[i];
      
      // Create a simplified version of the mesh
      const lodMesh = this.createSimplifiedMesh(mesh, level);
      
      // Name the mesh to include the distance for our custom LOD system
      lodMesh.name = `${mesh.name}_LOD_${level.distance}`;
      
      // Set visibility for debug mode
      if (this.config.showDebug) {
        lodMesh.isVisible = true;
        lodMesh.position = mesh.position.clone();
        lodMesh.position.addInPlace(new Vector3(i * 2, 0, 0)); // Offset for visualization
      } else {
        lodMesh.isVisible = false;
      }
    }
  }
  
  /**
   * Creates a simplified version of a mesh for LOD
   * @param originalMesh - The original mesh
   * @param level - The LOD level configuration
   * @returns The simplified mesh
   */
  private createSimplifiedMesh(originalMesh: Mesh, level: LODLevelConfig): Mesh {
    // Create a clone of the original mesh
    const simplifiedMesh = originalMesh.clone(`${originalMesh.name}_LOD_${level.distance}`, null, true);
    
    if (!simplifiedMesh) {
      console.error(`Failed to clone mesh ${originalMesh.name} for LOD`);
      return originalMesh;
    }
    
    // For simplicity in this implementation, we'll just scale down the mesh
    // In a real implementation, you would use a proper mesh simplification algorithm
    const targetQuality = Math.max(0.1, level.quality); // Minimum 10% quality
    
    // Scale the mesh based on quality (simplified approach)
    simplifiedMesh.scaling = new Vector3(
      targetQuality,
      targetQuality,
      targetQuality
    );
    
    console.log(`Created simplified LOD for ${originalMesh.name} at distance ${level.distance}`);
    
    // Apply simplified material if requested
    if (level.useSimplifiedMaterial && originalMesh.material) {
      const simplifiedMaterial = this.createSimplifiedMaterial(originalMesh.material, level.quality);
      if (simplifiedMaterial) {
        simplifiedMesh.material = simplifiedMaterial;
      }
    }
    
    return simplifiedMesh;
  }
  
  /**
   * Creates a simplified version of a material for LOD
   * @param originalMaterial - The original material
   * @param quality - The quality level (0-1)
   * @returns The simplified material
   */
  private createSimplifiedMaterial(originalMaterial: Material, quality: number): Material | null {
    // Clone the original material
    const simplifiedMaterial = originalMaterial.clone(`${originalMaterial.name}_LOD_${quality}`);
    
    if (!simplifiedMaterial) {
      console.warn(`Failed to clone material ${originalMaterial.name} for LOD`);
      return null;
    }
    
    // Apply simplifications based on material type
    // This is a simplified example - actual implementation would depend on material type
    
    // For PBR materials
    if ('albedoTexture' in simplifiedMaterial) {
      // Reduce texture resolution or remove textures at lower quality levels
      if (quality < 0.3) {
        (simplifiedMaterial as any).albedoTexture = null;
        (simplifiedMaterial as any).bumpTexture = null;
        (simplifiedMaterial as any).metallicTexture = null;
      }
    }
    
    return simplifiedMaterial;
  }
  
  /**
   * Updates the LOD system, checking distances and updating LOD levels
   */
  private update(): void {
    // Skip if no camera or no managed meshes
    if (!this.camera || this.managedMeshes.size === 0) return;
    
    // Get camera position
    const cameraPosition = this.camera.position;
    
    // Update LOD for each managed mesh
    this.managedMeshes.forEach(mesh => {
      if (mesh instanceof Mesh) {
        // Calculate distance to camera
        const distance = Vector3.Distance(mesh.position, cameraPosition);
        
        // Find LOD meshes by naming convention
        const lodMeshes = this.scene.meshes.filter(m => 
          m.name.startsWith(mesh.name + '_LOD_')
        );
        
        // Skip if no LOD meshes
        if (lodMeshes.length === 0) return;
        
        // Debug visualization
        if (this.config.showDebug) {
          let activeLODIndex = -1;
          
          // Find the active LOD level
          for (let i = 0; i < lodMeshes.length; i++) {
            // Extract distance from name (e.g. "mesh_LOD_50" -> 50)
            const lodDistance = parseInt(lodMeshes[i].name.split('_LOD_')[1]);
            if (distance >= lodDistance) {
              activeLODIndex = i;
            } else {
              break;
            }
          }
          
          // Update debug visualization
          for (let i = 0; i < lodMeshes.length; i++) {
            const lodMesh = lodMeshes[i];
            if (lodMesh instanceof Mesh) {
              // Highlight the active LOD level
              lodMesh.overlayColor = i === activeLODIndex 
                ? Color3.Green() 
                : Color3.Gray();
              lodMesh.renderOverlay = true;
            }
          }
        }
      }
    });
  }
  
  /**
   * Generates LODs for all registered meshes
   * @param levels - Optional custom LOD levels to use for all meshes
   */
  public generateAllLODs(levels?: LODLevelConfig[]): void {
    this.managedMeshes.forEach(mesh => {
      if (mesh instanceof Mesh) {
        this.generateLODsForMesh(mesh, levels || this.config.defaultLevels);
      }
    });
  }
  
  /**
   * Toggles debug visualization
   * @param show - Whether to show debug visualization
   */
  public toggleDebug(show: boolean): void {
    this.config.showDebug = show;
    
    // Update visibility of LOD meshes
    this.managedMeshes.forEach(mesh => {
      if (mesh instanceof Mesh) {
        // Find LOD meshes by naming convention
        const lodMeshes = this.scene.meshes.filter(m => 
          m.name.startsWith(mesh.name + '_LOD_')
        );
        
        lodMeshes.forEach((lodMesh, index) => {
          if (show) {
            lodMesh.isVisible = true;
            lodMesh.position = mesh.position.clone();
            lodMesh.position.addInPlace(new Vector3(index * 2, 0, 0));
          } else {
            lodMesh.isVisible = false;
          }
        });
      }
    });
  }
  
  /**
   * Gets statistics about the LOD system
   * @returns Object with statistics
   */
  public getStats(): {
    managedMeshes: number;
    totalLODMeshes: number;
    memoryReduction: number;
  } {
    let totalLODMeshes = 0;
    let originalTriangles = 0;
    let lodTriangles = 0;
    
    this.managedMeshes.forEach(mesh => {
      if (mesh instanceof Mesh) {
        // Find LOD meshes by naming convention
        const lodMeshes = this.scene.meshes.filter(m => 
          m.name.startsWith(mesh.name + '_LOD_')
        );
        
        totalLODMeshes += lodMeshes.length;
        
        // Calculate triangle counts
        const originalCount = (mesh as Mesh).getTotalIndices() / 3;
        originalTriangles += originalCount;
        
        lodMeshes.forEach(lodMesh => {
          if (lodMesh instanceof Mesh) {
            lodTriangles += lodMesh.getTotalIndices() / 3;
          }
        });
      }
    });
    
    // Calculate approximate memory reduction (very rough estimate)
    const memoryReduction = originalTriangles > 0 
      ? Math.round((1 - (lodTriangles / originalTriangles)) * 100) 
      : 0;
    
    return {
      managedMeshes: this.managedMeshes.size,
      totalLODMeshes,
      memoryReduction
    };
  }
}
