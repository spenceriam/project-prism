import { 
  Scene, 
  Vector3, 
  Ray, 
  AbstractMesh, 
  Mesh, 
  MeshBuilder,
  StandardMaterial,
  Color3,
  ParticleSystem,
  Texture
} from '@babylonjs/core';
import { WeaponBase, WeaponConfig } from './weaponBase';
import { AssetLoader } from '../../utils/loader';
import { PlayerController } from '../player/playerController';
import { SoundSystem, SoundCategory } from '../../core/sound';
import { MathUtils } from '../../utils/math';

/**
 * Hitscan weapon configuration
 */
export interface HitscanWeaponConfig extends WeaponConfig {
  spread: number; // Bullet spread in degrees
  penetration: number; // How many objects the bullet can penetrate (0 = none)
  impactForce: number; // Force applied to hit objects
}

/**
 * HitscanWeapon implements weapons that use instant hit detection (pistols, rifles, etc.)
 * Uses raycasting for hit detection and applies damage instantly
 */
export class HitscanWeapon extends WeaponBase {
  private config: HitscanWeaponConfig;
  private impactParticles: ParticleSystem | null = null;
  private bulletTrails: Map<number, Mesh> = new Map();
  private trailCounter: number = 0;
  private trailDuration: number = 0.1; // Seconds
  
  /**
   * Creates a new hitscan weapon
   * @param scene - The Babylon.js scene
   * @param config - Weapon configuration
   * @param assetLoader - Asset loader instance
   * @param soundSystem - Sound system instance
   * @param player - Player controller instance
   */
  constructor(
    scene: Scene, 
    config: HitscanWeaponConfig,
    assetLoader: AssetLoader,
    soundSystem: SoundSystem,
    player: PlayerController
  ) {
    super(scene, config, assetLoader, soundSystem, player);
    this.config = config;
    
    // Create impact particle system
    this.createImpactParticles();
  }
  
  /**
   * Creates impact particle system for bullet hits
   */
  private createImpactParticles(): void {
    this.impactParticles = new ParticleSystem('impactParticles', 100, this.scene);
    
    // Texture
    this.impactParticles.particleTexture = new Texture('assets/textures/impact.png', this.scene);
    
    // Colors
    this.impactParticles.color1 = new Color3(0.8, 0.8, 0.8);
    this.impactParticles.color2 = new Color3(0.5, 0.5, 0.5);
    this.impactParticles.colorDead = new Color3(0.3, 0.3, 0.3);
    
    // Size and lifetime
    this.impactParticles.minSize = 0.05;
    this.impactParticles.maxSize = 0.2;
    this.impactParticles.minLifeTime = 0.1;
    this.impactParticles.maxLifeTime = 0.5;
    
    // Emission
    this.impactParticles.emitRate = 100;
    this.impactParticles.minEmitPower = 0.5;
    this.impactParticles.maxEmitPower = 2;
    this.impactParticles.updateSpeed = 0.01;
    this.impactParticles.minEmitBox = new Vector3(-0.05, -0.05, -0.05);
    this.impactParticles.maxEmitBox = new Vector3(0.05, 0.05, 0.05);
    
    // Stop initially
    this.impactParticles.stop();
  }
  
  /**
   * Performs the firing logic for a hitscan weapon
   */
  protected performFire(): void {
    // Get camera for ray origin and direction
    const camera = this.player.getCamera();
    const rayOrigin = camera.position.clone();
    
    // Calculate spread
    let rayDirection = camera.getDirection(Vector3.Forward());
    
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
      rayDirection = rayDirection.rotateByQuaternionToRef(spreadQuaternion, rayDirection);
    }
    
    // Create ray
    const ray = new Ray(rayOrigin, rayDirection, this.config.range);
    
    // Perform raycast
    const hit = this.scene.pickWithRay(ray, (mesh) => {
      // Don't hit player or weapon
      return mesh !== this.weaponRoot && 
             !mesh.parent?.name?.includes(this.config.name) &&
             mesh.isPickable;
    });
    
