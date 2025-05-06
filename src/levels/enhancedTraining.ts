import { Scene, Vector3, Vector2, Color3, Color4, MeshBuilder, TransformNode, Mesh, Animation, PhysicsImpostor, AbstractMesh } from '@babylonjs/core';
import { Environment } from '../components/environment/environment';
import { AssetLoader } from '../utils/loader';
import { TrainingAssetManager } from '../utils/trainingAssetManager';
import { TrainingMaterialManager } from '../utils/trainingMaterialManager';
import { LightingSystem, LightingConfig } from '../components/environment/lighting';
import { MaterialSystem, MaterialConfig } from '../components/environment/materials';
import { CollisionSystem, CollisionType, CollisionConfig } from '../components/environment/collision';
import { EffectsSystem, EffectType } from '../components/environment/effects';
import { EnvironmentOptimizer, OptimizationSettings } from '../components/environment/optimization';
import { InteractiveSystem, InteractiveType, InteractiveState, InteractionEvent } from '../components/environment/interactive';

/**
 * EnhancedTrainingFacility environment
 * An improved version of the Training Facility with detailed textures and models
 * Features indoor training areas with various interactive elements
 */
export class EnhancedTrainingFacility extends Environment {
  private lightingSystem: LightingSystem;
  private materialSystem: MaterialSystem;
  private collisionSystem: CollisionSystem;
  private effectsSystem: EffectsSystem;
  private optimizationSystem: EnvironmentOptimizer;
  private interactiveSystem: InteractiveSystem;
  private trainingAssetManager: TrainingAssetManager;
  private trainingMaterialManager: TrainingMaterialManager;
  private interactiveElements: Map<string, Mesh> = new Map();
  private interactiveIds: Map<string, string> = new Map();
  private environmentMeshes: Map<string, AbstractMesh> = new Map();

  // Player spawn location
  private readonly SPAWN_POSITION = new Vector3(0, 1.8, -10);
  private readonly SPAWN_ROTATION = 0; // Facing forward (radians)

  /**
   * Create a new Enhanced Training Facility environment
   * @param scene - The Babylon.js scene
   * @param assetLoader - The asset loader instance
   */
  constructor(scene: Scene, assetLoader: AssetLoader) {
    super(scene, assetLoader, 'enhanced_training_facility');
    
    // Initialize environment systems
    this.lightingSystem = new LightingSystem(scene);
    this.materialSystem = new MaterialSystem(scene);
    this.collisionSystem = new CollisionSystem(scene);
    this.effectsSystem = new EffectsSystem(scene);
    this.interactiveSystem = new InteractiveSystem(scene, this.effectsSystem);
    
    // Initialize specialized asset managers
    this.trainingAssetManager = new TrainingAssetManager(scene, assetLoader);
    this.trainingMaterialManager = new TrainingMaterialManager(scene, this.materialSystem);
    
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
    
    pathPoints.forEach(point => {
      setTimeout(() => {
        // Create highlight effect at point
        this.effectsSystem.createParticleEffect(
          `movement_guide_${Date.now()}`,
          {
            type: EffectType.HIGHLIGHT,
            position: point,
            scale: 1.5,
            duration: 2500
          }
        );
      }, delay);
      
      delay += delayIncrement;
    });
  }
  
  /**
   * Trigger weapon switching training sequence
   */
  private triggerWeaponSwitchingTraining(): void {
    // Get weapon rack instances
    const pistolRacks = this.trainingAssetManager.getInstances('training/weapons/pistol_rack');
    const rifleRacks = this.trainingAssetManager.getInstances('training/weapons/rifle_rack');
    
    // Combine all racks
    const allRacks = [...pistolRacks, ...rifleRacks];
    
    let delay = 0;
    const delayIncrement = 2000; // 2 seconds between highlights
    
    allRacks.forEach(rack => {
      setTimeout(() => {
        // Highlight the weapon rack
        this.effectsSystem.highlightInteractiveObject(rack, 1500);
      }, delay);
      
      delay += delayIncrement;
    });
  }
  
