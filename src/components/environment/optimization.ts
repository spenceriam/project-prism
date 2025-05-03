import { Scene, AbstractMesh, Mesh, Vector3, MeshBuilder, Color3, Material, StandardMaterial, InstancedMesh, TransformNode, LOD, Camera, BoundingSphere, SceneOptimizer, SceneOptimizerOptions, SceneOptimizationOptions, MergeMeshesOptimization, ShadowsOptimization, RenderTargetsOptimization, HardwareScalingOptimization, ParticlesOptimization } from '@babylonjs/core';

/**
 * LOD (Level of Detail) configuration
 */
export interface LODConfig {
  distances: number[];      // Array of distances for each LOD level
  reductionFactors: number[]; // Percentage of vertices to keep for each level (0-1)
}

/**
 * Optimization settings for environment rendering
 */
export interface OptimizationSettings {
  enableInstancing?: boolean;     // Use instancing for repeated meshes
  enableLOD?: boolean;            // Enable level of detail
  enableMeshMerging?: boolean;    // Merge static meshes
  enableOcclusion?: boolean;      // Enable occlusion culling
  enableFrustumCulling?: boolean; // Enable frustum culling
  lodConfig?: LODConfig;          // LOD configuration
  occlusionCullingInterval?: number; // Milliseconds between occlusion checks
  maxInstancesPerBatch?: number;  // Maximum instances per batch
  autoOptimizeLevel?: number;     // Auto-optimization level (0-3)
}

/**
 * EnvironmentOptimizer handles performance optimizations for environment rendering
 * Implements various techniques to improve browser-based rendering performance
 */
export class EnvironmentOptimizer {
  private scene: Scene;
  private instancedMeshes: Map<string, Mesh[]> = new Map();
  private lodMeshes: Map<string, LOD> = new Map();
  private mergedMeshes: Map<string, Mesh> = new Map();
  private occlusionInterval: number | null = null;
  private settings: OptimizationSettings;
  private sceneOptimizer: SceneOptimizer | null = null;

  /**
   * Create a new environment optimizer
   * @param scene - The Babylon.js scene
   * @param settings - Optimization settings
   */
  constructor(scene: Scene, settings: OptimizationSettings = {}) {
    this.scene = scene;
    this.settings = {
      enableInstancing: settings.enableInstancing ?? true,
      enableLOD: settings.enableLOD ?? true,
      enableMeshMerging: settings.enableMeshMerging ?? true,
      enableOcclusion: settings.enableOcclusion ?? true,
      enableFrustumCulling: settings.enableFrustumCulling ?? true,
      lodConfig: settings.lodConfig ?? {
        distances: [10, 30, 60, 100],
        reductionFactors: [1.0, 0.75, 0.5, 0.25]
      },
      occlusionCullingInterval: settings.occlusionCullingInterval ?? 500,
      maxInstancesPerBatch: settings.maxInstancesPerBatch ?? 100,
      autoOptimizeLevel: settings.autoOptimizeLevel ?? 0
    };

    // Apply global optimizations
    this.applyGlobalOptimizations();
  }

  /**
   * Apply global scene optimizations
   */
  private applyGlobalOptimizations(): void {
    // Enable frustum culling
    if (this.settings.enableFrustumCulling) {
      this.scene.autoClear = true;
      this.scene.autoClearDepthAndStencil = true;
    }

    // Apply auto-optimization if enabled
    if (this.settings.autoOptimizeLevel && this.settings.autoOptimizeLevel > 0) {
      const options = new SceneOptimizerOptions(
        this.settings.autoOptimizeLevel,
        60  // Target FPS
      );

      // Add custom optimizations
      if (this.settings.autoOptimizeLevel >= 2) {
        options.optimizations.push(new MergeMeshesOptimization(0));
        options.optimizations.push(new ShadowsOptimization(0));
      }

      this.sceneOptimizer = new SceneOptimizer(this.scene, options);
      this.sceneOptimizer.start();
    }

    // Set up occlusion culling
    if (this.settings.enableOcclusion) {
      this.setupOcclusionCulling();
    }
  }

  /**
   * Set up occlusion culling
   */
  private setupOcclusionCulling(): void {
    // Clear any existing interval
    if (this.occlusionInterval !== null) {
      clearInterval(this.occlusionInterval);
    }

    // Set up interval for occlusion checks
    this.occlusionInterval = window.setInterval(() => {
      this.performOcclusionCulling();
    }, this.settings.occlusionCullingInterval) as unknown as number;
  }

