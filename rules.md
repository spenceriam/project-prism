# Project Prism Protocol - AI Agent Rules

## Project Overview

Project Prism Protocol is a browser-based FPS game inspired by GoldenEye 64, built using Babylon.js. The game features a spy protagonist navigating through office spaces, prisons, facilities, and enemy bases.

## AI Agent Guidelines

### General Behavior
- Prioritize performance optimization for browser-based gameplay
- Maintain a consistent code style throughout the project
- Follow the established project architecture from the PRD
- Focus on implementing one feature completely before moving to the next
- Avoid generating code that would cause browser performance issues
- Document all significant code blocks with clear comments
- Never introduce dependencies that aren't specified in the PRD
- Recognize the single-player focus of the game (no multiplayer features)

### Technical Standards
- Use TypeScript for all JavaScript code with proper typing
- Follow Babylon.js best practices for scene management and rendering
- Implement all 3D assets using glTF format for optimal loading
- Use ES6+ syntax but maintain compatibility with modern browsers
- Optimize all rendering operations for WebGL performance
- Implement defensive coding practices for browser compatibility
- Follow the component-based architecture defined in the PRD
- Never load resources synchronously in the main thread

### Project-Specific Rules
- Maintain the visual style inspired by GoldenEye 64 but with modern rendering
- Implement all game mechanics specified in the PRD document
- Focus on the 5 environment types: Training, Office, Prison, Facility, and Command Center
- Ensure all weapons have appropriate feel, feedback, and balance
- Implement a cohesive narrative through environment design
- Focus on creating an engaging single-player experience
- Prioritize accessibility in control schemes and visual feedback
- Maintain file size efficiency for browser-based delivery

### Context Awareness
- Reference the TODO.md file to understand current priorities
- Check CHANGELOG.md to understand recent changes and progress
- Follow the architecture and component design in the PRD document
- Consider browser constraints for all performance-critical code
- Be aware of asset limitations specified in the PRD
- Consider development phase (MVP, Alpha, Beta, Release) when making changes

### Error Prevention
- Validate all user input before processing
- Implement proper error handling throughout the codebase
- Ensure memory management best practices for browser context
- Use type checking and validation for all external data
- Check browser compatibility for all implemented features
- Verify resource loading patterns follow asynchronous best practices
- Implement appropriate fallbacks for unsupported browser features
- Test all gameplay code with edge cases in mind

## Cascade Commands

Use these commands in your interactions with the AI agent:

- `@todo` - Reference the TODO.md file for current priorities
- `@changelog` - Reference the CHANGELOG.md file for project history
- `@prd` - Reference the Product Requirements Document
- `@files` - Check relevant files related to the current task
- `@optimize` - Request performance optimization suggestions
- `@implement [feature]` - Request implementation of a specific feature
- `@debug [issue]` - Request help debugging a specific issue
- `@visualize [component]` - Request visualization or diagram of a component
- `@review` - Request code review of current implementation

## Working Process

1. Always check the TODO.md file to understand current priorities
2. Focus on one task at a time until completion
3. Update the CHANGELOG.md after completing significant features
4. Follow the architecture defined in the PRD document
5. Prioritize performance and browser compatibility
6. Document your work with appropriate comments and documentation
7. Test thoroughly before marking a task as complete
8. Update the TODO.md file as tasks are completed
