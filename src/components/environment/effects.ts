import { Scene, Vector3, Color3, Color4, ParticleSystem, Texture, Mesh, AbstractMesh, Animation, IAnimationKey, AnimationGroup } from '@babylonjs/core';

/**
 * Effect type enum for different visual effects
 */
export enum EffectType {
  IMPACT = 'impact',        // Bullet impact effect
  EXPLOSION = 'explosion',  // Explosion effect
  SPARK = 'spark',          // Electrical spark effect
  SMOKE = 'smoke',          // Smoke effect
  HIGHLIGHT = 'highlight'   // Object highlight effect
}

/**
 * Effect configuration
 */
export interface EffectConfig {
  type: EffectType;
  position?: Vector3;        // Position of the effect
  scale?: number;            // Scale of the effect (default: 1)
  duration?: number;         // Duration in milliseconds (default: 1000)
  color?: Color4;            // Color of the effect
  emitRate?: number;         // Particles to emit per second
  particleLifetime?: number; // Lifetime of particles in seconds
}

/**
 * EffectsSystem handles creation and management of visual effects
 * Optimized for performance in browser environment
 */
export class EffectsSystem {
  private scene: Scene;
  private particleSystems: Map<string, ParticleSystem> = new Map();
  private animations: Map<string, AnimationGroup> = new Map();
  private textures: Map<string, Texture> = new Map();

  /**
   * Create a new effects system
   * @param scene - The Babylon.js scene
   */
  constructor(scene: Scene) {
    this.scene = scene;
    this.preloadTextures();
  }

  /**
   * Preload common effect textures
   */
  private preloadTextures(): void {
    // Preload particle textures
    this.textures.set('impact', new Texture('assets/textures/effects/impact.png', this.scene));
    this.textures.set('explosion', new Texture('assets/textures/effects/explosion.png', this.scene));
    this.textures.set('spark', new Texture('assets/textures/effects/spark.png', this.scene));
    this.textures.set('smoke', new Texture('assets/textures/effects/smoke.png', this.scene));
    this.textures.set('glow', new Texture('assets/textures/effects/glow.png', this.scene));
  }

  /**
   * Create a particle effect
   * @param name - Unique name for the effect
   * @param config - Effect configuration
   * @param emitter - Optional mesh to emit particles from
   * @returns The created particle system
   */
  public createParticleEffect(
    name: string,
    config: EffectConfig,
    emitter?: AbstractMesh
  ): ParticleSystem {
    // Clean up existing system with the same name
    if (this.particleSystems.has(name)) {
      this.particleSystems.get(name)!.dispose();
    }

    // Create a new particle system
    const particleSystem = new ParticleSystem(name, 2000, this.scene);
    
    // Set emitter
    if (emitter) {
      particleSystem.emitter = emitter;
    } else if (config.position) {
      particleSystem.emitter = config.position;
    } else {
      particleSystem.emitter = new Vector3(0, 0, 0);
    }
    
    // Set texture based on effect type
    switch (config.type) {
      case EffectType.IMPACT:
        particleSystem.particleTexture = this.textures.get('impact')!;
        break;
      case EffectType.EXPLOSION:
        particleSystem.particleTexture = this.textures.get('explosion')!;
        break;
      case EffectType.SPARK:
        particleSystem.particleTexture = this.textures.get('spark')!;
        break;
      case EffectType.SMOKE:
        particleSystem.particleTexture = this.textures.get('smoke')!;
        break;
      case EffectType.HIGHLIGHT:
        particleSystem.particleTexture = this.textures.get('glow')!;
        break;
    }
    
    // Configure common properties
    particleSystem.minEmitBox = new Vector3(-0.1, -0.1, -0.1);
    particleSystem.maxEmitBox = new Vector3(0.1, 0.1, 0.1);
    
    // Set particle properties based on effect type
    this.configureParticlesByType(particleSystem, config);
    
    // Set effect duration
    const duration = config.duration || 1000;
    
    // For non-continuous effects, stop after duration
    if (config.type !== EffectType.HIGHLIGHT) {
      setTimeout(() => {
        particleSystem.stop();
        
        // Dispose after all particles are gone
        setTimeout(() => {
          if (this.particleSystems.has(name)) {
            this.particleSystems.get(name)!.dispose();
            this.particleSystems.delete(name);
          }
        }, particleSystem.maxLifeTime * 1000);
      }, duration);
    }
    
    // Start the particle system
    particleSystem.start();
    
    // Store the particle system
    this.particleSystems.set(name, particleSystem);
    
    return particleSystem;
  }

