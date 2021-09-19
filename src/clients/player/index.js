import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { Client } from '@soundworks/core/client';
import initQoS from '@soundworks/template-helpers/client/init-qos.js';
import PlayerExperience from './PlayerExperience.js';

import pluginPlatformFactory from '@soundworks/plugin-platform/client';

const config = window.soundworksConfig;
const container = document.querySelector('#__soundworks-container');

const client = new Client();

pluginPlatformFactory.addFeatureDefinition({
  id: 'deviceorientation',
  initialize: async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      const result = await DeviceOrientationEvent.requestPermission();
      return (result === 'granted');
    }

    return false;
  },
});

(async function launch() {
  const client = new Client();
    
  client.pluginManager.register('platform', pluginPlatformFactory, {
    features: [
      ['deviceorientation'],
    ],
    msg: 'coucou',
  }, []);

  await client.init(config);
  initQoS(client);

  const experience = new PlayerExperience(client, config, container);
  document.body.classList.remove('loading');
 
  await client.start();
  experience.start();
})(); 
