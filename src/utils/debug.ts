import { Scene, Engine, Vector3, AxesViewer, Color3 } from '@babylonjs/core';
import '@babylonjs/inspector';
// @ts-ignore - Stats.js has type issues but works fine at runtime
import Stats from 'stats.js';

/**
 * Debug utility class for Project Prism Protocol
 * Provides performance monitoring and visual debugging tools
 */
export class DebugUtility {
  private scene: Scene;
  private engine: Engine;
  private stats: Stats | null = null;
  private fpsElement: HTMLElement | null = null;
  private drawCallsElement: HTMLElement | null = null;
  private trianglesElement: HTMLElement | null = null;
  private debugContainer: HTMLElement | null = null;
  private isEnabled: boolean = false;

  /**
   * Creates a new DebugUtility instance
   * @param scene - The Babylon.js scene
   * @param engine - The Babylon.js engine
   */
  constructor(scene: Scene, engine: Engine) {
    this.scene = scene;
    this.engine = engine;
  }

  /**
   * Enables debug features
   */
  public enable(): void {
    if (this.isEnabled) return;
    this.isEnabled = true;

    // Create Stats.js instance
    this.stats = new Stats();
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb
    document.body.appendChild(this.stats.dom);
    
    // Position the stats panel
    this.stats.dom.style.position = 'absolute';
    this.stats.dom.style.top = '0px';
    this.stats.dom.style.left = '0px';
    this.stats.dom.style.zIndex = '100';

    // Create custom debug info container
    this.createDebugContainer();
    
    // Register to the render loop
    this.scene.onBeforeRenderObservable.add(() => {
      if (this.stats) this.stats.begin();
    });
    
    this.scene.onAfterRenderObservable.add(() => {
      if (this.stats) this.stats.end();
      this.updateDebugInfo();
    });
    
    // Enable inspector (Ctrl+Shift+I to toggle)
    this.scene.debugLayer.show({
      embedMode: true,
    });
    
    console.log('Debug utilities enabled');
  }

  /**
   * Disables debug features
   */
  public disable(): void {
    if (!this.isEnabled) return;
    this.isEnabled = false;
    
    // Remove Stats.js
    if (this.stats) {
      document.body.removeChild(this.stats.dom);
      this.stats = null;
    }
    
    // Remove debug container
    if (this.debugContainer && this.debugContainer.parentNode) {
      this.debugContainer.parentNode.removeChild(this.debugContainer);
    }
    
    // Hide inspector
    this.scene.debugLayer.hide();
    
    console.log('Debug utilities disabled');
  }

  /**
   * Creates the debug information container
   */
  private createDebugContainer(): void {
    // Create container
    this.debugContainer = document.createElement('div');
    this.debugContainer.style.position = 'absolute';
    this.debugContainer.style.top = '50px';
    this.debugContainer.style.left = '10px';
    this.debugContainer.style.backgroundColor = 'rgba(0,0,0,0.5)';
    this.debugContainer.style.color = 'white';
    this.debugContainer.style.padding = '10px';
    this.debugContainer.style.fontFamily = 'monospace';
    this.debugContainer.style.fontSize = '12px';
    this.debugContainer.style.zIndex = '100';
    this.debugContainer.style.borderRadius = '5px';
    this.debugContainer.style.width = '200px';
    
    // FPS counter
    this.fpsElement = document.createElement('div');
    this.debugContainer.appendChild(this.fpsElement);
    
    // Draw calls counter
    this.drawCallsElement = document.createElement('div');
    this.debugContainer.appendChild(this.drawCallsElement);
    
    // Triangles counter
    this.trianglesElement = document.createElement('div');
    this.debugContainer.appendChild(this.trianglesElement);
    
    // Add toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Hide Debug';
    toggleButton.style.marginTop = '10px';
    toggleButton.style.width = '100%';
    toggleButton.style.padding = '5px';
    toggleButton.addEventListener('click', () => {
      if (this.debugContainer) {
        const isHidden = this.debugContainer.style.display === 'none';
        this.debugContainer.style.display = isHidden ? 'block' : 'none';
        toggleButton.textContent = isHidden ? 'Hide Debug' : 'Show Debug';
      }
    });
    this.debugContainer.appendChild(toggleButton);
    
    document.body.appendChild(this.debugContainer);
  }

  /**
   * Updates the debug information display
   */
  private updateDebugInfo(): void {
    if (!this.isEnabled) return;
    
    // Update FPS
    if (this.fpsElement) {
      this.fpsElement.textContent = `FPS: ${Math.round(this.engine.getFps())}`;
    }
    
    // Update draw calls
    if (this.drawCallsElement) {
      // Access internal _drawCalls property or fallback to 0
      const drawCalls = (this.engine as any)._drawCalls ? (this.engine as any)._drawCalls.count : 0;
      this.drawCallsElement.textContent = `Draw calls: ${drawCalls}`;
    }
    
    // Update triangles
    if (this.trianglesElement) {
      // Calculate total vertices manually
      let totalVertices = 0;
      this.scene.meshes.forEach(mesh => {
        if (mesh.isEnabled() && mesh.isVisible) {
          totalVertices += mesh.getTotalVertices();
        }
      });
      this.trianglesElement.textContent = `Triangles: ${totalVertices}`;
    }
  }

  /**
   * Creates axes viewer at the specified position
   * @param position - Position for the axes viewer
   * @param size - Size of the axes (default: 1)
   * @returns The created AxesViewer
   */
  public createAxesViewer(position: Vector3, size: number = 1): AxesViewer {
    const axesViewer = new AxesViewer(this.scene, size);
    axesViewer.xAxis.position = position;
    return axesViewer;
  }

  /**
   * Logs mesh information to the console
   * @param meshName - Name of the mesh to log info for, or undefined for all meshes
   */
  public logMeshInfo(meshName?: string): void {
    // Get meshes by name or all meshes
    const meshes = meshName 
      ? [this.scene.getMeshByName(meshName)].filter(mesh => mesh !== null)
      : this.scene.meshes;
    
    console.group('Mesh Information');
    
    meshes.forEach(mesh => {
      console.group(`Mesh: ${mesh.name}`);
      console.log(`Vertices: ${mesh.getTotalVertices()}`);
      console.log(`Faces: ${mesh.getTotalIndices() / 3}`);
      console.log(`Position: ${mesh.position.toString()}`);
      console.log(`Visible: ${mesh.isVisible}`);
      console.log(`Enabled: ${mesh.isEnabled()}`);
      console.log(`Has skeleton: ${mesh.skeleton !== null}`);
      console.groupEnd();
    });
    
    console.groupEnd();
  }

  /**
   * Toggles wireframe mode for all meshes
   * @param enable - Whether to enable wireframe mode
   */
  public toggleWireframe(enable: boolean): void {
    this.scene.meshes.forEach(mesh => {
      if (mesh.material) {
        mesh.material.wireframe = enable;
      }
    });
  }

  /**
   * Toggles bounding box display for all meshes
   * @param enable - Whether to show bounding boxes
   */
  public toggleBoundingBoxes(enable: boolean): void {
    this.scene.meshes.forEach(mesh => {
      mesh.showBoundingBox = enable;
    });
  }
}
