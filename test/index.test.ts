import 'mocha';
import { expect } from 'chai';
import fetchIdl from '../src';

const repository = 'git@github.com:lancewuz/fetch-idl.git';
const branch = 'feat-test';
const threshold = 9000;

describe('fetch idl', () => {
  it('should fail due to nonexistent repository', function nonexistentRepo() {
    this.timeout(threshold);
    try {
      fetchIdl(
        'git@github.com:lancewuz/nonexistent-repo.git/',
        branch,
        'index',
        'test/temp'
      );
    } catch (err) {
      return expect(err.message).to.includes(
        'Could not read from remote repository'
      );
    }

    throw new Error('no errors');
  });

  it('should fail due to no files match glob', function fetchThrift() {
    this.timeout(threshold);
    try {
      fetchIdl(repository, branch, 'test/idl/a/*.thrift', 'test/temp');
    } catch (err) {
      return expect(err.message).to.includes('match the glob');
    }

    throw new Error('no errors');
  });

  it('should fail due to invalid entryGlob', () => {
    try {
      fetchIdl(repository, branch, undefined as any, 'test/temp');
    } catch (err) {
      return expect(err.message).to.equal('invalid entryGlob');
    }

    throw new Error('no errors');
  });

  it('should fetch thrift files with glob', function fetchThrift() {
    this.timeout(threshold);
    fetchIdl(repository, branch, 'test/idl/!(error|index).thrift', 'test/temp');
  });

  it('should fetch thrift files', function fetchThrift() {
    this.timeout(threshold);
    fetchIdl(repository, branch, 'test/idl/index.thrift', 'test/temp');
  });

  it('should fetch thrift files with different branch', function fetchThrift() {
    this.timeout(threshold);
    fetchIdl(repository, 'master', 'test/idl/index.thrift', 'test/temp');
  });

  it('should fetch proto files', function fetchProto() {
    this.timeout(threshold);
    fetchIdl(repository, branch, 'test/idl/index.proto', 'test/temp');
  });

  it('should fail due to empty entryGlob', () => {
    try {
      fetchIdl(repository, branch, '', 'test/temp');
    } catch (err) {
      return expect(err.message).to.equal('invalid entryGlob');
    }

    throw new Error('no errors');
  });
});
