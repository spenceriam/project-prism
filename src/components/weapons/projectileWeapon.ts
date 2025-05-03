import { 
  Scene, 
  Vector3, 
  Mesh, 
  MeshBuilder, 
  StandardMaterial, 
  Color3, 
  PhysicsImpostor,
  ParticleSystem,
  Texture,
  AbstractMesh,
  TransformNode
} from '@babylonjs/core';
import { WeaponBase, WeaponConfig } from './weaponBase';
import { AssetLoader } from '../../utils/loader';
import { PlayerController } from '../player/playerController';
import { SoundSystem, SoundCategory } from '../../core/sound';
import { MathUtils } from '../../utils/math';

/**
 * Projectile weapon configuration
 */
export interface ProjectileWeaponConfig extends WeaponConfig {
  projectileSpeed: number; // Units per second
  projectileGravity: number; // Gravity multiplier (0 = no gravity)
  projectileSize: number; // Size of the projectile
  projectileLifetime: number; // Seconds before projectile despawns
  explosionRadius: number; // Radius of explosion (0 = no explosion)
  explosionForce: number; // Force of explosion
}

/**
 * Projectile data
 */
interface Projectile {
  mesh: Mesh;
  velocity: Vector3;
  lifetime: number;
  explosionRadius: number;
  explosionForce: number;
  damage: number;
}

/**
 * ProjectileWeapon implements weapons that fire physical projectiles (grenades, rockets, etc.)
 * Uses physics for projectile movement and collision detection
 */
export class ProjectileWeapon extends WeaponBase {
  private config: ProjectileWeaponConfig;
  private projectiles: Projectile[] = [];
  private explosionParticles: ParticleSystem | null = null;
  
  /**
   * Creates a new projectile weapon
   * @param scene - The Babylon.js scene
   * @param config - Weapon configuration
   * @param assetLoader - Asset loader instance
   * @param soundSystem - Sound system instance
   * @param player - Player controller instance
   */
  constructor(
    scene: Scene, 
    config: ProjectileWeaponConfig,
    assetLoader: AssetLoader,
    soundSystem: SoundSystem,
    player: PlayerController
  ) {
    super(scene, config, assetLoader, soundSystem, player);
    this.config = config;
    
    // Create explosion particle system
    if (this.config.explosionRadius > 0) {
      this.createExplosionParticles();
    }
    
    // Set up update loop for projectiles
    this.scene.onBeforeRenderObservable.add(() => {
      const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
      this.updateProjectiles(deltaTime);
    });
  }
  
  /**
   * Creates explosion particle system
   */
  private createExplosionParticles(): void {
    this.explosionParticles = new ParticleSystem('explosionParticles', 1000, this.scene);
    
    // Texture
    this.explosionParticles.particleTexture = new Texture('assets/textures/explosion.png', this.scene);
    
    // Colors
    this.explosionParticles.color1 = new Color3(1, 0.5, 0.1);
    this.explosionParticles.color2 = new Color3(1, 0.2, 0.1);
    this.explosionParticles.colorDead = new Color3(0.1, 0.1, 0.1);
    
    // Size and lifetime
    this.explosionParticles.minSize = 0.3;
    this.explosionParticles.maxSize = 1.5;
    this.explosionParticles.minLifeTime = 0.3;
    this.explosionParticles.maxLifeTime = 1.0;
    
    // Emission
    this.explosionParticles.emitRate = 1000;
    this.explosionParticles.minEmitPower = 1;
    this.explosionParticles.maxEmitPower = 5;
    this.explosionParticles.updateSpeed = 0.01;
    this.explosionParticles.minEmitBox = new Vector3(-0.5, -0.5, -0.5);
    this.explosionParticles.maxEmitBox = new Vector3(0.5, 0.5, 0.5);
    
    // Emission over time
    this.explosionParticles.addSizeGradient(0, 0.1);
    this.explosionParticles.addSizeGradient(0.3, 1.0);
    this.explosionParticles.addSizeGradient(0.7, 0.8);
    this.explosionParticles.addSizeGradient(1.0, 0.0);
    
    // Blendmode
    this.explosionParticles.blendMode = ParticleSystem.BLENDMODE_ADD;
    
    // Stop initially
    this.explosionParticles.stop();
  }
  
