import { Game } from './game';
import { SimObject } from './sim/simObject';
import playIconUrl from '/icons/play-color.png';
import pauseIconUrl from '/icons/pause-color.png';

export class GameUI {
  /**
   * Currently selected tool
   * @type {string}
   */
  activeToolId = 'select';
  /**
   * @type {HTMLElement | null }
   */
  selectedControl = null;
  /**
   * True if the game is currently paused
   * @type {boolean}
   */
  isPaused = false;
  /**
   * Device type detection
   * @type {boolean}
   */
  isMobile = false;
  /**
   * Screen orientation
   * @type {string}
   */
  orientation = 'portrait';
  /**
   * Touch gesture state
   * @type {Object}
   */
  touchState = {
    lastTouchDistance: 0,
    isZooming: false,
    isPanning: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    isSwipeCandidate: false
  };
  /**
   * Game settings
   * @type {Object}
   */
  settings = {
    masterVolume: 50,
    soundEffects: true,
    autoSave: true,
    gameSpeed: 1,
    notifications: true,
    uiScale: 1,
    hapticFeedback: true,
    tooltips: true
  };
  /**
   * Statistics panel visibility
   * @type {boolean}
   */
  statsVisible = false;
  /**
   * Settings panel visibility
   * @type {boolean}
   */
  settingsVisible = false;

  constructor() {
    this.detectDevice();
    this.setupEventListeners();
    this.handleResize();
    this.loadSettings();
    this.initializeStatsTracking();
  }

  /**
   * Detect if device is mobile/tablet
   */
  detectDevice() {
    this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   (window.innerWidth <= 768) ||
                   ('ontouchstart' in window);
    
    // Add device class to body
    document.body.classList.toggle('mobile-device', this.isMobile);
    document.body.classList.toggle('desktop-device', !this.isMobile);
  }

  /**
   * Setup event listeners for responsive behavior
   */
  setupEventListeners() {
    // Resize and orientation change
    window.addEventListener('resize', this.handleResize.bind(this));
    window.addEventListener('orientationchange', () => {
      setTimeout(this.handleResize.bind(this), 100);
    });

    // Touch event listeners for mobile
    if (this.isMobile) {
      this.setupTouchControls();
    }

    // Viewport meta tag for mobile
    this.setupViewport();
    
    // Setup UI button event listeners
    this.setupUIEventListeners();
  }
  
