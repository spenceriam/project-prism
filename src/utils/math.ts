import { Vector3, Quaternion, Matrix, Scalar, Axis } from '@babylonjs/core';

/**
 * Math utilities for Project Prism Protocol
 * Provides helper functions for common mathematical operations
 */
export class MathUtils {
  /**
   * Linearly interpolates between two values
   * @param start - Starting value
   * @param end - Ending value
   * @param t - Interpolation factor (0-1)
   * @returns Interpolated value
   */
  public static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * Scalar.Clamp(t, 0, 1);
  }

  /**
   * Linearly interpolates between two Vector3s
   * @param start - Starting vector
   * @param end - Ending vector
   * @param t - Interpolation factor (0-1)
   * @returns Interpolated vector
   */
  public static lerpVector3(start: Vector3, end: Vector3, t: number): Vector3 {
    const clampedT = Scalar.Clamp(t, 0, 1);
    return new Vector3(
      start.x + (end.x - start.x) * clampedT,
      start.y + (end.y - start.y) * clampedT,
      start.z + (end.z - start.z) * clampedT
    );
  }

  /**
   * Converts degrees to radians
   * @param degrees - Angle in degrees
   * @returns Angle in radians
   */
  public static toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  /**
   * Converts radians to degrees
   * @param radians - Angle in radians
   * @returns Angle in degrees
   */
  public static toDegrees(radians: number): number {
    return radians * 180 / Math.PI;
  }

  /**
   * Returns a random integer between min and max (inclusive)
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Random integer
   */
  public static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Returns a random float between min and max
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Random float
   */
  public static randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * Returns a random item from an array
   * @param array - Array to select from
   * @returns Random item from the array
   */
  public static randomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Creates a random point within a sphere
   * @param center - Center of the sphere
   * @param radius - Radius of the sphere
   * @returns Random point within the sphere
   */
  public static randomPointInSphere(center: Vector3, radius: number): Vector3 {
    // Use rejection sampling to get uniform distribution
    let x, y, z, mag;
    do {
      x = this.randomFloat(-1, 1);
      y = this.randomFloat(-1, 1);
      z = this.randomFloat(-1, 1);
      mag = x*x + y*y + z*z;
    } while (mag > 1 || mag === 0);
    
    // Scale to the desired radius
    const scale = radius * Math.pow(this.randomFloat(0, 1), 1/3);
    return new Vector3(
      center.x + x * scale,
      center.y + y * scale,
      center.z + z * scale
    );
  }

  /**
   * Smoothly interpolates between two values using cubic easing
   * @param start - Starting value
   * @param end - Ending value
   * @param t - Interpolation factor (0-1)
   * @returns Smoothly interpolated value
   */
  public static smoothStep(start: number, end: number, t: number): number {
    const clampedT = Scalar.Clamp(t, 0, 1);
    const t2 = clampedT * clampedT;
    const t3 = t2 * clampedT;
    return start + (end - start) * (3 * t2 - 2 * t3);
  }

  /**
   * Calculates the distance between two Vector3 points
   * @param a - First point
   * @param b - Second point
   * @returns Distance between points
   */
  public static distance(a: Vector3, b: Vector3): number {
    return Vector3.Distance(a, b);
  }

  /**
   * Calculates the squared distance between two Vector3 points
   * (More efficient than distance when only comparing distances)
   * @param a - First point
   * @param b - Second point
   * @returns Squared distance between points
   */
  public static distanceSquared(a: Vector3, b: Vector3): number {
    return Vector3.DistanceSquared(a, b);
  }

  /**
   * Checks if a point is inside a sphere
   * @param point - Point to check
   * @param sphereCenter - Center of the sphere
   * @param sphereRadius - Radius of the sphere
   * @returns True if the point is inside the sphere
   */
  public static isPointInSphere(point: Vector3, sphereCenter: Vector3, sphereRadius: number): boolean {
    return this.distanceSquared(point, sphereCenter) <= sphereRadius * sphereRadius;
  }

  /**
   * Creates a direction vector from yaw and pitch angles
   * @param yaw - Yaw angle in radians (horizontal rotation)
   * @param pitch - Pitch angle in radians (vertical rotation)
   * @returns Direction vector
   */
  public static directionFromYawPitch(yaw: number, pitch: number): Vector3 {
    return new Vector3(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch)
    );
  }

  /**
   * Extracts yaw and pitch angles from a direction vector
   * @param direction - Normalized direction vector
   * @returns Object containing yaw and pitch in radians
   */
  public static yawPitchFromDirection(direction: Vector3): { yaw: number, pitch: number } {
    const normalizedDir = Vector3.Normalize(direction);
    return {
      yaw: Math.atan2(normalizedDir.x, normalizedDir.z),
      pitch: Math.asin(Scalar.Clamp(normalizedDir.y, -1, 1))
    };
  }

  /**
   * Creates a look-at quaternion from a source position to a target position
   * @param sourcePosition - Position of the object
   * @param targetPosition - Position to look at
   * @param upVector - Up vector (default: Y-up)
   * @returns Quaternion for the rotation
   */
  public static createLookAtQuaternion(
    sourcePosition: Vector3, 
    targetPosition: Vector3, 
    upVector: Vector3 = Axis.Y
  ): Quaternion {
    // Create a look-at matrix
    const matrix = Matrix.LookAtLH(sourcePosition, targetPosition, upVector);
    
    // Invert it (because lookAt is for cameras)
    matrix.invert();
    
    // Extract the rotation quaternion
    const quaternion = new Quaternion();
    matrix.decompose(undefined, quaternion);
    
    return quaternion;
  }

  /**
   * Clamps a value between min and max
   * @param value - Value to clamp
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Clamped value
   */
  public static clamp(value: number, min: number, max: number): number {
    return Scalar.Clamp(value, min, max);
  }

  /**
   * Maps a value from one range to another
   * @param value - Value to map
   * @param inMin - Input range minimum
   * @param inMax - Input range maximum
   * @param outMin - Output range minimum
   * @param outMax - Output range maximum
   * @returns Mapped value
   */
  public static map(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  }
}