  /**
   * Performs the firing logic for a projectile weapon
   */
  protected performFire(): void {
    // Get camera for projectile origin and direction
    const camera = this.player.getCamera();
    const projectileOrigin = this.muzzlePosition.clone();
    
    // Calculate direction with spread
    let projectileDirection = camera.getDirection(Vector3.Forward());
    
    // Apply accuracy and spread
    if (this.config.spread > 0) {
      // Reduce spread when aiming
      const effectiveSpread = this.state.isAiming 
        ? this.config.spread * 0.3 
        : this.config.spread;
      
      // Convert spread from degrees to radians
      const spreadRadians = MathUtils.toRadians(effectiveSpread);
      
      // Apply random spread
      const randomAngleX = (Math.random() - 0.5) * spreadRadians;
      const randomAngleY = (Math.random() - 0.5) * spreadRadians;
      
      // Create rotation quaternion for spread
      const spreadQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(randomAngleX, randomAngleY, 0);
      
      // Apply rotation to direction
      projectileDirection = projectileDirection.rotateByQuaternionToRef(spreadQuaternion, projectileDirection);
    }
    
    // Create projectile velocity
    const projectileVelocity = projectileDirection.scale(this.config.projectileSpeed);
    
    // Create projectile
    this.createProjectile(projectileOrigin, projectileVelocity);
  }
  
  /**
   * Creates a projectile
   * @param position - Starting position
   * @param velocity - Initial velocity
   */
  private createProjectile(position: Vector3, velocity: Vector3): void {
    // Create projectile mesh
    const projectileMesh = MeshBuilder.CreateSphere(
      `projectile_${Date.now()}`,
      { diameter: this.config.projectileSize },
      this.scene
    );
    
    // Position projectile
    projectileMesh.position = position;
    
    // Create material
    const material = new StandardMaterial('projectileMaterial', this.scene);
    material.emissiveColor = new Color3(0.5, 0.5, 0.5);
    projectileMesh.material = material;
    
    // Add physics if available
    if (this.scene.getPhysicsEngine()) {
      projectileMesh.physicsImpostor = new PhysicsImpostor(
        projectileMesh,
        PhysicsImpostor.SphereImpostor,
        { mass: 1, restitution: 0.2, friction: 0.5 },
        this.scene
      );
      
      // Set initial velocity
      projectileMesh.physicsImpostor.setLinearVelocity(velocity);
      
      // Register collision callback
      projectileMesh.physicsImpostor.registerOnPhysicsCollide(
        PhysicsImpostor.BoxImpostor,
        (collider, collidedWith) => {
          this.handleProjectileCollision(projectileMesh);
        }
      );
    }
    
    // Create projectile object
    const projectile: Projectile = {
      mesh: projectileMesh,
      velocity: velocity,
      lifetime: this.config.projectileLifetime,
      explosionRadius: this.config.explosionRadius,
      explosionForce: this.config.explosionForce,
      damage: this.config.damage
    };
    
    // Add to projectiles array
    this.projectiles.push(projectile);
  }
  
