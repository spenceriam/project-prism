/**
 * Menu System - Interactive menu system for Project Prism Protocol
 * 
 * Handles all game menus including:
 * - Main menu
 * - Pause menu
 * - Options menu
 * - Game over screen
 */

import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { gsap } from 'gsap';
import { UIManager } from './ui-manager';

export class MenuSystem {
  private advancedTexture: GUI.AdvancedDynamicTexture;
  private scene: BABYLON.Scene;
  private uiManager: UIManager;
  
  // Menu containers
  private menuContainer: GUI.Container;
  private mainMenuContainer: GUI.Container;
  private pauseMenuContainer: GUI.Container;
  private optionsMenuContainer: GUI.Container;
  private gameOverContainer: GUI.Container;
  
  // Menu state
  private activeMenu: string = "";
  
  constructor(advancedTexture: GUI.AdvancedDynamicTexture, scene: BABYLON.Scene, uiManager: UIManager) {
    this.advancedTexture = advancedTexture;
    this.scene = scene;
    this.uiManager = uiManager;
  }
  
  /**
   * Initialize the menu system
   */
  public initialize(): void {
    // Create main container for all menus
    this.menuContainer = new GUI.Container("menuContainer");
    this.menuContainer.width = 1;
    this.menuContainer.height = 1;
    this.advancedTexture.addControl(this.menuContainer);
    
    // Create each menu type
    this.createMainMenu();
    this.createPauseMenu();
    this.createOptionsMenu();
    this.createGameOverScreen();
    
    // Hide all menus initially
    this.hideAllMenus();
  }
  
  /**
   * Create main menu
   */
  private createMainMenu(): void {
    // Create main menu container
    this.mainMenuContainer = new GUI.Container("mainMenuContainer");
    this.mainMenuContainer.width = 1;
    this.mainMenuContainer.height = 1;
    this.menuContainer.addControl(this.mainMenuContainer);
    
    // Semi-transparent background
    const background = new GUI.Rectangle("mainMenuBackground");
    background.width = 1;
    background.height = 1;
    background.background = "rgba(0, 0, 0, 0.7)";
    background.thickness = 0;
    this.mainMenuContainer.addControl(background);
    
    // Title panel
    const titlePanel = new GUI.StackPanel("titlePanel");
    titlePanel.width = "600px";
    titlePanel.height = "auto";
    titlePanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    titlePanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    titlePanel.top = 100;
    this.mainMenuContainer.addControl(titlePanel);
    
    // Game title
    const titleText = new GUI.TextBlock("titleText");
    titleText.text = "PROJECT PRISM PROTOCOL";
    titleText.height = "80px";
    titleText.color = "white";
    titleText.fontFamily = "monospace";
    titleText.fontSize = 48;
    titleText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    titlePanel.addControl(titleText);
    
    // Subtitle
    const subtitleText = new GUI.TextBlock("subtitleText");
    subtitleText.text = "A BROWSER-BASED FPS EXPERIENCE";
    subtitleText.height = "30px";
    subtitleText.color = "#bdc3c7";
    subtitleText.fontFamily = "monospace";
    subtitleText.fontSize = 18;
    subtitleText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    titlePanel.addControl(subtitleText);
    
    // Menu buttons panel
    const menuButtonsPanel = new GUI.StackPanel("menuButtonsPanel");
    menuButtonsPanel.width = "300px";
    menuButtonsPanel.height = "auto";
    menuButtonsPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    menuButtonsPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    menuButtonsPanel.spacing = 20;
    this.mainMenuContainer.addControl(menuButtonsPanel);
    
    // Start Game button
    const startButton = this.createMenuButton("startButton", "START GAME", () => {
      this.uiManager.startGame();
    });
    menuButtonsPanel.addControl(startButton);
    
    // Options button
    const optionsButton = this.createMenuButton("optionsButton", "OPTIONS", () => {
      this.showOptionsMenu();
    });
    menuButtonsPanel.addControl(optionsButton);
    
    // Credits button
    const creditsButton = this.createMenuButton("creditsButton", "CREDITS", () => {
      // TODO: Show credits screen
    });
    menuButtonsPanel.addControl(creditsButton);
    
    // Version info
    const versionText = new GUI.TextBlock("versionText");
    versionText.text = "VERSION 0.1.0 | MAY 2025";
    versionText.height = "20px";
    versionText.color = "#7f8c8d";
    versionText.fontFamily = "monospace";
    versionText.fontSize = 12;
    versionText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    versionText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    versionText.left = -20;
    versionText.top = -20;
    this.mainMenuContainer.addControl(versionText);
  }
  
