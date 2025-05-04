import { Scene, KeyboardEventTypes, PointerEventTypes, KeyboardInfo, PointerInfo } from '@babylonjs/core';

/**
 * Input key state tracking
 */
export interface InputState {
  [key: string]: boolean;
}

/**
 * Mouse button state tracking
 */
export interface MouseState {
  left: boolean;
  right: boolean;
  middle: boolean;
  x: number;
  y: number;
  movementX: number;
  movementY: number;
}

/**
 * Input action mapping
 */
export interface InputAction {
  name: string;
  keys: string[];
  mouseButtons?: number[];
  onPressed?: () => void;
  onReleased?: () => void;
  onHeld?: () => void;
}

/**
 * InputManager handles keyboard and mouse input for the game
 * Provides a centralized system for input handling and action mapping
 */
export class InputManager {
  private scene: Scene;
  private keyState: InputState = {};
  private prevKeyState: InputState = {};
  private mouseState: MouseState = {
    left: false,
    right: false,
    middle: false,
    x: 0,
    y: 0,
    movementX: 0,
    movementY: 0
  };
  private prevMouseState: MouseState = {
    left: false,
    right: false,
    middle: false,
    x: 0,
    y: 0,
    movementX: 0,
    movementY: 0
  };
  private actions: Map<string, InputAction> = new Map();
  private _isPointerLocked: boolean = false;
  private canvas: HTMLCanvasElement;
  
  /**
   * Creates a new InputManager
   * @param scene - The Babylon.js scene
   */
  constructor(scene: Scene) {
    this.scene = scene;
    this.canvas = this.scene.getEngine().getRenderingCanvas() as HTMLCanvasElement;
    
    // Set up event handlers
    this.setupKeyboardHandlers();
    this.setupMouseHandlers();
    this.setupPointerLockHandlers();
    
    // Set up update loop
    this.scene.onBeforeRenderObservable.add(() => this.update());
  }
  
  /**
   * Sets up keyboard event handlers
   */
  private setupKeyboardHandlers(): void {
    this.scene.onKeyboardObservable.add((kbInfo: KeyboardInfo) => {
      const key = kbInfo.event.code;
      
      switch (kbInfo.type) {
        case KeyboardEventTypes.KEYDOWN:
          this.keyState[key] = true;
          break;
        case KeyboardEventTypes.KEYUP:
          this.keyState[key] = false;
          break;
      }
      
      // Prevent default actions for game keys
      if (this.isGameKey(key)) {
        kbInfo.event.preventDefault();
      }
    });
  }
  
  /**
   * Sets up mouse event handlers
   */
  private setupMouseHandlers(): void {
    this.scene.onPointerObservable.add((pointerInfo: PointerInfo) => {
      const event = pointerInfo.event as MouseEvent;
      
      // Update mouse position
      this.mouseState.x = event.clientX;
      this.mouseState.y = event.clientY;
      
      // Update movement if pointer is locked
      if (this.isPointerLocked()) {
        this.mouseState.movementX = event.movementX || 0;
        this.mouseState.movementY = event.movementY || 0;
      } else {
        this.mouseState.movementX = 0;
        this.mouseState.movementY = 0;
      }
      
      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
          this.handlePointerDown(event);
          break;
        case PointerEventTypes.POINTERUP:
          this.handlePointerUp(event);
          break;
      }
      
      // Prevent context menu on right click
      if (event.button === 2) {
        event.preventDefault();
      }
    });
    
