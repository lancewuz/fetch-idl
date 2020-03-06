module.exports = {

  // https://istanbul.js.org/docs/advanced/alternative-reporters/#cobertura
  reporter: ['cobertura', 'text'],
  include: ['src/*.ts'],
  'check-coverage': true,

  //https://github.com/istanbuljs/nyc#coverage-thresholds
  branches: 10,
  lines: 10,
  functions: 10,
  statements: 10,
};