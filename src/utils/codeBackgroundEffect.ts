/**
 * CodeBackgroundEffect - Creates a sci-fi code animation for the main menu background
 * Simulates a continuous block of code typing from bottom left, moving right and upward
 */
export class CodeBackgroundEffect {
  // Canvas and rendering properties
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private width: number = 0;
  private height: number = 0;
  private fontSize: number = 40; // Font size for code text (2x larger)
  private lineHeight: number = 60; // Space between lines (2x larger)
  private charWidth: number = 20; // Approximate width of each character in the monospace font (2x larger)
  private blurAmount: number = 3; // Blur effect for CRT-like appearance
  
  // Text content and typing properties
  private codeContent: string = '';
  private currentPosition: number = 0; // Current typing position in the content
  private typingSpeed: number = 0.2; // Characters per frame - moderate typing speed
  private typingProgress: number = 0; // Fractional progress for sub-character typing speed
  private lastAddedLine: string = ''; // Track the last added line to prevent duplicates
  
  // Display properties
  private visibleLines: string[] = []; // Lines currently visible on screen
  private lineColors: string[] = []; // Color for each line
  private maxVisibleLines: number = 0; // Maximum number of lines that can fit on screen
  private maxCharsPerLine: number = 0; // Maximum characters that fit in a line
  private bottomY: number = 0; // Y position of the bottom line
  
  // Scrolling properties
  private scrollY: number = 0; // Current scroll position
  private scrollSpeed: number = 0.2; // How fast the text scrolls up - adjusted for smoother scrolling
  private isScrolling: boolean = true; // Always scrolling
  private frameCounter: number = 0; // Count frames to control processing
  private continuousScroll: boolean = true; // Use continuous scrolling method
  
  // Animation properties
  private animationFrameId: number = 0;
  private isActive: boolean = false;
  private opacity: number = 0.7; // Default opacity
  private scanlineEffect: boolean = true; // CRT scanline effect
  
  // Hacking simulation properties
  private isBeingHacked: boolean = false;
  private hackingDuration: number = 0;
  private maxHackingDuration: number = 180; // Frames the hacking lasts (about 3 seconds at 60fps)
  private hackingChance: number = 0.001; // Chance per frame of a hacking attempt
  private originalLines: string[] = []; // Store original lines during hacking
  private originalColors: string[] = []; // Store original colors during hacking
  private hackingPhase: number = 0; // 0: normal, 1: hacking, 2: returning to normal
  
  // Color scheme - very dark cyan/blue colors with red accent for PRISM
  private colors: string[] = [
    '#0a3b41', // Very dark cyan
    '#061e2c', // Almost black blue
    '#0d4248', // Dark teal
    '#082a2a', // Very dark teal
    '#1a3a3a', // Dark blue-gray
    '#8b0000'  // Dark red (for PRISM text)
  ];
  
  // Japanese characters for the hacking effect
  private japaneseChars: string[] = [
    '侵入', '警告', 'ハッキング', 'セキュリティ', '違反', '検出', 'アクセス', '拒否',
    'データ', '暗号化', '解読', 'コード', 'プロトコル', 'ファイアウォール', 'バイパス', 'システム',
    '緊急', '脅威', '保護', '回避', '監視', '破壊', '制御', '無効化', '迂回', '破る',
    '漏洩', '盗難', '危険', '防御', '攻撃', '侵害', '改ざん', '乗っ取り', '悪意', '破損',
    'ウイルス', 'マルウェア', 'トロイの木馬', 'バックドア', 'エクスプロイト', 'シェル', 'ルート',
    '暗号', '解読', '鍵', 'パスワード', '認証', '特権', '管理者', 'サーバー', 'ネットワーク',
    '遮断', '隔離', '検疫', '削除', '修復', '復元', '再起動', '停止', '強制終了', '実行'
  ];
  
  // Hacking effect colors - bright neon colors
  private hackingColors: string[] = [
    '#00ff00', // Bright green
    '#ff0000', // Bright red
    '#00ffff', // Cyan
    '#ff00ff', // Magenta
    '#ffff00'  // Yellow
  ];
  
  /**
   * Draw CRT scanlines effect
   */
  private drawScanlines(): void {
    if (!this.ctx) return;
    
    // Save the current context state
    this.ctx.save();
    
    // Set scanline properties
    this.ctx.globalAlpha = 0.1;
    
    // Draw horizontal scanlines
    for (let y = 0; y < this.height; y += 2) {
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(0, y, this.width, 1);
    }
    
    // Restore the context state
    this.ctx.restore();
  }
  
