import { Scene, PhysicsImpostor, Vector3, AbstractMesh, Mesh, TransformNode } from '@babylonjs/core';

/**
 * Configuration for physics optimization
 */
export interface PhysicsOptimizerConfig {
  /** Distance at which to disable physics simulation */
  sleepDistance: number;
  /** Distance at which to use simplified physics */
  simplifiedDistance: number;
  /** How frequently to update physics states (in milliseconds) */
  updateFrequency: number;
  /** Whether to use simplified collision meshes */
  useSimplifiedCollision: boolean;
  /** Whether to throttle physics calculations for distant objects */
  throttleDistantPhysics: boolean;
  /** Maximum number of active physics objects */
  maxActivePhysics: number;
}

/**
 * Physics object state
 */
enum PhysicsState {
  ACTIVE,
  SIMPLIFIED,
  SLEEPING
}

/**
 * Managed physics object
 */
interface ManagedPhysicsObject {
  /** The mesh with physics impostor */
  mesh: AbstractMesh;
  /** Original physics impostor type */
  originalImpostorType: number;
  /** Original mass */
  originalMass: number;
  /** Original restitution */
  originalRestitution: number;
  /** Original friction */
  originalFriction: number;
  /** Current physics state */
  state: PhysicsState;
  /** Simplified collision mesh (if created) */
  simplifiedCollisionMesh?: Mesh;
  /** Whether this object is critical (never sleeps) */
  isCritical: boolean;
  /** Last distance to player */
  lastDistance: number;
}

/**
 * PhysicsOptimizer improves performance by managing physics calculations
 * Implements efficient physics strategies for browser-based game performance
 */
export class PhysicsOptimizer {
  private scene: Scene;
  private config: PhysicsOptimizerConfig;
  private managedObjects: Map<string, ManagedPhysicsObject> = new Map();
  private updateInterval: number | null = null;
  private playerPosition: Vector3;
  private activationQueue: string[] = [];
  private deactivationQueue: string[] = [];
  
  /**
   * Creates a new PhysicsOptimizer
   * @param scene - The Babylon.js scene
   * @param config - Configuration for physics optimization
   */
  constructor(
    scene: Scene,
    config: PhysicsOptimizerConfig = {
      sleepDistance: 50,
      simplifiedDistance: 20,
      updateFrequency: 500,
      useSimplifiedCollision: true,
      throttleDistantPhysics: true,
      maxActivePhysics: 50
    }
  ) {
    this.scene = scene;
    this.config = config;
    this.playerPosition = Vector3.Zero();
  }
  
  /**
   * Starts the physics optimizer
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
    
    console.log('Physics optimizer started');
  }
  
  /**
   * Stops the physics optimizer
   */
  public stop(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    console.log('Physics optimizer stopped');
  }
  
  /**
   * Updates the player position for distance calculations
   * @param position - New player position
   */
  public updatePlayerPosition(position: Vector3): void {
    this.playerPosition = position;
  }
  
  /**
   * Registers a physics object for optimization
   * @param mesh - The mesh with physics impostor
   * @param isCritical - Whether this object is critical and should never sleep
   */
  public registerPhysicsObject(mesh: AbstractMesh, isCritical: boolean = false): void {
    // Skip if mesh has no impostor
    if (!mesh.physicsImpostor) {
      console.warn(`Cannot register mesh ${mesh.name} without physics impostor`);
      return;
    }
    
    // Skip if already registered
    if (this.managedObjects.has(mesh.id)) {
      return;
    }
    
    // Store original physics properties
    const physicsObject: ManagedPhysicsObject = {
      mesh,
      originalImpostorType: mesh.physicsImpostor.type,
      originalMass: mesh.physicsImpostor.getParam('mass'),
      originalRestitution: mesh.physicsImpostor.getParam('restitution'),
      originalFriction: mesh.physicsImpostor.getParam('friction'),
      state: PhysicsState.ACTIVE,
      isCritical,
      lastDistance: Vector3.Distance(mesh.position, this.playerPosition)
    };
    
    // Create simplified collision mesh if enabled
    if (this.config.useSimplifiedCollision && mesh instanceof Mesh) {
      physicsObject.simplifiedCollisionMesh = this.createSimplifiedCollisionMesh(mesh);
    }
    
    // Store the physics object
    this.managedObjects.set(mesh.id, physicsObject);
    
    // Initial state update based on distance
    this.updateObjectState(physicsObject);
  }
  
