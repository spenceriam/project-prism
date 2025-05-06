import { Scene, Vector3, Color3, Color4, MeshBuilder, TransformNode, Mesh, AbstractMesh } from '@babylonjs/core';
import { Environment } from '../components/environment/environment';
import { AssetLoader } from '../utils/loader';
import { TrainingPrimitiveManager } from '../utils/trainingPrimitiveManager';
import { LightingSystem } from '../components/environment/lighting';
import { MaterialSystem } from '../components/environment/materials';
import { CollisionSystem, CollisionType } from '../components/environment/collision';
import { EffectsSystem } from '../components/environment/effects';
import { EnvironmentOptimizer } from '../components/environment/optimization';
import { InteractiveSystem, InteractiveType, InteractiveState, InteractionEvent } from '../components/environment/interactive';

/**
 * PrimitiveTrainingFacility environment
 * A version of the Training Facility using simple primitive models
 * Allows development and testing without requiring external assets
 */
export class PrimitiveTrainingFacility extends Environment {
  private lightingSystem: LightingSystem;
  private materialSystem: MaterialSystem;
  private collisionSystem: CollisionSystem;
  private effectsSystem: EffectsSystem;
  private optimizationSystem: EnvironmentOptimizer;
  private interactiveSystem: InteractiveSystem;
  private primitiveManager: TrainingPrimitiveManager;
  private interactiveElements: Map<string, Mesh> = new Map();
  private interactiveIds: Map<string, string> = new Map();
  private environmentMeshes: Map<string, AbstractMesh> = new Map();

  // Player spawn location
  private readonly SPAWN_POSITION = new Vector3(0, 1.8, -10);
  private readonly SPAWN_ROTATION = 0; // Facing forward (radians)

  /**
   * Create a new Primitive Training Facility environment
   * @param scene - The Babylon.js scene
   * @param assetLoader - The asset loader instance
   */
  constructor(scene: Scene, assetLoader: AssetLoader) {
    super(scene, assetLoader, 'primitive_training_facility');
    
    // Set clear color for the scene (sky color)
    scene.clearColor = new Color4(0.4, 0.6, 0.9, 1.0);
    
    // Initialize environment systems
    this.lightingSystem = new LightingSystem(scene);
    this.materialSystem = new MaterialSystem(scene);
    this.collisionSystem = new CollisionSystem(scene);
    this.effectsSystem = new EffectsSystem(scene);
    this.interactiveSystem = new InteractiveSystem(scene, this.effectsSystem);
    
    // Initialize primitive model manager
    this.primitiveManager = new TrainingPrimitiveManager(scene);
    
    // Initialize optimization system with performance settings
    this.optimizationSystem = new EnvironmentOptimizer(scene, {
      enableInstancing: true,
      enableLOD: true,
      enableMeshMerging: true,
      enableOcclusion: true,
      enableFrustumCulling: true
    });
    
    // Set up interaction event handling
    this.setupInteractionHandlers();
  }
  
  /**
   * Set up handlers for interactive element events
   */
  private setupInteractionHandlers(): void {
    // Listen for interaction events
    this.interactiveSystem.onInteractionObservable.add((event: InteractionEvent) => {
      console.log(`Interaction: ${event.interactiveId} (${event.type}) - State: ${event.state}`);
      
      // Handle specific interactions
      switch (event.type) {
        case InteractiveType.TARGET:
          // Create impact effect when target is hit
          this.effectsSystem.createImpactEffect(event.position);
          break;
          
        case InteractiveType.BUTTON:
          // Trigger training sequence when button is pressed
          this.triggerTrainingSequence(event.interactiveId);
          break;
          
        case InteractiveType.SWITCH:
          // Toggle training elements when switch is toggled
          this.toggleTrainingElements(event.interactiveId, event.state);
          break;
      }
    });
  }
  
  /**
   * Load the environment
   * @returns Promise that resolves when the environment is loaded
   */
  public async load(): Promise<void> {
    await this.initialize();
  }

  /**
   * Initialize the environment
   * Creates all the primitive models and sets up the scene
   */
  public async initialize(): Promise<void> {
    console.log('Initializing Primitive Training Facility...');
    
    try {
      // Generate all primitive models
      this.primitiveManager.generateAllModels();
      
      // Set up basic lighting
      this.setupLighting();
      
      // Create the environment structure
      this.createEnvironment();
      
      // Create props and interactive elements
      this.createProps();
      this.createTargets();
      this.createWeaponDisplays();
      
      // Apply physics and collision
      this.setupPhysicsAndCollision();
      
      console.log('Primitive Training Facility initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Primitive Training Facility:', error);
      throw error;
    }
  }
  
