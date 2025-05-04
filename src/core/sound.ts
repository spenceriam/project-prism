import { Scene, Vector3, Sound, Observable } from '@babylonjs/core';
import { Howl, Howler } from 'howler';

// Extend Howl interface to include our custom properties
declare module 'howler' {
  interface Howl {
    // Add custom metadata property for our sound system
    metadata?: {
      category?: SoundCategory;
      [key: string]: any;
    };
  }
}

/**
 * Sound configuration options
 */
export interface SoundConfig {
  volume: number;
  masterMuted: boolean;
  musicVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  voiceVolume: number;
}

/**
 * Sound categories for volume control
 */
export enum SoundCategory {
  MUSIC = 'music',
  SFX = 'sfx',
  AMBIENCE = 'ambience',
  VOICE = 'voice'
}

/**
 * Sound options for loading and playing sounds
 */
export interface SoundOptions {
  loop?: boolean;
  autoplay?: boolean;
  volume?: number;
  spatial?: boolean;
  maxDistance?: number;
  refDistance?: number;
  rolloffFactor?: number;
  category: SoundCategory;
}

/**
 * Sound system for Project Prism Protocol
 * Handles audio playback, spatial audio, and volume control
 */
export class SoundSystem {
  private scene: Scene;
  private config: SoundConfig;
  private sounds: Map<string, Howl> = new Map();
  private babylonSounds: Map<string, Sound> = new Map();
  private currentMusic: string | null = null;
  private nextMusic: string | null = null;
  private fadeTimeout: ReturnType<typeof setTimeout> | null = null;
  
  // Observables for sound events
  public onSoundPlayed: Observable<string> = new Observable<string>();
  public onSoundStopped: Observable<string> = new Observable<string>();
  public onMusicChanged: Observable<string> = new Observable<string>();
  
  /**
   * Creates a new SoundSystem
   * @param scene - The Babylon.js scene
   * @param config - Sound configuration options
   */
  constructor(scene: Scene, config?: Partial<SoundConfig>) {
    this.scene = scene;
    
    // Default configuration
    this.config = {
      volume: 1.0,
      masterMuted: false,
      musicVolume: 0.7,
      sfxVolume: 1.0,
      ambienceVolume: 0.8,
      voiceVolume: 1.0,
      ...config
    };
    
    // Apply initial configuration
    this.applyConfig();
  }
  
  /**
   * Applies the current configuration to Howler
   */
  private applyConfig(): void {
    // Set master volume
    Howler.volume(this.config.masterMuted ? 0 : this.config.volume);
    
    // Update all sound volumes based on their category
    this.sounds.forEach((sound, id) => {
      const category = sound.metadata?.category;
      if (category) {
        const categoryVolume = this.getCategoryVolume(category);
        sound.volume(categoryVolume);
      }
    });
    
    // Update Babylon sounds
    this.babylonSounds.forEach((sound, id) => {
      const category = sound.metadata?.category as SoundCategory;
      if (category) {
        const categoryVolume = this.getCategoryVolume(category);
        sound.setVolume(categoryVolume);
      }
    });
  }
  
  /**
   * Gets the volume for a specific category
   * @param category - The sound category
   * @returns The volume level (0-1)
   */
  private getCategoryVolume(category: SoundCategory): number {
    if (this.config.masterMuted) return 0;
    
    switch (category) {
      case SoundCategory.MUSIC:
        return this.config.musicVolume * this.config.volume;
      case SoundCategory.SFX:
        return this.config.sfxVolume * this.config.volume;
      case SoundCategory.AMBIENCE:
        return this.config.ambienceVolume * this.config.volume;
      case SoundCategory.VOICE:
        return this.config.voiceVolume * this.config.volume;
      default:
        return this.config.volume;
    }
  }
  