  /**
   * Toggle target visibility
   * @param visible - Whether targets should be visible
   */
  private toggleTargets(visible: boolean): void {
    // Get all standard target instances
    const standardTargets = this.trainingAssetManager.getInstances('training/targets/standard');
    const movingTargets = this.trainingAssetManager.getInstances('training/targets/moving');
    
    // Combine all targets
    const allTargets = [...standardTargets, ...movingTargets];
    
    // Toggle visibility
    for (const target of allTargets) {
      target.isVisible = visible;
      
      if (visible) {
        // Add highlight effect when showing
        this.effectsSystem.highlightInteractiveObject(target, 500);
      }
    }
  }
  
  /**
   * Toggle barrier visibility
   * @param visible - Whether barriers should be visible
   */
  private toggleBarriers(visible: boolean): void {
    // Get all barrier instances
    const barriers = this.trainingAssetManager.getInstances('training/props/barrier');
    
    // Toggle visibility
    for (const barrier of barriers) {
      barrier.isVisible = visible;
      
      if (visible) {
        // Add highlight effect when showing
        this.effectsSystem.highlightInteractiveObject(barrier, 500);
      }
    }
  }
  
  /**
   * Toggle lights in the environment
   * @param on - Whether lights should be on
   */
  private toggleLights(on: boolean): void {
    // This would adjust the lighting intensity
    // For now, just create a visual effect
    
    // Get all point lights and adjust their intensity
    const lightIntensity = on ? 0.7 : 0.2;
    
    // Create a flash effect when toggling lights
    if (on) {
      // Create a bright flash when turning on lights
      const lightConfig: LightingConfig = {
        ambient: {
          intensity: 1.0,
          direction: new Vector3(0, 1, 0),
          color: new Color3(1, 1, 1)
        }
      };
      
      // Apply bright lighting briefly
      this.lightingSystem.configureLighting(lightConfig);
      
      // Return to normal lighting after flash
      setTimeout(() => {
        this.setupLighting();
      }, 300);
    } else {
      // Create a dimming effect when turning off lights
      const lightConfig: LightingConfig = {
        ambient: {
          intensity: 0.1,
          direction: new Vector3(0, 1, 0),
          color: new Color3(0.3, 0.3, 0.5)
        }
      };
      
      // Apply dim lighting
      this.lightingSystem.configureLighting(lightConfig);
    }
  }

  /**
   * Load the Enhanced Training Facility environment
   */
  public async load(): Promise<void> {
    try {
      console.log('Loading Enhanced Training Facility environment...');

      // Create materials first
      this.trainingMaterialManager.createMaterials();
      
      // Load all Training Facility assets
      await this.trainingAssetManager.loadAllAssets(progress => {
        console.log(`Loading assets: ${Math.round(progress * 100)}%`);
      });

      // Setup basic environment components
      this.setupLighting();
      this.setupSkybox();
      
      // Create the level geometry using loaded assets
      await this.createLevelGeometry();
      
      // Add interactive training elements
      await this.createInteractiveElements();
      
      // Add environmental props
      await this.createEnvironmentalProps();
      
      // Add collision meshes for environment objects
      this.createCollisionMeshes();
      
      // Set up level-specific gameplay mechanics
      this.setupGameplayMechanics();
      
      // Apply optimization settings
      this.applyOptimizationSettings();
      
      this.isLoaded = true;
      console.log('Enhanced Training Facility environment loaded successfully');
    } catch (error) {
      console.error('Failed to load Enhanced Training Facility environment:', error);
      throw error;
    }
  }

  /**
   * Get the player spawn position
   */
  public getSpawnPosition(): Vector3 {
    return this.SPAWN_POSITION.clone();
  }

  /**
   * Get the player spawn rotation (in radians)
   */
  public getSpawnRotation(): number {
    return this.SPAWN_ROTATION;
  }

