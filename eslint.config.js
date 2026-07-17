// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const reactCompiler = require('eslint-plugin-react-compiler');

module.exports = defineConfig([
  globalIgnores(['dist/*', 'src/supabase/functions/**']),
  expoConfig,
  reactCompiler.configs.recommended,
]);
