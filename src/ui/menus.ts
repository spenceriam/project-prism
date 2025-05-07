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
  private musicLoadingPromise: Promise<void> | null = null;
  
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
  private loadMusic(): Promise<void> {
    if (this.soundSystem) {
      // Assign the promise to the class member
      this.musicLoadingPromise = (async () => { 
        try {
          // Load main theme music
          await this.soundSystem!.loadSound(
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
          await this.soundSystem!.loadSound(
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
          this.isMusicLoaded = false; 
        }
      })();
      return this.musicLoadingPromise; 
    }
    // If soundSystem is null, set music as not loaded and return a resolved promise
    this.isMusicLoaded = false;
    this.musicLoadingPromise = Promise.resolve(); 
    return this.musicLoadingPromise;
  }
  
  /**
   * Initialize the menu system
   */
  public initialize(): void {
    try {
      console.log('MenuSystem.initialize() called');
      
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
      
      console.log('MenuSystem initialization complete');
    } catch (error) {
      console.error('Error in MenuSystem.initialize():', error);
    }
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
    dialogTitle.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    dialogTitle.fontWeight = 'bold';
    dialogTitle.fontSize = 24;
    dialogTitle.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    dialogTitle.top = -60;
    dialogBox.addControl(dialogTitle);
    
    // Dialog message
    const dialogMessage = new GUI.TextBlock("dialogMessage");
    dialogMessage.text = "ARE YOU SURE YOU WANT TO QUIT?";
    dialogMessage.height = "30px";
    dialogMessage.color = "white";
    dialogMessage.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    dialogMessage.fontWeight = 'bold';
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
    console.log('Creating main menu...');
    
    this.mainMenuContainer = new GUI.Container("mainMenuContainer");
    this.mainMenuContainer.width = 1;
    this.mainMenuContainer.height = 1;
    this.menuContainer.addControl(this.mainMenuContainer);

    const background = new GUI.Rectangle("mainMenuBackground");
    background.width = 1;
    background.height = 1;
    background.background = "#0A141E"; // Dark MGS-style blue/black
    background.thickness = 2;
    background.color = "#304050"; // Muted cyan/blue-grey border
    this.mainMenuContainer.addControl(background);

    const mainStackPanel = new GUI.StackPanel("mainStackPanel");
    mainStackPanel.width = "100%";
    mainStackPanel.height = "100%";
    mainStackPanel.isVertical = true;
    mainStackPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    mainStackPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    mainStackPanel.paddingLeft = "20px";
    mainStackPanel.paddingRight = "20px";
    mainStackPanel.top = "50px"; // Move menu content down
    mainStackPanel.spacing = 50; // Updated spacing to 50px
    this.mainMenuContainer.addControl(mainStackPanel);

    // Title panel (for logo)
    const titlePanel = new GUI.StackPanel("titlePanel");
    titlePanel.width = "100%";
    titlePanel.heightInPixels = this.scene.getEngine().getRenderHeight() * 0.25; // Restored dynamic height
    titlePanel.isVertical = true;
    titlePanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    titlePanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP; // Align to top
    mainStackPanel.addControl(titlePanel);

    // Create a separate container for the logo at the top of the screen
    const logoContainer = new GUI.Container("logoContainer");
    logoContainer.width = 1;
    logoContainer.height = "450px"; // Increased height to prevent logo from being cut off
    logoContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    logoContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    logoContainer.top = "20px"; // Position from top of screen
    this.mainMenuContainer.addControl(logoContainer);
    
    // Logo Image with transparency support and animation (no drop shadow)
    const logoImage = new GUI.Image("logoImage", "assets/ui/logo.png");
    logoImage.widthInPixels = 1529; // Increased by 20% from 1274
    logoImage.heightInPixels = 382; // Increased by 20% from 318
    logoImage.stretch = GUI.Image.STRETCH_UNIFORM;
    logoImage.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    logoImage.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    
    // Set transparency properties
    logoImage.alpha = 1.0; // Full opacity
    // Apply a color to ensure proper alpha channel handling
    logoImage.color = "transparent";
    
    // Add logo to the logo container
    logoContainer.addControl(logoImage);
    
    // Create bouncing animation using GSAP
    const animateLogo = () => {
      // Create a timeline for the bouncing effect
      const timeline = gsap.timeline({
        repeat: -1, // Infinite repetition
        yoyo: true, // Reverse the animation
        repeatDelay: 0.5, // Pause at the top and bottom
      });
      
      // Add the bounce animation - very slow and subtle
      timeline.to(logoImage, {
        top: -8, // Move up by only 8 pixels for subtle effect
        duration: 3, // Longer duration for slower movement
        ease: "sine.inOut", // Smooth sine wave easing
      });
    };
    
    // Start the animation
    animateLogo();

    // NEW Game Version Text (v0.1.0 Alpha) - Added to mainStackPanel
    const versionText = new GUI.TextBlock("versionText", "V0.1.0 ALPHA");
    versionText.color = "#A0A0A0"; // Light grey for subtlety (can change back to red if needed)
    versionText.fontSize = 16; // Adjusted font size
    versionText.fontFamily = '"Silkscreen", monospace';
    versionText.fontWeight = 'bold'; // Changed to bold
    versionText.height = "30px";
    versionText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    mainStackPanel.addControl(versionText); // Add version text after titlePanel

    // Menu buttons panel
    const menuButtonsPanel = new GUI.StackPanel("menuButtonsPanel");
    menuButtonsPanel.width = "100%";
    menuButtonsPanel.heightInPixels = 350; // Adjusted height, was 300px
    menuButtonsPanel.isVertical = true;
    menuButtonsPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    menuButtonsPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    menuButtonsPanel.spacing = 15;
    mainStackPanel.addControl(menuButtonsPanel);

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

    // Copyright text
    const copyrightText = new GUI.TextBlock("copyrightText", "2025 LION MYSTIC - ALL RIGHTS RESERVED"); // Uppercased
    copyrightText.height = "30px";
    copyrightText.color = "#A0A0A0";
    copyrightText.fontSize = 14;
    copyrightText.fontFamily = '"Silkscreen", monospace'; // Updated to Silkscreen font
    copyrightText.fontWeight = 'bold'; // Added weight
    copyrightText.paddingTopInPixels = 20; // Space above copyright
    mainStackPanel.addControl(copyrightText);

    console.log('Main menu created successfully');
  }
  
  /**
   * Show quit confirmation dialog
   */
  private showQuitConfirmation(): void {
    this.previousMenu = this.activeMenu;
    this.activeMenu = "quitConfirmation";
    this.hideAllMenus();
    this.confirmationDialogContainer.isVisible = true;
    this.confirmationDialogContainer.alpha = 0;
    gsap.to(this.confirmationDialogContainer, { alpha: 1, duration: 0.3 });
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
    pauseTitle.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    pauseTitle.fontWeight = 'bold';
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
    this.optionsMenuContainer.width = 0.8;
    this.optionsMenuContainer.height = 0.8;
    this.optionsMenuContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.optionsMenuContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    this.menuContainer.addControl(this.optionsMenuContainer);

    // Background for the options menu
    const background = new GUI.Rectangle("optionsBackground");
    background.width = 1;
    background.height = 1;
    background.background = "#1c1c1c";
    background.cornerRadius = 20;
    background.thickness = 2;
    background.color = "#3498db";
    this.optionsMenuContainer.addControl(background);

    const mainGrid = new GUI.Grid("optionsMainGrid");
    mainGrid.addColumnDefinition(0.25); // For tabs
    mainGrid.addColumnDefinition(0.75); // For content
    mainGrid.addRowDefinition(1);    // Single row for layout
    background.addControl(mainGrid);

    const tabPanel = new GUI.StackPanel("optionsTabPanel");
    tabPanel.width = "100%";
    tabPanel.isVertical = true;
    tabPanel.paddingLeft = "10px";
    tabPanel.paddingRight = "10px";
    tabPanel.paddingTop = "20px";
    tabPanel.spacing = 10;
    mainGrid.addControl(tabPanel, 0, 0);

    const contentPanel = new GUI.Rectangle("optionsContentPanel");
    contentPanel.width = "100%";
    contentPanel.height = "100%";
    contentPanel.thickness = 0;
    contentPanel.paddingLeft = "10px";
    contentPanel.paddingRight = "10px";
    contentPanel.paddingTop = "20px";
    contentPanel.paddingBottom = "60px"; // Space for Apply/Back buttons
    mainGrid.addControl(contentPanel, 0, 1);

    // Create tab content containers (initially invisible)
    const controlsTabContent = this.createControlsTab();
    controlsTabContent.isVisible = false;
    contentPanel.addControl(controlsTabContent);

    const audioTabContent = this.createAudioTab();
    audioTabContent.isVisible = false;
    contentPanel.addControl(audioTabContent);

    const graphicsTabContent = this.createGraphicsTab();
    graphicsTabContent.isVisible = false;
    contentPanel.addControl(graphicsTabContent);

    const accessibilityTabContent = this.createAccessibilityTab();
    accessibilityTabContent.isVisible = false;
    contentPanel.addControl(accessibilityTabContent);

    // Tab buttons
    const tabs = [
      { name: "Controls", content: controlsTabContent },
      { name: "Audio", content: audioTabContent },
      { name: "Graphics", content: graphicsTabContent },
      { name: "Accessibility", content: accessibilityTabContent },
    ];

    let activeTabContent: GUI.Container | null = null;

    tabs.forEach(tabInfo => {
      const tabButton = this.createTabButton(tabInfo.name.toLowerCase() + "TabButton", tabInfo.name.toUpperCase(), tabInfo.content);
      tabPanel.addControl(tabButton);

      // Store a reference to the button on the content container
      (tabInfo.content as any)._tabButton = tabButton;

      // Click action
      tabButton.onPointerClickObservable.add(() => {
        if (activeTabContent) {
          activeTabContent.isVisible = false;
          // Reset style of previously active tab button
          if ((activeTabContent as any)._tabButton) {
            (activeTabContent as any)._tabButton.background = "#2c3e50";
            (activeTabContent as any)._tabButton.color = "white";
          }
        }
        tabInfo.content.isVisible = true;
        activeTabContent = tabInfo.content;
        // Style active tab button
        tabButton.background = "#3498db";
        tabButton.color = "#1c1c1c";
      });
    });

    // Activate the first tab by default
    if (tabs.length > 0) {
      tabs[0].content.isVisible = true;
      activeTabContent = tabs[0].content;
      if ((tabs[0].content as any)._tabButton) {
        (tabs[0].content as any)._tabButton.background = "#3498db";
        (tabs[0].content as any)._tabButton.color = "#1c1c1c";
      }
    }

    // Back button
    const backButton = this.createMenuButton("optionsBackButton", "BACK", () => {
      this.showPreviousMenu(); // Or specific menu like showMainMenu()
    });
    backButton.width = "150px";
    backButton.height = "40px";
    backButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    backButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    backButton.paddingRight = "20px";
    backButton.paddingBottom = "10px";
    background.addControl(backButton);
  }

  /**
   * Create tab buttons
   */
  private createTabButton(name: string, text: string, tabContent: GUI.Container) {
    const button = GUI.Button.CreateSimpleButton(name, text);
    button.width = "100%";
    button.height = "40px";
    button.color = "white";
    button.background = "#2c3e50";
    button.fontFamily = '"Silkscreen", monospace';
    button.fontWeight = 'bold';
    button.fontSize = 16;
    button.thickness = 0;
    return button;
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
    aboutTitle.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    aboutTitle.fontWeight = 'bold';
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
    overviewTitle.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    overviewTitle.fontWeight = 'bold';
    overviewTitle.fontSize = 22;
    overviewTitle.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    aboutContentPanel.addControl(overviewTitle);
    
    const overviewText = new GUI.TextBlock("overviewText");
    overviewText.text = "In Project Prism Protocol, you assume the role of a spy agent navigating through various environments to complete objectives. The game features multiple level types, weapons, and enemy encounters inspired by classic spy thrillers.";
    overviewText.height = "60px";
    overviewText.color = "white";
    overviewText.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    overviewText.fontSize = 16;
    overviewText.textWrapping = true;
    overviewText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    aboutContentPanel.addControl(overviewText);
    
    // Key features
    const featuresTitle = new GUI.TextBlock("featuresTitle");
    featuresTitle.text = "KEY FEATURES";
    featuresTitle.height = "30px";
    featuresTitle.color = "#3498db";
    featuresTitle.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    featuresTitle.fontWeight = 'bold';
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
    featuresText.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    featuresText.fontSize = 16;
    featuresText.textWrapping = true;
    featuresText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    aboutContentPanel.addControl(featuresText);
    
    // Technical stack
    const techTitle = new GUI.TextBlock("techTitle");
    techTitle.text = "TECHNICAL STACK";
    techTitle.height = "30px";
    techTitle.color = "#3498db";
    techTitle.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    techTitle.fontWeight = 'bold';
    techTitle.fontSize = 22;
    techTitle.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    aboutContentPanel.addControl(techTitle);
    
    const techText = new GUI.TextBlock("techText");
    techText.text = "• Frontend: HTML5/CSS3, TypeScript (ES6+), Babylon.js 7.x, WebGL 2.0\n" +
                    "• Supporting Libraries: Howler.js (audio), AmmoJS (physics), GSAP (animations), Stats.js (performance)";
    techText.height = "60px";
    techText.color = "white";
    techText.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    techText.fontSize = 16;
    techText.textWrapping = true;
    techText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    aboutContentPanel.addControl(techText);
    
    // Browser compatibility
    const browserTitle = new GUI.TextBlock("browserTitle");
    browserTitle.text = "BROWSER COMPATIBILITY";
    browserTitle.height = "30px";
    browserTitle.color = "#3498db";
    browserTitle.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    browserTitle.fontWeight = 'bold';
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
    browserText.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    browserText.fontSize = 16;
    browserText.textWrapping = true;
    browserText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    aboutContentPanel.addControl(browserText);
    
    // Disclaimer
    const disclaimerText = new GUI.TextBlock("disclaimerText");
    disclaimerText.text = "Project Prism Protocol is a fan project inspired by GoldenEye 64 and is not affiliated with or endorsed by the owners of the GoldenEye intellectual property.";
    disclaimerText.height = "60px";
    disclaimerText.color = "#bdc3c7";
    disclaimerText.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
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
    movementHeader.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    movementHeader.fontWeight = 'bold';
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
    actionHeader.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    actionHeader.fontWeight = 'bold';
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
    sensitivityHeader.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    sensitivityHeader.fontWeight = 'bold';
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
    actionText.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    actionText.fontSize = 16;
    actionText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    grid.addControl(actionText, row, 0);
    
    const keyText = new GUI.TextBlock(`key${row}`);
    keyText.text = key;
    keyText.color = "#bdc3c7";
    keyText.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
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
    masterHeader.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    masterHeader.fontWeight = 'bold';
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
    musicHeader.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    musicHeader.fontWeight = 'bold';
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
    sfxHeader.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    sfxHeader.fontWeight = 'bold';
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
    musicToggleLabel.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    musicToggleLabel.fontSize = 16;
    musicToggleLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    musicToggleLabel.paddingLeft = "10px";
    musicToggleLabel.width = "150px"; 
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
    qualityHeader.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    qualityHeader.fontWeight = 'bold';
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
      radioButton.isChecked = index === 1; 
      radioButtons.push(radioButton);
      radioRow.addControl(radioButton);
      
      const radioLabel = new GUI.TextBlock(`radio${option}Label`);
      radioLabel.text = option.toUpperCase();
      radioLabel.color = "white";
      radioLabel.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
      radioLabel.fontSize = 16;
      radioLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      radioLabel.paddingLeft = "10px";
      radioLabel.width = "100px"; 
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
    effectsHeader.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    effectsHeader.fontWeight = 'bold';
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
      checkbox.isChecked = option === "Anti-Aliasing"; 
      checkboxRow.addControl(checkbox);
      
      const checkboxLabel = new GUI.TextBlock(`checkbox${option}Label`);
      checkboxLabel.text = option.toUpperCase();
      checkboxLabel.color = "white";
      checkboxLabel.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
      checkboxLabel.fontSize = 16;
      checkboxLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      checkboxLabel.paddingLeft = "10px";
      checkboxLabel.width = "150px"; 
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
    textSizeHeader.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    textSizeHeader.fontWeight = 'bold';
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
    colorBlindHeader.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    colorBlindHeader.fontWeight = 'bold';
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
      radioButton.isChecked = index === 0; 
      radioButtons.push(radioButton);
      radioRow.addControl(radioButton);
      
      const radioLabel = new GUI.TextBlock(`colorBlind${option}Label`);
      radioLabel.text = option.toUpperCase();
      radioLabel.color = "white";
      radioLabel.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
      radioLabel.fontSize = 16;
      radioLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      radioLabel.paddingLeft = "10px";
      radioLabel.width = "100px"; 
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
    motionLabel.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    motionLabel.fontSize = 16;
    motionLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    motionLabel.paddingLeft = "10px";
    motionLabel.width = "150px"; 
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
    gameOverText.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    gameOverText.fontWeight = 'bold';
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
    const button = GUI.Button.CreateSimpleButton(name, text.toUpperCase());
    button.width = "350px";
    button.height = "50px";
    button.fontFamily = '"Silkscreen", monospace';
    button.fontWeight = 'bold';
    button.fontSize = 22;
    button.cornerRadius = 0;
    
    const originalBgColor = "#101820";
    const originalBorderColor = "#405060";
    const originalTextColor = "#D0D0D0";

    const hoverBgColor = "#2fb8c9";         // Starting cyan color for base hover
    const pulseHoverBgColor = "#217baf";    // Transition to darker blue for pulse
    const clickBgColor = "#217baf";         // Same darker blue for click flash
    const hoverBorderColor = "#FFFFFF";
    const hoverTextColor = "#FFFFFF";

    // Initial style
    button.background = originalBgColor;
    button.color = originalBorderColor;
    button.thickness = 1;
    if (button.textBlock) {
      button.textBlock.color = originalTextColor;
      button.textBlock.fontFamily = '"Silkscreen", monospace';
      button.textBlock.fontWeight = 'bold';
    }

    button.onPointerClickObservable.add(callback); // Keep original click logic for action

    let hoverTween: gsap.core.Tween | null = null;

    button.onPointerEnterObservable.add(() => {
      if (hoverTween) {
        hoverTween.kill();
      }
      // Set text and border color immediately
      if (button.textBlock) {
        button.textBlock.color = hoverTextColor;
      }
      button.color = hoverBorderColor;
      // Start pulse animation for background
      button.background = hoverBgColor; // Start with base hover color
      hoverTween = gsap.to(button, { 
        background: pulseHoverBgColor,
        duration: 0.6, 
        repeat: -1, 
        yoyo: true, 
        ease: "sine.inOut"
      });
      this.scene.hoverCursor = "pointer";
    });

    button.onPointerOutObservable.add(() => {
      if (hoverTween) {
        hoverTween.kill();
        hoverTween = null;
      }
      gsap.to(button, { background: originalBgColor, color: originalBorderColor, duration: 0.1 });
      if (button.textBlock) {
        gsap.to(button.textBlock, { color: originalTextColor, duration: 0.1 });
      }
      this.scene.hoverCursor = "default";
    });

    button.onPointerDownObservable.add(() => {
      if (hoverTween) {
        hoverTween.kill(); // Stop pulse for solid click color
        hoverTween = null;
      }
      gsap.to(button, { background: clickBgColor, duration: 0.05 });
    });

    button.onPointerUpObservable.add(() => {
      // After click, revert to hover base color. If mouse is still over, onPointerEnter will restart pulse.
      // If mouse left, onPointerOut would have already set it to original.
      // This ensures it returns to a non-flashing state quickly.
      gsap.to(button, { background: hoverBgColor, duration: 0.1 }); 
      // The callback is already part of onPointerClickObservable, so no need to call it here again
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
  public async showMainMenu(): Promise<void> {
    try {
      console.log('MenuSystem.showMainMenu() called');
      
      // Check if mainMenuContainer exists
      if (!this.mainMenuContainer) {
        console.error('mainMenuContainer is undefined');
        return;
      }
      
      // Check parent container visibility first
      console.log('Menu container visibility:', this.menuContainer.isVisible);
      console.log('Menu container alpha:', this.menuContainer.alpha);
      
      // Make sure parent container is visible
      this.show();
      
      console.log('After show() - Menu container visibility:', this.menuContainer.isVisible);
      
      console.log('Hiding all menus');
      this.hideAllMenus();
      
      console.log('Setting mainMenuContainer to visible');
      this.mainMenuContainer.isVisible = true;
      
      // Force update the container
      this.advancedTexture.markAsDirty();
      
      console.log('Main menu container visibility:', this.mainMenuContainer.isVisible);
      console.log('Main menu container alpha:', this.mainMenuContainer.alpha);
      
      // Debug all menu containers
      console.log('Debug all containers:');
      console.log('- mainMenuContainer:', this.mainMenuContainer.isVisible);
      console.log('- pauseMenuContainer:', this.pauseMenuContainer.isVisible);
      console.log('- optionsMenuContainer:', this.optionsMenuContainer.isVisible);
      console.log('- aboutScreenContainer:', this.aboutScreenContainer.isVisible);
      console.log('- gameOverContainer:', this.gameOverContainer.isVisible);
      console.log('- confirmationDialogContainer:', this.confirmationDialogContainer.isVisible);
      
      this.activeMenu = "mainMenu";
      
      // Await the music loading promise
      if (this.musicLoadingPromise) {
        await this.musicLoadingPromise;
      }
      
      // Play theme music if it's loaded
      if (this.soundSystem && this.isMusicLoaded) {
        console.log('Playing theme music (ensured loaded)');
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
      } else {
        console.warn('Music could not be played: SoundSystem or music not ready.');
      }
      
      console.log('Main menu should now be visible and music playing if loaded');
    } catch (error) {
      console.error('Error in showMainMenu:', error);
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
    console.log('MenuSystem.hide() called');
    this.menuContainer.isVisible = false;
    console.log('menuContainer visibility after hide():', this.menuContainer.isVisible);
  }

  /**
   * Show the menu system
   */
  public show(): void {
    console.log('MenuSystem.show() called');
    this.menuContainer.isVisible = true;
    
    // Force update the texture
    this.advancedTexture.markAsDirty();
    
    console.log('menuContainer visibility after show():', this.menuContainer.isVisible);
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