  /**
   * Set up the skybox for the environment
   */
  protected setupSkybox(): void {
    // Create a simple skybox with a solid color
    // In a real implementation, we would load cubemap textures
    this.scene.clearColor = new Color4(0.4, 0.6, 0.9, 1.0);
  }

  /**
   * Set up basic lighting for the environment
   */
  protected setupLighting(): void {
    // Add ambient light
    this.lightingSystem.createAmbientLight('ambient', new Color3(0.3, 0.3, 0.3));
    
    // Add main directional light (simulating sunlight through windows)
    this.lightingSystem.createDirectionalLight(
      'mainLight',
      new Vector3(0.5, -1, 0.5),
      new Color3(1, 0.95, 0.8),
      0.7
    );
    
    // Add point lights for interior lighting
    this.lightingSystem.createPointLight(
      'light1',
      new Vector3(0, 3, 0),
      new Color3(0.9, 0.9, 1),
      15,
      0.8
    );
    
    this.lightingSystem.createPointLight(
      'light2',
      new Vector3(8, 3, 0),
      new Color3(0.9, 0.9, 1),
      15,
      0.8
    );
    
    this.lightingSystem.createPointLight(
      'light3',
      new Vector3(-8, 3, 0),
      new Color3(0.9, 0.9, 1),
      15,
      0.8
    );
    
    this.lightingSystem.createPointLight(
      'light4',
      new Vector3(0, 3, 8),
      new Color3(0.9, 0.9, 1),
      15,
      0.8
    );
    
    this.lightingSystem.createPointLight(
      'light5',
      new Vector3(0, 3, -8),
      new Color3(0.9, 0.9, 1),
      15,
      0.8
    );
  }
  
  /**
   * Create the basic environment structure
   * Uses primitive models for walls, floor, and ceiling
   */
  private createEnvironment(): void {
    // Create floor
    const floor = this.primitiveManager.createInstance(
      'training/environment/floor',
      'main_floor',
      new Vector3(0, 0, 0)
    );
    
    if (floor) {
      this.environmentMeshes.set('floor', floor);
      floor.checkCollisions = true;
    }
    
    // Create walls
    const walls = this.primitiveManager.createInstance(
      'training/environment/walls',
      'main_walls',
      new Vector3(0, 0, 0)
    );
    
    if (walls) {
      this.environmentMeshes.set('walls', walls);
      walls.checkCollisions = true;
    }
    
    // Create ceiling
    const ceiling = this.primitiveManager.createInstance(
      'training/environment/ceiling',
      'main_ceiling',
      new Vector3(0, 0, 0)
    );
    
    if (ceiling) {
      this.environmentMeshes.set('ceiling', ceiling);
    }
    
    // Create additional room dividers for different training areas
    
    // Shooting range area
    const rangeWall1 = MeshBuilder.CreateBox('rangeWall1', { width: 10, height: 4, depth: 0.2 }, this.scene);
    rangeWall1.position = new Vector3(5, 2, 5);
    rangeWall1.rotation = new Vector3(0, Math.PI / 4, 0);
    rangeWall1.checkCollisions = true;
    this.environmentMeshes.set('rangeWall1', rangeWall1);
    
    const rangeWall2 = MeshBuilder.CreateBox('rangeWall2', { width: 10, height: 4, depth: 0.2 }, this.scene);
    rangeWall2.position = new Vector3(-5, 2, 5);
    rangeWall2.rotation = new Vector3(0, -Math.PI / 4, 0);
    rangeWall2.checkCollisions = true;
    this.environmentMeshes.set('rangeWall2', rangeWall2);
    
    // Movement course area
    const courseWall1 = MeshBuilder.CreateBox('courseWall1', { width: 8, height: 4, depth: 0.2 }, this.scene);
    courseWall1.position = new Vector3(6, 2, -5);
    courseWall1.checkCollisions = true;
    this.environmentMeshes.set('courseWall1', courseWall1);
    
    const courseWall2 = MeshBuilder.CreateBox('courseWall2', { width: 8, height: 4, depth: 0.2 }, this.scene);
    courseWall2.position = new Vector3(-6, 2, -5);
    courseWall2.checkCollisions = true;
    this.environmentMeshes.set('courseWall2', courseWall2);
  }
  
