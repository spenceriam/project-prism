/**
 * UI Manager - Core UI management system for Project Prism Protocol
 * 
 * Handles the creation, management, and interaction of all UI elements
 * including HUD, menus, and feedback systems.
 */

import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { gsap } from 'gsap';
import { HUD } from './hud';
import { MenuSystem } from './menus';
import { DialogSystem } from './dialogs';
import { PlayerController } from '../components/player/playerController';
import { CodeBackgroundEffect } from '../utils/codeBackgroundEffect';

export class UIManager {
  private scene: BABYLON.Scene;
  private engine: BABYLON.Engine;
  private canvas: HTMLCanvasElement;
  
  // UI Layers
  private advancedTexture: GUI.AdvancedDynamicTexture;
  
  // UI Components
  private hud: HUD;
  private menuSystem: MenuSystem;
  private dialogSystem: DialogSystem;
  
  // UI State
  private isMenuActive: boolean = false;
  private isGamePaused: boolean = false;
  
  // Player reference
  private playerController: PlayerController | null = null;
  
  // Background effects
  private codeBackgroundEffect: CodeBackgroundEffect | null = null;
  
  // Event callbacks
  public onStartGame: (() => void) | null = null;
  public onQuitGame: (() => void) | null = null;
  
  constructor(scene: BABYLON.Scene, engine: BABYLON.Engine) {
    try {
      console.log('Initializing UIManager...');
      this.scene = scene;
      this.engine = engine;
      this.canvas = engine.getRenderingCanvas() as HTMLCanvasElement;
      
      // Create fullscreen UI
      console.log('Creating AdvancedDynamicTexture...');
      this.advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
      this.advancedTexture.renderScale = 1.0;
      this.advancedTexture.useInvalidateRectOptimization = false; // Disable optimization for debugging
      this.advancedTexture.premulAlpha = false; // Try different alpha blending
      
      console.log('Creating DialogSystem...');
      this.dialogSystem = new DialogSystem(this.advancedTexture, scene);
      
      console.log('Creating HUD...');
      this.hud = new HUD(this.advancedTexture, scene);
      
      console.log('Creating MenuSystem...');
      this.menuSystem = new MenuSystem(this.advancedTexture, scene, this, this.dialogSystem);
      
      // Set up event listeners
      this.setupEventListeners();
      console.log('UIManager initialization complete');
    } catch (error) {
      console.error('Error initializing UIManager:', error);
    }
  }
  
  /**
   * Initialize the UI system
   */
  public initialize(): void {
    try {
      console.log('Initializing UI components...');
      
      // Initialize HUD
      console.log('Initializing HUD...');
      this.hud.initialize();
      
      // Initialize menu system but keep it hidden
      console.log('Initializing MenuSystem...');
      this.menuSystem.initialize();
      
      // Initialize dialog system but keep it hidden
      console.log('Initializing DialogSystem...');
      
      // Initialize code background effect
      console.log('Initializing Code Background Effect...');
      try {
        // Create a new code background effect
        this.codeBackgroundEffect = new CodeBackgroundEffect('codeBackground');
        
        // Make sure it's visible with higher opacity
        this.codeBackgroundEffect.setOpacity(0.8);
        
        // Start the effect with a 7-second delay for the loading screen
        this.codeBackgroundEffect.start(7000); // 7000ms = 7 seconds
        
        console.log('Code background effect started successfully');
      } catch (error) {
        console.error('Error initializing code background effect:', error);
        // Continue even if background effect fails
      }
      this.dialogSystem.initialize();
      this.dialogSystem.hide();
      
      console.log('UI initialization complete');
    } catch (error) {
      console.error('Error during UI initialization:', error);
    }
  }
  
  /**
   * Update UI elements
   * @param deltaTime Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    // Update HUD if game is active
    if (!this.isMenuActive) {
      this.hud.update(deltaTime);
    }
    
    // Update menus if active
    if (this.isMenuActive) {
      this.menuSystem.update(deltaTime);
    }
    
    // Always update dialogs as they can appear over anything
    this.dialogSystem.update(deltaTime);
  }
  
  /**
   * Set up event listeners for UI interactions
   */
  private setupEventListeners(): void {
    // Listen for escape key to toggle pause menu
    window.addEventListener("keydown", (evt) => {
      if (evt.key === "Escape") {
        this.togglePauseMenu();
      }
    });
    
    // Listen for window resize to update UI scaling
    window.addEventListener("resize", () => {
      this.advancedTexture.markAsDirty();
    });
  }
  
  /**
   * Toggle the pause menu
   */
  public togglePauseMenu(): void {
    this.isMenuActive = !this.isMenuActive;
    
    if (this.isMenuActive) {
      // Show pause menu
      this.menuSystem.showPauseMenu();
      this.hud.fadeOut(0.3);
      this.isGamePaused = true;
      this.scene.onBeforeRenderObservable.hasObservers() && this.scene.onBeforeRenderObservable.clear();
    } else {
      // Hide pause menu
      this.menuSystem.hide();
      this.hud.fadeIn(0.3);
      this.isGamePaused = false;
      this.scene.onBeforeRenderObservable.add(() => this.update(this.engine.getDeltaTime() / 1000));
    }
  }
  
