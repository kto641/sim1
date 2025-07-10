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
  selectedControl = document.getElementById('button-select');
  /**
   * True if the game is currently paused
   * @type {boolean}
   */
  isPaused = false;

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
   * 
   * @param {*} event 
   */
  onToolSelected(event) {
    // Deselect previously selected button and selected this one
    if (this.selectedControl) {
      this.selectedControl.classList.remove('selected');
    }
    this.selectedControl = event.target;
    this.selectedControl.classList.add('selected');

    this.activeToolId = this.selectedControl.getAttribute('data-type');
  }

  /**
   * Toggles the pause state of the game
   */
  togglePause() {
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
   * Updates the values in the title bar
   * @param {Game} game 
   */
  updateTitleBar(game) {
    document.getElementById('city-name').innerHTML = game.city.name;
    document.getElementById('population-counter').innerHTML = game.city.population;

    const date = new Date('1/1/2023');
    date.setDate(date.getDate() + game.city.simTime);
    document.getElementById('sim-time').innerHTML = date.toLocaleDateString();
  }

  /**
   * Updates the info panel with the information in the object
   * @param {SimObject} object 
   */
  updateInfoPanel(object) {
    const infoElement = document.getElementById('info-panel')
    if (object) {
      infoElement.style.visibility = 'visible';
      infoElement.innerHTML = object.toHTML();
    } else {
      infoElement.style.visibility = 'hidden';
      infoElement.innerHTML = '';
    }
  }
}

window.ui = new GameUI();