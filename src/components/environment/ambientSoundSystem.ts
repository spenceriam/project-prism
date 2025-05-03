/**
 * AmbientSoundSystem - Manages environmental ambient sounds
 * 
 * Handles ambient background sounds, environment-specific audio effects,
 * and audio zones for Project Prism Protocol.
 */

import { Scene, Vector3, Mesh, Observable } from '@babylonjs/core';
import { SoundSystem, SoundCategory } from '../../core/sound';

/**
 * Ambient sound zone configuration
 */
export interface AmbientSoundZone {
  id: string;
  name: string;
  position: Vector3;
  radius: number;
  sounds: AmbientSound[];
  transitionTime: number; // Time in seconds to fade between zones
}

/**
 * Ambient sound configuration
 */
export interface AmbientSound {
  id: string;
  path: string;
  volume: number;
  loop: boolean;
  randomization?: {
    minInterval: number; // Minimum time between plays in seconds
    maxInterval: number; // Maximum time between plays in seconds
    minVolume: number; // Minimum volume multiplier (0-1)
    maxVolume: number; // Maximum volume multiplier (0-1)
  };
}

/**
 * AmbientSoundSystem manages environmental ambient sounds
 */
export class AmbientSoundSystem {
  private scene: Scene;
  private soundSystem: SoundSystem;
  
  // Sound zones
  private soundZones: Map<string, AmbientSoundZone> = new Map();
  private activeZones: Set<string> = new Set();
  private currentMainZone: string | null = null;
  
  // Player tracking
  private playerPosition: Vector3 = Vector3.Zero();
  
  // Active sounds
  private activeLoopingSounds: Map<string, boolean> = new Map();
  private randomSoundTimers: Map<string, number> = new Map();
  
  // Zone visualization (debug only)
  private zoneVisualizers: Map<string, Mesh> = new Map();
  
  // Events
  public onZoneEntered: Observable<string> = new Observable<string>();
  public onZoneExited: Observable<string> = new Observable<string>();
  public onMainZoneChanged: Observable<string> = new Observable<string>();
  
  /**
   * Creates a new AmbientSoundSystem
   * @param scene - The Babylon.js scene
   * @param soundSystem - The sound system
   */
  constructor(scene: Scene, soundSystem: SoundSystem) {
    this.scene = scene;
    this.soundSystem = soundSystem;
    
    // Start update loop
    this.scene.onBeforeRenderObservable.add(() => this.update());
  }
  
  /**
   * Update ambient sound system
   */
  private update(): void {
    // Skip if no zones are defined
    if (this.soundZones.size === 0) return;
    
    // Check which zones the player is in
    this.checkZones();
    
    // Update random sound timers
    this.updateRandomSounds();
  }
  
  /**
   * Check which zones the player is in
   */
  private checkZones(): void {
    const previousActiveZones = new Set(this.activeZones);
    const newActiveZones = new Set<string>();
    let closestZone: { id: string, distance: number } | null = null;
    
    // Check each zone
    this.soundZones.forEach((zone, id) => {
      // Calculate distance to zone center
      const distance = Vector3.Distance(this.playerPosition, zone.position);
      
      // Check if player is in zone
      if (distance <= zone.radius) {
        newActiveZones.add(id);
        
        // Check if this is the closest zone
        if (closestZone === null || distance < closestZone.distance) {
          closestZone = { id: id as string, distance };
        }
      }
    });
    
    // Determine zones entered and exited
    newActiveZones.forEach(zoneId => {
      if (!previousActiveZones.has(zoneId)) {
        this.enterZone(zoneId);
      }
    });
    
    previousActiveZones.forEach(zoneId => {
      if (!newActiveZones.has(zoneId)) {
        this.exitZone(zoneId);
      }
    });
    
    // Update active zones
    this.activeZones = newActiveZones;
    
    // Update main zone if changed
    if (closestZone && closestZone.id !== this.currentMainZone) {
      this.changeMainZone(closestZone.id as string);
    } else if (!closestZone && this.currentMainZone) {
      // No zones active
      this.currentMainZone = null;
      this.onMainZoneChanged.notifyObservers('none');
    }
  }
  
  /**
   * Handle entering a zone
   * @param zoneId - ID of the zone entered
   */
  private enterZone(zoneId: string): void {
    const zone = this.soundZones.get(zoneId);
    if (!zone) return;
    
    // Start looping sounds for this zone
    zone.sounds.forEach(sound => {
      if (sound.loop) {
        // Start looping sound if not already playing
        if (!this.soundSystem.isPlaying(sound.id)) {
          this.soundSystem.playSound(sound.id);
          this.activeLoopingSounds.set(sound.id, true);
        }
      } else if (sound.randomization) {
        // Set up random sound timer
        this.setupRandomSoundTimer(sound);
      }
    });
    
    // Notify observers
    this.onZoneEntered.notifyObservers(zoneId);
  }
  
