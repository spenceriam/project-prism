import { Scene, MeshBuilder, Vector3, Color3, StandardMaterial, Mesh, TransformNode } from '@babylonjs/core';

/**
 * SimplePrimitiveGenerator
 * Creates simple geometric primitives as placeholders for actual game assets
 * Follows GoldenEye 64 low-poly aesthetic
 */
export class SimplePrimitiveGenerator {
  private scene: Scene;
  private generatedModels: Map<string, TransformNode> = new Map();

  /**
   * Creates a new SimplePrimitiveGenerator
   * @param scene - The Babylon.js scene
   */
  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Generate all primitive models for the Training Facility
   * Creates simple geometric shapes as placeholders for actual models
   * @returns Map of model names to their root nodes
   */
  public generateAllPrimitives(): Map<string, TransformNode> {
    // Environment models
    this.generateWalls();
    this.generateFloor();
    this.generateCeiling();
    
    // Props
    this.generateTable();
    this.generateRack();
    this.generateBarrier();
    this.generateChair();
    this.generateLocker();
    this.generateComputer();
    
    // Targets
    this.generateStandardTarget();
    this.generateMovingTarget();
    
    // Weapons
    this.generatePistolRack();
    this.generateRifleRack();
    
    return this.generatedModels;
  }

  /**
   * Export all generated models to glTF files
   * This would typically be done in a build process, not at runtime
   */
  public exportModels(): void {
    console.log('In a real implementation, this would export models to glTF files');
    // In a real implementation, we would use SceneSerializer or glTF exporter
    // to save these models to disk
  }

  /**
   * Create a simple material with the given color
   * @param name - Material name
   * @param color - Material color
   * @returns The created material
   */
  private createSimpleMaterial(name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.specularColor = new Color3(0.2, 0.2, 0.2);
    return material;
  }

  /**
   * Create a parent node for a model and register it
   * @param name - Model name
   * @returns The created node
   */
  private createModelNode(name: string): TransformNode {
    const node = new TransformNode(name, this.scene);
    this.generatedModels.set(name, node);
    return node;
  }

  /**
   * Generate simple wall primitives
   * @returns The root node containing the walls
   */
  public generateWalls(): TransformNode {
    const wallsNode = this.createModelNode('training/environment/walls');
    
    // Create a simple box for the wall
    const wallMaterial = this.createSimpleMaterial('wallMaterial', new Color3(0.5, 0.5, 0.5));
    
    // Create four walls for a simple room
    const wall1 = MeshBuilder.CreateBox('wall1', { width: 20, height: 4, depth: 0.2 }, this.scene);
    wall1.position = new Vector3(0, 2, -10);
    wall1.material = wallMaterial;
    wall1.parent = wallsNode;
    
    const wall2 = MeshBuilder.CreateBox('wall2', { width: 20, height: 4, depth: 0.2 }, this.scene);
    wall2.position = new Vector3(0, 2, 10);
    wall2.material = wallMaterial;
    wall2.parent = wallsNode;
    
    const wall3 = MeshBuilder.CreateBox('wall3', { width: 0.2, height: 4, depth: 20 }, this.scene);
    wall3.position = new Vector3(-10, 2, 0);
    wall3.material = wallMaterial;
    wall3.parent = wallsNode;
    
    const wall4 = MeshBuilder.CreateBox('wall4', { width: 0.2, height: 4, depth: 20 }, this.scene);
    wall4.position = new Vector3(10, 2, 0);
    wall4.material = wallMaterial;
    wall4.parent = wallsNode;
    
    // Add some divider walls for different areas
    const divider1 = MeshBuilder.CreateBox('divider1', { width: 10, height: 4, depth: 0.2 }, this.scene);
    divider1.position = new Vector3(-5, 2, 0);
    divider1.material = wallMaterial;
    divider1.parent = wallsNode;
    
    return wallsNode;
  }

