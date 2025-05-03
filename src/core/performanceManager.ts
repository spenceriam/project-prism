import { Scene, Engine, Camera, Vector3 } from '@babylonjs/core';
import { AssetStreamer, AssetStreamingConfig } from '../utils/assetStreamer';
import { LODSystem, LODSystemConfig } from '../utils/lodSystem';
import { TextureCompression, TextureCompressionConfig, TextureCompressionFormat } from '../utils/textureCompression';
import { MemoryMonitor, MemoryMonitorConfig } from '../utils/memoryMonitor';
import { PhysicsOptimizer, PhysicsOptimizerConfig } from '../utils/physicsOptimizer';
import { AssetLoader } from '../utils/loader';
import { DebugUtility } from '../utils/debug';

/**
 * Configuration for the performance manager
 */
export interface PerformanceManagerConfig {
  /** Target FPS to maintain */
  targetFPS: number;
  /** Whether to enable automatic performance adjustments */
  autoAdjust: boolean;
  /** Whether to show performance HUD */
  showPerformanceHUD: boolean;
  /** Asset streaming configuration */
  assetStreaming: AssetStreamingConfig;
  /** LOD system configuration */
  lodSystem: LODSystemConfig;
  /** Texture compression configuration */
  textureCompression: TextureCompressionConfig;
  /** Memory monitor configuration */
  memoryMonitor: MemoryMonitorConfig;
  /** Physics optimizer configuration */
  physicsOptimizer: PhysicsOptimizerConfig;
}

/**
 * Performance quality level
 */
export enum PerformanceQualityLevel {
  ULTRA = 'ultra',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  MINIMUM = 'minimum'
}

/**
 * PerformanceManager coordinates all performance optimization systems
 * Provides centralized control over game performance
 */
export class PerformanceManager {
  private scene: Scene;
  private engine: Engine;
  private camera: Camera;
  private config: PerformanceManagerConfig;
  private assetLoader: AssetLoader;
  private debugUtility: DebugUtility;
  
  // Performance optimization systems
  private assetStreamer: AssetStreamer;
  private lodSystem: LODSystem;
  private textureCompression: TextureCompression;
  private memoryMonitor: MemoryMonitor;
  private physicsOptimizer: PhysicsOptimizer;
  
  // Performance tracking
  private fpsHistory: number[] = [];
  private lastFpsCheck: number = 0;
  private currentQualityLevel: PerformanceQualityLevel;
  private isAdjusting: boolean = false;
  private adjustmentInterval: number | null = null;
  
  /**
   * Creates a new PerformanceManager
   * @param scene - The Babylon.js scene
   * @param engine - The Babylon.js engine
   * @param camera - The main camera for distance calculations
   * @param assetLoader - The AssetLoader instance
   * @param debugUtility - The DebugUtility instance
   * @param config - Configuration for the performance manager
   */
  constructor(
    scene: Scene,
    engine: Engine,
    camera: Camera,
    assetLoader: AssetLoader,
    debugUtility: DebugUtility,
    config: PerformanceManagerConfig = {
      targetFPS: 60,
      autoAdjust: true,
      showPerformanceHUD: true,
      assetStreaming: {
        loadDistance: 100,
        unloadDistance: 150,
        updateFrequency: 1000,
        maxLoadsPerUpdate: 2,
        prioritizeByDistance: true
      },
      lodSystem: {
        autoGenerate: true,
        showDebug: false,
        updateFrequency: 1000,
        defaultLevels: [
          { distance: 0, quality: 1.0 },
          { distance: 20, quality: 0.75 },
          { distance: 50, quality: 0.5 },
          { distance: 100, quality: 0.25 }
        ]
      },
      textureCompression: {
        defaultFormat: TextureCompressionFormat.NONE,
        useFallbacks: true,
        generateMipmaps: true,
        maxTextureSize: 1024,
        compressionQuality: 0.8
      },
      memoryMonitor: {
        updateFrequency: 1000,
        historySamples: 60,
        logWarnings: true,
        thresholds: {
          heapUsageWarning: 70,
          heapUsageCritical: 90,
          drawCallsWarning: 500,
          drawCallsCritical: 1000,
          activeVerticesWarning: 1.0,
          activeVerticesCritical: 2.0
        },
        showMonitoringUI: false
      },
      physicsOptimizer: {
        sleepDistance: 50,
        simplifiedDistance: 20,
        updateFrequency: 500,
        useSimplifiedCollision: true,
        throttleDistantPhysics: true,
        maxActivePhysics: 50
      }
    }
  ) {
    this.scene = scene;
    this.engine = engine;
    this.camera = camera;
    this.assetLoader = assetLoader;
    this.debugUtility = debugUtility;
    this.config = config;
    
    // Initialize with high quality
    this.currentQualityLevel = PerformanceQualityLevel.HIGH;
    
    // Create optimization systems
    this.initializeOptimizationSystems();
    
    // Set up performance monitoring
    this.setupPerformanceMonitoring();
  }
  
