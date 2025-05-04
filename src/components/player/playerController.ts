// @ts-ignore - Module resolution will be fixed when dependencies are installed
import { 
  Scene, 
  Vector3, 
  FreeCamera, 
  UniversalCamera, 
  Mesh, 
  PhysicsImpostor, 
  Ray, 
  RayHelper, 
  Color3, 
  PointerEventTypes, 
  KeyboardEventTypes, 
  KeyboardInfo,
  PointerInfo,
  AbstractMesh
} from '@babylonjs/core';
import { MathUtils } from '../../utils/math';

/**
 * Player state information
 */
export interface PlayerState {
  health: number;
  maxHealth: number;
  isMoving: boolean;
  isCrouching: boolean;
  isSprinting: boolean;
  isJumping: boolean;
  isAiming: boolean;
}

/**
 * Player movement configuration
 */
export interface PlayerMovementConfig {
  walkSpeed: number;
  sprintSpeed: number;
  crouchSpeed: number;
  jumpForce: number;
  lookSensitivity: number;
  maxLookAngle: number;
}

/**
 * PlayerController handles player movement, camera controls, and player state
 */
export class PlayerController {
  // Core references
  private scene: Scene;
  private camera: UniversalCamera;
  
  // Player state
  private state: PlayerState;
  
  // Movement configuration
  private config: PlayerMovementConfig;
  
  // Movement tracking
  private moveDirection: Vector3 = Vector3.Zero();
  private moveForward: boolean = false;
  private moveBackward: boolean = false;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private jump: boolean = false;
  private sprint: boolean = false;
  private crouch: boolean = false;
  
  // Physics
  private playerCollider: Mesh;
  private cameraHeight: number = 1.8; // Height in meters
  private gravity: number = -9.81;
  private grounded: boolean = false;
  private velocity: Vector3 = Vector3.Zero();
  
  // Look control
  private currentPitch: number = 0;
  private isPointerLocked: boolean = false;
  
  // Collision detection
  private groundCheckRay: Ray;
  private rayHelper: RayHelper | null = null;
  
  /**
   * Creates a new PlayerController
   * @param scene - The Babylon.js scene
   * @param spawnPosition - Initial spawn position
   * @param config - Movement configuration (optional)
   */
  constructor(scene: Scene, spawnPosition: Vector3, config?: Partial<PlayerMovementConfig>) {
    this.scene = scene;
    
    // Initialize player state
    this.state = {
      health: 100,
      maxHealth: 100,
      isMoving: false,
      isCrouching: false,
      isSprinting: false,
      isJumping: false,
      isAiming: false
    };
    
    // Set up movement configuration with defaults
    this.config = {
      walkSpeed: 5.0,
      sprintSpeed: 8.0,
      crouchSpeed: 2.5,
      jumpForce: 8.0,
      lookSensitivity: 0.1,
      maxLookAngle: 85,
      ...config
    };
    
    // Create player camera
    this.camera = new UniversalCamera('playerCamera', spawnPosition, this.scene);
    this.camera.fov = 1.2; // ~70 degrees
    this.camera.minZ = 0.1;
    this.camera.inertia = 0.5;
    this.camera.angularSensibility = 800; // Lower is more sensitive
    
    // Set this camera as the active camera
    this.scene.activeCamera = this.camera;
    
    // Attach camera controls to canvas
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (canvas) {
      this.camera.attachControl(canvas, true);
    }
    
    // Create player collider
    this.playerCollider = Mesh.CreateCapsule('playerCollider', {
      height: 1.8,
      radius: 0.4,
      tessellation: 16,
      subdivisions: 1
    }, this.scene);
    this.playerCollider.position = spawnPosition.clone();
    this.playerCollider.visibility = 0; // Invisible
    
    // Set up physics
    this.playerCollider.physicsImpostor = new PhysicsImpostor(
      this.playerCollider,
      PhysicsImpostor.CapsuleImpostor,
      { mass: 70, friction: 0.5, restitution: 0.0 },
      this.scene
    );
    
    // Create ground check ray
    this.groundCheckRay = new Ray(Vector3.Zero(), Vector3.Down(), 1.1);
    
    // Debug ray helper (only in debug mode)
    const debugMode = false; // Set to true to enable debug visualization
    if (debugMode) {
      this.rayHelper = new RayHelper(this.groundCheckRay);
      this.rayHelper.show(this.scene, new Color3(1, 0, 0));
    }
    
    // Set up input handling
    this.setupInputHandlers();
    
    // Start the player update loop
    this.scene.onBeforeRenderObservable.add(() => this.update());
  }
  
