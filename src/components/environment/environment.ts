import { Scene, Vector3, Color3, Material, Mesh, TransformNode } from '@babylonjs/core';
import { AssetLoader } from '../../utils/loader';

/**
 * Base Environment class for all game environments
 * Handles common environment functionality like lighting, skybox, and props
 */
export abstract class Environment {
  protected scene: Scene;
  protected assetLoader: AssetLoader;
  protected rootNode: TransformNode;
  protected props: Map<string, Mesh> = new Map();
  protected isLoaded: boolean = false;

  /**
   * Create a new environment
   * @param scene - The Babylon.js scene
   * @param assetLoader - The asset loader instance
   * @param name - Name of the environment
   */
  constructor(scene: Scene, assetLoader: AssetLoader, name: string) {
    this.scene = scene;
    this.assetLoader = assetLoader;
    this.rootNode = new TransformNode(name, this.scene);
  }

  /**
   * Load the environment assets and set up the scene
   * @returns Promise that resolves when the environment is loaded
   */
  public abstract load(): Promise<void>;

  /**
   * Get the spawn position for the player in this environment
   * @returns The spawn position vector
   */
  public abstract getSpawnPosition(): Vector3;

  /**
   * Get the spawn rotation for the player in this environment (in radians)
   * @returns The spawn rotation in radians
   */
  public abstract getSpawnRotation(): number;

  /**
   * Set up the lighting for this environment
   */
  protected abstract setupLighting(): void;

  /**
   * Set up the skybox for this environment
   */
  protected abstract setupSkybox(): void;

  /**
   * Check if the environment is fully loaded
   * @returns True if the environment is loaded
   */
  public isEnvironmentLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Get the root node of the environment
   * @returns The environment's root transform node
   */
  public getRootNode(): TransformNode {
    return this.rootNode;
  }

  /**
   * Get a prop by name
   * @param name - The name of the prop
   * @returns The prop mesh or undefined if not found
   */
  public getProp(name: string): Mesh | undefined {
    return this.props.get(name);
  }

  /**
   * Dispose of the environment and all its resources
   */
  public dispose(): void {
    this.rootNode.dispose(false, true);
    this.props.clear();
    this.isLoaded = false;
  }
}