  /**
   * Create props for the environment
   * Uses primitive models for tables, chairs, etc.
   */
  private createProps(): void {
    // Create tables
    const table1 = this.primitiveManager.createInstance(
      'training/props/table',
      'table1',
      new Vector3(3, 0, -8)
    );
    
    const table2 = this.primitiveManager.createInstance(
      'training/props/table',
      'table2',
      new Vector3(-3, 0, -8)
    );
    
    // Create chairs
    const chair1 = this.primitiveManager.createInstance(
      'training/props/chair',
      'chair1',
      new Vector3(3.5, 0, -7.5),
      new Vector3(0, Math.PI / 2, 0)
    );
    
    const chair2 = this.primitiveManager.createInstance(
      'training/props/chair',
      'chair2',
      new Vector3(-3.5, 0, -7.5),
      new Vector3(0, -Math.PI / 2, 0)
    );
    
    // Create computer workstations
    const computer1 = this.primitiveManager.createInstance(
      'training/props/computer',
      'computer1',
      new Vector3(3, 0.8, -8)
    );
    
    const computer2 = this.primitiveManager.createInstance(
      'training/props/computer',
      'computer2',
      new Vector3(-3, 0.8, -8)
    );
    
    // Create lockers
    const createLockerRow = (startX: number, count: number) => {
      for (let i = 0; i < count; i++) {
        this.primitiveManager.createInstance(
          'training/props/locker',
          `locker_${startX}_${i}`,
          new Vector3(startX + i * 0.85, 0, -9.5),
          new Vector3(0, Math.PI, 0)
        );
      }
    };
    
    createLockerRow(-9, 5);
    createLockerRow(5, 5);
    
    // Create barriers for movement course
    const createBarriers = (startX: number, startZ: number, count: number, spacing: number) => {
      for (let i = 0; i < count; i++) {
        const barrier = this.primitiveManager.createInstance(
          'training/props/barrier',
          `barrier_${i}`,
          new Vector3(startX + (i % 3) * spacing - spacing, 0, startZ + Math.floor(i / 3) * spacing),
          new Vector3(0, Math.PI / 4 * (i % 4), 0)
        );
        
        if (barrier) {
          barrier.checkCollisions = true;
        }
      }
    };
    
    createBarriers(0, -3, 9, 2);
  }
  
  /**
   * Create targets for the shooting range
   * Uses primitive models for standard and moving targets
   */
  private createTargets(): void {
    // Create standard targets
    const createStandardTargets = (startX: number, count: number, z: number) => {
      for (let i = 0; i < count; i++) {
        const x = startX + i * 2 - (count - 1);
        
        const target = this.primitiveManager.createInstance(
          'training/targets/standard',
          `target_standard_${i}`,
          new Vector3(x, 1.5, z),
          new Vector3(0, Math.PI, 0)
        ) as Mesh;
        
        if (target) {
          // Register as interactive element
          const targetId = `target_${i}`;
          this.interactiveElements.set(targetId, target);
          this.interactiveIds.set(target.id, targetId);
          
          // Register with interactive system
          this.interactiveSystem.registerInteractive(
            targetId,
            target,
            InteractiveType.TARGET
          );
        }
      }
    };
    
    createStandardTargets(0, 5, 9);
    
    // Create moving targets
    const createMovingTargets = (startX: number, count: number, z: number) => {
      for (let i = 0; i < count; i++) {
        const x = startX + i * 3 - (count - 1) * 1.5;
        
        const target = this.primitiveManager.createInstance(
          'training/targets/moving',
          `target_moving_${i}`,
          new Vector3(x, 1.5, z),
          new Vector3(0, Math.PI, 0)
        ) as Mesh;
        
        if (target) {
          // Register as interactive element
          const targetId = `moving_target_${i}`;
          this.interactiveElements.set(targetId, target);
          this.interactiveIds.set(target.id, targetId);
          
          // Register with interactive system
          this.interactiveSystem.registerInteractive(
            targetId,
            target,
            InteractiveType.TARGET
          );
        }
      }
    };
    
    createMovingTargets(0, 3, 7);
  }
  
