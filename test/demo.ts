/* eslint-disable */

import fetchIdl from '../src/index';

const repository = 'git@github.com:lancewuz/fetch-idl.git';
fetchIdl(
  repository,
  'refactor-loose-dependent',
  'test/idl/index.proto',
  `test/temp`
);
