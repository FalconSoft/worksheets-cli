import typescript from 'rollup-plugin-typescript2';

const pkg = require('./package.json');

const external = ['axios', 'sql-data-api', 'fs/promises', 'readline-sync', 'path', 'jspython-interpreter',
'datapipe-js', 'datapipe-js/string', 'datapipe-js/utils', 'datapipe-js/array', 'rimraf', 'rxjs',];

export default [{
  input: 'src/cli.ts',
  output: {
    file: pkg.bin,
    format: 'cjs',
    sourcemap: false,
    compact: true,
    banner: '#!/usr/bin/env node'
  },
  external: [...external, 'yargs', 'crypto-js/md5'],
  plugins: [
    typescript({
      clean: true,
      tsconfigOverride: {
        compilerOptions: {
          declaration:false
        }
      }
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
  external,
  plugins: [
    typescript({
      clean: true
    })
  ]
}];
