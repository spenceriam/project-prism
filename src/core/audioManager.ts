/**
 * AudioManager - Main audio management system for Project Prism Protocol
 * 
 * Integrates all audio subsystems including player audio, enemy audio, and ambient sounds
 * to provide a comprehensive audio experience.
 */

import { Scene, Vector3 } from '@babylonjs/core';
import { SoundSystem, SoundCategory } from './sound';
import { PlayerAudioController, SurfaceType } from '../components/player/playerAudioController';
import { AmbientSoundSystem, AmbientSoundZone } from '../components/environment/ambientSoundSystem';
import { EnemyAudioController, EnemyType, EnemyState } from '../components/enemies/enemyAudioController';
import { PlayerController } from '../components/player/playerController';

/**
 * AudioManager configuration
 */
export interface AudioManagerConfig {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  voiceVolume: number;
  enableFootsteps: boolean;
  enableAmbience: boolean;
  enableEnemyVoice: boolean;
}

/**
 * AudioManager integrates all audio subsystems
 */
export class AudioManager {
  private scene: Scene;
  private soundSystem: SoundSystem;
  
  // Audio subsystems
  private playerAudio: PlayerAudioController | null = null;
  private ambientAudio: AmbientSoundSystem | null = null;
  private enemyAudio: EnemyAudioController | null = null;
  
  // Configuration
  private config: AudioManagerConfig;
  
  // Audio state
  private currentMusic: string | null = null;
  
  /**
   * Creates a new AudioManager
   * @param scene - The Babylon.js scene
   * @param config - Audio configuration (optional)
   */
  constructor(scene: Scene, config?: Partial<AudioManagerConfig>) {
    this.scene = scene;
    
    // Set default configuration
    this.config = {
      masterVolume: 1.0,
      musicVolume: 0.7,
      sfxVolume: 1.0,
      ambienceVolume: 0.8,
      voiceVolume: 1.0,
      enableFootsteps: true,
      enableAmbience: true,
      enableEnemyVoice: true,
      ...config
    };
    
    // Create sound system
    this.soundSystem = new SoundSystem(scene, {
      volume: this.config.masterVolume,
      masterMuted: false,
      musicVolume: this.config.musicVolume,
      sfxVolume: this.config.sfxVolume,
      ambienceVolume: this.config.ambienceVolume,
      voiceVolume: this.config.voiceVolume
    });
    
    // Create ambient sound system
    this.ambientAudio = new AmbientSoundSystem(scene, this.soundSystem);
    
    // Create enemy audio controller
    this.enemyAudio = new EnemyAudioController(scene, this.soundSystem);
    
    // Initialize audio
    this.initialize();
  }
  
  /**
   * Initialize audio systems
   */
  private async initialize(): Promise<void> {
    console.log('Initializing audio systems...');
    
    // Load common audio assets
    await this.loadCommonAudio();
    
    console.log('Audio systems initialized');
  }
  
  /**
   * Load common audio assets
   */
  private async loadCommonAudio(): Promise<void> {
    try {
      // Load UI sounds
      await this.soundSystem.loadSound(
        'ui_click',
        'assets/audio/ui/click.mp3',
        {
          volume: 0.5,
          category: SoundCategory.SFX
        }
      );
      
      await this.soundSystem.loadSound(
        'ui_hover',
        'assets/audio/ui/hover.mp3',
        {
          volume: 0.3,
          category: SoundCategory.SFX
        }
      );
      
      // Load music tracks
      await this.soundSystem.loadSound(
        'music_main_theme',
        'assets/audio/music/main_theme.mp3',
        {
          volume: 1.0,
          loop: true,
          category: SoundCategory.MUSIC
        }
      );
      
      await this.soundSystem.loadSound(
        'music_combat',
        'assets/audio/music/combat.mp3',
        {
          volume: 1.0,
          loop: true,
          category: SoundCategory.MUSIC
        }
      );
      
      await this.soundSystem.loadSound(
        'music_stealth',
        'assets/audio/music/stealth.mp3',
        {
          volume: 1.0,
          loop: true,
          category: SoundCategory.MUSIC
        }
      );
      
    } catch (error) {
      console.error('Failed to load common audio:', error);
    }
  }
  
  /**
   * Initialize player audio
   * @param playerController - The player controller
   */
  public initializePlayerAudio(playerController: PlayerController): void {
    // Create player audio controller
    this.playerAudio = new PlayerAudioController(
      this.scene,
      this.soundSystem,
      playerController
    );
    
    console.log('Player audio initialized');
  }
  
  /**
   * Register an ambient sound zone
   * @param zone - The ambient sound zone configuration
   */
  public registerAmbientZone(zone: AmbientSoundZone): void {
    if (this.ambientAudio) {
      this.ambientAudio.registerZone(zone);
    }
  }
  
  /**
   * Update player position for ambient sound
   * @param position - Player position
   */
  public updatePlayerPosition(position: Vector3): void {
    if (this.ambientAudio) {
      this.ambientAudio.updatePlayerPosition(position);
    }
  }
  
  /**
   * Register an enemy for audio tracking
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
    if (this.enemyAudio) {
      this.enemyAudio.registerEnemy(enemyId, type, position, state);
    }
  }
  
  /**
   * Update enemy position
   * @param enemyId - Enemy ID
   * @param position - New position
   */
  public updateEnemyPosition(enemyId: string, position: Vector3): void {
    if (this.enemyAudio) {
      this.enemyAudio.updateEnemyPosition(enemyId, position);
    }
  }
  
