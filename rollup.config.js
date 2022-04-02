import typescript from 'rollup-plugin-typescript2';

const pkg = require('./package.json');

export default [{
  input: 'src/cli.ts',
  output: {
    file: pkg.bin,
    format: 'cjs',
    sourcemap: false,
    compact: true,
    banner: '#!/usr/bin/env node'
  },
  plugins: [
    typescript({
      clean: true
    })
  ]
}, {
  input: 'src/public-api.ts',
  output: [
    {
      file: pkg.main,
      sourcemap: true,
      format: 'cjs'
    }
  ],
  plugins: [
    typescript({
      clean: true
    })
  ]
}];
