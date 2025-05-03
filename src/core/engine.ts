import { Engine, Scene, WebGPUEngine, Vector3, HemisphericLight, FreeCamera } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import Stats from 'stats.js';

/**
 * GameEngine class handles the core Babylon.js engine setup and management
 * Responsible for scene creation, render loop, and performance monitoring
 */
export class GameEngine {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private scene: Scene;
  private stats: Stats | null = null;
  private isDebug: boolean;

  /**
   * Creates a new GameEngine instance
   * @param canvasId - The ID of the canvas element to render to
   * @param debug - Whether to enable debug features (inspector, stats)
   */
  constructor(canvasId: string, debug: boolean = false) {
    this.isDebug = debug;
    
    // Get the canvas element
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) throw new Error(`Canvas element with id ${canvasId} not found`);
    
    // Initialize the Babylon Engine
    this.engine = new Engine(this.canvas, true, { 
      preserveDrawingBuffer: true,
      stencil: true
    });
    
    // Create a new scene
    this.scene = new Scene(this.engine);
    
    // Set up performance monitoring if in debug mode
    if (this.isDebug) {
      this.setupPerformanceMonitoring();
    }
    
    // Handle browser resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }
  
  /**
   * Attempts to initialize WebGPU if supported, falls back to WebGL
   * @returns Promise that resolves when engine is initialized
   */
  public async tryEnableWebGPU(): Promise<void> {
    // Only try WebGPU if we're not already using it
    if (this.engine instanceof WebGPUEngine) return;
    
    try {
      if (await WebGPUEngine.IsSupportedAsync) {
        // Store the current scene to transfer it later
        const oldScene = this.scene;
        
        // Create new WebGPU engine
        const webGPUEngine = new WebGPUEngine(this.canvas);
        await webGPUEngine.initAsync();
        
        // Replace the engine
        this.engine.dispose();
        this.engine = webGPUEngine;
        
        // Create a new scene based on the old one
        this.scene = oldScene.clone();
        
        console.log('Successfully switched to WebGPU engine');
      }
    } catch (e) {
      console.warn('WebGPU not supported or failed to initialize, using WebGL', e);
    }
  }
  
  /**
   * Sets up performance monitoring tools
   */
  private setupPerformanceMonitoring(): void {
    // Initialize Stats.js
    this.stats = new Stats();
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb
    document.body.appendChild(this.stats.dom);
    
    // Position the stats panel
    this.stats.dom.style.position = 'absolute';
    this.stats.dom.style.top = '0px';
    this.stats.dom.style.left = '0px';
    
    // Add inspector if in debug mode (accessible with Ctrl+Shift+I)
    this.scene.debugLayer.show({
      embedMode: true,
    });
  }
  
  /**
   * Creates a default scene with basic lighting and camera
   */
  public createDefaultScene(): void {
    // Create a basic light
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;
    
    // Create a default camera
    const camera = new FreeCamera('camera', new Vector3(0, 5, -10), this.scene);
    camera.setTarget(Vector3.Zero());
    camera.attachControl(this.canvas, true);
  }
  
  /**
   * Starts the render loop
   */
  public startRenderLoop(): void {
    this.engine.runRenderLoop(() => {
      if (this.isDebug && this.stats) this.stats.begin();
      
      this.scene.render();
      
      if (this.isDebug && this.stats) this.stats.end();
    });
  }
  
  /**
   * Gets the current Babylon.js scene
   */
  public getScene(): Scene {
    return this.scene;
  }
  
  /**
   * Gets the Babylon.js engine instance
   */
  public getEngine(): Engine {
    return this.engine;
  }
  
  /**
   * Gets the canvas element
   */
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
  
  /**
   * Forces a resize of the engine
   */
  public resize(): void {
    this.engine.resize();
  }
  
  /**
   * Disposes the engine and scene to free resources
   */
  public dispose(): void {
    this.scene.dispose();
    this.engine.dispose();
    
    if (this.stats) {
      document.body.removeChild(this.stats.dom);
      this.stats = null;
    }
  }
}