  /**
   * Updates all projectiles
   * @param deltaTime - Time since last frame in seconds
   */
  private updateProjectiles(deltaTime: number): void {
    // Update each projectile
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      // Update lifetime
      projectile.lifetime -= deltaTime;
      
      // Check if projectile should be removed
      if (projectile.lifetime <= 0) {
        // Explode if it has an explosion radius
        if (projectile.explosionRadius > 0) {
          this.createExplosion(projectile.mesh.position, projectile.explosionRadius, projectile.explosionForce, projectile.damage);
        }
        
        // Dispose and remove projectile
        this.removeProjectile(i);
        continue;
      }
      
      // If no physics engine, manually update position
      if (!this.scene.getPhysicsEngine()) {
        // Apply gravity
        if (this.config.projectileGravity > 0) {
          projectile.velocity.y -= 9.81 * this.config.projectileGravity * deltaTime;
        }
        
        // Update position
        projectile.mesh.position.addInPlace(projectile.velocity.scale(deltaTime));
        
        // Check for collisions
        const ray = new BABYLON.Ray(
          projectile.mesh.position.subtract(projectile.velocity.scale(deltaTime)),
          projectile.velocity.normalize(),
          projectile.velocity.length() * deltaTime
        );
        
        const hit = this.scene.pickWithRay(ray, (mesh) => {
          return mesh !== projectile.mesh && mesh.isPickable;
        });
        
        if (hit && hit.hit) {
          // Move to hit position
          projectile.mesh.position = hit.pickedPoint!;
          
          // Handle collision
          this.handleProjectileCollision(projectile.mesh);
          
          // Remove projectile
          this.removeProjectile(i);
        }
      }
    }
  }
  
  /**
   * Handles projectile collision
   * @param projectileMesh - The projectile mesh
   */
  private handleProjectileCollision(projectileMesh: Mesh): void {
    // Find the projectile in the array
    const index = this.projectiles.findIndex(p => p.mesh === projectileMesh);
    if (index === -1) return;
    
    const projectile = this.projectiles[index];
    
    // Create explosion if it has an explosion radius
    if (projectile.explosionRadius > 0) {
      this.createExplosion(projectile.mesh.position, projectile.explosionRadius, projectile.explosionForce, projectile.damage);
    }
    
    // Remove the projectile
    this.removeProjectile(index);
  }
  
  /**
   * Creates an explosion at the specified position
   * @param position - Explosion position
   * @param radius - Explosion radius
   * @param force - Explosion force
   * @param damage - Explosion damage
   */
  private createExplosion(position: Vector3, radius: number, force: number, damage: number): void {
    // Show explosion particles
    if (this.explosionParticles) {
      this.explosionParticles.emitter = position;
      
      // Scale particles based on explosion radius
      const scale = radius / 5; // Assuming 5 is a "standard" explosion radius
      this.explosionParticles.minSize = 0.3 * scale;
      this.explosionParticles.maxSize = 1.5 * scale;
      
      // Start particles
      this.explosionParticles.start();
      
      // Stop after a short duration
      setTimeout(() => {
        this.explosionParticles?.stop();
      }, 500);
    }
    
    // Play explosion sound
    // TODO: Add explosion sound
    
    // Find meshes in explosion radius
    const meshesInRadius = this.scene.meshes.filter(mesh => {
      if (!mesh.isPickable || mesh === this.weaponRoot) return false;
      
      const distance = Vector3.Distance(position, mesh.position);
      return distance <= radius;
    });
    
    // Apply damage and force to meshes in radius
    meshesInRadius.forEach(mesh => {
      // Calculate distance factor (1 at center, 0 at edge)
      const distance = Vector3.Distance(position, mesh.position);
      const distanceFactor = 1 - (distance / radius);
      
      // Apply damage if mesh has health component
      const healthComponent = mesh.metadata?.healthComponent;
      if (healthComponent && typeof healthComponent.applyDamage === 'function') {
        const scaledDamage = damage * distanceFactor;
        healthComponent.applyDamage(scaledDamage);
      }
      
      // Apply force if mesh has physics
      if (mesh.physicsImpostor && force > 0) {
        // Calculate direction from explosion to mesh
        const direction = mesh.position.subtract(position).normalize();
        
        // Calculate force based on distance
        const scaledForce = force * distanceFactor;
        
        // Apply impulse
        mesh.physicsImpostor.applyImpulse(direction.scale(scaledForce), mesh.position);
      }
    });
  }
  
  /**
   * Removes a projectile from the scene
   * @param index - Index of the projectile to remove
   */
  private removeProjectile(index: number): void {
    const projectile = this.projectiles[index];
    
    // Dispose physics impostor
    if (projectile.mesh.physicsImpostor) {
      projectile.mesh.physicsImpostor.dispose();
    }
    
    // Dispose mesh
    projectile.mesh.dispose();
    
    // Remove from array
    this.projectiles.splice(index, 1);
  }
  
  /**
   * Updates the weapon
   * @param deltaTime - Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Additional projectile-specific updates can go here
  }
  
  /**
   * Disposes the weapon and resources
   */
  public dispose(): void {
    super.dispose();
    
    // Dispose explosion particles
    if (this.explosionParticles) {
      this.explosionParticles.dispose();
    }
    
    // Dispose all projectiles
    this.projectiles.forEach(projectile => {
      if (projectile.mesh.physicsImpostor) {
        projectile.mesh.physicsImpostor.dispose();
      }
      projectile.mesh.dispose();
    });
    this.projectiles = [];
    
    // Remove from update loop
    this.scene.onBeforeRenderObservable.clear();
  }
}
