/* eslint-disable */

import fetchIdl from '../src/index';

const repository = 'git@github.com:lancewuz/fetch-idl.git';
fetchIdl(repository, 'feat-test', ['test/idl/index.proto'], `test/temp`);