  /**
   * Generate simple floor primitive
   * @returns The root node containing the floor
   */
  public generateFloor(): TransformNode {
    const floorNode = this.createModelNode('training/environment/floor');
    
    // Create a simple plane for the floor
    const floorMaterial = this.createSimpleMaterial('floorMaterial', new Color3(0.3, 0.3, 0.3));
    
    const floor = MeshBuilder.CreateGround('floor', { width: 20, height: 20, subdivisions: 1 }, this.scene);
    floor.material = floorMaterial;
    floor.parent = floorNode;
    
    return floorNode;
  }

  /**
   * Generate simple ceiling primitive
   * @returns The root node containing the ceiling
   */
  public generateCeiling(): TransformNode {
    const ceilingNode = this.createModelNode('training/environment/ceiling');
    
    // Create a simple plane for the ceiling
    const ceilingMaterial = this.createSimpleMaterial('ceilingMaterial', new Color3(0.2, 0.2, 0.2));
    
    const ceiling = MeshBuilder.CreatePlane('ceiling', { width: 20, height: 20 }, this.scene);
    ceiling.position = new Vector3(0, 4, 0);
    ceiling.rotation = new Vector3(Math.PI / 2, 0, 0);
    ceiling.material = ceilingMaterial;
    ceiling.parent = ceilingNode;
    
    return ceilingNode;
  }

  /**
   * Generate simple table primitive
   * @returns The root node containing the table
   */
  public generateTable(): TransformNode {
    const tableNode = this.createModelNode('training/props/table');
    
    // Create a simple table with a top and four legs
    const tableMaterial = this.createSimpleMaterial('tableMaterial', new Color3(0.6, 0.4, 0.2));
    
    // Table top
    const tableTop = MeshBuilder.CreateBox('tableTop', { width: 2, height: 0.1, depth: 1 }, this.scene);
    tableTop.position = new Vector3(0, 0.8, 0);
    tableTop.material = tableMaterial;
    tableTop.parent = tableNode;
    
    // Table legs
    const createLeg = (name: string, x: number, z: number) => {
      const leg = MeshBuilder.CreateBox(name, { width: 0.1, height: 0.8, depth: 0.1 }, this.scene);
      leg.position = new Vector3(x, 0.4, z);
      leg.material = tableMaterial;
      leg.parent = tableNode;
    };
    
    createLeg('leg1', 0.9, 0.4);
    createLeg('leg2', 0.9, -0.4);
    createLeg('leg3', -0.9, 0.4);
    createLeg('leg4', -0.9, -0.4);
    
    return tableNode;
  }

  /**
   * Generate simple weapon rack primitive
   * @returns The root node containing the rack
   */
  public generateRack(): TransformNode {
    const rackNode = this.createModelNode('training/props/rack');
    
    // Create a simple rack with a frame and shelves
    const rackMaterial = this.createSimpleMaterial('rackMaterial', new Color3(0.1, 0.1, 0.1));
    
    // Rack frame
    const frame = MeshBuilder.CreateBox('frame', { width: 1.5, height: 2, depth: 0.1 }, this.scene);
    frame.position = new Vector3(0, 1, 0);
    frame.material = rackMaterial;
    frame.parent = rackNode;
    
    // Rack shelves
    const shelf1 = MeshBuilder.CreateBox('shelf1', { width: 1.3, height: 0.05, depth: 0.5 }, this.scene);
    shelf1.position = new Vector3(0, 0.5, 0.2);
    shelf1.material = rackMaterial;
    shelf1.parent = rackNode;
    
    const shelf2 = MeshBuilder.CreateBox('shelf2', { width: 1.3, height: 0.05, depth: 0.5 }, this.scene);
    shelf2.position = new Vector3(0, 1.0, 0.2);
    shelf2.material = rackMaterial;
    shelf2.parent = rackNode;
    
    const shelf3 = MeshBuilder.CreateBox('shelf3', { width: 1.3, height: 0.05, depth: 0.5 }, this.scene);
    shelf3.position = new Vector3(0, 1.5, 0.2);
    shelf3.material = rackMaterial;
    shelf3.parent = rackNode;
    
    return rackNode;
  }

