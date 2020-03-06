/* eslint-disable */

import fetchIdl from '../src/index';

const repository = 'git@github.com:lancewuz/fetch-idl.git';
fetchIdl(repository, 'master', ['a.proto'], `${process.cwd()}/idl`).then(
  () => {
    console.log('#succ');
  },
  err => {
    console.log('#err', err);
  }
);