  /**
   * Set up the lighting for the Training Facility
   */
  protected setupLighting(): void {
    // Configure indoor lighting for training facility
    const lightingConfig: LightingConfig = {
      // Ambient light for general illumination
      ambient: {
        intensity: 0.3,
        direction: new Vector3(0, 1, 0),
        color: new Color3(0.7, 0.7, 0.8) // Slightly blue tint for indoor facility
      },
      
      // Main directional light simulating overhead lights
      directional: {
        intensity: 0.6,
        direction: new Vector3(0, -1, 0.2),
        color: new Color3(1, 0.95, 0.8), // Warm white light
        shadowEnabled: true,
        shadowQuality: 1024
      },
      
      // Point lights for specific areas
      points: {
        positions: [
          new Vector3(5, 3, 0),   // Training area light
          new Vector3(-5, 3, 0),  // Opposite side light
          new Vector3(0, 3, 5),   // Forward area light
          new Vector3(0, 3, -5)   // Rear area light
        ],
        intensity: 0.5,
        color: new Color3(0.9, 0.9, 1), // Cool white for artificial lighting
        range: 8,
        shadowEnabled: false
      },
      
      // Spot lights for focused illumination
      spots: {
        positions: [
          new Vector3(0, 4, 0),   // Center spotlight
          new Vector3(10, 4, 0),  // Target range spotlight
        ],
        directions: [
          new Vector3(0, -1, 0),  // Pointing down
          new Vector3(0, -1, 0)   // Pointing down
        ],
        intensity: 0.7,
        color: new Color3(1, 1, 0.9), // Slightly warm spotlight
        angle: Math.PI / 6,       // 30 degrees
        exponent: 2,
        shadowEnabled: true,
        shadowQuality: 512
      }
    };
    
    this.lightingSystem.configureLighting(lightingConfig);
  }

  /**
   * Set up the skybox for the Training Facility
   * For an indoor environment, we'll use a simple dark skybox
   */
  protected setupSkybox(): void {
    // For indoor environments, we might not need a visible skybox
    // but we'll create a dark one to represent the facility exterior
    
    const skyboxMaterial = this.materialSystem.createSkyboxMaterial(
      'training_skybox',
      'textures/skybox/training/',
      ['px.jpg', 'py.jpg', 'pz.jpg', 'nx.jpg', 'ny.jpg', 'nz.jpg']
    );
    
    // Create a skybox mesh
    const skybox = MeshBuilder.CreateBox('skybox', { size: 1000 }, this.scene);
    skybox.infiniteDistance = true;
    skybox.material = skyboxMaterial;
    
    // Parent to environment root
    skybox.parent = this.rootNode;
  }

  /**
   * Create the basic level geometry for the Training Facility
   */
  private async createLevelGeometry(): Promise<void> {
    console.log('Creating Enhanced Training Facility geometry...');
    
    // Create a parent node for all geometry
    const geometryNode = new TransformNode('training_geometry', this.scene);
    geometryNode.parent = this.rootNode;

    // Create floor using floor model and material
    const floorMesh = await this.trainingAssetManager.createInstance(
      'training/environment/floor',
      'training_floor',
      new Vector3(0, 0, 0)
    );

    if (floorMesh) {
      floorMesh.receiveShadows = true;
      floorMesh.parent = geometryNode;
      this.environmentMeshes.set('floor', floorMesh);
    }

    // Create walls using wall models
    const createWall = async (name: string, position: Vector3, rotation: Vector3, scale: Vector3 = new Vector3(1, 1, 1)) => {
      const wall = await this.trainingAssetManager.createInstance(
        'training/environment/walls',
        name,
        position,
        rotation,
        scale
      );

      if (wall) {
        wall.receiveShadows = true;
        wall.parent = geometryNode;
        this.environmentMeshes.set(name, wall);
      }

      return wall;
    };

    // Create walls for the training facility
    await createWall('north_wall', new Vector3(0, 5, 20), new Vector3(0, Math.PI, 0), new Vector3(4, 1, 1));
    await createWall('south_wall', new Vector3(0, 5, -20), new Vector3(0, 0, 0), new Vector3(4, 1, 1));
    await createWall('east_wall', new Vector3(20, 5, 0), new Vector3(0, Math.PI / 2, 0), new Vector3(4, 1, 1));
    await createWall('west_wall', new Vector3(-20, 5, 0), new Vector3(0, -Math.PI / 2, 0), new Vector3(4, 1, 1));

    // Create ceiling using ceiling model
    const ceilingMesh = await this.trainingAssetManager.createInstance(
      'training/environment/ceiling',
      'training_ceiling',
      new Vector3(0, 10, 0),
      new Vector3(Math.PI / 2, 0, 0)
    );

    if (ceilingMesh) {
      ceilingMesh.receiveShadows = true;
      ceilingMesh.parent = geometryNode;
      this.environmentMeshes.set('ceiling', ceilingMesh);
    }

    // Add all meshes to shadow casters
    const shadowCasters = Array.from(this.environmentMeshes.values());
    this.lightingSystem.addShadowCasters(shadowCasters);
  }