  /**
   * Generate simple barrier primitive
   * @returns The root node containing the barrier
   */
  public generateBarrier(): TransformNode {
    const barrierNode = this.createModelNode('training/props/barrier');
    
    // Create a simple barrier
    const barrierMaterial = this.createSimpleMaterial('barrierMaterial', new Color3(0.7, 0.7, 0));
    
    const barrier = MeshBuilder.CreateBox('barrier', { width: 1.5, height: 1, depth: 0.2 }, this.scene);
    barrier.position = new Vector3(0, 0.5, 0);
    barrier.material = barrierMaterial;
    barrier.parent = barrierNode;
    
    // Add some stripes
    const stripeMaterial = this.createSimpleMaterial('stripeMaterial', new Color3(0.1, 0.1, 0.1));
    
    const stripe1 = MeshBuilder.CreateBox('stripe1', { width: 1.5, height: 0.1, depth: 0.21 }, this.scene);
    stripe1.position = new Vector3(0, 0.3, 0);
    stripe1.material = stripeMaterial;
    stripe1.parent = barrierNode;
    
    const stripe2 = MeshBuilder.CreateBox('stripe2', { width: 1.5, height: 0.1, depth: 0.21 }, this.scene);
    stripe2.position = new Vector3(0, 0.7, 0);
    stripe2.material = stripeMaterial;
    stripe2.parent = barrierNode;
    
    return barrierNode;
  }

  /**
   * Generate simple chair primitive
   * @returns The root node containing the chair
   */
  public generateChair(): TransformNode {
    const chairNode = this.createModelNode('training/props/chair');
    
    // Create a simple chair
    const chairMaterial = this.createSimpleMaterial('chairMaterial', new Color3(0.4, 0.4, 0.4));
    
    // Chair seat
    const seat = MeshBuilder.CreateBox('seat', { width: 0.5, height: 0.1, depth: 0.5 }, this.scene);
    seat.position = new Vector3(0, 0.5, 0);
    seat.material = chairMaterial;
    seat.parent = chairNode;
    
    // Chair back
    const back = MeshBuilder.CreateBox('back', { width: 0.5, height: 0.6, depth: 0.1 }, this.scene);
    back.position = new Vector3(0, 0.8, -0.2);
    back.material = chairMaterial;
    back.parent = chairNode;
    
    // Chair legs
    const legMaterial = this.createSimpleMaterial('legMaterial', new Color3(0.2, 0.2, 0.2));
    
    const createLeg = (name: string, x: number, z: number) => {
      const leg = MeshBuilder.CreateBox(name, { width: 0.05, height: 0.5, depth: 0.05 }, this.scene);
      leg.position = new Vector3(x, 0.25, z);
      leg.material = legMaterial;
      leg.parent = chairNode;
    };
    
    createLeg('leg1', 0.2, 0.2);
    createLeg('leg2', 0.2, -0.2);
    createLeg('leg3', -0.2, 0.2);
    createLeg('leg4', -0.2, -0.2);
    
    return chairNode;
  }

  /**
   * Generate simple locker primitive
   * @returns The root node containing the locker
   */
  public generateLocker(): TransformNode {
    const lockerNode = this.createModelNode('training/props/locker');
    
    // Create a simple locker
    const lockerMaterial = this.createSimpleMaterial('lockerMaterial', new Color3(0.2, 0.3, 0.4));
    
    // Locker body
    const body = MeshBuilder.CreateBox('body', { width: 0.8, height: 2, depth: 0.6 }, this.scene);
    body.position = new Vector3(0, 1, 0);
    body.material = lockerMaterial;
    body.parent = lockerNode;
    
    // Locker door
    const doorMaterial = this.createSimpleMaterial('doorMaterial', new Color3(0.25, 0.35, 0.45));
    
    const door = MeshBuilder.CreateBox('door', { width: 0.79, height: 1.9, depth: 0.05 }, this.scene);
    door.position = new Vector3(0, 1, 0.325);
    door.material = doorMaterial;
    door.parent = lockerNode;
    
    // Locker handle
    const handleMaterial = this.createSimpleMaterial('handleMaterial', new Color3(0.8, 0.8, 0.8));
    
    const handle = MeshBuilder.CreateBox('handle', { width: 0.05, height: 0.1, depth: 0.05 }, this.scene);
    handle.position = new Vector3(0.3, 1, 0.35);
    handle.material = handleMaterial;
    handle.parent = lockerNode;
    
    return lockerNode;
  }

