import typescript from 'rollup-plugin-typescript2';
const pkg = require('./package.json');

export default {

  input: 'src/public-api.ts',
  output: {
    file: pkg.main,
    format: 'cjs',
    sourcemap: true,
  },
  plugins: [
    typescript()
  ],
  external: ['arg', 'fs', 'jspython-interpreter', 'http', 'https'],
  watch: {
    exclude: ['node_modules/**'],
    include: 'src/**'
  }
};
