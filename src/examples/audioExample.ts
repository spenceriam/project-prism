/**
 * Audio System Example - Project Prism Protocol
 * 
 * This example demonstrates how to use the audio systems in Project Prism Protocol.
 * It shows how to initialize the audio manager, set up player audio, register ambient
 * sound zones, and handle enemy audio cues.
 */

import { Scene, Engine, Vector3 } from '@babylonjs/core';
import { AudioManager } from '../core/audioManager';
import { PlayerController } from '../components/player/playerController';
import { EnemyType, EnemyState } from '../components/enemies/enemyAudioController';
import { SurfaceType } from '../components/player/playerAudioController';

/**
 * Example audio setup for Project Prism Protocol
 */
export class AudioExample {
  private scene: Scene;
  private engine: Engine;
  private audioManager: AudioManager;
  private playerController: PlayerController | null = null;
  
  /**
   * Creates a new AudioExample
   * @param scene - The Babylon.js scene
   * @param engine - The Babylon.js engine
   */
  constructor(scene: Scene, engine: Engine) {
    this.scene = scene;
    this.engine = engine;
    
    // Create audio manager
    this.audioManager = new AudioManager(scene, {
      masterVolume: 1.0,
      musicVolume: 0.7,
      sfxVolume: 0.8,
      ambienceVolume: 0.6,
      voiceVolume: 0.9
    });
    
    // Initialize example
    this.initialize();
  }
  
  /**
   * Initialize the audio example
   */
  private async initialize(): Promise<void> {
    console.log('Initializing audio example...');
    
    // Set up player controller (if it exists)
    const playerController = this.scene.getMeshByName('playerCollider')?.metadata?.controller as PlayerController;
    if (playerController) {
      this.playerController = playerController;
      this.setupPlayerAudio(playerController);
    } else {
      console.warn('Player controller not found. Some audio features will be disabled.');
    }
    
    // Register ambient sound zones
    this.registerAmbientZones();
    
    // Register example enemies
    this.registerExampleEnemies();
    
    // Start background music
    this.audioManager.playMusic('main_theme');
    
    console.log('Audio example initialized');
  }
  
  /**
   * Set up player audio
   * @param playerController - The player controller
   */
  private setupPlayerAudio(playerController: PlayerController): void {
    // Initialize player audio
    this.audioManager.initializePlayerAudio(playerController);
    
    // Update player position for ambient sound
    this.scene.onBeforeRenderObservable.add(() => {
      const playerPosition = playerController.getPosition();
      this.audioManager.updatePlayerPosition(playerPosition);
    });
  }
  
  /**
   * Register ambient sound zones
   */
  private registerAmbientZones(): void {
    // Training Facility Main Hall
    this.audioManager.registerAmbientZone({
      id: 'training_main_hall',
      name: 'Training Facility - Main Hall',
      position: new Vector3(0, 0, 0),
      radius: 30,
      transitionTime: 2,
      sounds: [
        {
          id: 'amb_training_hall',
          path: 'assets/audio/ambience/training/hall_ambience.mp3',
          volume: 0.6,
          loop: true
        },
        {
          id: 'amb_training_hall_fx',
          path: 'assets/audio/ambience/training/hall_fx.mp3',
          volume: 0.4,
          loop: false,
          randomization: {
            minInterval: 8,
            maxInterval: 20,
            minVolume: 0.3,
            maxVolume: 0.5
          }
        }
      ]
    });
    
    // Training Facility Shooting Range
    this.audioManager.registerAmbientZone({
      id: 'training_shooting_range',
      name: 'Training Facility - Shooting Range',
      position: new Vector3(50, 0, 0),
      radius: 25,
      transitionTime: 1.5,
      sounds: [
        {
          id: 'amb_shooting_range',
          path: 'assets/audio/ambience/training/shooting_range.mp3',
          volume: 0.7,
          loop: true
        },
        {
          id: 'amb_gunshot_distant',
          path: 'assets/audio/ambience/training/distant_gunshot.mp3',
          volume: 0.5,
          loop: false,
          randomization: {
            minInterval: 3,
            maxInterval: 10,
            minVolume: 0.3,
            maxVolume: 0.6
          }
        }
      ]
    });
    
    // Training Facility Outdoor Area
    this.audioManager.registerAmbientZone({
      id: 'training_outdoor',
      name: 'Training Facility - Outdoor Area',
      position: new Vector3(0, 0, 50),
      radius: 40,
      transitionTime: 2,
      sounds: [
        {
          id: 'amb_outdoor',
          path: 'assets/audio/ambience/training/outdoor.mp3',
          volume: 0.5,
          loop: true
        },
        {
          id: 'amb_wind',
          path: 'assets/audio/ambience/training/wind.mp3',
          volume: 0.4,
          loop: true
        },
        {
          id: 'amb_birds',
          path: 'assets/audio/ambience/training/birds.mp3',
          volume: 0.3,
          loop: false,
          randomization: {
            minInterval: 10,
            maxInterval: 30,
            minVolume: 0.2,
            maxVolume: 0.4
          }
        }
      ]
    });
  }
  
