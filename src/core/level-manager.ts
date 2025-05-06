import { Scene } from '@babylonjs/core';
import { AssetLoader } from '../utils/loader';
import { Environment } from '../components/environment/environment';
import { TrainingFacility } from '../levels/training';
import { SimplePrimitiveTrainingFacility } from '../levels/simplePrimitiveTraining';

/**
 * Level types available in the game
 */
export enum LevelType {
  TRAINING = 'training',
  PRIMITIVE_TRAINING = 'primitive_training',
  SIMPLE_PRIMITIVE_TRAINING = 'simple_primitive_training',
  OFFICE = 'office',
  DETENTION = 'detention',
  FACILITY = 'facility',
  COMMAND = 'command'
}

/**
 * LevelManager handles loading, unloading, and switching between game levels
 */
export class LevelManager {
  private scene: Scene;
  private assetLoader: AssetLoader;
  private currentLevel: Environment | null = null;
  private currentLevelType: LevelType | null = null;
  private isLoading: boolean = false;
  private onLevelLoadedCallback: (() => void) | null = null;

  /**
   * Create a new level manager
   * @param scene - The Babylon.js scene
   * @param assetLoader - The asset loader instance
   */
  constructor(scene: Scene, assetLoader: AssetLoader) {
    this.scene = scene;
    this.assetLoader = assetLoader;
  }

  /**
   * Load a level by type
   * @param levelType - The type of level to load
   * @returns Promise that resolves when the level is loaded
   */
  public async loadLevel(levelType: LevelType): Promise<void> {
    // Don't load if we're already loading or if it's the same level
    if (this.isLoading || levelType === this.currentLevelType) {
      return;
    }

    this.isLoading = true;

    try {
      // Unload current level if one is loaded
      if (this.currentLevel) {
        await this.unloadCurrentLevel();
      }

      console.log(`Loading level: ${levelType}`);
      this.currentLevelType = levelType;

      // Create and load the appropriate level
      switch (levelType) {
        case LevelType.TRAINING:
          this.currentLevel = new TrainingFacility(this.scene, this.assetLoader);
          break;
        case LevelType.PRIMITIVE_TRAINING:
          // Using the simplified version instead to avoid TypeScript errors
          this.currentLevel = new SimplePrimitiveTrainingFacility(this.scene, this.assetLoader);
          break;
        case LevelType.SIMPLE_PRIMITIVE_TRAINING:
          this.currentLevel = new SimplePrimitiveTrainingFacility(this.scene, this.assetLoader);
          break;
        case LevelType.OFFICE:
          // TODO: Implement Office level
          throw new Error('Office level not implemented yet');
        case LevelType.DETENTION:
          // TODO: Implement Detention level
          throw new Error('Detention level not implemented yet');
        case LevelType.FACILITY:
          // TODO: Implement Facility level
          throw new Error('Facility level not implemented yet');
        case LevelType.COMMAND:
          // TODO: Implement Command level
          throw new Error('Command level not implemented yet');
        default:
          throw new Error(`Unknown level type: ${levelType}`);
      }

      // Load the level
      await this.currentLevel.load();

      // Call the callback if set
      if (this.onLevelLoadedCallback) {
        this.onLevelLoadedCallback();
      }

      console.log(`Level ${levelType} loaded successfully`);
    } catch (error) {
      console.error(`Failed to load level ${levelType}:`, error);
      this.currentLevel = null;
      this.currentLevelType = null;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Unload the current level
   */
  private async unloadCurrentLevel(): Promise<void> {
    if (!this.currentLevel) return;

    console.log(`Unloading level: ${this.currentLevelType}`);
    
    // Dispose the level
    this.currentLevel.dispose();
    
    this.currentLevel = null;
    this.currentLevelType = null;
  }

  /**
   * Get the current level
   * @returns The current environment or null if none is loaded
   */
  public getCurrentLevel(): Environment | null {
    return this.currentLevel;
  }

  /**
   * Get the current level type
   * @returns The current level type or null if none is loaded
   */
  public getCurrentLevelType(): LevelType | null {
    return this.currentLevelType;
  }

  /**
   * Check if a level is currently loading
   * @returns True if a level is loading
   */
  public isLevelLoading(): boolean {
    return this.isLoading;
  }

  /**
   * Set a callback to be called when a level is loaded
   * @param callback - The callback function
   */
  public setOnLevelLoadedCallback(callback: () => void): void {
    this.onLevelLoadedCallback = callback;
  }

  /**
   * Dispose of the level manager and current level
   */
  public dispose(): void {
    if (this.currentLevel) {
      this.currentLevel.dispose();
      this.currentLevel = null;
      this.currentLevelType = null;
    }
  }
}
