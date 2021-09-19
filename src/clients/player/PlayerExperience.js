import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';
import { state } from 'lit-element';

const filterCoeffFast = 0.7;
const filterCoeffSlow = 0.9;
const marginRatio = 0.1;

function forceToZero(value) {
  if ((value > 0 && value < 0.001) || (value < 0 && value > -0.001))
    return 0;

  return value;
}

class TouchSlider {
  constructor(isRight) {
    this.isRight = isRight;

    this.id = null;
    this.x = 0;
    this.y = 0;
    this.value = 0;
    this.lastTime = null;
  }

  setTouch(id, x, y) {
    if (this.id === null) {
      this.id = id;
      this.x = x;
      this.y = y;
      return true;
    }

    return true;
  }

  resetTouch(id) {
    if (this.id === id) {
      this.id = null;
      return true;
    }

    return true;
  }

  moveTouch(id, x, y) {
    if (this.id === id) {
      this.x = x;
      this.y = y;
    }
  }

  isActive() {
    return (this.id !== null);
  }

  isIdle() {
    return (this.id !== null && this.value === 0);
  }

  set(value) {
    this.value = value;
  }

  reset() {
    return this.value = 0;
  }

  calculate(time, center, height, margin) {
    let filterCoeff;
    let value;

    if (this.id !== null) {
      const range = 0.5 * height - margin;
      let y = center - this.y;

      if (y > 0) {
        y = Math.min(range, Math.max(0, y - margin));
      } else {
        y = Math.max(-range, Math.min(0, y + margin));
      }

      value = y / range;
      filterCoeff = filterCoeffFast;
    } else {
      value = 0;
      filterCoeff = filterCoeffSlow;
    }

    if (this.lastTime !== null) {
      const dT = time - this.lastTime;
      const b = Math.pow(filterCoeff, dT / 20);
      const a = 1 - b;
      this.value = forceToZero(value * a + this.value * b)
    }

    this.lastTime = time;

    return this.value;
  }
}

class PlayerExperience extends AbstractExperience {
  constructor(client, config = {}, container) {
    super(client);

    this.config = config;
    this.container = container;

    this.platform = this.require('platform');

    this.canvas = null;
    this.width = null;
    this.height = null;
    this.centerX = null;
    this.centery = null;

    this.layerState = null;

    this.leftSlider = new TouchSlider(false);
    this.rightSlider = new TouchSlider(true);

    this.orientation = {
      beta: null,
      gamma: null,
      lastTime: null,
    };
    this.enableBeta = false;
    this.betaTouchId = null;

    document.body.classList.add('player');
    renderInitializationScreens(client, config, container);

    this.onAnimationFrame = this.onAnimationFrame.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onTouchstart = this.onTouchstart.bind(this);
    this.onTouchmove = this.onTouchmove.bind(this);
    this.onTouchend = this.onTouchend.bind(this);
    this.onDeviceOrientation = this.onDeviceOrientation.bind(this);
  }

  async start() {
    super.start();

    const layerIndex = parseInt(sessionStorage.getItem('layerIndex'));
    const playerState = await this.client.stateManager.create('player', { layerIndex });

    playerState.subscribe(async () => {
      const layerIndex = playerState.get('layerIndex');
      const layerId = playerState.get('layerId');

      if (layerId !== null) {
        sessionStorage.setItem('layerIndex', layerIndex);

        const body = this.container;
        const canvas = document.createElement('canvas');
        canvas.classList.add('player-canvas');
        body.appendChild(canvas);
        this.canvas = canvas;

        render(html`
          <div class="player-index">
            <span>${layerIndex + 1}</span>
          </div>
          <div class="player-overlay">
            <span>Layer ${layerIndex + 1}<br/>off</span>
          </div>`, this.container);

        this.indexElem = document.querySelector('.player-index');
        this.overlayElem = document.querySelector('.player-overlay');

        this.layerState = await this.client.stateManager.attach('layer', layerId);
        this.layerState.subscribe((updates) => this.updateLayer(updates));
        this.updateLayer();

        window.addEventListener('resize', this.onResize);

        canvas.addEventListener('touchstart', this.onTouchstart);
        canvas.addEventListener('touchmove', this.onTouchmove);
        canvas.addEventListener('touchend', this.onTouchend);
        canvas.addEventListener('touchcancel', this.onTouchend);

        window.addEventListener('deviceorientation', this.onDeviceOrientation);

        this.onResize();
        this.onAnimationFrame();
      } else {
        render(html`
          <div>:-( All layers connected...</div>
        `, this.container);
      }
    });
  }

