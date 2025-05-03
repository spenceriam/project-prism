import { GameEngine } from './core/engine';
import { AssetLoader } from './utils/loader';
import './styles.css';

/**
 * Project Prism Protocol - Main Entry Point
 * A browser-based FPS game inspired by GoldenEye 64, built using Babylon.js
 */
class PrismGame {
  private engine: GameEngine;
  private assetLoader: AssetLoader;
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
      // Example: Load test models (replace with actual game assets later)
      // In a real implementation, we would load models based on the current level
      
      // Start the render loop
      this.engine.startRenderLoop();
      
      // Hide loading screen when ready
      this.hideLoadingScreen();
      
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
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Determine if we're in debug mode
  const isDebug = process.env.NODE_ENV !== 'production';
  
  // Create and start the game
  const game = new PrismGame('renderCanvas', isDebug);
  game.start();
});
