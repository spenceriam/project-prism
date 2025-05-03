import { Scene, Engine, Observable } from '@babylonjs/core';

/**
 * Memory usage statistics
 */
export interface MemoryStats {
  /** Total JavaScript heap size in MB */
  totalJSHeapSize: number;
  /** Used JavaScript heap size in MB */
  usedJSHeapSize: number;
  /** JavaScript heap size limit in MB */
  jsHeapSizeLimit: number;
  /** Percentage of heap used */
  heapUsagePercent: number;
  /** Total allocated GPU memory in MB (if available) */
  gpuMemory: number;
  /** Number of active meshes */
  activeMeshes: number;
  /** Number of active vertices */
  activeVertices: number;
  /** Number of active indices */
  activeIndices: number;
  /** Number of active bones */
  activeBones: number;
  /** Number of active textures */
  activeTextures: number;
  /** Number of draw calls per frame */
  drawCalls: number;
  /** Timestamp of the measurement */
  timestamp: number;
}

/**
 * Memory threshold configuration
 */
export interface MemoryThresholds {
  /** Warning threshold for heap usage percentage */
  heapUsageWarning: number;
  /** Critical threshold for heap usage percentage */
  heapUsageCritical: number;
  /** Warning threshold for draw calls */
  drawCallsWarning: number;
  /** Critical threshold for draw calls */
  drawCallsCritical: number;
  /** Warning threshold for active vertices (in millions) */
  activeVerticesWarning: number;
  /** Critical threshold for active vertices (in millions) */
  activeVerticesCritical: number;
}

/**
 * Configuration for memory monitoring
 */
export interface MemoryMonitorConfig {
  /** How frequently to update memory stats (in milliseconds) */
  updateFrequency: number;
  /** How many samples to keep in history */
  historySamples: number;
  /** Whether to log warnings to console */
  logWarnings: boolean;
  /** Memory thresholds for warnings */
  thresholds: MemoryThresholds;
  /** Whether to show the monitoring UI */
  showMonitoringUI: boolean;
}

/**
 * MemoryMonitor tracks memory usage and provides optimization suggestions
 * Implements memory monitoring for browser-based game performance
 */
export class MemoryMonitor {
  private scene: Scene;
  private engine: any; // Using any to accommodate AbstractEngine
  private config: MemoryMonitorConfig;
  private updateInterval: number | null = null;
  private memoryHistory: MemoryStats[] = [];
  private uiContainer: HTMLElement | null = null;
  private uiChartCanvas: HTMLCanvasElement | null = null;
  private uiStatsElement: HTMLElement | null = null;
  private uiWarningsElement: HTMLElement | null = null;
  
  /** Observable that triggers when memory stats are updated */
  public onStatsUpdatedObservable: Observable<MemoryStats> = new Observable<MemoryStats>();
  
  /** Observable that triggers when a memory warning occurs */
  public onMemoryWarningObservable: Observable<{
    type: 'warning' | 'critical',
    message: string,
    stats: MemoryStats
  }> = new Observable();
  
  /**
   * Creates a new MemoryMonitor
   * @param scene - The Babylon.js scene
   * @param config - Configuration for memory monitoring
   */
  constructor(
    scene: Scene,
    config: MemoryMonitorConfig = {
      updateFrequency: 1000,
      historySamples: 60,
      logWarnings: true,
      thresholds: {
        heapUsageWarning: 70,
        heapUsageCritical: 90,
        drawCallsWarning: 500,
        drawCallsCritical: 1000,
        activeVerticesWarning: 1.0, // 1 million
        activeVerticesCritical: 2.0  // 2 million
      },
      showMonitoringUI: false
    }
  ) {
    this.scene = scene;
    this.engine = scene.getEngine();
    this.config = config;
  }
  
  /**
   * Starts the memory monitoring
   */
  public start(): void {
    // Clear any existing interval
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
    }
    
    // Clear history
    this.memoryHistory = [];
    
    // Create UI if enabled
    if (this.config.showMonitoringUI) {
      this.createUI();
    }
    
    // Start the update interval
    this.updateInterval = window.setInterval(
      () => this.update(),
      this.config.updateFrequency
    );
    
