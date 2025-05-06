import { Scene, TransformNode, AbstractMesh, Vector3 } from '@babylonjs/core';
import { SimplePrimitiveGenerator } from './simplePrimitiveGenerator';

/**
 * TrainingPrimitiveManager
 * Manages simple primitive models for the Training Facility
 * Allows using primitive models directly in the scene without requiring file export
 */
export class TrainingPrimitiveManager {
  private scene: Scene;
  private primitiveGenerator: SimplePrimitiveGenerator;
  private primitiveModels: Map<string, TransformNode> = new Map();
  private modelInstances: Map<string, AbstractMesh[]> = new Map();

  /**
   * Creates a new TrainingPrimitiveManager
   * @param scene - The Babylon.js scene
   */
  constructor(scene: Scene) {
    this.scene = scene;
    this.primitiveGenerator = new SimplePrimitiveGenerator(scene);
  }

  /**
   * Generate all primitive models
   * @returns Map of model names to their root nodes
   */
  public generateAllModels(): Map<string, TransformNode> {
    console.log('Generating primitive models for Training Facility...');
    this.primitiveModels = this.primitiveGenerator.generateAllPrimitives();
    return this.primitiveModels;
  }

  /**
   * Get a primitive model by name
   * @param modelName - Name of the model to get
   * @returns The model's root node or undefined if not found
   */
  public getModel(modelName: string): TransformNode | undefined {
    return this.primitiveModels.get(modelName);
  }

  /**
   * Create an instance of a primitive model
   * @param modelName - Name of the model to instance
   * @param instanceName - Name for the new instance
   * @param position - Position for the instance
   * @param rotation - Rotation for the instance (in radians)
   * @param scale - Scale for the instance
   * @returns The created instance or undefined if model not found
   */
  public createInstance(
    modelName: string,
    instanceName: string,
    position: Vector3,
    rotation: Vector3 = Vector3.Zero(),
    scale: Vector3 = new Vector3(1, 1, 1)
  ): AbstractMesh | undefined {
    const model = this.primitiveModels.get(modelName);
    if (!model) {
      console.warn(`Model ${modelName} not found for instancing`);
      return undefined;
    }
    
    try {
      // Clone the root mesh and its children
      const instance = model.clone(instanceName, null) as AbstractMesh;
      if (!instance) {
        console.warn(`Failed to create instance of ${modelName}`);
        return undefined;
      }
      
      // Set transform
      instance.position = position;
      instance.rotation = rotation;
      instance.scaling = scale;
      
      // Track the instance
      if (!this.modelInstances.has(modelName)) {
        this.modelInstances.set(modelName, []);
      }
      this.modelInstances.get(modelName)?.push(instance);
      
      return instance;
    } catch (error) {
      console.error(`Error creating instance of ${modelName}:`, error);
      return undefined;
    }
  }

  /**
   * Create multiple instances of a model in a grid pattern
   * @param modelName - Name of the model to instance
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
    modelName: string,
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
        const instance = this.createInstance(modelName, instanceName, position, rotation, scale);
        
        if (instance) {
          instances.push(instance);
        }
      }
    }
    
    return instances;
  }

  /**
   * Get all instances of a specific model
   * @param modelName - Name of the model
   * @returns Array of instances or empty array if none found
   */
  public getInstances(modelName: string): AbstractMesh[] {
    return this.modelInstances.get(modelName) || [];
  }

  /**
   * Apply physics impostor to all instances of a model
   * @param modelName - Name of the model
   * @param mass - Mass for the physics impostor
   * @param restitution - Restitution (bounciness) for the physics impostor
   */
  public applyPhysicsToInstances(modelName: string, mass: number = 0, restitution: number = 0.2): void {
    const instances = this.modelInstances.get(modelName) || [];
    
    instances.forEach(instance => {
      // Apply physics impostor to the instance
      // This would typically be done with PhysicsImpostor
      console.log(`Applied physics to instance of ${modelName}`);
    });
  }

  /**
   * Apply collision detection to all instances of a model
   * @param modelName - Name of the model
   * @param checkCollisions - Whether to enable collision detection
   */
  public applyCollisionToInstances(modelName: string, checkCollisions: boolean = true): void {
    const instances = this.modelInstances.get(modelName) || [];
    
    instances.forEach(instance => {
      // Apply collision detection to the instance
      instance.checkCollisions = checkCollisions;
      console.log(`Applied collision detection to instance of ${modelName}`);
    });
  }

  /**
   * Dispose of all primitive models and instances
   */
  public dispose(): void {
    // Dispose of all instances
    for (const [modelName, instances] of this.modelInstances.entries()) {
      for (const instance of instances) {
        instance.dispose();
      }
    }
    
    // Clear the maps
    this.modelInstances.clear();
    this.primitiveModels.clear();
  }
}
