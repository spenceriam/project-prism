/**
 * PlayerAudioController - Handles all audio related to player actions
 * 
 * Manages footstep sounds, jump sounds, landing sounds, and other player-related audio effects
 * for Project Prism Protocol.
 */

import { Scene, Vector3, Observable } from '@babylonjs/core';
import { SoundSystem, SoundCategory } from '../../core/sound';
import { PlayerController, PlayerState } from './playerController';

/**
 * Surface types for footstep sounds
 */
export enum SurfaceType {
  DEFAULT = 'default',
  CONCRETE = 'concrete',
  METAL = 'metal',
  WOOD = 'wood',
  CARPET = 'carpet',
  GRASS = 'grass',
  WATER = 'water',
  TILE = 'tile'
}

/**
 * Configuration for player audio
 */
export interface PlayerAudioConfig {
  footstepVolume: number;
  jumpVolume: number;
  landVolume: number;
  footstepInterval: number; // Time between footsteps in ms
  sprintFootstepInterval: number; // Time between footsteps when sprinting
  crouchFootstepInterval: number; // Time between footsteps when crouching
}

/**
 * PlayerAudioController manages all audio related to player actions
 */
export class PlayerAudioController {
  private scene: Scene;
  private soundSystem: SoundSystem;
  private playerController: PlayerController;
  
  // Audio configuration
  private config: PlayerAudioConfig;
  
  // Audio state tracking
  private lastFootstepTime: number = 0;
  private currentSurfaceType: SurfaceType = SurfaceType.DEFAULT;
  private wasGrounded: boolean = true;
  private wasMoving: boolean = false;
  private wasCrouching: boolean = false;
  private wasSprinting: boolean = false;
  private wasJumping: boolean = false;
  
  // Footstep sounds loaded flag
  private footstepSoundsLoaded: boolean = false;
  
  // Events
  public onSurfaceChanged: Observable<SurfaceType> = new Observable<SurfaceType>();
  
  /**
   * Creates a new PlayerAudioController
   * @param scene - The Babylon.js scene
   * @param soundSystem - The sound system
   * @param playerController - The player controller
   * @param config - Audio configuration (optional)
   */
  constructor(
    scene: Scene, 
    soundSystem: SoundSystem, 
    playerController: PlayerController,
    config?: Partial<PlayerAudioConfig>
  ) {
    this.scene = scene;
    this.soundSystem = soundSystem;
    this.playerController = playerController;
    
    // Set default configuration
    this.config = {
      footstepVolume: 0.5,
      jumpVolume: 0.7,
      landVolume: 0.6,
      footstepInterval: 500, // 500ms between steps
      sprintFootstepInterval: 350, // 350ms between steps when sprinting
      crouchFootstepInterval: 700, // 700ms between steps when crouching
      ...config
    };
    
    // Initialize audio
    this.initialize();
  }
  
  /**
   * Initialize player audio
   */
  private async initialize(): Promise<void> {
    // Load player movement sounds
    await this.loadPlayerSounds();
    
    // Start update loop
    this.scene.onBeforeRenderObservable.add(() => this.update());
  }
  
  /**
   * Load player movement sounds
   */
  private async loadPlayerSounds(): Promise<void> {
    try {
      // Load footstep sounds for different surfaces
      await Promise.all([
        // Default surface (concrete)
        this.loadFootstepSounds(SurfaceType.DEFAULT),
        
        // Other surfaces
        this.loadFootstepSounds(SurfaceType.CONCRETE),
        this.loadFootstepSounds(SurfaceType.METAL),
        this.loadFootstepSounds(SurfaceType.WOOD),
        this.loadFootstepSounds(SurfaceType.TILE)
      ]);
      
      // Load jump sounds
      await this.soundSystem.loadSound(
        'player_jump',
        'assets/audio/player/jump.mp3',
        {
          volume: this.config.jumpVolume,
          category: SoundCategory.SFX
        }
      );
      
      // Load landing sounds
      await this.soundSystem.loadSound(
        'player_land_soft',
        'assets/audio/player/land_soft.mp3',
        {
          volume: this.config.landVolume,
          category: SoundCategory.SFX
        }
      );
      
      await this.soundSystem.loadSound(
        'player_land_hard',
        'assets/audio/player/land_hard.mp3',
        {
          volume: this.config.landVolume * 1.2,
          category: SoundCategory.SFX
        }
      );
      
      this.footstepSoundsLoaded = true;
      console.log('Player audio loaded successfully');
    } catch (error) {
      console.error('Failed to load player audio:', error);
    }
  }
  
