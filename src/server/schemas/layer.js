export default {
  index: {
    type: 'integer',
    default: null,
    nullable: true,
  },
  connected: {
    type: 'boolean',
    default: false,
  },
  enabled: {
    type: 'boolean',
    default: true,
  },
  pitchmod: {
    immediate: true,
    type: 'float',
    default: 0,
    min: -1,
    max: 1,
  },
  tempomod: {
    immediate: true,
    type: 'float',
    default: 0,
    min: -1,
    max: 1,
  },
  speedmod: {
    immediate: true,
    type: 'float',
    default: 0,
    min: -1,
    max: 1,
  },
  level: {
    immediate: true,
    type: 'float',
    default: 1,
    min: 0,
    max: 1,
  },
};
