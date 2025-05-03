import { 
  Scene, 
  Vector3, 
  Mesh, 
  MeshBuilder,
  Ray,
  RayHelper,
  Color3,
  Path3D,
  PickingInfo
} from '@babylonjs/core';
import { EnemyBase, EnemyConfig, EnemyState } from './enemyBase';
import { AssetLoader } from '../../utils/loader';
import { SoundSystem } from '../../core/sound';
import { PlayerController } from '../player/playerController';
import { MathUtils } from '../../utils/math';

/**
 * Configuration for patrol paths
 */
export interface PatrolPathConfig {
  points: Vector3[];
  waitTime: number; // Time to wait at each point in seconds
}

/**
 * StandardGuard represents the basic enemy type in the game
 * Implements patrol behavior, basic perception, and combat
 */
export class StandardGuard extends EnemyBase {
  // Player reference for detection
  private player: PlayerController;
  
  // Patrol path configuration
  private patrolPath: PatrolPathConfig | null = null;
  private currentPatrolIndex: number = 0;
  private waitTimeRemaining: number = 0;
  private path3D: Path3D | null = null;
  
  // Search behavior
  private searchStartPosition: Vector3 | null = null;
  private searchRadius: number = 5;
  private searchTime: number = 0;
  private maxSearchTime: number = 30; // Seconds
  
  // Perception
  private canSeePlayer: boolean = false;
  private playerDetectionRay: Ray;
  private playerDetectionHelper: RayHelper | null = null;
  private lastPlayerDetectionTime: number = 0;
  private detectionCooldown: number = 0.5; // Seconds between detection checks
  
  // Combat
  private attackCooldown: number = 0;
  
  /**
   * Creates a new StandardGuard enemy
   * @param scene - The Babylon.js scene
   * @param spawnPosition - Initial spawn position
   * @param config - Enemy configuration
   * @param assetLoader - Asset loader instance
   * @param soundSystem - Sound system instance
   * @param player - Player controller reference
   * @param patrolPath - Optional patrol path configuration
   */
  constructor(
    scene: Scene,
    spawnPosition: Vector3,
    config: EnemyConfig,
    assetLoader: AssetLoader,
    soundSystem: SoundSystem,
    player: PlayerController,
    patrolPath?: PatrolPathConfig
  ) {
    super(scene, spawnPosition, config, assetLoader, soundSystem);
    
    this.player = player;
    
    // Set up patrol path if provided
    if (patrolPath) {
      this.setPatrolPath(patrolPath);
    }
    
    // Create player detection ray
    this.playerDetectionRay = new Ray(Vector3.Zero(), Vector3.Forward(), this.config.detectionRange);
    
    // Set up debug ray if debug mode is enabled
    const debugMode = false; // Set to true to enable debug visualization
    if (debugMode) {
      this.playerDetectionHelper = new RayHelper(this.playerDetectionRay);
      this.playerDetectionHelper.show(this.scene, new Color3(1, 0, 0));
    }
  }
  
  /**
   * Sets a patrol path for the guard
   * @param patrolPath - Patrol path configuration
   */
  public setPatrolPath(patrolPath: PatrolPathConfig): void {
    this.patrolPath = patrolPath;
    
    // Create a Path3D for smooth movement along the path
    if (patrolPath.points.length > 1) {
      this.path3D = new Path3D(patrolPath.points);
    } else {
      this.path3D = null;
    }
    
    this.currentPatrolIndex = 0;
    this.waitTimeRemaining = 0;
    
    // Set initial target position
    if (patrolPath.points.length > 0) {
      this.targetPosition = patrolPath.points[0].clone();
    }
  }
  
  /**
   * Updates the enemy's perception of the environment
   * @param deltaTime - Time since last frame in seconds
   */
  protected updatePerception(deltaTime: number): void {
    // Only check for player detection periodically to improve performance
    this.lastPlayerDetectionTime += deltaTime;
    if (this.lastPlayerDetectionTime < this.detectionCooldown) {
      return;
    }
    
    this.lastPlayerDetectionTime = 0;
    this.canSeePlayer = false;
    
    // Get player position
    const playerPosition = this.player.getPosition();
    if (!playerPosition) return;
    
    // Calculate distance to player
    const distanceToPlayer = Vector3.Distance(this.enemyRoot.position, playerPosition);
    
    // Check if player is within detection range
    if (distanceToPlayer <= this.config.detectionRange) {
      // Calculate direction to player
      const directionToPlayer = playerPosition.subtract(this.enemyRoot.position).normalize();
      
      // Check if player is within field of view
      const dot = Vector3.Dot(this.enemyRoot.forward, directionToPlayer);
      const angleToPlayer = Math.acos(dot) * (180 / Math.PI);
      
      if (angleToPlayer <= this.config.fieldOfView / 2) {
        // Cast ray to check for obstacles between enemy and player
        this.playerDetectionRay.origin = this.enemyRoot.position.clone();
        this.playerDetectionRay.origin.y += 1.6; // Eye level
        this.playerDetectionRay.direction = directionToPlayer;
        this.playerDetectionRay.length = distanceToPlayer;
        
        const hit = this.scene.pickWithRay(this.playerDetectionRay);
        
        // If there's a direct line of sight to the player
        if (hit && hit.pickedMesh && hit.pickedMesh.name.includes('player')) {
          this.canSeePlayer = true;
          this.lastKnownPlayerPosition = playerPosition.clone();
          
          // Increase alertness based on distance (closer = faster detection)
          const distanceFactor = 1 - Math.min(1, distanceToPlayer / this.config.detectionRange);
          const alertnessIncrease = 20 * distanceFactor * deltaTime * 10;
          this.alertness = Math.min(100, this.alertness + alertnessIncrease);
        }
      }
    }
    
    // If player is making noise (shooting, etc.), detect regardless of FOV
    // This would be implemented with a noise detection system
  }
  