    // Prevent context menu
    this.canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
  }
  
  /**
   * Sets up pointer lock event handlers
   */
  private setupPointerLockHandlers(): void {
    document.addEventListener('pointerlockchange', () => {
      this._isPointerLocked = document.pointerLockElement === this.canvas;
    });
    
    document.addEventListener('pointerlockerror', () => {
      console.error('Pointer lock error');
    });
  }
  
  /**
   * Handles pointer down events
   * @param event - Mouse event
   */
  private handlePointerDown(event: MouseEvent): void {
    switch (event.button) {
      case 0: // Left
        this.mouseState.left = true;
        break;
      case 1: // Middle
        this.mouseState.middle = true;
        break;
      case 2: // Right
        this.mouseState.right = true;
        break;
    }
    
    // Request pointer lock on left click if not already locked
    if (event.button === 0 && !this.isPointerLocked) {
      this.canvas.requestPointerLock();
    }
  }
  
  /**
   * Handles pointer up events
   * @param event - Mouse event
   */
  private handlePointerUp(event: MouseEvent): void {
    switch (event.button) {
      case 0: // Left
        this.mouseState.left = false;
        break;
      case 1: // Middle
        this.mouseState.middle = false;
        break;
      case 2: // Right
        this.mouseState.right = false;
        break;
    }
  }
  
  /**
   * Updates input state and triggers actions
   */
  private update(): void {
    // Process actions
    this.actions.forEach(action => {
      const isActive = this.isActionActive(action);
      const wasActive = this.wasActionActive(action);
      
      if (isActive && !wasActive && action.onPressed) {
        action.onPressed();
      } else if (!isActive && wasActive && action.onReleased) {
        action.onReleased();
      } else if (isActive && action.onHeld) {
        action.onHeld();
      }
    });
    
    // Store previous states
    this.prevKeyState = { ...this.keyState };
    this.prevMouseState = { ...this.mouseState };
    
    // Reset movement deltas
    this.mouseState.movementX = 0;
    this.mouseState.movementY = 0;
  }
  
  /**
   * Checks if an action is currently active
   * @param action - The action to check
   * @returns True if the action is active
   */
  private isActionActive(action: InputAction): boolean {
    // Check keys
    for (const key of action.keys) {
      if (this.keyState[key]) {
        return true;
      }
    }
    
    // Check mouse buttons
    if (action.mouseButtons) {
      for (const button of action.mouseButtons) {
        if ((button === 0 && this.mouseState.left) ||
            (button === 1 && this.mouseState.middle) ||
            (button === 2 && this.mouseState.right)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Checks if an action was active in the previous frame
   * @param action - The action to check
   * @returns True if the action was active
   */
  private wasActionActive(action: InputAction): boolean {
    // Check keys
    for (const key of action.keys) {
      if (this.prevKeyState[key]) {
        return true;
      }
    }
    
    // Check mouse buttons
    if (action.mouseButtons) {
      for (const button of action.mouseButtons) {
        if ((button === 0 && this.prevMouseState.left) ||
            (button === 1 && this.prevMouseState.middle) ||
            (button === 2 && this.prevMouseState.right)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Registers an input action
   * @param action - The action to register
   */
  public registerAction(action: InputAction): void {
    this.actions.set(action.name, action);
  }
  
  /**
   * Unregisters an input action
   * @param actionName - The name of the action to unregister
   */
  public unregisterAction(actionName: string): void {
    this.actions.delete(actionName);
  }
  
  /**
   * Checks if a key is currently pressed
   * @param key - The key code to check
   * @returns True if the key is pressed
   */
  public isKeyDown(key: string): boolean {
    return !!this.keyState[key];
  }
  
  /**
   * Checks if a key was just pressed this frame
   * @param key - The key code to check
   * @returns True if the key was just pressed
   */
  public isKeyPressed(key: string): boolean {
    return !!this.keyState[key] && !this.prevKeyState[key];
  }
  
  /**
   * Checks if a key was just released this frame
   * @param key - The key code to check
   * @returns True if the key was just released
   */
  public isKeyReleased(key: string): boolean {
    return !this.keyState[key] && !!this.prevKeyState[key];
  }
  
  /**
   * Checks if a mouse button is currently down
   * @param button - The button index (0: left, 1: middle, 2: right)
   * @returns True if the button is down
   */
  public isMouseButtonDown(button: number): boolean {
    switch (button) {
      case 0: return this.mouseState.left;
      case 1: return this.mouseState.middle;
      case 2: return this.mouseState.right;
      default: return false;
    }
  }
  
  /**
   * Checks if a mouse button was just pressed this frame
   * @param button - The button index (0: left, 1: middle, 2: right)
   * @returns True if the button was just pressed
   */
  public isMouseButtonPressed(button: number): boolean {
    switch (button) {
      case 0: return this.mouseState.left && !this.prevMouseState.left;
      case 1: return this.mouseState.middle && !this.prevMouseState.middle;
      case 2: return this.mouseState.right && !this.prevMouseState.right;
      default: return false;
    }
  }
  
  /**
   * Checks if a mouse button was just released this frame
   * @param button - The button index (0: left, 1: middle, 2: right)
   * @returns True if the button was just released
   */
  public isMouseButtonReleased(button: number): boolean {
    switch (button) {
      case 0: return !this.mouseState.left && this.prevMouseState.left;
      case 1: return !this.mouseState.middle && this.prevMouseState.middle;
      case 2: return !this.mouseState.right && this.prevMouseState.right;
      default: return false;
    }
  }
  
  /**
   * Gets the current mouse position
   * @returns Object with x and y coordinates
   */
  public getMousePosition(): { x: number, y: number } {
    return { x: this.mouseState.x, y: this.mouseState.y };
  }
  
  /**
   * Gets the mouse movement since the last frame
   * @returns Object with movementX and movementY values
   */
  public getMouseMovement(): { movementX: number, movementY: number } {
    return {
      movementX: this.mouseState.movementX,
      movementY: this.mouseState.movementY
    };
  }
  
  /**
   * Checks if pointer is currently locked
   * @returns True if pointer is locked
   */
  public isPointerLocked(): boolean {
    return this._isPointerLocked;
  }
  
  /**
   * Requests pointer lock
   */
  public requestPointerLock(): void {
    if (!this.isPointerLocked) {
      this.canvas.requestPointerLock();
    }
  }
  
  /**
   * Exits pointer lock
   */
  public exitPointerLock(): void {
    if (this.isPointerLocked()) {
      document.exitPointerLock();
    }
  }
  
  /**
   * Checks if a key is used for game controls
   * @param key - The key code to check
   * @returns True if the key is used for game controls
   */
  private isGameKey(key: string): boolean {
    const gameKeys = [
      'KeyW', 'KeyA', 'KeyS', 'KeyD',
      'Space', 'ShiftLeft', 'ControlLeft',
      'KeyR', 'KeyF', 'KeyE', 'KeyQ',
      'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5',
      'Tab', 'Escape'
    ];
    
    return gameKeys.includes(key);
  }
  
  /**
   * Disposes the input manager
   */
  public dispose(): void {
    this.scene.onBeforeRenderObservable.clear();
    this.scene.onKeyboardObservable.clear();
    this.scene.onPointerObservable.clear();
    this.actions.clear();
  }
}