  /**
   * Initializes all performance optimization systems
   */
  private initializeOptimizationSystems(): void {
    // Create asset streamer
    this.assetStreamer = new AssetStreamer(
      this.scene,
      this.assetLoader,
      this.config.assetStreaming
    );
    
    // Create LOD system
    this.lodSystem = new LODSystem(
      this.scene,
      this.camera,
      this.config.lodSystem
    );
    
    // Create texture compression
    this.textureCompression = new TextureCompression(
      this.scene,
      this.config.textureCompression
    );
    
    // Create memory monitor
    this.memoryMonitor = new MemoryMonitor(
      this.scene,
      this.config.memoryMonitor
    );
    
    // Create physics optimizer
    this.physicsOptimizer = new PhysicsOptimizer(
      this.scene,
      this.config.physicsOptimizer
    );
    
    // Set up memory warning handler
    this.memoryMonitor.onMemoryWarningObservable.add(warning => {
      if (warning.type === 'critical' && this.config.autoAdjust) {
        // Automatically lower quality on critical warnings
        this.decreaseQuality();
      }
    });
  }
  
  /**
   * Sets up performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor FPS
    this.scene.onBeforeRenderObservable.add(() => {
      const currentTime = performance.now();
      
      // Check FPS every second
      if (currentTime - this.lastFpsCheck >= 1000) {
        const currentFPS = this.engine.getFps();
        
        // Add to history
        this.fpsHistory.push(currentFPS);
        
        // Keep history at 10 samples
        if (this.fpsHistory.length > 10) {
          this.fpsHistory.shift();
        }
        
        this.lastFpsCheck = currentTime;
        
        // Auto-adjust quality if enabled
        if (this.config.autoAdjust && !this.isAdjusting) {
          this.autoAdjustQuality();
        }
      }
    });
    
    // Set up automatic quality adjustment interval
    if (this.config.autoAdjust) {
      this.adjustmentInterval = window.setInterval(
        () => this.evaluatePerformance(),
        10000 // Check every 10 seconds
      );
    }
  }
  
  /**
   * Starts all performance optimization systems
   * @param playerPosition - Initial player position
   */
  public start(playerPosition: Vector3): void {
    // Start asset streaming
    this.assetStreamer.start(playerPosition);
    
    // Start LOD system
    this.lodSystem.start();
    
    // Start memory monitor
    this.memoryMonitor.start();
    
    // Start physics optimizer
    this.physicsOptimizer.start(playerPosition);
    
    // Process scene textures with compression
    this.textureCompression.processSceneTextures();
    
    // Show performance HUD if enabled
    if (this.config.showPerformanceHUD) {
      this.debugUtility.enable();
      this.memoryMonitor.toggleUI(true);
    }
    
    console.log('Performance manager started');
  }
  
  /**
   * Stops all performance optimization systems
   */
  public stop(): void {
    // Stop asset streaming
    this.assetStreamer.stop();
    
    // Stop LOD system
    this.lodSystem.stop();
    
    // Stop memory monitor
    this.memoryMonitor.stop();
    
    // Stop physics optimizer
    this.physicsOptimizer.stop();
    
    // Stop auto-adjustment interval
    if (this.adjustmentInterval !== null) {
      clearInterval(this.adjustmentInterval);
      this.adjustmentInterval = null;
    }
    
    console.log('Performance manager stopped');
  }
  
  /**
   * Updates player position for distance-based optimizations
   * @param position - New player position
   */
  public updatePlayerPosition(position: Vector3): void {
    this.assetStreamer.updatePlayerPosition(position);
    this.physicsOptimizer.updatePlayerPosition(position);
  }
  