  /**
   * Generate simple computer primitive
   * @returns The root node containing the computer
   */
  public generateComputer(): TransformNode {
    const computerNode = this.createModelNode('training/props/computer');
    
    // Create a simple computer with monitor and keyboard
    const monitorMaterial = this.createSimpleMaterial('monitorMaterial', new Color3(0.1, 0.1, 0.1));
    
    // Monitor
    const monitor = MeshBuilder.CreateBox('monitor', { width: 0.6, height: 0.4, depth: 0.05 }, this.scene);
    monitor.position = new Vector3(0, 0.4, 0);
    monitor.material = monitorMaterial;
    monitor.parent = computerNode;
    
    // Monitor stand
    const stand = MeshBuilder.CreateBox('stand', { width: 0.1, height: 0.2, depth: 0.1 }, this.scene);
    stand.position = new Vector3(0, 0.1, 0);
    stand.material = monitorMaterial;
    stand.parent = computerNode;
    
    // Monitor base
    const base = MeshBuilder.CreateBox('base', { width: 0.2, height: 0.02, depth: 0.2 }, this.scene);
    base.position = new Vector3(0, 0.01, 0);
    base.material = monitorMaterial;
    base.parent = computerNode;
    
    // Keyboard
    const keyboardMaterial = this.createSimpleMaterial('keyboardMaterial', new Color3(0.2, 0.2, 0.2));
    
    const keyboard = MeshBuilder.CreateBox('keyboard', { width: 0.4, height: 0.02, depth: 0.15 }, this.scene);
    keyboard.position = new Vector3(0, 0.01, 0.2);
    keyboard.material = keyboardMaterial;
    keyboard.parent = computerNode;
    
    // Screen (emissive)
    const screenMaterial = new StandardMaterial('screenMaterial', this.scene);
    screenMaterial.diffuseColor = new Color3(0.1, 0.3, 0.6);
    screenMaterial.emissiveColor = new Color3(0.1, 0.3, 0.6);
    
    const screen = MeshBuilder.CreateBox('screen', { width: 0.55, height: 0.35, depth: 0.01 }, this.scene);
    screen.position = new Vector3(0, 0.4, 0.03);
    screen.material = screenMaterial;
    screen.parent = computerNode;
    
    return computerNode;
  }