  /**
   * Perform occlusion culling check
   */
  private performOcclusionCulling(): void {
    const camera = this.scene.activeCamera;
    if (!camera) return;

    // Get all meshes that can be occluded
    const meshes = this.scene.meshes.filter(mesh => 
      mesh.isVisible && 
      !mesh.isOccluded && 
      mesh.metadata?.canBeOccluded
    );

    // Check each mesh for occlusion
    for (const mesh of meshes) {
      // Skip if mesh is too close to camera
      const distanceToCamera = Vector3.Distance(mesh.position, camera.position);
      if (distanceToCamera < 5) {
        mesh.isVisible = true;
        continue;
      }

      // Get mesh bounding sphere
      const boundingSphere = mesh.getBoundingInfo().boundingSphere;
      
      // Check if mesh is in camera frustum
      if (camera.isInFrustum(boundingSphere)) {
        // Perform ray cast to check if mesh is occluded
        const rayDirection = mesh.position.subtract(camera.position).normalize();
        const ray = this.scene.createPickingRay(
          camera.position.x,
          camera.position.y,
          camera.getWorldMatrix(),
          this.scene
        );

        const hit = this.scene.pickWithRay(ray);
        
        // If hit something and it's not this mesh, then this mesh is occluded
        if (hit && hit.pickedMesh && hit.pickedMesh !== mesh) {
          mesh.isVisible = false;
        } else {
          mesh.isVisible = true;
        }
      } else {
        // Not in frustum, hide it
        mesh.isVisible = false;
      }
    }
  }

  /**
   * Create instanced meshes for repeated objects
   * @param sourceMesh - The source mesh to instance
   * @param positions - Array of positions for instances
   * @param rotations - Optional array of rotations for instances
   * @param scales - Optional array of scales for instances
   * @returns Array of created instances
   */
  public createInstances(
    sourceMesh: Mesh,
    positions: Vector3[],
    rotations?: Vector3[],
    scales?: Vector3[]
  ): InstancedMesh[] {
    if (!this.settings.enableInstancing) {
      // If instancing is disabled, just clone the meshes
      return positions.map((position, index) => {
        const clone = sourceMesh.clone(`${sourceMesh.name}_clone_${index}`) as Mesh;
        clone.position = position;
        
        if (rotations && rotations[index]) {
          clone.rotation = rotations[index];
        }
        
        if (scales && scales[index]) {
          clone.scaling = scales[index];
        }
        
        return clone;
      });
    }

    // Create instances
    const instances: InstancedMesh[] = [];
    const instanceName = `${sourceMesh.name}_instance`;
    
    // Store source mesh
    if (!this.instancedMeshes.has(sourceMesh.name)) {
      this.instancedMeshes.set(sourceMesh.name, [sourceMesh]);
    }
    
    // Create instances in batches to avoid performance issues
    const batchSize = this.settings.maxInstancesPerBatch || 100;
    
    for (let i = 0; i < positions.length; i++) {
      const instance = sourceMesh.createInstance(`${instanceName}_${i}`);
      instance.position = positions[i];
      
      if (rotations && rotations[i]) {
        instance.rotation = rotations[i];
      }
      
      if (scales && scales[i]) {
        instance.scaling = scales[i];
      }
      
      instances.push(instance);
      
      // Add to tracked instances
      this.instancedMeshes.get(sourceMesh.name)!.push(instance);
      
      // If we've reached the batch size, finalize the batch
      if ((i + 1) % batchSize === 0) {
        // This would be where we'd do batch-specific optimizations
        // For now, we're just tracking the instances
      }
    }
    
    return instances;
  }

  /**
   * Create LOD (Level of Detail) for a mesh
   * @param mesh - The mesh to create LOD for
   * @param config - LOD configuration
   * @returns The LOD object
   */
  public createLOD(mesh: Mesh, config?: LODConfig): LOD {
    if (!this.settings.enableLOD) {
      // If LOD is disabled, just return a dummy LOD
      const dummyLOD = new LOD(mesh.name, this.scene);
      dummyLOD.addLOD(mesh, Infinity);
      return dummyLOD;
    }

    // Use provided config or default
    const lodConfig = config || this.settings.lodConfig;
    
    if (!lodConfig) {
      throw new Error('LOD configuration is required');
    }
    
    // Create LOD object
    const lod = new LOD(mesh.name, this.scene);
    
    // Add highest detail level (original mesh)
    lod.addLOD(mesh, lodConfig.distances[0]);
    
    // Create lower detail levels
    for (let i = 1; i < lodConfig.distances.length; i++) {
      // Create simplified mesh
      const simplifiedMesh = mesh.clone(`${mesh.name}_lod_${i}`) as Mesh;
      
      // Apply simplification (in a real implementation, we'd use a proper decimation algorithm)
      // For now, we'll just scale down the mesh to simulate lower detail
      simplifiedMesh.scaling = new Vector3(1, 1, 1).scale(lodConfig.reductionFactors[i]);
      
      // Add to LOD
      lod.addLOD(simplifiedMesh, lodConfig.distances[i]);
    }
    
    // Store LOD
    this.lodMeshes.set(mesh.name, lod);
    
    return lod;
  }