  /**
   * Create weapon displays
   * Uses primitive models for weapon racks
   */
  private createWeaponDisplays(): void {
    // Create pistol rack
    const pistolRack = this.primitiveManager.createInstance(
      'training/weapons/pistol_rack',
      'pistol_rack',
      new Vector3(-8, 0, -5),
      new Vector3(0, Math.PI / 2, 0)
    );
    
    // Create rifle rack
    const rifleRack = this.primitiveManager.createInstance(
      'training/weapons/rifle_rack',
      'rifle_rack',
      new Vector3(-8, 0, -2),
      new Vector3(0, Math.PI / 2, 0)
    );
  }
  
  /**
   * Set up physics and collision for the environment
   */
  private setupPhysicsAndCollision(): void {
    // Apply collision to all environment meshes
    for (const [name, mesh] of this.environmentMeshes.entries()) {
      this.collisionSystem.addCollider(mesh, CollisionType.ENVIRONMENT);
    }
    
    // Apply collision to all props
    this.primitiveManager.applyCollisionToInstances('training/props/table');
    this.primitiveManager.applyCollisionToInstances('training/props/rack');
    this.primitiveManager.applyCollisionToInstances('training/props/barrier');
    this.primitiveManager.applyCollisionToInstances('training/props/chair');
    this.primitiveManager.applyCollisionToInstances('training/props/locker');
    this.primitiveManager.applyCollisionToInstances('training/props/computer');
  }
  
  /**
   * Trigger a training sequence based on which button was pressed
   * @param buttonId - ID of the button that was pressed
   */
  private triggerTrainingSequence(buttonId: string): void {
    // Extract the button number from the ID
    const buttonMatch = buttonId.match(/button_(\d+)/);
    if (!buttonMatch) return;
    
    const buttonNum = parseInt(buttonMatch[1]);
    console.log(`Triggering training sequence ${buttonNum}`);
    
    switch (buttonNum) {
      case 1:
        // Trigger target practice sequence
        this.triggerTargetPractice();
        break;
        
      case 2:
        // Trigger movement training sequence
        this.triggerMovementTraining();
        break;
        
      case 3:
        // Trigger weapon switching sequence
        this.triggerWeaponSwitchingTraining();
        break;
    }
  }
  
  /**
   * Toggle training elements based on switch state
   * @param switchId - ID of the switch
   * @param state - Current state of the switch
   */
  private toggleTrainingElements(switchId: string, state: InteractiveState): void {
    // Extract the switch number from the ID
    const switchMatch = switchId.match(/switch_(\d+)/);
    if (!switchMatch) return;
    
    const switchNum = parseInt(switchMatch[1]);
    const isActive = state === InteractiveState.ACTIVE;
    
    console.log(`Toggle training elements for switch ${switchNum}: ${isActive ? 'ON' : 'OFF'}`);
    
    // Toggle different elements based on which switch was used
    switch (switchNum) {
      case 1:
        // Toggle target visibility
        this.toggleTargets(isActive);
        break;
        
      case 2:
        // Toggle barriers
        this.toggleBarriers(isActive);
        break;
        
      case 3:
        // Toggle lights
        this.toggleLights(isActive);
        break;
    }
  }
  
  /**
   * Trigger target practice training sequence
   */
  private triggerTargetPractice(): void {
    // Get all targets
    const targetIds = this.interactiveSystem.getInteractivesByType(InteractiveType.TARGET);
    
    // Create a sequence of targets appearing and disappearing
    let delay = 0;
    const delayIncrement = 2000; // 2 seconds between targets
    
    targetIds.forEach(targetId => {
      // Initially hide all targets
      const targetMesh = this.interactiveElements.get(targetId.replace('target_', ''));
      if (targetMesh) {
        targetMesh.isVisible = false;
      }
      
      // Set up sequence with increasing delays
      setTimeout(() => {
        if (targetMesh) {
          // Show target with effect
          targetMesh.isVisible = true;
          this.effectsSystem.highlightInteractiveObject(targetMesh, 500);
          
          // Hide target after 5 seconds if not hit
          setTimeout(() => {
            if (targetMesh.isVisible) {
              targetMesh.isVisible = false;
            }
          }, 5000);
        }
      }, delay);
      
      delay += delayIncrement;
    });
  }
  
