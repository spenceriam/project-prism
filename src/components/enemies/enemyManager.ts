import { Scene, Vector3 } from '@babylonjs/core';
import { EnemyBase, EnemyConfig } from './enemyBase';
import { StandardGuard, PatrolPathConfig } from './standardGuard';
import { AssetLoader } from '../../utils/loader';
import { SoundSystem } from '../../core/sound';
import { PlayerController } from '../player/playerController';

/**
 * EnemyManager handles enemy spawning, management, and interactions
 */
export class EnemyManager {
  private scene: Scene;
  private assetLoader: AssetLoader;
  private soundSystem: SoundSystem;
  private player: PlayerController;
  
  // Collection of all active enemies
  private enemies: Map<string, EnemyBase> = new Map();
  
  // Enemy templates for quick spawning
  private enemyTemplates: Map<string, EnemyConfig> = new Map();
  
  /**
   * Creates a new EnemyManager
   * @param scene - The Babylon.js scene
   * @param assetLoader - Asset loader instance
   * @param soundSystem - Sound system instance
   * @param player - Player controller instance
   */
  constructor(
    scene: Scene,
    assetLoader: AssetLoader,
    soundSystem: SoundSystem,
    player: PlayerController
  ) {
    this.scene = scene;
    this.assetLoader = assetLoader;
    this.soundSystem = soundSystem;
    this.player = player;
    
    // Register default enemy templates
    this.registerDefaultTemplates();
  }
  
  /**
   * Registers default enemy templates
   */
  private registerDefaultTemplates(): void {
    // Standard Guard template
    this.registerEnemyTemplate('standardGuard', {
      name: 'Standard Guard',
      modelPath: 'assets/models/enemies/standardGuard.glb',
      health: 100,
      speed: {
        walk: 2.0,
        run: 4.0
      },
      attackDamage: 10,
      attackRange: 1.5,
      attackRate: 60, // 1 attack per second
      detectionRange: 15,
      fieldOfView: 120, // degrees
      alertnessDecayRate: 5, // Units per second
      soundEffects: {
        attack: 'guard_attack',
        alert: 'guard_alert',
        death: 'guard_death',
        footsteps: 'guard_footstep'
      }
    });
    
    // More enemy templates can be registered here
  }
  
  /**
   * Registers an enemy template for later spawning
   * @param id - Unique identifier for the template
   * @param config - Enemy configuration
   */
  public registerEnemyTemplate(id: string, config: EnemyConfig): void {
    this.enemyTemplates.set(id, config);
  }
  
  /**
   * Spawns a standard guard enemy
   * @param id - Unique identifier for this enemy instance
   * @param position - Spawn position
   * @param templateId - Enemy template ID to use (defaults to 'standardGuard')
   * @param patrolPath - Optional patrol path configuration
   * @returns The created enemy instance
   */
  public async spawnStandardGuard(
    id: string,
    position: Vector3,
    templateId: string = 'standardGuard',
    patrolPath?: PatrolPathConfig
  ): Promise<StandardGuard> {
    // Get template config
    const template = this.enemyTemplates.get(templateId);
    if (!template) {
      throw new Error(`Enemy template not found: ${templateId}`);
    }
    
    // Create enemy instance
    const enemy = new StandardGuard(
      this.scene,
      position,
      template,
      this.assetLoader,
      this.soundSystem,
      this.player,
      patrolPath
    );
    
    // Register enemy
    this.enemies.set(id, enemy);
    
    // Load enemy assets
    await enemy.load();
    
    // Set up death handler
    enemy.onDeath.add(() => {
      setTimeout(() => {
        this.removeEnemy(id);
      }, 5000); // Remove enemy 5 seconds after death
    });
    
    return enemy;
  }
  
  /**
   * Gets an enemy by ID
   * @param id - Enemy ID
   * @returns The enemy instance or undefined if not found
   */
  public getEnemy(id: string): EnemyBase | undefined {
    return this.enemies.get(id);
  }
  
  /**
   * Gets all active enemies
   * @returns Array of all enemy instances
   */
  public getAllEnemies(): EnemyBase[] {
    return Array.from(this.enemies.values());
  }
  
  /**
   * Gets all enemies within a radius of a position
   * @param position - Center position
   * @param radius - Search radius
   * @returns Array of enemies within the radius
   */
  public getEnemiesInRadius(position: Vector3, radius: number): EnemyBase[] {
    const result: EnemyBase[] = [];
    
    this.enemies.forEach(enemy => {
      const enemyPosition = enemy.getPosition();
      if (enemyPosition) {
        const distance = Vector3.Distance(position, enemyPosition);
        if (distance <= radius) {
          result.push(enemy);
        }
      }
    });
    
    return result;
  }
  
  /**
   * Removes an enemy by ID
   * @param id - Enemy ID
   */
  public removeEnemy(id: string): void {
    const enemy = this.enemies.get(id);
    if (enemy) {
      enemy.dispose();
      this.enemies.delete(id);
    }
  }
  
  /**
   * Removes all enemies
   */
  public removeAllEnemies(): void {
    this.enemies.forEach(enemy => {
      enemy.dispose();
    });
    
    this.enemies.clear();
  }
  
  /**
   * Updates all enemies
   * @param deltaTime - Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    // Enemy updates are handled by their own update methods
    // This method is reserved for manager-level updates
  }
  
  /**
   * Disposes of the enemy manager and all enemies
   */
  public dispose(): void {
    this.removeAllEnemies();
  }
}