  /**
   * Updates the idle state behavior
   * @param deltaTime - Time since last frame in seconds
   */
  protected updateIdle(deltaTime: number): void {
    // In idle state, the guard stands still and occasionally looks around
    // This could be expanded with idle animations or random head movements
  }
  
  /**
   * Updates the patrol state behavior
   * @param deltaTime - Time since last frame in seconds
   */
  protected updatePatrol(deltaTime: number): void {
    if (!this.patrolPath || this.patrolPath.points.length === 0) {
      return;
    }
    
    // If waiting at a patrol point
    if (this.waitTimeRemaining > 0) {
      this.waitTimeRemaining -= deltaTime;
      
      // Play idle animation while waiting
      this.playAnimation(this.idleAnimation);
      return;
    }
    
    // Get current patrol target
    const targetPoint = this.patrolPath.points[this.currentPatrolIndex];
    this.targetPosition = targetPoint;
    
    // Move towards the target point
    const direction = targetPoint.subtract(this.enemyRoot.position);
    direction.y = 0; // Keep movement on the ground plane
    const distance = direction.length();
    
    // Check if we've reached the target point
    if (distance < 0.5) {
      // Start waiting at this point
      this.waitTimeRemaining = this.patrolPath.waitTime;
      
      // Move to the next patrol point
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPath.points.length;
      return;
    }
    
    // Move towards the target
    const normalizedDirection = direction.normalize();
    const movement = normalizedDirection.scale(this.config.speed.walk * deltaTime);
    
    // Apply movement
    this.enemyRoot.position.addInPlace(movement);
    
    // Rotate towards movement direction
    this.rotateTowards(normalizedDirection, deltaTime);
    
    // Play walk animation and footstep sounds
    this.playAnimation(this.walkAnimation);
    
    // Play footstep sound occasionally
    if (Math.random() < 0.01) {
      this.playFootstepSound();
    }
  }
  
  /**
   * Updates the alert state behavior
   * @param deltaTime - Time since last frame in seconds
   */
  protected updateAlert(deltaTime: number): void {
    // In alert state, the guard moves towards the last known player position
    if (!this.lastKnownPlayerPosition) return;
    
    // Move towards last known player position
    const direction = this.lastKnownPlayerPosition.subtract(this.enemyRoot.position);
    direction.y = 0; // Keep movement on the ground plane
    const distance = direction.length();
    
    // Check if we've reached the target point
    if (distance < 1.0) {
      // If we've reached the last known position and can't see the player,
      // transition to search state
      if (!this.canSeePlayer) {
        this.searchStartPosition = this.enemyRoot.position.clone();
        this.searchTime = 0;
        return;
      }
    }
    
    // Move towards the target
    const normalizedDirection = direction.normalize();
    const movement = normalizedDirection.scale(this.config.speed.run * deltaTime);
    
    // Apply movement
    this.enemyRoot.position.addInPlace(movement);
    
    // Rotate towards movement direction
    this.rotateTowards(normalizedDirection, deltaTime);
    
    // Play run animation
    this.playAnimation(this.runAnimation || this.walkAnimation);
    
    // Play footstep sound occasionally
    if (Math.random() < 0.03) {
      this.playFootstepSound();
    }
  }
  
  /**
   * Updates the attack state behavior
   * @param deltaTime - Time since last frame in seconds
   */
  protected updateAttack(deltaTime: number): void {
    // Check if player is still visible
    if (!this.canSeePlayer || !this.lastKnownPlayerPosition) {
      return;
    }
    
    // Face the player
    const directionToPlayer = this.lastKnownPlayerPosition.subtract(this.enemyRoot.position);
    directionToPlayer.y = 0;
    this.rotateTowards(directionToPlayer.normalize(), deltaTime * 2); // Faster rotation in combat
    
    // Attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
      return;
    }
    
    // Calculate distance to player
    const distanceToPlayer = Vector3.Distance(this.enemyRoot.position, this.lastKnownPlayerPosition);
    
