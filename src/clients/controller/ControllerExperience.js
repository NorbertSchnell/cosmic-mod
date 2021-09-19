import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

class ControllerExperience extends AbstractExperience {
  constructor(client, config, container) {
    super(client);

    this.container = container;

    this.layers = [];

    document.body.classList.add('controller');
    renderInitializationScreens(client, config, container);
  }

  async start() {
    super.start();

    render(html`
      <div id="controller-container"></div>
      <div id="layer-container"></div>
    `, this.container);

    this.controllerContainer = document.getElementById('controller-container');
    this.layerContainer = document.getElementById('layer-container');

    this.controllerState = await this.client.stateManager.attach('controller');
    this.controllerState.subscribe(() => this.renderController());
    this.renderController();

    this.layerStateIds = this.controllerState.get('layerStates');
    this.renderLayerFrames();

    for (let i = 0; i < this.layerStateIds.length; i++) {
      const id = this.layerStateIds[i];
      const state = await this.client.stateManager.attach('layer', id);

      const layer = this.createLayer(i, state);
      this.layers.push(layer);

      state.subscribe((updates) => this.renderLayer(layer, updates));
      this.renderLayer(layer);
    }
  }

  renderController() {
    render(html`
      <button class="controller-button" @click="${(e) => this.activateAll(true)}">enable all</button>
      <button class="controller-button" @click="${(e) => this.activateAll(false)}">disable all</button>
    `, this.controllerContainer);
  }

  activateAll(value) {
    for (let layer of this.layers) {
      this.setEnabled(layer, value);
      layer.state.set({ enabled: value });
    }
  }

  renderLayerFrames(width) {
    let layerFrameTemplates = [];

    for (let i = 0; i < this.layerStateIds.length; i++) {
      const frameId = 'layer-frame-' + i;

      layerFrameTemplates.push(html`
        <div id=${frameId} class="layer-frame">
          <div class="layer-label">
            Layer ${i + 1}
            <div class="layer-enabled" @click="${(e) => this.toggleEnabled(i)}"></div>
          </div>
          <div class="layer-box" @click="${(e) => this.toggleEnabled(i)}">
            <div class="layer-parameter">pitchmod: <span class="layer-parameter-value layer-left-slider-value">–</span></div>
            <div class="layer-parameter">tempomod: <span class="layer-parameter-value layer-right-slider-value">–</span></div>
            <div class="layer-parameter">speedmod: <span class="layer-parameter-value layer-gamma-tilt-value">–</span></div>
            <div class="layer-parameter">level: <span class="layer-parameter-value layer-beta-tilt-value">–</span></div>
          </div>
        </div>
      `);
    }

    render(html`${layerFrameTemplates}`, this.layerContainer);
  }

  createLayer(index, state) {
    const frameId = 'layer-frame-' + index;
    const frameElem = document.getElementById(frameId);
    const layer = {
      index,
      state,
      frameElem,
      labelElem: frameElem.querySelector(".layer-label"),
      enabledElem: frameElem.querySelector(".layer-enabled"),
      boxElem: frameElem.querySelector(".layer-box"),
      leftSliderElem: frameElem.querySelector(".layer-parameter-value.layer-left-slider-value"),
      rightSliderElem: frameElem.querySelector(".layer-parameter-value.layer-right-slider-value"),
      betaTiltElem: frameElem.querySelector(".layer-parameter-value.layer-beta-tilt-value"),
      gammaTiltElem: frameElem.querySelector(".layer-parameter-value.layer-gamma-tilt-value"),
    };

    return layer;
  }

  setConnected(layer, connected) {
    if (connected) {
      layer.labelElem.classList.add('connected');
    } else {
      layer.labelElem.classList.remove('connected');
    }

    const enabled = layer.state.get('enabled');
    this.setEnabled(layer, enabled);
  }

  setEnabled(layer, enabled) {
    const connected = layer.state.get('connected');

    if (enabled) {
      layer.enabledElem.innerHTML = '&times;';
    } else {
      layer.enabledElem.innerHTML = '';
    }

    if (enabled && connected) {
      layer.boxElem.classList.add('enabled');
    } else {
      layer.boxElem.classList.remove('enabled');
    }
  }

  renderLayer(layer, updates = null) {
    if (updates === null) {
      updates = layer.state.getValues();
    }

    for (let key in updates) {
      switch (key) {
        case 'connected':
          this.setConnected(layer, updates.connected);
          break;

        case 'enabled':
          this.setEnabled(layer, updates.enabled);
          break;

        case 'pitchmod':
          layer.leftSliderElem.innerHTML = updates.pitchmod.toFixed(2);
          break;

        case 'tempomod':
          layer.rightSliderElem.innerHTML = updates.tempomod.toFixed(2);
          break;

        case 'speedmod':
          layer.gammaTiltElem.innerHTML = updates.speedmod.toFixed(2);
          break;

          case 'level':
            layer.betaTiltElem.innerHTML = updates.level.toFixed(2);
            break;
        }
    }
  }

  toggleEnabled(layerIndex) {
    const layer = this.layers[layerIndex];
    const enabled = !layer.state.get('enabled');
    layer.state.set({ enabled });
  }
}

export default ControllerExperience;
