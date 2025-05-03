import { Scene, Material, StandardMaterial, PBRMaterial, Color3, Texture, Vector2, CubeTexture } from '@babylonjs/core';

/**
 * Material configuration options
 */
export interface MaterialConfig {
  name: string;
  type: 'standard' | 'pbr';
  diffuseColor?: Color3;
  diffuseTexture?: string;
  specularColor?: Color3;
  specularTexture?: string;
  emissiveColor?: Color3;
  emissiveTexture?: string;
  bumpTexture?: string;
  opacityTexture?: string;
  tiling?: Vector2;
  metallic?: number;
  roughness?: number;
}

/**
 * MaterialSystem handles creation and management of materials for environments
 * Provides optimized material creation for different rendering needs
 */
export class MaterialSystem {
  private scene: Scene;
  private materials: Map<string, Material> = new Map();
  private baseUrl: string;

  /**
   * Create a new material system
   * @param scene - The Babylon.js scene
   * @param baseUrl - Base URL for texture paths
   */
  constructor(scene: Scene, baseUrl: string = 'assets/') {
    this.scene = scene;
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  }

  /**
   * Create a material based on configuration
   * @param config - Material configuration
   * @returns The created material
   */
  public createMaterial(config: MaterialConfig): Material {
    // Check if material already exists
    if (this.materials.has(config.name)) {
      return this.materials.get(config.name)!;
    }

    let material: Material;

    // Create the appropriate material type
    if (config.type === 'standard') {
      material = this.createStandardMaterial(config);
    } else {
      material = this.createPBRMaterial(config);
    }

    // Store the material
    this.materials.set(config.name, material);
    return material;
  }

  /**
   * Create a standard material
   * @param config - Material configuration
   * @returns Standard material
   */
  private createStandardMaterial(config: MaterialConfig): StandardMaterial {
    const material = new StandardMaterial(config.name, this.scene);

    // Set diffuse properties
    if (config.diffuseColor) {
      material.diffuseColor = config.diffuseColor;
    }
    if (config.diffuseTexture) {
      material.diffuseTexture = new Texture(this.baseUrl + 'textures/' + config.diffuseTexture, this.scene);
      if (config.tiling) {
        (material.diffuseTexture as Texture).uScale = config.tiling.x;
        (material.diffuseTexture as Texture).vScale = config.tiling.y;
      }
    }

    // Set specular properties
    if (config.specularColor) {
      material.specularColor = config.specularColor;
    }
    if (config.specularTexture) {
      material.specularTexture = new Texture(this.baseUrl + 'textures/' + config.specularTexture, this.scene);
      if (config.tiling) {
        (material.specularTexture as Texture).uScale = config.tiling.x;
        (material.specularTexture as Texture).vScale = config.tiling.y;
      }
    }

    // Set emissive properties
    if (config.emissiveColor) {
      material.emissiveColor = config.emissiveColor;
    }
    if (config.emissiveTexture) {
      material.emissiveTexture = new Texture(this.baseUrl + 'textures/' + config.emissiveTexture, this.scene);
      if (config.tiling) {
        (material.emissiveTexture as Texture).uScale = config.tiling.x;
        (material.emissiveTexture as Texture).vScale = config.tiling.y;
      }
    }

    // Set bump texture
    if (config.bumpTexture) {
      material.bumpTexture = new Texture(this.baseUrl + 'textures/' + config.bumpTexture, this.scene);
      if (config.tiling) {
        (material.bumpTexture as Texture).uScale = config.tiling.x;
        (material.bumpTexture as Texture).vScale = config.tiling.y;
      }
    }

    // Set opacity texture
    if (config.opacityTexture) {
      material.opacityTexture = new Texture(this.baseUrl + 'textures/' + config.opacityTexture, this.scene);
      if (config.tiling) {
        (material.opacityTexture as Texture).uScale = config.tiling.x;
        (material.opacityTexture as Texture).vScale = config.tiling.y;
      }
    }

    return material;
  }

  /**
   * Create a PBR material
   * @param config - Material configuration
   * @returns PBR material
   */
  private createPBRMaterial(config: MaterialConfig): PBRMaterial {
    const material = new PBRMaterial(config.name, this.scene);

    // Set base color
    if (config.diffuseColor) {
      material.albedoColor = config.diffuseColor;
    }
    if (config.diffuseTexture) {
      material.albedoTexture = new Texture(this.baseUrl + 'textures/' + config.diffuseTexture, this.scene);
      if (config.tiling) {
        (material.albedoTexture as Texture).uScale = config.tiling.x;
        (material.albedoTexture as Texture).vScale = config.tiling.y;
      }
    }

    // Set metallic and roughness
    if (config.metallic !== undefined) {
      material.metallic = config.metallic;
    }
    if (config.roughness !== undefined) {
      material.roughness = config.roughness;
    }

    // Set emissive properties
    if (config.emissiveColor) {
      material.emissiveColor = config.emissiveColor;
    }
    if (config.emissiveTexture) {
      material.emissiveTexture = new Texture(this.baseUrl + 'textures/' + config.emissiveTexture, this.scene);
      if (config.tiling) {
        (material.emissiveTexture as Texture).uScale = config.tiling.x;
        (material.emissiveTexture as Texture).vScale = config.tiling.y;
      }
    }

    // Set bump texture
    if (config.bumpTexture) {
      material.bumpTexture = new Texture(this.baseUrl + 'textures/' + config.bumpTexture, this.scene);
      if (config.tiling) {
        (material.bumpTexture as Texture).uScale = config.tiling.x;
        (material.bumpTexture as Texture).vScale = config.tiling.y;
      }
    }

    return material;
  }

  /**
   * Create a skybox material
   * @param name - Name of the skybox material
   * @param folderPath - Path to the skybox textures folder
   * @param fileNames - Array of file names for each face [px, py, pz, nx, ny, nz]
   * @returns The skybox material
   */
  public createSkyboxMaterial(name: string, folderPath: string, fileNames: string[]): StandardMaterial {
    const skyboxMaterial = new StandardMaterial(name, this.scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new CubeTexture(
      this.baseUrl + folderPath, 
      this.scene, 
      fileNames
    );
    skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
    skyboxMaterial.specularColor = new Color3(0, 0, 0);
    
    this.materials.set(name, skyboxMaterial);
    return skyboxMaterial;
  }

  /**
   * Get a material by name
   * @param name - Name of the material
   * @returns The material or undefined if not found
   */
  public getMaterial(name: string): Material | undefined {
    return this.materials.get(name);
  }

  /**
   * Dispose of a material
   * @param name - Name of the material to dispose
   */
  public disposeMaterial(name: string): void {
    const material = this.materials.get(name);
    if (material) {
      material.dispose();
      this.materials.delete(name);
    }
  }

  /**
   * Dispose of all materials
   */
  public disposeAll(): void {
    this.materials.forEach(material => material.dispose());
    this.materials.clear();
  }
}
