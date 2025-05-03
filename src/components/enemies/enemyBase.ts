import { 
  Scene, 
  Vector3, 
  Quaternion, 
  Mesh, 
  AbstractMesh, 
  AnimationGroup, 
  TransformNode, 
  Ray, 
  RayHelper, 
  Color3,
  Observable,
  PhysicsImpostor
} from '@babylonjs/core';
import { AssetLoader, ModelLoadResult } from '../../utils/loader';
import { PlayerController } from '../player/playerController';
import { SoundSystem, SoundCategory } from '../../core/sound';

/**
 * Enum representing possible enemy states
 */
export enum EnemyState {
  IDLE = 'idle',
  PATROL = 'patrol',
  ALERT = 'alert',
  ATTACK = 'attack',
  SEARCH = 'search',
  DEAD = 'dead'
}

/**
 * Enemy configuration options
 */
export interface EnemyConfig {
  name: string;
  modelPath: string;
  health: number;
  speed: {
    walk: number;
    run: number;
  };
  attackDamage: number;
  attackRange: number;
  attackRate: number; // Attacks per minute
  detectionRange: number;
  fieldOfView: number; // In degrees
  alertnessDecayRate: number; // How quickly enemy returns to patrol after losing sight
  soundEffects: {
    attack: string;
    alert: string;
    death: string;
    footsteps: string;
  };
}

/**
 * Base enemy class for Project Prism Protocol
 * Provides common functionality for all enemy types
 */
export abstract class EnemyBase {
  protected scene: Scene;
  protected config: EnemyConfig;
  protected assetLoader: AssetLoader;
  protected soundSystem: SoundSystem;
  
  // State tracking
  protected currentState: EnemyState = EnemyState.IDLE;
  protected previousState: EnemyState = EnemyState.IDLE;
  protected health: number;
  protected alertness: number = 0; // 0-100, affects state transitions
  protected lastAttackTime: number = 0;
  protected targetPosition: Vector3 | null = null;
  protected lastKnownPlayerPosition: Vector3 | null = null;
  
  // Meshes and nodes
  protected enemyRoot: TransformNode;
  protected enemyModel: ModelLoadResult | null = null;
  protected enemyCollider: Mesh | null = null;
  
  // Animation groups
  protected idleAnimation: AnimationGroup | null = null;
  protected walkAnimation: AnimationGroup | null = null;
  protected runAnimation: AnimationGroup | null = null;
  protected attackAnimation: AnimationGroup | null = null;
  protected alertAnimation: AnimationGroup | null = null;
  protected deathAnimation: AnimationGroup | null = null;
  
  // Perception
  protected visionRay: Ray;
  protected visionHelper: RayHelper | null = null;
  
  // Events
  public onDeath: Observable<EnemyBase> = new Observable<EnemyBase>();
  public onStateChange: Observable<EnemyState> = new Observable<EnemyState>();
  public onDamageDealt: Observable<number> = new Observable<number>();
  public onDamageTaken: Observable<number> = new Observable<number>();
  
  /**
   * Creates a new enemy instance
   * @param scene - The Babylon.js scene
   * @param spawnPosition - Initial spawn position
   * @param config - Enemy configuration
   * @param assetLoader - Asset loader instance
   * @param soundSystem - Sound system instance
   */
  constructor(
    scene: Scene,
    spawnPosition: Vector3,
    config: EnemyConfig,
    assetLoader: AssetLoader,
    soundSystem: SoundSystem
  ) {
    this.scene = scene;
    this.config = config;
    this.assetLoader = assetLoader;
    this.soundSystem = soundSystem;
    this.health = config.health;
    
    // Create enemy root transform node
    this.enemyRoot = new TransformNode(`enemy_${config.name}_root`, this.scene);
    this.enemyRoot.position = spawnPosition.clone();
    
    // Create vision ray for perception
    this.visionRay = new Ray(Vector3.Zero(), Vector3.Forward(), this.config.detectionRange);
    
    // Set up debug ray if debug mode is enabled
    const debugMode = false; // Set to true to enable debug visualization
    if (debugMode) {
      this.visionHelper = new RayHelper(this.visionRay);
      this.visionHelper.show(this.scene, new Color3(0, 1, 0));
    }
    
    // Set up update loop
    this.scene.onBeforeRenderObservable.add(() => {
      const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
      this.update(deltaTime);
    });
  }
  
