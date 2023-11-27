# esc - esbuild wrapper like tsc

esc is a command line tool that reads `compilerOptions` from `tsconfig.json` and builds the project via esbuild.

You can also pass options to esbuild by adding the option `esbuildOptions` to `tsconfig.json`.
This option must be of type `BuildOptions`.

# Usage

```sh
$ esc build
```

# Installation

```sh
$ npm i -g github:ikasoba/esc
```
