import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Plain Node by default. Component tests switch to jsdom with a
      // `// @vitest-environment jsdom` comment at the top of the file.
      environment: 'node',
      include: ['src/**/*.spec.ts', 'tests/**/*.spec.ts'],
    },
  }),
)