    // If within attack range, perform attack
    if (distanceToPlayer <= this.config.attackRange) {
      this.performAttack();
      this.attackCooldown = 60 / this.config.attackRate; // Convert attacks per minute to seconds
    } else {
      // Move towards player if not in attack range
      const movement = directionToPlayer.normalize().scale(this.config.speed.run * deltaTime);
      this.enemyRoot.position.addInPlace(movement);
      
      // Play run animation
      this.playAnimation(this.runAnimation || this.walkAnimation);
      
      // Play footstep sound occasionally
      if (Math.random() < 0.03) {
        this.playFootstepSound();
      }
    }
  }
  
  /**
   * Updates the search state behavior
   * @param deltaTime - Time since last frame in seconds
   */
  protected updateSearch(deltaTime: number): void {
    // In search state, the guard looks around the last known player position
    
    // Update search time
    this.searchTime += deltaTime;
    
    // If search time exceeds maximum, return to patrol
    if (this.searchTime >= this.maxSearchTime) {
      this.alertness = 0;
      return;
    }
    
    // If we don't have a search start position, use current position
    if (!this.searchStartPosition) {
      this.searchStartPosition = this.enemyRoot.position.clone();
    }
    
    // Generate a random position within search radius if we don't have a target
    if (!this.targetPosition) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * this.searchRadius;
      const x = this.searchStartPosition.x + Math.cos(angle) * radius;
      const z = this.searchStartPosition.z + Math.sin(angle) * radius;
      this.targetPosition = new Vector3(x, this.enemyRoot.position.y, z);
    }
    
    // Move towards the target position
    const direction = this.targetPosition.subtract(this.enemyRoot.position);
    direction.y = 0;
    const distance = direction.length();
    
    // If we've reached the target, set a new one
    if (distance < 0.5) {
      this.targetPosition = null;
      
      // Pause briefly at the search point
      this.waitTimeRemaining = 1 + Math.random() * 2; // 1-3 seconds
      this.playAnimation(this.idleAnimation);
      return;
    }
    
    // If we're waiting, decrement the timer
    if (this.waitTimeRemaining > 0) {
      this.waitTimeRemaining -= deltaTime;
      return;
    }
    
    // Move towards the target
    const normalizedDirection = direction.normalize();
    const movement = normalizedDirection.scale(this.config.speed.walk * deltaTime);
    
    // Apply movement
    this.enemyRoot.position.addInPlace(movement);
    
    // Rotate towards movement direction
    this.rotateTowards(normalizedDirection, deltaTime);
    
    // Play walk animation
    this.playAnimation(this.walkAnimation);
    
    // Play footstep sound occasionally
    if (Math.random() < 0.01) {
      this.playFootstepSound();
    }
  }
  
  /**
   * Performs an attack against the player
   */
  private performAttack(): void {
    // Play attack animation
    this.playAnimation(this.attackAnimation);
    
    // Play attack sound
    this.playAttackSound();
    
    // Calculate if attack hits based on distance and accuracy
    const playerPosition = this.player.getPosition();
    if (!playerPosition) return;
    
    const distanceToPlayer = Vector3.Distance(this.enemyRoot.position, playerPosition);
    const hitChance = Math.max(0.1, 1 - (distanceToPlayer / this.config.attackRange));
    
    if (Math.random() < hitChance) {
      // Apply damage to player
      const damageAmount = this.config.attackDamage;
      this.player.takeDamage(damageAmount);
      this.onDamageDealt.notifyObservers(damageAmount);
    }
  }
  
  /**
   * Rotates the enemy towards a target direction
   * @param targetDirection - Direction to rotate towards
   * @param deltaTime - Time since last frame in seconds
   */
  private rotateTowards(targetDirection: Vector3, deltaTime: number): void {
    if (!this.enemyRoot) return;
    
    // Calculate target rotation
    const targetAngle = Math.atan2(targetDirection.x, targetDirection.z);
    
    // Get current rotation
    const currentRotation = this.enemyRoot.rotation.y;
    
    // Calculate shortest rotation path
    let angleDiff = targetAngle - currentRotation;
    
    // Normalize angle to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    // Rotate with smooth interpolation
    const rotationSpeed = 5.0; // Radians per second
    const rotation = MathUtils.clamp(angleDiff, -rotationSpeed * deltaTime, rotationSpeed * deltaTime);
    
    // Apply rotation
    this.enemyRoot.rotation.y += rotation;
  }
  
  /**
   * Determines if the enemy should transition to patrol state
   * @returns True if the enemy should patrol
   */
  protected shouldPatrol(): boolean {
    return this.patrolPath !== null && this.patrolPath.points.length > 0;
  }
  
  /**
   * Determines if the enemy can attack the player
   * @returns True if the enemy can attack
   */
  protected canAttackPlayer(): boolean {
    if (!this.canSeePlayer || !this.lastKnownPlayerPosition) return false;
    
    const distanceToPlayer = Vector3.Distance(
      this.enemyRoot.position, 
      this.lastKnownPlayerPosition
    );
    
    return distanceToPlayer <= this.config.attackRange * 1.5; // Allow attack from slightly further than actual range
  }
  
  /**
   * Disposes of the enemy and its resources
   */
  public dispose(): void {
    // Clean up debug helpers
    if (this.playerDetectionHelper) {
      this.playerDetectionHelper.dispose();
    }
    
    // Call parent dispose
    super.dispose();
  }
}
