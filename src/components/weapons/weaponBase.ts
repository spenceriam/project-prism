import { 
  Scene, 
  Vector3, 
  Quaternion, 
  Mesh, 
  AbstractMesh, 
  AnimationGroup, 
  TransformNode, 
  Ray, 
  RayHelper, 
  Color3,
  Color4,
  ParticleSystem,
  Texture,
  Observable
} from '@babylonjs/core';
import { AssetLoader, ModelLoadResult } from '../../utils/loader';
import { PlayerController } from '../player/playerController';
import { SoundSystem, SoundCategory } from '../../core/sound';

/**
 * Weapon configuration options
 */
export interface WeaponConfig {
  name: string;
  modelPath: string;
  damage: number;
  fireRate: number; // Rounds per minute
  reloadTime: number; // Seconds
  ammoCapacity: number;
  range: number;
  accuracy: number; // 0-1, higher is more accurate
  recoil: number; // 0-1, higher is more recoil
  adsSpeed: number; // Aim down sight speed in seconds
  weight: number; // Affects movement speed
  soundEffects: {
    fire: string;
    reload: string;
    empty: string;
  };
}

/**
 * Weapon state tracking
 */
export interface WeaponState {
  isReloading: boolean;
  isFiring: boolean;
  isAiming: boolean;
  currentAmmo: number;
  totalAmmo: number;
  lastFireTime: number;
}

/**
 * Base weapon class for Project Prism Protocol
 * Provides common functionality for all weapon types
 */
export abstract class WeaponBase {
  protected scene: Scene;
  protected config: WeaponConfig;
  protected state: WeaponState;
  protected assetLoader: AssetLoader;
  protected soundSystem: SoundSystem;
  protected player: PlayerController;
  
  // Meshes and nodes
  protected weaponRoot: TransformNode | null = null;
  protected weaponModel: ModelLoadResult | null = null;
  protected muzzleFlash: ParticleSystem | null = null;
  protected muzzlePosition: Vector3 = Vector3.Zero();
  
  // Animation groups
  protected fireAnimation: AnimationGroup | null = null;
  protected reloadAnimation: AnimationGroup | null = null;
  protected equipAnimation: AnimationGroup | null = null;
  
  // Weapon positioning
  protected hipPosition: Vector3 = new Vector3(0.3, -0.3, 0.5);
  protected aimPosition: Vector3 = new Vector3(0, -0.1, 0.2);
  protected currentPosition: Vector3;
  protected targetPosition: Vector3;
  protected positionLerpSpeed: number = 10;
  
  // Debug
  protected debugRay: RayHelper | null = null;
  
  // Events
  public onFire: Observable<void> = new Observable<void>();
  public onReload: Observable<void> = new Observable<void>();
  public onAmmoChanged: Observable<number> = new Observable<number>();
  
  /**
   * Creates a new weapon instance
   * @param scene - The Babylon.js scene
   * @param config - Weapon configuration
   * @param assetLoader - Asset loader instance
   * @param soundSystem - Sound system instance
   * @param player - Player controller instance
   */
  constructor(
    scene: Scene, 
    config: WeaponConfig,
    assetLoader: AssetLoader,
    soundSystem: SoundSystem,
    player: PlayerController
  ) {
    this.scene = scene;
    this.config = config;
    this.assetLoader = assetLoader;
    this.soundSystem = soundSystem;
    this.player = player;
    
    // Initialize state
    this.state = {
      isReloading: false,
      isFiring: false,
      isAiming: false,
      currentAmmo: config.ammoCapacity,
      totalAmmo: config.ammoCapacity * 3, // Start with 3 extra magazines
      lastFireTime: 0
    };
    
    // Set initial positions
    this.currentPosition = this.hipPosition.clone();
    this.targetPosition = this.hipPosition.clone();
    
    // Create weapon root
    this.weaponRoot = new TransformNode(`weapon_${config.name}_root`, this.scene);
    
    // Set up debug ray if in development mode
    if (process.env.NODE_ENV !== 'production') {
      const ray = new Ray(Vector3.Zero(), Vector3.Forward(), this.config.range);
      this.debugRay = new RayHelper(ray);
    }
  }
  
