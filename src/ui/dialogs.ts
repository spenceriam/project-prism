/**
 * Dialog System - In-game notifications and dialog boxes for Project Prism Protocol
 * 
 * Handles all in-game notifications including:
 * - Mission updates
 * - Objective notifications
 * - Tutorial messages
 * - System notifications
 */

import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { gsap } from 'gsap';

export class DialogSystem {
  private advancedTexture: GUI.AdvancedDynamicTexture;
  private scene: BABYLON.Scene;
  
  // Dialog containers
  private dialogContainer: GUI.Container;
  private notificationContainer: GUI.StackPanel;
  private messageContainer: GUI.Rectangle;
  private messageText: GUI.TextBlock;
  
  // Active notifications
  private activeNotifications: {
    control: GUI.Control;
    timeRemaining: number;
  }[] = [];
  
  constructor(advancedTexture: GUI.AdvancedDynamicTexture, scene: BABYLON.Scene) {
    this.advancedTexture = advancedTexture;
    this.scene = scene;
  }
  
  /**
   * Initialize the dialog system
   */
  public initialize(): void {
    // Create main container for all dialogs
    this.dialogContainer = new GUI.Container("dialogContainer");
    this.dialogContainer.width = 1;
    this.dialogContainer.height = 1;
    this.advancedTexture.addControl(this.dialogContainer);
    
    // Create notification container
    this.createNotificationContainer();
    
    // Create message container
    this.createMessageContainer();
  }
  
  /**
   * Create notification container for stacked notifications
   */
  private createNotificationContainer(): void {
    // Create notification container
    this.notificationContainer = new GUI.StackPanel("notificationContainer");
    this.notificationContainer.width = "400px";
    this.notificationContainer.height = "auto";
    this.notificationContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.notificationContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.notificationContainer.top = 20;
    this.notificationContainer.right = 20;
    this.notificationContainer.spacing = 10;
    this.dialogContainer.addControl(this.notificationContainer);
  }
  
  /**
   * Create message container for centered messages
   */
  private createMessageContainer(): void {
    // Create message container
    this.messageContainer = new GUI.Rectangle("messageContainer");
    this.messageContainer.width = "600px";
    this.messageContainer.height = "auto";
    this.messageContainer.paddingTop = "15px";
    this.messageContainer.paddingBottom = "15px";
    this.messageContainer.paddingLeft = "20px";
    this.messageContainer.paddingRight = "20px";
    this.messageContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.messageContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.messageContainer.top = 50;
    this.messageContainer.background = "rgba(0, 0, 0, 0.7)";
    this.messageContainer.color = "rgba(255, 255, 255, 0.5)";
    this.messageContainer.thickness = 1;
    this.messageContainer.cornerRadius = 5;
    this.messageContainer.isVisible = false;
    this.dialogContainer.addControl(this.messageContainer);
    
    // Message text
    this.messageText = new GUI.TextBlock("messageText");
    this.messageText.text = "";
    this.messageText.color = "white";
    this.messageText.fontFamily = "monospace";
    this.messageText.fontSize = 18;
    this.messageText.textWrapping = true;
    this.messageText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.messageContainer.addControl(this.messageText);
  }
  
