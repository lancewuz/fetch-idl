const { rules: baseStyleRules } = require('eslint-config-airbnb-base/rules/style');

// https://eslint.org/docs/rules/no-restricted-syntax
// https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/style.js
const noRestrictedSyntax = baseStyleRules['no-restricted-syntax'];

// diable the restriction for ForInStatement and ForOfStatement
noRestrictedSyntax.splice(1, 2);

module.exports = {
  root: true,
  extends: [
    'airbnb-typescript/base',
    'prettier',
  ],
  parserOptions: {
    // https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/parser#parseroptionsproject
    project: ['./tsconfig.json', './test/tsconfig.json'],
  },
  rules: {
    'max-len': ['error', { 'code': 160, 'tabWidth': 2 }],
    'max-classes-per-file': 'off',
    'no-plusplus': 'off',
    'no-restricted-syntax': noRestrictedSyntax,
  }
};