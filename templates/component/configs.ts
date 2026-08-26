import { VisualConfigs } from '@acrodata/visual-component-api';

export default {
  attr: { w: 300, h: 200 },

  config: {},

  apis: {
    source: {
      handler: 'render',
      description: '',
      fields: {},
    },
  },
  data: { source: [] },

  events: {},
  actions: {},
} as VisualConfigs;