  /**
   * Loads the weapon model and initializes it
   * @returns Promise that resolves when the weapon is loaded
   */
  public async load(): Promise<void> {
    try {
      // Load weapon model
      this.weaponModel = await this.assetLoader.loadModel(this.config.modelPath);
      
      if (!this.weaponModel) {
        throw new Error(`Failed to load weapon model: ${this.config.modelPath}`);
      }
      
      // Parent to weapon root
      if (this.weaponModel.rootNode) {
        this.weaponModel.rootNode.parent = this.weaponRoot;
        this.weaponModel.rootNode.position = Vector3.Zero();
      } else {
        // If no root node, parent all meshes directly
        this.weaponModel.meshes.forEach(mesh => {
          if (mesh.parent === null) {
            mesh.parent = this.weaponRoot;
          }
        });
      }
      
      // Set up animations if available
      if (this.weaponModel.animationGroups) {
        this.setupAnimations(this.weaponModel.animationGroups);
      }
      
      // Find muzzle position (look for a node named "muzzle" or similar)
      const muzzleNode = this.findNodeByName(this.weaponModel.meshes, "muzzle");
      if (muzzleNode) {
        this.muzzlePosition = muzzleNode.getAbsolutePosition().clone();
      } else {
        // Default muzzle position at the end of the weapon
        this.muzzlePosition = new Vector3(0, 0, 1);
      }
      
      // Create muzzle flash particle system
      this.createMuzzleFlash();
      
      // Position weapon initially
      if (this.weaponRoot) {
        this.weaponRoot.position = this.currentPosition.clone();
      }
      
      console.log(`Weapon ${this.config.name} loaded successfully`);
    } catch (error) {
      console.error(`Error loading weapon ${this.config.name}:`, error);
      throw error;
    }
  }
  
  /**
   * Sets up weapon animations
   * @param animationGroups - Available animation groups
   */
  protected setupAnimations(animationGroups: AnimationGroup[]): void {
    // Find animations by name
    this.fireAnimation = animationGroups.find(ag => 
      ag.name.toLowerCase().includes('fire') || 
      ag.name.toLowerCase().includes('shoot')
    ) || null;
    
    this.reloadAnimation = animationGroups.find(ag => 
      ag.name.toLowerCase().includes('reload')
    ) || null;
    
    this.equipAnimation = animationGroups.find(ag => 
      ag.name.toLowerCase().includes('equip') || 
      ag.name.toLowerCase().includes('draw')
    ) || null;
    
    // Stop all animations initially
    animationGroups.forEach(ag => {
      ag.stop();
      ag.reset();
    });
  }
  
  /**
   * Creates the muzzle flash particle system
   */
  protected createMuzzleFlash(): void {
    // Create particle system
    this.muzzleFlash = new ParticleSystem(`muzzleFlash_${this.config.name}`, 20, this.scene);
    
    // Texture
    this.muzzleFlash.particleTexture = new Texture('assets/textures/muzzleFlash.png', this.scene);
    
    // Colors - use Color4 with alpha value for particle system
    this.muzzleFlash.color1 = new Color4(1, 0.8, 0.4, 1.0);
    this.muzzleFlash.color2 = new Color4(1, 0.5, 0.2, 1.0);
    this.muzzleFlash.colorDead = new Color4(0.7, 0.3, 0.1, 0.0);
    
    // Size and lifetime
    this.muzzleFlash.minSize = 0.1;
    this.muzzleFlash.maxSize = 0.3;
    this.muzzleFlash.minLifeTime = 0.01;
    this.muzzleFlash.maxLifeTime = 0.05;
    
    // Emission
    this.muzzleFlash.emitRate = 100;
    this.muzzleFlash.minEmitPower = 1;
    this.muzzleFlash.maxEmitPower = 3;
    this.muzzleFlash.updateSpeed = 0.01;
    
    // Position
    this.muzzleFlash.emitter = this.muzzlePosition;
    this.muzzleFlash.direction1 = new Vector3(-0.1, -0.1, 1);
    this.muzzleFlash.direction2 = new Vector3(0.1, 0.1, 1);
    
    // Stop initially
    this.muzzleFlash.stop();
  }
  
