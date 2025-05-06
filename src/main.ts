import { GameEngine } from './core/engine';
import { AssetLoader } from './utils/loader';
import { LevelManager, LevelType } from './core/level-manager';
import { PlayerController } from './components/player/playerController';
import { UIManager } from './ui/ui-manager';
import './styles.css';

/**
 * Project Prism Protocol - Main Entry Point
 * A browser-based FPS game inspired by GoldenEye 64, built using Babylon.js
 */
class PrismGame {
  private engine: GameEngine;
  private assetLoader: AssetLoader;
  private levelManager: LevelManager;
  private playerController: PlayerController | null = null;
  private uiManager: UIManager;
  private loadingScreen: HTMLElement | null;
  private loadingProgress: HTMLElement | null;
  private isDebug: boolean;
  private gameStarted: boolean = false;

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
    
    // Initialize UI manager
    this.uiManager = new UIManager(this.engine.getScene(), this.engine.getEngine());
    this.uiManager.initialize();
    
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
   * Hide the loading screen and show the main menu
   */
  private hideLoadingScreen(): void {
    if (this.loadingScreen) {
      this.loadingScreen.style.opacity = '0';
      setTimeout(() => {
        if (this.loadingScreen) {
          this.loadingScreen.style.display = 'none';
          
          // Show main menu if game hasn't started yet
          if (!this.gameStarted) {
            this.uiManager.showMainMenu();
          }
        }
      }, 500);
    }
  }
  
  /**
   * Start the game
   */
  public async start(): Promise<void> {
    try {
      // Add click handler to request pointer lock only when game is active
      const canvas = this.engine.getCanvas();
      canvas.addEventListener('click', () => {
        // Only request pointer lock if game has started and we're not in a menu
        if (this.gameStarted && !this.uiManager.checkMenuActive() && document.pointerLockElement !== canvas) {
          console.log('Canvas clicked, requesting pointer lock');
          canvas.requestPointerLock = canvas.requestPointerLock || 
                                     (canvas as any).mozRequestPointerLock || 
                                     (canvas as any).webkitRequestPointerLock;
          canvas.requestPointerLock();
        }
      });
      
      // Prevent context menu on right-click
      canvas.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        return false;
      });
      
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
          
          // Initialize player controller if it doesn't exist yet
          if (!this.playerController) {
            console.log('Initializing PlayerController...');
            this.playerController = new PlayerController(
              this.engine.getScene(),
              spawnPosition,
              {
                walkSpeed: 5.0,
                sprintSpeed: 8.0,
                crouchSpeed: 2.5,
                jumpForce: 8.0,
                lookSensitivity: 0.1,
                maxLookAngle: 85
              }
            );
          } else {
            // Teleport existing player to spawn position
            this.playerController.teleport(spawnPosition);
          }
          
          // Set up UI manager with player controller
          this.uiManager.setPlayerController(this.playerController);
          
          // Hide loading screen when level is ready
          this.hideLoadingScreen();
        }
      });
      
      // Load the Simple Primitive Training Facility level in the background
      // We'll start the actual gameplay when the user clicks Play
      // Using simplified primitive models for development until GoldenEye 64-style assets are available
      await this.levelManager.loadLevel(LevelType.SIMPLE_PRIMITIVE_TRAINING);
      
      // Set up UI event handlers
      this.uiManager.onStartGame = () => {
        this.startGameplay();
      };
      
      this.uiManager.onQuitGame = () => {
        window.close();
      };
      
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
   * Start the actual gameplay
   */
  private startGameplay(): void {
    this.gameStarted = true;
    
    // Show the HUD
    this.uiManager.startGame();
    
    // Enable player controller
    if (this.playerController) {
      this.playerController.enable();
      
      // Request pointer lock for immersive gameplay
      const canvas = this.engine.getCanvas();
      canvas.requestPointerLock = canvas.requestPointerLock || 
                                (canvas as any).mozRequestPointerLock || 
                                (canvas as any).webkitRequestPointerLock;
      canvas.requestPointerLock();
    }
  }
  
  /**
   * Dispose of the game and all its resources
   */
  public dispose(): void {
    if (this.playerController) {
      this.playerController.dispose();
      this.playerController = null;
    }
    
    if (this.uiManager) {
      this.uiManager.dispose();
    }
    
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
