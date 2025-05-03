/**
 * EnemyAudioController - Handles all audio related to enemy actions
 * 
 * Manages enemy footsteps, alert sounds, attack sounds, and other enemy-related
 * audio effects for Project Prism Protocol.
 */

import { Scene, Vector3, Observable } from '@babylonjs/core';
import { SoundSystem, SoundCategory } from '../../core/sound';

/**
 * Enemy state for audio cues
 */
export enum EnemyState {
  IDLE = 'idle',
  PATROL = 'patrol',
  ALERT = 'alert',
  SEARCH = 'search',
  COMBAT = 'combat',
  DEATH = 'death'
}

/**
 * Enemy type for audio variations
 */
export enum EnemyType {
  GUARD = 'guard',
  ELITE = 'elite',
  HEAVY = 'heavy'
}

/**
 * Configuration for enemy audio
 */
export interface EnemyAudioConfig {
  footstepVolume: number;
  voiceVolume: number;
  combatVolume: number;
  maxDistance: number;
  refDistance: number;
  rolloffFactor: number;
}

/**
 * EnemyAudioController manages all audio related to enemy actions
 */
export class EnemyAudioController {
  private scene: Scene;
  private soundSystem: SoundSystem;
  
  // Audio configuration
  private config: EnemyAudioConfig;
  
  // Enemy tracking
  private enemies: Map<string, {
    type: EnemyType;
    position: Vector3;
    state: EnemyState;
    lastFootstepTime: number;
    lastStateChangeTime: number;
    footstepInterval: number;
  }> = new Map();
  
  // Sound loaded flag
  private soundsLoaded: boolean = false;
  
  // Events
  public onEnemyAudioPlayed: Observable<{enemyId: string, soundType: string}> = new Observable();
  
  /**
   * Creates a new EnemyAudioController
   * @param scene - The Babylon.js scene
   * @param soundSystem - The sound system
   * @param config - Audio configuration (optional)
   */
  constructor(
    scene: Scene, 
    soundSystem: SoundSystem,
    config?: Partial<EnemyAudioConfig>
  ) {
    this.scene = scene;
    this.soundSystem = soundSystem;
    
    // Set default configuration
    this.config = {
      footstepVolume: 0.4,
      voiceVolume: 0.7,
      combatVolume: 0.8,
      maxDistance: 50,
      refDistance: 5,
      rolloffFactor: 1.5,
      ...config
    };
    
    // Initialize audio
    this.initialize();
  }
  
  /**
   * Initialize enemy audio
   */
  private async initialize(): Promise<void> {
    // Load enemy sounds
    await this.loadEnemySounds();
    
    // Start update loop
    this.scene.onBeforeRenderObservable.add(() => this.update());
  }
  
  /**
   * Load enemy sounds
   */
  private async loadEnemySounds(): Promise<void> {
    try {
      // Load footstep sounds
      await this.loadFootstepSounds();
      
      // Load voice sounds for each enemy type
      await this.loadVoiceSounds(EnemyType.GUARD);
      await this.loadVoiceSounds(EnemyType.ELITE);
      await this.loadVoiceSounds(EnemyType.HEAVY);
      
      // Load combat sounds
      await this.loadCombatSounds();
      
      this.soundsLoaded = true;
      console.log('Enemy audio loaded successfully');
    } catch (error) {
      console.error('Failed to load enemy audio:', error);
    }
  }
  
  /**
   * Load footstep sounds for enemies
   */
  private async loadFootstepSounds(): Promise<void> {
    // Load footstep sounds for each enemy type
    for (const enemyType of Object.values(EnemyType)) {
      // Load 4 footstep variations for each enemy type
      for (let i = 1; i <= 4; i++) {
        await this.soundSystem.loadSound(
          `footstep_${enemyType}_${i}`,
          `assets/audio/enemies/${enemyType}/footsteps/step_${i}.mp3`,
          {
            volume: this.config.footstepVolume,
            category: SoundCategory.SFX
          }
        );
      }
    }
  }
  
  /**
   * Load voice sounds for a specific enemy type
   * @param enemyType - The enemy type
   */
  private async loadVoiceSounds(enemyType: EnemyType): Promise<void> {
    // Load voice sounds for different states
    const states = [
      { state: EnemyState.IDLE, count: 2 },
      { state: EnemyState.ALERT, count: 3 },
      { state: EnemyState.SEARCH, count: 3 },
      { state: EnemyState.COMBAT, count: 4 },
      { state: EnemyState.DEATH, count: 3 }
    ];
    
    for (const { state, count } of states) {
      for (let i = 1; i <= count; i++) {
        await this.soundSystem.loadSound(
          `voice_${enemyType}_${state}_${i}`,
          `assets/audio/enemies/${enemyType}/voice/${state}_${i}.mp3`,
          {
            volume: this.config.voiceVolume,
            category: SoundCategory.VOICE
          }
        );
      }
    }
  }
  