  /**
   * Sets up keyboard and mouse input handlers
   */
  private setupInputHandlers(): void {
    // Keyboard events
    this.scene.onKeyboardObservable.add((kbInfo: KeyboardInfo) => {
      const key = kbInfo.event.code;
      
      switch (kbInfo.type) {
        case KeyboardEventTypes.KEYDOWN:
          this.handleKeyDown(key);
          break;
        case KeyboardEventTypes.KEYUP:
          this.handleKeyUp(key);
          break;
      }
    });
    
    // Mouse events
    this.scene.onPointerObservable.add((pointerInfo: PointerInfo) => {
      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
          this.handlePointerDown(pointerInfo);
          break;
        case PointerEventTypes.POINTERUP:
          this.handlePointerUp(pointerInfo);
          break;
        case PointerEventTypes.POINTERMOVE:
          this.handlePointerMove(pointerInfo);
          break;
      }
    });
    
    // Handle pointer lock changes with browser compatibility
    const pointerLockChangeEvent = [
      'pointerlockchange',
      'mozpointerlockchange',
      'webkitpointerlockchange'
    ];
    
    // Add event listeners for all possible pointer lock change events
    pointerLockChangeEvent.forEach(eventName => {
      document.addEventListener(eventName, () => {
        const canvas = this.scene.getEngine().getRenderingCanvas();
        const pointerLockElement = document.pointerLockElement || 
                                 (document as any).mozPointerLockElement || 
                                 (document as any).webkitPointerLockElement;
        
        this.isPointerLocked = pointerLockElement === canvas;
        console.log('Pointer lock state changed:', this.isPointerLocked ? 'locked' : 'unlocked');
        
        // Update camera controls based on pointer lock state
        if (this.isPointerLocked) {
          this.camera.detachControl();
          this.camera.attachControl(canvas, true);
        }
      });
    });
  }
  
  /**
   * Handles key down events
   * @param key - The key code
   */
  private handleKeyDown(key: string): void {
    switch (key) {
      case 'KeyW':
        this.moveForward = true;
        break;
      case 'KeyS':
        this.moveBackward = true;
        break;
      case 'KeyA':
        this.moveLeft = true;
        break;
      case 'KeyD':
        this.moveRight = true;
        break;
      case 'Space':
        this.jump = true;
        break;
      case 'ShiftLeft':
        this.sprint = true;
        break;
      case 'ControlLeft':
        this.crouch = true;
        this.state.isCrouching = true;
        break;
    }
    
    this.updateMoveDirection();
  }
  
  /**
   * Handles key up events
   * @param key - The key code
   */
  private handleKeyUp(key: string): void {
    switch (key) {
      case 'KeyW':
        this.moveForward = false;
        break;
      case 'KeyS':
        this.moveBackward = false;
        break;
      case 'KeyA':
        this.moveLeft = false;
        break;
      case 'KeyD':
        this.moveRight = false;
        break;
      case 'Space':
        this.jump = false;
        break;
      case 'ShiftLeft':
        this.sprint = false;
        this.state.isSprinting = false;
        break;
      case 'ControlLeft':
        this.crouch = false;
        this.state.isCrouching = false;
        break;
    }
    
    this.updateMoveDirection();
  }
  
  /**
   * Handles pointer down events
   * @param pointerInfo - Pointer information
   */
  private handlePointerDown(pointerInfo: PointerInfo): void {
    // Request pointer lock on left click
    if (pointerInfo.event.button === 0) {
      const canvas = this.scene.getEngine().getRenderingCanvas();
      if (canvas && !this.isPointerLocked) {
        console.log('Requesting pointer lock...');
        canvas.requestPointerLock = canvas.requestPointerLock || 
                                   (canvas as any).mozRequestPointerLock || 
                                   (canvas as any).webkitRequestPointerLock;
        canvas.requestPointerLock();
      }
    }
    
    // Right click for aiming
    if (pointerInfo.event.button === 2) {
      this.state.isAiming = true;
    }
  }
  
  /**
   * Handles pointer up events
   * @param pointerInfo - Pointer information
   */
  private handlePointerUp(pointerInfo: PointerInfo): void {
    // Right click for aiming
    if (pointerInfo.event.button === 2) {
      this.state.isAiming = false;
    }
  }
  
  /**
   * Handles pointer move events
   * @param pointerInfo - Pointer information
   */
  private handlePointerMove(pointerInfo: PointerInfo): void {
    // Camera rotation is handled by Babylon's Universal Camera
    // We just need to clamp the vertical look angle
    if (this.isPointerLocked) {
      // Get the current camera rotation
      const pitch = this.camera.rotation.x;
      
      // Clamp the pitch to the configured max angle
      const maxAngle = MathUtils.toRadians(this.config.maxLookAngle);
      this.camera.rotation.x = MathUtils.clamp(pitch, -maxAngle, maxAngle);
      
      // Store the current pitch for reference
      this.currentPitch = this.camera.rotation.x;
    }
  }
  
  /**
   * Updates the movement direction vector based on key states
   */
  private updateMoveDirection(): void {
    // Reset the move direction
    this.moveDirection.setAll(0);
    
    // Calculate the move direction based on key states
    if (this.moveForward) this.moveDirection.z += 1;
    if (this.moveBackward) this.moveDirection.z -= 1;
    if (this.moveLeft) this.moveDirection.x -= 1;
    if (this.moveRight) this.moveDirection.x += 1;
    
    // Normalize if moving diagonally
    if (this.moveDirection.length() > 0) {
      this.moveDirection.normalize();
      this.state.isMoving = true;
    } else {
      this.state.isMoving = false;
    }
  }
  
  /**
   * Updates the player state and position each frame
   */
  private update(): void {
    // Check if player is grounded
    this.checkGrounded();
    
    // Apply gravity if not grounded
    if (!this.grounded) {
      this.velocity.y += this.gravity * this.scene.getEngine().getDeltaTime() / 1000;
    } else if (this.velocity.y < 0) {
      // Reset vertical velocity when grounded
      this.velocity.y = 0;
    }
    
    // Handle jumping
    if (this.jump && this.grounded) {
      this.velocity.y = this.config.jumpForce;
      this.grounded = false;
      this.state.isJumping = true;
    } else if (this.grounded) {
      this.state.isJumping = false;
    }
    
    // Determine movement speed based on state
    let speed = this.config.walkSpeed;
    if (this.sprint && !this.state.isCrouching) {
      speed = this.config.sprintSpeed;
      this.state.isSprinting = true;
    } else if (this.state.isCrouching) {
      speed = this.config.crouchSpeed;
      this.state.isSprinting = false;
    } else {
      this.state.isSprinting = false;
    }
    
    // Calculate horizontal velocity
    const forward = this.camera.getDirection(Vector3.Forward());
    forward.y = 0;
    forward.normalize();
    
    const right = this.camera.getDirection(Vector3.Right());
    right.y = 0;
    right.normalize();
    
    // Calculate movement vector based on camera direction
    const movement = new Vector3(0, 0, 0);
    
    if (this.moveDirection.z !== 0) {
      movement.addInPlace(forward.scale(this.moveDirection.z));
    }
    
    if (this.moveDirection.x !== 0) {
      movement.addInPlace(right.scale(this.moveDirection.x));
    }
    
    if (movement.length() > 0) {
      movement.normalize();
      movement.scaleInPlace(speed);
    }
    
    // Set horizontal velocity
    this.velocity.x = movement.x;
    this.velocity.z = movement.z;
    
    // Apply velocity to player collider
    const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
    const displacement = this.velocity.scale(deltaTime);
    this.playerCollider.moveWithCollisions(displacement);
    
    // Update camera position to follow player collider
    const cameraHeight = this.state.isCrouching ? this.cameraHeight * 0.6 : this.cameraHeight;
    this.camera.position.x = this.playerCollider.position.x;
    this.camera.position.z = this.playerCollider.position.z;
    this.camera.position.y = this.playerCollider.position.y + cameraHeight;
    
    // Update ground check ray position
    this.groundCheckRay.origin = this.playerCollider.position.clone();
    
    // Update ray helper if in debug mode
    if (this.rayHelper) {
      this.rayHelper.show(this.scene, new Color3(this.grounded ? 0 : 1, this.grounded ? 1 : 0, 0));
    }
  }
  
  /**
   * Checks if the player is grounded
   */
  private checkGrounded(): void {
    // Update ray origin to player position
    this.groundCheckRay.origin = this.playerCollider.position.clone();
    
    // Cast ray downward to check for ground
    const hit = this.scene.pickWithRay(this.groundCheckRay, (mesh: AbstractMesh) => {
      return mesh !== this.playerCollider;
    });
    
    // Update grounded state
    this.grounded = Boolean(hit && hit.hit && hit.distance <= 1.1);
  }
  
  /**
   * Applies damage to the player
   * @param amount - Amount of damage to apply
   * @returns Current health after damage
   */
  public applyDamage(amount: number): number {
    this.state.health = Math.max(0, this.state.health - amount);
    return this.state.health;
  }
  
  /**
   * Heals the player
   * @param amount - Amount of health to restore
   * @returns Current health after healing
   */
  public heal(amount: number): number {
    this.state.health = Math.min(this.state.maxHealth, this.state.health + amount);
    return this.state.health;
  }
  
  /**
   * Gets the current player state
   * @returns Current player state
   */
  public getState(): PlayerState {
    return { ...this.state };
  }
  
  /**
   * Apply damage to the player
   * @param amount - Amount of damage to apply
   * @returns Current health after damage
   */
  public takeDamage(amount: number): number {
    // Reduce health by damage amount
    this.state.health = Math.max(0, this.state.health - amount);
    
    // TODO: Implement damage feedback effects
    
    // Check for death
    if (this.state.health <= 0) {
      this.handleDeath();
    }
    
    return this.state.health;
  }
  
  /**
   * Handle player death
   * @private
   */
  private handleDeath(): void {
    // TODO: Implement death sequence
    console.log('Player died');
  }
  
  /**
   * Gets the player camera
   * @returns Player camera
   */
  public getCamera(): UniversalCamera {
    return this.camera;
  }
  
  /**
   * Gets the player position
   * @returns Player position
   */
  public getPosition(): Vector3 {
    return this.playerCollider.position.clone();
  }
  
  /**
   * Teleports the player to a new position
   * @param position - Position to teleport to
   */
  public teleport(position: Vector3): void {
    this.playerCollider.position = position.clone();
    this.camera.position = new Vector3(
      position.x,
      position.y + this.cameraHeight,
      position.z
    );
    this.velocity.setAll(0);
  }
  
  /**
   * Disposes the player controller and resources
   */
  public dispose(): void {
    // Remove update observer
    this.scene.onBeforeRenderObservable.clear();
    
    // Dispose physics impostor
    if (this.playerCollider.physicsImpostor) {
      this.playerCollider.physicsImpostor.dispose();
    }
    
    // Dispose meshes
    this.playerCollider.dispose();
    
    // Dispose ray helper
    if (this.rayHelper) {
      this.rayHelper.dispose();
    }
  }
}