    console.log('Memory monitoring started');
  }
  
  /**
   * Stops the memory monitoring
   */
  public stop(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Remove UI if it exists
    this.removeUI();
    
    console.log('Memory monitoring stopped');
  }
  
  /**
   * Updates memory statistics
   */
  private update(): void {
    // Get current memory stats
    const stats = this.getMemoryStats();
    
    // Add to history
    this.memoryHistory.push(stats);
    
    // Trim history if needed
    if (this.memoryHistory.length > this.config.historySamples) {
      this.memoryHistory.shift();
    }
    
    // Check for warnings
    this.checkWarnings(stats);
    
    // Update UI if enabled
    if (this.config.showMonitoringUI) {
      this.updateUI(stats);
    }
    
    // Notify observers
    this.onStatsUpdatedObservable.notifyObservers(stats);
  }
  
  /**
   * Gets current memory statistics
   * @returns The current memory statistics
   */
  private getMemoryStats(): MemoryStats {
    // Get performance memory if available
    // Note: memory is a non-standard extension only available in Chrome
    const performance = window.performance as any;
    const memory = performance?.memory ? {
      totalJSHeapSize: performance.memory.totalJSHeapSize || 0,
      usedJSHeapSize: performance.memory.usedJSHeapSize || 0,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit || 0
    } : {
      totalJSHeapSize: 0,
      usedJSHeapSize: 0,
      jsHeapSizeLimit: 0
    };
    
    // Convert to MB for readability
    const totalJSHeapSize = memory.totalJSHeapSize / (1024 * 1024);
    const usedJSHeapSize = memory.usedJSHeapSize / (1024 * 1024);
    const jsHeapSizeLimit = memory.jsHeapSizeLimit / (1024 * 1024);
    
    // Calculate heap usage percentage
    const heapUsagePercent = jsHeapSizeLimit > 0 
      ? (usedJSHeapSize / jsHeapSizeLimit) * 100 
      : 0;
    
    // Get GPU memory if available (not available in most browsers)
    const gpuMemory = 0; // Placeholder, not reliably available
    
    // Get scene statistics
    const activeMeshes = this.scene.getActiveMeshes().length;
    
    // Calculate vertices and indices manually since engine methods may not be available
    let activeVertices = 0;
    let activeIndices = 0;
    this.scene.meshes.forEach(mesh => {
      if (mesh.isEnabled() && mesh.isVisible) {
        activeVertices += mesh.getTotalVertices();
        activeIndices += mesh.getTotalIndices();
      }
    });
    
    const activeBones = this.scene.getActiveBones();
    const activeTextures = this.scene.textures.length;
    
    // Get draw calls from engine if available, or estimate
    const drawCalls = this.engine._drawCalls ? this.engine._drawCalls.count : this.scene.meshes.length;
    
    return {
      totalJSHeapSize,
      usedJSHeapSize,
      jsHeapSizeLimit,
      heapUsagePercent,
      gpuMemory,
      activeMeshes,
      activeVertices,
      activeIndices,
      activeBones,
      activeTextures,
      drawCalls,
      timestamp: Date.now()
    };
  }
  
  /**
   * Checks for memory warnings based on thresholds
   * @param stats - Current memory statistics
   */
  private checkWarnings(stats: MemoryStats): void {
    const warnings: {
      type: 'warning' | 'critical',
      message: string
    }[] = [];
    
    // Check heap usage
    if (stats.heapUsagePercent >= this.config.thresholds.heapUsageCritical) {
      warnings.push({
        type: 'critical',
        message: `Critical: JavaScript heap usage at ${stats.heapUsagePercent.toFixed(1)}%`
      });
    } else if (stats.heapUsagePercent >= this.config.thresholds.heapUsageWarning) {
      warnings.push({
        type: 'warning',
        message: `Warning: JavaScript heap usage at ${stats.heapUsagePercent.toFixed(1)}%`
      });
    }
    
    // Check draw calls
    if (stats.drawCalls >= this.config.thresholds.drawCallsCritical) {
      warnings.push({
        type: 'critical',
        message: `Critical: High draw call count (${stats.drawCalls})`
      });
    } else if (stats.drawCalls >= this.config.thresholds.drawCallsWarning) {
      warnings.push({
        type: 'warning',
        message: `Warning: High draw call count (${stats.drawCalls})`
      });
    }
    
    // Check active vertices
    const verticesMillions = stats.activeVertices / 1000000;
    if (verticesMillions >= this.config.thresholds.activeVerticesCritical) {
      warnings.push({
        type: 'critical',
        message: `Critical: High vertex count (${verticesMillions.toFixed(2)}M)`
      });
    } else if (verticesMillions >= this.config.thresholds.activeVerticesWarning) {
      warnings.push({
        type: 'warning',
        message: `Warning: High vertex count (${verticesMillions.toFixed(2)}M)`
      });
    }
    
    // Log warnings if enabled
    if (this.config.logWarnings && warnings.length > 0) {
      warnings.forEach(warning => {
        if (warning.type === 'critical') {
          console.error(warning.message);
        } else {
          console.warn(warning.message);
        }
        
        // Notify observers
        this.onMemoryWarningObservable.notifyObservers({
          type: warning.type,
          message: warning.message,
          stats
        });
      });
    }
    
    // Update UI warnings if enabled
    if (this.config.showMonitoringUI && this.uiWarningsElement) {
      this.updateWarningsUI(warnings);
    }
  }
  
  /**
   * Creates the monitoring UI
   */
  private createUI(): void {
    // Create container
    this.uiContainer = document.createElement('div');
    this.uiContainer.style.position = 'absolute';
    this.uiContainer.style.bottom = '10px';
    this.uiContainer.style.right = '10px';
    this.uiContainer.style.backgroundColor = 'rgba(0,0,0,0.7)';
    this.uiContainer.style.color = 'white';
    this.uiContainer.style.padding = '10px';
    this.uiContainer.style.fontFamily = 'monospace';
    this.uiContainer.style.fontSize = '12px';
    this.uiContainer.style.zIndex = '1000';
    this.uiContainer.style.borderRadius = '5px';
    this.uiContainer.style.width = '300px';
    this.uiContainer.style.maxHeight = '400px';
    this.uiContainer.style.overflow = 'hidden';
    
    // Create title
    const title = document.createElement('div');
    title.textContent = 'Memory Monitor';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '5px';
    title.style.borderBottom = '1px solid #666';
    title.style.paddingBottom = '5px';
    this.uiContainer.appendChild(title);
    
    // Create chart canvas
    this.uiChartCanvas = document.createElement('canvas');
    this.uiChartCanvas.width = 280;
    this.uiChartCanvas.height = 100;
    this.uiChartCanvas.style.marginBottom = '10px';
    this.uiContainer.appendChild(this.uiChartCanvas);
    
    // Create stats container
    this.uiStatsElement = document.createElement('div');
    this.uiContainer.appendChild(this.uiStatsElement);
    
    // Create warnings container
    this.uiWarningsElement = document.createElement('div');
    this.uiWarningsElement.style.marginTop = '10px';
    this.uiWarningsElement.style.color = '#ffcc00';
    this.uiContainer.appendChild(this.uiWarningsElement);
    
    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Hide';
    toggleButton.style.marginTop = '10px';
    toggleButton.style.width = '100%';
    toggleButton.style.padding = '5px';
    toggleButton.addEventListener('click', () => {
      if (this.uiContainer) {
        const isExpanded = this.uiContainer.style.height !== 'auto';
        if (isExpanded) {
          this.uiContainer.style.height = '30px';
          this.uiContainer.style.overflow = 'hidden';
          toggleButton.textContent = 'Show';
        } else {
          this.uiContainer.style.height = 'auto';
          toggleButton.textContent = 'Hide';
        }
      }
    });
    this.uiContainer.appendChild(toggleButton);
    
    // Add to document
    document.body.appendChild(this.uiContainer);
  }
  
  /**
   * Removes the monitoring UI
   */
  private removeUI(): void {
    if (this.uiContainer && this.uiContainer.parentNode) {
      this.uiContainer.parentNode.removeChild(this.uiContainer);
      this.uiContainer = null;
      this.uiChartCanvas = null;
      this.uiStatsElement = null;
      this.uiWarningsElement = null;
    }
  }
  
  /**
   * Updates the monitoring UI with current stats
   * @param stats - Current memory statistics
   */
  private updateUI(stats: MemoryStats): void {
    if (!this.uiStatsElement || !this.uiChartCanvas) return;
    
    // Update stats display
    this.uiStatsElement.innerHTML = `
      <div>Heap: ${stats.usedJSHeapSize.toFixed(1)}MB / ${stats.jsHeapSizeLimit.toFixed(1)}MB (${stats.heapUsagePercent.toFixed(1)}%)</div>
      <div>Meshes: ${stats.activeMeshes}</div>
      <div>Vertices: ${(stats.activeVertices / 1000).toFixed(1)}K</div>
      <div>Draw Calls: ${stats.drawCalls}</div>
      <div>Textures: ${stats.activeTextures}</div>
      <div>Bones: ${stats.activeBones}</div>
    `;
    
    // Update chart
    this.updateChart();
  }
  
  /**
   * Updates the warnings UI
   * @param warnings - Current warnings
   */
  private updateWarningsUI(warnings: { type: 'warning' | 'critical', message: string }[]): void {
    if (!this.uiWarningsElement) return;
    
    if (warnings.length === 0) {
      this.uiWarningsElement.innerHTML = '';
      return;
    }
    
    let html = '<div style="font-weight: bold; margin-bottom: 5px;">Warnings:</div>';
    
    warnings.forEach(warning => {
      const color = warning.type === 'critical' ? '#ff4444' : '#ffcc00';
      html += `<div style="color: ${color}; margin-bottom: 3px;">${warning.message}</div>`;
    });
    
    this.uiWarningsElement.innerHTML = html;
  }
  
  /**
   * Updates the memory usage chart
   */
  private updateChart(): void {
    if (!this.uiChartCanvas || this.memoryHistory.length === 0) return;
    
    const ctx = this.uiChartCanvas.getContext('2d');
    if (!ctx) return;
    
    const width = this.uiChartCanvas.width;
    const height = this.uiChartCanvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let i = 0; i <= 5; i++) {
      const x = Math.floor(width * (i / 5)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = Math.floor(height * (i / 4)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Find max values for scaling
    let maxHeapUsage = 0;
    let maxDrawCalls = 0;
    
    this.memoryHistory.forEach(stat => {
      maxHeapUsage = Math.max(maxHeapUsage, stat.heapUsagePercent);
      maxDrawCalls = Math.max(maxDrawCalls, stat.drawCalls);
    });
    
    // Ensure reasonable minimums
    maxHeapUsage = Math.max(maxHeapUsage, 100);
    maxDrawCalls = Math.max(maxDrawCalls, 1000);
    
    // Draw heap usage line
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    this.memoryHistory.forEach((stat, index) => {
      const x = width * (index / (this.config.historySamples - 1));
      const y = height - (height * (stat.heapUsagePercent / maxHeapUsage));
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw draw calls line
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    this.memoryHistory.forEach((stat, index) => {
      const x = width * (index / (this.config.historySamples - 1));
      const y = height - (height * (stat.drawCalls / maxDrawCalls));
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw legend
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText('Heap %', 5, 12);
    ctx.fillText('Draw Calls', 5, 24);
    
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(60, 5, 10, 10);
    
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(80, 17, 10, 10);
  }
  
  /**
   * Gets the current memory statistics
   * @returns The current memory statistics
   */
  public getCurrentStats(): MemoryStats {
    return this.getMemoryStats();
  }
  
  /**
   * Gets the memory statistics history
   * @returns Array of memory statistics
   */
  public getStatsHistory(): MemoryStats[] {
    return [...this.memoryHistory];
  }
  
  /**
   * Toggles the monitoring UI visibility
   * @param show - Whether to show the UI
   */
  public toggleUI(show: boolean): void {
    this.config.showMonitoringUI = show;
    
    if (show && !this.uiContainer) {
      this.createUI();
    } else if (!show && this.uiContainer) {
      this.removeUI();
    }
  }
  
  /**
   * Gets optimization suggestions based on current memory usage
   * @returns Array of optimization suggestions
   */
  public getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const currentStats = this.getCurrentStats();
    
    // Check heap usage
    if (currentStats.heapUsagePercent > this.config.thresholds.heapUsageWarning) {
      suggestions.push('Reduce JavaScript memory usage by disposing unused objects');
      suggestions.push('Check for memory leaks in event listeners and references');
    }
    
    // Check draw calls
    if (currentStats.drawCalls > this.config.thresholds.drawCallsWarning) {
      suggestions.push('Reduce draw calls by combining meshes or using instancing');
      suggestions.push('Implement frustum culling for off-screen objects');
    }
    
    // Check vertices
    const verticesMillions = currentStats.activeVertices / 1000000;
    if (verticesMillions > this.config.thresholds.activeVerticesWarning) {
      suggestions.push('Reduce polygon count with LOD (Level of Detail) meshes');
      suggestions.push('Simplify geometry for distant objects');
    }
    
    // Check textures
    if (currentStats.activeTextures > 20) { // Arbitrary threshold
      suggestions.push('Reduce texture count by using texture atlases');
      suggestions.push('Implement texture compression for web delivery');
    }
    
    // Add general suggestions
    suggestions.push('Implement asset streaming for large levels');
    suggestions.push('Use object pooling for frequently created/destroyed objects');
    suggestions.push('Explicitly dispose unused resources');
    
    return suggestions;
  }
}