  updateLayer(updates = this.layerState.getValues()) {
    const state = this.layerState;

    if (updates.enabled !== undefined) {
      if (updates.enabled) {
        this.overlayElem.classList.add('hidden');
      } else {
        this.overlayElem.classList.remove('hidden');
        this.resetValues();
      }
    }
  }

  toggleEnabled() {
    const state = this.layerState;
    const toggled = !state.get('enabled');
    state.set({ enabled: toggled });
  }

  resetValues() {
    const updates = {};

    this.resetSliders(updates);
    this.resetTilt(updates);
    this.layerState.set(updates);
  }

  updateValues() {
    const state = this.layerState;
    const enabled = state.get('enabled');

    if (enabled) {
      const time = performance.now();
      const updates = {};

      this.calculateSliders(time, updates);
      this.calculateTilt(time, updates);
      this.layerState.set(updates);
    }
  }

  resetSliders(updates) {
    updates.pitchmod = this.leftSlider.reset();
    updates.tempomod = this.rightSlider.reset();
  }

  calculateSliders(time, updates) {
    updates.pitchmod = this.leftSlider.calculate(time, this.centerY, this.height, this.margin);
    updates.tempomod = this.rightSlider.calculate(time, this.centerY, this.height, this.margin);
  }

  resetTilt(updates) {
    //updates.level = 1;
    updates.speedmod = 0;
  }

  calculateTilt(time, updates) {
    const orientation = this.orientation;

    if (this.enableBeta && orientation.lastTime !== null) {
      const beta = orientation.beta;
      let betaNorm = (60 - beta) / 30;
      betaNorm = Math.max(0, Math.min(1, betaNorm));

      const dT = time - orientation.lastTime;
      const b = Math.pow(filterCoeffFast, dT / 20);
      const a = 1 - b;
      const lastLevel = this.layerState.get('level');
      updates.level = forceToZero(betaNorm * a + lastLevel * b);
    }

    const gamma = -orientation.gamma;
    let gammaNorm = 0;

    if (gamma < -5) {
      gammaNorm = (-5 - gamma) / 25;
    } else if (gamma > 5) {
      gammaNorm = (5 - gamma) / 25;
    }

    updates.speedmod = Math.max(-1, Math.min(1, gammaNorm));

    orientation.lastTime = time;
  }

  onTouchstart(evt) {
    const fingers = this.fingers;
    const control = this.control;

    for (let touch of evt.changedTouches) {
      const id = touch.identifier;
      const x = touch.screenX - this.margin;
      const y = touch.screenY - this.margin;
      const isLeft = (x < this.centerX - 2 * this.margin);
      const isRight = (x > this.centerX + 2 * this.margin);

      if (isLeft) {
        this.leftSlider.setTouch(id, x, y);
      } else if (isRight) {
        this.rightSlider.setTouch(id, x, y);
      } else {
        this.enableBeta = true;
        this.betaTouchId = id;
      }
    }

    evt.preventDefault();
  }

  onTouchmove(evt) {
    for (let touch of evt.changedTouches) {
      const id = touch.identifier;
      const x = touch.screenX - this.margin;
      const y = touch.screenY - this.margin;
      this.leftSlider.moveTouch(id, x, y);
      this.rightSlider.moveTouch(id, x, y);
    }

    evt.preventDefault();
  }

  onTouchend(evt) {
    for (let touch of evt.changedTouches) {
      const id = touch.identifier;
      this.leftSlider.resetTouch(id);
      this.rightSlider.resetTouch(id);

      if (id === this.betaTouchId) {
        this.enableBeta = false;
        this.betaTouchId = null;
      }
    }

    evt.preventDefault();
  }

  onDeviceOrientation(e) {
    const orientation = this.orientation;
    orientation.beta = e.beta;
    orientation.gamma = e.gamma;

    this.updateValues();
  }

