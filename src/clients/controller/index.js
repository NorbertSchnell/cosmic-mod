import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { Client } from '@soundworks/core/client';
import initQoS from '@soundworks/template-helpers/client/init-qos.js';
import ControllerExperience from './ControllerExperience.js';

const config = window.soundworksConfig;
const container = document.querySelector('#__soundworks-container');

(async function launch() {
  try {
    const client = new Client();

    await client.init(config);
    initQoS(client);

    const experience = new ControllerExperience(client, config, container);
    document.body.classList.remove('loading');

    await client.start();
    experience.start();
  } catch (err) {
    console.error(err);
  }
})();