  /**
   * Loads the enemy model and initializes it
   * @returns Promise that resolves when the enemy is loaded
   */
  public async load(): Promise<void> {
    try {
      // Load enemy model
      this.enemyModel = await this.assetLoader.loadModel(this.config.modelPath);
      
      if (!this.enemyModel) {
        throw new Error(`Failed to load enemy model: ${this.config.modelPath}`);
      }
      
      // Parent to enemy root
      if (this.enemyModel.rootNode) {
        this.enemyModel.rootNode.parent = this.enemyRoot;
        this.enemyModel.rootNode.position = Vector3.Zero();
      } else {
        // If no root node, parent all meshes directly
        this.enemyModel.meshes.forEach(mesh => {
          if (mesh.parent === null) {
            mesh.parent = this.enemyRoot;
          }
        });
      }
      
      // Set up animations if available
      if (this.enemyModel.animationGroups) {
        this.setupAnimations(this.enemyModel.animationGroups);
      }
      
      // Create enemy collider
      this.createCollider();
      
      console.log(`Enemy ${this.config.name} loaded successfully`);
    } catch (error) {
      console.error(`Error loading enemy ${this.config.name}:`, error);
      throw error;
    }
  }
  
  /**
   * Sets up enemy animations
   * @param animationGroups - Available animation groups
   */
  protected setupAnimations(animationGroups: AnimationGroup[]): void {
    // Find animations by name
    this.idleAnimation = animationGroups.find(ag => 
      ag.name.toLowerCase().includes('idle')
    ) || null;
    
    this.walkAnimation = animationGroups.find(ag => 
      ag.name.toLowerCase().includes('walk')
    ) || null;
    
    this.runAnimation = animationGroups.find(ag => 
      ag.name.toLowerCase().includes('run')
    ) || null;
    
    this.attackAnimation = animationGroups.find(ag => 
      ag.name.toLowerCase().includes('attack')
    ) || null;
    
    this.alertAnimation = animationGroups.find(ag => 
      ag.name.toLowerCase().includes('alert')
    ) || null;
    
    this.deathAnimation = animationGroups.find(ag => 
      ag.name.toLowerCase().includes('death') || 
      ag.name.toLowerCase().includes('die')
    ) || null;
    
    // Stop all animations initially
    animationGroups.forEach(ag => ag.stop());
  }
  
  /**
   * Creates a physics collider for the enemy
   */
  protected createCollider(): void {
    // Create a capsule collider
    this.enemyCollider = Mesh.CreateCapsule(`enemy_${this.config.name}_collider`, {
      height: 1.8,
      radius: 0.4,
      tessellation: 16,
      subdivisions: 1
    }, this.scene);
    
    this.enemyCollider.parent = this.enemyRoot;
    this.enemyCollider.visibility = 0; // Invisible
    
    // Set up physics
    this.enemyCollider.physicsImpostor = new PhysicsImpostor(
      this.enemyCollider,
      PhysicsImpostor.CapsuleImpostor,
      { mass: 70, friction: 0.5, restitution: 0.0 },
      this.scene
    );
  }
  
  /**
   * Updates the enemy state and behavior
   * @param deltaTime - Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    if (this.currentState === EnemyState.DEAD) return;
    
    // Update perception
    this.updatePerception(deltaTime);
    
    // Update state machine
    this.updateStateMachine(deltaTime);
    
    // Update movement and actions based on current state
    switch (this.currentState) {
      case EnemyState.IDLE:
        this.updateIdle(deltaTime);
        break;
      case EnemyState.PATROL:
        this.updatePatrol(deltaTime);
        break;
      case EnemyState.ALERT:
        this.updateAlert(deltaTime);
        break;
      case EnemyState.ATTACK:
        this.updateAttack(deltaTime);
        break;
      case EnemyState.SEARCH:
        this.updateSearch(deltaTime);
        break;
    }
    
    // Update vision ray position and direction
    this.updateVisionRay();
  }
  
  /**
   * Updates the enemy's perception of the environment
   * @param deltaTime - Time since last frame in seconds
   */
  protected abstract updatePerception(deltaTime: number): void;
  
