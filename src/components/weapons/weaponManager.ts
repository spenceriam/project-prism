import { Scene } from '@babylonjs/core';
import { WeaponBase } from './weaponBase';
import { HitscanWeapon } from './hitscanWeapon';
import { ProjectileWeapon } from './projectileWeapon';
import { AssetLoader } from '../../utils/loader';
import { PlayerController } from '../player/playerController';
import { SoundSystem } from '../../core/sound';
import { InputManager } from '../../core/input';

/**
 * WeaponManager handles weapon inventory, switching, and management
 */
export class WeaponManager {
  private scene: Scene;
  private weapons: Map<string, WeaponBase> = new Map();
  private weaponSlots: (WeaponBase | null)[] = [null, null]; // Primary and secondary slots
  private currentWeaponIndex: number = 0;
  private assetLoader: AssetLoader;
  private soundSystem: SoundSystem;
  private player: PlayerController;
  private inputManager: InputManager;
  private isWeaponSwitching: boolean = false;
  private switchCooldown: number = 0.5; // Seconds
  
  /**
   * Creates a new WeaponManager
   * @param scene - The Babylon.js scene
   * @param assetLoader - Asset loader instance
   * @param soundSystem - Sound system instance
   * @param player - Player controller instance
   * @param inputManager - Input manager instance
   */
  constructor(
    scene: Scene,
    assetLoader: AssetLoader,
    soundSystem: SoundSystem,
    player: PlayerController,
    inputManager: InputManager
  ) {
    this.scene = scene;
    this.assetLoader = assetLoader;
    this.soundSystem = soundSystem;
    this.player = player;
    this.inputManager = inputManager;
    
    // Set up input handlers
    this.setupInputHandlers();
    
    // Set up update loop
    this.scene.onBeforeRenderObservable.add(() => {
      const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
      this.update(deltaTime);
    });
  }
  
  /**
   * Sets up input handlers for weapon control
   */
  private setupInputHandlers(): void {
    // Register weapon switching actions
    this.inputManager.registerAction({
      name: 'weaponSlot1',
      keys: ['Digit1'],
      onPressed: () => this.switchToWeaponSlot(0)
    });
    
    this.inputManager.registerAction({
      name: 'weaponSlot2',
      keys: ['Digit2'],
      onPressed: () => this.switchToWeaponSlot(1)
    });
    
    this.inputManager.registerAction({
      name: 'nextWeapon',
      keys: ['KeyE'],
      onPressed: () => this.nextWeapon()
    });
    
    this.inputManager.registerAction({
      name: 'previousWeapon',
      keys: ['KeyQ'],
      onPressed: () => this.previousWeapon()
    });
    
    this.inputManager.registerAction({
      name: 'fire',
      keys: [],
      mouseButtons: [0], // Left mouse button
      onHeld: () => this.fireCurrentWeapon()
    });
    
    this.inputManager.registerAction({
      name: 'aim',
      keys: [],
      mouseButtons: [2], // Right mouse button
      onPressed: () => this.startAiming(),
      onReleased: () => this.stopAiming()
    });
    
    this.inputManager.registerAction({
      name: 'reload',
      keys: ['KeyR'],
      onPressed: () => this.reloadCurrentWeapon()
    });
  }
  
  /**
   * Updates all weapons
   * @param deltaTime - Time since last frame in seconds
   */
  private update(deltaTime: number): void {
    // Update current weapon
    const currentWeapon = this.getCurrentWeapon();
    if (currentWeapon) {
      currentWeapon.update(deltaTime);
    }
  }
  
  /**
   * Registers a weapon with the manager
   * @param id - Unique identifier for the weapon
   * @param weapon - The weapon instance
   */
  public registerWeapon(id: string, weapon: WeaponBase): void {
    this.weapons.set(id, weapon);
  }
  
  /**
   * Creates and registers a hitscan weapon
   * @param id - Unique identifier for the weapon
   * @param config - Weapon configuration
   * @returns The created weapon
   */
  public createHitscanWeapon(id: string, config: any): HitscanWeapon {
    const weapon = new HitscanWeapon(
      this.scene,
      config,
      this.assetLoader,
      this.soundSystem,
      this.player
    );
    
    this.registerWeapon(id, weapon);
    return weapon;
  }
  
  /**
   * Creates and registers a projectile weapon
   * @param id - Unique identifier for the weapon
   * @param config - Weapon configuration
   * @returns The created weapon
   */
  public createProjectileWeapon(id: string, config: any): ProjectileWeapon {
    const weapon = new ProjectileWeapon(
      this.scene,
      config,
      this.assetLoader,
      this.soundSystem,
      this.player
    );
    
    this.registerWeapon(id, weapon);
    return weapon;
  }
  
  /**
   * Equips a weapon to a specific slot
   * @param weaponId - ID of the weapon to equip
   * @param slot - Slot to equip the weapon to (0: primary, 1: secondary)
   * @returns True if the weapon was equipped
   */
  public equipWeapon(weaponId: string, slot: number): boolean {
    if (slot < 0 || slot >= this.weaponSlots.length) {
      console.warn(`Invalid weapon slot: ${slot}`);
      return false;
    }
    
    const weapon = this.weapons.get(weaponId);
    if (!weapon) {
      console.warn(`Weapon not found: ${weaponId}`);
      return false;
    }
    
    // Unequip current weapon in slot
    const currentWeapon = this.weaponSlots[slot];
    if (currentWeapon) {
      currentWeapon.unequip();
    }
    
    // Equip new weapon
    this.weaponSlots[slot] = weapon;
    
    // If this is the current slot, equip the weapon visually
    if (slot === this.currentWeaponIndex) {
      weapon.equip();
    } else {
      weapon.unequip();
    }
    
    return true;
  }
  
