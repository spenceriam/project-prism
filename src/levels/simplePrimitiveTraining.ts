import { Scene, Vector3, Color3, Color4, MeshBuilder, StandardMaterial, TransformNode, Mesh, HemisphericLight, DirectionalLight, CSG } from '@babylonjs/core';
import { Environment } from '../components/environment/environment';
import { AssetLoader } from '../utils/loader';

/**
 * SimplePrimitiveTrainingFacility environment
 * A minimal version of the Training Facility using simple primitive models
 * Allows development and testing without requiring external assets
 */
export class SimplePrimitiveTrainingFacility extends Environment {
  // Player spawn location
  private readonly SPAWN_POSITION = new Vector3(0, 1.8, -10);
  private readonly SPAWN_ROTATION = 0; // Facing forward (radians)
  
  private environmentMeshes: Map<string, Mesh> = new Map();

  /**
   * Create a new Simple Primitive Training Facility environment
   * @param scene - The Babylon.js scene
   * @param assetLoader - The asset loader instance
   */
  constructor(scene: Scene, assetLoader: AssetLoader) {
    super(scene, assetLoader, 'simple_primitive_training');
  }

  /**
   * Load the environment
   * @returns Promise that resolves when the environment is loaded
   */
  public async load(): Promise<void> {
    console.log('Loading Simple Primitive Training Facility...');
    
    try {
      // Set clear color for the scene (sky color)
      this.scene.clearColor = new Color4(0.4, 0.6, 0.9, 1.0);
      
      // Set up basic lighting
      this.setupLighting();
      
      // Set up skybox
      this.setupSkybox();
      
      // Create the environment structure
      this.createEnvironment();
      
      // Create props
      this.createProps();
      
      // Mark as loaded
      this.isLoaded = true;
      
      console.log('Simple Primitive Training Facility loaded successfully');
    } catch (error) {
      console.error('Failed to load Simple Primitive Training Facility:', error);
      throw error;
    }
  }

  /**
   * Get the player spawn position
   * @returns The player spawn position
   */
  public getSpawnPosition(): Vector3 {
    return this.SPAWN_POSITION;
  }

  /**
   * Get the player spawn rotation
   * @returns The player spawn rotation in radians
   */
  public getSpawnRotation(): number {
    return this.SPAWN_ROTATION;
  }

  /**
   * Set up the skybox for the environment
   */
  protected setupSkybox(): void {
    // Create a simple skybox with a solid color
    // In a real implementation, we would load cubemap textures
    this.scene.clearColor = new Color4(0.4, 0.6, 0.9, 1.0);
  }

  /**
   * Set up basic lighting for the environment
   */
  protected setupLighting(): void {
    // Add ambient light
    const ambientLight = new HemisphericLight('ambientLight', new Vector3(0, 1, 0), this.scene);
    ambientLight.intensity = 0.5;
    ambientLight.diffuse = new Color3(0.7, 0.7, 0.7);
    ambientLight.specular = new Color3(0.1, 0.1, 0.1);
    ambientLight.groundColor = new Color3(0.2, 0.2, 0.3);
    
    // Add directional light (simulating sunlight)
    const directionalLight = new DirectionalLight('directionalLight', new Vector3(0.5, -1, 0.5), this.scene);
    directionalLight.intensity = 0.7;
    directionalLight.diffuse = new Color3(1, 0.95, 0.8);
    directionalLight.specular = new Color3(0.2, 0.2, 0.2);
  }
  
  /**
   * Create the basic environment structure
   * Uses primitive models for walls, floor, and ceiling
   */
  private createEnvironment(): void {
    // Create floor
    const floorMaterial = new StandardMaterial('floorMaterial', this.scene);
    floorMaterial.diffuseColor = new Color3(0.3, 0.3, 0.3);
    floorMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    
    const floor = MeshBuilder.CreateGround('floor', { width: 40, height: 40, subdivisions: 1 }, this.scene);
    floor.material = floorMaterial;
    floor.checkCollisions = true;
    floor.parent = this.rootNode;
    this.environmentMeshes.set('floor', floor);
    
    // Create walls
    const wallMaterial = new StandardMaterial('wallMaterial', this.scene);
    wallMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5);
    wallMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    
    // Create four walls for a simple room
    const wall1 = MeshBuilder.CreateBox('wall1', { width: 40, height: 8, depth: 0.5 }, this.scene);
    wall1.position = new Vector3(0, 4, -20);
    wall1.material = wallMaterial;
    wall1.checkCollisions = true;
    wall1.parent = this.rootNode;
    this.environmentMeshes.set('wall1', wall1);
    
    const wall2 = MeshBuilder.CreateBox('wall2', { width: 40, height: 8, depth: 0.5 }, this.scene);
    wall2.position = new Vector3(0, 4, 20);
    wall2.material = wallMaterial;
    wall2.checkCollisions = true;
    wall2.parent = this.rootNode;
    this.environmentMeshes.set('wall2', wall2);
    
