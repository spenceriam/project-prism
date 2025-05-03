/**
 * HUD - Heads-Up Display for Project Prism Protocol
 * 
 * Handles all in-game UI elements including:
 * - Health display
 * - Ammo counter
 * - Objective tracking
 * - Damage indicators
 * - Weapon selection UI
 */

import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { gsap } from 'gsap';

export class HUD {
  private advancedTexture: GUI.AdvancedDynamicTexture;
  private scene: BABYLON.Scene;
  
  // HUD Containers
  private hudContainer: GUI.Container;
  private healthContainer: GUI.StackPanel;
  private ammoContainer: GUI.StackPanel;
  private objectivesContainer: GUI.StackPanel;
  private damageOverlay: GUI.Rectangle;
  private weaponSelectionContainer: GUI.Container;
  private crosshair: GUI.Ellipse;
  
  // HUD Elements
  private healthBar: GUI.Rectangle;
  private healthText: GUI.TextBlock;
  private ammoText: GUI.TextBlock;
  private weaponNameText: GUI.TextBlock;
  private objectivesList: GUI.TextBlock[];
  
  // Animation timelines
  private damageAnimationTimeline: gsap.core.Timeline = gsap.timeline({ paused: true });
  
  constructor(advancedTexture: GUI.AdvancedDynamicTexture, scene: BABYLON.Scene) {
    this.advancedTexture = advancedTexture;
    this.scene = scene;
    this.objectivesList = [];
  }
  
  /**
   * Initialize the HUD
   */
  public initialize(): void {
    // Create main HUD container
    this.hudContainer = new GUI.Container("hudContainer");
    this.hudContainer.width = 1;
    this.hudContainer.height = 1;
    this.advancedTexture.addControl(this.hudContainer);
    
    // Create health display
    this.createHealthDisplay();
    
    // Create ammo display
    this.createAmmoDisplay();
    
    // Create objectives display
    this.createObjectivesDisplay();
    
    // Create damage overlay
    this.createDamageOverlay();
    
    // Create weapon selection UI
    this.createWeaponSelectionUI();
    
    // Create crosshair
    this.createCrosshair();
  }
  
  /**
   * Create health display elements
   */
  private createHealthDisplay(): void {
    // Create health container
    this.healthContainer = new GUI.StackPanel("healthContainer");
    this.healthContainer.width = "220px";
    this.healthContainer.height = "60px";
    this.healthContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.healthContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.healthContainer.left = 20;
    this.healthContainer.top = -20;
    this.hudContainer.addControl(this.healthContainer);
    
    // Health label
    const healthLabel = new GUI.TextBlock("healthLabel");
    healthLabel.text = "HEALTH";
    healthLabel.height = "18px";
    healthLabel.color = "white";
    healthLabel.fontFamily = "monospace";
    healthLabel.fontSize = 14;
    healthLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.healthContainer.addControl(healthLabel);
    
    // Health bar background
    const healthBarBg = new GUI.Rectangle("healthBarBg");
    healthBarBg.width = 1;
    healthBarBg.height = "20px";
    healthBarBg.background = "rgba(0, 0, 0, 0.5)";
    healthBarBg.color = "rgba(255, 255, 255, 0.5)";
    healthBarBg.thickness = 1;
    healthBarBg.cornerRadius = 2;
    this.healthContainer.addControl(healthBarBg);
    
    // Health bar
    this.healthBar = new GUI.Rectangle("healthBar");
    this.healthBar.width = 1;
    this.healthBar.height = "16px";
    this.healthBar.background = "linear-gradient(90deg, #2ecc71, #27ae60)";
    this.healthBar.color = "transparent";
    this.healthBar.thickness = 0;
    this.healthBar.cornerRadius = 1;
    this.healthBar.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.healthBar.left = 2;
    healthBarBg.addControl(this.healthBar);
    
    // Health text
    this.healthText = new GUI.TextBlock("healthText");
    this.healthText.text = "100/100";
    this.healthText.height = "18px";
    this.healthText.color = "white";
    this.healthText.fontFamily = "monospace";
    this.healthText.fontSize = 14;
    this.healthText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.healthContainer.addControl(this.healthText);
  }
  