  /**
   * Merge static meshes for better performance
   * @param meshes - Array of meshes to merge
   * @param name - Name for the merged mesh
   * @param disposeSource - Whether to dispose source meshes
   * @returns The merged mesh
   */
  public mergeMeshes(
    meshes: Mesh[],
    name: string,
    disposeSource: boolean = true
  ): Mesh {
    if (!this.settings.enableMeshMerging || meshes.length <= 1) {
      // If merging is disabled or unnecessary, just return the first mesh
      return meshes[0];
    }

    // Check if meshes can be merged (must have same material)
    const material = meshes[0].material;
    const canMerge = meshes.every(mesh => mesh.material === material);
    
    if (!canMerge) {
      console.warn('Cannot merge meshes with different materials');
      return meshes[0];
    }
    
    // Merge meshes
    const mergedMesh = Mesh.MergeMeshes(
      meshes,
      true,             // Dispose source meshes
      true,             // Allow different materials
      undefined,        // Use default parent
      false,            // Don't clone materials
      true              // Use sub-meshes
    );
    
    if (!mergedMesh) {
      console.warn('Failed to merge meshes');
      return meshes[0];
    }
    
    // Set name
    mergedMesh.name = name;
    
    // Store merged mesh
    this.mergedMeshes.set(name, mergedMesh);
    
    return mergedMesh;
  }

  /**
   * Mark a mesh as occludable for occlusion culling
   * @param mesh - The mesh to mark
   */
  public markAsOccludable(mesh: AbstractMesh): void {
    if (!mesh.metadata) {
      mesh.metadata = {};
    }
    
    mesh.metadata.canBeOccluded = true;
  }

  /**
   * Mark a mesh as non-occludable
   * @param mesh - The mesh to mark
   */
  public markAsNonOccludable(mesh: AbstractMesh): void {
    if (!mesh.metadata) {
      mesh.metadata = {};
    }
    
    mesh.metadata.canBeOccluded = false;
  }

  /**
   * Create a simplified collision mesh for a complex mesh
   * @param mesh - The source mesh
   * @param name - Name for the collision mesh
   * @returns The simplified collision mesh
   */
  public createSimplifiedCollisionMesh(mesh: AbstractMesh, name: string): Mesh {
    // Get bounding box
    const boundingInfo = mesh.getBoundingInfo();
    const dimensions = boundingInfo.boundingBox.extendSize.scale(2);
    
    // Create box mesh
    const collisionMesh = MeshBuilder.CreateBox(
      name,
      {
        width: dimensions.x,
        height: dimensions.y,
        depth: dimensions.z
      },
      this.scene
    );
    
    // Position at center of source mesh
    collisionMesh.position = mesh.position.clone();
    collisionMesh.rotation = mesh.rotation.clone();
    collisionMesh.scaling = mesh.scaling.clone();
    
    // Make invisible
    collisionMesh.isVisible = false;
    
    return collisionMesh;
  }

  /**
   * Update optimization settings
   * @param settings - New optimization settings
   */
  public updateSettings(settings: Partial<OptimizationSettings>): void {
    // Update settings
    this.settings = {
      ...this.settings,
      ...settings
    };
    
    // Reapply global optimizations
    this.applyGlobalOptimizations();
  }

  /**
   * Dispose of the optimizer and all created resources
   */
  public dispose(): void {
    // Clear occlusion interval
    if (this.occlusionInterval !== null) {
      clearInterval(this.occlusionInterval);
      this.occlusionInterval = null;
    }
    
    // Stop scene optimizer
    if (this.sceneOptimizer) {
      this.sceneOptimizer.stop();
      this.sceneOptimizer = null;
    }
    
    // Clear maps (meshes will be disposed by scene)
    this.instancedMeshes.clear();
    this.lodMeshes.clear();
    this.mergedMeshes.clear();
  }
}