    const wall3 = MeshBuilder.CreateBox('wall3', { width: 0.5, height: 8, depth: 40 }, this.scene);
    wall3.position = new Vector3(-20, 4, 0);
    wall3.material = wallMaterial;
    wall3.checkCollisions = true;
    wall3.parent = this.rootNode;
    this.environmentMeshes.set('wall3', wall3);
    
    const wall4 = MeshBuilder.CreateBox('wall4', { width: 0.5, height: 8, depth: 40 }, this.scene);
    wall4.position = new Vector3(20, 4, 0);
    wall4.material = wallMaterial;
    wall4.checkCollisions = true;
    wall4.parent = this.rootNode;
    this.environmentMeshes.set('wall4', wall4);
    
    // Create ceiling
    const ceilingMaterial = new StandardMaterial('ceilingMaterial', this.scene);
    ceilingMaterial.diffuseColor = new Color3(0.2, 0.2, 0.2);
    ceilingMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    
    const ceiling = MeshBuilder.CreateBox('ceiling', { width: 40, height: 0.5, depth: 40 }, this.scene);
    ceiling.position = new Vector3(0, 8, 0);
    ceiling.material = ceilingMaterial;
    ceiling.parent = this.rootNode;
    this.environmentMeshes.set('ceiling', ceiling);
    
    // Create divider wall for shooting range
    const dividerWall = MeshBuilder.CreateBox('dividerWall', { width: 40, height: 8, depth: 0.5 }, this.scene);
    dividerWall.position = new Vector3(0, 4, 5);
    dividerWall.material = wallMaterial;
    dividerWall.checkCollisions = true;
    dividerWall.parent = this.rootNode;
    this.environmentMeshes.set('dividerWall', dividerWall);
    
    // Create openings in the divider wall
    const opening1 = MeshBuilder.CreateBox('opening1', { width: 5, height: 3, depth: 1 }, this.scene);
    opening1.position = new Vector3(-10, 3, 5);
    opening1.material = wallMaterial;
    opening1.parent = this.rootNode;
    opening1.isVisible = false;
    this.environmentMeshes.set('opening1', opening1);
    
    const opening2 = MeshBuilder.CreateBox('opening2', { width: 5, height: 3, depth: 1 }, this.scene);
    opening2.position = new Vector3(10, 3, 5);
    opening2.material = wallMaterial;
    opening2.parent = this.rootNode;
    opening2.isVisible = false;
    this.environmentMeshes.set('opening2', opening2);
    
    // Use CSG to create openings in the divider wall
    const dividerCSG = CSG.FromMesh(dividerWall);
    const opening1CSG = CSG.FromMesh(opening1);
    const opening2CSG = CSG.FromMesh(opening2);
    
    const result = dividerCSG.subtract(opening1CSG).subtract(opening2CSG);
    const dividerWithOpenings = result.toMesh('dividerWithOpenings', wallMaterial, this.scene, false);
    dividerWithOpenings.checkCollisions = true;
    dividerWithOpenings.parent = this.rootNode;
    
    // Remove the original meshes
    dividerWall.dispose();
    opening1.dispose();
    opening2.dispose();
    
