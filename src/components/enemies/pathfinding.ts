import { Vector3, Scene, Mesh, MeshBuilder, Color3, StandardMaterial } from '@babylonjs/core';

/**
 * Represents a node in the navigation grid
 */
export interface NavNode {
  position: Vector3;
  connections: NavNode[];
  cost: number; // Cost to reach this node from the start
  heuristic: number; // Estimated cost to reach the goal
  totalCost: number; // cost + heuristic
  parent: NavNode | null;
}

/**
 * Simple grid-based pathfinding system for enemy navigation
 */
export class PathfindingSystem {
  private scene: Scene;
  private navNodes: NavNode[] = [];
  private debugMode: boolean = false;
  private debugMeshes: Mesh[] = [];
  
  /**
   * Creates a new PathfindingSystem
   * @param scene - The Babylon.js scene
   * @param debugMode - Whether to show debug visualization
   */
  constructor(scene: Scene, debugMode: boolean = false) {
    this.scene = scene;
    this.debugMode = debugMode;
  }
  
  /**
   * Adds a navigation node to the system
   * @param position - Position of the node
   * @returns The created navigation node
   */
  public addNode(position: Vector3): NavNode {
    const node: NavNode = {
      position: position.clone(),
      connections: [],
      cost: 0,
      heuristic: 0,
      totalCost: 0,
      parent: null
    };
    
    this.navNodes.push(node);
    
    // Create debug visualization if enabled
    if (this.debugMode) {
      this.createDebugMesh(node);
    }
    
    return node;
  }
  
  /**
   * Connects two navigation nodes
   * @param nodeA - First node
   * @param nodeB - Second node
   * @param bidirectional - Whether the connection is bidirectional
   */
  public connectNodes(nodeA: NavNode, nodeB: NavNode, bidirectional: boolean = true): void {
    if (!nodeA.connections.includes(nodeB)) {
      nodeA.connections.push(nodeB);
    }
    
    if (bidirectional && !nodeB.connections.includes(nodeA)) {
      nodeB.connections.push(nodeA);
    }
    
    // Update debug visualization if enabled
    if (this.debugMode) {
      this.createDebugConnection(nodeA, nodeB);
      
      if (bidirectional) {
        this.createDebugConnection(nodeB, nodeA);
      }
    }
  }
  
  /**
   * Finds the nearest navigation node to a position
   * @param position - Position to find the nearest node to
   * @returns The nearest navigation node
   */
  public findNearestNode(position: Vector3): NavNode | null {
    if (this.navNodes.length === 0) {
      return null;
    }
    
    let nearestNode = this.navNodes[0];
    let nearestDistance = Vector3.Distance(position, nearestNode.position);
    
    for (let i = 1; i < this.navNodes.length; i++) {
      const node = this.navNodes[i];
      const distance = Vector3.Distance(position, node.position);
      
      if (distance < nearestDistance) {
        nearestNode = node;
        nearestDistance = distance;
      }
    }
    
    return nearestNode;
  }
  
