# fetch-idl [![CircleCI](https://circleci.com/gh/lancewuz/fetch-idl.svg?style=svg)](https://circleci.com/gh/lancewuz/fetch-idl) [![codecov](https://codecov.io/gh/lancewuz/fetch-idl/branch/master/graph/badge.svg)](https://codecov.io/gh/lancewuz/fetch-idl) [![npm version](https://img.shields.io/npm/v/fetch-idl.svg?style=flat)](https://www.npmjs.com/package/fetch-idl)

Fetch Thrift or Proto files from [Git Repositories](https://git-scm.com/docs/git-clone#_git_urls_a_id_urls_a)

## Usage

### Install

```
npm install fetch-idl --save
```

### Call the api

```ts
import fetchIdl from 'fetch-idl'

const repos = 'git@github.com:lancewuz/fetch-idl.git';
fetchIdl({ repo, branch: 'master', entryGlob: 'test/idl/!(error|index).thrift', outDir: `temp`, rootDir: '.' });

```

## API

### `fetchIdl(params: FetchPramas): { commit: string }`

fetch IDL files from repository, controlled by the FetchPramas:

```typescript
interface FetchParams {
  // The repository of idl files
  repo: string;
  // The branch of the repo
  branch: string;
  // The entry file path expressed by Glob
  entryGlob: string;
  // The output directory for idl files
  outDir?: string;
  // The root directory of the entryGlob
  rootDir?: string;
  // The commit id of the repo
  commitId?: string;
}
```