  /**
   * Unregisters a physics object
   * @param meshId - The ID of the mesh to unregister
   * @param restoreOriginal - Whether to restore original physics properties
   */
  public unregisterPhysicsObject(meshId: string, restoreOriginal: boolean = true): void {
    const physicsObject = this.managedObjects.get(meshId);
    if (!physicsObject) return;
    
    // Restore original physics if requested
    if (restoreOriginal) {
      this.setActivePhysics(physicsObject);
    }
    
    // Dispose simplified collision mesh if it exists
    if (physicsObject.simplifiedCollisionMesh) {
      physicsObject.simplifiedCollisionMesh.dispose();
    }
    
    // Remove from queues if present
    this.activationQueue = this.activationQueue.filter(id => id !== meshId);
    this.deactivationQueue = this.deactivationQueue.filter(id => id !== meshId);
    
    // Remove from managed objects
    this.managedObjects.delete(meshId);
  }
  
  /**
   * Updates physics states based on distance to player
   */
  private update(): void {
    // Process activation queue
    while (this.activationQueue.length > 0 && 
           this.getActivePhysicsCount() < this.config.maxActivePhysics) {
      const meshId = this.activationQueue.shift();
      if (meshId) {
        const physicsObject = this.managedObjects.get(meshId);
        if (physicsObject) {
          this.setActivePhysics(physicsObject);
        }
      }
    }
    
    // Process deactivation queue
    while (this.deactivationQueue.length > 0) {
      const meshId = this.deactivationQueue.shift();
      if (meshId) {
        const physicsObject = this.managedObjects.get(meshId);
        if (physicsObject) {
          this.setSleepingPhysics(physicsObject);
        }
      }
    }
    
    // Update distances and states for all objects
    this.managedObjects.forEach(physicsObject => {
      // Skip if mesh is disposed
      if (!physicsObject.mesh || !physicsObject.mesh.physicsImpostor) return;
      
      // Calculate distance to player
      const distance = Vector3.Distance(physicsObject.mesh.position, this.playerPosition);
      physicsObject.lastDistance = distance;
      
      // Update state based on distance
      this.updateObjectState(physicsObject);
    });
  }
  
  /**
   * Updates the physics state of an object based on distance
   * @param physicsObject - The physics object to update
   */
  private updateObjectState(physicsObject: ManagedPhysicsObject): void {
    // Skip if critical (always active)
    if (physicsObject.isCritical) {
      if (physicsObject.state !== PhysicsState.ACTIVE) {
        this.setActivePhysics(physicsObject);
      }
      return;
    }
    
    const distance = physicsObject.lastDistance;
    
    // Determine target state based on distance
    let targetState: PhysicsState;
    
    if (distance <= this.config.simplifiedDistance) {
      targetState = PhysicsState.ACTIVE;
    } else if (distance <= this.config.sleepDistance) {
      targetState = PhysicsState.SIMPLIFIED;
    } else {
      targetState = PhysicsState.SLEEPING;
    }
    
    // Skip if already in target state
    if (physicsObject.state === targetState) return;
    
    // Apply state change
    switch (targetState) {
      case PhysicsState.ACTIVE:
        // Add to activation queue if not already active
        if (physicsObject.state !== PhysicsState.ACTIVE) {
          if (!this.activationQueue.includes(physicsObject.mesh.id)) {
            this.activationQueue.push(physicsObject.mesh.id);
          }
        }
        break;
        
      case PhysicsState.SIMPLIFIED:
        this.setSimplifiedPhysics(physicsObject);
        break;
        
      case PhysicsState.SLEEPING:
        // Add to deactivation queue if not already sleeping
        if (physicsObject.state !== PhysicsState.SLEEPING) {
          if (!this.deactivationQueue.includes(physicsObject.mesh.id)) {
            this.deactivationQueue.push(physicsObject.mesh.id);
          }
        }
        break;
    }
  }
  
  /**
   * Sets a physics object to active state
   * @param physicsObject - The physics object to activate
   */
  private setActivePhysics(physicsObject: ManagedPhysicsObject): void {
    const mesh = physicsObject.mesh;
    
    // Skip if mesh is disposed or has no impostor
    if (!mesh || !mesh.physicsImpostor) return;
    
    // Restore original physics properties
    mesh.physicsImpostor.setParam('mass', physicsObject.originalMass);
    mesh.physicsImpostor.setParam('restitution', physicsObject.originalRestitution);
    mesh.physicsImpostor.setParam('friction', physicsObject.originalFriction);
    
    // Wake up the impostor
    mesh.physicsImpostor.wakeUp();
    
    // Use original mesh for collision if simplified mesh exists
    if (physicsObject.simplifiedCollisionMesh && 
        mesh.physicsImpostor.object !== mesh) {
      // Recreate impostor on original mesh
      const type = physicsObject.originalImpostorType;
      const mass = physicsObject.originalMass;
      const friction = physicsObject.originalFriction;
      const restitution = physicsObject.originalRestitution;
      
      // Dispose current impostor
      mesh.physicsImpostor.dispose();
      
      // Create new impostor
      mesh.physicsImpostor = new PhysicsImpostor(
        mesh,
        type,
        { mass, friction, restitution },
        this.scene
      );
    }
    
    // Update state
    physicsObject.state = PhysicsState.ACTIVE;
  }
  