  /**
   * Create ammo display elements
   */
  private createAmmoDisplay(): void {
    // Create ammo container
    this.ammoContainer = new GUI.StackPanel("ammoContainer");
    this.ammoContainer.width = "220px";
    this.ammoContainer.height = "60px";
    this.ammoContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.ammoContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.ammoContainer.left = -20;
    this.ammoContainer.top = -20;
    this.hudContainer.addControl(this.ammoContainer);
    
    // Weapon name
    this.weaponNameText = new GUI.TextBlock("weaponNameText");
    this.weaponNameText.text = "PP7 STANDARD";
    this.weaponNameText.height = "18px";
    this.weaponNameText.color = "white";
    this.weaponNameText.fontFamily = "monospace";
    this.weaponNameText.fontSize = 14;
    this.weaponNameText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.ammoContainer.addControl(this.weaponNameText);
    
    // Ammo background
    const ammoBg = new GUI.Rectangle("ammoBg");
    ammoBg.width = 1;
    ammoBg.height = "30px";
    ammoBg.background = "rgba(0, 0, 0, 0.5)";
    ammoBg.color = "rgba(255, 255, 255, 0.5)";
    ammoBg.thickness = 1;
    ammoBg.cornerRadius = 2;
    this.ammoContainer.addControl(ammoBg);
    
    // Ammo text
    this.ammoText = new GUI.TextBlock("ammoText");
    this.ammoText.text = "12 | 36";
    this.ammoText.color = "white";
    this.ammoText.fontFamily = "monospace";
    this.ammoText.fontSize = 18;
    this.ammoText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    ammoBg.addControl(this.ammoText);
  }
  
  /**
   * Create objectives display
   */
  private createObjectivesDisplay(): void {
    // Create objectives container
    this.objectivesContainer = new GUI.StackPanel("objectivesContainer");
    this.objectivesContainer.width = "300px";
    this.objectivesContainer.height = "auto";
    this.objectivesContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.objectivesContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.objectivesContainer.left = 20;
    this.objectivesContainer.top = 20;
    this.objectivesContainer.spacing = 5;
    this.hudContainer.addControl(this.objectivesContainer);
    
    // Objectives header
    const objectivesHeader = new GUI.TextBlock("objectivesHeader");
    objectivesHeader.text = "OBJECTIVES";
    objectivesHeader.height = "20px";
    objectivesHeader.color = "white";
    objectivesHeader.fontFamily = "monospace";
    objectivesHeader.fontSize = 16;
    objectivesHeader.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.objectivesContainer.addControl(objectivesHeader);
    
    // Objectives background
    const objectivesBg = new GUI.Rectangle("objectivesBg");
    objectivesBg.width = 1;
    objectivesBg.height = "auto";
    objectivesBg.paddingBottom = "10px";
    objectivesBg.paddingTop = "10px";
    objectivesBg.background = "rgba(0, 0, 0, 0.5)";
    objectivesBg.color = "rgba(255, 255, 255, 0.5)";
    objectivesBg.thickness = 1;
    objectivesBg.cornerRadius = 2;
    this.objectivesContainer.addControl(objectivesBg);
    
    // Objectives stack panel (inside background)
    const objectivesStack = new GUI.StackPanel("objectivesStack");
    objectivesStack.width = 1;
    objectivesStack.height = "auto";
    objectivesStack.spacing = 5;
    objectivesStack.paddingLeft = "10px";
    objectivesStack.paddingRight = "10px";
    objectivesBg.addControl(objectivesStack);
    
    // Add placeholder objective
    const placeholderObjective = new GUI.TextBlock("objective0");
    placeholderObjective.text = "• Complete training course";
    placeholderObjective.height = "20px";
    placeholderObjective.color = "white";
    placeholderObjective.fontFamily = "monospace";
    placeholderObjective.fontSize = 14;
    placeholderObjective.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    objectivesStack.addControl(placeholderObjective);
    
    this.objectivesList.push(placeholderObjective);
  }
  
