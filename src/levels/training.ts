import { Scene, Vector3, Vector2, Color3, Color4, MeshBuilder, TransformNode, Mesh, Animation, PhysicsImpostor } from '@babylonjs/core';
import { Environment } from '../components/environment/environment';
import { AssetLoader } from '../utils/loader';
import { LightingSystem, LightingConfig } from '../components/environment/lighting';
import { MaterialSystem, MaterialConfig } from '../components/environment/materials';
import { CollisionSystem, CollisionType, CollisionConfig } from '../components/environment/collision';
import { EffectsSystem, EffectType } from '../components/environment/effects';
import { EnvironmentOptimizer, OptimizationSettings } from '../components/environment/optimization';
import { InteractiveSystem, InteractiveType, InteractiveState, InteractionEvent } from '../components/environment/interactive';

/**
 * TrainingFacility environment
 * The first level of the game, designed to teach the player basic mechanics
 * Features indoor training areas with various interactive elements
 */
export class TrainingFacility extends Environment {
  private lightingSystem: LightingSystem;
  private materialSystem: MaterialSystem;
  private collisionSystem: CollisionSystem;
  private effectsSystem: EffectsSystem;
  private optimizationSystem: EnvironmentOptimizer;
  private interactiveSystem: InteractiveSystem;
  private interactiveElements: Map<string, Mesh> = new Map();
  private interactiveIds: Map<string, string> = new Map();

  // Player spawn location
  private readonly SPAWN_POSITION = new Vector3(0, 1.8, -10);
  private readonly SPAWN_ROTATION = 0; // Facing forward (radians)

