/* eslint-disable */

import fetchIdl from '../src/index';

const repository = 'git@github.com:lancewuz/fetch-idl.git';
const res = fetchIdl(
  repository,
  'refactor-loose-dependent',
  'test/idl/index.proto',
  `test/temp`
);

console.log(res);
