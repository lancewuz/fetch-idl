import 'mocha';
import { expect } from 'chai';
import * as shell from 'shelljs';
import fetchIdl from '../src';

const repository = 'git@github.com:lancewuz/fetch-idl.git';
const branch = 'feat-test';
const threshold = 9000;

describe('fetch idl', () => {
  after(() => {
    const deleteFiles = `${process.env.TMPDIR}git-*`;
    shell.rm('-rf', deleteFiles);
  });

  it('should fail due to invalid repository', function invalidRepo() {
    this.timeout(threshold);
    try {
      fetchIdl(
        'git@github.com:lancewuz/invalid-repo/',
        branch,
        'index',
        'test/temp'
      );
    } catch (err) {
      return expect(err.message).to.includes('invalid repository url');
    }

    throw new Error('no errors');
  });

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

  it('should fail due to thrift file syntax error', () => {
    try {
      fetchIdl(repository, branch, 'test/idl/error.thrift', 'test/temp');
    } catch (err) {
      return expect(err.message).to.includes('FieldType expected but found');
    }

    throw new Error('no errors');
  });

  // this test should be placed at last
  it('should fail due to proto file syntax error', () => {
    try {
      fetchIdl(repository, branch, 'test/idl/error.proto', 'test/temp');
    } catch (err) {
      return expect(err.message).to.includes('illegal token');
    }

    throw new Error('no errors');
  });
});