  /**
   * Generate simple standard target primitive
   * @returns The root node containing the standard target
   */
  public generateStandardTarget(): TransformNode {
    const targetNode = this.createModelNode('training/targets/standard');
    
    // Create a simple target with concentric circles
    const targetBaseMaterial = this.createSimpleMaterial('targetBaseMaterial', new Color3(0.8, 0.8, 0.8));
    
    // Target base
    const targetBase = MeshBuilder.CreateDisc('targetBase', { radius: 0.5, tessellation: 16 }, this.scene);
    targetBase.rotation = new Vector3(0, 0, 0);
    targetBase.material = targetBaseMaterial;
    targetBase.parent = targetNode;
    
    // Target rings
    const ring1Material = this.createSimpleMaterial('ring1Material', new Color3(0, 0, 0));
    const ring1 = MeshBuilder.CreateTorus('ring1', { diameter: 0.8, thickness: 0.05, tessellation: 16 }, this.scene);
    ring1.position = new Vector3(0, 0, 0.01);
    ring1.material = ring1Material;
    ring1.parent = targetNode;
    
    const ring2Material = this.createSimpleMaterial('ring2Material', new Color3(0, 0, 1));
    const ring2 = MeshBuilder.CreateTorus('ring2', { diameter: 0.6, thickness: 0.05, tessellation: 16 }, this.scene);
    ring2.position = new Vector3(0, 0, 0.01);
    ring2.material = ring2Material;
    ring2.parent = targetNode;
    
    const ring3Material = this.createSimpleMaterial('ring3Material', new Color3(1, 0, 0));
    const ring3 = MeshBuilder.CreateTorus('ring3', { diameter: 0.4, thickness: 0.05, tessellation: 16 }, this.scene);
    ring3.position = new Vector3(0, 0, 0.01);
    ring3.material = ring3Material;
    ring3.parent = targetNode;
    
    const bullseyeMaterial = this.createSimpleMaterial('bullseyeMaterial', new Color3(1, 1, 0));
    const bullseye = MeshBuilder.CreateDisc('bullseye', { radius: 0.1, tessellation: 16 }, this.scene);
    bullseye.position = new Vector3(0, 0, 0.02);
    bullseye.material = bullseyeMaterial;
    bullseye.parent = targetNode;
    
    // Target stand
    const standMaterial = this.createSimpleMaterial('standMaterial', new Color3(0.4, 0.4, 0.4));
    
    const stand = MeshBuilder.CreateBox('stand', { width: 0.1, height: 1.5, depth: 0.1 }, this.scene);
    stand.position = new Vector3(0, -0.75, -0.1);
    stand.material = standMaterial;
    stand.parent = targetNode;
    
    return targetNode;
  }

  /**
   * Generate simple moving target primitive
   * @returns The root node containing the moving target
   */
  public generateMovingTarget(): TransformNode {
    const targetNode = this.createModelNode('training/targets/moving');
    
    // Create a simple moving target (similar to standard but on a rail)
    const targetBaseMaterial = this.createSimpleMaterial('movingTargetMaterial', new Color3(0.7, 0.7, 0.7));
    
    // Target base (different shape for moving targets)
    const targetBase = MeshBuilder.CreateBox('targetBase', { width: 0.8, height: 0.8, depth: 0.05 }, this.scene);
    targetBase.material = targetBaseMaterial;
    targetBase.parent = targetNode;
    
    // Target markings
    const markingsMaterial = this.createSimpleMaterial('markingsMaterial', new Color3(0.1, 0.1, 0.1));
    
    const horizontalLine = MeshBuilder.CreateBox('horizontalLine', { width: 0.7, height: 0.05, depth: 0.06 }, this.scene);
    horizontalLine.position = new Vector3(0, 0, 0);
    horizontalLine.material = markingsMaterial;
    horizontalLine.parent = targetNode;
    
    const verticalLine = MeshBuilder.CreateBox('verticalLine', { width: 0.05, height: 0.7, depth: 0.06 }, this.scene);
    verticalLine.position = new Vector3(0, 0, 0);
    verticalLine.material = markingsMaterial;
    verticalLine.parent = targetNode;
    
    // Target rail
    const railMaterial = this.createSimpleMaterial('railMaterial', new Color3(0.3, 0.3, 0.3));
    
    const rail = MeshBuilder.CreateBox('rail', { width: 3, height: 0.1, depth: 0.1 }, this.scene);
    rail.position = new Vector3(0, 0.5, -0.1);
    rail.material = railMaterial;
    rail.parent = targetNode;
    
    // Target mount
    const mountMaterial = this.createSimpleMaterial('mountMaterial', new Color3(0.4, 0.4, 0.4));
    
    const mount = MeshBuilder.CreateBox('mount', { width: 0.2, height: 0.3, depth: 0.1 }, this.scene);
    mount.position = new Vector3(0, 0.3, -0.1);
    mount.material = mountMaterial;
    mount.parent = targetNode;
    
    return targetNode;
  }

