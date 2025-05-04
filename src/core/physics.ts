import { 
  Scene, 
  Vector3, 
  PhysicsImpostor, 
  AmmoJSPlugin, 
  Mesh, 
  AbstractMesh,
  PhysicsImpostorParameters,
  Ray,
  StandardMaterial,
  Color3
} from '@babylonjs/core';

// We'll use AmmoJS for physics
// Define Ammo.js type - it's a function that returns a Promise
declare const Ammo: any;

/**
 * Physics configuration options
 */
export interface PhysicsConfig {
  gravity: Vector3;
  debug: boolean;
}

/**
 * PhysicsSystem handles physics simulation for the game
 * Manages collision detection, gravity, and physics interactions
 */
export class PhysicsSystem {
  private scene: Scene;
  private config: PhysicsConfig;
  private physicsPlugin: AmmoJSPlugin | null = null;
  private debugMeshes: Map<AbstractMesh, Mesh> = new Map();
  
  /**
   * Creates a new PhysicsSystem
   * @param scene - The Babylon.js scene
   * @param config - Physics configuration options
   */
  constructor(scene: Scene, config?: Partial<PhysicsConfig>) {
    this.scene = scene;
    
    // Default configuration
    this.config = {
      gravity: new Vector3(0, -9.81, 0),
      debug: false,
      ...config
    };
  }
  
  /**
   * Initializes the physics system
   * @returns Promise that resolves when physics is initialized
   */
  public async initialize(): Promise<void> {
    try {
      // Initialize Ammo.js
      await this.initializeAmmo();
      
      // Create the physics plugin
      this.physicsPlugin = new AmmoJSPlugin();
      
      // Enable physics in the scene
      this.scene.enablePhysics(this.config.gravity, this.physicsPlugin);
      
      console.log('Physics system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize physics system:', error);
      throw error;
    }
  }
  