  /**
   * Updates the weapon position and state
   * @param deltaTime - Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    if (!this.weaponRoot) return;
    
    // Update weapon position (smooth lerp between current and target)
    this.currentPosition = Vector3.Lerp(
      this.currentPosition,
      this.targetPosition,
      this.positionLerpSpeed * deltaTime
    );
    
    // Update weapon root position
    this.weaponRoot.position = this.currentPosition;
    
    // Update weapon root rotation to match camera
    const camera = this.player.getCamera();
    this.weaponRoot.rotationQuaternion = camera.absoluteRotation.clone();
    
    // Update muzzle position
    if (this.muzzleFlash) {
      const worldMatrix = this.weaponRoot.getWorldMatrix();
      const muzzleWorldPosition = Vector3.TransformCoordinates(this.muzzlePosition, worldMatrix);
      this.muzzleFlash.emitter = muzzleWorldPosition;
    }
    
    // Update debug ray if enabled
    if (this.debugRay) {
      const forward = camera.getDirection(Vector3.Forward());
      const origin = camera.position.clone();
      
      if (this.debugRay && this.debugRay.ray) {
        this.debugRay.ray.origin = origin;
        this.debugRay.ray.direction = forward;
        this.debugRay.ray.length = this.config.range;
      }
    }
  }
  
  /**
   * Attempts to fire the weapon
   * @returns True if the weapon fired
   */
  public fire(): boolean {
    // Check if we can fire
    if (this.state.isReloading || this.state.currentAmmo <= 0) {
      // Play empty sound if no ammo
      if (this.state.currentAmmo <= 0) {
        this.soundSystem.playSound(this.config.soundEffects.empty);
      }
      return false;
    }
    
    // Check fire rate
    const currentTime = performance.now();
    const timeSinceLastFire = currentTime - this.state.lastFireTime;
    const fireInterval = (60 / this.config.fireRate) * 1000; // Convert RPM to milliseconds
    
    if (timeSinceLastFire < fireInterval) {
      return false;
    }
    
    // Update state
    this.state.isFiring = true;
    this.state.lastFireTime = currentTime;
    this.state.currentAmmo--;
    
    // Notify ammo changed
    this.onAmmoChanged.notifyObservers(this.state.currentAmmo);
    
    // Play fire sound
    this.soundSystem.playSound(this.config.soundEffects.fire);
    
    // Play fire animation
    if (this.fireAnimation) {
      this.fireAnimation.stop();
      this.fireAnimation.start(false, 1.0, this.fireAnimation.from, this.fireAnimation.to, false);
    }
    
    // Show muzzle flash
    if (this.muzzleFlash) {
      this.muzzleFlash.start();
      setTimeout(() => this.muzzleFlash?.stop(), 50);
    }
    
    // Perform the actual firing logic (implemented by subclasses)
    this.performFire();
    
    // Notify fire event
    this.onFire.notifyObservers();
    
    // Reset firing state after a short delay
    setTimeout(() => {
      this.state.isFiring = false;
    }, 100);
    
    return true;
  }
  
  /**
   * Performs the actual firing logic (implemented by subclasses)
   */
  protected abstract performFire(): void;
  