  /**
   * Sets a physics object to simplified state
   * @param physicsObject - The physics object to simplify
   */
  private setSimplifiedPhysics(physicsObject: ManagedPhysicsObject): void {
    const mesh = physicsObject.mesh;
    
    // Skip if mesh is disposed or has no impostor
    if (!mesh || !mesh.physicsImpostor) return;
    
    // If using simplified collision mesh and it exists
    if (this.config.useSimplifiedCollision && 
        physicsObject.simplifiedCollisionMesh &&
        mesh.physicsImpostor.object === mesh) {
      
      // Store current physics state
      const currentLinearVelocity = mesh.physicsImpostor.getLinearVelocity() || Vector3.Zero();
      const currentAngularVelocity = mesh.physicsImpostor.getAngularVelocity() || Vector3.Zero();
      
      // Get simplified mesh
      const simplifiedMesh = physicsObject.simplifiedCollisionMesh;
      
      // Update simplified mesh position and rotation
      simplifiedMesh.position = mesh.position.clone();
      simplifiedMesh.rotationQuaternion = mesh.rotationQuaternion ? 
        mesh.rotationQuaternion.clone() : null;
      simplifiedMesh.rotation = mesh.rotation.clone();
      
      // Dispose current impostor
      mesh.physicsImpostor.dispose();
      
      // Create new impostor on simplified mesh
      simplifiedMesh.physicsImpostor = new PhysicsImpostor(
        simplifiedMesh,
        physicsObject.originalImpostorType,
        {
          mass: physicsObject.originalMass,
          friction: physicsObject.originalFriction,
          restitution: physicsObject.originalRestitution
        },
        this.scene
      );
      
      // Transfer velocities
      simplifiedMesh.physicsImpostor.setLinearVelocity(currentLinearVelocity);
      simplifiedMesh.physicsImpostor.setAngularVelocity(currentAngularVelocity);
      
      // Link simplified mesh impostor to original mesh
      mesh.physicsImpostor = simplifiedMesh.physicsImpostor;
      
      // Set up position sync
      const observer = this.scene.onBeforeRenderObservable.add(() => {
        if (mesh && simplifiedMesh && simplifiedMesh.physicsImpostor) {
          mesh.position = simplifiedMesh.position.clone();
          if (simplifiedMesh.rotationQuaternion && mesh.rotationQuaternion) {
            mesh.rotationQuaternion = simplifiedMesh.rotationQuaternion.clone();
          } else {
            mesh.rotation = simplifiedMesh.rotation.clone();
          }
        } else {
          // Clean up if either mesh is disposed
          this.scene.onBeforeRenderObservable.remove(observer);
        }
      });
      
      // Store observer for cleanup
      (physicsObject as any)._syncObserver = observer;
    } 
    // If not using simplified collision or it doesn't exist
    else {
      // Reduce physics fidelity
      if (this.config.throttleDistantPhysics) {
        // Increase mass to reduce physics calculations
        mesh.physicsImpostor.setParam('mass', physicsObject.originalMass * 1.5);
        
        // Reduce restitution and friction
        mesh.physicsImpostor.setParam('restitution', physicsObject.originalRestitution * 0.5);
        mesh.physicsImpostor.setParam('friction', physicsObject.originalFriction * 0.5);
      }
    }
    
    // Update state
    physicsObject.state = PhysicsState.SIMPLIFIED;
  }
  