  /**
   * Create a new Training Facility environment
   * @param scene - The Babylon.js scene
   * @param assetLoader - The asset loader instance
   */
  constructor(scene: Scene, assetLoader: AssetLoader) {
    super(scene, assetLoader, 'training_facility');
    
    // Initialize environment systems
    this.lightingSystem = new LightingSystem(scene);
    this.materialSystem = new MaterialSystem(scene);
    this.collisionSystem = new CollisionSystem(scene);
    this.effectsSystem = new EffectsSystem(scene);
    this.interactiveSystem = new InteractiveSystem(scene, this.effectsSystem);
    
    // Initialize optimization system with performance settings
    this.optimizationSystem = new EnvironmentOptimizer(scene, {
      enableInstancing: true,
      enableLOD: true,
      enableMeshMerging: true,
      enableOcclusion: true,
      enableFrustumCulling: true,
      autoOptimizeLevel: 1
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
    // This would integrate with the weapon system
    // For now, just create some visual effects
    
    // Create weapon rack highlight effects
    const rackMeshes = [
      this.props.get('rack_1'),
      this.props.get('rack_2')
    ];
    
    let delay = 0;
    const delayIncrement = 2000; // 2 seconds between highlights
    
    rackMeshes.forEach(rackMesh => {
      if (rackMesh) {
        setTimeout(() => {
          // Highlight the weapon rack
          this.effectsSystem.highlightInteractiveObject(rackMesh, 1500);
        }, delay);
        
        delay += delayIncrement;
      }
    });
  }
  
  /**
   * Toggle target visibility
   * @param visible - Whether targets should be visible
   */
  private toggleTargets(visible: boolean): void {
    // Get all target meshes and toggle their visibility
    for (let i = 1; i <= 5; i++) {
      const targetMesh = this.interactiveElements.get(`target_${i}`);
      if (targetMesh) {
        targetMesh.isVisible = visible;
        
        if (visible) {
          // Add highlight effect when showing
          this.effectsSystem.highlightInteractiveObject(targetMesh, 500);
        }
      }
    }
  }
  
  /**
   * Toggle barrier visibility
   * @param visible - Whether barriers should be visible
   */
  private toggleBarriers(visible: boolean): void {
    // Get all barrier props and toggle their visibility
    for (let i = 1; i <= 3; i++) {
      const barrierMesh = this.props.get(`barrier_${i}`);
      if (barrierMesh) {
        barrierMesh.isVisible = visible;
        
        if (visible) {
          // Add highlight effect when showing
          this.effectsSystem.highlightInteractiveObject(barrierMesh, 500);
        }
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
   * Load the Training Facility environment
   */
  public async load(): Promise<void> {
    try {
      console.log('Loading Training Facility environment...');

      // Setup basic environment components
      this.setupLighting();
      this.setupSkybox();
      
      // Create the basic level geometry
      await this.createLevelGeometry();
      
      // Add interactive training elements
      await this.createInteractiveElements();
      
      // Add environmental props
      await this.createEnvironmentalProps();
      
      this.isLoaded = true;
      console.log('Training Facility environment loaded successfully');
    } catch (error) {
      console.error('Failed to load Training Facility environment:', error);
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
    // Create floor material
    const floorMaterial = this.materialSystem.createMaterial({
      name: 'training_floor',
      type: 'pbr',
      diffuseTexture: 'floor_training.jpg',
      bumpTexture: 'floor_training_normal.jpg',
      metallic: 0.1,
      roughness: 0.8,
      tiling: new Vector2(4, 4)
    });

    // Create wall material
    const wallMaterial = this.materialSystem.createMaterial({
      name: 'training_wall',
      type: 'pbr',
      diffuseTexture: 'wall_training.jpg',
      bumpTexture: 'wall_training_normal.jpg',
      metallic: 0.05,
      roughness: 0.9,
      tiling: new Vector2(2, 2)
    });

    // Create ceiling material
    const ceilingMaterial = this.materialSystem.createMaterial({
      name: 'training_ceiling',
      type: 'pbr',
      diffuseTexture: 'ceiling_training.jpg',
      metallic: 0.1,
      roughness: 0.7,
      tiling: new Vector2(4, 4)
    });

    // Create a parent node for all geometry
    const geometryNode = new TransformNode('training_geometry', this.scene);
    geometryNode.parent = this.rootNode;

    // Create floor
    const floor = MeshBuilder.CreateGround(
      'training_floor',
      { width: 40, height: 40, subdivisions: 2 },
      this.scene
    );
    floor.material = floorMaterial;
    floor.receiveShadows = true;
    floor.parent = geometryNode;

    // Create walls
    const createWall = (name: string, position: Vector3, rotation: number, width: number, height: number) => {
      const wall = MeshBuilder.CreatePlane(
        name,
        { width, height },
        this.scene
      );
      wall.position = position;
      wall.rotation.y = rotation;
      wall.material = wallMaterial;
      wall.receiveShadows = true;
      wall.parent = geometryNode;
      return wall;
    };

    // North wall
    const northWall = createWall('north_wall', new Vector3(0, 5, 20), Math.PI, 40, 10);
    
    // South wall
    const southWall = createWall('south_wall', new Vector3(0, 5, -20), 0, 40, 10);
    
    // East wall
    const eastWall = createWall('east_wall', new Vector3(20, 5, 0), Math.PI / 2, 40, 10);
    
    // West wall
    const westWall = createWall('west_wall', new Vector3(-20, 5, 0), -Math.PI / 2, 40, 10);

    // Create ceiling
    const ceiling = MeshBuilder.CreatePlane(
      'training_ceiling',
      { width: 40, height: 40 },
      this.scene
    );
    ceiling.position = new Vector3(0, 10, 0);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.material = ceilingMaterial;
    ceiling.receiveShadows = true;
    ceiling.parent = geometryNode;

    // Add all meshes to shadow casters
    this.lightingSystem.addShadowCasters([floor, northWall, southWall, eastWall, westWall, ceiling]);
  }

  /**
   * Create interactive training elements
   */
  private async createInteractiveElements(): Promise<void> {
    // Create a parent node for interactive elements
    const interactiveNode = new TransformNode('training_interactive', this.scene);
    interactiveNode.parent = this.rootNode;

    // Create target material
    const targetMaterial = this.materialSystem.createMaterial({
      name: 'training_target',
      type: 'standard',
      diffuseColor: new Color3(1, 0.2, 0.2),
      emissiveColor: new Color3(0.5, 0, 0)
    });

    // Create button material
    const buttonMaterial = this.materialSystem.createMaterial({
      name: 'training_button',
      type: 'standard',
      diffuseColor: new Color3(0.2, 0.8, 0.2),
      emissiveColor: new Color3(0, 0.4, 0)
    });

    // Create shooting targets
    const createTarget = (name: string, position: Vector3) => {
      const target = MeshBuilder.CreateCylinder(
        name,
        { height: 0.1, diameter: 1, tessellation: 32 },
        this.scene
      );
      target.position = position;
      target.rotation.x = Math.PI / 2;
      target.material = targetMaterial;
      target.parent = interactiveNode;
      
      // Add to interactive elements map
      this.interactiveElements.set(name, target);
      
      return target;
    };

    // Create several targets
    createTarget('target_1', new Vector3(15, 2, 15));
    createTarget('target_2', new Vector3(15, 4, 15));
    createTarget('target_3', new Vector3(15, 6, 15));
    createTarget('target_4', new Vector3(15, 2, 10));
    createTarget('target_5', new Vector3(15, 4, 10));

    // Create interactive buttons
    const createButton = (name: string, position: Vector3) => {
      const button = MeshBuilder.CreateBox(
        name,
        { width: 0.5, height: 0.5, depth: 0.1 },
        this.scene
      );
      button.position = position;
      button.material = buttonMaterial;
      button.parent = interactiveNode;
      
      // Add to interactive elements map
      this.interactiveElements.set(name, button);
      
      return button;
    };

    // Create several buttons
    createButton('button_1', new Vector3(-15, 1.5, 0));
    createButton('button_2', new Vector3(-15, 1.5, 5));
    createButton('button_3', new Vector3(-15, 1.5, -5));

    // Add all interactive elements to shadow casters
    this.lightingSystem.addShadowCasters(Array.from(this.interactiveElements.values()));
  }

  /**
   * Create environmental props and decorations
   */
  private async createEnvironmentalProps(): Promise<void> {
    // Create a parent node for props
    const propsNode = new TransformNode('training_props', this.scene);
    propsNode.parent = this.rootNode;

    // Create table material
    const tableMaterial = this.materialSystem.createMaterial({
      name: 'training_table',
      type: 'pbr',
      diffuseColor: new Color3(0.5, 0.3, 0.1),
      metallic: 0.1,
      roughness: 0.8
    });

    // Create metal material
    const metalMaterial = this.materialSystem.createMaterial({
      name: 'training_metal',
      type: 'pbr',
      diffuseColor: new Color3(0.7, 0.7, 0.7),
      metallic: 0.8,
      roughness: 0.2
    });

    // Create tables
    const createTable = (name: string, position: Vector3, rotation: number) => {
      const table = MeshBuilder.CreateBox(
        name,
        { width: 2, height: 1, depth: 1 },
        this.scene
      );
      table.position = position;
      table.rotation.y = rotation;
      table.material = tableMaterial;
      table.receiveShadows = true;
      table.parent = propsNode;
      
      // Add to props map
      this.props.set(name, table);
      
      return table;
    };

    // Create several tables
    createTable('table_1', new Vector3(5, 0.5, 5), 0);
    createTable('table_2', new Vector3(-5, 0.5, 5), Math.PI / 4);
    createTable('table_3', new Vector3(0, 0.5, -10), Math.PI / 2);

    // Create weapon racks
    const createRack = (name: string, position: Vector3, rotation: number) => {
      const rack = MeshBuilder.CreateBox(
        name,
        { width: 3, height: 2, depth: 0.5 },
        this.scene
      );
      rack.position = position;
      rack.rotation.y = rotation;
      rack.material = metalMaterial;
      rack.receiveShadows = true;
      rack.parent = propsNode;
      
      // Add to props map
      this.props.set(name, rack);
      
      return rack;
    };

    // Create several racks
    createRack('rack_1', new Vector3(-18, 1, 10), 0);
    createRack('rack_2', new Vector3(-18, 1, 15), 0);

    // Create barriers
    const createBarrier = (name: string, position: Vector3, rotation: number) => {
      const barrier = MeshBuilder.CreateBox(
        name,
        { width: 2, height: 1.2, depth: 0.3 },
        this.scene
      );
      barrier.position = position;
      barrier.rotation.y = rotation;
      barrier.material = metalMaterial;
      barrier.receiveShadows = true;
      barrier.parent = propsNode;
      
      // Add to props map
      this.props.set(name, barrier);
      
      return barrier;
    };

    // Create several barriers
    createBarrier('barrier_1', new Vector3(10, 0.6, 0), 0);
    createBarrier('barrier_2', new Vector3(12, 0.6, 0), 0);
    createBarrier('barrier_3', new Vector3(14, 0.6, 0), 0);

    // Add all props to shadow casters
    this.lightingSystem.addShadowCasters(Array.from(this.props.values()));
  }

  /**
   * Get an interactive element by name
   * @param name - The name of the interactive element
   * @returns The interactive element mesh or undefined if not found
   */
  public getInteractiveElement(name: string): Mesh | undefined {
    return this.interactiveElements.get(name);
  }

  /**
   * Dispose of the environment and all its resources
   */
  public override dispose(): void {
    this.lightingSystem.dispose();
    this.materialSystem.disposeAll();
    this.interactiveElements.clear();
    super.dispose();
  }
}
