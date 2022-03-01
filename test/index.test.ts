import 'mocha';
import { expect } from 'chai';
import fetchIdl from '../src';

const repo = 'git@github.com:lancewuz/fetch-idl.git';
const branch = 'feat-test';
const threshold = 9000;

describe('fetch idl', () => {
  it('should fail due to nonexistent repository', function nonexistentRepo() {
    this.timeout(threshold);
    try {
      fetchIdl({
        repo: 'git@github.com:lancewuz/nonexistent-repo.git/',
        branch,
        entryGlob: 'index',
        outDir: 'test/temp',
      });
    } catch (err) {
      expect(err.message).to.includes(
        'git clone git@github.com:lancewuz/nonexistent-repo.git'
      );
      return expect(err.message).to.includes(
        'Could not read from remote repository'
      );
    }

    throw new Error('no errors');
  });

  it('should fail due to no files match glob', function fetchThrift() {
    this.timeout(threshold);
    try {
      fetchIdl({
        repo,
        branch,
        entryGlob: 'test/idl/a/*.thrift',
        outDir: 'test/temp',
      });
    } catch (err) {
      return expect(err.message).to.includes('match the glob');
    }

    throw new Error('no errors');
  });

  it('should fail due to invalid entryGlob', () => {
    try {
      fetchIdl({
        repo,
        branch,
        entryGlob: undefined as any,
        outDir: 'test/temp',
      });
    } catch (err) {
      return expect(err.message).to.equal('invalid entryGlob');
    }

    throw new Error('no errors');
  });

  it('should fetch thrift files with glob', function fetchThrift() {
    this.timeout(threshold);
    fetchIdl({
      repo,
      branch,
      entryGlob: 'test/idl/!(error|index).thrift',
      outDir: 'test/temp',
    });
  });

  it('should fetch thrift files', function fetchThrift() {
    this.timeout(threshold);
    fetchIdl({
      repo,
      branch,
      entryGlob: 'test/idl/index.thrift',
      outDir: 'test/temp',
    });
  });

  it('should fetch thrift files with different branch', function fetchThrift() {
    this.timeout(threshold);
    fetchIdl({
      repo,
      branch: 'master',
      entryGlob: 'test/idl/index.thrift',
      outDir: 'test/temp',
    });
  });

  it('should fetch thrift files with commitId', function fetchThrift() {
    this.timeout(threshold);
    fetchIdl({
      repo,
      branch: 'master',
      entryGlob: 'test/idl/index.thrift',
      outDir: 'test/temp',
      commitId: 'e220f599438088ef12970',
    });
  });

  it('should fetch proto files', function fetchProto() {
    this.timeout(threshold);
    fetchIdl({
      repo,
      branch,
      entryGlob: 'test/idl/index.proto',
      outDir: 'test/temp',
    });
  });

  it('should fail due to empty entryGlob', () => {
    try {
      fetchIdl({ repo, branch, entryGlob: '', outDir: 'test/temp' });
    } catch (err) {
      return expect(err.message).to.equal('invalid entryGlob');
    }

    throw new Error('no errors');
  });
});
