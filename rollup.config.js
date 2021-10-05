import typescript from '@rollup/plugin-typescript'

import path from 'path'
import pkg from './package.json'

export default [
  {
    input: './src/index.ts',
    output: [
      {
        file: path.join(pkg.module),
        format: 'es',
        sourcemap: false,
      },
    ],
    plugins: [
      typescript({
        module: 'ESNEXT',
      }),
    ],
  },
  {
    input: './src/index.ts',
    output: [
      {
        file: path.join(pkg.main),
        format: 'cjs',
        sourcemap: false,
      },
    ],
    plugins: [
      typescript({
        module: 'ESNEXT',
      }),
    ],
  },
]