  /**
   * Create damage overlay for visual feedback
   */
  private createDamageOverlay(): void {
    // Create damage overlay
    this.damageOverlay = new GUI.Rectangle("damageOverlay");
    this.damageOverlay.width = 1;
    this.damageOverlay.height = 1;
    this.damageOverlay.background = "rgba(255, 0, 0, 0)";
    this.damageOverlay.thickness = 0;
    this.damageOverlay.isPointerBlocker = false;
    this.hudContainer.addControl(this.damageOverlay);
    
    // Initialize GSAP timeline for damage animation
    this.damageAnimationTimeline = gsap.timeline({ paused: true });
    this.damageAnimationTimeline.to(this.damageOverlay, { 
      background: "rgba(255, 0, 0, 0.3)",
      duration: 0.1,
      ease: "power2.in"
    }).to(this.damageOverlay, {
      background: "rgba(255, 0, 0, 0)",
      duration: 0.5,
      ease: "power2.out"
    });
  }
  
  /**
   * Create weapon selection UI
   */
  private createWeaponSelectionUI(): void {
    // Create weapon selection container
    this.weaponSelectionContainer = new GUI.Container("weaponSelectionContainer");
    this.weaponSelectionContainer.width = "400px";
    this.weaponSelectionContainer.height = "100px";
    this.weaponSelectionContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.weaponSelectionContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.weaponSelectionContainer.top = -100;
    this.weaponSelectionContainer.isVisible = false;
    this.hudContainer.addControl(this.weaponSelectionContainer);
    
    // Weapon selection background
    const weaponSelectionBg = new GUI.Rectangle("weaponSelectionBg");
    weaponSelectionBg.width = 1;
    weaponSelectionBg.height = 1;
    weaponSelectionBg.background = "rgba(0, 0, 0, 0.7)";
    weaponSelectionBg.color = "rgba(255, 255, 255, 0.5)";
    weaponSelectionBg.thickness = 1;
    weaponSelectionBg.cornerRadius = 5;
    this.weaponSelectionContainer.addControl(weaponSelectionBg);
    
    // Weapon selection will be populated dynamically when needed
  }
  
  /**
   * Create crosshair
   */
  private createCrosshair(): void {
    // Create crosshair
    this.crosshair = new GUI.Ellipse("crosshair");
    this.crosshair.width = "6px";
    this.crosshair.height = "6px";
    this.crosshair.background = "white";
    this.crosshair.thickness = 0;
    this.crosshair.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.crosshair.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    this.hudContainer.addControl(this.crosshair);
  }
  
  /**
   * Update HUD elements
   * @param deltaTime Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    // Update animations or dynamic elements if needed
  }
  
  /**
   * Update player health display
   * @param currentHealth Current health value
   * @param maxHealth Maximum health value
   */
  public updateHealth(currentHealth: number, maxHealth: number): void {
    // Update health bar width
    const healthPercentage = Math.max(0, Math.min(1, currentHealth / maxHealth));
    this.healthBar.width = healthPercentage;
    
    // Update health text
    this.healthText.text = `${currentHealth}/${maxHealth}`;
    
    // Update health bar color based on health percentage
    if (healthPercentage > 0.6) {
      this.healthBar.background = "linear-gradient(90deg, #2ecc71, #27ae60)";
    } else if (healthPercentage > 0.3) {
      this.healthBar.background = "linear-gradient(90deg, #f39c12, #d35400)";
    } else {
      this.healthBar.background = "linear-gradient(90deg, #e74c3c, #c0392b)";
    }
  }
  
  /**
   * Update weapon and ammo information
   * @param weaponName Name of current weapon
   * @param currentAmmo Current ammo in magazine
   * @param reserveAmmo Reserve ammo available
   */
  public updateAmmo(weaponName: string, currentAmmo: number, reserveAmmo: number): void {
    this.weaponNameText.text = weaponName.toUpperCase();
    this.ammoText.text = `${currentAmmo} | ${reserveAmmo}`;
  }
  
  /**
   * Update objective information
   * @param objectives List of objectives with completion status
   */
  public updateObjectives(objectives: {text: string, completed: boolean}[]): void {
    // Clear existing objectives
    this.objectivesList.forEach(obj => obj.dispose());
    this.objectivesList = [];
    
    // Get the objectives stack panel
    const objectivesStack = this.objectivesContainer.children[1].children[0] as GUI.StackPanel;
    
    // Add new objectives
    objectives.forEach((objective, index) => {
      const objectiveText = new GUI.TextBlock(`objective${index}`);
      objectiveText.text = `• ${objective.text}`;
      objectiveText.height = "20px";
      objectiveText.color = objective.completed ? "#2ecc71" : "white";
      objectiveText.fontFamily = "monospace";
      objectiveText.fontSize = 14;
      objectiveText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      
      // Add strikethrough for completed objectives
      if (objective.completed) {
        objectiveText.textDecoration = "line-through";
      }
      
      objectivesStack.addControl(objectiveText);
      this.objectivesList.push(objectiveText);
    });
  }
  