  /**
   * Create pause menu
   */
  private createPauseMenu(): void {
    // Create pause menu container
    this.pauseMenuContainer = new GUI.Container("pauseMenuContainer");
    this.pauseMenuContainer.width = 1;
    this.pauseMenuContainer.height = 1;
    this.menuContainer.addControl(this.pauseMenuContainer);
    
    // Semi-transparent background
    const background = new GUI.Rectangle("pauseMenuBackground");
    background.width = 1;
    background.height = 1;
    background.background = "rgba(0, 0, 0, 0.5)";
    background.thickness = 0;
    this.pauseMenuContainer.addControl(background);
    
    // Pause title
    const pauseTitle = new GUI.TextBlock("pauseTitle");
    pauseTitle.text = "PAUSED";
    pauseTitle.height = "60px";
    pauseTitle.color = "white";
    pauseTitle.fontFamily = "monospace";
    pauseTitle.fontSize = 36;
    pauseTitle.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    pauseTitle.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    pauseTitle.top = 100;
    this.pauseMenuContainer.addControl(pauseTitle);
    
    // Menu buttons panel
    const pauseButtonsPanel = new GUI.StackPanel("pauseButtonsPanel");
    pauseButtonsPanel.width = "300px";
    pauseButtonsPanel.height = "auto";
    pauseButtonsPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    pauseButtonsPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    pauseButtonsPanel.spacing = 20;
    this.pauseMenuContainer.addControl(pauseButtonsPanel);
    
    // Resume button
    const resumeButton = this.createMenuButton("resumeButton", "RESUME", () => {
      this.uiManager.togglePauseMenu();
    });
    pauseButtonsPanel.addControl(resumeButton);
    
    // Options button
    const optionsButton = this.createMenuButton("pauseOptionsButton", "OPTIONS", () => {
      this.showOptionsMenu();
    });
    pauseButtonsPanel.addControl(optionsButton);
    
    // Main Menu button
    const mainMenuButton = this.createMenuButton("mainMenuButton", "MAIN MENU", () => {
      this.uiManager.showMainMenu();
    });
    pauseButtonsPanel.addControl(mainMenuButton);
  }
  
