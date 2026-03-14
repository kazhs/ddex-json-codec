import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
  pack: {
    dts: {
      tsgo: true,
    },
    exports: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