  /**
   * Trigger movement training sequence
   */
  private triggerMovementTraining(): void {
    // Create a series of highlight effects to guide player movement
    const pathPoints = [
      new Vector3(0, 0.1, 0),
      new Vector3(5, 0.1, 5),
      new Vector3(-5, 0.1, 10),
      new Vector3(0, 0.1, 15),
      new Vector3(10, 0.1, 10)
    ];
    
    let delay = 0;
    const delayIncrement = 3000; // 3 seconds between points
    
    pathPoints.forEach((point, index) => {
      setTimeout(() => {
        // Create a highlight effect at the point
        this.effectsSystem.createHighlightEffect(point, 1, new Color3(0, 1, 0), 2000);
        
        // If not the last point, create a line to the next point
        if (index < pathPoints.length - 1) {
          const nextPoint = pathPoints[index + 1];
          this.effectsSystem.createLineEffect(point, nextPoint, new Color3(0, 0.5, 0), 2000);
        }
      }, delay);
      
      delay += delayIncrement;
    });
  }
  
  /**
   * Trigger weapon switching training sequence
   */
  private triggerWeaponSwitchingTraining(): void {
    // Highlight weapon racks in sequence
    const pistolRack = this.primitiveManager.getInstances('training/weapons/pistol_rack')[0];
    const rifleRack = this.primitiveManager.getInstances('training/weapons/rifle_rack')[0];
    
    if (pistolRack && rifleRack) {
      // Highlight pistol rack first
      this.effectsSystem.highlightInteractiveObject(pistolRack as Mesh, 2000);
      
      // Then highlight rifle rack
      setTimeout(() => {
        this.effectsSystem.highlightInteractiveObject(rifleRack as Mesh, 2000);
      }, 3000);
      
      // Then highlight both
      setTimeout(() => {
        this.effectsSystem.highlightInteractiveObject(pistolRack as Mesh, 2000);
        this.effectsSystem.highlightInteractiveObject(rifleRack as Mesh, 2000);
      }, 6000);
    }
  }
  
  /**
   * Toggle target visibility
   * @param visible - Whether targets should be visible
   */
  private toggleTargets(visible: boolean): void {
    const targetIds = this.interactiveSystem.getInteractivesByType(InteractiveType.TARGET);
    
    targetIds.forEach(targetId => {
      const targetMesh = this.interactiveElements.get(targetId.replace('target_', ''));
      if (targetMesh) {
        targetMesh.isVisible = visible;
      }
    });
  }
  
  /**
   * Toggle barrier visibility
   * @param visible - Whether barriers should be visible
   */
  private toggleBarriers(visible: boolean): void {
    const barriers = this.primitiveManager.getInstances('training/props/barrier');
    
    barriers.forEach(barrier => {
      barrier.isVisible = visible;
      barrier.checkCollisions = visible;
    });
  }
  
  /**
   * Toggle lights
   * @param on - Whether lights should be on
   */
  private toggleLights(on: boolean): void {
    const intensity = on ? 0.8 : 0.2;
    
    this.lightingSystem.setLightIntensity('light1', intensity);
    this.lightingSystem.setLightIntensity('light2', intensity);
    this.lightingSystem.setLightIntensity('light3', intensity);
    this.lightingSystem.setLightIntensity('light4', intensity);
    this.lightingSystem.setLightIntensity('light5', intensity);
  }
  
  /**
   * Get the player spawn position
   * @returns The player spawn position
   */
  public getSpawnPosition(): Vector3 {
    return this.SPAWN_POSITION;
  }

  /**
   * Get the player spawn rotation
   * @returns The player spawn rotation in radians
   */
  public getSpawnRotation(): number {
    return this.SPAWN_ROTATION;
  }
  
  /**
   * Get the player spawn point (legacy method)
   * @returns The spawn position and rotation
   * @deprecated Use getSpawnPosition and getSpawnRotation instead
   */
  public getSpawnPoint(): { position: Vector3, rotation: number } {
    return {
      position: this.SPAWN_POSITION,
      rotation: this.SPAWN_ROTATION
    };
  }
  
  /**
   * Clean up the environment
   */
  public dispose(): void {
    // Dispose of all primitive models
    this.primitiveManager.dispose();
    
    // Dispose of all environment meshes
    for (const mesh of this.environmentMeshes.values()) {
      mesh.dispose();
    }
    
    // Clear maps
    this.environmentMeshes.clear();
    this.interactiveElements.clear();
    this.interactiveIds.clear();
  }
}
