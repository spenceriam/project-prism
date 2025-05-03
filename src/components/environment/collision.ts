import { Scene, Mesh, Vector3, PhysicsImpostor, AbstractMesh, MeshBuilder } from '@babylonjs/core';

/**
 * CollisionType enum for different types of collision meshes
 */
export enum CollisionType {
  STATIC = 'static',      // Immovable objects (walls, floors)
  DYNAMIC = 'dynamic',    // Movable objects (props, doors)
  TRIGGER = 'trigger'     // Non-solid trigger areas
}

/**
 * Collision mesh configuration
 */
export interface CollisionConfig {
  type: CollisionType;
  mass?: number;          // Mass for dynamic objects (default: 0)
  restitution?: number;   // Bounciness (0-1, default: 0.2)
  friction?: number;      // Friction (0-1, default: 0.3)
  visible?: boolean;      // Whether collision mesh is visible (default: false)
}

/**
 * CollisionSystem handles creation and management of collision meshes for environments
 * Optimizes physics calculations for browser-based gameplay
 */
export class CollisionSystem {
  private scene: Scene;
  private collisionMeshes: Map<string, Mesh> = new Map();

  /**
   * Create a new collision system
   * @param scene - The Babylon.js scene
   */
  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Create a collision mesh for an existing mesh
   * @param mesh - The source mesh to create collision for
   * @param config - Collision configuration
   * @returns The created collision mesh
   */
  public createCollisionMesh(mesh: AbstractMesh, config: CollisionConfig): Mesh {
    // Generate a name for the collision mesh
    const collisionName = `collision_${mesh.name}`;
    
    // Check if collision mesh already exists
    if (this.collisionMeshes.has(collisionName)) {
      return this.collisionMeshes.get(collisionName)!;
    }

    // Create a simplified collision mesh based on the source mesh
    let collisionMesh: Mesh;
    
    // For complex meshes, create a simpler collision shape
    if (mesh.getTotalVertices() > 100) {
      // Create a bounding box as collision mesh
      const boundingInfo = mesh.getBoundingInfo();
      const dimensions = boundingInfo.boundingBox.extendSize.scale(2);
      
      collisionMesh = MeshBuilder.CreateBox(
        collisionName,
        { 
          width: dimensions.x,
          height: dimensions.y,
          depth: dimensions.z
        },
        this.scene
      );
      
      // Position at the center of the source mesh
      collisionMesh.position = mesh.position.clone();
      collisionMesh.rotation = mesh.rotation.clone();
      collisionMesh.scaling = mesh.scaling.clone();
    } else {
      // For simple meshes, clone the mesh for collision
      collisionMesh = mesh.clone(collisionName) as Mesh;
    }
    
    // Set parent to match source mesh
    if (mesh.parent) {
      collisionMesh.parent = mesh.parent;
    }
    
    // Configure visibility
    collisionMesh.isVisible = config.visible ?? false;
    
    // Set up physics impostor based on collision type
    switch (config.type) {
      case CollisionType.STATIC:
        collisionMesh.physicsImpostor = new PhysicsImpostor(
          collisionMesh,
          PhysicsImpostor.BoxImpostor,
          { 
            mass: 0, 
            restitution: config.restitution ?? 0.2,
            friction: config.friction ?? 0.3
          },
          this.scene
        );
        break;
        
      case CollisionType.DYNAMIC:
        collisionMesh.physicsImpostor = new PhysicsImpostor(
          collisionMesh,
          PhysicsImpostor.BoxImpostor,
          { 
            mass: config.mass ?? 1, 
            restitution: config.restitution ?? 0.2,
            friction: config.friction ?? 0.3
          },
          this.scene
        );
        break;
        
      case CollisionType.TRIGGER:
        // For triggers, we use a mesh with no impostor
        // but we'll tag it for detection via raycast or intersection tests
        collisionMesh.isPickable = true;
        collisionMesh.metadata = { isTrigger: true };
        break;
    }
    
    // Store the collision mesh
    this.collisionMeshes.set(collisionName, collisionMesh);
    
    return collisionMesh;
  }

  /**
   * Create a simple collision box
   * @param name - Name for the collision box
   * @param position - Position of the box
   * @param size - Size of the box (width, height, depth)
   * @param config - Collision configuration
   * @returns The created collision mesh
   */
  public createCollisionBox(
    name: string,
    position: Vector3,
    size: Vector3,
    config: CollisionConfig
  ): Mesh {
    const collisionName = `collision_${name}`;
    
    // Check if collision mesh already exists
    if (this.collisionMeshes.has(collisionName)) {
      return this.collisionMeshes.get(collisionName)!;
    }
    
    // Create a box mesh for collision
    const collisionMesh = MeshBuilder.CreateBox(
      collisionName,
      { 
        width: size.x,
        height: size.y,
        depth: size.z
      },
      this.scene
    );
    
    // Set position
    collisionMesh.position = position;
    
    // Configure visibility
    collisionMesh.isVisible = config.visible ?? false;
    
    // Set up physics impostor based on collision type
    switch (config.type) {
      case CollisionType.STATIC:
        collisionMesh.physicsImpostor = new PhysicsImpostor(
          collisionMesh,
          PhysicsImpostor.BoxImpostor,
          { 
            mass: 0, 
            restitution: config.restitution ?? 0.2,
            friction: config.friction ?? 0.3
          },
          this.scene
        );
        break;
        
      case CollisionType.DYNAMIC:
        collisionMesh.physicsImpostor = new PhysicsImpostor(
          collisionMesh,
          PhysicsImpostor.BoxImpostor,
          { 
            mass: config.mass ?? 1, 
            restitution: config.restitution ?? 0.2,
            friction: config.friction ?? 0.3
          },
          this.scene
        );
        break;
        
      case CollisionType.TRIGGER:
        // For triggers, we use a mesh with no impostor
        collisionMesh.isPickable = true;
        collisionMesh.metadata = { isTrigger: true };
        break;
    }
    
    // Store the collision mesh
    this.collisionMeshes.set(collisionName, collisionMesh);
    
    return collisionMesh;
  }

  /**
   * Get a collision mesh by name
   * @param name - Name of the source mesh
   * @returns The collision mesh or undefined if not found
   */
  public getCollisionMesh(name: string): Mesh | undefined {
    return this.collisionMeshes.get(`collision_${name}`);
  }

  /**
   * Check if a point is inside a trigger volume
   * @param point - The point to check
   * @param triggerName - Name of the trigger mesh
   * @returns True if the point is inside the trigger
   */
  public isPointInTrigger(point: Vector3, triggerName: string): boolean {
    const triggerMesh = this.getCollisionMesh(triggerName);
    
    if (!triggerMesh || !triggerMesh.metadata?.isTrigger) {
      return false;
    }
    
    return triggerMesh.intersectsPoint(point);
  }

  /**
   * Dispose of a collision mesh
   * @param name - Name of the source mesh
   */
  public disposeCollisionMesh(name: string): void {
    const collisionName = `collision_${name}`;
    const collisionMesh = this.collisionMeshes.get(collisionName);
    
    if (collisionMesh) {
      if (collisionMesh.physicsImpostor) {
        collisionMesh.physicsImpostor.dispose();
      }
      
      collisionMesh.dispose();
      this.collisionMeshes.delete(collisionName);
    }
  }

  /**
   * Dispose of all collision meshes
   */
  public disposeAll(): void {
    this.collisionMeshes.forEach(mesh => {
      if (mesh.physicsImpostor) {
        mesh.physicsImpostor.dispose();
      }
      
      mesh.dispose();
    });
    
    this.collisionMeshes.clear();
  }
}