  // Code snippets to display (spy/tech/high-value target themed)
  private codeSnippets: string[] = [
    // Make snippets much longer to span the entire screen width
    'function encryptData(data, key) { return cipher.encrypt(data, key); } /* Advanced encryption algorithm using quantum-resistant methods to secure communications between field agents and headquarters */,',
    'class SecurityProtocol { constructor() { this.level = "maximum"; this.encryption = "AES-256"; this.authentication = "multi-factor"; this.monitoring = "continuous"; } /* Implements highest security standards */ }',
    'const firewall = new AdvancedFirewall(config.SECURITY_LEVEL); /* Deploys adaptive countermeasures against intrusion attempts with machine learning capabilities to detect and neutralize emerging threats */,',
    'async function bypassAuthentication() { /* Specialized routine to circumvent enemy security systems without triggering alarms or leaving digital footprints */ }',
    'if (securityBreach) { initiateCountermeasures(); lockdownSystems(); eraseCompromisedData(); notifyFieldAgents(); evacuateAssets(); }',
    'const encryptionKey = generateRandomKey(2048); /* Creates unbreakable encryption using quantum random number generation to secure mission-critical communications */,',
    'class DataNode { constructor(id, data) { this.id = id; this.data = data; this.connections = []; this.classification = "top-secret"; this.accessLevel = "alpha"; } /* Secure data storage node */ }',
    'function analyzeNetworkTraffic(packets) { return detectAnomalies(packets); /* Employs advanced pattern recognition algorithms to identify potential security threats in real-time communications */ }',
    'const quantumComputer = new QuantumProcessor(qubits); /* Cutting-edge quantum computing system capable of breaking conventional encryption while securing our own communications */,',
    'interface CryptoProtocol { encrypt(data: string): string; decrypt(data: string): string; verify(signature: string): boolean; sign(data: string): string; /* Comprehensive cryptographic interface */ }',
    'class NeuralNetwork { train(data) { /* Implementation of advanced neural network capable of predictive analysis of enemy movements and strategic decision-making assistance */ } }',
    'const virtualReality = new VRSystem("neural-interface"); /* Immersive training environment for field agents to practice infiltration and extraction under realistic conditions */,',
    'function hackMainframe() { return accessServerRoom().then(disableFirewall).then(extractData).then(plantBackdoor).then(eraseTraces).then(exitSystem); }',
    'class Drone { constructor() { this.surveillance = true; this.weaponized = false; this.stealthCapabilities = true; this.autonomy = "limited"; this.range = "extended"; } /* Surveillance platform */ }',
    'const satellite = new OrbitingDevice({ tracking: true, imaging: "infrared", communication: "encrypted", orbit: "low-earth", coverage: "global" });',
    'function launchCountermeasure() { /* Deploys electronic warfare capabilities to neutralize enemy surveillance and communications while maintaining our operational security */ }',
    'if (detected) { initiateEvasionProtocol(); scrambleSignature(); deployDecoys(); contactExfiltrationTeam(); destroyEvidence(); }',
    'const artificialIntelligence = new AI("strategic"); /* Advanced decision-making system providing tactical and strategic analysis for mission planning and execution */,',
    '// PROJECT: **PRISM** - CLASSIFIED - LEVEL 5 CLEARANCE REQUIRED - UNAUTHORIZED ACCESS WILL BE PROSECUTED UNDER NATIONAL SECURITY PROTOCOLS',
    'const agent = new FieldOperative({ codename: "Specter", clearance: "Alpha", specialization: "infiltration", languages: ["Russian", "Mandarin", "Farsi"], combatRating: "exceptional" });',
    'TARGET: Viktor Volkov - Arms dealer - Last seen: Moscow - Priority: HIGH - Known associates: Bratva, former KGB, international weapons cartel - Approach with extreme caution',
    'function infiltrateCompound(team) { return stealth.approach(team, "night").then(neutralizePerimeterSecurity).then(locateTarget).then(secureObjective).then(extractTeam); }',
    'const securityCameras = facility.getSecuritySystem().disableWithout("detection"); /* Temporarily blinds surveillance without triggering alarms using electromagnetic pulse technology */,',
    'MISSION: Extract intelligence from Novosibirsk research facility - Biological weapons program - Suspected nerve agent development - Recover samples if possible - Eliminate all traces of intrusion',
    'class SatelliteSurveillance { constructor() { this.orbital = "geostationary"; this.resolution = "submeter"; this.coverage = "continuous"; this.dataTransmission = "encrypted"; } /* Space-based intelligence gathering */ }',
    'TARGET: Dr. Eliza Chen - Bioweapon specialist - Location: Shanghai - Security detail: 24/7 armed guards - Known to possess formula for weaponized hemorrhagic virus - Extract or eliminate',
    'const deadDrop = new SecureExchange({ location: coordinates, time: "0200", recognition: "blue umbrella", backup: coordinates2, contingency: "abort if surveillance detected" });',
    'function extractAsset(location) { return team.deploy(extraction.COVERT).then(securePerimeter).then(contactAsset).then(validateIdentity).then(escortToExfiltration).then(coverTraces); }',
    'if (compromised) { activateProtocol("BLACKOUT"); eliminateTraces(); cutAllCommunications(); disperseTeam(); activateSleeper("CRIMSON"); }',
    'const decryptedFiles = new Intelligence({ source: "KREMLIN", value: "CRITICAL", verification: "confirmed", implications: "strategic", actionRequired: "immediate" });',
    'TARGET: General Zhao - Military intelligence - Beijing - Priority: MAXIMUM - Possesses nuclear launch codes - Extensive counterintelligence training - Approach with extreme caution',
    'class DeepCoverOperative extends Agent { constructor() { super("NOC"); this.legend = "comprehensive"; this.embeddedYears = 7; this.contactProtocol = "emergency only"; } /* Non-official cover agent */ }',
    'const safeHouse = network.getNearestLocation(coordinates, "SECURE"); /* Identifies closest vetted location with emergency supplies, weapons cache, and secure communications equipment */,',
    'function deployCounterSurveillance() { return detection.jamSignals(radius).then(scanForBugs).then(establishSecurePerimeter).then(monitorApproaches).then(reportAllMovements); }',
    'OPERATION: **PRISM** PROTOCOL - Authorization: DIRECTOR EYES ONLY - Global surveillance initiative - Quantum computing encryption breakthrough - Full spectrum dominance - Budget: classified',
    'const nuclearCodes = new Payload({ encryption: "QUANTUM", access: "ALPHA", verification: "biometric", expiration: "12 hours", dispersal: "multiple carriers" });',
    'if (assetCompromised) { initiateProtocol("CLEAN SLATE"); burnAllConnections(); relocateHandlers(); eliminateTrail(); activateBackupNetwork(); }'
  ];

