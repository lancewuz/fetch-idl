/* eslint-disable */

import fetchIdl from '../src/index';

const repository = 'git@github.com:lancewuz/fetch-idl.git';
fetchIdl(repository, 'feat-test', ['a.proto'], `test/temp`).then(
  () => {
    console.log('#succ');
  },
  err => {
    console.log('#err', err);
  }
);