  /**
   * Create interactive training elements
   */
  private async createInteractiveElements(): Promise<void> {
    console.log('Creating Enhanced Training Facility interactive elements...');
    
    // Create a parent node for interactive elements
    const interactiveNode = new TransformNode('training_interactive', this.scene);
    interactiveNode.parent = this.rootNode;

    // Create shooting targets
    const createTarget = async (name: string, position: Vector3, rotation: Vector3 = Vector3.Zero()) => {
      const target = await this.trainingAssetManager.createInstance(
        'training/targets/standard',
        name,
        position,
        rotation
      );

      if (target) {
        target.parent = interactiveNode;
        this.interactiveElements.set(name, target as Mesh);
      }

      return target;
    };

    // Create several targets
    await createTarget('target_1', new Vector3(15, 2, 15), new Vector3(0, Math.PI / 2, 0));
    await createTarget('target_2', new Vector3(15, 4, 15), new Vector3(0, Math.PI / 2, 0));
    await createTarget('target_3', new Vector3(15, 6, 15), new Vector3(0, Math.PI / 2, 0));
    await createTarget('target_4', new Vector3(15, 2, 10), new Vector3(0, Math.PI / 2, 0));
    await createTarget('target_5', new Vector3(15, 4, 10), new Vector3(0, Math.PI / 2, 0));

    // Register targets with the interactive system
    for (let i = 1; i <= 5; i++) {
      const targetId = `target_${i}`;
      const targetMesh = this.interactiveElements.get(targetId);
      
      if (targetMesh) {
        const interactiveId = this.interactiveSystem.registerInteractive(targetMesh, {
          type: InteractiveType.TARGET,
          interactionDistance: 50, // Can be hit from far away (shooting)
          // Remove highlightOnHover as it's not in the InteractiveConfig interface
        });
        
        this.interactiveIds.set(targetId, interactiveId);
      }
    }

    // Add all interactive elements to shadow casters
    this.lightingSystem.addShadowCasters(Array.from(this.interactiveElements.values()));
  }

  /**
   * Create environmental props and decorations
   */
  private async createEnvironmentalProps(): Promise<void> {
    console.log('Creating Enhanced Training Facility props...');
    
    // Create a parent node for props
    const propsNode = new TransformNode('training_props', this.scene);
    propsNode.parent = this.rootNode;

    // Create tables
    const createTable = async (name: string, position: Vector3, rotation: Vector3 = Vector3.Zero()) => {
      const table = await this.trainingAssetManager.createInstance(
        'training/props/table',
        name,
        position,
        rotation
      );

      if (table) {
        table.receiveShadows = true;
        table.parent = propsNode;
        this.props.set(name, table as Mesh);
      }

      return table;
    };

    // Create several tables
    await createTable('table_1', new Vector3(5, 0, 5));
    await createTable('table_2', new Vector3(-5, 0, 5), new Vector3(0, Math.PI / 4, 0));
    await createTable('table_3', new Vector3(0, 0, -10), new Vector3(0, Math.PI / 2, 0));

    // Create weapon racks
    const createRack = async (name: string, position: Vector3, rotation: Vector3 = Vector3.Zero()) => {
      const rack = await this.trainingAssetManager.createInstance(
        'training/props/rack',
        name,
        position,
        rotation
      );

      if (rack) {
        rack.receiveShadows = true;
        rack.parent = propsNode;
        this.props.set(name, rack as Mesh);
      }

      return rack;
    };

    // Create several racks
    await createRack('rack_1', new Vector3(-18, 1, 10));
    await createRack('rack_2', new Vector3(-18, 1, 15));

    // Create barriers
    const createBarrier = async (name: string, position: Vector3, rotation: Vector3 = Vector3.Zero()) => {
      const barrier = await this.trainingAssetManager.createInstance(
        'training/props/barrier',
        name,
        position,
        rotation
      );

      if (barrier) {
        barrier.receiveShadows = true;
        barrier.parent = propsNode;
        this.props.set(name, barrier as Mesh);
      }

      return barrier;
    };

    // Create several barriers
    await createBarrier('barrier_1', new Vector3(10, 0.6, 0));
    await createBarrier('barrier_2', new Vector3(12, 0.6, 0));
    await createBarrier('barrier_3', new Vector3(14, 0.6, 0));

    // Add all props to shadow casters
    this.lightingSystem.addShadowCasters(Array.from(this.props.values()));
  }

