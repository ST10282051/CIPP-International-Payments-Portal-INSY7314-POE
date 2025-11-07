module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src/tests'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text'],
};
