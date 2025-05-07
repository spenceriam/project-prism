import { GameEngine } from './core/engine';
import { AssetLoader } from './utils/loader';
import { LevelManager, LevelType } from './core/level-manager';
import { PlayerController } from './components/player/playerController';
import { UIManager } from './ui/ui-manager';
import './styles.css';
import "@babylonjs/inspector";

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
   * Hide the loading screen
   */
  private hideLoadingScreen(): void {
    if (this.loadingScreen) {
      console.log('Hiding loading screen after assets are loaded');
      
      // Set loading progress to 100%
      if (this.loadingProgress) {
        this.loadingProgress.style.width = '100%';
      }
      
      // Add animation to the loading screen elements
      const loadingTitle = document.querySelector('.loading-text-title');
      if (loadingTitle instanceof HTMLElement) {
        loadingTitle.style.transition = 'transform 0.5s ease-in-out';
        loadingTitle.style.color = '#FFFFFF'; // Keep it white
        loadingTitle.style.transform = 'scale(1.1)';
      }
      
      // Fade out the subtitle and loading bar
      const loadingSubtitle = document.querySelector('.loading-text-subtitle');
      if (loadingSubtitle instanceof HTMLElement) {
        loadingSubtitle.style.transition = 'opacity 1.5s ease-out';
        loadingSubtitle.style.opacity = '0';
      }
      
      const loadingBarContainer = document.querySelector('.loading-bar');
      if (loadingBarContainer instanceof HTMLElement) {
        loadingBarContainer.style.transition = 'opacity 1.5s ease-out';
        loadingBarContainer.style.opacity = '0';
      }
      
      // Pulse animation for the loading bar before it fades
      if (this.loadingProgress instanceof HTMLElement) {
        this.loadingProgress.style.transition = 'background-color 0.5s ease-in-out, opacity 1.5s ease-out';
        this.loadingProgress.style.backgroundColor = '#00E0D0';
      }
      
      // Add a 7-second delay before hiding the loading screen
      // This gives time for the LION MYSTIC logo to be prominently displayed
      setTimeout(() => {
        console.log('Delay complete, now transitioning loading screen with blur effect');
        
        // Create blur transition effect
        this.createPixelationEffect();
        
      }, 7000); // 7-second delay
    } else {
      console.log('Loading screen element not found');
    }
  }
  
  /**
   * Create a blur transition effect
   * This creates a smooth blur transition from the loading screen to the main menu
   */
  private createPixelationEffect(): void {
    // Renamed for backward compatibility, but now implements blur effect
    this.createBlurTransition();
  }
  
  /**
   * Create a blur transition effect
   * This creates a smooth blur transition from the loading screen to the main menu
   */
  private createBlurTransition(): void {
    // Get the blur container
    const blurContainer = document.getElementById('blurContainer');
    if (!blurContainer) {
      console.error('Blur container not found');
      this.cleanupLoadingScreen();
      return;
    }
    
    // Make the container visible
    blurContainer.style.display = 'block';
    
    // Hide the original loading screen immediately
    if (this.loadingScreen) {
      this.loadingScreen.style.opacity = '0';
      
      // Remove the loading screen after it fades out
      setTimeout(() => {
        if (this.loadingScreen && this.loadingScreen.parentNode) {
          this.loadingScreen.parentNode.removeChild(this.loadingScreen);
        }
      }, 500);
    }
    
    // Start with no blur
    blurContainer.style.filter = 'blur(0px)';
    
    // First phase: increase blur
    setTimeout(() => {
      blurContainer.style.filter = 'blur(20px)';
      
      // Second phase: fade out while blurred
      setTimeout(() => {
        blurContainer.style.opacity = '0';
        
        // Finally clean up after the transition completes
        setTimeout(() => {
          this.cleanupBlurEffect(blurContainer);
        }, 1000); // Wait for opacity transition to complete
      }, 800); // Time before starting to fade out
    }, 400); // Time before applying blur
  }
  
  /**
   * Clean up the blur effect
   */
  private cleanupBlurEffect(blurContainer: HTMLElement): void {
    // Reset and hide the container
    blurContainer.style.filter = 'blur(0px)';
    blurContainer.style.opacity = '1';
    blurContainer.style.display = 'none';
  }
  
  /**
   * Clean up and remove the loading screen from the DOM
   */
  private cleanupLoadingScreen(): void {
    if (this.loadingScreen && this.loadingScreen.parentNode) {
      console.log('Removing loading screen from DOM');
      this.loadingScreen.parentNode.removeChild(this.loadingScreen);
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
      this.levelManager.setOnLevelLoadedCallback(async () => {
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

          // Show the main menu after loading
          await this.uiManager.showMainMenu();
        }
      });
      
      // Set up UI event handlers first
      this.uiManager.onStartGame = async () => {
        // Load the level when the user clicks Play
        await this.levelManager.loadLevel(LevelType.SIMPLE_PRIMITIVE_TRAINING);
        // Start gameplay after level is loaded
        this.startGameplay();
      };
      
      this.uiManager.onQuitGame = () => {
        window.close();
      };
      
      // Make sure UI is fully initialized before showing main menu
      console.log('Ensuring UI is initialized before showing main menu');
      
      // Then explicitly show the main menu with a delay to ensure everything is initialized
      setTimeout(async () => {
        console.log('Explicitly showing main menu after initialization');
        if (this.uiManager) {
          // Force the menu to be visible
          try {
            this.hideLoadingScreen();
            await this.uiManager.showMainMenu();
            console.log('Main menu display triggered');
          } catch (error) {
            console.error('Error showing main menu in timeout:', error);
          }
        }
      }, 500);
      
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
