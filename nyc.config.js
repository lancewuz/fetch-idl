module.exports = {

  // https://istanbul.js.org/docs/advanced/alternative-reporters/#cobertura
  reporter: ['cobertura', 'text'],
  include: ['src/*.ts'],
  'check-coverage': true,

  //https://github.com/istanbuljs/nyc#coverage-thresholds
  branches: 100,
  lines: 100,
  functions: 100,
  statements: 100,
};