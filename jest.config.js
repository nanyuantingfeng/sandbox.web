module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testRegex: '/__tests__/.*.spec.tsx?$',
  testPathIgnorePatterns: ['/node_modules/', '/fixtures/', '/models/', '/config/', '.d.ts', '.js', '/dist/'],
  collectCoverageFrom: ['src/**/**.{ts,tsx}'],
  collectCoverage: true,
  globals: {
    'ts-jest': {
      isolatedModules: true,
      diagnostics: {
        ignoreCodes: 'TS1192',
      },
    },
  },
}