  /**
   * Load footstep sounds for a specific surface type
   * @param surfaceType - The surface type
   */
  private async loadFootstepSounds(surfaceType: SurfaceType): Promise<void> {
    // Load 4 footstep variations for each surface
    for (let i = 1; i <= 4; i++) {
      await this.soundSystem.loadSound(
        `footstep_${surfaceType}_${i}`,
        `assets/audio/player/footsteps/${surfaceType}/step_${i}.mp3`,
        {
          volume: this.config.footstepVolume,
          category: SoundCategory.SFX
        }
      );
    }
  }
  
  /**
   * Update player audio based on player state
   */
  private update(): void {
    if (!this.footstepSoundsLoaded) return;
    
    // Get current player state
    const playerState = this.playerController.getState();
    const playerPosition = this.playerController.getPosition();
    
    // Detect surface type based on position
    this.detectSurfaceType(playerPosition);
    
    // Handle movement sounds
    this.handleMovementSounds(playerState);
    
    // Handle jump and land sounds
    this.handleJumpLandSounds(playerState);
    
    // Update previous state tracking
    this.wasGrounded = playerState.isJumping === false;
    this.wasMoving = playerState.isMoving;
    this.wasCrouching = playerState.isCrouching;
    this.wasSprinting = playerState.isSprinting;
    this.wasJumping = playerState.isJumping;
  }
  
  /**
   * Detect the surface type based on player position
   * @param position - Player position
   */
  private detectSurfaceType(position: Vector3): void {
    // TODO: Implement proper surface detection based on raycasting
    // For now, we'll use a simple height-based detection as a placeholder
    
    // Check if we're in a specific area of the map
    // This is a placeholder implementation that should be replaced with
    // proper material/mesh detection in the future
    
    let newSurfaceType = SurfaceType.DEFAULT;
    
    // Example surface detection based on Y position (height)
    if (position.y < 1) {
      newSurfaceType = SurfaceType.CONCRETE;
    } else if (position.y > 10) {
      newSurfaceType = SurfaceType.METAL;
    } else if (position.x > 20 && position.z > 20) {
      newSurfaceType = SurfaceType.WOOD;
    } else if (position.x < -20 && position.z < -20) {
      newSurfaceType = SurfaceType.TILE;
    }
    
    // If surface type changed, notify observers
    if (newSurfaceType !== this.currentSurfaceType) {
      this.currentSurfaceType = newSurfaceType;
      this.onSurfaceChanged.notifyObservers(this.currentSurfaceType);
    }
  }
  
  /**
   * Handle player movement sounds (footsteps)
   * @param playerState - Current player state
   */
  private handleMovementSounds(playerState: PlayerState): void {
    // Only play footsteps if player is moving and grounded
    if (playerState.isMoving && !playerState.isJumping) {
      const currentTime = performance.now();
      
      // Determine footstep interval based on movement state
      let footstepInterval = this.config.footstepInterval;
      
      if (playerState.isSprinting) {
        footstepInterval = this.config.sprintFootstepInterval;
      } else if (playerState.isCrouching) {
        footstepInterval = this.config.crouchFootstepInterval;
      }
      
      // Check if it's time for a footstep
      if (currentTime - this.lastFootstepTime > footstepInterval) {
        this.playFootstepSound();
        this.lastFootstepTime = currentTime;
      }
    }
  }
  
  /**
   * Handle jump and landing sounds
   * @param playerState - Current player state
   */
  private handleJumpLandSounds(playerState: PlayerState): void {
    // Play jump sound when player jumps
    if (playerState.isJumping && !this.wasJumping) {
      this.soundSystem.playSound('player_jump');
    }
    
    // Play landing sound when player lands
    if (!playerState.isJumping && this.wasJumping && this.wasGrounded === false) {
      // Determine if it's a hard or soft landing
      const landingSoundId = 'player_land_soft';
      this.soundSystem.playSound(landingSoundId);
    }
  }
  
  /**
   * Play a random footstep sound for the current surface
   */
  private playFootstepSound(): void {
    // Get a random footstep sound for the current surface
    const variation = Math.floor(Math.random() * 4) + 1;
    const soundId = `footstep_${this.currentSurfaceType}_${variation}`;
    
    // Play the footstep sound
    this.soundSystem.playSound(soundId);
  }
  
  /**
   * Set the footstep volume
   * @param volume - Volume level (0-1)
   */
  public setFootstepVolume(volume: number): void {
    this.config.footstepVolume = Math.max(0, Math.min(1, volume));
  }
  
  /**
   * Dispose the player audio controller
   */
  public dispose(): void {
    // Remove from update loop
    this.scene.onBeforeRenderObservable.removeCallback(() => this.update());
    
    // Clear observables
    this.onSurfaceChanged.clear();
  }
}
