import { Scene, AbstractMesh, Mesh, Vector3, ActionManager, ExecuteCodeAction, Observable } from '@babylonjs/core';
import { EffectsSystem, EffectType } from './effects';

/**
 * Interactive element types
 */
export enum InteractiveType {
  TARGET = 'target',           // Shooting target
  BUTTON = 'button',           // Pushable button
  SWITCH = 'switch',           // Toggle switch
  DOOR = 'door',               // Openable door
  PICKUP = 'pickup',           // Collectable item
  TERMINAL = 'terminal',       // Computer terminal
  TRIGGER_AREA = 'triggerArea' // Invisible trigger area
}

/**
 * Interactive element state
 */
export enum InteractiveState {
  IDLE = 'idle',           // Default state
  ACTIVE = 'active',       // Activated state
  DISABLED = 'disabled',   // Cannot be interacted with
  DESTROYED = 'destroyed', // Destroyed/broken
  LOCKED = 'locked'        // Locked (requires key/code)
}

/**
 * Interactive element configuration
 */
export interface InteractiveConfig {
  type: InteractiveType;
  initialState?: InteractiveState;
  interactionDistance?: number;  // Distance at which player can interact
  cooldownTime?: number;         // Cooldown between interactions (ms)
  requiresLookAt?: boolean;      // Whether player must look at object
  requiresKeyCode?: string;      // Key/code required to interact
  destroyable?: boolean;         // Whether it can be destroyed
  respawnTime?: number;          // Time to respawn if destroyed (ms)
  triggerOnce?: boolean;         // Whether it can only be triggered once
}

/**
 * Interaction event data
 */
export interface InteractionEvent {
  mesh: AbstractMesh;            // The interactive mesh
  interactiveId: string;         // ID of the interactive element
  type: InteractiveType;         // Type of interactive element
  state: InteractiveState;       // Current state
  previousState: InteractiveState; // Previous state
  position: Vector3;             // Position of interaction
  timestamp: number;             // Time of interaction
}

/**
 * InteractiveSystem manages interactive elements in the environment
 * Handles player interactions with the environment
 */
export class InteractiveSystem {
  private scene: Scene;
  private effectsSystem: EffectsSystem;
  private interactives: Map<string, {
    mesh: AbstractMesh;
    config: InteractiveConfig;
    state: InteractiveState;
    lastInteractionTime: number;
    originalPosition?: Vector3;
    originalRotation?: Vector3;
  }> = new Map();

  // Observables for interaction events
  public onInteractionObservable: Observable<InteractionEvent> = new Observable<InteractionEvent>();
  public onStateChangeObservable: Observable<InteractionEvent> = new Observable<InteractionEvent>();

  /**
   * Create a new interactive system
   * @param scene - The Babylon.js scene
   * @param effectsSystem - The effects system for visual feedback
   */
  constructor(scene: Scene, effectsSystem: EffectsSystem) {
    this.scene = scene;
    this.effectsSystem = effectsSystem;
  }

  /**
   * Register a mesh as an interactive element
   * @param mesh - The mesh to make interactive
   * @param config - Interactive configuration
   * @returns The interactive ID
   */
  public registerInteractive(mesh: AbstractMesh, config: InteractiveConfig): string {
    const interactiveId = `${config.type}_${mesh.name}`;
    
    // Store original transform for resetting
    const originalPosition = mesh.position.clone();
    const originalRotation = mesh.rotation.clone();
    
    // Store interactive data
    this.interactives.set(interactiveId, {
      mesh,
      config,
      state: config.initialState || InteractiveState.IDLE,
      lastInteractionTime: 0,
      originalPosition,
      originalRotation
    });
    
    // Set up action manager for interaction
    if (!mesh.actionManager) {
      mesh.actionManager = new ActionManager(this.scene);
    }
    
    // Add metadata for interaction
    if (!mesh.metadata) {
      mesh.metadata = {};
    }
    mesh.metadata.isInteractive = true;
    mesh.metadata.interactiveId = interactiveId;
    mesh.metadata.interactiveType = config.type;
    
    // Set up mesh-specific behaviors
    this.setupInteractiveBehavior(interactiveId);
    
    return interactiveId;
  }

