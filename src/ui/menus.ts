/**
 * Menu System - Interactive menu system for Project Prism Protocol
 * 
 * Handles all game menus including:
 * - Main menu
 * - Pause menu
 * - Options menu
 * - About screen
 * - Game over screen
 * 
 * Implements the menu system as specified in docs/HUD_menus.md
 */

import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { gsap } from 'gsap';
import { UIManager } from './ui-manager';
import { SoundSystem, SoundCategory } from '../core/sound';
import { DialogSystem } from './dialogs';

export class MenuSystem {
  private advancedTexture: GUI.AdvancedDynamicTexture;
  private scene: BABYLON.Scene;
  private uiManager: UIManager;
  private soundSystem: SoundSystem | null = null;
  private dialogSystem: DialogSystem;
  
  // Menu containers
  private menuContainer: GUI.Container;
  private mainMenuContainer: GUI.Container;
  private pauseMenuContainer: GUI.Container;
  private optionsMenuContainer: GUI.Container;
  private aboutScreenContainer: GUI.Container;
  private gameOverContainer: GUI.Container;
  private confirmationDialogContainer: GUI.Container;
  
  // Menu state
  private activeMenu: string = "";
  private previousMenu: string = "";
  
  // Audio state
  private themeMusic: string = "mainTheme";
  private trainingMusic: string = "trainingTheme";
  private isMusicLoaded: boolean = false;
  
  // Callback functions
  private startGameCallback: (() => void) | null = null;
  private optionsCallback: (() => void) | null = null;
  private aboutCallback: (() => void) | null = null;
  private quitGameCallback: (() => void) | null = null;
  private controlsCallback: (() => void) | null = null;
  
  constructor(advancedTexture: GUI.AdvancedDynamicTexture, scene: BABYLON.Scene, uiManager: UIManager, dialogSystem: DialogSystem) {
    this.advancedTexture = advancedTexture;
    this.scene = scene;
    this.uiManager = uiManager;
    this.dialogSystem = dialogSystem;
    
    // Initialize sound system
    this.soundSystem = new SoundSystem(scene);
    
    // Load theme music
    this.loadMusic();
  }
  
  /**
   * Load music for the menu and game
   */
  private async loadMusic(): Promise<void> {
    if (this.soundSystem) {
      try {
        // Load main theme music
        await this.soundSystem.loadSound(
          this.themeMusic, 
          "assets/audio/music/Project-Prism_theme.wav", 
          {
            loop: true,
            autoplay: false,
            volume: 0.7,
            category: SoundCategory.MUSIC
          }
        );
        
        // Load training facility music
        await this.soundSystem.loadSound(
          this.trainingMusic, 
          "assets/audio/music/Track1.wav", 
          {
            loop: true,
            autoplay: false,
            volume: 0.7,
            category: SoundCategory.MUSIC
          }
        );
        
        this.isMusicLoaded = true;
        console.log("Music loaded successfully");
      } catch (error) {
        console.error("Failed to load music:", error);
      }
    }
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
    this.createAboutScreen();
    this.createGameOverScreen();
    this.createConfirmationDialog();
    
    // Hide all menus initially
    this.hideAllMenus();
  }
  
  /**
   * Create confirmation dialog for quit action
   */
  private createConfirmationDialog(): void {
    // Create confirmation dialog container
    this.confirmationDialogContainer = new GUI.Container("confirmationDialogContainer");
    this.confirmationDialogContainer.width = 1;
    this.confirmationDialogContainer.height = 1;
    this.menuContainer.addControl(this.confirmationDialogContainer);
    
    // Semi-transparent background that covers the entire screen
    const dialogBackground = new GUI.Rectangle("dialogBackground");
    dialogBackground.width = 1;
    dialogBackground.height = 1;
    dialogBackground.background = "rgba(0, 0, 0, 0.7)";
    dialogBackground.thickness = 0;
    this.confirmationDialogContainer.addControl(dialogBackground);
    
    // Dialog box
    const dialogBox = new GUI.Rectangle("dialogBox");
    dialogBox.width = "400px";
    dialogBox.height = "200px";
    dialogBox.background = "#1e272e";
    dialogBox.color = "#3498db";
    dialogBox.thickness = 2;
    dialogBox.cornerRadius = 10;
    this.confirmationDialogContainer.addControl(dialogBox);
    
    // Dialog title
    const dialogTitle = new GUI.TextBlock("dialogTitle");
    dialogTitle.text = "QUIT GAME";
    dialogTitle.height = "40px";
    dialogTitle.color = "white";
    dialogTitle.fontFamily = "monospace";
    dialogTitle.fontSize = 24;
    dialogTitle.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    dialogTitle.top = -60;
    dialogBox.addControl(dialogTitle);
    
    // Dialog message
    const dialogMessage = new GUI.TextBlock("dialogMessage");
    dialogMessage.text = "Are you sure you want to quit?";
    dialogMessage.height = "30px";
    dialogMessage.color = "white";
    dialogMessage.fontFamily = "monospace";
    dialogMessage.fontSize = 18;
    dialogMessage.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    dialogMessage.top = -10;
    dialogBox.addControl(dialogMessage);
    
    // Buttons container
    const buttonsContainer = new GUI.StackPanel("buttonsContainer");
    buttonsContainer.width = "300px";
    buttonsContainer.height = "50px";
    buttonsContainer.isVertical = false;
    buttonsContainer.spacing = 20;
    buttonsContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    buttonsContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    buttonsContainer.top = -30;
    dialogBox.addControl(buttonsContainer);
    
    // Yes button
    const yesButton = this.createMenuButton("yesButton", "YES", () => {
      // Close the browser tab
      window.close();
      
      // If window.close() doesn't work (which is likely due to browser security),
      // show a message instructing the user to close the tab manually
      setTimeout(() => {
        this.hideAllMenus();
        this.dialogSystem.showMessage(
          "Browser security prevented automatic tab closing. Please close this tab manually.",
          "CLOSE TAB MANUALLY",
          () => {
            this.showPreviousMenu();
          }
        );
      }, 300);
    });
    yesButton.width = "120px";
    buttonsContainer.addControl(yesButton);
    
    // No button
    const noButton = this.createMenuButton("noButton", "NO", () => {
      this.showPreviousMenu();
    });
    noButton.width = "120px";
    buttonsContainer.addControl(noButton);
  }
  