  /**
   * Create options menu
   */
  private createOptionsMenu(): void {
    // Create options menu container
    this.optionsMenuContainer = new GUI.Container("optionsMenuContainer");
    this.optionsMenuContainer.width = 1;
    this.optionsMenuContainer.height = 1;
    this.menuContainer.addControl(this.optionsMenuContainer);
    
    // Semi-transparent background
    const background = new GUI.Rectangle("optionsMenuBackground");
    background.width = 1;
    background.height = 1;
    background.background = "rgba(0, 0, 0, 0.7)";
    background.thickness = 0;
    this.optionsMenuContainer.addControl(background);
    
    // Options title
    const optionsTitle = new GUI.TextBlock("optionsTitle");
    optionsTitle.text = "OPTIONS";
    optionsTitle.height = "60px";
    optionsTitle.color = "white";
    optionsTitle.fontFamily = "monospace";
    optionsTitle.fontSize = 36;
    optionsTitle.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    optionsTitle.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    optionsTitle.top = 60;
    this.optionsMenuContainer.addControl(optionsTitle);
    
    // Options panel
    const optionsPanel = new GUI.StackPanel("optionsPanel");
    optionsPanel.width = "500px";
    optionsPanel.height = "auto";
    optionsPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    optionsPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    optionsPanel.spacing = 20;
    this.optionsMenuContainer.addControl(optionsPanel);
    
    // Mouse sensitivity option
    const sensitivityPanel = new GUI.StackPanel("sensitivityPanel");
    sensitivityPanel.width = 1;
    sensitivityPanel.height = "80px";
    sensitivityPanel.spacing = 10;
    optionsPanel.addControl(sensitivityPanel);
    
    const sensitivityLabel = new GUI.TextBlock("sensitivityLabel");
    sensitivityLabel.text = "MOUSE SENSITIVITY";
    sensitivityLabel.height = "20px";
    sensitivityLabel.color = "white";
    sensitivityLabel.fontFamily = "monospace";
    sensitivityLabel.fontSize = 16;
    sensitivityLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    sensitivityPanel.addControl(sensitivityLabel);
    
    const sensitivitySlider = new GUI.Slider("sensitivitySlider");
    sensitivitySlider.minimum = 0.1;
    sensitivitySlider.maximum = 2.0;
    sensitivitySlider.value = 1.0;
    sensitivitySlider.height = "20px";
    sensitivitySlider.width = 1;
    sensitivitySlider.color = "#3498db";
    sensitivitySlider.background = "#bdc3c7";
    sensitivitySlider.onValueChangedObservable.add((value: number) => {
      sensitivityValue.text = value.toFixed(2);
      // TODO: Apply sensitivity change
    });
    sensitivityPanel.addControl(sensitivitySlider);
    
    const sensitivityValue = new GUI.TextBlock("sensitivityValue");
    sensitivityValue.text = "1.00";
    sensitivityValue.height = "20px";
    sensitivityValue.color = "#3498db";
    sensitivityValue.fontFamily = "monospace";
    sensitivityValue.fontSize = 16;
    sensitivityValue.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    sensitivityPanel.addControl(sensitivityValue);
    
    // Volume option
    const volumePanel = new GUI.StackPanel("volumePanel");
    volumePanel.width = 1;
    volumePanel.height = "80px";
    volumePanel.spacing = 10;
    optionsPanel.addControl(volumePanel);
    
    const volumeLabel = new GUI.TextBlock("volumeLabel");
    volumeLabel.text = "MASTER VOLUME";
    volumeLabel.height = "20px";
    volumeLabel.color = "white";
    volumeLabel.fontFamily = "monospace";
    volumeLabel.fontSize = 16;
    volumeLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    volumePanel.addControl(volumeLabel);
    
    const volumeSlider = new GUI.Slider("volumeSlider");
    volumeSlider.minimum = 0;
    volumeSlider.maximum = 1.0;
    volumeSlider.value = 0.7;
    volumeSlider.height = "20px";
    volumeSlider.width = 1;
    volumeSlider.color = "#3498db";
    volumeSlider.background = "#bdc3c7";
    volumeSlider.onValueChangedObservable.add((value: number) => {
      volumeValue.text = Math.round(value * 100) + "%";
      // TODO: Apply volume change
    });
    volumePanel.addControl(volumeSlider);
    
    const volumeValue = new GUI.TextBlock("volumeValue");
    volumeValue.text = "70%";
    volumeValue.height = "20px";
    volumeValue.color = "#3498db";
    volumeValue.fontFamily = "monospace";
    volumeValue.fontSize = 16;
    volumeValue.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    volumePanel.addControl(volumeValue);
    
    // Back button
    const backButton = this.createMenuButton("optionsBackButton", "BACK", () => {
      if (this.activeMenu === "mainMenu") {
        this.showMainMenu();
      } else if (this.activeMenu === "pauseMenu") {
        this.showPauseMenu();
      }
    });
    backButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    backButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    backButton.top = -60;
    this.optionsMenuContainer.addControl(backButton);
  }
  
  /**
   * Create game over screen
   */
  private createGameOverScreen(): void {
    // Create game over container
    this.gameOverContainer = new GUI.Container("gameOverContainer");
    this.gameOverContainer.width = 1;
    this.gameOverContainer.height = 1;
    this.menuContainer.addControl(this.gameOverContainer);
    
    // Dark background
    const background = new GUI.Rectangle("gameOverBackground");
    background.width = 1;
    background.height = 1;
    background.background = "rgba(0, 0, 0, 0.8)";
    background.thickness = 0;
    this.gameOverContainer.addControl(background);
    
    // Game over text
    const gameOverText = new GUI.TextBlock("gameOverText");
    gameOverText.text = "MISSION FAILED";
    gameOverText.height = "80px";
    gameOverText.color = "#e74c3c";
    gameOverText.fontFamily = "monospace";
    gameOverText.fontSize = 48;
    gameOverText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    gameOverText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    gameOverText.top = -100;
    this.gameOverContainer.addControl(gameOverText);
    
    // Buttons panel
    const gameOverButtonsPanel = new GUI.StackPanel("gameOverButtonsPanel");
    gameOverButtonsPanel.width = "300px";
    gameOverButtonsPanel.height = "auto";
    gameOverButtonsPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    gameOverButtonsPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    gameOverButtonsPanel.top = 50;
    gameOverButtonsPanel.spacing = 20;
    this.gameOverContainer.addControl(gameOverButtonsPanel);
    
    // Retry button
    const retryButton = this.createMenuButton("retryButton", "RETRY MISSION", () => {
      // TODO: Restart current level
      this.hide();
    });
    gameOverButtonsPanel.addControl(retryButton);
    
    // Main menu button
    const mainMenuButton = this.createMenuButton("gameOverMainMenuButton", "MAIN MENU", () => {
      this.uiManager.showMainMenu();
    });
    gameOverButtonsPanel.addControl(mainMenuButton);
  }
  
