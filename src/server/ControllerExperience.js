import { AbstractExperience } from '@soundworks/core/server';
import { Client, Server } from 'node-osc';
import { console } from 'window-or-global';

const numLayers = 24;

const oscIp = '127.0.0.1';
const oscPort = 57120;

class ControllerExperience extends AbstractExperience {
  constructor(server, clientTypes, options = {}) {
    super(server, clientTypes);

    this.layers = []; // list of layers
    this.controllerState = null;
  }

  async start() {
    super.start();

    this.controllerState = await this.server.stateManager.create('controller', { myvalue: 77 });

    this.controllerState.subscribe((updates) => {
      for (let key in updates) {
        switch (key) {
          case 'myvalue': {
            break;
          }
        }
      }
    });

    const layerStateIds = [];

    // create layers
    for (let i = 0; i < numLayers; i++) {
      const layerState = await this.server.stateManager.create('layer', { index: i });
      const layer = this.createLayer(i, layerState);

      this.layers.push(layer);
      layerStateIds.push(layerState.id);
    }

    this.controllerState.set({ layerStates: layerStateIds });

    // compose couples from connecting players
    this.server.stateManager.observe(async (schemaName, nodeId) => {
      if (schemaName === 'player') {
        const playerState = await this.server.stateManager.attach(schemaName, nodeId);
        let layerIndex = playerState.get('layerIndex');

        // get a free couple and role for the player
        layerIndex = this.getFreeLayer(layerIndex);

        if (layerIndex !== null) {
          const layer = this.layers[layerIndex];
          const layerState = layer.state;

          console.log(`connecting player to layer ${layerIndex}`);

          // assign player to layer
          layer.player = playerState;

          // update player state
          playerState.set({
            layerIndex: layerIndex,
            layerId: layerState.id,
          });

          // mark layer as connected
          layer.state.set({ connected: true });

          playerState.onDetach(() => {
            // assign player from layer
            layer.player = null;

            console.log(`disconnecting player from layer ${layerIndex}`);

            // mark layer as disconnected
            layer.state.set({ connected: false });
          });
        } else {
          // update player state
          playerState.set({
            layerIndex: -1,
            layerId: null,
          });
        }
      }
    });

    this.osc = new Client(oscIp, oscPort);
    const oscServer = new Server(oscPort + 1, oscPort, () => {
      console.log('OSC Server is listening');
    });

    oscServer.on('message', (array) => {
      const addr = array[0].split('/').slice(1);
      const args = array.slice(1);
      const rootAddr = addr[0];

      switch (rootAddr) {
        case 'global': {
          const command = args[0];

          switch (command) {
            case 'get-current-values':
              this.sendAllValues();
              break;
          }

          break;
        }
        case 'layer': {
          const index = addr[1];
          const paramName = addr[2];
          const state = this.layers[index].state;

          switch (paramName) {
            case 'active':
              state.set({ active: (args[0] !== 0) });
              break;
            case 'level':
              state.set({ 'level': args[0] });
              break;
          }
        }
      }
    });
  }

  enter(client) {
    super.enter(client);
  }

  exit(client) {
    super.exit(client);
  }

  createLayer(index, state) {
    const layer = {
      index, // layer index
      state, // layer state
      player: null, // state of associated player
    };

    state.subscribe((updates) => this.sendValues(index, updates));

    return layer;
  }

  getFreeLayer(index) {
    if (index !== null) {
      // check whether layer at given index is free
      if (this.layers[index].player === null)
        return index;

      index = null;
    }

    for (let i = 0; i < numLayers; i++) {
      if (this.layers[i].player === null)
        return i;
    }

    return null;
  }

  sendAllValues() {
    for (let layer of this.layers) {
      const index = layer.index;
      const values = layer.state.getValues();
      this.sendValues(index, values);
    }
  }

  sendLayerValues(index) {
    const layer = this.layers[index];
    const values = layer.state.getValues();
    this.sendValues(index, values);
  }

  sendValues(index, updates) {
    for (let key in updates) {
      switch (key) {
        case 'connected':
          this.osc.send(`/layer/${index}/connected`, updates.connected + 0);
          break;
        case 'active':
          this.osc.send(`/layer/${index}/active`, updates.active + 0);
          break;
        case 'pitchmod':
          this.osc.send(`/layer/${index}/pitchmod`, updates.pitchmod);
          break;
        case 'tempomod':
          this.osc.send(`/layer/${index}/tempomod`, updates.tempomod);
          break;
        case 'speedmod':
          this.osc.send(`/layer/${index}/speedmod`, updates.speedmod);
          break;
        case 'level':
          this.osc.send(`/layer/${index}/level`, updates.level);
          break;
      }
    }
  }
}

export default ControllerExperience;
