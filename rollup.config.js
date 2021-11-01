import typescript from '@rollup/plugin-typescript'
import nodeResolve from '@rollup/plugin-node-resolve'
import pkg from './package.json'

const devDeps = Object.keys(pkg.devDependencies || {})
const deps = Object.keys(pkg.dependencies || {}).concat(devDeps).concat('fs/promises')

/** @type {import('rollup').RollupOptions} */
const config = [
  {
    input: 'src/plugin.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: pkg.module,
        format: 'es',
        sourcemap: true
      }
    ],
    external: (name, fpath) => /node_modules/.test(fpath) || deps.includes(name),
    plugins: [
      typescript({
        tsconfig: './tsconfig.json'
      }),
      nodeResolve(),
    ]
  }
]

export default config