  /**
   * Evaluates current performance and adjusts quality if needed
   */
  private evaluatePerformance(): void {
    // Skip if not enough samples
    if (this.fpsHistory.length < 5) return;
    
    // Calculate average FPS
    const avgFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
    
    // Check memory usage
    const memoryStats = this.memoryMonitor.getCurrentStats();
    const highMemoryUsage = memoryStats.heapUsagePercent > this.config.memoryMonitor.thresholds.heapUsageWarning;
    
    // Adjust quality based on performance
    if (avgFPS < this.config.targetFPS * 0.8 || highMemoryUsage) {
      // Performance is poor, decrease quality
      this.decreaseQuality();
    } else if (avgFPS > this.config.targetFPS * 1.2 && 
               this.currentQualityLevel !== PerformanceQualityLevel.ULTRA &&
               !highMemoryUsage) {
      // Performance is good, increase quality
      this.increaseQuality();
    }
  }
  
  /**
   * Automatically adjusts quality based on current FPS
   */
  private autoAdjustQuality(): void {
    // Skip if not enough samples
    if (this.fpsHistory.length < 3) return;
    
    // Calculate average FPS
    const avgFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
    
    // If FPS is too low, decrease quality
    if (avgFPS < this.config.targetFPS * 0.7) {
      this.decreaseQuality();
    }
  }
  
  /**
   * Decreases quality level
   */
  private decreaseQuality(): void {
    // Skip if already at minimum
    if (this.currentQualityLevel === PerformanceQualityLevel.MINIMUM) return;
    
    // Set adjusting flag
    this.isAdjusting = true;
    
    // Determine new quality level
    let newLevel: PerformanceQualityLevel;
    
    switch (this.currentQualityLevel) {
      case PerformanceQualityLevel.ULTRA:
        newLevel = PerformanceQualityLevel.HIGH;
        break;
      case PerformanceQualityLevel.HIGH:
        newLevel = PerformanceQualityLevel.MEDIUM;
        break;
      case PerformanceQualityLevel.MEDIUM:
        newLevel = PerformanceQualityLevel.LOW;
        break;
      case PerformanceQualityLevel.LOW:
        newLevel = PerformanceQualityLevel.MINIMUM;
        break;
      default:
        newLevel = PerformanceQualityLevel.MINIMUM;
    }
    
    // Apply new quality level
    this.applyQualityLevel(newLevel);
    
    // Reset FPS history
    this.fpsHistory = [];
    
    // Clear adjusting flag after a delay
    setTimeout(() => {
      this.isAdjusting = false;
    }, 5000);
    
    console.log(`Decreased quality level to ${newLevel}`);
  }
  
  /**
   * Increases quality level
   */
  private increaseQuality(): void {
    // Skip if already at ultra
    if (this.currentQualityLevel === PerformanceQualityLevel.ULTRA) return;
    
    // Set adjusting flag
    this.isAdjusting = true;
    
    // Determine new quality level
    let newLevel: PerformanceQualityLevel;
    
    switch (this.currentQualityLevel) {
      case PerformanceQualityLevel.HIGH:
        newLevel = PerformanceQualityLevel.ULTRA;
        break;
      case PerformanceQualityLevel.MEDIUM:
        newLevel = PerformanceQualityLevel.HIGH;
        break;
      case PerformanceQualityLevel.LOW:
        newLevel = PerformanceQualityLevel.MEDIUM;
        break;
      case PerformanceQualityLevel.MINIMUM:
        newLevel = PerformanceQualityLevel.LOW;
        break;
      default:
        newLevel = PerformanceQualityLevel.HIGH;
    }
    
    // Apply new quality level
    this.applyQualityLevel(newLevel);
    
    // Reset FPS history
    this.fpsHistory = [];
    
    // Clear adjusting flag after a delay
    setTimeout(() => {
      this.isAdjusting = false;
    }, 5000);
    
    console.log(`Increased quality level to ${newLevel}`);
  }
  
  /**
   * Applies a quality level
   * @param level - The quality level to apply
   */
  private applyQualityLevel(level: PerformanceQualityLevel): void {
    // Update current level
    this.currentQualityLevel = level;
    
    // Apply settings based on quality level
    switch (level) {
      case PerformanceQualityLevel.ULTRA:
        this.applyUltraQuality();
        break;
      case PerformanceQualityLevel.HIGH:
        this.applyHighQuality();
        break;
      case PerformanceQualityLevel.MEDIUM:
        this.applyMediumQuality();
        break;
      case PerformanceQualityLevel.LOW:
        this.applyLowQuality();
        break;
      case PerformanceQualityLevel.MINIMUM:
        this.applyMinimumQuality();
        break;
    }
  }
  
