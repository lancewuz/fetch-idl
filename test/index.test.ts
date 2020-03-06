import 'mocha';
import { expect } from 'chai';
import fetchIdl from '../src';

const repository = 'git@github.com:lancewuz/fetch-idl.git';

describe('fetch idl', () => {
  it('should fetch thrift files', function() {
    this.timeout(8000);
    fetchIdl(repository, 'feat-test', ['test/idl/index.thrift'], 'test/temp');
  });

  it('should fetch proto files', () => {
    fetchIdl(repository, 'feat-test', ['test/idl/index.proto'], 'test/temp');
  });

  it('should fail due to invalid entries', () => {
    try {
      fetchIdl(repository, 'feat-test', [], 'test/temp');
    } catch (err) {
      return expect(err.message).to.equal('empty entries');
    }

    throw new Error('no errors');
  });

  it('should fail due to thrift file syntax error', () => {
    try {
      fetchIdl(repository, 'feat-test', ['test/idl/error.thrift'], 'test/temp');
    } catch (err) {
      return expect(err.message).to.includes('no such file or directory');
    }

    throw new Error('no errors');
  });

  it('should fail due to proto file syntax error', () => {
    try {
      fetchIdl(repository, 'feat-test', ['test/idl/error.proto'], 'test/temp');
    } catch (err) {
      return expect(err.message).to.includes('no such file or directory');
    }

    throw new Error('no errors');
  });
});