  /**
   * Sets a physics object to sleeping state
   * @param physicsObject - The physics object to put to sleep
   */
  private setSleepingPhysics(physicsObject: ManagedPhysicsObject): void {
    const mesh = physicsObject.mesh;
    
    // Skip if mesh is disposed or has no impostor
    if (!mesh || !mesh.physicsImpostor) return;
    
    // Put the impostor to sleep
    mesh.physicsImpostor.sleep();
    
    // Clean up sync observer if it exists
    if ((physicsObject as any)._syncObserver) {
      this.scene.onBeforeRenderObservable.remove((physicsObject as any)._syncObserver);
      (physicsObject as any)._syncObserver = null;
    }
    
    // If using simplified collision, restore original mesh impostor
    if (this.config.useSimplifiedCollision && 
        physicsObject.simplifiedCollisionMesh &&
        mesh.physicsImpostor.object !== mesh) {
      
      // Store position and rotation
      const position = mesh.position.clone();
      const rotation = mesh.rotation.clone();
      const rotationQuaternion = mesh.rotationQuaternion ? 
        mesh.rotationQuaternion.clone() : null;
      
      // Dispose current impostor
      mesh.physicsImpostor.dispose();
      
      // Create new sleeping impostor on original mesh
      mesh.physicsImpostor = new PhysicsImpostor(
        mesh,
        physicsObject.originalImpostorType,
        {
          mass: physicsObject.originalMass,
          friction: physicsObject.originalFriction,
          restitution: physicsObject.originalRestitution
        },
        this.scene
      );
      
      // Restore position and rotation
      mesh.position = position;
      mesh.rotation = rotation;
      if (rotationQuaternion) {
        mesh.rotationQuaternion = rotationQuaternion;
      }
      
      // Put to sleep
      mesh.physicsImpostor.sleep();
    }
    
    // Update state
    physicsObject.state = PhysicsState.SLEEPING;
  }
  
  /**
   * Creates a simplified collision mesh for physics
   * @param originalMesh - The original mesh
   * @returns The simplified collision mesh
   */
  private createSimplifiedCollisionMesh(originalMesh: Mesh): Mesh {
    // Create a simplified collision box
    const boundingInfo = originalMesh.getBoundingInfo();
    const dimensions = boundingInfo.boundingBox.extendSize.scale(2);
    
    // Create box with dimensions of the original mesh
    const collisionMesh = MeshBuilder.CreateBox(
      `${originalMesh.name}_collision`,
      { width: dimensions.x, height: dimensions.y, depth: dimensions.z },
      this.scene
    );
    
    // Position at same place as original
    collisionMesh.position = originalMesh.position.clone();
    if (originalMesh.rotationQuaternion) {
      collisionMesh.rotationQuaternion = originalMesh.rotationQuaternion.clone();
    } else {
      collisionMesh.rotation = originalMesh.rotation.clone();
    }
    
    // Make invisible
    collisionMesh.isVisible = false;
    
    // Exclude from picking
    collisionMesh.isPickable = false;
    
    return collisionMesh;
  }
  
  /**
   * Gets the number of active physics objects
   * @returns The count of active physics objects
   */
  private getActivePhysicsCount(): number {
    let count = 0;
    this.managedObjects.forEach(obj => {
      if (obj.state === PhysicsState.ACTIVE) {
        count++;
      }
    });
    return count;
  }
  
  /**
   * Forces a physics object to be active regardless of distance
   * @param meshId - The ID of the mesh to activate
   * @param duration - Duration in milliseconds to keep active, or 0 for indefinite
   */
  public forceActivatePhysics(meshId: string, duration: number = 0): void {
    const physicsObject = this.managedObjects.get(meshId);
    if (!physicsObject) return;
    
    // Activate physics
    this.setActivePhysics(physicsObject);
    
    // Set as critical temporarily
    const wasAlreadyCritical = physicsObject.isCritical;
    physicsObject.isCritical = true;
    
    // Reset after duration if specified
    if (duration > 0) {
      setTimeout(() => {
        if (this.managedObjects.has(meshId)) {
          this.managedObjects.get(meshId)!.isCritical = wasAlreadyCritical;
        }
      }, duration);
    }
  }
  
  /**
   * Gets statistics about the physics optimizer
   * @returns Object with statistics
   */
  public getStats(): {
    totalObjects: number;
    activeObjects: number;
    simplifiedObjects: number;
    sleepingObjects: number;
    activationQueueLength: number;
    deactivationQueueLength: number;
  } {
    let activeCount = 0;
    let simplifiedCount = 0;
    let sleepingCount = 0;
    
    this.managedObjects.forEach(obj => {
      switch (obj.state) {
        case PhysicsState.ACTIVE:
          activeCount++;
          break;
        case PhysicsState.SIMPLIFIED:
          simplifiedCount++;
          break;
        case PhysicsState.SLEEPING:
          sleepingCount++;
          break;
      }
    });
    
    return {
      totalObjects: this.managedObjects.size,
      activeObjects: activeCount,
      simplifiedObjects: simplifiedCount,
      sleepingObjects: sleepingCount,
      activationQueueLength: this.activationQueue.length,
      deactivationQueueLength: this.deactivationQueue.length
    };
  }
}

// Add missing import to avoid TypeScript error
import { MeshBuilder } from '@babylonjs/core';