  /**
   * Applies ultra quality settings
   */
  private applyUltraQuality(): void {
    // Engine settings
    this.engine.setHardwareScalingLevel(1.0);
    
    // Scene settings
    this.scene.postProcessesEnabled = true;
    this.scene.particlesEnabled = true;
    this.scene.fogEnabled = true;
    this.scene.shadowsEnabled = true;
    
    // Asset streaming
    this.config.assetStreaming.loadDistance = 150;
    this.config.assetStreaming.unloadDistance = 200;
    
    // LOD system
    this.config.lodSystem.defaultLevels = [
      { distance: 0, quality: 1.0 },
      { distance: 50, quality: 0.8 },
      { distance: 100, quality: 0.6 },
      { distance: 150, quality: 0.4 }
    ];
    
    // Texture compression
    this.config.textureCompression.maxTextureSize = 2048;
    
    // Physics
    this.config.physicsOptimizer.sleepDistance = 100;
    this.config.physicsOptimizer.simplifiedDistance = 50;
    
    // Apply updated configs
    this.updateConfigurations();
  }
  
  /**
   * Applies high quality settings
   */
  private applyHighQuality(): void {
    // Engine settings
    this.engine.setHardwareScalingLevel(1.0);
    
    // Scene settings
    this.scene.postProcessesEnabled = true;
    this.scene.particlesEnabled = true;
    this.scene.fogEnabled = true;
    this.scene.shadowsEnabled = true;
    
    // Asset streaming
    this.config.assetStreaming.loadDistance = 100;
    this.config.assetStreaming.unloadDistance = 150;
    
    // LOD system
    this.config.lodSystem.defaultLevels = [
      { distance: 0, quality: 1.0 },
      { distance: 30, quality: 0.75 },
      { distance: 60, quality: 0.5 },
      { distance: 100, quality: 0.3 }
    ];
    
    // Texture compression
    this.config.textureCompression.maxTextureSize = 1024;
    
    // Physics
    this.config.physicsOptimizer.sleepDistance = 70;
    this.config.physicsOptimizer.simplifiedDistance = 30;
    
    // Apply updated configs
    this.updateConfigurations();
  }
  
  /**
   * Applies medium quality settings
   */
  private applyMediumQuality(): void {
    // Engine settings
    this.engine.setHardwareScalingLevel(1.25);
    
    // Scene settings
    this.scene.postProcessesEnabled = true;
    this.scene.particlesEnabled = true;
    this.scene.fogEnabled = true;
    this.scene.shadowsEnabled = true;
    
    // Asset streaming
    this.config.assetStreaming.loadDistance = 80;
    this.config.assetStreaming.unloadDistance = 120;
    
    // LOD system
    this.config.lodSystem.defaultLevels = [
      { distance: 0, quality: 0.8 },
      { distance: 20, quality: 0.6 },
      { distance: 40, quality: 0.4 },
      { distance: 80, quality: 0.2 }
    ];
    
    // Texture compression
    this.config.textureCompression.maxTextureSize = 512;
    
    // Physics
    this.config.physicsOptimizer.sleepDistance = 50;
    this.config.physicsOptimizer.simplifiedDistance = 20;
    
    // Apply updated configs
    this.updateConfigurations();
  }
  
  /**
   * Applies low quality settings
   */
  private applyLowQuality(): void {
    // Engine settings
    this.engine.setHardwareScalingLevel(1.5);
    
    // Scene settings
    this.scene.postProcessesEnabled = false;
    this.scene.particlesEnabled = true;
    this.scene.fogEnabled = true;
    this.scene.shadowsEnabled = false;
    
    // Asset streaming
    this.config.assetStreaming.loadDistance = 60;
    this.config.assetStreaming.unloadDistance = 90;
    
    // LOD system
    this.config.lodSystem.defaultLevels = [
      { distance: 0, quality: 0.6 },
      { distance: 15, quality: 0.4 },
      { distance: 30, quality: 0.2 },
      { distance: 60, quality: 0.1 }
    ];
    
    // Texture compression
    this.config.textureCompression.maxTextureSize = 256;
    
    // Physics
    this.config.physicsOptimizer.sleepDistance = 40;
    this.config.physicsOptimizer.simplifiedDistance = 15;
    
    // Apply updated configs
    this.updateConfigurations();
  }
  
