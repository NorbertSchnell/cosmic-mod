import 'source-map-support/register';
import { Server } from '@soundworks/core/server';
import pluginPlatformFactory from '@soundworks/plugin-platform/server';
import getConfig from './utils/getConfig';
import path from 'path';
import serveStatic from 'serve-static';
import compile from 'template-literal';


import controllerSchema from './schemas/controller';
import playerSchema from './schemas/player';
import layerSchema from './schemas/layer';

import ControllerExperience from './ControllerExperience.js';
import PlayerExperience from './PlayerExperience.js';

const ENV = process.env.ENV || 'default';
const config = getConfig(ENV);
const server = new Server();

// html template and static files (in most case, this should not be modified)
server.templateEngine = { compile };
server.templateDirectory = path.join('.build', 'server', 'tmpl');
server.router.use(serveStatic('public'));
server.router.use('build', serveStatic(path.join('.build', 'public')));
server.router.use('vendors', serveStatic(path.join('.vendors', 'public')));

server.stateManager.registerSchema('controller', controllerSchema);
server.stateManager.registerSchema('layer', layerSchema);
server.stateManager.registerSchema('player', playerSchema);

server.pluginManager.register('platform', pluginPlatformFactory, {}, []);

(async function launch() {
  try {
    await server.init(config, (clientType, config, httpRequest) => {
      return {
        clientType: clientType,
        app: {
          name: config.app.name,
          author: config.app.author,
        },
        env: {
          type: config.env.type,
          websockets: config.env.websockets,
          assetsDomain: config.env.assetsDomain,
        }
      };
    });

    const controllerExperience = new ControllerExperience(server, 'controller');
    const playerExperience = new PlayerExperience(server, 'player');

    await server.start();
    await controllerExperience.start();
    
    playerExperience.start();
  } catch (err) {
    console.error(err.stack);
  }
})();

process.on('unhandledRejection', (reason, p) => {
  console.log('> Unhandled Promise Rejection');
  console.log(reason);
});
