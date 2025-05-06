# Project Prism Protocol - HUD & Menu System

This document outlines the design and functionality of the HUD (Heads-Up Display) and menu systems for Project Prism Protocol.

## Main Menu

The main menu serves as the entry point to the game and provides access to all primary game functions.

### Visual Design
- Retro-inspired design with modern elements
- Low-poly aesthetic consistent with the GoldenEye 64 inspiration
- Dark background with highlighted menu options
- Game logo prominently displayed at the top

### Audio
- The main theme music (`Project-Prism_theme.wav`) plays exclusively on the main menu
- Music should loop seamlessly
- Volume adjustable through settings
- Music fades out when transitioning to gameplay

### Menu Options

#### 1. Play
- **Functionality**: Launches the Training Facility level
- **Initial State**: Player spawns with basic pistol and full HUD elements
- **Transition**: Fade to black, then fade in to the Training Facility
- **Technical Implementation**: Loads the training facility scene, initializes player controller and weapon systems

#### 2. Settings
- **Functionality**: Opens the settings submenu
- **Options**:
  - **Controls**: Customize keyboard/mouse bindings
    - Movement (WASD/Arrows)
    - Action keys (Reload, Use, Crouch, etc.)
    - Mouse sensitivity
    - Toggle/hold options for actions
  - **Audio**:
    - Master Volume (0-100%)
    - Music Volume (0-100%)
    - Sound Effects Volume (0-100%)
    - Toggle music on/off
  - **Graphics**:
    - Resolution options
    - Quality presets (Low, Medium, High)
    - Toggle effects (Motion Blur, Depth of Field, etc.)
  - **Accessibility**:
    - Text size options
    - Color blind modes
    - Reduced motion option
  - **Back**: Return to main menu

#### 3. About
- **Functionality**: Displays information about the game
- **Content**:
  - Game title and version
  - Brief description of the game concept
  - Credits for development team
  - Acknowledgment of GoldenEye 64 inspiration
  - Disclaimer regarding fan project status
  - Technical information about the game engine
- **Implementation Note**: Content should be derived from README.md, excluding implementation details and development instructions

#### 4. Quit
- **Functionality**: Exits the game by closing the browser tab
- **Confirmation Dialog**: "Are you sure you want to quit?"
  - **Yes**: Closes the browser tab
  - **No**: Returns to main menu
- **Technical Implementation**: Uses JavaScript's `window.close()` method with appropriate browser security considerations

## In-Game HUD

The in-game HUD provides essential gameplay information while maintaining immersion.

### Health Display
- Located in bottom left corner
- Visual health bar with numerical percentage
- Color changes based on health status:
  - Green: 100-70%
  - Yellow: 69-30%
  - Red: 29-0%
- Flashes when taking damage

### Ammo Counter
- Located in bottom right corner
- Displays current magazine/total ammo (e.g., "7/42")
- Visual indicator for reload necessity
- Updates in real-time when firing or reloading

### Weapon Selection
- Located in bottom center
- Shows currently equipped weapon with icon
- Brief animation when switching weapons
- Displays weapon name briefly when switching

### Objective Tracker
- Located in top right corner
- Shows current objective text
- Progress indicator for multi-stage objectives
- Briefly highlights when objectives update

### Crosshair
- Center screen
- Dynamically changes based on:
  - Weapon accuracy
  - Movement status
  - Aiming status (hip fire vs. aimed)
- Optional toggle in settings

### Interaction Prompts
- Appears when near interactive objects
- Shows key to press and action description
- Minimal design to avoid cluttering the screen

## Pause Menu

Accessible during gameplay by pressing ESC key.

### Menu Options
- **Resume**: Returns to gameplay
- **Restart Level**: Restarts the current level
- **Settings**: Same as main menu settings
- **Controls**: Quick reference for control scheme
- **Quit to Main Menu**: Returns to main menu with confirmation dialog
- **Quit Game**: Same as main menu quit option

## Technical Implementation Notes

### UI Framework
- Built using Babylon.js GUI system
- Responsive design that scales with different resolutions
- Performance optimized for browser environment

### State Management
- Menu state tracked in `UIManager` class
- Transitions handled by dedicated `MenuTransitionManager`
- Audio control integrated with menu state changes

### Integration with Game Systems
- HUD elements update via observer pattern from game state
- Player controller provides data to UI elements through dedicated methods
- Menu callbacks trigger appropriate game state changes

### Accessibility Considerations
- All UI elements support keyboard navigation
- Text elements support dynamic sizing
- Color schemes account for color blindness options
- Audio cues complement visual feedback

## Future Enhancements

- Customizable HUD layout
- Additional accessibility options
- Animated menu transitions
- Localization support for multiple languages
- Expanded graphics options for different hardware capabilities