  /**
   * Applies minimum quality settings
   */
  private applyMinimumQuality(): void {
    // Engine settings
    this.engine.setHardwareScalingLevel(2.0);
    
    // Scene settings
    this.scene.postProcessesEnabled = false;
    this.scene.particlesEnabled = false;
    this.scene.fogEnabled = false;
    this.scene.shadowsEnabled = false;
    
    // Asset streaming
    this.config.assetStreaming.loadDistance = 40;
    this.config.assetStreaming.unloadDistance = 60;
    
    // LOD system
    this.config.lodSystem.defaultLevels = [
      { distance: 0, quality: 0.4 },
      { distance: 10, quality: 0.2 },
      { distance: 20, quality: 0.1 },
      { distance: 40, quality: 0.05 }
    ];
    
    // Texture compression
    this.config.textureCompression.maxTextureSize = 128;
    
    // Physics
    this.config.physicsOptimizer.sleepDistance = 30;
    this.config.physicsOptimizer.simplifiedDistance = 10;
    
    // Apply updated configs
    this.updateConfigurations();
  }
  
  /**
   * Updates configurations for all systems
   */
  private updateConfigurations(): void {
    // Regenerate LODs with new settings
    this.lodSystem.generateAllLODs(this.config.lodSystem.defaultLevels);
    
    // Process textures with new settings
    this.textureCompression.processSceneTextures();
  }
  
  /**
   * Sets quality level manually
   * @param level - The quality level to set
   */
  public setQualityLevel(level: PerformanceQualityLevel): void {
    this.applyQualityLevel(level);
    console.log(`Manually set quality level to ${level}`);
  }
  
  /**
   * Gets the current quality level
   * @returns The current quality level
   */
  public getQualityLevel(): PerformanceQualityLevel {
    return this.currentQualityLevel;
  }
  
  /**
   * Gets the asset streamer instance
   * @returns The asset streamer
   */
  public getAssetStreamer(): AssetStreamer {
    return this.assetStreamer;
  }
  
  /**
   * Gets the LOD system instance
   * @returns The LOD system
   */
  public getLODSystem(): LODSystem {
    return this.lodSystem;
  }
  
  /**
   * Gets the texture compression instance
   * @returns The texture compression
   */
  public getTextureCompression(): TextureCompression {
    return this.textureCompression;
  }
  
  /**
   * Gets the memory monitor instance
   * @returns The memory monitor
   */
  public getMemoryMonitor(): MemoryMonitor {
    return this.memoryMonitor;
  }
  
  /**
   * Gets the physics optimizer instance
   * @returns The physics optimizer
   */
  public getPhysicsOptimizer(): PhysicsOptimizer {
    return this.physicsOptimizer;
  }
  
  /**
   * Gets statistics from all performance systems
   * @returns Combined statistics
   */
  public getStats(): {
    fps: number;
    qualityLevel: PerformanceQualityLevel;
    assetStreaming: ReturnType<AssetStreamer['getStats']>;
    lodSystem: ReturnType<LODSystem['getStats']>;
    textureCompression: ReturnType<TextureCompression['getStats']>;
    memoryMonitor: ReturnType<MemoryMonitor['getCurrentStats']>;
    physicsOptimizer: ReturnType<PhysicsOptimizer['getStats']>;
  } {
    return {
      fps: this.engine.getFps(),
      qualityLevel: this.currentQualityLevel,
      assetStreaming: this.assetStreamer.getStats(),
      lodSystem: this.lodSystem.getStats(),
      textureCompression: this.textureCompression.getStats(),
      memoryMonitor: this.memoryMonitor.getCurrentStats(),
      physicsOptimizer: this.physicsOptimizer.getStats()
    };
  }
  
  /**
   * Toggles performance HUD visibility
   * @param show - Whether to show the HUD
   */
  public togglePerformanceHUD(show: boolean): void {
    this.config.showPerformanceHUD = show;
    
    if (show) {
      this.debugUtility.enable();
      this.memoryMonitor.toggleUI(true);
    } else {
      this.debugUtility.disable();
      this.memoryMonitor.toggleUI(false);
    }
  }
  
  /**
   * Gets optimization suggestions based on current performance
   * @returns Array of optimization suggestions
   */
  public getOptimizationSuggestions(): string[] {
    return this.memoryMonitor.getOptimizationSuggestions();
  }
}