  /**
   * Generate simple pistol rack primitive
   * @returns The root node containing the pistol rack
   */
  public generatePistolRack(): TransformNode {
    const rackNode = this.createModelNode('training/weapons/pistol_rack');
    
    // Create a simple pistol rack
    const rackMaterial = this.createSimpleMaterial('pistolRackMaterial', new Color3(0.3, 0.2, 0.1));
    
    // Rack base
    const base = MeshBuilder.CreateBox('base', { width: 1, height: 0.05, depth: 0.5 }, this.scene);
    base.position = new Vector3(0, 0, 0);
    base.material = rackMaterial;
    base.parent = rackNode;
    
    // Rack back
    const back = MeshBuilder.CreateBox('back', { width: 1, height: 0.5, depth: 0.05 }, this.scene);
    back.position = new Vector3(0, 0.25, -0.225);
    back.material = rackMaterial;
    back.parent = rackNode;
    
    // Pistol placeholders
    const pistolMaterial = this.createSimpleMaterial('pistolMaterial', new Color3(0.1, 0.1, 0.1));
    
    const createPistol = (name: string, x: number) => {
      // Simple L-shaped pistol
      const handle = MeshBuilder.CreateBox(`${name}_handle`, { width: 0.05, height: 0.15, depth: 0.05 }, this.scene);
      handle.position = new Vector3(x, 0.075, 0);
      handle.material = pistolMaterial;
      handle.parent = rackNode;
      
      const barrel = MeshBuilder.CreateBox(`${name}_barrel`, { width: 0.15, height: 0.05, depth: 0.05 }, this.scene);
      barrel.position = new Vector3(x + 0.05, 0.15, 0);
      barrel.material = pistolMaterial;
      barrel.parent = rackNode;
    };
    
    createPistol('pistol1', -0.3);
    createPistol('pistol2', 0);
    createPistol('pistol3', 0.3);
    
    return rackNode;
  }

  /**
   * Generate simple rifle rack primitive
   * @returns The root node containing the rifle rack
   */
  public generateRifleRack(): TransformNode {
    const rackNode = this.createModelNode('training/weapons/rifle_rack');
    
    // Create a simple rifle rack
    const rackMaterial = this.createSimpleMaterial('rifleRackMaterial', new Color3(0.3, 0.2, 0.1));
    
    // Rack base
    const base = MeshBuilder.CreateBox('base', { width: 1.5, height: 0.05, depth: 0.5 }, this.scene);
    base.position = new Vector3(0, 0, 0);
    base.material = rackMaterial;
    base.parent = rackNode;
    
    // Rack back
    const back = MeshBuilder.CreateBox('back', { width: 1.5, height: 1, depth: 0.05 }, this.scene);
    back.position = new Vector3(0, 0.5, -0.225);
    back.material = rackMaterial;
    back.parent = rackNode;
    
    // Rifle placeholders
    const rifleMaterial = this.createSimpleMaterial('rifleMaterial', new Color3(0.1, 0.1, 0.1));
    
    const createRifle = (name: string, x: number) => {
      // Simple rifle shape
      const stock = MeshBuilder.CreateBox(`${name}_stock`, { width: 0.05, height: 0.15, depth: 0.05 }, this.scene);
      stock.position = new Vector3(x, 0.075, 0);
      stock.rotation = new Vector3(0, 0, Math.PI / 8);
      stock.material = rifleMaterial;
      stock.parent = rackNode;
      
      const body = MeshBuilder.CreateBox(`${name}_body`, { width: 0.4, height: 0.05, depth: 0.05 }, this.scene);
      body.position = new Vector3(x + 0.2, 0.15, 0);
      body.material = rifleMaterial;
      body.parent = rackNode;
      
      const barrel = MeshBuilder.CreateBox(`${name}_barrel`, { width: 0.3, height: 0.03, depth: 0.03 }, this.scene);
      barrel.position = new Vector3(x + 0.55, 0.15, 0);
      barrel.material = rifleMaterial;
      barrel.parent = rackNode;
    };
    
    createRifle('rifle1', -0.5);
    createRifle('rifle2', 0.1);
    
    return rackNode;
  }
}