  /**
   * Set up behavior for specific interactive types
   * @param interactiveId - ID of the interactive element
   */
  private setupInteractiveBehavior(interactiveId: string): void {
    const interactive = this.interactives.get(interactiveId);
    if (!interactive) return;
    
    const { mesh, config } = interactive;
    
    // Ensure the mesh has an actionManager
    if (!mesh.actionManager) {
      mesh.actionManager = new ActionManager(this.scene);
    }
    
    switch (config.type) {
      case InteractiveType.TARGET:
        // For targets, set up hit detection
        mesh.actionManager.registerAction(
          new ExecuteCodeAction(
            ActionManager.OnPickTrigger,
            () => {
              // Handle target hit
              this.handleTargetHit(interactiveId);
            }
          )
        );
        break;
        
      case InteractiveType.BUTTON:
        // For buttons, set up press animation
        mesh.actionManager.registerAction(
          new ExecuteCodeAction(
            ActionManager.OnPickTrigger,
            () => {
              // Handle button press
              this.handleButtonPress(interactiveId);
            }
          )
        );
        break;
        
      case InteractiveType.SWITCH:
        // For switches, set up toggle
        mesh.actionManager.registerAction(
          new ExecuteCodeAction(
            ActionManager.OnPickTrigger,
            () => {
              // Handle switch toggle
              this.handleSwitchToggle(interactiveId);
            }
          )
        );
        break;
        
      case InteractiveType.DOOR:
        // For doors, set up open/close
        mesh.actionManager.registerAction(
          new ExecuteCodeAction(
            ActionManager.OnPickTrigger,
            () => {
              // Handle door interaction
              this.handleDoorInteraction(interactiveId);
            }
          )
        );
        break;
        
      case InteractiveType.PICKUP:
        // For pickups, set up collection
        mesh.actionManager.registerAction(
          new ExecuteCodeAction(
            ActionManager.OnPickTrigger,
            () => {
              // Handle pickup collection
              this.handlePickupCollection(interactiveId);
            }
          )
        );
        break;
        
      case InteractiveType.TERMINAL:
        // For terminals, set up activation
        mesh.actionManager.registerAction(
          new ExecuteCodeAction(
            ActionManager.OnPickTrigger,
            () => {
              // Handle terminal activation
              this.handleTerminalActivation(interactiveId);
            }
          )
        );
        break;
    }
  }

  /**
   * Handle target hit interaction
   * @param interactiveId - ID of the target
   */
  private handleTargetHit(interactiveId: string): void {
    const interactive = this.interactives.get(interactiveId);
    if (!interactive) return;
    
    const { mesh, config, state, lastInteractionTime } = interactive;
    
    // Check cooldown
    const now = Date.now();
    if (now - lastInteractionTime < (config.cooldownTime || 500)) {
      return;
    }
    
    // Check if target is in a valid state
    if (state === InteractiveState.DISABLED || state === InteractiveState.DESTROYED) {
      return;
    }
    
    // Update last interaction time
    interactive.lastInteractionTime = now;
    
    // Change state to active
    const previousState = interactive.state;
    interactive.state = InteractiveState.ACTIVE;
    
    // Create hit effect
    this.effectsSystem.createImpactEffect(mesh.position);
    
    // Create highlight animation
    this.effectsSystem.highlightInteractiveObject(mesh, 500);
    
    // Trigger interaction event
    const event: InteractionEvent = {
      mesh,
      interactiveId,
      type: config.type,
      state: interactive.state,
      previousState,
      position: mesh.position.clone(),
      timestamp: now
    };
    
    this.onInteractionObservable.notifyObservers(event);
    
    // If destroyable, check if it should be destroyed
    if (config.destroyable) {
      // In a real implementation, we'd check damage, health, etc.
      // For now, we'll just set a timer to reset the target
      setTimeout(() => {
        if (config.triggerOnce) {
          // If trigger once, disable the target
          this.setInteractiveState(interactiveId, InteractiveState.DISABLED);
        } else {
          // Otherwise reset to idle
          this.setInteractiveState(interactiveId, InteractiveState.IDLE);
        }
      }, 1000);
    }
  }

  /**
   * Handle button press interaction
   * @param interactiveId - ID of the button
   */
  private handleButtonPress(interactiveId: string): void {
    const interactive = this.interactives.get(interactiveId);
    if (!interactive) return;
    
    const { mesh, config, state, lastInteractionTime } = interactive;
    
    // Check cooldown
    const now = Date.now();
    if (now - lastInteractionTime < (config.cooldownTime || 500)) {
      return;
    }
    
    // Check if button is in a valid state
    if (state === InteractiveState.DISABLED || state === InteractiveState.DESTROYED) {
      return;
    }
    
    // Update last interaction time
    interactive.lastInteractionTime = now;
    
    // Change state to active
    const previousState = interactive.state;
    interactive.state = InteractiveState.ACTIVE;
    
    // Create press animation (move button down slightly)
    const originalPosition = interactive.originalPosition!;
    const pressDirection = new Vector3(0, -0.05, 0);
    mesh.position = originalPosition.add(pressDirection);
    
    // Create highlight animation
    this.effectsSystem.highlightInteractiveObject(mesh, 500);
    
    // Create particle effect
    this.effectsSystem.createParticleEffect(
      `button_press_${interactiveId}`,
      {
        type: EffectType.SPARK,
        position: mesh.position.clone(),
        scale: 0.5,
        duration: 300
      }
    );
    
    // Trigger interaction event
    const event: InteractionEvent = {
      mesh,
      interactiveId,
      type: config.type,
      state: interactive.state,
      previousState,
      position: mesh.position.clone(),
      timestamp: now
    };
    
    this.onInteractionObservable.notifyObservers(event);
    
    // Reset button after delay
    setTimeout(() => {
      // Return to original position
      mesh.position = originalPosition.clone();
      
      if (config.triggerOnce) {
        // If trigger once, disable the button
        this.setInteractiveState(interactiveId, InteractiveState.DISABLED);
      } else {
        // Otherwise reset to idle
        this.setInteractiveState(interactiveId, InteractiveState.IDLE);
      }
    }, 300);
  }

