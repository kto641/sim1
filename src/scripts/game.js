import * as THREE from 'three';
import { AssetManager } from './assets/assetManager.js';
import { CameraManager } from './camera.js';
import { InputManager } from './input.js';
import { City } from './sim/city.js';
import { SimObject } from './sim/simObject.js';

/** 
 * Manager for the Three.js scene. Handles rendering of a `City` object
 */
export class Game {
  /**
   * @type {City}
   */
  city;
  /**
   * Object that currently hs focus
   * @type {SimObject | null}
   */
  focusedObject = null;
  /**
   * Class for managing user input
   * @type {InputManager}
   */
  inputManager;
  /**
   * Object that is currently selected
   * @type {SimObject | null}
   */
  selectedObject = null;
  /**
   * Ghost building that follows the mouse cursor
   * @type {THREE.Group | null}
   */
  ghostBuilding = null;
  /**
   * Current ghost building type
   * @type {string | null}
   */
  ghostBuildingType = null;

  constructor(city) {
    this.city = city;

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true
    });
    this.scene = new THREE.Scene();

    this.inputManager = new InputManager(window.ui.gameWindow);
    this.cameraManager = new CameraManager(window.ui.gameWindow);

    // Configure the renderer
    this.renderer.setSize(window.ui.gameWindow.clientWidth, window.ui.gameWindow.clientHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    // Add the renderer to the DOM
    window.ui.gameWindow.appendChild(this.renderer.domElement);

    // Variables for object selection
    this.raycaster = new THREE.Raycaster();

    /**
     * Global instance of the asset manager
     */
    window.assetManager = new AssetManager(() => {
      window.ui.hideLoadingText();
      window.ui.showCityNameModal();
    });

    window.addEventListener('resize', this.onResize.bind(this), false);
  }

  /**
   * Initalizes the scene, clearing all existing assets
   */
  initialize(city) {
    this.scene.clear();
    this.scene.add(city);
    this.#setupLights();
    this.#setupGrid(city);
  }

  #setupGrid(city) {
    // Add the grid
    const gridMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000,
      map: window.assetManager.textures['grid'],
      transparent: true,
      opacity: 0.2
    });
    gridMaterial.map.repeat = new THREE.Vector2(city.size, city.size);
    gridMaterial.map.wrapS = city.size;
    gridMaterial.map.wrapT = city.size;

    const grid = new THREE.Mesh(
      new THREE.BoxGeometry(city.size, 0.1, city.size),
      gridMaterial
    );
    grid.position.set(city.size / 2 - 0.5, -0.04, city.size / 2 - 0.5);
    this.scene.add(grid);
  }

  /**
   * Setup the lights for the scene
   */
  #setupLights() {
    const sun = new THREE.DirectionalLight(0xffffff, 2)
    sun.position.set(-10, 20, 0);
    sun.castShadow = true;
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -20;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 50;
    sun.shadow.normalBias = 0.01;
    this.scene.add(sun);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  }
  
  /**
   * Starts the game with the given city name
   * @param {string} cityName 
   */
  startGame(cityName) {
    this.city = new City(16, cityName);
    this.initialize(this.city);
    this.start();
    setInterval(this.simulate.bind(this), 1000);
  }

  /**
   * Starts the renderer
   */
  start() {
    this.renderer.setAnimationLoop(this.draw.bind(this));
  }

  /**
   * Stops the renderer
   */
  stop() {
    this.renderer.setAnimationLoop(null);
  }

  /**
   * Render the contents of the scene
   */
  draw() {
    this.city.draw();
    this.updateFocusedObject();
    this.updateGhostBuilding();

    if (this.inputManager.isLeftMouseDown) {
      this.useTool();
    }

    this.renderer.render(this.scene, this.cameraManager.camera);
  }

  /**
   * Moves the simulation forward by one step
   */
  simulate() {
    if (window.ui.isPaused) return;

    // Update the city data model first, then update the scene
    this.city.simulate(1);

    window.ui.updateTitleBar(this);
    window.ui.updateInfoPanel(this.selectedObject);
  }

  /**
   * Uses the currently active tool
   */
  useTool() {
    switch (window.ui.activeToolId) {
      case 'select':
        this.updateSelectedObject();
        window.ui.updateInfoPanel(this.selectedObject);
        break;
      case 'bulldoze':
        if (this.focusedObject) {
          const { x, y } = this.focusedObject;
          this.city.bulldoze(x, y);
        }
        break;
      default:
        if (this.focusedObject) {
          const { x, y } = this.focusedObject;
          // Temporarily hide ghost building during placement
          const wasGhostVisible = this.ghostBuilding?.visible;
          if (this.ghostBuilding) {
            this.ghostBuilding.visible = false;
          }
          
          this.city.placeBuilding(x, y, window.ui.activeToolId);
          
          // Restore ghost building visibility after a short delay
          if (this.ghostBuilding && wasGhostVisible) {
            setTimeout(() => {
              if (this.ghostBuilding) {
                this.ghostBuilding.visible = true;
              }
            }, 50);
          }
        }
        break;
    }
  }
  
  /**
   * Sets the currently selected object and highlights it
   */
  updateSelectedObject() {
    this.selectedObject?.setSelected(false);
    this.selectedObject = this.focusedObject;
    this.selectedObject?.setSelected(true);
  }

  /**
   * Sets the object that is currently highlighted
   */
  updateFocusedObject() {  
    this.focusedObject?.setFocused(false);
    const newObject = this.#raycast();
    if (newObject !== this.focusedObject) {
      this.focusedObject = newObject;
    }
    this.focusedObject?.setFocused(true);
  }

  /**
   * Gets the mesh currently under the the mouse cursor. If there is nothing under
   * the the mouse cursor, returns null
   * @param {MouseEvent} event Mouse event
   * @returns {THREE.Mesh | null}
   */
  #raycast() {
    var coords = {
      x: (this.inputManager.mouse.x / this.renderer.domElement.clientWidth) * 2 - 1,
      y: -(this.inputManager.mouse.y / this.renderer.domElement.clientHeight) * 2 + 1
    };

    this.raycaster.setFromCamera(coords, this.cameraManager.camera);

    let intersections = this.raycaster.intersectObjects(this.city.root.children, true);
    if (intersections.length > 0) {
      // The SimObject attached to the mesh is stored in the user data
      const selectedObject = intersections[0].object.userData;
      return selectedObject;
    } else {
      return null;
    }
  }

  /**
   * Resizes the renderer to fit the current game window
   */
  onResize() {
    this.cameraManager.resize(window.ui.gameWindow);
    this.renderer.setSize(window.ui.gameWindow.clientWidth, window.ui.gameWindow.clientHeight);
  }

  /**
   * Checks if the current tool is a building tool
   * @param {string} toolId 
   * @returns {boolean}
   */
  isBuildingTool(toolId) {
    return toolId && toolId !== 'select' && toolId !== 'bulldoze';
  }

  /**
   * Creates a ghost building for the specified building type
   * @param {string} buildingType 
   */
  createGhostBuilding(buildingType) {
    this.removeGhostBuilding();

    const ghostGroup = new THREE.Group();
    
    // Create a temporary simObject for the ghost building
    const tempSimObject = new SimObject();
    
    // Create the ghost building mesh based on building type
    let ghostMesh;
    
    if (buildingType === 'road') {
      // For roads, use a simple straight road model
      ghostMesh = window.assetManager.getModel('road-straight', tempSimObject, true);
    } else if (buildingType === 'power-plant') {
      ghostMesh = window.assetManager.getModel('power-plant', tempSimObject, true);
    } else if (buildingType === 'power-line') {
      ghostMesh = window.assetManager.getModel('power-line', tempSimObject, true);
    } else {
      // For zones, use under-construction model as preview
      ghostMesh = window.assetManager.getModel('under-construction', tempSimObject, true);
    }

    // Make the ghost building semi-transparent and tinted
    ghostMesh.traverse((obj) => {
      if (obj.material) {
        obj.material.transparent = true;
        obj.material.opacity = 0.7;
        obj.material.color = new THREE.Color(0x00ff00); // Green by default (valid placement)
      }
    });

    // Set ghost building to a different layer to avoid raycasting interference
    ghostMesh.layers.set(1);
    
    ghostGroup.add(ghostMesh);
    this.ghostBuilding = ghostGroup;
    this.ghostBuildingType = buildingType;
    this.scene.add(this.ghostBuilding);
  }

  /**
   * Updates the ghost building position and appearance
   */
  updateGhostBuilding() {
    const currentTool = window.ui.activeToolId;

    // Show ghost building only for building tools
    if (this.isBuildingTool(currentTool)) {
      // Create ghost building if it doesn't exist or type changed
      if (!this.ghostBuilding || this.ghostBuildingType !== currentTool) {
        this.createGhostBuilding(currentTool);
      }

      // Update ghost building position to follow mouse
      if (this.ghostBuilding && this.focusedObject) {
        const tile = this.focusedObject;
        this.ghostBuilding.position.set(tile.x, 0, tile.y);

        // Check if placement is valid
        const isValidPlacement = tile && !tile.building;
        
        // Update ghost building color based on validity
        this.ghostBuilding.traverse((obj) => {
          if (obj.material) {
            if (isValidPlacement) {
              obj.material.color = new THREE.Color(0x00ff00); // Green for valid
            } else {
              obj.material.color = new THREE.Color(0xff0000); // Red for invalid
            }
          }
        });

        this.ghostBuilding.visible = true;
      } else if (this.ghostBuilding) {
        this.ghostBuilding.visible = false;
      }
    } else {
      // Remove ghost building for non-building tools
      this.removeGhostBuilding();
    }
  }

  /**
   * Removes the ghost building from the scene
   */
  removeGhostBuilding() {
    if (this.ghostBuilding) {
      this.scene.remove(this.ghostBuilding);
      this.ghostBuilding = null;
      this.ghostBuildingType = null;
    }
  }
}

// Create a new game when the window is loaded
window.onload = () => {
  window.game = new Game();
}