  /**
   * Load combat sounds for enemies
   */
  private async loadCombatSounds(): Promise<void> {
    // Load common combat sounds
    const combatSounds = [
      { id: 'enemy_gunshot', path: 'assets/audio/enemies/weapons/gunshot.mp3' },
      { id: 'enemy_reload', path: 'assets/audio/enemies/weapons/reload.mp3' },
      { id: 'enemy_melee', path: 'assets/audio/enemies/weapons/melee.mp3' },
      { id: 'enemy_hit', path: 'assets/audio/enemies/combat/hit.mp3' }
    ];
    
    for (const sound of combatSounds) {
      await this.soundSystem.loadSound(
        sound.id,
        sound.path,
        {
          volume: this.config.combatVolume,
          category: SoundCategory.SFX
        }
      );
    }
  }
  
  /**
   * Update enemy audio based on enemy states
   */
  private update(): void {
    if (!this.soundsLoaded) return;
    
    const currentTime = performance.now();
    
    // Update each enemy
    this.enemies.forEach((enemy, enemyId) => {
      // Handle footstep sounds
      if (enemy.state === EnemyState.PATROL || 
          enemy.state === EnemyState.ALERT || 
          enemy.state === EnemyState.SEARCH || 
          enemy.state === EnemyState.COMBAT) {
        
        // Check if it's time for a footstep
        if (currentTime - enemy.lastFootstepTime > enemy.footstepInterval) {
          this.playEnemyFootstep(enemyId, enemy.type, enemy.position);
          enemy.lastFootstepTime = currentTime;
        }
      }
      
      // Handle random voice sounds based on state
      // Only play occasional voice sounds when in certain states
      if (enemy.state === EnemyState.ALERT || 
          enemy.state === EnemyState.SEARCH || 
          enemy.state === EnemyState.COMBAT) {
        
        // Random chance to play voice sound (roughly every 5-15 seconds)
        const timeSinceStateChange = currentTime - enemy.lastStateChangeTime;
        const minTimeForVoice = 5000; // 5 seconds
        
        if (timeSinceStateChange > minTimeForVoice && Math.random() < 0.005) { // ~0.5% chance per frame
          this.playEnemyVoice(enemyId, enemy.type, enemy.state, enemy.position);
        }
      }
    });
  }
  
  /**
   * Register a new enemy for audio tracking
   * @param enemyId - Unique ID for the enemy
   * @param type - Enemy type
   * @param position - Initial position
   * @param state - Initial state
   */
  public registerEnemy(
    enemyId: string,
    type: EnemyType,
    position: Vector3,
    state: EnemyState = EnemyState.IDLE
  ): void {
    // Determine footstep interval based on enemy type
    let footstepInterval = 500; // Default: 500ms between steps
    
    switch (type) {
      case EnemyType.GUARD:
        footstepInterval = 500;
        break;
      case EnemyType.ELITE:
        footstepInterval = 450;
        break;
      case EnemyType.HEAVY:
        footstepInterval = 700;
        break;
    }
    
    // Register enemy
    this.enemies.set(enemyId, {
      type,
      position: position.clone(),
      state,
      lastFootstepTime: performance.now(),
      lastStateChangeTime: performance.now(),
      footstepInterval
    });
  }
  
  /**
   * Update enemy position
   * @param enemyId - Enemy ID
   * @param position - New position
   */
  public updateEnemyPosition(enemyId: string, position: Vector3): void {
    const enemy = this.enemies.get(enemyId);
    if (enemy) {
      enemy.position = position.clone();
    }
  }
  
  /**
   * Update enemy state
   * @param enemyId - Enemy ID
   * @param state - New state
   */
  public updateEnemyState(enemyId: string, state: EnemyState): void {
    const enemy = this.enemies.get(enemyId);
    if (enemy && enemy.state !== state) {
      const previousState = enemy.state;
      enemy.state = state;
      enemy.lastStateChangeTime = performance.now();
      
      // Play state transition sound
      this.playStateTransitionSound(enemyId, enemy.type, previousState, state, enemy.position);
    }
  }
  
  /**
   * Play a footstep sound for an enemy
   * @param enemyId - Enemy ID
   * @param enemyType - Enemy type
   * @param position - Enemy position
   */
  private playEnemyFootstep(enemyId: string, enemyType: EnemyType, position: Vector3): void {
    // Get a random footstep sound for this enemy type
    const variation = Math.floor(Math.random() * 4) + 1;
    const soundId = `footstep_${enemyType}_${variation}`;
    
    // Play spatial sound at enemy position
    this.playSpatialSound(soundId, position);
    
    // Notify observers
    this.onEnemyAudioPlayed.notifyObservers({
      enemyId,
      soundType: 'footstep'
    });
  }
  