  /**
   * Create a standard menu button
   * @param name Button name
   * @param text Button text
   * @param callback Function to call when button is clicked
   * @returns Button control
   */
  private createMenuButton(name: string, text: string, callback: () => void): GUI.Button {
    const button = new GUI.Button(name);
    button.width = "300px";
    button.height = "50px";
    button.thickness = 0;
    button.cornerRadius = 5;
    
    // Button background
    const buttonBackground = new GUI.Rectangle(`${name}Background`);
    buttonBackground.width = 1;
    buttonBackground.height = 1;
    buttonBackground.background = "rgba(52, 152, 219, 0.2)";
    buttonBackground.color = "#3498db";
    buttonBackground.thickness = 2;
    buttonBackground.cornerRadius = 5;
    button.addControl(buttonBackground);
    
    // Button text
    const buttonText = new GUI.TextBlock(`${name}Text`);
    buttonText.text = text;
    buttonText.color = "white";
    buttonText.fontFamily = "monospace";
    buttonText.fontSize = 18;
    button.addControl(buttonText);
    
    // Button hover effect
    button.onPointerEnterObservable.add(() => {
      buttonBackground.background = "rgba(52, 152, 219, 0.4)";
      buttonText.color = "#3498db";
      gsap.to(button, { width: "320px", duration: 0.2 });
    });
    
    button.onPointerOutObservable.add(() => {
      buttonBackground.background = "rgba(52, 152, 219, 0.2)";
      buttonText.color = "white";
      gsap.to(button, { width: "300px", duration: 0.2 });
    });
    
    // Button click effect
    button.onPointerDownObservable.add(() => {
      buttonBackground.background = "rgba(52, 152, 219, 0.6)";
    });
    
    button.onPointerUpObservable.add(() => {
      buttonBackground.background = "rgba(52, 152, 219, 0.4)";
      callback();
    });
    
    return button;
  }
  
  /**
   * Update menu animations
   * @param deltaTime Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    // Update animations or dynamic elements if needed
  }
  
  /**
   * Show the main menu
   */
  public showMainMenu(): void {
    this.hideAllMenus();
    this.mainMenuContainer.isVisible = true;
    this.activeMenu = "mainMenu";
  }
  
  /**
   * Show the pause menu
   */
  public showPauseMenu(): void {
    this.hideAllMenus();
    this.pauseMenuContainer.isVisible = true;
    this.activeMenu = "pauseMenu";
  }
  
  /**
   * Show the options menu
   */
  public showOptionsMenu(): void {
    this.hideAllMenus();
    this.optionsMenuContainer.isVisible = true;
  }
  
  /**
   * Show the game over screen
   */
  public showGameOver(): void {
    this.hideAllMenus();
    this.gameOverContainer.isVisible = true;
    this.activeMenu = "gameOver";
  }
  
  /**
   * Hide all menus
   */
  private hideAllMenus(): void {
    this.mainMenuContainer.isVisible = false;
    this.pauseMenuContainer.isVisible = false;
    this.optionsMenuContainer.isVisible = false;
    this.gameOverContainer.isVisible = false;
  }
  
  /**
   * Hide the menu system
   */
  public hide(): void {
    this.menuContainer.isVisible = false;
  }
  
  /**
   * Show the menu system
   */
  public show(): void {
    this.menuContainer.isVisible = true;
  }
  
  /**
   * Clean up menu resources
   */
  public dispose(): void {
    this.menuContainer.dispose();
  }
}