  /**
   * Update enemy state
   * @param enemyId - Enemy ID
   * @param state - New state
   */
  public updateEnemyState(enemyId: string, state: EnemyState): void {
    if (this.enemyAudio) {
      this.enemyAudio.updateEnemyState(enemyId, state);
    }
  }
  
  /**
   * Play a combat sound for an enemy
   * @param enemyId - Enemy ID
   * @param soundType - Type of combat sound (gunshot, reload, melee, hit)
   * @param position - Enemy position
   */
  public playEnemyCombatSound(enemyId: string, soundType: string, position: Vector3): void {
    if (this.enemyAudio) {
      this.enemyAudio.playEnemyCombatSound(enemyId, soundType, position);
    }
  }
  
  /**
   * Play a UI sound
   * @param soundId - Sound ID (click, hover)
   */
  public playUISound(soundId: string): void {
    this.soundSystem.playSound(`ui_${soundId}`);
  }
  
  /**
   * Play background music
   * @param trackId - Track ID (main_theme, combat, stealth)
   * @param fadeTime - Fade time in seconds
   */
  public playMusic(trackId: string, fadeTime: number = 2): void {
    if (this.currentMusic === trackId) return;
    
    this.soundSystem.playMusic(`music_${trackId}`, fadeTime);
    this.currentMusic = trackId;
  }
  
  /**
   * Stop background music
   * @param fadeTime - Fade time in seconds
   */
  public stopMusic(fadeTime: number = 2): void {
    this.soundSystem.stopMusic(fadeTime);
    this.currentMusic = null;
  }
  
  /**
   * Set master volume
   * @param volume - Volume level (0-1)
   */
  public setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    this.soundSystem.setMasterVolume(this.config.masterVolume);
  }
  
  /**
   * Set music volume
   * @param volume - Volume level (0-1)
   */
  public setMusicVolume(volume: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, volume));
    this.soundSystem.setCategoryVolume(SoundCategory.MUSIC, this.config.musicVolume);
  }
  
  /**
   * Set SFX volume
   * @param volume - Volume level (0-1)
   */
  public setSFXVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume));
    this.soundSystem.setCategoryVolume(SoundCategory.SFX, this.config.sfxVolume);
  }
  
  /**
   * Set ambience volume
   * @param volume - Volume level (0-1)
   */
  public setAmbienceVolume(volume: number): void {
    this.config.ambienceVolume = Math.max(0, Math.min(1, volume));
    this.soundSystem.setCategoryVolume(SoundCategory.AMBIENCE, this.config.ambienceVolume);
  }
  
  /**
   * Set voice volume
   * @param volume - Volume level (0-1)
   */
  public setVoiceVolume(volume: number): void {
    this.config.voiceVolume = Math.max(0, Math.min(1, volume));
    this.soundSystem.setCategoryVolume(SoundCategory.VOICE, this.config.voiceVolume);
  }
  
  /**
   * Set mute state
   * @param muted - Whether audio should be muted
   */
  public setMuted(muted: boolean): void {
    this.soundSystem.setMuted(muted);
  }
  
  /**
   * Enable or disable footstep sounds
   * @param enabled - Whether footstep sounds are enabled
   */
  public setFootstepsEnabled(enabled: boolean): void {
    this.config.enableFootsteps = enabled;
    
    if (this.playerAudio) {
      this.playerAudio.setFootstepVolume(enabled ? this.config.sfxVolume : 0);
    }
  }
  
  /**
   * Enable or disable ambient sounds
   * @param enabled - Whether ambient sounds are enabled
   */
  public setAmbienceEnabled(enabled: boolean): void {
    this.config.enableAmbience = enabled;
    
    // Adjust ambience volume based on enabled state
    this.soundSystem.setCategoryVolume(
      SoundCategory.AMBIENCE, 
      enabled ? this.config.ambienceVolume : 0
    );
  }
  
  /**
   * Enable or disable enemy voice sounds
   * @param enabled - Whether enemy voice sounds are enabled
   */
  public setEnemyVoiceEnabled(enabled: boolean): void {
    this.config.enableEnemyVoice = enabled;
    
    // Adjust voice volume based on enabled state
    this.soundSystem.setCategoryVolume(
      SoundCategory.VOICE, 
      enabled ? this.config.voiceVolume : 0
    );
  }
  
  /**
   * Get the current audio configuration
   * @returns Current audio configuration
   */
  public getConfig(): AudioManagerConfig {
    return { ...this.config };
  }
  
  /**
   * Dispose the audio manager and all subsystems
   */
  public dispose(): void {
    // Dispose player audio
    if (this.playerAudio) {
      this.playerAudio.dispose();
      this.playerAudio = null;
    }
    
    // Dispose ambient audio
    if (this.ambientAudio) {
      this.ambientAudio.dispose();
      this.ambientAudio = null;
    }
    
    // Dispose enemy audio
    if (this.enemyAudio) {
      this.enemyAudio.dispose();
      this.enemyAudio = null;
    }
    
    // Dispose sound system
    this.soundSystem.dispose();
  }
}