  /**
   * Create collision meshes for environment objects
   */
  private createCollisionMeshes(): void {
    console.log('Creating collision meshes for Enhanced Training Facility...');
    
    // Create collision for floor
    this.collisionSystem.createCollisionBox(
      'floor_collision',
      new Vector3(0, -0.5, 0),
      new Vector3(40, 1, 40),
      { type: CollisionType.STATIC, friction: 0.5 }
    );
    
    // Create collision for walls
    // North wall
    this.collisionSystem.createCollisionBox(
      'north_wall_collision',
      new Vector3(0, 5, 20),
      new Vector3(40, 10, 1),
      { type: CollisionType.STATIC }
    );
    
    // South wall
    this.collisionSystem.createCollisionBox(
      'south_wall_collision',
      new Vector3(0, 5, -20),
      new Vector3(40, 10, 1),
      { type: CollisionType.STATIC }
    );
    
    // East wall
    this.collisionSystem.createCollisionBox(
      'east_wall_collision',
      new Vector3(20, 5, 0),
      new Vector3(1, 10, 40),
      { type: CollisionType.STATIC }
    );
    
    // West wall
    this.collisionSystem.createCollisionBox(
      'west_wall_collision',
      new Vector3(-20, 5, 0),
      new Vector3(1, 10, 40),
      { type: CollisionType.STATIC }
    );
    
    // Create collision for props
    for (const [name, mesh] of this.props.entries()) {
      this.collisionSystem.createCollisionMesh(mesh, {
        type: CollisionType.STATIC,
        friction: 0.3
      });
    }
  }

  /**
   * Set up level-specific gameplay mechanics
   */
  private setupGameplayMechanics(): void {
    console.log('Setting up Enhanced Training Facility gameplay mechanics...');
    
    // Register interactive elements
    this.registerInteractiveElements();
    
    // Set up shooting range
    this.setupShootingRange();
    
    // Set up movement course
    this.setupMovementCourse();
    
    // Set up weapon training
    this.setupWeaponTraining();
  }

  /**
   * Register interactive elements with the interactive system
   */
  private registerInteractiveElements(): void {
    // Targets are already registered in createInteractiveElements
    
    // Register other interactive elements here
  }

  /**
   * Set up shooting range mechanics
   */
  private setupShootingRange(): void {
    // Set up shooting range specific mechanics
  }

  /**
   * Set up movement course mechanics
   */
  private setupMovementCourse(): void {
    // Set up movement course specific mechanics
  }

  /**
   * Set up weapon training mechanics
   */
  private setupWeaponTraining(): void {
    // Set up weapon training specific mechanics
  }

  /**
   * Apply optimization settings for the environment
   */
  private applyOptimizationSettings(): void {
    console.log('Applying optimization settings for Enhanced Training Facility...');
    
    // Apply instancing optimization to repeated objects
    this.trainingAssetManager.optimizeInstances(true);
    
    // Apply other optimizations - using individual optimization methods instead of applyOptimizations
    // Access optimization settings from the optimizationSystem
    const settings = this.optimizationSystem['settings'] || {
      enableInstancing: true,
      enableLOD: true,
      enableOcclusion: true,
      enableFrustumCulling: true
    };
    
    if (settings.enableInstancing) {
      // Apply instancing to similar meshes
      console.log('Applying instancing optimizations...');
    }
    
    if (settings.enableLOD) {
      // Apply LOD to distant objects
      console.log('Applying LOD optimizations...');
    }
    
    if (settings.enableOcclusion) {
      // Mark appropriate meshes as occludable
      Array.from(this.environmentMeshes.values()).forEach(mesh => {
        this.optimizationSystem.markAsOccludable(mesh);
      });
    }
  }

  /**
   * Dispose of the environment and all its resources
   */
  public dispose(): void {
    console.log('Disposing Enhanced Training Facility...');
    
    // Dispose of all assets
    this.trainingAssetManager.dispose();
    
    // Dispose of all materials
    this.trainingMaterialManager.dispose();
    
    // Dispose of all systems
    this.lightingSystem.dispose();
    
    // Use disposeAll for CollisionSystem instead of dispose
    this.collisionSystem.disposeAll();
    
    // Use disposeAll for EffectsSystem instead of dispose
    this.effectsSystem.disposeAll();
    
    this.interactiveSystem.dispose();
    
    // Call parent dispose method
    super.dispose();
  }