  /**
   * Handle switch toggle interaction
   * @param interactiveId - ID of the switch
   */
  private handleSwitchToggle(interactiveId: string): void {
    const interactive = this.interactives.get(interactiveId);
    if (!interactive) return;
    
    const { mesh, config, state, lastInteractionTime } = interactive;
    
    // Check cooldown
    const now = Date.now();
    if (now - lastInteractionTime < (config.cooldownTime || 500)) {
      return;
    }
    
    // Check if switch is in a valid state
    if (state === InteractiveState.DISABLED || state === InteractiveState.DESTROYED) {
      return;
    }
    
    // Update last interaction time
    interactive.lastInteractionTime = now;
    
    // Toggle state between idle and active
    const previousState = interactive.state;
    interactive.state = state === InteractiveState.IDLE ? 
      InteractiveState.ACTIVE : InteractiveState.IDLE;
    
    // Create toggle animation (rotate switch)
    const originalRotation = interactive.originalRotation!;
    const toggleRotation = new Vector3(0, 0, Math.PI / 4);
    
    if (interactive.state === InteractiveState.ACTIVE) {
      mesh.rotation = originalRotation.add(toggleRotation);
    } else {
      mesh.rotation = originalRotation.clone();
    }
    
    // Create highlight animation
    this.effectsSystem.highlightInteractiveObject(mesh, 500);
    
    // Create particle effect
    this.effectsSystem.createParticleEffect(
      `switch_toggle_${interactiveId}`,
      {
        type: EffectType.SPARK,
        position: mesh.position.clone(),
        scale: 0.3,
        duration: 200
      }
    );
    
    // Trigger interaction event
    const event: InteractionEvent = {
      mesh,
      interactiveId,
      type: config.type,
      state: interactive.state,
      previousState,
      position: mesh.position.clone(),
      timestamp: now
    };
    
    this.onInteractionObservable.notifyObservers(event);
    this.onStateChangeObservable.notifyObservers(event);
  }

  /**
   * Handle door interaction
   * @param interactiveId - ID of the door
   */
  private handleDoorInteraction(interactiveId: string): void {
    const interactive = this.interactives.get(interactiveId);
    if (!interactive) return;
    
    const { mesh, config, state, lastInteractionTime } = interactive;
    
    // Check cooldown
    const now = Date.now();
    if (now - lastInteractionTime < (config.cooldownTime || 1000)) {
      return;
    }
    
    // Check if door is in a valid state
    if (state === InteractiveState.DISABLED || state === InteractiveState.DESTROYED || 
        state === InteractiveState.LOCKED) {
      return;
    }
    
    // Update last interaction time
    interactive.lastInteractionTime = now;
    
    // Toggle state between idle (closed) and active (open)
    const previousState = interactive.state;
    interactive.state = state === InteractiveState.IDLE ? 
      InteractiveState.ACTIVE : InteractiveState.IDLE;
    
    // Create door animation (rotate door)
    const originalRotation = interactive.originalRotation!;
    const openRotation = new Vector3(0, Math.PI / 2, 0);
    
    if (interactive.state === InteractiveState.ACTIVE) {
      // Open door
      mesh.rotation = originalRotation.add(openRotation);
    } else {
      // Close door
      mesh.rotation = originalRotation.clone();
    }
    
    // Create highlight animation
    this.effectsSystem.highlightInteractiveObject(mesh, 500);
    
    // Trigger interaction event
    const event: InteractionEvent = {
      mesh,
      interactiveId,
      type: config.type,
      state: interactive.state,
      previousState,
      position: mesh.position.clone(),
      timestamp: now
    };
    
    this.onInteractionObservable.notifyObservers(event);
    this.onStateChangeObservable.notifyObservers(event);
  }