  onResize() {
    const bodyRect = this.container.getBoundingClientRect();
    const bodyWidth = bodyRect.width;
    const bodyHeight = bodyRect.height;
    const margin = marginRatio * 0.5 * Math.min(bodyWidth, bodyHeight)
    const width = bodyWidth - 2 * margin;
    const height = bodyHeight - 2 * margin;

    this.canvas.width = this.width = width;
    this.canvas.height = this.height = height;
    this.margin = margin;
    this.centerX = 0.5 * width;
    this.centerY = 0.5 * height;

    this.canvas.style.left = `${margin}px`;
    this.canvas.style.top = `${margin}px`;
    this.canvas.height = this.height = height;

    const indexStyle = this.indexElem.style;
    const indexWidth = 0.5 * bodyWidth - 2 * margin;
    const indexHeight = 0.5 * bodyHeight - 2 * margin;
    const indexMax = Math.max(indexWidth, indexHeight);
    indexStyle.fontSize = `${0.4 * indexMax}px`;
    indexStyle.lineHeight = `${0.4 * indexMax}px`;
    indexStyle.width = `${indexWidth}px`;
    indexStyle.height = `${indexHeight}px`;
    indexStyle.left = `${margin}px`;
    indexStyle.top = `${margin}px`;
  }

  onAnimationFrame() {
    const state = this.layerState;
    const width = this.width;
    const height = this.height;
    const margin = this.margin;
    const rangeX = 0.5 * width - margin;
    const rangeY = 0.5 * height - margin;

    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.width, this.height);

    // background
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 0, width, height);

    // left slider
    const leftValue = state.get('pitchmod');
    ctx.fillStyle = (this.leftSlider.isActive()) ? '#bbb' : '#999';
    if (leftValue > 0) {
      ctx.fillRect(0, this.centerY - margin, rangeX, -rangeY * leftValue, 20, 0);
    } else {
      ctx.fillRect(0, this.centerY + margin, rangeX, -rangeY * leftValue, 20, 0);
    }

    // right slider
    const rightValue = state.get('tempomod');
    ctx.fillStyle = (this.rightSlider.isActive()) ? '#bbb' : '#999';
    if (rightValue > 0) {
      ctx.fillRect(this.centerX + margin, this.centerY - margin, rangeX, -rangeY * rightValue);
    } else {
      ctx.fillRect(this.centerX + margin, this.centerY + margin, rangeX, -rangeY * rightValue);
    }

    // gamma background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, this.centerY - margin, 2 * width, 2 * margin);

    // gamma tilt
    const speedmod = state.get('speedmod');
    if (speedmod > 0) {
      ctx.fillStyle = '#bbb';
      ctx.fillRect(this.centerX + margin, this.centerY - margin, rangeX * speedmod, 2 * margin);
    } else {
      ctx.fillStyle = '#bbb';
      ctx.fillRect(this.centerX - margin, this.centerY - margin, rangeX * speedmod, 2 * margin);
    }

    // gamma frame
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, this.centerY - margin, 2 * width, 2 * margin);

    // beta background
    ctx.fillStyle = '#000';
    ctx.fillRect(this.centerX - margin, 0, 2 * margin, 2 * height);

    // beta tilt
    const level = state.get('level');
    if (level >= 0) {
      const enabled = state.get('enabled');
      ctx.fillStyle = (this.enableBeta && enabled) ? '#bbb' : '#777';
      ctx.fillRect(this.centerX - margin, height, 2 * margin, -height * level);
    }

    // beta frame
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.centerX - margin, 0, 2 * margin, height);

    // outer frame
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 3, height - 3);

    // labels
    ctx.fillStyle = '#fff';
    const fontSize = 24;
    ctx.font = `${fontSize}px sans-serif`;

    // beta tilt label
    ctx.save();
    ctx.translate(this.centerX + 6, this.centerY);
    ctx.rotate(-0.5 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('– level +', 0, 0);
    ctx.restore();

    // gamma tilt label
    ctx.textAlign = 'left';
    ctx.fillText('– motion', 12, this.centerY + 0.5 * fontSize - 5);
    ctx.textAlign = 'right';
    ctx.fillText('motion +', width - 12, this.centerY + 0.5 * fontSize - 5);

    // left slider label
    ctx.textAlign = 'left';
    ctx.fillText('+', 0 + 12, 0 + fontSize + 4);
    ctx.fillText('pitch', 0 + 12, 0 + 2 * fontSize + 4);
    ctx.fillText('pitch', 0 + 12, height - 2 * fontSize + 4);
    ctx.fillText('–', 0 + 12, height - fontSize + 4);

    // right slider label
    ctx.textAlign = 'right';
    ctx.fillText('+', width - 12, fontSize + 4);
    ctx.fillText('tempo', width - 12, 2 * fontSize + 4);
    ctx.fillText('tempo', width - 12, height - 2 * fontSize + 4);
    ctx.fillText('–', width - 12, height - fontSize + 4);

    window.requestAnimationFrame(this.onAnimationFrame);
  }
}

export default PlayerExperience;
