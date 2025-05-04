import { Scene, HemisphericLight, DirectionalLight, PointLight, SpotLight, ShadowGenerator, Vector3, Color3, Light } from '@babylonjs/core';

/**
 * Lighting configuration for environment
 */
export interface LightingConfig {
  ambient?: {
    intensity?: number;
    direction?: Vector3;
    color?: Color3;
  };
  directional?: {
    intensity?: number;
    direction?: Vector3;
    color?: Color3;
    shadowEnabled?: boolean;
    shadowQuality?: number; // 512, 1024, 2048, 4096
  };
  points?: {
    positions: Vector3[];
    intensity?: number;
    color?: Color3;
    range?: number;
    shadowEnabled?: boolean;
    shadowQuality?: number;
  };
  spots?: {
    positions: Vector3[];
    directions: Vector3[];
    intensity?: number;
    color?: Color3;
    angle?: number;
    exponent?: number;
    shadowEnabled?: boolean;
    shadowQuality?: number;
  };
}

/**
 * LightingSystem handles creation and management of lights for environments
 * Optimized for indoor and outdoor lighting scenarios with performance in mind
 */
export class LightingSystem {
  private scene: Scene;
  private lights: Light[] = [];
  private shadowGenerators: ShadowGenerator[] = [];

  /**
   * Create a new lighting system
   * @param scene - The Babylon.js scene
   */
  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Configure lighting based on provided configuration
   * @param config - The lighting configuration
   */
  public configureLighting(config: LightingConfig): void {
    this.dispose(); // Clear existing lights

    // Create ambient light if specified
    if (config.ambient) {
      const direction = config.ambient.direction || new Vector3(0, 1, 0);
      const color = config.ambient.color || new Color3(1, 1, 1);
      const intensity = config.ambient.intensity || 0.3;

      const ambientLight = new HemisphericLight('ambient', direction, this.scene);
      ambientLight.intensity = intensity;
      ambientLight.diffuse = color;
      ambientLight.groundColor = color.scale(0.5); // Darker ground color
      
      this.lights.push(ambientLight);
    }

    // Create directional light if specified
    if (config.directional) {
      const direction = config.directional.direction || new Vector3(0.5, -1, 0.5);
      const color = config.directional.color || new Color3(1, 1, 1);
      const intensity = config.directional.intensity || 0.7;

      const directionalLight = new DirectionalLight('directional', direction, this.scene);
      directionalLight.intensity = intensity;
      directionalLight.diffuse = color;

      // Set up shadows if enabled
      if (config.directional.shadowEnabled) {
        const shadowQuality = config.directional.shadowQuality || 1024;
        const shadowGenerator = new ShadowGenerator(shadowQuality, directionalLight);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurScale = 2;
        shadowGenerator.setDarkness(0.3);
        
        this.shadowGenerators.push(shadowGenerator);
      }
      
      this.lights.push(directionalLight);
    }

    // Create point lights if specified
    if (config.points && config.points.positions.length > 0) {
      const intensity = config.points.intensity || 0.7;
      const color = config.points.color || new Color3(1, 1, 1);
      const range = config.points.range || 10;
      const shadowEnabled = config.points.shadowEnabled || false;
      const shadowQuality = config.points.shadowQuality || 512;

      config.points.positions.forEach((position, index) => {
        const pointLight = new PointLight(`point_${index}`, position, this.scene);
        pointLight.intensity = intensity;
        pointLight.diffuse = color;
        pointLight.range = range;

        // Set up shadows if enabled (note: shadows from point lights are expensive)
        if (shadowEnabled) {
          const shadowGenerator = new ShadowGenerator(shadowQuality, pointLight);
          shadowGenerator.useBlurExponentialShadowMap = true;
          shadowGenerator.blurScale = 2;
          shadowGenerator.setDarkness(0.3);
          
          this.shadowGenerators.push(shadowGenerator);
        }
        
        this.lights.push(pointLight);
      });
    }

    // Create spot lights if specified
    if (config.spots && config.spots.positions.length > 0) {
      const intensity = config.spots.intensity || 0.7;
      const color = config.spots.color || new Color3(1, 1, 1);
      const angle = config.spots.angle || Math.PI / 4;
      const exponent = config.spots.exponent || 2;
      const shadowEnabled = config.spots.shadowEnabled || false;
      const shadowQuality = config.spots.shadowQuality || 512;

      // Ensure spots configuration exists and has directions array
      if (config.spots && config.spots.positions && config.spots.directions) {
        config.spots.positions.forEach((position, index) => {
          // Get direction or use default downward vector
          const directions = config.spots?.directions;
          const direction = (directions && index < directions.length) ? 
            directions[index] : new Vector3(0, -1, 0);
          const spotLight = new SpotLight(`spot_${index}`, position, direction, angle, exponent, this.scene);
          spotLight.intensity = intensity;
          spotLight.diffuse = color;

          // Set up shadows if enabled
          if (shadowEnabled) {
            const shadowGenerator = new ShadowGenerator(shadowQuality, spotLight);
            shadowGenerator.useBlurExponentialShadowMap = true;
            shadowGenerator.blurScale = 2;
            shadowGenerator.setDarkness(0.3);
            
            this.shadowGenerators.push(shadowGenerator);
          }
          
          this.lights.push(spotLight);
        });
      }
    }
  }

  /**
   * Add a mesh to receive shadows from all shadow generators
   * @param meshes - The meshes to receive shadows
   */
  public addShadowCasters(meshes: any[]): void {
    this.shadowGenerators.forEach(generator => {
      meshes.forEach(mesh => {
        generator.addShadowCaster(mesh);
      });
    });
  }

  /**
   * Dispose of all lights and shadow generators
   */
  public dispose(): void {
    this.lights.forEach(light => light.dispose());
    this.shadowGenerators.forEach(generator => generator.dispose());
    
    this.lights = [];
    this.shadowGenerators = [];
  }
}
