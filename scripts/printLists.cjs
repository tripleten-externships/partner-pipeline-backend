const { createSystem } = require('@keystone-6/core/system');
const { getConfig } = require('@keystone-6/core/keystone');
const { createContext } = require('@keystone-6/core/context');
const config = require('../keystone').default;

(async () => {
  const resolvedConfig = getConfig(config);
  const { keystone } = await createSystem(resolvedConfig);
  const context = createContext(keystone, { skipAccessControl: true });
  console.log('Keystone lists:', Object.keys(context.query || {}).join(', '));
  process.exit(0);
})();