  /**
   * Show the main menu
   */
  public async showMainMenu(): Promise<void> {
    try {
      console.log('UIManager.showMainMenu() called');
      console.log('Current UI state - isMenuActive:', this.isMenuActive);
      this.isMenuActive = true;
      
      // Check if AdvancedDynamicTexture is initialized
      if (!this.advancedTexture) {
        console.error('AdvancedDynamicTexture is not initialized');
        return;
      }
      console.log('AdvancedDynamicTexture exists:', !!this.advancedTexture);
      
      if (!this.menuSystem) {
        console.error('MenuSystem is not initialized');
        return;
      }
      console.log('MenuSystem exists:', !!this.menuSystem);
      
      // Ensure the code background effect is visible and running
      if (this.codeBackgroundEffect) {
        console.log('Ensuring code background effect is visible');
        
        // Force the canvas element to be visible with inline styles
        const canvasElement = document.getElementById('codeBackground') as HTMLCanvasElement;
        if (canvasElement) {
          canvasElement.style.display = 'block';
          canvasElement.style.position = 'fixed';
          canvasElement.style.top = '0';
          canvasElement.style.left = '0';
          canvasElement.style.width = '100%';
          canvasElement.style.height = '100%';
          canvasElement.style.zIndex = '1';
          canvasElement.style.opacity = '0.8';
          canvasElement.style.pointerEvents = 'none';
          console.log('Code background canvas is now visible with forced styles');
        }
        
        // Completely restart the effect
        this.codeBackgroundEffect.stop();
        setTimeout(() => {
          if (this.codeBackgroundEffect) {
            this.codeBackgroundEffect.start(7000); // 7-second delay
            this.codeBackgroundEffect.setOpacity(0.8);
            console.log('Code background effect restarted with high opacity');
          }
        }, 100);
      } else {
        // If not initialized, create it now
        console.warn('Code background effect not initialized, creating now');
        this.codeBackgroundEffect = new CodeBackgroundEffect('codeBackground');
        this.codeBackgroundEffect.setOpacity(0.8);
        this.codeBackgroundEffect.start(7000); // 7-second delay
      }
      
      // Make sure menu system is visible first
      this.menuSystem.show();
      
      // Now show the main menu
      console.log('Calling menuSystem.showMainMenu()');
      await this.menuSystem.showMainMenu();
      
      if (!this.hud) {
        console.error('HUD is not initialized');
        return;
      }
      
      this.hud.hide();
      
      // Set up menu callbacks
      this.menuSystem.setStartGameCallback(() => {
        if (this.onStartGame) {
          this.onStartGame();
        }
      });
      
      this.menuSystem.setQuitGameCallback(() => {
        if (this.onQuitGame) {
          this.onQuitGame();
        }
      });
      
      console.log('Main menu displayed successfully');
    } catch (error) {
      console.error('Error showing main menu:', error);
    }
  }
  
  /**
   * Check if a menu is currently active
   */
  public checkMenuActive(): boolean {
    return this.isMenuActive;
  }
  
  /**
   * Set the player controller reference
   */
  public setPlayerController(playerController: PlayerController): void {
    this.playerController = playerController;
  }
  
  /**
   * Start the game and hide menus
   */
  public startGame(): void {
    this.isMenuActive = false;
    
    // Stop the code background effect with a fade out
    if (this.codeBackgroundEffect) {
      // Gradually decrease opacity then stop
      this.codeBackgroundEffect.setOpacity(0);
      setTimeout(() => {
        if (this.codeBackgroundEffect) {
          this.codeBackgroundEffect.stop();
        }
      }, 1000);
    }
    
    this.menuSystem.hide();
    this.hud.show();
  }
  
  /**
   * Update player health in HUD
   * @param currentHealth Current health value
   * @param maxHealth Maximum health value
   */
  public updateHealth(currentHealth: number, maxHealth: number): void {
    this.hud.updateHealth(currentHealth, maxHealth);
  }
  
  /**
   * Update weapon and ammo information in HUD
   * @param weaponName Name of current weapon
   * @param currentAmmo Current ammo in magazine
   * @param reserveAmmo Reserve ammo available
   */
  public updateAmmo(weaponName: string, currentAmmo: number, reserveAmmo: number): void {
    this.hud.updateAmmo(weaponName, currentAmmo, reserveAmmo);
  }
  
  /**
   * Update objective information
   * @param objectives List of objectives with completion status
   */
  public updateObjectives(objectives: {text: string, completed: boolean}[]): void {
    this.hud.updateObjectives(objectives);
  }
  
  /**
   * Show damage feedback when player is hit
   * @param damageAmount Amount of damage taken
   * @param direction Direction of damage source (optional)
   */
  public showDamageIndicator(damageAmount: number, direction?: BABYLON.Vector3): void {
    this.hud.showDamageIndicator(damageAmount, direction);
  }
  
  /**
   * Show a dialog message to the player
   * @param message Message text
   * @param duration Duration to show message (in seconds)
   */
  public showMessage(message: string, duration: number = 3): void {
    this.dialogSystem.showMessage(message, duration);
  }
  
  /**
   * Show weapon selection UI
   * @param weapons Array of available weapons
   * @param currentIndex Index of currently selected weapon
   */
  public showWeaponSelection(weapons: {name: string, ammo: number, reserve: number}[], currentIndex: number): void {
    this.hud.showWeaponSelection(weapons, currentIndex);
  }
  
  /**
   * Clean up UI resources
   */
  public dispose(): void {
    this.hud.dispose();
    this.menuSystem.dispose();
    this.dialogSystem.dispose();
    
    // Clear callbacks
    this.onStartGame = null;
    this.onQuitGame = null;
    this.playerController = null;
    this.advancedTexture.dispose();
  }
}