  /**
   * Handle exiting a zone
   * @param zoneId - ID of the zone exited
   */
  private exitZone(zoneId: string): void {
    const zone = this.soundZones.get(zoneId);
    if (!zone) return;
    
    // Stop sounds that are specific to this zone if no other active zone uses them
    zone.sounds.forEach(sound => {
      let soundUsedInOtherActiveZones = false;
      
      // Check if sound is used in other active zones
      this.activeZones.forEach(activeZoneId => {
        if (activeZoneId !== zoneId) {
          const activeZone = this.soundZones.get(activeZoneId);
          if (activeZone) {
            const soundInZone = activeZone.sounds.find(s => s.id === sound.id);
            if (soundInZone) {
              soundUsedInOtherActiveZones = true;
            }
          }
        }
      });
      
      // Stop sound if not used in other active zones
      if (!soundUsedInOtherActiveZones) {
        if (sound.loop) {
          this.soundSystem.stopSound(sound.id);
          this.activeLoopingSounds.delete(sound.id);
        } else if (sound.randomization) {
          // Clear random sound timer
          this.clearRandomSoundTimer(sound.id);
        }
      }
    });
    
    // Notify observers
    this.onZoneExited.notifyObservers(zoneId);
  }
  
  /**
   * Change the main ambient zone
   * @param zoneId - ID of the new main zone
   */
  private changeMainZone(zoneId: string): void {
    const previousZone = this.currentMainZone ? this.soundZones.get(this.currentMainZone) : null;
    const newZone = this.soundZones.get(zoneId);
    
    if (!newZone) return;
    
    // Set new main zone
    this.currentMainZone = zoneId;
    
    // Notify observers
    this.onMainZoneChanged.notifyObservers(zoneId);
  }
  
  /**
   * Set up a timer for random sound playback
   * @param sound - The ambient sound configuration
   */
  private setupRandomSoundTimer(sound: AmbientSound): void {
    if (!sound.randomization) return;
    
    // Clear existing timer
    this.clearRandomSoundTimer(sound.id);
    
    // Calculate random interval
    const interval = Math.random() * 
      (sound.randomization.maxInterval - sound.randomization.minInterval) + 
      sound.randomization.minInterval;
    
    // Set timer
    const timerId = window.setTimeout(() => {
      // Play sound with random volume
      const volume = Math.random() * 
        (sound.randomization!.maxVolume - sound.randomization!.minVolume) + 
        sound.randomization!.minVolume;
      
      // Set volume and play
      this.soundSystem.playSound(sound.id);
      
      // Set up next timer
      this.setupRandomSoundTimer(sound);
    }, interval * 1000);
    
    // Store timer ID
    this.randomSoundTimers.set(sound.id, timerId);
  }
  
  /**
   * Clear a random sound timer
   * @param soundId - ID of the sound
   */
  private clearRandomSoundTimer(soundId: string): void {
    const timerId = this.randomSoundTimers.get(soundId);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      this.randomSoundTimers.delete(soundId);
    }
  }
  
  /**
   * Update random sound timers
   */
  private updateRandomSounds(): void {
    // This is handled by the setTimeout callbacks
  }
  
  /**
   * Register a new ambient sound zone
   * @param zone - The ambient sound zone configuration
   */
  public registerZone(zone: AmbientSoundZone): void {
    // Register the zone
    this.soundZones.set(zone.id, zone);
    
    // Load sounds for this zone
    this.loadZoneSounds(zone);
    
    // Create zone visualizer if in debug mode
    this.createZoneVisualizer(zone);
  }
  
  /**
   * Load sounds for a zone
   * @param zone - The ambient sound zone
   */
  private async loadZoneSounds(zone: AmbientSoundZone): Promise<void> {
    try {
      // Load each sound
      for (const sound of zone.sounds) {
        await this.soundSystem.loadSound(
          sound.id,
          sound.path,
          {
            volume: sound.volume,
            loop: sound.loop,
            category: SoundCategory.AMBIENCE
          }
        );
      }
      
      console.log(`Loaded sounds for zone: ${zone.name}`);
    } catch (error) {
      console.error(`Failed to load sounds for zone ${zone.name}:`, error);
    }
  }
  
  /**
   * Create a visualizer for a zone (debug only)
   * @param zone - The ambient sound zone
   */
  private createZoneVisualizer(zone: AmbientSoundZone): void {
    // Only create visualizers in debug mode
    const debugMode = false;
    if (!debugMode) return;
    
    // Create sphere to represent zone
    const sphere = Mesh.CreateSphere(`zone_${zone.id}_visualizer`, 16, zone.radius * 2, this.scene);
    sphere.position = zone.position.clone();
    sphere.visibility = 0.2;
    sphere.isPickable = false;
    
    // Store visualizer
    this.zoneVisualizers.set(zone.id, sphere);
  }
  
  /**
   * Update player position for zone detection
   * @param position - Player position
   */
  public updatePlayerPosition(position: Vector3): void {
    this.playerPosition = position.clone();
  }
  
  /**
   * Dispose the ambient sound system
   */
  public dispose(): void {
    // Stop all active sounds
    this.activeLoopingSounds.forEach((active, soundId) => {
      this.soundSystem.stopSound(soundId);
    });
    
    // Clear all timers
    this.randomSoundTimers.forEach((timerId, soundId) => {
      window.clearTimeout(timerId);
    });
    
    // Clear collections
    this.activeLoopingSounds.clear();
    this.randomSoundTimers.clear();
    this.activeZones.clear();
    
    // Remove from update loop
    this.scene.onBeforeRenderObservable.removeCallback(() => this.update());
    
    // Dispose visualizers
    this.zoneVisualizers.forEach((mesh, id) => {
      mesh.dispose();
    });
    this.zoneVisualizers.clear();
    
    // Clear observables
    this.onZoneEntered.clear();
    this.onZoneExited.clear();
    this.onMainZoneChanged.clear();
  }
}