  /**
   * Play a voice sound for an enemy
   * @param enemyId - Enemy ID
   * @param enemyType - Enemy type
   * @param state - Enemy state
   * @param position - Enemy position
   */
  private playEnemyVoice(enemyId: string, enemyType: EnemyType, state: EnemyState, position: Vector3): void {
    // Determine how many voice variations exist for this state
    let count = 2;
    switch (state) {
      case EnemyState.ALERT:
      case EnemyState.SEARCH:
        count = 3;
        break;
      case EnemyState.COMBAT:
        count = 4;
        break;
      case EnemyState.DEATH:
        count = 3;
        break;
    }
    
    // Get a random voice sound for this enemy type and state
    const variation = Math.floor(Math.random() * count) + 1;
    const soundId = `voice_${enemyType}_${state}_${variation}`;
    
    // Play spatial sound at enemy position
    this.playSpatialSound(soundId, position);
    
    // Notify observers
    this.onEnemyAudioPlayed.notifyObservers({
      enemyId,
      soundType: 'voice'
    });
  }
  
  /**
   * Play a state transition sound
   * @param enemyId - Enemy ID
   * @param enemyType - Enemy type
   * @param previousState - Previous state
   * @param newState - New state
   * @param position - Enemy position
   */
  private playStateTransitionSound(
    enemyId: string,
    enemyType: EnemyType,
    previousState: EnemyState,
    newState: EnemyState,
    position: Vector3
  ): void {
    // Play appropriate transition sound based on state change
    if (previousState === EnemyState.IDLE || previousState === EnemyState.PATROL) {
      if (newState === EnemyState.ALERT) {
        // Play alert sound (spotted player)
        this.playEnemyVoice(enemyId, enemyType, EnemyState.ALERT, position);
      }
    }
    
    if (newState === EnemyState.COMBAT && previousState !== EnemyState.COMBAT) {
      // Play combat initiation sound
      this.playEnemyVoice(enemyId, enemyType, EnemyState.COMBAT, position);
    }
    
    if (newState === EnemyState.SEARCH && 
       (previousState === EnemyState.COMBAT || previousState === EnemyState.ALERT)) {
      // Play search initiation sound (lost player)
      this.playEnemyVoice(enemyId, enemyType, EnemyState.SEARCH, position);
    }
    
    if (newState === EnemyState.DEATH) {
      // Play death sound
      this.playEnemyVoice(enemyId, enemyType, EnemyState.DEATH, position);
    }
  }
  
  /**
   * Play a combat sound for an enemy
   * @param enemyId - Enemy ID
   * @param soundType - Type of combat sound (gunshot, reload, melee, hit)
   * @param position - Enemy position
   */
  public playEnemyCombatSound(enemyId: string, soundType: string, position: Vector3): void {
    let soundId = '';
    
    switch (soundType) {
      case 'gunshot':
        soundId = 'enemy_gunshot';
        break;
      case 'reload':
        soundId = 'enemy_reload';
        break;
      case 'melee':
        soundId = 'enemy_melee';
        break;
      case 'hit':
        soundId = 'enemy_hit';
        break;
      default:
        return;
    }
    
    // Play spatial sound at enemy position
    this.playSpatialSound(soundId, position);
    
    // Notify observers
    this.onEnemyAudioPlayed.notifyObservers({
      enemyId,
      soundType
    });
  }
  
  /**
   * Play a spatial sound at a position
   * @param soundId - Sound ID
   * @param position - Position to play sound at
   */
  private playSpatialSound(soundId: string, position: Vector3): void {
    // Check if sound exists in sound system
    if (!this.soundSystem.isPlaying(soundId)) {
      // Load spatial sound if needed
      this.soundSystem.loadSpatialSound(
        `spatial_${soundId}`,
        `assets/audio/${soundId}.mp3`,
        position,
        {
          category: SoundCategory.SFX,
          maxDistance: this.config.maxDistance,
          refDistance: this.config.refDistance,
          rolloffFactor: this.config.rolloffFactor
        }
      ).then(() => {
        // Play the sound
        this.soundSystem.playSound(`spatial_${soundId}`);
      }).catch(error => {
        console.error(`Failed to load spatial sound ${soundId}:`, error);
      });
    } else {
      // Update position and play
      this.soundSystem.setSoundPosition(`spatial_${soundId}`, position);
      this.soundSystem.playSound(`spatial_${soundId}`);
    }
  }
  
  /**
   * Remove an enemy from audio tracking
   * @param enemyId - Enemy ID
   */
  public removeEnemy(enemyId: string): void {
    this.enemies.delete(enemyId);
  }
  
  /**
   * Dispose the enemy audio controller
   */
  public dispose(): void {
    // Remove from update loop
    this.scene.onBeforeRenderObservable.removeCallback(() => this.update());
    
    // Clear collections
    this.enemies.clear();
    
    // Clear observables
    this.onEnemyAudioPlayed.clear();
  }
}
