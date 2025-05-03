import { GameEngine } from './core/engine';
import { AssetLoader } from './utils/loader';
import { LevelManager, LevelType } from './core/level-manager';
import './styles.css';

/**
 * Project Prism Protocol - Main Entry Point
 * A browser-based FPS game inspired by GoldenEye 64, built using Babylon.js
 */
class PrismGame {
  private engine: GameEngine;
  private assetLoader: AssetLoader;
  private levelManager: LevelManager;
  private loadingScreen: HTMLElement | null;
  private loadingProgress: HTMLElement | null;
  private isDebug: boolean;

  /**
   * Initialize the game
   * @param canvasId - The ID of the canvas element to render to
   * @param debug - Whether to enable debug features
   */
  constructor(canvasId: string, debug: boolean = false) {
    this.isDebug = debug;
    this.loadingScreen = document.getElementById('loadingScreen');
    this.loadingProgress = document.getElementById('loadingProgress');
    
    // Initialize game engine
    this.engine = new GameEngine(canvasId, debug);
    
    // Create default scene
    this.engine.createDefaultScene();
    
    // Initialize asset loader
    this.assetLoader = new AssetLoader(this.engine.getScene());
    
    // Initialize level manager
    this.levelManager = new LevelManager(this.engine.getScene(), this.assetLoader);
    
    // Set up global loading progress tracking
    this.assetLoader.setGlobalProgressCallback(this.updateLoadingProgress.bind(this));
    
    // Try to enable WebGPU if supported
    if (!debug) {
      this.engine.tryEnableWebGPU().catch(e => {
        console.warn('WebGPU initialization failed, using WebGL', e);
      });
    }
  }
  
  /**
   * Update the loading progress UI
   * @param progress - Progress value between 0 and 1
   */
  private updateLoadingProgress(progress: number): void {
    if (this.loadingProgress) {
      const percent = Math.min(100, Math.round(progress * 100));
      this.loadingProgress.style.width = `${percent}%`;
    }
  }
  
  /**
   * Hide the loading screen
   */
  private hideLoadingScreen(): void {
    if (this.loadingScreen) {
      this.loadingScreen.style.opacity = '0';
      setTimeout(() => {
        if (this.loadingScreen) {
          this.loadingScreen.style.display = 'none';
        }
      }, 500);
    }
  }
  
  /**
   * Start the game
   */
  public async start(): Promise<void> {
    try {
      // Start the render loop
      this.engine.startRenderLoop();
      
      // Set callback for when level is loaded
      this.levelManager.setOnLevelLoadedCallback(() => {
        // Get the current level
        const currentLevel = this.levelManager.getCurrentLevel();
        
        if (currentLevel) {
          // Get player spawn position and rotation
          const spawnPosition = currentLevel.getSpawnPosition();
          const spawnRotation = currentLevel.getSpawnRotation();
          
          // Update camera position and rotation
          const camera = this.engine.getScene().activeCamera;
          if (camera) {
            camera.position = spawnPosition;
            
            // Check if camera has rotation property (FreeCamera does)
            if ('rotation' in camera) {
              (camera as any).rotation.y = spawnRotation;
            }
          }
          
          // Hide loading screen when level is ready
          this.hideLoadingScreen();
        }
      });
      
      // Load the Training Facility level
      await this.levelManager.loadLevel(LevelType.TRAINING);
      
      console.log('Project Prism Protocol initialized successfully');
    } catch (error) {
      console.error('Failed to initialize game:', error);
      
      // Show error in loading screen
      if (this.loadingScreen) {
        const errorMessage = document.createElement('p');
        errorMessage.style.color = 'red';
        errorMessage.textContent = 'Failed to initialize game. Please check console for details.';
        this.loadingScreen.appendChild(errorMessage);
      }
    }
  }
  
  /**
   * Dispose of the game and all its resources
   */
  public dispose(): void {
    if (this.levelManager) {
      this.levelManager.dispose();
    }
    
    if (this.engine) {
      this.engine.dispose();
    }
  }
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Determine if we're in debug mode
  const isDebug = process.env.NODE_ENV !== 'production';
  
  // Create and start the game
  const game = new PrismGame('renderCanvas', isDebug);
  game.start();
  
  // Handle window unload to clean up resources
  window.addEventListener('beforeunload', () => {
    game.dispose();
  });
});