  /**
   * Configure particle properties based on effect type
   * @param particleSystem - The particle system to configure
   * @param config - Effect configuration
   */
  private configureParticlesByType(particleSystem: ParticleSystem, config: EffectConfig): void {
    const scale = config.scale || 1;
    
    switch (config.type) {
      case EffectType.IMPACT:
        // Impact effect (bullet hit)
        particleSystem.color1 = config.color || new Color4(1, 0.5, 0.2, 1);
        particleSystem.color2 = config.color || new Color4(0.8, 0.3, 0.1, 1);
        particleSystem.colorDead = new Color4(0, 0, 0, 0);
        
        particleSystem.minSize = 0.1 * scale;
        particleSystem.maxSize = 0.5 * scale;
        
        particleSystem.minLifeTime = 0.1;
        particleSystem.maxLifeTime = 0.3;
        
        particleSystem.emitRate = config.emitRate || 100;
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 3;
        particleSystem.updateSpeed = 0.01;
        
        particleSystem.direction1 = new Vector3(-1, 1, -1);
        particleSystem.direction2 = new Vector3(1, 1, 1);
        
        particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;
        break;
        
      case EffectType.EXPLOSION:
        // Explosion effect
        particleSystem.color1 = config.color || new Color4(1, 0.5, 0.2, 1);
        particleSystem.color2 = config.color || new Color4(0.8, 0.3, 0.1, 1);
        particleSystem.colorDead = new Color4(0.1, 0.1, 0.1, 0);
        
        particleSystem.minSize = 0.3 * scale;
        particleSystem.maxSize = 2 * scale;
        
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = 1.5;
        
        particleSystem.emitRate = config.emitRate || 500;
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 5;
        particleSystem.updateSpeed = 0.01;
        
        particleSystem.direction1 = new Vector3(-1, -1, -1);
        particleSystem.direction2 = new Vector3(1, 1, 1);
        
        particleSystem.gravity = new Vector3(0, 0.5, 0);
        
        particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;
        break;
        
      case EffectType.SPARK:
        // Electrical spark effect
        particleSystem.color1 = config.color || new Color4(0.3, 0.5, 1, 1);
        particleSystem.color2 = config.color || new Color4(0.5, 0.7, 1, 1);
        particleSystem.colorDead = new Color4(0, 0, 0.2, 0);
        
        particleSystem.minSize = 0.05 * scale;
        particleSystem.maxSize = 0.2 * scale;
        
        particleSystem.minLifeTime = 0.1;
        particleSystem.maxLifeTime = 0.3;
        
        particleSystem.emitRate = config.emitRate || 200;
        particleSystem.minEmitPower = 0.5;
        particleSystem.maxEmitPower = 2;
        particleSystem.updateSpeed = 0.01;
        
        particleSystem.direction1 = new Vector3(-1, -1, -1);
        particleSystem.direction2 = new Vector3(1, 1, 1);
        
        particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;
        break;
        
      case EffectType.SMOKE:
        // Smoke effect
        particleSystem.color1 = config.color || new Color4(0.8, 0.8, 0.8, 0.4);
        particleSystem.color2 = config.color || new Color4(0.5, 0.5, 0.5, 0.2);
        particleSystem.colorDead = new Color4(0.1, 0.1, 0.1, 0);
        
        particleSystem.minSize = 0.3 * scale;
        particleSystem.maxSize = 1 * scale;
        
        particleSystem.minLifeTime = 1;
        particleSystem.maxLifeTime = 3;
        
        particleSystem.emitRate = config.emitRate || 50;
        particleSystem.minEmitPower = 0.2;
        particleSystem.maxEmitPower = 0.8;
        particleSystem.updateSpeed = 0.005;
        
        particleSystem.direction1 = new Vector3(-0.2, 0.8, -0.2);
        particleSystem.direction2 = new Vector3(0.2, 1, 0.2);
        
        particleSystem.gravity = new Vector3(0, -0.01, 0);
        
        particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;
        break;
        
      case EffectType.HIGHLIGHT:
        // Object highlight effect
        particleSystem.color1 = config.color || new Color4(1, 1, 0.5, 0.3);
        particleSystem.color2 = config.color || new Color4(1, 1, 0.5, 0.1);
        particleSystem.colorDead = new Color4(1, 1, 0.5, 0);
        
        particleSystem.minSize = 0.1 * scale;
        particleSystem.maxSize = 0.3 * scale;
        
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = 1;
        
        particleSystem.emitRate = config.emitRate || 20;
        particleSystem.minEmitPower = 0.1;
        particleSystem.maxEmitPower = 0.3;
        particleSystem.updateSpeed = 0.01;
        
        particleSystem.direction1 = new Vector3(-0.1, -0.1, -0.1);
        particleSystem.direction2 = new Vector3(0.1, 0.1, 0.1);
        
        particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;
        break;
    }
  }

