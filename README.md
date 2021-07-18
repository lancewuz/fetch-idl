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

const repository = 'git@github.com:lancewuz/fetch-idl.git';
fetchIdl(repository, 'master', 'test/idl/!(error|index).thrift', `temp`, '.');

```

## API

### `fetchIdl(repository: string, branch: string, entryGlob: string, outDir: string, rootDir: string): { commit: string }`

fetch IDL files from `repository` and checkout to `branch`. Then parse the file and find the dependent files recursively, starting from `entryGlob` with `rootDir` as the root directory. In the end, write file contents to `outDir`. `repository` should conform to [git urls](https://git-scm.com/docs/git-clone#_git_urls_a_id_urls_a). `branch` should be "master" or other created branches. `entryGlob` is an array of an entry Thrift or Proto file, which usually contain a "service" type. `outDir` is a target output directory.