    this.environmentMeshes.set('dividerWithOpenings', dividerWithOpenings);
  }
  
  /**
   * Create props for the environment
   */
  private createProps(): void {
    // Create targets in the shooting range
    const targetMaterial = new StandardMaterial('targetMaterial', this.scene);
    targetMaterial.diffuseColor = new Color3(0.9, 0.1, 0.1);
    targetMaterial.specularColor = new Color3(0.2, 0.2, 0.2);
    
    // Create targets
    for (let i = 0; i < 5; i++) {
      const target = MeshBuilder.CreateCylinder(`target_${i}`, { height: 0.1, diameter: 1, tessellation: 16 }, this.scene);
      target.rotation.x = Math.PI / 2;
      target.position = new Vector3(-8 + i * 4, 4, 15);
      target.material = targetMaterial;
      target.parent = this.rootNode;
      this.props.set(`target_${i}`, target);
    }
    
    // Create tables
    const tableMaterial = new StandardMaterial('tableMaterial', this.scene);
    tableMaterial.diffuseColor = new Color3(0.6, 0.4, 0.2);
    tableMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    
    // Create tables
    for (let i = 0; i < 3; i++) {
      // Table top
      const tableTop = MeshBuilder.CreateBox(`table_${i}_top`, { width: 2, height: 0.1, depth: 1 }, this.scene);
      tableTop.position = new Vector3(-10 + i * 10, 1, -15);
      tableTop.material = tableMaterial;
      tableTop.parent = this.rootNode;
      tableTop.checkCollisions = true;
      this.props.set(`table_${i}_top`, tableTop);
      
      // Table legs
      for (let j = 0; j < 4; j++) {
        const xOffset = (j % 2 === 0) ? 0.8 : -0.8;
        const zOffset = (j < 2) ? 0.4 : -0.4;
        
        const leg = MeshBuilder.CreateBox(`table_${i}_leg_${j}`, { width: 0.1, height: 1, depth: 0.1 }, this.scene);
        leg.position = new Vector3(-10 + i * 10 + xOffset, 0.5, -15 + zOffset);
        leg.material = tableMaterial;
        leg.parent = this.rootNode;
        leg.checkCollisions = true;
        this.props.set(`table_${i}_leg_${j}`, leg);
      }
    }
    
    // Create weapon racks
    const rackMaterial = new StandardMaterial('rackMaterial', this.scene);
    rackMaterial.diffuseColor = new Color3(0.2, 0.2, 0.2);
    rackMaterial.specularColor = new Color3(0.05, 0.05, 0.05);
    
    // Create weapon rack
    const rackBase = MeshBuilder.CreateBox('rackBase', { width: 3, height: 0.1, depth: 1 }, this.scene);
    rackBase.position = new Vector3(-15, 0.05, -10);
    rackBase.material = rackMaterial;
    rackBase.parent = this.rootNode;
    rackBase.checkCollisions = true;
    this.props.set('rackBase', rackBase);
    
    const rackBack = MeshBuilder.CreateBox('rackBack', { width: 3, height: 2, depth: 0.1 }, this.scene);
    rackBack.position = new Vector3(-15, 1, -10.5);
    rackBack.material = rackMaterial;
    rackBack.parent = this.rootNode;
    rackBack.checkCollisions = true;
    this.props.set('rackBack', rackBack);
    
    // Create simple weapon shapes on the rack
    const weaponMaterial = new StandardMaterial('weaponMaterial', this.scene);
    weaponMaterial.diffuseColor = new Color3(0.1, 0.1, 0.1);
    weaponMaterial.specularColor = new Color3(0.3, 0.3, 0.3);
    
    // Create pistol shape
    const pistolHandle = MeshBuilder.CreateBox('pistolHandle', { width: 0.1, height: 0.4, depth: 0.15 }, this.scene);
    pistolHandle.position = new Vector3(-16, 0.7, -10);
    pistolHandle.material = weaponMaterial;
    pistolHandle.parent = this.rootNode;
    this.props.set('pistolHandle', pistolHandle);
    
    const pistolBarrel = MeshBuilder.CreateBox('pistolBarrel', { width: 0.5, height: 0.15, depth: 0.15 }, this.scene);
    pistolBarrel.position = new Vector3(-15.7, 0.9, -10);
    pistolBarrel.material = weaponMaterial;
    pistolBarrel.parent = this.rootNode;
    this.props.set('pistolBarrel', pistolBarrel);
    
    // Create rifle shape
    const rifleStock = MeshBuilder.CreateBox('rifleStock', { width: 0.15, height: 0.3, depth: 0.15 }, this.scene);
    rifleStock.position = new Vector3(-14.5, 0.65, -10);
    rifleStock.material = weaponMaterial;
    rifleStock.parent = this.rootNode;
    this.props.set('rifleStock', rifleStock);
    
    const rifleBody = MeshBuilder.CreateBox('rifleBody', { width: 1, height: 0.15, depth: 0.15 }, this.scene);
    rifleBody.position = new Vector3(-14, 0.8, -10);
    rifleBody.material = weaponMaterial;
    rifleBody.parent = this.rootNode;
    this.props.set('rifleBody', rifleBody);
    
    // Create barriers for movement course
    const barrierMaterial = new StandardMaterial('barrierMaterial', this.scene);
    barrierMaterial.diffuseColor = new Color3(0.7, 0.7, 0);
    barrierMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    
    // Create barriers
    for (let i = 0; i < 6; i++) {
      const x = -10 + (i % 3) * 10;
      const z = -5 + Math.floor(i / 3) * 5;
      
      const barrier = MeshBuilder.CreateBox(`barrier_${i}`, { width: 2, height: 1.2, depth: 0.3 }, this.scene);
      barrier.position = new Vector3(x, 0.6, z);
      barrier.material = barrierMaterial;
      barrier.parent = this.rootNode;
      barrier.checkCollisions = true;
      this.props.set(`barrier_${i}`, barrier);
      
      // Add stripes to barriers
      const stripeMaterial = new StandardMaterial(`stripeMaterial_${i}`, this.scene);
      stripeMaterial.diffuseColor = new Color3(0.1, 0.1, 0.1);
      stripeMaterial.specularColor = new Color3(0.05, 0.05, 0.05);
      
      const stripe = MeshBuilder.CreateBox(`stripe_${i}`, { width: 2, height: 0.2, depth: 0.31 }, this.scene);
      stripe.position = new Vector3(x, 0.6, z);
      stripe.material = stripeMaterial;
      stripe.parent = this.rootNode;
      this.props.set(`stripe_${i}`, stripe);
    }
  }

  /**
   * Clean up the environment
   */
  public dispose(): void {
    // Dispose of all environment meshes
    for (const mesh of this.environmentMeshes.values()) {
      mesh.dispose();
    }
    
    // Dispose of all props
    for (const prop of this.props.values()) {
      prop.dispose();
    }
    
    // Clear maps
    this.environmentMeshes.clear();
    this.props.clear();
    
    // Dispose of root node
    this.rootNode.dispose();
  }
}