  /**
   * Create a new code background effect
   * @param canvasId - The ID of the canvas element to render to
   */
  constructor(canvasId: string) {
    try {
      // Get canvas element
      const canvas = document.getElementById(canvasId);
      if (!canvas) {
        console.error(`Canvas element with ID ${canvasId} not found`);
        return;
      }
      this.canvas = canvas as HTMLCanvasElement;
      
      // Get 2D context
      const ctx = this.canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get 2D context from canvas');
        return;
      }
      this.ctx = ctx;
      
      // Make sure canvas is visible
      this.canvas.style.display = 'block';
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.zIndex = '1'; // Lower z-index to be behind UI elements
      this.canvas.style.pointerEvents = 'none';
      
      // Apply filter for CRT effect
      this.canvas.style.filter = `blur(${this.blurAmount}px)`;
      
      // Set initial dimensions
      this.resize();
      
      // Add resize listener
      window.addEventListener('resize', () => this.resize());
      
      console.log('CodeBackgroundEffect initialized successfully');
    } catch (error) {
      console.error('Error initializing CodeBackgroundEffect:', error);
    }
  }
  
  /**
   * Resize the canvas to match the window size
   */
  private resize(): void {
    if (!this.canvas || !this.ctx) return;
    
    try {
      // Set canvas dimensions to match window
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      
      // Calculate how many characters can fit on a line
      this.maxCharsPerLine = Math.floor(this.width / this.charWidth);
      
      // Calculate how many lines can fit on the screen
      this.maxVisibleLines = Math.ceil(this.height / this.lineHeight);
      
      // Set the bottom Y position
      this.bottomY = this.height - this.lineHeight;
      
      // Initialize the text display
      this.initializeTextDisplay();
      
      // Apply background color to the canvas
      if (this.canvas) {
        this.canvas.style.backgroundColor = '#0A141E'; // Dark blue/black background
      }
      
      console.log(`Canvas resized to ${this.width}x${this.height}`);
    } catch (error) {
      console.error('Error resizing canvas:', error);
    }
  }
  
  /**
   * Generate the initial code content by combining code snippets
   */
  private generateCodeContent(): void {
    // Create a long string of code by concatenating snippets with line breaks
    let content = '';
    
    // Generate a moderate amount of initial content
    const snippetsNeeded = 30; // Start with less content, we'll add more dynamically
    
    for (let i = 0; i < snippetsNeeded; i++) {
      // Get a random snippet
      const snippetIndex = Math.floor(Math.random() * this.codeSnippets.length);
      const snippet = this.codeSnippets[snippetIndex];
      
      // Add snippet with line break
      content += snippet + '\n';
      
      // Occasionally add an empty line for spacing
      if (Math.random() > 0.8) {
        content += '\n';
      }
    }
    
    this.codeContent = content;
  }
  
  /**
   * Append more code content to create a continuous stream without resetting
   */
  private appendMoreCodeContent(): void {
    // Add more snippets to the existing content
    const snippetsToAdd = 20;
    
    // Track used snippets to prevent duplicates
    const usedSnippets = new Set<number>();
    
    let newContent = '';
    for (let i = 0; i < snippetsToAdd; i++) {
      // Get a random snippet that hasn't been used recently
      let snippetIndex;
      do {
        snippetIndex = Math.floor(Math.random() * this.codeSnippets.length);
      } while (usedSnippets.has(snippetIndex) && usedSnippets.size < this.codeSnippets.length / 2);
      
      usedSnippets.add(snippetIndex);
      const snippet = this.codeSnippets[snippetIndex];
      
      // Add snippet with line break
      newContent += snippet + '\n';
      
      // Occasionally add an empty line for spacing
      if (Math.random() > 0.8) {
        newContent += '\n';
      }
    }
    
    // Append the new content to the existing content
    this.codeContent += newContent;
  }
  
  /**
   * Initialize the text display
   */
  private initializeTextDisplay(): void {
    // Generate the code content
    this.generateCodeContent();
    
    // Prepare initial screen of text
    this.prepareInitialScreen();
    
    // Start scrolling immediately since we already have content
    this.isScrolling = true;
    this.scrollY = 0;
  }
  
  /**
   * Prepare initial screen filled with text from bottom up
   */
  private prepareInitialScreen(): void {
    // Calculate how many lines we need to fill the screen
    const linesNeeded = Math.min(this.maxVisibleLines, 8); // Limit to 8 lines for less clutter
    
    // Create initial lines
    this.visibleLines = [];
    this.lineColors = [];
    
    // Track used snippets to prevent duplicates
    const usedSnippets = new Set<number>();
    
    // Add initial lines to fill the bottom portion of the screen
    for (let i = 0; i < linesNeeded; i++) {
      // Get a random snippet that hasn't been used yet
      let snippetIndex;
      do {
        snippetIndex = Math.floor(Math.random() * this.codeSnippets.length);
      } while (usedSnippets.has(snippetIndex) && usedSnippets.size < this.codeSnippets.length - 1);
      
      usedSnippets.add(snippetIndex);
      const snippet = this.codeSnippets[snippetIndex];
      
      // Add the full line (not typing it out character by character initially)
      this.visibleLines.push(snippet);
      this.lastAddedLine = snippet; // Track the last added line
      
      // Choose a random color from our palette
      let colorIndex = Math.floor(Math.random() * this.colors.length);
      // Make the red color (for PRISM) less common
      if (colorIndex === this.colors.length - 1 && Math.random() > 0.2) {
        colorIndex = Math.floor(Math.random() * (this.colors.length - 1));
      }
      this.lineColors.push(this.colors[colorIndex]);
    }
    
    // Set the current position to start typing new content after the initial screen
    // We'll set it to a point that will trigger new content generation
    this.currentPosition = this.codeContent.length - 100;
  }
  
  /**
   * Start the animation
   * @param delay - Optional delay in milliseconds before starting the animation
   */
  public start(delay?: number): void {
    if (this.isActive) return; // Already running
    
    this.isActive = true;
    this.initializeTextDisplay();
    
    if (delay && delay > 0) {
      console.log(`Code background effect will start after ${delay}ms delay`);
      setTimeout(() => {
        if (this.isActive) { // Check if still active after timeout
          this.animationFrameId = requestAnimationFrame(() => this.draw());
          console.log('Code background effect started after delay');
        }
      }, delay);
    } else {
      this.animationFrameId = requestAnimationFrame(() => this.draw());
      console.log('Code background effect started immediately');
    }
  }
  
  /**
   * Stop the animation
   */
  public stop(): void {
    if (!this.isActive) return; // Already stopped
    
    this.isActive = false;
    cancelAnimationFrame(this.animationFrameId);
    
    console.log('Code background effect stopped');
  }
  
  /**
   * Set the opacity of the effect
   * @param opacity - Opacity value between 0 and 1
   */
  public setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity)); // Clamp between 0 and 1
    
    if (this.canvas) {
      this.canvas.style.opacity = this.opacity.toString();
    }
  }
  
  /**
   * Set the blur amount for the CRT effect
   * @param amount - Blur amount in pixels
   */
  public setBlurAmount(amount: number): void {
    this.blurAmount = Math.max(0, amount); // Ensure non-negative
    
    if (this.canvas) {
      this.canvas.style.filter = `blur(${this.blurAmount}px)`;
    }
  }
  
  /**
   * Draw a frame of the animation
   */
  private draw(): void {
    if (!this.canvas || !this.ctx || !this.isActive) return;
    
    try {
      // Clear the canvas with dark blue/black background (no trailing effect)
      this.ctx.fillStyle = '#0A141E'; // Dark blue/black background
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      // Set font
      this.ctx.font = `${this.fontSize}px monospace`;
      
      // Check if a hacking attempt should start
      if (!this.isBeingHacked && Math.random() < this.hackingChance) {
        this.startHackingEffect();
      }
      
      // Update hacking effect if active
      if (this.isBeingHacked) {
        this.updateHackingEffect();
      }
      
      // Process the continuous text
      this.processTextTyping();
      
      // Draw the visible lines
      this.drawVisibleLines();
      
      // Schedule next frame
      if (this.isActive) {
        this.animationFrameId = requestAnimationFrame(() => this.draw());
      }
    } catch (error) {
      console.error('Error drawing code background:', error);
      this.stop(); // Stop on error to prevent infinite error loop
    }
  }
  
  /**
   * Start the hacking effect
   */
  private startHackingEffect(): void {
    this.isBeingHacked = true;
    this.hackingDuration = 0;
    console.log('Hacking attempt detected in code background!');
    
    // Store the original lines to restore later
    this.storeOriginalLines();
  }
  
  /**
   * Store the original lines before hacking effect
   */
  private storeOriginalLines(): void {
    // Make deep copies of the current lines and colors
    this.originalLines = [...this.visibleLines];
    this.originalColors = [...this.lineColors];
  }
  
  /**
   * Update the hacking effect
   */
  private updateHackingEffect(): void {
    // Increment the duration counter
    this.hackingDuration++;
    
    // Check if the hacking effect should end
    if (this.hackingDuration >= this.maxHackingDuration) {
      this.endHackingEffect();
      return;
    }
    
    // Alternate between normal code and Japanese characters
    const phaseLength = 60; // About 1 second at 60fps
    const currentPhase = Math.floor(this.hackingDuration / phaseLength) % 2;
    
    // If we're changing phases, update the display
    if (this.hackingPhase !== currentPhase) {
      this.hackingPhase = currentPhase;
      
      if (currentPhase === 0) {
        // Restore original lines
        this.restoreOriginalLines();
      } else {
        // Switch to Japanese hacking text
        this.applyHackingText();
      }
    }
    
    // Occasionally update some lines even within the same phase
    if (this.hackingDuration % 10 === 0) { // Every 10 frames
      if (currentPhase === 1) { // Only during Japanese phase
        // Replace a random number of lines
        const linesToReplace = Math.floor(Math.random() * 2) + 1; // 1-2 lines
        
        for (let i = 0; i < linesToReplace; i++) {
          // Choose a random line to replace
          const lineIndex = Math.floor(Math.random() * this.visibleLines.length);
          
          // Generate Japanese hacking text
          const hackText = this.generateHackingText();
          
          // Replace the line
          this.visibleLines[lineIndex] = hackText;
          
          // Set a bright hacking color
          this.lineColors[lineIndex] = this.getRandomHackingColor();
        }
      }
    }
  }
  
  /**
   * Restore original lines during hacking phase transition
   */
  private restoreOriginalLines(): void {
    // Restore the original lines but keep some Japanese characters
    for (let i = 0; i < this.visibleLines.length; i++) {
      // 80% chance to restore original line if it exists
      if (i < this.originalLines.length && Math.random() < 0.8) {
        this.visibleLines[i] = this.originalLines[i];
        this.lineColors[i] = this.originalColors[i];
      }
    }
  }
  
  /**
   * Apply Japanese hacking text during hacking phase transition
   */
  private applyHackingText(): void {
    // Replace most lines with Japanese text
    for (let i = 0; i < this.visibleLines.length; i++) {
      // 80% chance to replace with Japanese
      if (Math.random() < 0.8) {
        // Generate Japanese hacking text
        const hackText = this.generateHackingText();
        
        // Replace the line
        this.visibleLines[i] = hackText;
        
        // Set a bright hacking color
        this.lineColors[i] = this.getRandomHackingColor();
      }
    }
  }
  
  /**
   * End the hacking effect and restore normal display
   */
  private endHackingEffect(): void {
    this.isBeingHacked = false;
    this.hackingPhase = 0;
    console.log('Hacking attempt neutralized in code background');
    
    // Restore all original lines
    for (let i = 0; i < this.visibleLines.length; i++) {
      if (i < this.originalLines.length) {
        this.visibleLines[i] = this.originalLines[i];
        this.lineColors[i] = this.originalColors[i];
      }
    }
    
    // Clear stored originals
    this.originalLines = [];
    this.originalColors = [];
  }
  
  /**
   * Generate text for the hacking effect using Japanese characters
   */
  private generateHackingText(): string {
    let result = '';
    const length = Math.floor(Math.random() * 10) + 5; // 5-15 characters
    
    for (let i = 0; i < length; i++) {
      // Add Japanese characters
      const charIndex = Math.floor(Math.random() * this.japaneseChars.length);
      result += this.japaneseChars[charIndex] + ' ';
    }
    
    // Occasionally add "SECURITY BREACH" or "INTRUSION DETECTED"
    if (Math.random() > 0.7) {
      result += Math.random() > 0.5 ? ' ** SECURITY BREACH ** ' : ' ** INTRUSION DETECTED ** ';
    }
    
    return result;
  }
  
  /**
   * Get a random color for the hacking effect
   */
  private getRandomHackingColor(): string {
    const index = Math.floor(Math.random() * this.hackingColors.length);
    return this.hackingColors[index];
  }
  
  /**
   * Process text typing and scrolling
   */
  private processTextTyping(): void {
    // Only process every other frame for more controlled updates
    this.frameCounter++;
    if (this.frameCounter % 2 !== 0) {
      return;
    }
    
    // Accumulate typing progress for sub-character typing speed
    this.typingProgress += this.typingSpeed;
    
    // Only advance the position when we've accumulated enough progress
    if (this.typingProgress >= 1) {
      // Advance the typing position by the whole number part
      const charsToAdd = Math.floor(this.typingProgress);
      this.currentPosition += charsToAdd;
      
      // Keep the fractional part for next frame
      this.typingProgress -= charsToAdd;
      
      // If we're approaching the end of the content, add more content instead of resetting
      if (this.currentPosition >= this.codeContent.length - 500) {
        // Add more content by concatenating more snippets
        this.appendMoreCodeContent();
      }
      
      // Add new lines at a moderate rate (1 in 10 chance when we've typed enough)
      if (Math.random() < 0.1 && this.typingProgress >= 0.5) {
        this.addNewLine();
      }
    }
    
    // Always scroll upward at a consistent rate
    if (this.isScrolling) {
      // Increment the scroll position
      this.scrollY -= this.scrollSpeed;
      
      // When we've scrolled a full line height
      if (Math.abs(this.scrollY) >= this.lineHeight) {
        // Reset scroll position but keep the fractional part for smoothness
        this.scrollY = this.scrollY % this.lineHeight;
        
        // Add a new line at the bottom
        this.addNewLine();
        
        // Remove the oldest line if we have too many
        if (this.visibleLines.length > this.maxVisibleLines) {
          this.visibleLines.shift();
          this.lineColors.shift();
          
          // If we're being hacked, also shift the original lines
          if (this.isBeingHacked && this.originalLines.length > 0) {
            this.originalLines.shift();
            this.originalColors.shift();
          }
        }
      }
    }
  }
  
  /**
   * Add a new line of code to the display
   */
  private addNewLine(): void {
    // If we're being hacked, occasionally add a Japanese hacking line instead
    if (this.isBeingHacked && Math.random() > 0.5) {
      // Generate Japanese hacking text
      const hackText = this.generateHackingText();
      
      // Add the hacked line
      this.visibleLines.push(hackText);
      
      // Use a bright hacking color
      this.lineColors.push(this.getRandomHackingColor());
    } else {
      // Normal line addition
      // Get a random snippet that's not the same as the last one
      let snippetIndex;
      let snippet;
      
      do {
        snippetIndex = Math.floor(Math.random() * this.codeSnippets.length);
        snippet = this.codeSnippets[snippetIndex];
      } while (snippet === this.lastAddedLine);
      
      // Track this as the last added line
      this.lastAddedLine = snippet;
      
      // Add the new line to our visible lines
      this.visibleLines.push(snippet);
      
      // Choose a random color for the new line
      let colorIndex = Math.floor(Math.random() * this.colors.length);
      // Make the red color (for PRISM) less common
      if (colorIndex === this.colors.length - 1 && Math.random() > 0.2) {
        colorIndex = Math.floor(Math.random() * (this.colors.length - 1));
      }
      this.lineColors.push(this.colors[colorIndex]);
    }
    
    // Remove the oldest line if we have too many
    if (this.visibleLines.length > this.maxVisibleLines) {
      this.visibleLines.shift();
      this.lineColors.shift();
    }
  }
  
  /**
   * Draw the visible lines of text
   */
  private drawVisibleLines(): void {
    if (!this.ctx) return;
    
    // Draw scanlines for CRT effect if enabled
    if (this.scanlineEffect) {
      this.drawScanlines();
    }
    
    // For continuous scrolling, calculate the base Y position
    // This creates a smooth crawl from bottom to top
    const baseY = this.height - this.lineHeight + this.scrollY;
    
    // Draw each line, starting from the bottom
    for (let i = 0; i < this.visibleLines.length; i++) {
      const line = this.visibleLines[i];
      const color = this.lineColors[i];
      
      // Calculate Y position for continuous scrolling
      // Each line is positioned relative to the bottom, with newer lines at the bottom
      const lineY = baseY - (this.visibleLines.length - 1 - i) * this.lineHeight;
      
      // Only draw lines that are visible on screen
      if (lineY < -this.lineHeight || lineY > this.height) continue;
      
      // Set color with opacity
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = this.opacity;
      
      // Calculate a slight horizontal offset based on line number for variety
      const xOffset = (i % 3) * 10;
      
      // Special handling for PRISM text (make it bright red and add glow)
      if (line.includes('PRISM')) {
        // Find the position of "PRISM" in the line
        const prismIndex = line.indexOf('PRISM');
        
        // Draw the regular part of the line
        const beforePrism = line.substring(0, prismIndex);
        if (beforePrism) {
          this.ctx.fillText(beforePrism, xOffset, lineY);
        }
        
        // Draw PRISM with glow effect
        this.ctx.fillStyle = '#ff0000'; // Bright red
        this.ctx.shadowColor = '#ff0000';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText('PRISM', xOffset + this.ctx.measureText(beforePrism).width, lineY);
        
        // Reset shadow for the rest of the line
        this.ctx.shadowBlur = 0;
        
        // Draw the rest of the line
        const afterPrism = line.substring(prismIndex + 5);
        if (afterPrism) {
          this.ctx.fillStyle = color;
          this.ctx.fillText(afterPrism, xOffset + this.ctx.measureText(beforePrism + 'PRISM').width, lineY);
        }
      } else {
        // Draw normal line
        this.ctx.fillText(line, xOffset, lineY);
      }
      
      // No need to adjust position manually as we're using calculated positions
    }
    
    // Reset global alpha
    this.ctx.globalAlpha = 1.0;
  }
}