  /**
   * Handle pickup collection
   * @param interactiveId - ID of the pickup
   */
  private handlePickupCollection(interactiveId: string): void {
    const interactive = this.interactives.get(interactiveId);
    if (!interactive) return;
    
    const { mesh, config, state } = interactive;
    
    // Check if pickup is in a valid state
    if (state === InteractiveState.DISABLED || state === InteractiveState.DESTROYED) {
      return;
    }
    
    // Update last interaction time
    interactive.lastInteractionTime = Date.now();
    
    // Change state to collected (disabled)
    const previousState = interactive.state;
    interactive.state = InteractiveState.DISABLED;
    
    // Create collection effect
    this.effectsSystem.createParticleEffect(
      `pickup_collect_${interactiveId}`,
      {
        type: EffectType.HIGHLIGHT,
        position: mesh.position.clone(),
        scale: 1,
        duration: 500
      }
    );
    
    // Hide the mesh
    mesh.isVisible = false;
    
    // Trigger interaction event
    const event: InteractionEvent = {
      mesh,
      interactiveId,
      type: config.type,
      state: interactive.state,
      previousState,
      position: mesh.position.clone(),
      timestamp: Date.now()
    };
    
    this.onInteractionObservable.notifyObservers(event);
    
    // If respawn is enabled, respawn after delay
    if (config.respawnTime && config.respawnTime > 0) {
      setTimeout(() => {
        // Reset pickup
        mesh.isVisible = true;
        this.setInteractiveState(interactiveId, InteractiveState.IDLE);
      }, config.respawnTime);
    }
  }

  /**
   * Handle terminal activation
   * @param interactiveId - ID of the terminal
   */
  private handleTerminalActivation(interactiveId: string): void {
    const interactive = this.interactives.get(interactiveId);
    if (!interactive) return;
    
    const { mesh, config, state, lastInteractionTime } = interactive;
    
    // Check cooldown
    const now = Date.now();
    if (now - lastInteractionTime < (config.cooldownTime || 1000)) {
      return;
    }
    
    // Check if terminal is in a valid state
    if (state === InteractiveState.DISABLED || state === InteractiveState.DESTROYED) {
      return;
    }
    
    // Update last interaction time
    interactive.lastInteractionTime = now;
    
    // Toggle state between idle and active
    const previousState = interactive.state;
    interactive.state = state === InteractiveState.IDLE ? 
      InteractiveState.ACTIVE : InteractiveState.IDLE;
    
    // Create highlight animation
    this.effectsSystem.highlightInteractiveObject(mesh, 1000);
    
    // Create activation effect
    this.effectsSystem.createParticleEffect(
      `terminal_activate_${interactiveId}`,
      {
        type: EffectType.SPARK,
        position: mesh.position.clone(),
        scale: 0.5,
        duration: 500
      }
    );
    
    // Trigger interaction event
    const event: InteractionEvent = {
      mesh,
      interactiveId,
      type: config.type,
      state: interactive.state,
      previousState,
      position: mesh.position.clone(),
      timestamp: now
    };
    
    this.onInteractionObservable.notifyObservers(event);
    this.onStateChangeObservable.notifyObservers(event);
  }

  /**
   * Set the state of an interactive element
   * @param interactiveId - ID of the interactive element
   * @param state - New state
   */
  public setInteractiveState(interactiveId: string, state: InteractiveState): void {
    const interactive = this.interactives.get(interactiveId);
    if (!interactive) return;
    
    const previousState = interactive.state;
    interactive.state = state;
    
    // Notify state change
    const event: InteractionEvent = {
      mesh: interactive.mesh,
      interactiveId,
      type: interactive.config.type,
      state,
      previousState,
      position: interactive.mesh.position.clone(),
      timestamp: Date.now()
    };
    
    this.onStateChangeObservable.notifyObservers(event);
  }

  /**
   * Get the state of an interactive element
   * @param interactiveId - ID of the interactive element
   * @returns The current state or undefined if not found
   */
  public getInteractiveState(interactiveId: string): InteractiveState | undefined {
    return this.interactives.get(interactiveId)?.state;
  }

  /**
   * Get all interactive elements of a specific type
   * @param type - Type of interactive elements to get
   * @returns Array of interactive IDs
   */
  public getInteractivesByType(type: InteractiveType): string[] {
    const result: string[] = [];
    
    this.interactives.forEach((interactive, id) => {
      if (interactive.config.type === type) {
        result.push(id);
      }
    });
    
    return result;
  }

  /**
   * Dispose of the interactive system
   */
  public dispose(): void {
    this.onInteractionObservable.clear();
    this.onStateChangeObservable.clear();
    this.interactives.clear();
  }
}
