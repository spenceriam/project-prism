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
  
  constructor(scene: BABYLON.Scene, engine: BABYLON.Engine) {
    this.scene = scene;
    this.engine = engine;
    this.canvas = engine.getRenderingCanvas() as HTMLCanvasElement;
    
    // Create fullscreen UI
    this.advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
    this.advancedTexture.renderScale = 1.0;
    
    // Initialize UI components
    this.hud = new HUD(this.advancedTexture, scene);
    this.menuSystem = new MenuSystem(this.advancedTexture, scene, this);
    this.dialogSystem = new DialogSystem(this.advancedTexture, scene);
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Initialize the UI system
   */
  public initialize(): void {
    // Initialize HUD
    this.hud.initialize();
    
    // Initialize menu system but keep it hidden
    this.menuSystem.initialize();
    this.menuSystem.hide();
    
    // Initialize dialog system but keep it hidden
    this.dialogSystem.initialize();
    this.dialogSystem.hide();
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
  public showMainMenu(): void {
    this.isMenuActive = true;
    this.menuSystem.showMainMenu();
    this.hud.hide();
  }
  
  /**
   * Start the game and hide menus
   */
  public startGame(): void {
    this.isMenuActive = false;
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
    this.advancedTexture.dispose();
  }
}
