/** 
 * Manages mouse and keyboard input
 */
export class InputManager {
  /**
   * Last mouse position
   * @type {x: number, y: number}
   */
  mouse = { x: 0, y: 0 };
  /**
   * True if left mouse button is currently down
   * @type {boolean}
   */
  isLeftMouseDown = false;
  /**
   * True if the middle mouse button is currently down
   * @type {boolean}
   */
  isMiddleMouseDown = false;
  /**
   * True if the right mouse button is currently down
   * @type {boolean}
   */
  isRightMouseDown = false;

  constructor(gameWindow) {
    this.gameWindow = gameWindow;
    
    this.gameWindow.addEventListener('mousedown', this.#onMouseDown.bind(this), false);
    this.gameWindow.addEventListener('mouseup', this.#onMouseUp.bind(this), false);
    this.gameWindow.addEventListener('mousemove', this.#onMouseMove.bind(this), false);
    this.gameWindow.addEventListener('contextmenu', (event) => event.preventDefault(), false);

    this.gameWindow.addEventListener('touchstart', this.#onTouchStart.bind(this), false);
    this.gameWindow.addEventListener('touchend', this.#onTouchEnd.bind(this), false);
    this.gameWindow.addEventListener('touchmove', this.#onTouchMove.bind(this), false);
  }

  /**
   * Event handler for `mousedown` event
   * @param {MouseEvent} event 
   */
  #onMouseDown(event) {
    if (event.button === 0) {
      this.isLeftMouseDown = true;
    }
    if (event.button === 1) {
      this.isMiddleMouseDown = true;
    }
    if (event.button === 2) {
      this.isRightMouseDown = true;
    }
  }

  /**
   * Event handler for `mouseup` event
   * @param {MouseEvent} event 
   */
  #onMouseUp(event) {
    if (event.button === 0) {
      this.isLeftMouseDown = false;
    }
    if (event.button === 1) {
      this.isMiddleMouseDown = false;
    }
    if (event.button === 2) {
      this.isRightMouseDown = false;
    }
  }

  /**
   * Event handler for 'mousemove' event
   * @param {MouseEvent} event 
   */
  #onMouseMove(event) {
    this.isLeftMouseDown = event.buttons & 1;
    this.isRightMouseDown = event.buttons & 2;
    this.isMiddleMouseDown = event.buttons & 4;
    
    // Convert to game window relative coordinates
    const rect = this.gameWindow.getBoundingClientRect();
    this.mouse.x = event.clientX - rect.left;
    this.mouse.y = event.clientY - rect.top;
  }

  /**
   * Event handler for `touchstart` event
   * @param {TouchEvent} event 
   */
  #onTouchStart(event) {
    event.preventDefault();
    
    // Simulate left mouse button press
    if (event.touches.length === 1) {
      this.isLeftMouseDown = true;
      // Convert to game window relative coordinates
      const rect = this.gameWindow.getBoundingClientRect();
      this.mouse.x = event.touches[0].clientX - rect.left;
      this.mouse.y = event.touches[0].clientY - rect.top;
    }

    // Simulate middle mouse button press
    if (event.touches.length === 2) {
      this.isMiddleMouseDown = true;
    }
  }

  /**
   * Event handler for `touchend` event
   * @param {TouchEvent} event 
   */
  #onTouchEnd(event) {
    event.preventDefault();
    this.isLeftMouseDown = false;
    this.isMiddleMouseDown = false;
    this.isRightMouseDown = false;
  }

  /**
   * Event handler for `touchmove` event
   * @param {TouchEvent} event 
   */
  #onTouchMove(event) {
    event.preventDefault();
    
    // Get game window bounds for coordinate conversion
    const rect = this.gameWindow.getBoundingClientRect();
    
    // Handle 1-finger swipes
    if (event.touches.length === 1) {
      this.mouse.x = event.touches[0].clientX - rect.left;
      this.mouse.y = event.touches[0].clientY - rect.top;
    }

    // Handle 2-finger swipes
    if (event.touches.length === 2) {
      // In a 2-finger swipe, use the center point between the two fingers
      const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
      const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
      this.mouse.x = centerX - rect.left;
      this.mouse.y = centerY - rect.top;
    }
  }
}