  /**
   * Loads a sound using Howler
   * @param id - Unique identifier for the sound
   * @param url - URL to the sound file
   * @param options - Sound options
   * @returns Promise that resolves when the sound is loaded
   */
  public loadSound(id: string, url: string, options: SoundOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if sound already exists
      if (this.sounds.has(id)) {
        resolve();
        return;
      }
      
      // Create Howl instance
      const sound = new Howl({
        src: [url],
        loop: options.loop || false,
        autoplay: options.autoplay || false,
        volume: options.volume !== undefined ? options.volume : 1.0,
        onload: () => {
          resolve();
        },
        onloaderror: (_, error) => {
          reject(error);
        }
      });
      
      // Store category for volume control
      (sound as any)._category = options.category;
      
      // Apply category volume
      sound.volume(this.getCategoryVolume(options.category));
      
      // Store the sound
      this.sounds.set(id, sound);
    });
  }
  
  /**
   * Loads a spatial sound using Babylon.js Sound
   * @param id - Unique identifier for the sound
   * @param url - URL to the sound file
   * @param position - Initial 3D position of the sound
   * @param options - Sound options
   * @returns Promise that resolves when the sound is loaded
   */
  public loadSpatialSound(
    id: string, 
    url: string, 
    position: Vector3,
    options: SoundOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if sound already exists
      if (this.babylonSounds.has(id)) {
        resolve();
        return;
      }
      
      // Create Babylon Sound instance
      const sound = new Sound(
        id,
        url,
        this.scene,
        () => {
          resolve();
        },
        {
          loop: options.loop || false,
          autoplay: options.autoplay || false,
          spatialSound: true,
          distanceModel: 'exponential',
          maxDistance: options.maxDistance || 100,
          refDistance: options.refDistance || 1,
          rolloffFactor: options.rolloffFactor || 1
        }
      );
      
      // Set position
      sound.setPosition(position);
      
      // Set volume based on category
      sound.setVolume(this.getCategoryVolume(options.category));
      
      // Store category in metadata
      sound.metadata = { category: options.category };
      
      // Store the sound
      this.babylonSounds.set(id, sound);
    });
  }
  
  /**
   * Plays a sound
   * @param id - ID of the sound to play
   * @returns ID of the sound instance or null if sound not found
   */
  public playSound(id: string): number | null {
    // Check if it's a Howler sound
    const sound = this.sounds.get(id);
    if (sound) {
      const soundId = sound.play();
      this.onSoundPlayed.notifyObservers(id);
      return soundId;
    }
    
    // Check if it's a Babylon sound
    const babylonSound = this.babylonSounds.get(id);
    if (babylonSound) {
      babylonSound.play();
      this.onSoundPlayed.notifyObservers(id);
      return 0; // Babylon Sound doesn't have instance IDs
    }
    
    console.warn(`Sound not found: ${id}`);
    return null;
  }
  
  /**
   * Stops a sound
   * @param id - ID of the sound to stop
   */
  public stopSound(id: string): void {
    // Check if it's a Howler sound
    const sound = this.sounds.get(id);
    if (sound) {
      sound.stop();
      this.onSoundStopped.notifyObservers(id);
      return;
    }
    
    // Check if it's a Babylon sound
    const babylonSound = this.babylonSounds.get(id);
    if (babylonSound) {
      babylonSound.stop();
      this.onSoundStopped.notifyObservers(id);
      return;
    }
    
    console.warn(`Sound not found: ${id}`);
  }
  
  /**
   * Pauses a sound
   * @param id - ID of the sound to pause
   */
  public pauseSound(id: string): void {
    // Check if it's a Howler sound
    const sound = this.sounds.get(id);
    if (sound) {
      sound.pause();
      return;
    }
    
    // Check if it's a Babylon sound
    const babylonSound = this.babylonSounds.get(id);
    if (babylonSound) {
      babylonSound.pause();
      return;
    }
    
    console.warn(`Sound not found: ${id}`);
  }
  
  /**
   * Resumes a paused sound
   * @param id - ID of the sound to resume
   */
  public resumeSound(id: string): void {
    // Check if it's a Howler sound
    const sound = this.sounds.get(id);
    if (sound) {
      sound.play();
      return;
    }
    
    // Check if it's a Babylon sound
    const babylonSound = this.babylonSounds.get(id);
    if (babylonSound) {
      babylonSound.play();
      return;
    }
    
    console.warn(`Sound not found: ${id}`);
  }
  
  /**
   * Sets the position of a spatial sound
   * @param id - ID of the sound
   * @param position - New position
   */
  public setSoundPosition(id: string, position: Vector3): void {
    // Only Babylon sounds are spatial
    const sound = this.babylonSounds.get(id);
    if (sound) {
      sound.setPosition(position);
    } else {
      console.warn(`Spatial sound not found: ${id}`);
    }
  }
  
  /**
   * Plays background music with optional crossfade
   * @param id - ID of the music to play
   * @param fadeTime - Fade time in seconds (default: 2)
   */
  public playMusic(id: string, fadeTime: number = 2): void {
    // If the requested music is already playing, do nothing
    if (this.currentMusic === id) return;
    
    // If we have current music playing, fade it out
    if (this.currentMusic) {
      const currentSound = this.sounds.get(this.currentMusic);
      if (currentSound) {
        // Fade out current music
        currentSound.fade(
          this.getCategoryVolume(SoundCategory.MUSIC),
          0,
          fadeTime * 1000
        );
        
        // Stop the current music after fade out
        setTimeout(() => {
          if (currentSound) {
            currentSound.stop();
          }
        }, fadeTime * 1000);
      }
    }
    
    // Set the next music
    this.nextMusic = id;
    
    // Clear any existing fade timeout
    if (this.fadeTimeout !== null) {
      clearTimeout(this.fadeTimeout);
    }
    
    // Start the new music after a small delay
    this.fadeTimeout = setTimeout(() => {
      const nextSound = this.sounds.get(this.nextMusic!);
      if (nextSound) {
        // Set initial volume to 0
        nextSound.volume(0);
        
        // Play the music
        nextSound.play();
        
        // Fade in
        nextSound.fade(
          0,
          this.getCategoryVolume(SoundCategory.MUSIC),
          fadeTime * 1000
        );
        
        // Update current music
        this.currentMusic = this.nextMusic;
        this.nextMusic = null;
        
        // Notify observers
        this.onMusicChanged.notifyObservers(this.currentMusic || '');
      }
      
      this.fadeTimeout = null;
    }, 500);
  }
  
  /**
   * Stops the currently playing music
   * @param fadeTime - Fade time in seconds (default: 2)
   */
  public stopMusic(fadeTime: number = 2): void {
    if (!this.currentMusic) return;
    
    const currentSound = this.sounds.get(this.currentMusic);
    if (currentSound) {
      // Fade out current music
      currentSound.fade(
        this.getCategoryVolume(SoundCategory.MUSIC),
        0,
        fadeTime * 1000
      );
      
      // Stop the current music after fade out
      setTimeout(() => {
        if (currentSound) {
          currentSound.stop();
        }
      }, fadeTime * 1000);
    }
    
    this.currentMusic = null;
    this.nextMusic = null;
    
    // Clear any existing fade timeout
    if (this.fadeTimeout !== null) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }
  }
  
  /**
   * Sets the master volume
   * @param volume - Volume level (0-1)
   */
  public setMasterVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    this.applyConfig();
  }
  
  /**
   * Sets the volume for a specific category
   * @param category - Sound category
   * @param volume - Volume level (0-1)
   */
  public setCategoryVolume(category: SoundCategory, volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    switch (category) {
      case SoundCategory.MUSIC:
        this.config.musicVolume = clampedVolume;
        break;
      case SoundCategory.SFX:
        this.config.sfxVolume = clampedVolume;
        break;
      case SoundCategory.AMBIENCE:
        this.config.ambienceVolume = clampedVolume;
        break;
      case SoundCategory.VOICE:
        this.config.voiceVolume = clampedVolume;
        break;
    }
    
    this.applyConfig();
  }
  
  /**
   * Sets the mute state
   * @param muted - Whether audio should be muted
   */
  public setMuted(muted: boolean): void {
    this.config.masterMuted = muted;
    this.applyConfig();
  }
  
  /**
   * Gets the current sound configuration
   * @returns Current sound configuration
   */
  public getConfig(): SoundConfig {
    return { ...this.config };
  }
  
  /**
   * Checks if a sound is currently playing
   * @param id - ID of the sound
   * @returns True if the sound is playing
   */
  public isPlaying(id: string): boolean {
    // Check if it's a Howler sound
    const sound = this.sounds.get(id);
    if (sound) {
      return sound.playing();
    }
    
    // Check if it's a Babylon sound
    const babylonSound = this.babylonSounds.get(id);
    if (babylonSound) {
      return babylonSound.isPlaying;
    }
    
    return false;
  }
  
  /**
   * Disposes the sound system and resources
   */
  public dispose(): void {
    // Stop all sounds
    this.sounds.forEach((sound, id) => {
      sound.stop();
    });
    
    this.babylonSounds.forEach((sound, id) => {
      sound.dispose();
    });
    
    // Clear collections
    this.sounds.clear();
    this.babylonSounds.clear();
    
    // Clear any existing fade timeout
    if (this.fadeTimeout !== null) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }
    
    // Clear observables
    this.onSoundPlayed.clear();
    this.onSoundStopped.clear();
    this.onMusicChanged.clear();
  }
}