  /**
   * Initializes Ammo.js
   * @returns Promise that resolves when Ammo.js is initialized
   */
  private async initializeAmmo(): Promise<void> {
    // Check if Ammo is already available
    if (typeof Ammo !== 'undefined') {
      return Promise.resolve();
    }
    
    // Load Ammo.js dynamically
    return new Promise((resolve, reject) => {
      // Create script element
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/ammo.js@latest/ammo.js';
      script.async = true;
      
      // Set up callbacks
      script.onload = () => {
        // Initialize Ammo
        try {
          // Check if Ammo is defined
          if (typeof Ammo !== 'undefined') {
            // Use type assertion to tell TypeScript that Ammo is callable
            const ammoFunc = Ammo as unknown as () => Promise<void>;
            const ammoInstance = ammoFunc();
            
            if (ammoInstance && typeof ammoInstance.then === 'function') {
              ammoInstance.then(() => {
                console.log('Ammo.js loaded successfully');
                resolve();
              }).catch((error: Error) => {
                reject(new Error(`Failed to initialize Ammo.js: ${error.message}`));
              });
            } else {
              console.log('Ammo.js loaded successfully (synchronous)');
              resolve();
            }
          } else {
            reject(new Error('Ammo.js is not defined after script load'));
          }
        } catch (error) {
          reject(new Error(`Failed to initialize Ammo.js: ${error instanceof Error ? error.message : String(error)}`));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Ammo.js'));
      };
      
      // Add to document
      document.body.appendChild(script);
    });
  }
  
  /**
   * Creates a box collider
   * @param mesh - The mesh to add the collider to
   * @param options - Physics impostor parameters
   * @returns The mesh with the collider
   */
  public createBoxCollider(
    mesh: AbstractMesh, 
    options: PhysicsImpostorParameters
  ): AbstractMesh {
    mesh.physicsImpostor = new PhysicsImpostor(
      mesh,
      PhysicsImpostor.BoxImpostor,
      options,
      this.scene
    );
    
    if (this.config.debug) {
      this.createDebugMesh(mesh);
    }
    
    return mesh;
  }
  
  /**
   * Creates a sphere collider
   * @param mesh - The mesh to add the collider to
   * @param options - Physics impostor parameters
   * @returns The mesh with the collider
   */
  public createSphereCollider(
    mesh: AbstractMesh, 
    options: PhysicsImpostorParameters
  ): AbstractMesh {
    mesh.physicsImpostor = new PhysicsImpostor(
      mesh,
      PhysicsImpostor.SphereImpostor,
      options,
      this.scene
    );
    
    if (this.config.debug) {
      this.createDebugMesh(mesh);
    }
    
    return mesh;
  }
  
  /**
   * Creates a capsule collider
   * @param mesh - The mesh to add the collider to
   * @param options - Physics impostor parameters
   * @returns The mesh with the collider
   */
  public createCapsuleCollider(
    mesh: AbstractMesh, 
    options: PhysicsImpostorParameters
  ): AbstractMesh {
    mesh.physicsImpostor = new PhysicsImpostor(
      mesh,
      PhysicsImpostor.CapsuleImpostor,
      options,
      this.scene
    );
    
    if (this.config.debug) {
      this.createDebugMesh(mesh);
    }
    
    return mesh;
  }
  
  /**
   * Creates a mesh collider
   * @param mesh - The mesh to add the collider to
   * @param options - Physics impostor parameters
   * @returns The mesh with the collider
   */
  public createMeshCollider(
    mesh: AbstractMesh, 
    options: PhysicsImpostorParameters
  ): AbstractMesh {
    mesh.physicsImpostor = new PhysicsImpostor(
      mesh,
      PhysicsImpostor.MeshImpostor,
      options,
      this.scene
    );
    
    if (this.config.debug) {
      this.createDebugMesh(mesh);
    }
    
    return mesh;
  }
  
  /**
   * Creates a convex hull collider
   * @param mesh - The mesh to add the collider to
   * @param options - Physics impostor parameters
   * @returns The mesh with the collider
   */
  public createConvexCollider(
    mesh: AbstractMesh, 
    options: PhysicsImpostorParameters
  ): AbstractMesh {
    mesh.physicsImpostor = new PhysicsImpostor(
      mesh,
      PhysicsImpostor.ConvexHullImpostor,
      options,
      this.scene
    );
    
    if (this.config.debug) {
      this.createDebugMesh(mesh);
    }
    
    return mesh;
  }
  
  /**
   * Creates a heightfield collider
   * @param mesh - The mesh to add the collider to
   * @param options - Physics impostor parameters
   * @returns The mesh with the collider
   */
  public createHeightfieldCollider(
    mesh: AbstractMesh, 
    options: PhysicsImpostorParameters
  ): AbstractMesh {
    mesh.physicsImpostor = new PhysicsImpostor(
      mesh,
      PhysicsImpostor.HeightmapImpostor,
      options,
      this.scene
    );
    
    if (this.config.debug) {
      this.createDebugMesh(mesh);
    }
    
    return mesh;
  }
  
  /**
   * Creates a debug visualization mesh for a physics impostor
   * @param mesh - The mesh with the physics impostor
   */
  private createDebugMesh(mesh: AbstractMesh): void {
    if (!mesh.physicsImpostor) return;
    
    let debugMesh: Mesh | null = null;
    
    switch (mesh.physicsImpostor.type) {
      case PhysicsImpostor.BoxImpostor:
        debugMesh = Mesh.CreateBox(
          `${mesh.name}_debug`,
          1,
          this.scene
        );
        debugMesh.scaling = mesh.scaling.clone();
        break;
        
      case PhysicsImpostor.SphereImpostor:
        debugMesh = Mesh.CreateSphere(
          `${mesh.name}_debug`,
          16,
          1,
          this.scene
        );
        debugMesh.scaling = mesh.scaling.clone();
        break;
        
      case PhysicsImpostor.CapsuleImpostor:
        debugMesh = Mesh.CreateCapsule(
          `${mesh.name}_debug`,
          {
            height: 2,
            radius: 0.5,
            tessellation: 16,
            subdivisions: 1
          },
          this.scene
        );
        debugMesh.scaling = mesh.scaling.clone();
        break;
        
      default:
        // For complex shapes, just create a bounding box
        const boundingInfo = mesh.getBoundingInfo();
        const dimensions = boundingInfo.boundingBox.extendSize.scale(2);
        debugMesh = Mesh.CreateBox(
          `${mesh.name}_debug`,
          1,
          this.scene
        );
        debugMesh.scaling = dimensions;
        break;
    }
    
    if (debugMesh) {
      // Make the debug mesh wireframe and semi-transparent
      debugMesh.material = this.scene.getMaterialByName('physicsDebugMaterial') || 
        (() => {
          const debugMaterial = new StandardMaterial('debugMaterial', this.scene);
          debugMaterial.wireframe = true;
          debugMaterial.alpha = 0.3;
          debugMaterial.diffuseColor = new Color3(1, 0, 0);
          return debugMaterial;
        })();
      
      // Link the debug mesh to the original
      debugMesh.parent = mesh;
      debugMesh.position = Vector3.Zero();
      
      // Store for later cleanup
      this.debugMeshes.set(mesh, debugMesh);
    }
  }
  
  /**
   * Adds a collision callback between two impostors
   * @param mesh1 - First mesh
   * @param mesh2 - Second mesh
   * @param callback - Function to call on collision
   */
  public addCollisionCallback(
    mesh1: AbstractMesh,
    mesh2: AbstractMesh,
    callback: (collider: PhysicsImpostor, collidedWith: PhysicsImpostor) => void
  ): void {
    if (!mesh1.physicsImpostor || !mesh2.physicsImpostor) {
      console.warn('Cannot add collision callback: one or both meshes have no physics impostor');
      return;
    }
    
    mesh1.physicsImpostor.registerOnPhysicsCollide(mesh2.physicsImpostor, callback);
  }
  
  /**
   * Applies an impulse to a mesh
   * @param mesh - The mesh to apply the impulse to
   * @param direction - Direction of the impulse
   * @param amount - Strength of the impulse
   */
  public applyImpulse(mesh: AbstractMesh, direction: Vector3, amount: number): void {
    if (!mesh.physicsImpostor) {
      console.warn('Cannot apply impulse: mesh has no physics impostor');
      return;
    }
    
    const impulseDirection = direction.normalize().scale(amount);
    mesh.physicsImpostor.applyImpulse(impulseDirection, mesh.getAbsolutePosition());
  }
  
  /**
   * Applies a force to a mesh
   * @param mesh - The mesh to apply the force to
   * @param direction - Direction of the force
   * @param amount - Strength of the force
   */
  public applyForce(mesh: AbstractMesh, direction: Vector3, amount: number): void {
    if (!mesh.physicsImpostor) {
      console.warn('Cannot apply force: mesh has no physics impostor');
      return;
    }
    
    const forceDirection = direction.normalize().scale(amount);
    mesh.physicsImpostor.applyForce(forceDirection, mesh.getAbsolutePosition());
  }
  
  /**
   * Sets the linear velocity of a mesh
   * @param mesh - The mesh to set velocity for
   * @param velocity - The velocity vector
   */
  public setLinearVelocity(mesh: AbstractMesh, velocity: Vector3): void {
    if (!mesh.physicsImpostor) {
      console.warn('Cannot set velocity: mesh has no physics impostor');
      return;
    }
    
    mesh.physicsImpostor.setLinearVelocity(velocity);
  }
  
  /**
   * Gets the linear velocity of a mesh
   * @param mesh - The mesh to get velocity from
   * @returns The velocity vector
   */
  public getLinearVelocity(mesh: AbstractMesh): Vector3 | null {
    if (!mesh.physicsImpostor) {
      console.warn('Cannot get velocity: mesh has no physics impostor');
      return null;
    }
    
    return mesh.physicsImpostor.getLinearVelocity();
  }
  
  /**
   * Sets the angular velocity of a mesh
   * @param mesh - The mesh to set angular velocity for
   * @param velocity - The angular velocity vector
   */
  public setAngularVelocity(mesh: AbstractMesh, velocity: Vector3): void {
    if (!mesh.physicsImpostor) {
      console.warn('Cannot set angular velocity: mesh has no physics impostor');
      return;
    }
    
    mesh.physicsImpostor.setAngularVelocity(velocity);
  }
  
  /**
   * Gets the angular velocity of a mesh
   * @param mesh - The mesh to get angular velocity from
   * @returns The angular velocity vector
   */
  public getAngularVelocity(mesh: AbstractMesh): Vector3 | null {
    if (!mesh.physicsImpostor) {
      console.warn('Cannot get angular velocity: mesh has no physics impostor');
      return null;
    }
    
    return mesh.physicsImpostor.getAngularVelocity();
  }
  
  /**
   * Sets the gravity of the physics world
   * @param gravity - The gravity vector
   */
  public setGravity(gravity: Vector3): void {
    if (!this.physicsPlugin) {
      console.warn('Cannot set gravity: physics not initialized');
      return;
    }
    
    // Update gravity in the physics engine
    if (this.scene.getPhysicsEngine()) {
      this.scene.getPhysicsEngine()!.setGravity(gravity);
    }
    this.config.gravity = gravity;
  }
  
  /**
   * Gets the current gravity vector
   * @returns The gravity vector
   */
  public getGravity(): Vector3 {
    return this.config.gravity.clone();
  }
  
  /**
   * Enables or disables debug visualization
   * @param enable - Whether to enable debug visualization
   */
  public setDebugMode(enable: boolean): void {
    if (this.config.debug === enable) return;
    
    this.config.debug = enable;
    
    if (enable) {
      // Create debug meshes for existing impostors
      this.scene.meshes.forEach(mesh => {
        if (mesh.physicsImpostor && !this.debugMeshes.has(mesh)) {
          this.createDebugMesh(mesh);
        }
      });
    } else {
      // Remove all debug meshes
      this.debugMeshes.forEach((debugMesh, mesh) => {
        debugMesh.dispose();
      });
      this.debugMeshes.clear();
    }
  }
  
  /**
   * Performs a raycast in the physics world
   * @param from - Start position
   * @param to - End position
   * @returns Hit result or null if no hit
   */
  public raycast(from: Vector3, to: Vector3): PhysicsRaycastResult | null {
    if (!this.physicsPlugin) {
      console.warn('Cannot raycast: physics not initialized');
      return null;
    }
    
    const ray = new Ray(from, to.subtract(from).normalize(), Vector3.Distance(from, to));
    const hit = this.scene.pickWithRay(ray, (mesh) => {
      return mesh.physicsImpostor !== null;
    });
    
    if (!hit || !hit.hit) return null;
    
    return {
      hit: true,
      distance: hit.distance,
      point: hit.pickedPoint || to,
      normal: hit.getNormal(true) || Vector3.Up(),
      mesh: hit.pickedMesh || null
    };
  }
  
  /**
   * Disposes the physics system and resources
   */
  public dispose(): void {
    // Dispose debug meshes
    this.debugMeshes.forEach((debugMesh) => {
      debugMesh.dispose();
    });
    this.debugMeshes.clear();
    
    // Physics plugin is disposed automatically when the scene is disposed
  }
}

/**
 * Result of a physics raycast
 */
export interface PhysicsRaycastResult {
  hit: boolean;
  distance: number;
  point: Vector3;
  normal: Vector3;
  mesh: AbstractMesh | null;
}