  /**
   * Updates the enemy state machine
   * @param deltaTime - Time since last frame in seconds
   */
  protected updateStateMachine(deltaTime: number): void {
    // Store previous state
    this.previousState = this.currentState;
    
    // State transitions based on alertness level and other factors
    switch (this.currentState) {
      case EnemyState.IDLE:
        if (this.alertness > 50) {
          this.setState(EnemyState.ALERT);
        } else if (this.shouldPatrol()) {
          this.setState(EnemyState.PATROL);
        }
        break;
        
      case EnemyState.PATROL:
        if (this.alertness > 50) {
          this.setState(EnemyState.ALERT);
        } else if (this.alertness > 20) {
          this.setState(EnemyState.SEARCH);
        }
        break;
        
      case EnemyState.ALERT:
        if (this.alertness > 80 && this.canAttackPlayer()) {
          this.setState(EnemyState.ATTACK);
        } else if (this.alertness < 40) {
          this.setState(EnemyState.SEARCH);
        }
        break;
        
      case EnemyState.ATTACK:
        if (!this.canAttackPlayer()) {
          this.setState(EnemyState.ALERT);
        } else if (this.alertness < 60) {
          this.setState(EnemyState.SEARCH);
        }
        break;
        
      case EnemyState.SEARCH:
        if (this.alertness > 70) {
          this.setState(EnemyState.ALERT);
        } else if (this.alertness < 10) {
          this.setState(EnemyState.PATROL);
        }
        break;
    }
    
    // Decay alertness over time
    this.alertness = Math.max(0, this.alertness - (this.config.alertnessDecayRate * deltaTime));
  }
  
  /**
   * Sets the enemy state and triggers state change event
   * @param newState - The new state to set
   */
  protected setState(newState: EnemyState): void {
    if (newState === this.currentState) return;
    
    this.currentState = newState;
    this.onStateChange.notifyObservers(newState);
    
    // Handle state entry actions
    switch (newState) {
      case EnemyState.IDLE:
        this.playAnimation(this.idleAnimation);
        break;
        
      case EnemyState.PATROL:
        this.playAnimation(this.walkAnimation);
        break;
        
      case EnemyState.ALERT:
        this.playAnimation(this.alertAnimation || this.idleAnimation);
        this.playAlertSound();
        break;
        
      case EnemyState.ATTACK:
        // Attack animation is played in the attack method
        break;
        
      case EnemyState.SEARCH:
        this.playAnimation(this.walkAnimation);
        break;
        
      case EnemyState.DEAD:
        this.playAnimation(this.deathAnimation);
        this.playDeathSound();
        break;
    }
  }
  
  /**
   * Updates the idle state behavior
   * @param deltaTime - Time since last frame in seconds
   */
  protected abstract updateIdle(deltaTime: number): void;
  
  /**
   * Updates the patrol state behavior
   * @param deltaTime - Time since last frame in seconds
   */
  protected abstract updatePatrol(deltaTime: number): void;
  
  /**
   * Updates the alert state behavior
   * @param deltaTime - Time since last frame in seconds
   */
  protected abstract updateAlert(deltaTime: number): void;
  
  /**
   * Updates the attack state behavior
   * @param deltaTime - Time since last frame in seconds
   */
  protected abstract updateAttack(deltaTime: number): void;
  
  /**
   * Updates the search state behavior
   * @param deltaTime - Time since last frame in seconds
   */
  protected abstract updateSearch(deltaTime: number): void;
  
  /**
   * Determines if the enemy should transition to patrol state
   * @returns True if the enemy should patrol
   */
  protected abstract shouldPatrol(): boolean;
  
  /**
   * Determines if the enemy can attack the player
   * @returns True if the enemy can attack
   */
  protected abstract canAttackPlayer(): boolean;
  
  /**
   * Updates the vision ray position and direction
   */
  protected updateVisionRay(): void {
    if (!this.enemyRoot) return;
    
    // Position the ray at the enemy's head level
    const rayOrigin = this.enemyRoot.position.clone();
    rayOrigin.y += 1.6; // Approximate head height
    
    // Direction is the enemy's forward direction
    const rayDirection = this.enemyRoot.forward;
    
    // Update the ray
    this.visionRay.origin = rayOrigin;
    this.visionRay.direction = rayDirection;
    this.visionRay.length = this.config.detectionRange;
  }
  