  /**
   * Register example enemies
   */
  private registerExampleEnemies(): void {
    // Register a standard guard enemy
    this.audioManager.registerEnemy(
      'guard_001',
      EnemyType.GUARD,
      new Vector3(20, 0, 10),
      EnemyState.PATROL
    );
    
    // Register an elite guard enemy
    this.audioManager.registerEnemy(
      'elite_001',
      EnemyType.ELITE,
      new Vector3(-15, 0, 25),
      EnemyState.IDLE
    );
    
    // Register a heavy enemy
    this.audioManager.registerEnemy(
      'heavy_001',
      EnemyType.HEAVY,
      new Vector3(30, 0, -20),
      EnemyState.PATROL
    );
    
    // Set up a demo to change enemy states after a delay
    setTimeout(() => {
      // Change guard to alert state
      this.audioManager.updateEnemyState('guard_001', EnemyState.ALERT);
      
      // Move guard position
      this.audioManager.updateEnemyPosition('guard_001', new Vector3(15, 0, 5));
      
      // Play combat sound for elite guard
      this.audioManager.playEnemyCombatSound(
        'elite_001',
        'gunshot',
        new Vector3(-15, 0, 25)
      );
    }, 10000); // After 10 seconds
    
    // Change to combat state after another delay
    setTimeout(() => {
      // Change guard to combat state
      this.audioManager.updateEnemyState('guard_001', EnemyState.COMBAT);
      
      // Change elite to combat state
      this.audioManager.updateEnemyState('elite_001', EnemyState.COMBAT);
      
      // Switch to combat music
      this.audioManager.playMusic('combat');
    }, 15000); // After 15 seconds
  }
  
  /**
   * Example of how to handle player actions that trigger sounds
   * @param actionType - Type of action (jump, land, shoot, etc.)
   */
  public handlePlayerAction(actionType: string): void {
    switch (actionType) {
      case 'jump':
        // Jump sound is handled automatically by PlayerAudioController
        break;
        
      case 'shoot':
        // Weapon sounds would typically be handled by the weapon system
        // This is just an example of how to play a sound directly
        this.audioManager.playUISound('click');
        break;
        
      case 'damage':
        // Play UI damage sound
        this.audioManager.playUISound('damage');
        break;
    }
  }
  
  /**
   * Example of how to handle UI sound effects
   * @param uiAction - Type of UI action (click, hover, etc.)
   */
  public handleUIAction(uiAction: string): void {
    this.audioManager.playUISound(uiAction);
  }
  
  /**
   * Example of how to change music based on game state
   * @param gameState - Current game state (menu, combat, stealth, etc.)
   */
  public changeMusic(gameState: string): void {
    this.audioManager.playMusic(gameState);
  }
  
  /**
   * Example of how to update audio settings
   * @param settingType - Type of setting to update
   * @param value - New value
   */
  public updateAudioSettings(settingType: string, value: number | boolean): void {
    switch (settingType) {
      case 'masterVolume':
        this.audioManager.setMasterVolume(value as number);
        break;
        
      case 'musicVolume':
        this.audioManager.setMusicVolume(value as number);
        break;
        
      case 'sfxVolume':
        this.audioManager.setSFXVolume(value as number);
        break;
        
      case 'ambienceVolume':
        this.audioManager.setAmbienceVolume(value as number);
        break;
        
      case 'voiceVolume':
        this.audioManager.setVoiceVolume(value as number);
        break;
        
      case 'muteAll':
        this.audioManager.setMuted(value as boolean);
        break;
        
      case 'enableFootsteps':
        this.audioManager.setFootstepsEnabled(value as boolean);
        break;
        
      case 'enableAmbience':
        this.audioManager.setAmbienceEnabled(value as boolean);
        break;
        
      case 'enableEnemyVoice':
        this.audioManager.setEnemyVoiceEnabled(value as boolean);
        break;
    }
  }
  
  /**
   * Dispose the audio example and release resources
   */
  public dispose(): void {
    this.audioManager.dispose();
  }
}

/**
 * Example usage:
 * 
 * // In your main game file:
 * import { AudioExample } from './examples/audioExample';
 * 
 * // Create scene and engine
 * const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
 * const engine = new Engine(canvas, true);
 * const scene = new Scene(engine);
 * 
 * // Create audio example
 * const audioExample = new AudioExample(scene, engine);
 * 
 * // Handle player actions
 * playerController.onJump.add(() => {
 *   audioExample.handlePlayerAction('jump');
 * });
 * 
 * // Handle UI actions
 * button.onPointerUpObservable.add(() => {
 *   audioExample.handleUIAction('click');
 * });
 * 
 * // Update audio settings from UI
 * volumeSlider.onValueChangedObservable.add((value) => {
 *   audioExample.updateAudioSettings('masterVolume', value);
 * });
 * 
 * // Clean up when done
 * scene.onDisposeObservable.add(() => {
 *   audioExample.dispose();
 * });
 */