  /**
   * Show the previous menu that was active before the current one
   */
  private showPreviousMenu(): void {
    switch (this.previousMenu) {
      case "mainMenu":
        this.showMainMenu();
        break;
      case "pauseMenu":
        this.showPauseMenu();
        break;
      case "options":
        this.showOptionsMenu();
        break;
      case "about":
        this.showAboutScreen();
        break;
      default:
        this.showMainMenu();
        break;
    }
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
    
    // Play button
    const playButton = this.createMenuButton("playButton", "PLAY", () => {
      // Stop theme music and play training facility music
      if (this.soundSystem) {
        this.soundSystem.stopMusic(1.5);
        setTimeout(() => {
          if (this.soundSystem) {
            this.soundSystem.playMusic(this.trainingMusic);
          }
        }, 1500);
      }
      
      if (this.startGameCallback) {
        this.startGameCallback();
      } else {
        this.uiManager.startGame();
      }
    });
    menuButtonsPanel.addControl(playButton);
    
    // Settings button
    const settingsButton = this.createMenuButton("settingsButton", "SETTINGS", () => {
      this.previousMenu = "mainMenu";
      this.showOptionsMenu();
    });
    menuButtonsPanel.addControl(settingsButton);
    
    // About button
    const aboutButton = this.createMenuButton("aboutButton", "ABOUT", () => {
      this.previousMenu = "mainMenu";
      this.showAboutScreen();
    });
    menuButtonsPanel.addControl(aboutButton);
    
    // Quit button
    const quitButton = this.createMenuButton("quitButton", "QUIT", () => {
      this.previousMenu = "mainMenu";
      this.showQuitConfirmation();
    });
    menuButtonsPanel.addControl(quitButton);
    
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
   * Show quit confirmation dialog
   */
  private showQuitConfirmation(): void {
    this.hideAllMenus();
    this.confirmationDialogContainer.isVisible = true;
    this.activeMenu = "confirmation";
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
    optionsTitle.text = "SETTINGS";
    optionsTitle.height = "60px";
    optionsTitle.color = "white";
    optionsTitle.fontFamily = "monospace";
    optionsTitle.fontSize = 36;
    optionsTitle.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    optionsTitle.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    optionsTitle.top = 80;
    this.optionsMenuContainer.addControl(optionsTitle);
    
    // Create tab control for different settings categories
    const tabContainer = new GUI.Container("tabContainer");
    tabContainer.width = "600px";
    tabContainer.height = "400px";
    tabContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    tabContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    this.optionsMenuContainer.addControl(tabContainer);
    
    // Tab buttons container
    const tabButtonsContainer = new GUI.StackPanel("tabButtonsContainer");
    tabButtonsContainer.isVertical = false;
    tabButtonsContainer.height = "40px";
    tabButtonsContainer.width = "100%";
    tabButtonsContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    tabButtonsContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    tabButtonsContainer.spacing = 2;
    tabContainer.addControl(tabButtonsContainer);
    
    // Tab content container
    const tabContentContainer = new GUI.Container("tabContentContainer");
    tabContentContainer.width = "100%";
    tabContentContainer.height = "350px";
    tabContentContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    tabContentContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    tabContentContainer.top = 45;
    tabContainer.addControl(tabContentContainer);
    
    // Create tab contents
    const controlsTab = this.createControlsTab();
    const audioTab = this.createAudioTab();
    const graphicsTab = this.createGraphicsTab();
    const accessibilityTab = this.createAccessibilityTab();
    
    // Add tab contents to container (initially hidden)
    tabContentContainer.addControl(controlsTab);
    tabContentContainer.addControl(audioTab);
    tabContentContainer.addControl(graphicsTab);
    tabContentContainer.addControl(accessibilityTab);
    
    controlsTab.isVisible = true;
    audioTab.isVisible = false;
    graphicsTab.isVisible = false;
    accessibilityTab.isVisible = false;
    
    // Create tab buttons
    const createTabButton = (name: string, text: string, tabContent: GUI.Container) => {
      const button = new GUI.Button(name);
      button.width = "150px";
      button.height = "40px";
      button.thickness = 0;
      button.cornerRadius = 0;
      
      const buttonBackground = new GUI.Rectangle(`${name}Background`);
      buttonBackground.width = 1;
      buttonBackground.height = 1;
      buttonBackground.background = "rgba(52, 152, 219, 0.2)";
      buttonBackground.color = "#3498db";
      buttonBackground.thickness = 2;
      buttonBackground.cornerRadius = 0;
      button.addControl(buttonBackground);
      
      const buttonText = new GUI.TextBlock(`${name}Text`);
      buttonText.text = text;
      buttonText.color = "white";
      buttonText.fontFamily = "monospace";
      buttonText.fontSize = 16;
      button.addControl(buttonText);
      
      // Set active state if this is the first tab
      if (tabContent.isVisible) {
        buttonBackground.background = "rgba(52, 152, 219, 0.6)";
        buttonText.color = "#3498db";
      }
      
      button.onPointerClickObservable.add(() => {
        // Hide all tab contents
        controlsTab.isVisible = false;
        audioTab.isVisible = false;
        graphicsTab.isVisible = false;
        accessibilityTab.isVisible = false;
        
        // Show selected tab content
        tabContent.isVisible = true;
        
        // Reset all button styles
        tabButtonsContainer.children.forEach(child => {
          if (child instanceof GUI.Button) {
            const bg = child.children[0] as GUI.Rectangle;
            const txt = child.children[1] as GUI.TextBlock;
            bg.background = "rgba(52, 152, 219, 0.2)";
            txt.color = "white";
          }
        });
        
        // Highlight active button
        buttonBackground.background = "rgba(52, 152, 219, 0.6)";
        buttonText.color = "#3498db";
      });
      
      return button;
    };
    
    // Add tab buttons
    tabButtonsContainer.addControl(createTabButton("controlsTabButton", "CONTROLS", controlsTab));
    tabButtonsContainer.addControl(createTabButton("audioTabButton", "AUDIO", audioTab));
    tabButtonsContainer.addControl(createTabButton("graphicsTabButton", "GRAPHICS", graphicsTab));
    tabButtonsContainer.addControl(createTabButton("accessibilityTabButton", "ACCESSIBILITY", accessibilityTab));
    
    // Back button
    const backButton = this.createMenuButton("backFromOptionsButton", "BACK", () => {
      this.showPreviousMenu();
    });
    backButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    backButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    backButton.top = -50;
    this.optionsMenuContainer.addControl(backButton);
  }
  
  /**
   * Create About screen
   */
  private createAboutScreen(): void {
    // Create about screen container
    this.aboutScreenContainer = new GUI.Container("aboutScreenContainer");
    this.aboutScreenContainer.width = 1;
    this.aboutScreenContainer.height = 1;
    this.menuContainer.addControl(this.aboutScreenContainer);
    
    // Semi-transparent background
    const background = new GUI.Rectangle("aboutScreenBackground");
    background.width = 1;
    background.height = 1;
    background.background = "rgba(0, 0, 0, 0.7)";
    background.thickness = 0;
    this.aboutScreenContainer.addControl(background);
    
    // About title
    const aboutTitle = new GUI.TextBlock("aboutTitle");
    aboutTitle.text = "ABOUT PROJECT PRISM PROTOCOL";
    aboutTitle.height = "60px";
    aboutTitle.color = "white";
    aboutTitle.fontFamily = "monospace";
    aboutTitle.fontSize = 36;
    aboutTitle.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    aboutTitle.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    aboutTitle.top = 80;
    this.aboutScreenContainer.addControl(aboutTitle);
    
    // Create scrollable container for content
    const scrollViewer = new GUI.ScrollViewer("aboutScrollViewer");
    scrollViewer.width = "700px";
    scrollViewer.height = "400px";
    scrollViewer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    scrollViewer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    scrollViewer.barSize = 15;
    scrollViewer.barColor = "#3498db";
    scrollViewer.barBackground = "#2c3e50";
    scrollViewer.wheelPrecision = 20;
    this.aboutScreenContainer.addControl(scrollViewer);
    
    // About content panel
    const aboutContentPanel = new GUI.StackPanel("aboutContentPanel");
    aboutContentPanel.width = "650px";
    aboutContentPanel.height = "auto";
    aboutContentPanel.spacing = 20;
    aboutContentPanel.paddingTop = "20px";
    aboutContentPanel.paddingBottom = "20px";
    aboutContentPanel.paddingLeft = "20px";
    aboutContentPanel.paddingRight = "20px";
    scrollViewer.addControl(aboutContentPanel);
    
    // Game overview
    const overviewTitle = new GUI.TextBlock("overviewTitle");
    overviewTitle.text = "GAME OVERVIEW";
    overviewTitle.height = "30px";
    overviewTitle.color = "#3498db";
    overviewTitle.fontFamily = "monospace";
    overviewTitle.fontSize = 22;
    overviewTitle.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    aboutContentPanel.addControl(overviewTitle);
    
    const overviewText = new GUI.TextBlock("overviewText");
    overviewText.text = "In Project Prism Protocol, you assume the role of a spy agent navigating through various environments to complete objectives. The game features multiple level types, weapons, and enemy encounters inspired by classic spy thrillers.";
    overviewText.height = "60px";
    overviewText.color = "white";
    overviewText.fontFamily = "monospace";
    overviewText.fontSize = 16;
    overviewText.textWrapping = true;
    overviewText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    aboutContentPanel.addControl(overviewText);
    
    // Key features
    const featuresTitle = new GUI.TextBlock("featuresTitle");
    featuresTitle.text = "KEY FEATURES";
    featuresTitle.height = "30px";
    featuresTitle.color = "#3498db";
    featuresTitle.fontFamily = "monospace";
    featuresTitle.fontSize = 22;
    featuresTitle.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    aboutContentPanel.addControl(featuresTitle);
    
    const featuresText = new GUI.TextBlock("featuresText");
    featuresText.text = "• Modern Browser-Based FPS: Built with Babylon.js for high-performance WebGL rendering\n" +
                        "• Classic Spy Gameplay: Stealth, combat, and objective-based missions\n" +
                        "• Five Distinct Environments: Training Facility, Office Complex, Detention Center, Research Facility, and Command Center\n" +
                        "• Weapon Arsenal: Classic FPS weapons with unique characteristics and handling\n" +
                        "• Intelligent Enemy AI: Guards with patrol, alert, attack, and search behaviors\n" +
                        "• Performance Optimized: Designed to run at 60+ FPS on mid-range hardware";
    featuresText.height = "150px";
    featuresText.color = "white";
    featuresText.fontFamily = "monospace";
    featuresText.fontSize = 16;
    featuresText.textWrapping = true;
    featuresText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    aboutContentPanel.addControl(featuresText);
    
    // Technical stack
    const techTitle = new GUI.TextBlock("techTitle");
    techTitle.text = "TECHNICAL STACK";
    techTitle.height = "30px";
    techTitle.color = "#3498db";
    techTitle.fontFamily = "monospace";
    techTitle.fontSize = 22;
    techTitle.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    aboutContentPanel.addControl(techTitle);
    
    const techText = new GUI.TextBlock("techText");
    techText.text = "• Frontend: HTML5/CSS3, TypeScript (ES6+), Babylon.js 7.x, WebGL 2.0\n" +
                    "• Supporting Libraries: Howler.js (audio), AmmoJS (physics), GSAP (animations), Stats.js (performance)";
    techText.height = "60px";
    techText.color = "white";
    techText.fontFamily = "monospace";
    techText.fontSize = 16;
    techText.textWrapping = true;
    techText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    aboutContentPanel.addControl(techText);
    
    // Browser compatibility
    const browserTitle = new GUI.TextBlock("browserTitle");
    browserTitle.text = "BROWSER COMPATIBILITY";
    browserTitle.height = "30px";
    browserTitle.color = "#3498db";
    browserTitle.fontFamily = "monospace";
    browserTitle.fontSize = 22;
    browserTitle.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    aboutContentPanel.addControl(browserTitle);
    
    const browserText = new GUI.TextBlock("browserText");
    browserText.text = "Project Prism Protocol is designed to work on all modern browsers that support WebGL 2.0:\n" +
                       "• Chrome 79+\n" +
                       "• Firefox 71+\n" +
                       "• Safari 15+\n" +
                       "• Edge 79+";
    browserText.height = "100px";
    browserText.color = "white";
    browserText.fontFamily = "monospace";
    browserText.fontSize = 16;
    browserText.textWrapping = true;
    browserText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    aboutContentPanel.addControl(browserText);
    
    // Disclaimer
    const disclaimerText = new GUI.TextBlock("disclaimerText");
    disclaimerText.text = "Project Prism Protocol is a fan project inspired by GoldenEye 64 and is not affiliated with or endorsed by the owners of the GoldenEye intellectual property.";
    disclaimerText.height = "60px";
    disclaimerText.color = "#bdc3c7";
    disclaimerText.fontFamily = "monospace";
    disclaimerText.fontSize = 14;
    disclaimerText.textWrapping = true;
    disclaimerText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    aboutContentPanel.addControl(disclaimerText);
    
    // Back button (outside the scroll viewer)
    const backButton = this.createMenuButton("backFromAboutButton", "BACK", () => {
      this.showPreviousMenu();
    });
    backButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    backButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    backButton.top = -50;
    this.aboutScreenContainer.addControl(backButton);
  }
  
  /**
   * Create Controls tab for settings menu
   */
  private createControlsTab(): GUI.Container {
    const controlsTab = new GUI.Container("controlsTab");
    controlsTab.width = 1;
    controlsTab.height = 1;
    
    // Controls background
    const controlsBg = new GUI.Rectangle("controlsBg");
    controlsBg.width = 1;
    controlsBg.height = 1;
    controlsBg.background = "rgba(0, 0, 0, 0.3)";
    controlsBg.thickness = 0;
    controlsTab.addControl(controlsBg);
    
    // Controls content panel
    const controlsPanel = new GUI.StackPanel("controlsPanel");
    controlsPanel.width = "90%";
    controlsPanel.height = "100%";
    controlsPanel.spacing = 15;
    controlsPanel.paddingTop = "20px";
    controlsPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    controlsBg.addControl(controlsPanel);
    
    // Movement controls section
    const movementHeader = new GUI.TextBlock("movementHeader");
    movementHeader.text = "MOVEMENT CONTROLS";
    movementHeader.height = "30px";
    movementHeader.color = "#3498db";
    movementHeader.fontFamily = "monospace";
    movementHeader.fontSize = 18;
    movementHeader.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    controlsPanel.addControl(movementHeader);
    
    // Movement controls grid
    const movementGrid = new GUI.Grid("movementGrid");
    movementGrid.width = 1;
    movementGrid.height = "120px";
    movementGrid.addColumnDefinition(0.3);
    movementGrid.addColumnDefinition(0.7);
    movementGrid.addRowDefinition(0.25);
    movementGrid.addRowDefinition(0.25);
    movementGrid.addRowDefinition(0.25);
    movementGrid.addRowDefinition(0.25);
    controlsPanel.addControl(movementGrid);
    
    // Add movement controls
    this.addControlRow(movementGrid, 0, "Forward", "W / Up Arrow");
    this.addControlRow(movementGrid, 1, "Backward", "S / Down Arrow");
    this.addControlRow(movementGrid, 2, "Left", "A / Left Arrow");
    this.addControlRow(movementGrid, 3, "Right", "D / Right Arrow");
    
    // Action controls section
    const actionHeader = new GUI.TextBlock("actionHeader");
    actionHeader.text = "ACTION CONTROLS";
    actionHeader.height = "30px";
    actionHeader.color = "#3498db";
    actionHeader.fontFamily = "monospace";
    actionHeader.fontSize = 18;
    actionHeader.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    controlsPanel.addControl(actionHeader);
    
    // Action controls grid
    const actionGrid = new GUI.Grid("actionGrid");
    actionGrid.width = 1;
    actionGrid.height = "120px";
    actionGrid.addColumnDefinition(0.3);
    actionGrid.addColumnDefinition(0.7);
    actionGrid.addRowDefinition(0.25);
    actionGrid.addRowDefinition(0.25);
    actionGrid.addRowDefinition(0.25);
    actionGrid.addRowDefinition(0.25);
    controlsPanel.addControl(actionGrid);
    
    // Add action controls
    this.addControlRow(actionGrid, 0, "Fire", "Left Mouse Button");
    this.addControlRow(actionGrid, 1, "Aim", "Right Mouse Button");
    this.addControlRow(actionGrid, 2, "Reload", "R");
    this.addControlRow(actionGrid, 3, "Interact", "E");
    
    // Mouse sensitivity section
    const sensitivityHeader = new GUI.TextBlock("sensitivityHeader");
    sensitivityHeader.text = "MOUSE SENSITIVITY";
    sensitivityHeader.height = "30px";
    sensitivityHeader.color = "#3498db";
    sensitivityHeader.fontFamily = "monospace";
    sensitivityHeader.fontSize = 18;
    sensitivityHeader.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    controlsPanel.addControl(sensitivityHeader);
    
    const sensitivitySlider = new GUI.Slider("sensitivitySlider");
    sensitivitySlider.minimum = 0.1;
    sensitivitySlider.maximum = 1.0;
    sensitivitySlider.value = 0.5;
    sensitivitySlider.height = "20px";
    sensitivitySlider.width = "100%";
    sensitivitySlider.color = "#3498db";
    sensitivitySlider.background = "#2c3e50";
    sensitivitySlider.onValueChangedObservable.add((value) => {
      // TODO: Update sensitivity value
    });
    controlsPanel.addControl(sensitivitySlider);
    
    return controlsTab;
  }
  
  /**
   * Add a control row to a grid
   */
  private addControlRow(grid: GUI.Grid, row: number, action: string, key: string): void {
    const actionText = new GUI.TextBlock(`action${row}`);
    actionText.text = action;
    actionText.color = "white";
    actionText.fontFamily = "monospace";
    actionText.fontSize = 16;
    actionText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    grid.addControl(actionText, row, 0);
    
    const keyText = new GUI.TextBlock(`key${row}`);
    keyText.text = key;
    keyText.color = "#bdc3c7";
    keyText.fontFamily = "monospace";
    keyText.fontSize = 16;
    keyText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    grid.addControl(keyText, row, 1);
  }
  
  /**
   * Create Audio tab for settings menu
   */
  private createAudioTab(): GUI.Container {
    const audioTab = new GUI.Container("audioTab");
    audioTab.width = 1;
    audioTab.height = 1;
    
    // Audio background
    const audioBg = new GUI.Rectangle("audioBg");
    audioBg.width = 1;
    audioBg.height = 1;
    audioBg.background = "rgba(0, 0, 0, 0.3)";
    audioBg.thickness = 0;
    audioTab.addControl(audioBg);
    
    // Audio content panel
    const audioPanel = new GUI.StackPanel("audioPanel");
    audioPanel.width = "90%";
    audioPanel.height = "100%";
    audioPanel.spacing = 20;
    audioPanel.paddingTop = "20px";
    audioPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    audioBg.addControl(audioPanel);
    
    // Master volume section
    const masterHeader = new GUI.TextBlock("masterHeader");
    masterHeader.text = "MASTER VOLUME";
    masterHeader.height = "30px";
    masterHeader.color = "#3498db";
    masterHeader.fontFamily = "monospace";
    masterHeader.fontSize = 18;
    masterHeader.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    audioPanel.addControl(masterHeader);
    
    const masterSlider = new GUI.Slider("masterSlider");
    masterSlider.minimum = 0;
    masterSlider.maximum = 1.0;
    masterSlider.value = this.soundSystem ? this.soundSystem.getConfig().volume : 0.7;
    masterSlider.height = "20px";
    masterSlider.width = "100%";
    masterSlider.color = "#3498db";
    masterSlider.background = "#2c3e50";
    masterSlider.onValueChangedObservable.add((value) => {
      if (this.soundSystem) {
        this.soundSystem.setMasterVolume(value);
      }
    });
    audioPanel.addControl(masterSlider);
    
    // Music volume section
    const musicHeader = new GUI.TextBlock("musicHeader");
    musicHeader.text = "MUSIC VOLUME";
    musicHeader.height = "30px";
    musicHeader.color = "#3498db";
    musicHeader.fontFamily = "monospace";
    musicHeader.fontSize = 18;
    musicHeader.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    audioPanel.addControl(musicHeader);
    
    const musicSlider = new GUI.Slider("musicSlider");
    musicSlider.minimum = 0;
    musicSlider.maximum = 1.0;
    musicSlider.value = this.soundSystem ? this.soundSystem.getConfig().musicVolume : 0.7;
    musicSlider.height = "20px";
    musicSlider.width = "100%";
    musicSlider.color = "#3498db";
    musicSlider.background = "#2c3e50";
    musicSlider.onValueChangedObservable.add((value) => {
      if (this.soundSystem) {
        this.soundSystem.setCategoryVolume(SoundCategory.MUSIC, value);
      }
    });
    audioPanel.addControl(musicSlider);
    
    // Sound effects volume section
    const sfxHeader = new GUI.TextBlock("sfxHeader");
    sfxHeader.text = "SOUND EFFECTS VOLUME";
    sfxHeader.height = "30px";
    sfxHeader.color = "#3498db";
    sfxHeader.fontFamily = "monospace";
    sfxHeader.fontSize = 18;
    sfxHeader.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    audioPanel.addControl(sfxHeader);
    
    const sfxSlider = new GUI.Slider("sfxSlider");
    sfxSlider.minimum = 0;
    sfxSlider.maximum = 1.0;
    sfxSlider.value = this.soundSystem ? this.soundSystem.getConfig().sfxVolume : 1.0;
    sfxSlider.height = "20px";
    sfxSlider.width = "100%";
    sfxSlider.color = "#3498db";
    sfxSlider.background = "#2c3e50";
    sfxSlider.onValueChangedObservable.add((value) => {
      if (this.soundSystem) {
        this.soundSystem.setCategoryVolume(SoundCategory.SFX, value);
      }
    });
    audioPanel.addControl(sfxSlider);
    
    // Toggle music checkbox
    const musicToggleContainer = new GUI.StackPanel("musicToggleContainer");
    musicToggleContainer.isVertical = false;
    musicToggleContainer.height = "30px";
    musicToggleContainer.width = "100%";
    audioPanel.addControl(musicToggleContainer);
    
    const musicToggle = new GUI.Checkbox("musicToggle");
    musicToggle.width = "20px";
    musicToggle.height = "20px";
    musicToggle.color = "#3498db";
    musicToggle.background = "white";
    musicToggle.isChecked = true;
    musicToggle.onIsCheckedChangedObservable.add((value) => {
      if (this.soundSystem) {
        if (!value) {
          this.soundSystem.setCategoryVolume(SoundCategory.MUSIC, 0);
        } else {
          this.soundSystem.setCategoryVolume(SoundCategory.MUSIC, musicSlider.value);
        }
      }
    });
    musicToggleContainer.addControl(musicToggle);
    
    const musicToggleLabel = new GUI.TextBlock("musicToggleLabel");
    musicToggleLabel.text = "ENABLE MUSIC";
    musicToggleLabel.color = "white";
    musicToggleLabel.fontFamily = "monospace";
    musicToggleLabel.fontSize = 16;
    musicToggleLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    musicToggleLabel.paddingLeft = "10px";
    musicToggleContainer.addControl(musicToggleLabel);
    
    return audioTab;
  }
  
  /**
   * Create Graphics tab for settings menu
   */
  private createGraphicsTab(): GUI.Container {
    const graphicsTab = new GUI.Container("graphicsTab");
    graphicsTab.width = 1;
    graphicsTab.height = 1;
    
    // Graphics background
    const graphicsBg = new GUI.Rectangle("graphicsBg");
    graphicsBg.width = 1;
    graphicsBg.height = 1;
    graphicsBg.background = "rgba(0, 0, 0, 0.3)";
    graphicsBg.thickness = 0;
    graphicsTab.addControl(graphicsBg);
    
    // Graphics content panel
    const graphicsPanel = new GUI.StackPanel("graphicsPanel");
    graphicsPanel.width = "90%";
    graphicsPanel.height = "100%";
    graphicsPanel.spacing = 20;
    graphicsPanel.paddingTop = "20px";
    graphicsPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    graphicsBg.addControl(graphicsPanel);
    
    // Quality preset section
    const qualityHeader = new GUI.TextBlock("qualityHeader");
    qualityHeader.text = "QUALITY PRESET";
    qualityHeader.height = "30px";
    qualityHeader.color = "#3498db";
    qualityHeader.fontFamily = "monospace";
    qualityHeader.fontSize = 18;
    qualityHeader.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    graphicsPanel.addControl(qualityHeader);
    
    // Quality preset radio buttons
    const qualityOptions = ["Low", "Medium", "High"];
    const radioContainer = new GUI.StackPanel("radioContainer");
    radioContainer.height = "120px";
    radioContainer.spacing = 10;
    graphicsPanel.addControl(radioContainer);
    
    const radioButtons: GUI.RadioButton[] = [];
    
    qualityOptions.forEach((option, index) => {
      const radioRow = new GUI.StackPanel(`radio${option}Row`);
      radioRow.isVertical = false;
      radioRow.height = "30px";
      radioContainer.addControl(radioRow);
      
      const radioButton = new GUI.RadioButton(`radio${option}`);
      radioButton.width = "20px";
      radioButton.height = "20px";
      radioButton.color = "#3498db";
      radioButton.background = "white";
      radioButton.group = "qualityGroup";
      radioButton.isChecked = index === 1; // Medium selected by default
      radioButtons.push(radioButton);
      radioRow.addControl(radioButton);
      
      const radioLabel = new GUI.TextBlock(`radio${option}Label`);
      radioLabel.text = option.toUpperCase();
      radioLabel.color = "white";
      radioLabel.fontFamily = "monospace";
      radioLabel.fontSize = 16;
      radioLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      radioLabel.paddingLeft = "10px";
      radioRow.addControl(radioLabel);
      
      radioButton.onIsCheckedChangedObservable.add((value) => {
        if (value) {
          // TODO: Apply quality preset
          console.log(`Quality set to ${option}`);
        }
      });
    });
    
    // Effects toggles
    const effectsHeader = new GUI.TextBlock("effectsHeader");
    effectsHeader.text = "VISUAL EFFECTS";
    effectsHeader.height = "30px";
    effectsHeader.color = "#3498db";
    effectsHeader.fontFamily = "monospace";
    effectsHeader.fontSize = 18;
    effectsHeader.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    graphicsPanel.addControl(effectsHeader);
    
    // Effects checkboxes
    const effectsOptions = ["Motion Blur", "Depth of Field", "Bloom", "Anti-Aliasing"];
    const checkboxContainer = new GUI.StackPanel("checkboxContainer");
    checkboxContainer.height = "150px";
    checkboxContainer.spacing = 10;
    graphicsPanel.addControl(checkboxContainer);
    
    effectsOptions.forEach((option) => {
      const checkboxRow = new GUI.StackPanel(`checkbox${option}Row`);
      checkboxRow.isVertical = false;
      checkboxRow.height = "30px";
      checkboxContainer.addControl(checkboxRow);
      
      const checkbox = new GUI.Checkbox(`checkbox${option}`);
      checkbox.width = "20px";
      checkbox.height = "20px";
      checkbox.color = "#3498db";
      checkbox.background = "white";
      checkbox.isChecked = option === "Anti-Aliasing"; // Only Anti-Aliasing enabled by default
      checkboxRow.addControl(checkbox);
      
      const checkboxLabel = new GUI.TextBlock(`checkbox${option}Label`);
      checkboxLabel.text = option.toUpperCase();
      checkboxLabel.color = "white";
      checkboxLabel.fontFamily = "monospace";
      checkboxLabel.fontSize = 16;
      checkboxLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      checkboxLabel.paddingLeft = "10px";
      checkboxRow.addControl(checkboxLabel);
      
      checkbox.onIsCheckedChangedObservable.add((value) => {
        // TODO: Toggle effect
        console.log(`${option} set to ${value}`);
      });
    });
    
    return graphicsTab;
  }
  
  /**
   * Create Accessibility tab for settings menu
   */
  private createAccessibilityTab(): GUI.Container {
    const accessibilityTab = new GUI.Container("accessibilityTab");
    accessibilityTab.width = 1;
    accessibilityTab.height = 1;
    
    // Accessibility background
    const accessibilityBg = new GUI.Rectangle("accessibilityBg");
    accessibilityBg.width = 1;
    accessibilityBg.height = 1;
    accessibilityBg.background = "rgba(0, 0, 0, 0.3)";
    accessibilityBg.thickness = 0;
    accessibilityTab.addControl(accessibilityBg);
    
    // Accessibility content panel
    const accessibilityPanel = new GUI.StackPanel("accessibilityPanel");
    accessibilityPanel.width = "90%";
    accessibilityPanel.height = "100%";
    accessibilityPanel.spacing = 20;
    accessibilityPanel.paddingTop = "20px";
    accessibilityPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    accessibilityBg.addControl(accessibilityPanel);
    
    // Text size section
    const textSizeHeader = new GUI.TextBlock("textSizeHeader");
    textSizeHeader.text = "TEXT SIZE";
    textSizeHeader.height = "30px";
    textSizeHeader.color = "#3498db";
    textSizeHeader.fontFamily = "monospace";
    textSizeHeader.fontSize = 18;
    textSizeHeader.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    accessibilityPanel.addControl(textSizeHeader);
    
    // Text size slider
    const textSizeSlider = new GUI.Slider("textSizeSlider");
    textSizeSlider.minimum = 0.8;
    textSizeSlider.maximum = 1.5;
    textSizeSlider.value = 1.0;
    textSizeSlider.height = "20px";
    textSizeSlider.width = "100%";
    textSizeSlider.color = "#3498db";
    textSizeSlider.background = "#2c3e50";
    textSizeSlider.onValueChangedObservable.add((value) => {
      // TODO: Update text size
      console.log(`Text size set to ${value}`);
    });
    accessibilityPanel.addControl(textSizeSlider);
    
    // Color blind modes section
    const colorBlindHeader = new GUI.TextBlock("colorBlindHeader");
    colorBlindHeader.text = "COLOR BLIND MODE";
    colorBlindHeader.height = "30px";
    colorBlindHeader.color = "#3498db";
    colorBlindHeader.fontFamily = "monospace";
    colorBlindHeader.fontSize = 18;
    colorBlindHeader.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    accessibilityPanel.addControl(colorBlindHeader);
    
    // Color blind mode radio buttons
    const colorBlindOptions = ["Off", "Protanopia", "Deuteranopia", "Tritanopia"];
    const radioContainer = new GUI.StackPanel("colorBlindRadioContainer");
    radioContainer.height = "150px";
    radioContainer.spacing = 10;
    accessibilityPanel.addControl(radioContainer);
    
    const radioButtons: GUI.RadioButton[] = [];
    
    colorBlindOptions.forEach((option, index) => {
      const radioRow = new GUI.StackPanel(`colorBlind${option}Row`);
      radioRow.isVertical = false;
      radioRow.height = "30px";
      radioContainer.addControl(radioRow);
      
      const radioButton = new GUI.RadioButton(`colorBlind${option}`);
      radioButton.width = "20px";
      radioButton.height = "20px";
      radioButton.color = "#3498db";
      radioButton.background = "white";
      radioButton.group = "colorBlindGroup";
      radioButton.isChecked = index === 0; // Off selected by default
      radioButtons.push(radioButton);
      radioRow.addControl(radioButton);
      
      const radioLabel = new GUI.TextBlock(`colorBlind${option}Label`);
      radioLabel.text = option.toUpperCase();
      radioLabel.color = "white";
      radioLabel.fontFamily = "monospace";
      radioLabel.fontSize = 16;
      radioLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      radioLabel.paddingLeft = "10px";
      radioRow.addControl(radioLabel);
      
      radioButton.onIsCheckedChangedObservable.add((value) => {
        if (value) {
          // TODO: Apply color blind mode
          console.log(`Color blind mode set to ${option}`);
        }
      });
    });
    
    // Reduced motion toggle
    const motionContainer = new GUI.StackPanel("motionContainer");
    motionContainer.isVertical = false;
    motionContainer.height = "30px";
    motionContainer.width = "100%";
    accessibilityPanel.addControl(motionContainer);
    
    const motionToggle = new GUI.Checkbox("motionToggle");
    motionToggle.width = "20px";
    motionToggle.height = "20px";
    motionToggle.color = "#3498db";
    motionToggle.background = "white";
    motionToggle.isChecked = false;
    motionToggle.onIsCheckedChangedObservable.add((value) => {
      // TODO: Toggle reduced motion
      console.log(`Reduced motion set to ${value}`);
    });
    motionContainer.addControl(motionToggle);
    
    const motionLabel = new GUI.TextBlock("motionLabel");
    motionLabel.text = "REDUCED MOTION";
    motionLabel.color = "white";
    motionLabel.fontFamily = "monospace";
    motionLabel.fontSize = 16;
    motionLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    motionLabel.paddingLeft = "10px";
    motionContainer.addControl(motionLabel);
    
    return accessibilityTab;
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
    
    // Play theme music if it's loaded
    if (this.soundSystem && this.isMusicLoaded) {
      // If another music is playing, stop it first
      if (this.soundSystem.isPlaying(this.trainingMusic)) {
        this.soundSystem.stopMusic(1.5);
        setTimeout(() => {
          if (this.soundSystem) {
            this.soundSystem.playMusic(this.themeMusic);
          }
        }, 1500);
      } else {
        this.soundSystem.playMusic(this.themeMusic);
      }
    }
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
    this.activeMenu = "options";
  }
  
  /**
   * Show the about screen
   */
  public showAboutScreen(): void {
    this.hideAllMenus();
    this.aboutScreenContainer.isVisible = true;
    this.activeMenu = "about";
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
    this.aboutScreenContainer.isVisible = false;
    this.gameOverContainer.isVisible = false;
    this.confirmationDialogContainer.isVisible = false;
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
   * Set callback for Start Game button
   */
  public setStartGameCallback(callback: () => void): void {
    this.startGameCallback = callback;
  }
  
  /**
   * Set callback for Options button
   */
  public setOptionsCallback(callback: () => void): void {
    this.optionsCallback = callback;
  }
  
  /**
   * Set callback for About button
   */
  public setAboutCallback(callback: () => void): void {
    this.aboutCallback = callback;
  }
  
  /**
   * Set callback for Quit button
   */
  public setQuitGameCallback(callback: () => void): void {
    this.quitGameCallback = callback;
  }
  
  /**
   * Dispose of menu resources
   */
  public dispose(): void {
    // Clear callbacks
    this.startGameCallback = null;
    this.optionsCallback = null;
    this.aboutCallback = null;
    this.quitGameCallback = null;
    
    // Clean up resources
    this.menuContainer.dispose();
  }
}