  /**
   * Finds a path between two positions
   * @param startPosition - Start position
   * @param endPosition - End position
   * @returns Array of positions forming the path, or empty array if no path found
   */
  public findPath(startPosition: Vector3, endPosition: Vector3): Vector3[] {
    // Find nearest nodes to start and end positions
    const startNode = this.findNearestNode(startPosition);
    const endNode = this.findNearestNode(endPosition);
    
    if (!startNode || !endNode) {
      return [];
    }
    
    // Reset all nodes
    this.navNodes.forEach(node => {
      node.cost = Infinity;
      node.heuristic = 0;
      node.totalCost = Infinity;
      node.parent = null;
    });
    
    // Initialize start node
    startNode.cost = 0;
    startNode.heuristic = this.calculateHeuristic(startNode, endNode);
    startNode.totalCost = startNode.heuristic;
    
    // A* algorithm
    const openSet: NavNode[] = [startNode];
    const closedSet: NavNode[] = [];
    
    while (openSet.length > 0) {
      // Find node with lowest total cost
      let currentNode = openSet[0];
      let currentIndex = 0;
      
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].totalCost < currentNode.totalCost) {
          currentNode = openSet[i];
          currentIndex = i;
        }
      }
      
      // Remove current node from open set and add to closed set
      openSet.splice(currentIndex, 1);
      closedSet.push(currentNode);
      
      // Check if we've reached the end node
      if (currentNode === endNode) {
        // Reconstruct path
        const path: Vector3[] = [];
        let current: NavNode | null = currentNode;
        
        while (current) {
          path.unshift(current.position.clone());
          current = current.parent;
        }
        
        return path;
      }
      
      // Process neighbors
      for (const neighbor of currentNode.connections) {
        // Skip if neighbor is in closed set
        if (closedSet.includes(neighbor)) {
          continue;
        }
        
        // Calculate tentative cost
        const tentativeCost = currentNode.cost + Vector3.Distance(currentNode.position, neighbor.position);
        
        // Check if this path is better than any previous one
        if (tentativeCost < neighbor.cost) {
          neighbor.parent = currentNode;
          neighbor.cost = tentativeCost;
          neighbor.heuristic = this.calculateHeuristic(neighbor, endNode);
          neighbor.totalCost = neighbor.cost + neighbor.heuristic;
          
          // Add to open set if not already there
          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor);
          }
        }
      }
    }
    
    // No path found
    return [];
  }
  
  /**
   * Calculates the heuristic (estimated cost) between two nodes
   * @param a - First node
   * @param b - Second node
   * @returns The heuristic value
   */
  private calculateHeuristic(a: NavNode, b: NavNode): number {
    // Using Euclidean distance as heuristic
    return Vector3.Distance(a.position, b.position);
  }
  
  /**
   * Creates a debug mesh for a navigation node
   * @param node - The navigation node
   */
  private createDebugMesh(node: NavNode): void {
    if (!this.debugMode) return;
    
    // Create a small sphere to represent the node
    const sphere = MeshBuilder.CreateSphere(`navNode_${this.navNodes.length}`, {
      diameter: 0.3
    }, this.scene);
    
    sphere.position = node.position.clone();
    
    // Create material
    const material = new StandardMaterial(`navNodeMat_${this.navNodes.length}`, this.scene);
    material.diffuseColor = new Color3(0, 1, 0);
    material.emissiveColor = new Color3(0, 0.5, 0);
    sphere.material = material;
    
    this.debugMeshes.push(sphere);
  }
  
  /**
   * Creates a debug visualization for a connection between nodes
   * @param nodeA - First node
   * @param nodeB - Second node
   */
  private createDebugConnection(nodeA: NavNode, nodeB: NavNode): void {
    if (!this.debugMode) return;
    
    // Create a line between the nodes
    const line = MeshBuilder.CreateLines(`navConnection_${this.debugMeshes.length}`, {
      points: [nodeA.position, nodeB.position],
      updatable: false
    }, this.scene);
    
    // Set color
    line.color = new Color3(0.5, 0.5, 0.5);
    
    this.debugMeshes.push(line);
  }
  
  /**
   * Clears all navigation nodes
   */
  public clear(): void {
    this.navNodes = [];
    
    // Clean up debug meshes
    this.clearDebugMeshes();
  }
  
  /**
   * Clears all debug visualization meshes
   */
  private clearDebugMeshes(): void {
    this.debugMeshes.forEach(mesh => {
      mesh.dispose();
    });
    
    this.debugMeshes = [];
  }
  
  /**
   * Sets debug mode on or off
   * @param enabled - Whether debug visualization should be enabled
   */
  public setDebugMode(enabled: boolean): void {
    if (this.debugMode === enabled) return;
    
    this.debugMode = enabled;
    
    if (enabled) {
      // Create debug visualization for existing nodes
      this.navNodes.forEach(node => {
        this.createDebugMesh(node);
        
        node.connections.forEach(connection => {
          this.createDebugConnection(node, connection);
        });
      });
    } else {
      // Clear debug meshes
      this.clearDebugMeshes();
    }
  }
  
  /**
   * Disposes of the pathfinding system and its resources
   */
  public dispose(): void {
    this.clearDebugMeshes();
    this.navNodes = [];
  }
}