  /**
   * Switches to a specific weapon slot
   * @param slot - Slot to switch to
   * @returns True if the switch was successful
   */
  public switchToWeaponSlot(slot: number): boolean {
    if (slot < 0 || slot >= this.weaponSlots.length) {
      console.warn(`Invalid weapon slot: ${slot}`);
      return false;
    }
    
    if (this.isWeaponSwitching) {
      return false;
    }
    
    // Check if the slot has a weapon
    if (!this.weaponSlots[slot]) {
      console.warn(`No weapon in slot ${slot}`);
      return false;
    }
    
    // If already on this slot, do nothing
    if (slot === this.currentWeaponIndex) {
      return true;
    }
    
    // Unequip current weapon
    const currentWeapon = this.getCurrentWeapon();
    if (currentWeapon) {
      currentWeapon.unequip();
    }
    
    // Set new current weapon
    this.currentWeaponIndex = slot;
    
    // Equip new weapon
    const newWeapon = this.getCurrentWeapon();
    if (newWeapon) {
      newWeapon.equip();
    }
    
    // Set switching cooldown
    this.isWeaponSwitching = true;
    setTimeout(() => {
      this.isWeaponSwitching = false;
    }, this.switchCooldown * 1000);
    
    return true;
  }
  
  /**
   * Switches to the next weapon
   * @returns True if the switch was successful
   */
  public nextWeapon(): boolean {
    // Find next valid weapon slot
    let nextSlot = this.currentWeaponIndex;
    let attempts = 0;
    
    while (attempts < this.weaponSlots.length) {
      nextSlot = (nextSlot + 1) % this.weaponSlots.length;
      if (this.weaponSlots[nextSlot]) {
        return this.switchToWeaponSlot(nextSlot);
      }
      attempts++;
    }
    
    return false;
  }
  
  /**
   * Switches to the previous weapon
   * @returns True if the switch was successful
   */
  public previousWeapon(): boolean {
    // Find previous valid weapon slot
    let prevSlot = this.currentWeaponIndex;
    let attempts = 0;
    
    while (attempts < this.weaponSlots.length) {
      prevSlot = (prevSlot - 1 + this.weaponSlots.length) % this.weaponSlots.length;
      if (this.weaponSlots[prevSlot]) {
        return this.switchToWeaponSlot(prevSlot);
      }
      attempts++;
    }
    
    return false;
  }
  
  /**
   * Gets the current weapon
   * @returns Current weapon or null if no weapon equipped
   */
  public getCurrentWeapon(): WeaponBase | null {
    return this.weaponSlots[this.currentWeaponIndex];
  }
  
  /**
   * Fires the current weapon
   * @returns True if the weapon fired
   */
  public fireCurrentWeapon(): boolean {
    const currentWeapon = this.getCurrentWeapon();
    if (!currentWeapon) return false;
    
    return currentWeapon.fire();
  }
  
  /**
   * Reloads the current weapon
   * @returns True if the reload started
   */
  public reloadCurrentWeapon(): boolean {
    const currentWeapon = this.getCurrentWeapon();
    if (!currentWeapon) return false;
    
    return currentWeapon.reload();
  }
  
  /**
   * Starts aiming the current weapon
   */
  public startAiming(): void {
    const currentWeapon = this.getCurrentWeapon();
    if (!currentWeapon) return;
    
    currentWeapon.setAiming(true);
  }
  
  /**
   * Stops aiming the current weapon
   */
  public stopAiming(): void {
    const currentWeapon = this.getCurrentWeapon();
    if (!currentWeapon) return;
    
    currentWeapon.setAiming(false);
  }
  
  /**
   * Adds ammo to a specific weapon
   * @param weaponId - ID of the weapon
   * @param amount - Amount of ammo to add
   * @returns New total ammo count or -1 if weapon not found
   */
  public addAmmo(weaponId: string, amount: number): number {
    const weapon = this.weapons.get(weaponId);
    if (!weapon) return -1;
    
    return weapon.addAmmo(amount);
  }
  
  /**
   * Disposes all weapons and resources
   */
  public dispose(): void {
    // Dispose all weapons
    this.weapons.forEach(weapon => {
      weapon.dispose();
    });
    
    // Clear collections
    this.weapons.clear();
    this.weaponSlots.fill(null);
    
    // Remove from update loop
    this.scene.onBeforeRenderObservable.clear();
    
    // Unregister input actions
    this.inputManager.unregisterAction('weaponSlot1');
    this.inputManager.unregisterAction('weaponSlot2');
    this.inputManager.unregisterAction('nextWeapon');
    this.inputManager.unregisterAction('previousWeapon');
    this.inputManager.unregisterAction('fire');
    this.inputManager.unregisterAction('aim');
    this.inputManager.unregisterAction('reload');
  }
}