  /**
   * Plays an animation if it exists
   * @param animation - The animation to play
   */
  protected playAnimation(animation: AnimationGroup | null): void {
    if (!animation) return;
    
    // Stop all animations
    if (this.idleAnimation) this.idleAnimation.stop();
    if (this.walkAnimation) this.walkAnimation.stop();
    if (this.runAnimation) this.runAnimation.stop();
    if (this.attackAnimation) this.attackAnimation.stop();
    if (this.alertAnimation) this.alertAnimation.stop();
    
    // Don't stop death animation if it's playing
    if (this.currentState !== EnemyState.DEAD && this.deathAnimation) {
      this.deathAnimation.stop();
    }
    
    // Play the requested animation
    animation.play(true);
  }
  
  /**
   * Plays the alert sound
   */
  protected playAlertSound(): void {
    if (this.config.soundEffects.alert) {
      this.soundSystem.playSound(this.config.soundEffects.alert);
    }
  }
  
  /**
   * Plays the attack sound
   */
  protected playAttackSound(): void {
    if (this.config.soundEffects.attack) {
      this.soundSystem.playSound(this.config.soundEffects.attack);
    }
  }
  
  /**
   * Plays the death sound
   */
  protected playDeathSound(): void {
    if (this.config.soundEffects.death) {
      this.soundSystem.playSound(this.config.soundEffects.death);
    }
  }
  
  /**
   * Plays footstep sounds
   */
  protected playFootstepSound(): void {
    if (this.config.soundEffects.footsteps) {
      this.soundSystem.playSound(this.config.soundEffects.footsteps);
    }
  }
  
  /**
   * Applies damage to the enemy
   * @param amount - Amount of damage to apply
   * @param source - Source position of the damage
   * @returns True if the enemy died from this damage
   */
  public takeDamage(amount: number, source?: Vector3): boolean {
    if (this.currentState === EnemyState.DEAD) return false;
    
    this.health -= amount;
    this.onDamageTaken.notifyObservers(amount);
    
    // Increase alertness when taking damage
    this.alertness = Math.min(100, this.alertness + 50);
    
    // Store source position as last known player position
    if (source) {
      this.lastKnownPlayerPosition = source.clone();
    }
    
    // Check for death
    if (this.health <= 0) {
      this.health = 0;
      this.die();
      return true;
    }
    
    return false;
  }
  
  /**
   * Handles enemy death
   */
  protected die(): void {
    this.setState(EnemyState.DEAD);
    
    // Disable physics
    if (this.enemyCollider && this.enemyCollider.physicsImpostor) {
      this.enemyCollider.physicsImpostor.dispose();
    }
    
    // Notify observers
    this.onDeath.notifyObservers(this);
    
    // Remove from update loop after a delay (to allow death animation)
    setTimeout(() => {
      this.scene.onBeforeRenderObservable.removeCallback(() => this.update);
    }, 5000);
  }
  
  /**
   * Gets the current position of the enemy
   * @returns The enemy's current position
   */
  public getPosition(): Vector3 {
    return this.enemyRoot.position.clone();
  }
  
  /**
   * Disposes of the enemy and its resources
   */
  public dispose(): void {
    // Clean up observables
    this.onDeath.clear();
    this.onStateChange.clear();
    this.onDamageDealt.clear();
    this.onDamageTaken.clear();
    
    // Clean up debug helpers
    if (this.visionHelper) {
      this.visionHelper.dispose();
    }
    
    // Dispose of physics impostor
    if (this.enemyCollider && this.enemyCollider.physicsImpostor) {
      this.enemyCollider.physicsImpostor.dispose();
    }
    
    // Dispose of meshes
    if (this.enemyCollider) {
      this.enemyCollider.dispose();
    }
    
    // Dispose of animations
    if (this.enemyModel && this.enemyModel.animationGroups) {
      this.enemyModel.animationGroups.forEach(ag => ag.dispose());
    }
    
    // Dispose of root node (this will dispose all children)
    if (this.enemyRoot) {
      this.enemyRoot.dispose();
    }
  }
}