    // Create bullet trail
    this.createBulletTrail(rayOrigin, hit && hit.pickedPoint ? hit.pickedPoint : rayOrigin.add(rayDirection.scale(this.config.range)));
    
    // Handle hit
    if (hit && hit.pickedMesh) {
      // Show impact particles
      this.showImpactParticles(hit.pickedPoint!, hit.getNormal(true)!);
      
      // Apply damage to hit object if it has a health component
      const healthComponent = hit.pickedMesh.metadata?.healthComponent;
      if (healthComponent && typeof healthComponent.applyDamage === 'function') {
        healthComponent.applyDamage(this.config.damage);
      }
      
      // Apply physics impulse if the object has a physics impostor
      if (hit.pickedMesh.physicsImpostor && this.config.impactForce > 0) {
        const impulseDirection = rayDirection.scale(this.config.impactForce);
        hit.pickedMesh.physicsImpostor.applyImpulse(impulseDirection, hit.pickedPoint!);
      }
    }
  }
  
  /**
   * Shows impact particles at the hit location
   * @param position - Impact position
   * @param normal - Surface normal at impact
   */
  private showImpactParticles(position: Vector3, normal: Vector3): void {
    if (!this.impactParticles) return;
    
    // Set position
    this.impactParticles.emitter = position;
    
    // Set direction based on surface normal
    this.impactParticles.direction1 = normal.scale(1);
    this.impactParticles.direction2 = normal.scale(1);
    
    // Start particles
    this.impactParticles.start();
    
    // Stop after a short duration
    setTimeout(() => {
      this.impactParticles?.stop();
    }, 100);
  }
  
  /**
   * Creates a visual bullet trail
   * @param start - Start position
   * @param end - End position
   */
  private createBulletTrail(start: Vector3, end: Vector3): void {
    // Calculate trail properties
    const direction = end.subtract(start);
    const distance = direction.length();
    const center = start.add(direction.scale(0.5));
    const trailId = this.trailCounter++;
    
    // Create trail mesh
    const trail = MeshBuilder.CreateCylinder(
      `bulletTrail_${trailId}`,
      {
        height: distance,
        diameter: 0.02,
        tessellation: 4
      },
      this.scene
    );
    
    // Position and rotate trail
    trail.position = center;
    
    // Look at target
    const upVector = new Vector3(0, 1, 0);
    if (Math.abs(Vector3.Dot(direction.normalize(), upVector)) > 0.99) {
      // If direction is parallel to up vector, use a different up vector
      upVector.set(1, 0, 0);
    }
    
    trail.lookAt(end);
    
    // Create material
    const trailMaterial = new StandardMaterial(`bulletTrailMaterial_${trailId}`, this.scene);
    trailMaterial.emissiveColor = new Color3(1, 0.7, 0.3);
    trailMaterial.alpha = 0.7;
    trail.material = trailMaterial;
    
    // Store trail
    this.bulletTrails.set(trailId, trail);
    
    // Remove trail after duration
    setTimeout(() => {
      const trail = this.bulletTrails.get(trailId);
      if (trail) {
        // Fade out
        const fadeInterval = setInterval(() => {
          if (!trail.material || !(trail.material instanceof StandardMaterial)) {
            clearInterval(fadeInterval);
            return;
          }
          
          trail.material.alpha -= 0.1;
          
          if (trail.material.alpha <= 0) {
            clearInterval(fadeInterval);
            trail.dispose();
            this.bulletTrails.delete(trailId);
          }
        }, 16);
      }
    }, this.trailDuration * 1000);
  }
  
  /**
   * Updates the weapon
   * @param deltaTime - Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Additional hitscan-specific updates can go here
  }
  
  /**
   * Disposes the weapon and resources
   */
  public dispose(): void {
    super.dispose();
    
    // Dispose impact particles
    if (this.impactParticles) {
      this.impactParticles.dispose();
    }
    
    // Dispose bullet trails
    this.bulletTrails.forEach(trail => {
      trail.dispose();
    });
    this.bulletTrails.clear();
  }
}