  /**
   * Setup UI button event listeners
   */
  setupUIEventListeners() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.bindUIEvents();
      });
    } else {
      this.bindUIEvents();
    }
  }
  
  /**
   * Bind UI events to DOM elements
   */
  bindUIEvents() {
    console.log('Binding UI events...'); // Debug log
    
    // Initialize selected control
    this.selectedControl = document.getElementById('button-select');
    if (this.selectedControl) {
      this.selectedControl.classList.add('selected');
    }
    
    // Statistics panel events
    const statsToggleBtn = document.getElementById('stats-toggle-btn');
    const statsCloseBtn = document.getElementById('stats-close-btn');
    
    console.log('Stats toggle btn:', statsToggleBtn); // Debug log
    console.log('Stats close btn:', statsCloseBtn); // Debug log
    
    if (statsToggleBtn) {
      statsToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Stats toggle clicked'); // Debug log
        this.toggleStatsPanel();
      });
    }
    
    if (statsCloseBtn) {
      statsCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Stats close clicked'); // Debug log
        if (this.statsVisible) {
          this.toggleStatsPanel();
        }
      });
      
      // Add touch event for better mobile responsiveness
      statsCloseBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Stats close touched'); // Debug log
        if (this.statsVisible) {
          this.toggleStatsPanel();
        }
      });
    }
    
    // Settings panel events
    const settingsBtn = document.getElementById('settings-btn');
    const settingsCloseBtn = document.getElementById('settings-close-btn');
    const settingsConfirmBtn = document.getElementById('settings-confirm-btn');
    const resetSettingsBtn = document.getElementById('reset-settings-btn');
    
    if (settingsBtn) {
      settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleSettings();
      });
    }
    
    if (settingsCloseBtn) {
      settingsCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleSettings();
      });
    }
    
    if (settingsConfirmBtn) {
      settingsConfirmBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleSettings();
      });
    }
    
    if (resetSettingsBtn) {
      resetSettingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.resetSettings();
      });
    }
    
    // Toolbar button events
    const toolbarButtons = document.querySelectorAll('.ui-button[data-type]');
    toolbarButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.onToolSelected(e);
      });
    });
    
    // Pause button
    const pauseButton = document.getElementById('button-pause');
    if (pauseButton) {
      pauseButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.togglePause();
      });
    }
    
    // Settings form elements
    this.bindSettingsEvents();
    
    console.log('UI events bound successfully'); // Debug log
  }
  
  /**
   * Bind settings form events
   */
  bindSettingsEvents() {
    // Master volume
    const masterVolume = document.getElementById('master-volume');
    const masterVolumeDisplay = document.getElementById('master-volume-display');
    if (masterVolume && masterVolumeDisplay) {
      masterVolume.addEventListener('input', (e) => {
        const value = e.target.value;
        masterVolumeDisplay.textContent = `${value}%`;
        this.updateSetting('masterVolume', value);
      });
    }
    
    // Sound effects
    const soundEffects = document.getElementById('sound-effects');
    if (soundEffects) {
      soundEffects.addEventListener('change', (e) => {
        this.updateSetting('soundEffects', e.target.checked);
      });
    }
    
    // Auto save
    const autoSave = document.getElementById('auto-save');
    if (autoSave) {
      autoSave.addEventListener('change', (e) => {
        this.updateSetting('autoSave', e.target.checked);
      });
    }
    
    // Game speed
    const gameSpeed = document.getElementById('game-speed');
    if (gameSpeed) {
      gameSpeed.addEventListener('change', (e) => {
        this.updateSetting('gameSpeed', e.target.value);
      });
    }
    
    // Notifications
    const notifications = document.getElementById('notifications');
    if (notifications) {
      notifications.addEventListener('change', (e) => {
        this.updateSetting('notifications', e.target.checked);
      });
    }
    
    // UI scale
    const uiScale = document.getElementById('ui-scale');
    if (uiScale) {
      uiScale.addEventListener('change', (e) => {
        this.updateSetting('uiScale', e.target.value);
      });
    }
    
    // Haptic feedback
    const hapticFeedback = document.getElementById('haptic-feedback');
    if (hapticFeedback) {
      hapticFeedback.addEventListener('change', (e) => {
        this.updateSetting('hapticFeedback', e.target.checked);
      });
    }
    
    // Tooltips
    const tooltips = document.getElementById('tooltips');
    if (tooltips) {
      tooltips.addEventListener('change', (e) => {
        this.updateSetting('tooltips', e.target.checked);
      });
    }
  }

  /**
   * Setup viewport meta tag for mobile optimization
   */
  setupViewport() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';
  }

  /**
   * Setup touch controls for mobile devices
   */
  setupTouchControls() {
    const gameWindow = this.gameWindow;
    let lastTap = 0;

    // Touch start
    gameWindow.addEventListener('touchstart', (e) => {
      e.preventDefault();
      
      const touches = e.touches;
      const now = Date.now();
      
      if (touches.length === 1) {
        // Single touch - potential tap or pan start
        this.touchState.startX = touches[0].clientX;
        this.touchState.startY = touches[0].clientY;
        this.touchState.startTime = now;
        this.touchState.isPanning = false;
        this.touchState.isSwipeCandidate = false;
        
        // Check if touch started near bottom edge for swipe gesture
        if (touches[0].clientY > window.innerHeight * 0.8) {
          this.touchState.isSwipeCandidate = true;
        }
        
        // Double tap detection
        if (now - lastTap < 300) {
          this.handleDoubleTap(touches[0]);
        }
        lastTap = now;
        
      } else if (touches.length === 2) {
        // Two finger touch - zoom start
        this.touchState.isZooming = true;
        this.touchState.lastTouchDistance = this.getTouchDistance(touches[0], touches[1]);
      }
    }, { passive: false });

    // Touch move
    gameWindow.addEventListener('touchmove', (e) => {
      // Only prevent default for game canvas, not UI elements
      const target = e.target;
      if (target && target.tagName === 'CANVAS') {
        e.preventDefault();
      }
      
      const touches = e.touches;
      
      if (touches.length === 1 && !this.touchState.isZooming) {
        // Single finger pan
        const deltaX = touches[0].clientX - this.touchState.startX;
        const deltaY = touches[0].clientY - this.touchState.startY;
        
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
          this.touchState.isPanning = true;
          this.handleTouchPan(deltaX, deltaY);
        }
        
      } else if (touches.length === 2) {
        // Two finger zoom
        const distance = this.getTouchDistance(touches[0], touches[1]);
        const scale = distance / this.touchState.lastTouchDistance;
        
        this.handleTouchZoom(scale);
        this.touchState.lastTouchDistance = distance;
      }
    }, { passive: false });

    // Touch end
    gameWindow.addEventListener('touchend', (e) => {
      e.preventDefault();
      
      if (e.touches.length === 0) {
        // All fingers lifted
        if (!this.touchState.isPanning && !this.touchState.isZooming) {
          // Check for swipe gesture
          if (this.touchState.isSwipeCandidate && e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            const deltaY = this.touchState.startY - touch.clientY;
            const deltaTime = Date.now() - this.touchState.startTime;
            const velocity = deltaY / deltaTime;
            
            // Swipe up gesture to open stats (minimum 100px upward, within 500ms, sufficient velocity)
            if (deltaY > 100 && deltaTime < 500 && velocity > 0.3 && this.isMobile && !this.statsVisible) {
              this.toggleStatsPanel();
              this.hapticFeedback('medium');
              return;
            }
          }
          
          // Simple tap
          this.handleTouchTap(e.changedTouches[0]);
        }
        
        this.touchState.isZooming = false;
        this.touchState.isPanning = false;
        this.touchState.isSwipeCandidate = false;
      }
    }, { passive: false });
  }

  /**
   * Calculate distance between two touches
   */
  getTouchDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Handle touch tap (equivalent to mouse click)
   */
  handleTouchTap(touch) {
    // Check if touch is on UI elements (avoid game interaction issues)
    const touchedElement = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // If touched element is a UI button or panel, don't dispatch to game
    if (touchedElement && (
      touchedElement.closest('.ui-button') ||
      touchedElement.closest('#title-bar') ||
      touchedElement.closest('#stats-panel') ||
      touchedElement.closest('#info-panel') ||
      touchedElement.closest('#ui-toolbar')
    )) {
      return; // Let the UI handle this touch
    }
    
    // The InputManager will handle coordinate conversion automatically
    // Just dispatch the original touch event as a mouse event for game interaction
    const mouseEvent = new MouseEvent('click', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      bubbles: true
    });
    
    this.gameWindow.dispatchEvent(mouseEvent);
  }

  /**
   * Handle double tap (zoom to selection)
   */
  handleDoubleTap(touch) {
    // Zoom to tapped location
    if (window.game && window.game.cameraManager) {
      window.game.cameraManager.zoomToPoint(touch.clientX, touch.clientY);
    }
  }

  /**
   * Handle touch pan (camera movement)
   */
  handleTouchPan(deltaX, deltaY) {
    if (window.game && window.game.cameraManager) {
      window.game.cameraManager.pan(-deltaX * 0.01, deltaY * 0.01);
    }
  }

  /**
   * Handle touch zoom (pinch to zoom)
   */
  handleTouchZoom(scale) {
    if (window.game && window.game.cameraManager) {
      // Fix: Reverse the zoom logic - pinch out (scale > 1) should zoom in, pinch in (scale < 1) should zoom out
      const zoomFactor = scale > 1 ? 1.05 : 0.95;
      window.game.cameraManager.zoom(zoomFactor);
    }
  }

  /**
   * Handle window resize and orientation changes
   */
  handleResize() {
    const wasPortrait = this.orientation === 'portrait';
    this.orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    
    // Update device detection on resize
    this.detectDevice();
    
    // Handle orientation change
    if (wasPortrait !== (this.orientation === 'portrait')) {
      this.handleOrientationChange();
    }
    
    // Update game renderer size
    if (window.game) {
      window.game.onResize();
    }
    
    // Update UI layout
    this.updateUILayout();
  }

  /**
   * Handle orientation change
   */
  handleOrientationChange() {
    document.body.classList.toggle('portrait', this.orientation === 'portrait');
    document.body.classList.toggle('landscape', this.orientation === 'landscape');
    
    // Close info panel on orientation change
    if (this.isMobile) {
      this.hideInfoPanel();
    }
  }

  /**
   * Update UI layout based on screen size
   */
  updateUILayout() {
    const infoPanel = document.getElementById('info-panel');
    const toolbar = document.getElementById('ui-toolbar');
    
    if (this.isMobile) {
      // Mobile layout adjustments
      toolbar.classList.add('mobile-toolbar');
      infoPanel.classList.add('mobile-panel');
    } else {
      // Desktop layout
      toolbar.classList.remove('mobile-toolbar');
      infoPanel.classList.remove('mobile-panel');
    }
  }

  /**
   * Enhanced info panel management
   */
  showInfoPanel() {
    const infoPanel = document.getElementById('info-panel');
    infoPanel.classList.add('visible');
    
    // Add backdrop for mobile only when info panel actually has content
    if (this.isMobile && infoPanel.innerHTML.trim()) {
      this.createBackdrop();
    }
  }

  hideInfoPanel() {
    const infoPanel = document.getElementById('info-panel');
    infoPanel.classList.remove('visible');
    this.removeBackdrop();
  }

  /**
   * Create backdrop for mobile modals
   */
  createBackdrop() {
    let backdrop = document.getElementById('mobile-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'mobile-backdrop';
      backdrop.className = 'mobile-backdrop';
      backdrop.onclick = () => this.hideInfoPanel();
      document.body.appendChild(backdrop);
    }
    backdrop.classList.add('visible');
  }

  removeBackdrop() {
    const backdrop = document.getElementById('mobile-backdrop');
    if (backdrop) {
      backdrop.classList.remove('visible');
    }
  }

  /**
   * Initialize statistics tracking
   */
  initializeStatsTracking() {
    // Update stats every few seconds
    setInterval(() => {
      if (window.game && window.game.city) {
        this.updateStatistics();
      }
    }, 2000);
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    const savedSettings = localStorage.getItem('citySimSettings');
    if (savedSettings) {
      this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      this.applySettings();
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    localStorage.setItem('citySimSettings', JSON.stringify(this.settings));
  }

  /**
   * Apply current settings to the game
   */
  applySettings() {
    // Apply UI scale
    document.documentElement.style.fontSize = `${16 * this.settings.uiScale}px`;
    
    // Apply other settings
    if (window.game) {
      // Game speed would be applied to simulation
      // Audio settings would be applied to audio manager
      // etc.
    }
    
    // Update UI elements
    this.updateSettingsUI();
  }

  /**
   * Update settings UI elements
   */
  updateSettingsUI() {
    document.getElementById('master-volume').value = this.settings.masterVolume;
    document.getElementById('master-volume-display').textContent = `${this.settings.masterVolume}%`;
    document.getElementById('sound-effects').checked = this.settings.soundEffects;
    document.getElementById('auto-save').checked = this.settings.autoSave;
    document.getElementById('game-speed').value = this.settings.gameSpeed;
    document.getElementById('notifications').checked = this.settings.notifications;
    document.getElementById('ui-scale').value = this.settings.uiScale;
    document.getElementById('haptic-feedback').checked = this.settings.hapticFeedback;
    document.getElementById('tooltips').checked = this.settings.tooltips;
  }

  /**
   * Update a setting value
   */
  updateSetting(key, value) {
    this.settings[key] = value;
    this.saveSettings();
    this.applySettings();

    // Show feedback
    this.showNotification(`설정이 저장되었습니다: ${key}`, 'success', 1500);
  }

  /**
   * Reset settings to default
   */
  resetSettings() {
    this.settings = {
      masterVolume: 50,
      soundEffects: true,
      autoSave: true,
      gameSpeed: 1,
      notifications: true,
      uiScale: 1,
      hapticFeedback: true,
      tooltips: true
    };
    this.saveSettings();
    this.applySettings();
    this.showNotification('설정이 기본값으로 복원되었습니다', 'info');
  }

  /**
   * Toggle statistics panel
   */
  toggleStatsPanel() {
    console.log('toggleStatsPanel called, current state:', this.statsVisible);
    
    this.statsVisible = !this.statsVisible;
    const panel = document.getElementById('stats-panel');
    
    console.log('Panel element:', panel);
    console.log('New state:', this.statsVisible);
    
    if (!panel) {
      console.error('Stats panel element not found!');
      return;
    }
    
    if (this.statsVisible) {
      panel.classList.add('visible');
      // Force style application for better reliability
      if (this.isMobile) {
        panel.style.transform = 'translateY(0)';
      } else {
        panel.style.transform = 'translateX(0)';
      }
      this.updateStatistics();
      
      if (this.isMobile) {
        this.createBackdrop('stats');
      }
      
      console.log('Panel opened, classes:', panel.className);
      console.log('Panel transform style:', panel.style.transform);
    } else {
      panel.classList.remove('visible');
      // Force style application for better reliability
      if (this.isMobile) {
        panel.style.transform = 'translateY(100%)';
      } else {
        panel.style.transform = 'translateX(100%)';
      }
      this.removeBackdrop();
      
      console.log('Panel closed, classes:', panel.className);
      console.log('Panel transform style:', panel.style.transform);
    }

    // Haptic feedback
    if (this.isMobile && this.settings.hapticFeedback) {
      this.hapticFeedback('light');
    }
  }

  /**
   * Toggle settings panel
   */
  toggleSettings() {
    this.settingsVisible = !this.settingsVisible;
    const panel = document.getElementById('settings-panel');
    
    if (this.settingsVisible) {
      panel.style.display = 'flex';
      this.updateSettingsUI();
    } else {
      panel.style.display = 'none';
    }

    // Haptic feedback
    if (this.isMobile && this.settings.hapticFeedback) {
      this.hapticFeedback('medium');
    }
  }

  /**
   * Update statistics display
   */
  updateStatistics() {
    if (!window.game || !window.game.city) return;

    const city = window.game.city;
    
    // Count buildings by type
    let residential = 0, commercial = 0, industrial = 0, roads = 0;
    let totalPowerUsage = 0;
    let totalJobs = 0, totalWorkers = 0;

    for (let x = 0; x < city.size; x++) {
      for (let y = 0; y < city.size; y++) {
        const tile = city.getTile(x, y);
        if (tile.building) {
          switch (tile.building.type) {
            case 'residential':
              residential++;
              break;
            case 'commercial':
              commercial++;
              totalJobs += tile.building.jobs?.maximum || 0;
              totalWorkers += tile.building.jobs?.workers?.length || 0;
              break;
            case 'industrial':
              industrial++;
              totalJobs += tile.building.jobs?.maximum || 0;
              totalWorkers += tile.building.jobs?.workers?.length || 0;
              break;
            case 'road':
              roads++;
              break;
          }
          
          if (tile.building.power) {
            totalPowerUsage += tile.building.power.required || 0;
          }
        }
      }
    }

    // Update display
    this.updateStatElement('residential-count', residential);
    this.updateStatElement('commercial-count', commercial);
    this.updateStatElement('industrial-count', industrial);
    this.updateStatElement('road-count', roads);
    this.updateStatElement('power-usage', `${totalPowerUsage} kW`);
    
    // Calculate employment rate
    const employmentRate = totalJobs > 0 ? Math.round((totalWorkers / totalJobs) * 100) : 0;
    this.updateStatElement('employment-rate', `${employmentRate}%`, employmentRate > 70 ? 'positive' : employmentRate > 40 ? 'warning' : 'negative');
    
    // Mock happiness and growth (would be calculated from actual game data)
    const happiness = Math.max(50, 100 - (Math.random() * 20));
    this.updateStatElement('happiness-level', `${Math.round(happiness)}%`, happiness > 80 ? 'positive' : happiness > 60 ? 'warning' : 'negative');
    
    const growth = (Math.random() - 0.5) * 10;
    this.updateStatElement('growth-rate', `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`, growth > 0 ? 'positive' : 'negative');
  }

  /**
   * Update a single statistic element
   */
  updateStatElement(id, value, colorClass = null) {
    const element = document.getElementById(id);
    if (element) {
      const wasValue = element.textContent;
      element.textContent = value;
      
      // Remove old color classes
      element.classList.remove('positive', 'negative', 'warning');
      
      // Add new color class
      if (colorClass) {
        element.classList.add(colorClass);
      }
      
      // Add update animation if value changed
      if (wasValue !== value) {
        element.classList.add('updated');
        setTimeout(() => {
          element.classList.remove('updated');
        }, 300);
      }
    }
  }

  /**
   * Enhanced backdrop creation with type support
   */
  createBackdrop(type = 'default') {
    let backdrop = document.getElementById('mobile-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'mobile-backdrop';
      backdrop.className = 'mobile-backdrop';
      document.body.appendChild(backdrop);
    }
    
    backdrop.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      switch (type) {
        case 'stats':
          if (this.statsVisible) {
            this.toggleStatsPanel();
          }
          break;
        default:
          this.hideInfoPanel();
          break;
      }
    };
    
    // Also handle touch events for mobile
    backdrop.ontouchend = (e) => {
      e.preventDefault();
      e.stopPropagation();
      switch (type) {
        case 'stats':
          if (this.statsVisible) {
            this.toggleStatsPanel();
          }
          break;
        default:
          this.hideInfoPanel();
          break;
      }
    };
    
    // Use the visible class instead of directly changing display
    backdrop.classList.add('visible');
  }

  /**
   * Add haptic feedback for supported devices
   */
  hapticFeedback(type = 'light') {
    if (!this.settings.hapticFeedback || !navigator.vibrate) return;
    
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate([30, 10, 30]);
        break;
    }
  }

  get gameWindow() {
    return document.getElementById('render-target');
  }

  showLoadingText() {
    document.getElementById('loading').style.visibility = 'visible';
  }

  hideLoadingText() {
    document.getElementById('loading').style.visibility = 'hidden';
  }

  /**
   * Shows the city name modal
   */
  showCityNameModal() {
    const modal = document.getElementById('city-name-modal');
    const input = document.getElementById('city-name-input');
    const startBtn = document.getElementById('start-game-btn');

    modal.style.display = 'flex';
    
    // Focus on input after animation
    setTimeout(() => {
      input.focus();
    }, 600);

    // Handle start button click
    startBtn.onclick = () => {
      this.startGameWithCityName();
    };

    // Handle Enter key in input
    input.onkeydown = (event) => {
      if (event.key === 'Enter') {
        this.startGameWithCityName();
      }
    };

    // Enable/disable start button based on input
    input.oninput = () => {
      const cityName = input.value.trim();
      startBtn.disabled = cityName.length === 0;
      
      if (cityName.length === 0) {
        startBtn.style.background = '#ccc';
        startBtn.style.cursor = 'not-allowed';
      } else {
        startBtn.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
        startBtn.style.cursor = 'pointer';
      }
    };

    // Initialize button state
    startBtn.disabled = true;
    startBtn.style.background = '#ccc';
    startBtn.style.cursor = 'not-allowed';
  }

  /**
   * Starts the game with the entered city name
   */
  startGameWithCityName() {
    const input = document.getElementById('city-name-input');
    const cityName = input.value.trim();

    if (cityName.length === 0) {
      // Shake animation for empty input
      input.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => {
        input.style.animation = '';
      }, 500);
      return;
    }

    // Hide modal with animation
    const modal = document.getElementById('city-name-modal');
    modal.style.animation = 'fadeOut 0.3s ease-out forwards';
    
    setTimeout(() => {
      modal.style.display = 'none';
      modal.style.animation = '';
      window.game.startGame(cityName);
    }, 300);
  }
  
  /**
   * Enhanced tool selection with haptic feedback
   * @param {*} event 
   */
  onToolSelected(event) {
    // Haptic feedback for mobile
    if (this.isMobile) {
      this.hapticFeedback('light');
    }

    // Deselect previously selected button and selected this one
    if (this.selectedControl) {
      this.selectedControl.classList.remove('selected');
    }
    this.selectedControl = event.target.closest('.ui-button');
    this.selectedControl.classList.add('selected');

    this.activeToolId = this.selectedControl.getAttribute('data-type');
    
    // Update ghost building for new tool
    if (window.game) {
      window.game.updateGhostBuilding();
    }
  }

  /**
   * Toggles the pause state of the game
   */
  togglePause() {
    // Haptic feedback for mobile
    if (this.isMobile) {
      this.hapticFeedback('medium');
    }

    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      document.getElementById('pause-button-icon').src = playIconUrl;
      document.getElementById('paused-text').style.visibility = 'visible';
    } else {
      document.getElementById('pause-button-icon').src = pauseIconUrl;
      document.getElementById('paused-text').style.visibility = 'hidden';
    }
  }

  /**
   * Enhanced title bar updates with budget
   */
  updateTitleBar(game) {
    document.getElementById('city-name').innerHTML = game.city.name;
    document.getElementById('population-counter').innerHTML = game.city.population;

    const date = new Date('1/1/2023');
    date.setDate(date.getDate() + game.city.simTime);
    document.getElementById('sim-time').innerHTML = date.toLocaleDateString();
    
    // Update budget (mock for now)
    const budget = 1000 + (game.city.simTime * 50) - (Math.random() * 200);
    const budgetElement = document.getElementById('budget-display');
    budgetElement.textContent = `$${Math.round(budget)}`;
    
    // Budget color coding
    budgetElement.classList.remove('low', 'medium', 'high');
    if (budget < 500) {
      budgetElement.classList.add('low');
    } else if (budget < 1500) {
      budgetElement.classList.add('medium');
    } else {
      budgetElement.classList.add('high');
    }
  }

  /**
   * Updates the info panel with the information in the object
   * @param {SimObject} object 
   */
  updateInfoPanel(object) {
    const infoElement = document.getElementById('info-panel')
    if (object) {
      infoElement.innerHTML = object.toHTML();
      this.showInfoPanel();
    } else {
      this.hideInfoPanel();
      infoElement.innerHTML = '';
    }
  }

  /**
   * Enhanced notification system with settings
   */
  showNotification(message, type = 'info', duration = 3000) {
    if (!this.settings.notifications) return;
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Position based on device type
    if (this.isMobile) {
      notification.style.position = 'fixed';
      notification.style.top = 'calc(var(--titlebar-height) + 20px)';
      notification.style.left = '20px';
      notification.style.right = '20px';
    } else {
      notification.style.position = 'fixed';
      notification.style.top = '80px';
      notification.style.right = '20px';
    }
    
    document.body.appendChild(notification);
    
    // Auto remove
    setTimeout(() => {
      notification.remove();
    }, duration);
    
    // Haptic feedback
    if (this.isMobile) {
      this.hapticFeedback(type === 'error' ? 'heavy' : 'light');
    }
  }
}

// Initialize UI when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing UI...');
    window.ui = new GameUI();
  });
} else {
  console.log('DOM already loaded, initializing UI...');
  window.ui = new GameUI();
}