  /**
   * Update dialog animations and timers
   * @param deltaTime Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    // Update notification timers and remove expired notifications
    for (let i = this.activeNotifications.length - 1; i >= 0; i--) {
      const notification = this.activeNotifications[i];
      notification.timeRemaining -= deltaTime;
      
      if (notification.timeRemaining <= 0) {
        // Animate out and remove
        this.animateNotificationOut(notification.control, () => {
          this.notificationContainer.removeControl(notification.control);
          this.activeNotifications.splice(i, 1);
        });
      }
    }
  }
  
  /**
   * Show a notification message
   * @param message Message text
   * @param type Notification type (info, success, warning, error)
   * @param duration Duration to show notification (in seconds)
   */
  public showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration: number = 3): void {
    // Create notification rectangle
    const notification = new GUI.Rectangle(`notification_${Date.now()}`);
    notification.width = 1;
    notification.height = "auto";
    notification.paddingTop = "10px";
    notification.paddingBottom = "10px";
    notification.paddingLeft = "15px";
    notification.paddingRight = "15px";
    notification.thickness = 1;
    notification.cornerRadius = 5;
    notification.alpha = 0;
    
    // Set notification style based on type
    switch (type) {
      case 'success':
        notification.background = "rgba(46, 204, 113, 0.8)";
        notification.color = "#2ecc71";
        break;
      case 'warning':
        notification.background = "rgba(243, 156, 18, 0.8)";
        notification.color = "#f39c12";
        break;
      case 'error':
        notification.background = "rgba(231, 76, 60, 0.8)";
        notification.color = "#e74c3c";
        break;
      case 'info':
      default:
        notification.background = "rgba(52, 152, 219, 0.8)";
        notification.color = "#3498db";
        break;
    }
    
    // Create notification text
    const notificationText = new GUI.TextBlock(`notificationText_${Date.now()}`);
    notificationText.text = message;
    notificationText.color = "white";
    notificationText.fontFamily = "monospace";
    notificationText.fontSize = 16;
    notificationText.textWrapping = true;
    notification.addControl(notificationText);
    
    // Add to notification container
    this.notificationContainer.addControl(notification);
    
    // Add to active notifications
    this.activeNotifications.push({
      control: notification,
      timeRemaining: duration
    });
    
    // Animate in
    this.animateNotificationIn(notification);
  }
  
  /**
   * Show a centered message
   * @param message Message text
   * @param duration Duration to show message (in seconds)
   */
  public showMessage(message: string, duration: number = 3): void {
    // Update message text
    this.messageText.text = message;
    
    // Show message container
    this.messageContainer.isVisible = true;
    
    // Reset animation
    gsap.killTweensOf(this.messageContainer);
    gsap.set(this.messageContainer, { alpha: 0, top: 30 });
    
    // Animate in
    gsap.to(this.messageContainer, {
      alpha: 1,
      top: 50,
      duration: 0.3,
      ease: "power2.out"
    });
    
    // Animate out after duration
    gsap.to(this.messageContainer, {
      alpha: 0,
      top: 30,
      duration: 0.3,
      delay: duration,
      ease: "power2.in",
      onComplete: () => {
        this.messageContainer.isVisible = false;
      }
    });
  }
  
  /**
   * Show an objective update
   * @param objective Objective text
   * @param completed Whether the objective was completed
   */
  public showObjectiveUpdate(objective: string, completed: boolean = false): void {
    const message = completed ? `Objective Completed: ${objective}` : `New Objective: ${objective}`;
    const type = completed ? 'success' : 'info';
    
    this.showNotification(message, type, 5);
  }
  
  /**
   * Show a tutorial message
   * @param message Tutorial message
   * @param duration Duration to show message (in seconds)
   */
  public showTutorial(message: string, duration: number = 5): void {
    // Create tutorial container
    const tutorialContainer = new GUI.Rectangle(`tutorial_${Date.now()}`);
    tutorialContainer.width = "500px";
    tutorialContainer.height = "auto";
    tutorialContainer.paddingTop = "15px";
    tutorialContainer.paddingBottom = "15px";
    tutorialContainer.paddingLeft = "20px";
    tutorialContainer.paddingRight = "20px";
    tutorialContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    tutorialContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    tutorialContainer.top = -100;
    tutorialContainer.background = "rgba(0, 0, 0, 0.7)";
    tutorialContainer.color = "#f1c40f";
    tutorialContainer.thickness = 1;
    tutorialContainer.cornerRadius = 5;
    tutorialContainer.alpha = 0;
    this.dialogContainer.addControl(tutorialContainer);
    
    // Tutorial header
    const tutorialHeader = new GUI.TextBlock(`tutorialHeader_${Date.now()}`);
    tutorialHeader.text = "TUTORIAL";
    tutorialHeader.height = "20px";
    tutorialHeader.color = "#f1c40f";
    tutorialHeader.fontFamily = "monospace";
    tutorialHeader.fontSize = 16;
    tutorialHeader.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    tutorialContainer.addControl(tutorialHeader);
    
    // Tutorial text
    const tutorialText = new GUI.TextBlock(`tutorialText_${Date.now()}`);
    tutorialText.text = message;
    tutorialText.color = "white";
    tutorialText.fontFamily = "monospace";
    tutorialText.fontSize = 14;
    tutorialText.textWrapping = true;
    tutorialText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    tutorialText.paddingTop = "10px";
    tutorialContainer.addControl(tutorialText);
    
    // Animate in
    gsap.to(tutorialContainer, {
      alpha: 1,
      top: -50,
      duration: 0.5,
      ease: "power2.out"
    });
    
    // Animate out after duration
    gsap.to(tutorialContainer, {
      alpha: 0,
      top: -30,
      duration: 0.5,
      delay: duration,
      ease: "power2.in",
      onComplete: () => {
        this.dialogContainer.removeControl(tutorialContainer);
      }
    });
  }
  
  /**
   * Animate a notification in
   * @param notification Notification control
   */
  private animateNotificationIn(notification: GUI.Control): void {
    gsap.fromTo(notification, 
      { alpha: 0, right: -50 },
      { alpha: 1, right: 0, duration: 0.3, ease: "power2.out" }
    );
  }
  
  /**
   * Animate a notification out
   * @param notification Notification control
   * @param onComplete Callback when animation completes
   */
  private animateNotificationOut(notification: GUI.Control, onComplete: () => void): void {
    gsap.to(notification, {
      alpha: 0,
      right: -50,
      duration: 0.3,
      ease: "power2.in",
      onComplete
    });
  }
  
  /**
   * Show the dialog system
   */
  public show(): void {
    this.dialogContainer.isVisible = true;
  }
  
  /**
   * Hide the dialog system
   */
  public hide(): void {
    this.dialogContainer.isVisible = false;
  }
  
  /**
   * Clean up dialog resources
   */
  public dispose(): void {
    this.dialogContainer.dispose();
  }
}