  /**
   * Show damage indicator when player is hit
   * @param damageAmount Amount of damage taken
   * @param direction Direction of damage source (optional)
   */
  public showDamageIndicator(damageAmount: number, direction?: BABYLON.Vector3): void {
    // Reset and play damage animation
    this.damageAnimationTimeline.restart();
    
    // TODO: Implement directional damage indicator if direction is provided
  }
  
  /**
   * Show weapon selection UI
   * @param weapons Array of available weapons
   * @param currentIndex Index of currently selected weapon
   */
  public showWeaponSelection(weapons: {name: string, ammo: number, reserve: number}[], currentIndex: number): void {
    // Clear existing weapon selection UI
    const weaponSelectionBg = this.weaponSelectionContainer.children[0] as GUI.Rectangle;
    weaponSelectionBg.clearControls();
    
    // Create weapon selection grid
    const weaponGrid = new GUI.Grid("weaponGrid");
    weaponGrid.width = 1;
    weaponGrid.height = 1;
    weaponGrid.addColumnDefinition(1/weapons.length, true);
    weaponGrid.addRowDefinition(1, true);
    weaponSelectionBg.addControl(weaponGrid);
    
    // Add weapons to grid
    weapons.forEach((weapon, index) => {
      // Create weapon container
      const weaponContainer = new GUI.StackPanel(`weapon${index}Container`);
      weaponContainer.width = 1;
      weaponContainer.height = 1;
      weaponContainer.spacing = 5;
      
      // Highlight current weapon
      if (index === currentIndex) {
        const highlight = new GUI.Rectangle(`weapon${index}Highlight`);
        highlight.width = 1;
        highlight.height = 1;
        highlight.background = "rgba(52, 152, 219, 0.3)";
        highlight.thickness = 2;
        highlight.color = "#3498db";
        highlight.cornerRadius = 3;
        weaponContainer.addControl(highlight);
      }
      
      // Weapon name
      const weaponName = new GUI.TextBlock(`weapon${index}Name`);
      weaponName.text = weapon.name.toUpperCase();
      weaponName.height = "20px";
      weaponName.color = index === currentIndex ? "#3498db" : "white";
      weaponName.fontFamily = "monospace";
      weaponName.fontSize = 14;
      weaponContainer.addControl(weaponName);
      
      // Weapon ammo
      const weaponAmmo = new GUI.TextBlock(`weapon${index}Ammo`);
      weaponAmmo.text = `${weapon.ammo} | ${weapon.reserve}`;
      weaponAmmo.height = "20px";
      weaponAmmo.color = index === currentIndex ? "#3498db" : "#bdc3c7";
      weaponAmmo.fontFamily = "monospace";
      weaponAmmo.fontSize = 12;
      weaponContainer.addControl(weaponAmmo);
      
      // Add to grid
      weaponGrid.addControl(weaponContainer, 0, index);
    });
    
    // Show weapon selection
    this.weaponSelectionContainer.isVisible = true;
    
    // Hide after delay
    setTimeout(() => {
      this.weaponSelectionContainer.isVisible = false;
    }, 2000);
  }
  
  /**
   * Show the HUD
   */
  public show(): void {
    this.hudContainer.isVisible = true;
  }
  
  /**
   * Hide the HUD
   */
  public hide(): void {
    this.hudContainer.isVisible = false;
  }
  
  /**
   * Fade in the HUD
   * @param duration Fade duration in seconds
   */
  public fadeIn(duration: number = 0.5): void {
    gsap.to(this.hudContainer, { alpha: 1, duration });
  }
  
  /**
   * Fade out the HUD
   * @param duration Fade duration in seconds
   */
  public fadeOut(duration: number = 0.5): void {
    gsap.to(this.hudContainer, { alpha: 0.3, duration });
  }
  
  /**
   * Clean up HUD resources
   */
  public dispose(): void {
    this.hudContainer.dispose();
  }
}
