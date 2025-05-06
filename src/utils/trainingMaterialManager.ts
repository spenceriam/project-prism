import { Scene, Color3, Vector2, PBRMaterial, Texture, CubeTexture, Material } from '@babylonjs/core';
import { MaterialSystem } from '../components/environment/materials';

/**
 * TrainingMaterialManager
 * Specialized material manager for the Training Facility environment
 * Creates and manages PBR materials with textures for the training level
 */
export class TrainingMaterialManager {
  private scene: Scene;
  private materialSystem: MaterialSystem;
  private materials: Map<string, Material> = new Map();

  /**
   * Creates a new TrainingMaterialManager
   * @param scene - The Babylon.js scene
   * @param materialSystem - The main material system
   */
  constructor(scene: Scene, materialSystem: MaterialSystem) {
    this.scene = scene;
    this.materialSystem = materialSystem;
  }

  /**
   * Create all materials for the Training Facility
   */
  public createMaterials(): void {
    console.log('Creating Training Facility materials...');
    
    // Wall materials
    this.createWallMaterials();
    
    // Floor materials
    this.createFloorMaterials();
    
    // Prop materials
    this.createPropMaterials();
    
    // Target materials
    this.createTargetMaterials();
    
    console.log('Training Facility materials created successfully');
  }
  
  /**
   * Create wall materials for different sections of the facility
   */
  private createWallMaterials(): void {
    // Main wall material
    this.materials.set('wall_main', this.materialSystem.createMaterial({
      name: 'training_wall_main',
      type: 'pbr',
      diffuseTexture: 'training/walls/wall_main_diffuse.jpg',
      bumpTexture: 'training/walls/wall_main_normal.jpg',
      ambientTexture: 'training/walls/wall_main_ao.jpg',
      metallic: 0.05,
      roughness: 0.9,
      tiling: new Vector2(4, 2)
    }));
    
    // Wall trim material
    this.materials.set('wall_trim', this.materialSystem.createMaterial({
      name: 'training_wall_trim',
      type: 'pbr',
      diffuseTexture: 'training/walls/wall_trim_diffuse.jpg',
      bumpTexture: 'training/walls/wall_trim_normal.jpg',
      metallicTexture: 'training/walls/wall_trim_metallic.jpg',
      roughness: 0.6,
      tiling: new Vector2(10, 1)
    }));
    
    // Shooting range wall material
    this.materials.set('wall_range', this.materialSystem.createMaterial({
      name: 'training_wall_range',
      type: 'pbr',
      diffuseTexture: 'training/walls/wall_range_diffuse.jpg',
      bumpTexture: 'training/walls/wall_range_normal.jpg',
      metallic: 0.1,
      roughness: 0.8,
      tiling: new Vector2(3, 2)
    }));
  }
  
  /**
   * Create floor materials for different sections of the facility
   */
  private createFloorMaterials(): void {
    // Main floor material
    this.materials.set('floor_main', this.materialSystem.createMaterial({
      name: 'training_floor_main',
      type: 'pbr',
      diffuseTexture: 'training/floors/floor_main_diffuse.jpg',
      bumpTexture: 'training/floors/floor_main_normal.jpg',
      ambientTexture: 'training/floors/floor_main_ao.jpg',
      metallic: 0.1,
      roughness: 0.8,
      tiling: new Vector2(8, 8)
    }));
    
    // Shooting range floor material
    this.materials.set('floor_range', this.materialSystem.createMaterial({
      name: 'training_floor_range',
      type: 'pbr',
      diffuseTexture: 'training/floors/floor_range_diffuse.jpg',
      bumpTexture: 'training/floors/floor_range_normal.jpg',
      metallic: 0.05,
      roughness: 0.9,
      tiling: new Vector2(6, 6)
    }));
    
    // Movement course floor material
    this.materials.set('floor_course', this.materialSystem.createMaterial({
      name: 'training_floor_course',
      type: 'pbr',
      diffuseTexture: 'training/floors/floor_course_diffuse.jpg',
      bumpTexture: 'training/floors/floor_course_normal.jpg',
      metallic: 0.05,
      roughness: 0.85,
      tiling: new Vector2(5, 5)
    }));
  }
  
  /**
   * Create materials for props and furniture
   */
  private createPropMaterials(): void {
    // Metal material for racks, barriers, etc.
    this.materials.set('metal', this.materialSystem.createMaterial({
      name: 'training_metal',
      type: 'pbr',
      diffuseTexture: 'training/props/metal_diffuse.jpg',
      bumpTexture: 'training/props/metal_normal.jpg',
      metallicTexture: 'training/props/metal_metallic.jpg',
      roughnessTexture: 'training/props/metal_roughness.jpg',
      tiling: new Vector2(2, 2)
    }));
    
    // Wood material for tables, etc.
    this.materials.set('wood', this.materialSystem.createMaterial({
      name: 'training_wood',
      type: 'pbr',
      diffuseTexture: 'training/props/wood_diffuse.jpg',
      bumpTexture: 'training/props/wood_normal.jpg',
      ambientTexture: 'training/props/wood_ao.jpg',
      metallic: 0.05,
      roughness: 0.8,
      tiling: new Vector2(2, 2)
    }));
    
    // Plastic material for chairs, etc.
    this.materials.set('plastic', this.materialSystem.createMaterial({
      name: 'training_plastic',
      type: 'pbr',
      diffuseTexture: 'training/props/plastic_diffuse.jpg',
      bumpTexture: 'training/props/plastic_normal.jpg',
      metallic: 0.1,
      roughness: 0.9,
      tiling: new Vector2(2, 2)
    }));
    
    // Glass material for windows, displays, etc.
    this.materials.set('glass', this.materialSystem.createMaterial({
      name: 'training_glass',
      type: 'pbr',
      diffuseColor: new Color3(0.8, 0.8, 0.9),
      alpha: 0.5,
      metallic: 0.9,
      roughness: 0.1
    }));
  }
  
  /**
   * Create materials for targets and interactive elements
   */
  private createTargetMaterials(): void {
    // Standard target material
    this.materials.set('target_standard', this.materialSystem.createMaterial({
      name: 'training_target_standard',
      type: 'pbr',
      diffuseTexture: 'training/targets/target_standard_diffuse.jpg',
      emissiveTexture: 'training/targets/target_standard_emissive.jpg',
      emissiveColor: new Color3(1, 0.2, 0.2),
      metallic: 0.1,
      roughness: 0.7
    }));
    
    // Moving target material
    this.materials.set('target_moving', this.materialSystem.createMaterial({
      name: 'training_target_moving',
      type: 'pbr',
      diffuseTexture: 'training/targets/target_moving_diffuse.jpg',
      emissiveTexture: 'training/targets/target_moving_emissive.jpg',
      emissiveColor: new Color3(0.2, 0.2, 1),
      metallic: 0.1,
      roughness: 0.7
    }));
    
    // Button material
    this.materials.set('button', this.materialSystem.createMaterial({
      name: 'training_button',
      type: 'pbr',
      diffuseColor: new Color3(0.2, 0.8, 0.2),
      emissiveColor: new Color3(0, 0.4, 0),
      metallic: 0.7,
      roughness: 0.3
    }));
  }
  
  /**
   * Get a material by name
   * @param name - The name of the material
   * @returns The material or undefined if not found
   */
  public getMaterial(name: string): Material | undefined {
    return this.materials.get(name);
  }
  
  /**
   * Dispose of all materials
   */
  public dispose(): void {
    for (const material of this.materials.values()) {
      material.dispose();
    }
    
    this.materials.clear();
  }
}
