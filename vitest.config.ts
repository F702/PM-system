import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: { tsconfigRaw: { compilerOptions: { experimentalDecorators: true, emitDecoratorMetadata: true } } },
  test: { include: ['src/**/*.spec.ts'], environment: 'node' }
})