  /**
   * Create a highlight animation for an object
   * @param mesh - The mesh to animate
   * @param duration - Duration in milliseconds
   * @param color - Color to highlight with
   * @returns The animation group
   */
  public createHighlightAnimation(
    mesh: AbstractMesh,
    duration: number = 500,
    color: Color3 = new Color3(1, 1, 0.5)
  ): AnimationGroup {
    const animationName = `highlight_${mesh.name}`;
    
    // Clean up existing animation with the same name
    if (this.animations.has(animationName)) {
      this.animations.get(animationName)!.stop();
      this.animations.get(animationName)!.dispose();
    }
    
    // Create animation group
    const animationGroup = new AnimationGroup(animationName);
    
    // Create emissive animation
    const emissiveAnimation = new Animation(
      `${animationName}_emissive`,
      'material.emissiveColor',
      30,
      Animation.ANIMATIONTYPE_COLOR3,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );
    
    // Store original emissive color
    const originalEmissive = (mesh.material as any)?.emissiveColor || new Color3(0, 0, 0);
    
    // Create keyframes
    const keyFrames: IAnimationKey[] = [
      { frame: 0, value: originalEmissive },
      { frame: 15, value: color },
      { frame: 30, value: originalEmissive }
    ];
    
    emissiveAnimation.setKeys(keyFrames);
    
    // Add animation to mesh
    animationGroup.addTargetedAnimation(emissiveAnimation, mesh);
    
    // Start animation
    animationGroup.play(true);
    
    // For temporary animations, stop after duration
    if (duration > 0) {
      setTimeout(() => {
        animationGroup.stop();
        animationGroup.dispose();
        this.animations.delete(animationName);
      }, duration);
    }
    
    // Store animation
    this.animations.set(animationName, animationGroup);
    
    return animationGroup;
  }

  /**
   * Create an impact effect at a position
   * @param position - Position of the impact
   * @param color - Color of the impact (default: orange)
   * @returns The name of the created effect
   */
  public createImpactEffect(
    position: Vector3,
    color?: Color4
  ): string {
    const name = `impact_${Date.now()}`;
    
    this.createParticleEffect(
      name,
      {
        type: EffectType.IMPACT,
        position,
        color,
        duration: 300
      }
    );
    
    return name;
  }

  /**
   * Create an explosion effect at a position
   * @param position - Position of the explosion
   * @param scale - Scale of the explosion (default: 1)
   * @param color - Color of the explosion (default: orange)
   * @returns The name of the created effect
   */
  public createExplosionEffect(
    position: Vector3,
    scale: number = 1,
    color?: Color4
  ): string {
    const name = `explosion_${Date.now()}`;
    
    this.createParticleEffect(
      name,
      {
        type: EffectType.EXPLOSION,
        position,
        scale,
        color,
        duration: 1500
      }
    );
    
    return name;
  }

  /**
   * Highlight an interactive object
   * @param mesh - The mesh to highlight
   * @param duration - Duration in milliseconds (0 for continuous)
   * @returns The animation group
   */
  public highlightInteractiveObject(
    mesh: AbstractMesh,
    duration: number = 0
  ): AnimationGroup {
    return this.createHighlightAnimation(
      mesh,
      duration,
      new Color3(1, 1, 0.5)
    );
  }

  /**
   * Stop a particle effect
   * @param name - Name of the effect to stop
   */
  public stopEffect(name: string): void {
    if (this.particleSystems.has(name)) {
      this.particleSystems.get(name)!.stop();
    }
    
    if (this.animations.has(name)) {
      this.animations.get(name)!.stop();
    }
  }

  /**
   * Dispose of all effects
   */
  public disposeAll(): void {
    // Dispose particle systems
    this.particleSystems.forEach(system => system.dispose());
    this.particleSystems.clear();
    
    // Dispose animations
    this.animations.forEach(animation => animation.dispose());
    this.animations.clear();
    
    // Dispose textures
    this.textures.forEach(texture => texture.dispose());
    this.textures.clear();
  }
}
