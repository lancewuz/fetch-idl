import 'mocha';
import { expect } from 'chai';
import fetchIdl from '../src';

const repository = 'git@github.com:lancewuz/fetch-idl.git';
const branch = 'feat-test';

describe('fetch idl', () => {
  it('should fail due to invalid repository', function() {
    this.timeout(8000);
    try {
      fetchIdl(
        'git@github.com:lancewuz/invalid-repo/',
        branch,
        ['index'],
        'test/temp'
      );
    } catch (err) {
      return expect(err.message).to.includes('invalid repository url');
    }

    throw new Error('no errors');
  });

  it('should fail due to nonexistent repository', function() {
    this.timeout(8000);
    try {
      fetchIdl(
        'git@github.com:lancewuz/nonexistent-repo.git/',
        branch,
        ['index'],
        'test/temp'
      );
    } catch (err) {
      return expect(err.message).to.includes(
        'Could not read from remote repository'
      );
    }

    throw new Error('no errors');
  });

  it('should fetch thrift files', function() {
    this.timeout(8000);
    fetchIdl(repository, branch, ['test/idl/index.thrift'], 'test/temp');
  });

  it('should fetch proto files', function() {
    this.timeout(8000);
    fetchIdl(repository, branch, ['test/idl/index.proto'], 'test/temp');
  });

  it('should fail due to invalid entries', () => {
    try {
      fetchIdl(repository, branch, [], 'test/temp');
    } catch (err) {
      return expect(err.message).to.equal('empty entries');
    }

    throw new Error('no errors');
  });

  it('should fail due to thrift file syntax error', () => {
    try {
      fetchIdl(repository, branch, ['test/idl/error.thrift'], 'test/temp');
    } catch (err) {
      return expect(err.message).to.includes('FieldType expected but found');
    }

    throw new Error('no errors');
  });

  // this test should be placed at last
  it('should fail due to proto file syntax error', () => {
    try {
      fetchIdl(repository, branch, ['test/idl/error.proto'], 'test/temp');
    } catch (err) {
      return expect(err.message).to.includes('illegal token');
    }

    throw new Error('no errors');
  });
});