  /**
   * Reloads the weapon
   * @returns True if reload started
   */
  public reload(): boolean {
    // Check if we can reload
    if (
      this.state.isReloading || 
      this.state.currentAmmo >= this.config.ammoCapacity ||
      this.state.totalAmmo <= 0
    ) {
      return false;
    }
    
    // Update state
    this.state.isReloading = true;
    
    // Play reload sound
    this.soundSystem.playSound(this.config.soundEffects.reload);
    
    // Play reload animation
    if (this.reloadAnimation) {
      this.reloadAnimation.stop();
      this.reloadAnimation.start(false, 1.0, this.reloadAnimation.from, this.reloadAnimation.to, false);
    }
    
    // Notify reload event
    this.onReload.notifyObservers();
    
    // Complete reload after reload time
    setTimeout(() => {
      // Calculate ammo to add
      const ammoNeeded = this.config.ammoCapacity - this.state.currentAmmo;
      const ammoToAdd = Math.min(ammoNeeded, this.state.totalAmmo);
      
      // Update ammo counts
      this.state.currentAmmo += ammoToAdd;
      this.state.totalAmmo -= ammoToAdd;
      
      // Reset reloading state
      this.state.isReloading = false;
      
      // Notify ammo changed
      this.onAmmoChanged.notifyObservers(this.state.currentAmmo);
    }, this.config.reloadTime * 1000);
    
    return true;
  }
  
  /**
   * Toggles aiming down sights
   * @param isAiming - Whether the weapon should be aimed
   */
  public setAiming(isAiming: boolean): void {
    this.state.isAiming = isAiming;
    this.targetPosition = isAiming ? this.aimPosition : this.hipPosition;
  }
  
  /**
   * Gets the current weapon state
   * @returns Current weapon state
   */
  public getState(): WeaponState {
    return { ...this.state };
  }
  
  /**
   * Gets the weapon configuration
   * @returns Weapon configuration
   */
  public getConfig(): WeaponConfig {
    return { ...this.config };
  }
  
  /**
   * Adds ammo to the weapon
   * @param amount - Amount of ammo to add
   * @returns New total ammo count
   */
  public addAmmo(amount: number): number {
    this.state.totalAmmo += amount;
    return this.state.totalAmmo;
  }
  
  /**
   * Finds a node by name in the weapon model
   * @param meshes - Array of meshes to search
   * @param name - Name to search for (case insensitive, partial match)
   * @returns The found node or null
   */
  protected findNodeByName(meshes: AbstractMesh[], name: string): AbstractMesh | null {
    const lowerName = name.toLowerCase();
    
    for (const mesh of meshes) {
      if (mesh.name.toLowerCase().includes(lowerName)) {
        return mesh;
      }
    }
    
    return null;
  }
  
  /**
   * Shows the debug ray
   * @param show - Whether to show the ray
   */
  public showDebugRay(show: boolean): void {
    if (!this.debugRay) return;
    
    if (show) {
      this.debugRay.show(this.scene, new Color3(1, 0, 0));
    } else {
      this.debugRay.hide();
    }
  }
  
  /**
   * Equips the weapon (makes it visible)
   */
  public equip(): void {
    if (!this.weaponRoot) return;
    
    // Make weapon visible
    this.weaponRoot.setEnabled(true);
    
    // Play equip animation
    if (this.equipAnimation) {
      this.equipAnimation.stop();
      this.equipAnimation.start(false, 1.0, this.equipAnimation.from, this.equipAnimation.to, false);
    }
  }
  
  /**
   * Unequips the weapon (hides it)
   */
  public unequip(): void {
    if (!this.weaponRoot) return;
    
    // Hide weapon
    this.weaponRoot.setEnabled(false);
  }
  
  /**
   * Disposes the weapon and resources
   */
  public dispose(): void {
    // Dispose muzzle flash
    if (this.muzzleFlash) {
      this.muzzleFlash.dispose();
    }
    
    // Dispose debug ray
    if (this.debugRay) {
      this.debugRay.dispose();
    }
    
    // Dispose weapon root (will dispose all children)
    if (this.weaponRoot) {
      this.weaponRoot.dispose();
    }
    
    // Clear observables
    this.onFire.clear();
    this.onReload.clear();
    this.onAmmoChanged.clear();
  }
}
