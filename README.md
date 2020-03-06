# fetch-idl

Fetch Thrift or Proto files from [Git Repositories](https://git-scm.com/docs/git-clone#_git_urls_a_id_urls_a)

## Usage

### Install

```
npm install fetch-idl --save
```

### Call the api

```ts
import fetchIdl from 'fetch-idl'

const repository = '';
fetchIdl(repository, 'master', [''], '.').then(() => {
  console.log('fetch succeeded')
}, (err) => {
  console.log('fetch failed ', err);
});

```

## API

### `fetchIdl(repository: string, branch: string, entries: string[], directory: string): Promise<void>`

fetch IDL files from `repository` and checkout to `branch`. Then parse the file and find the dependent files recursively, starting from `entries`. In the end, write file contents to `directory`. `repository` should conform to [git urls](https://git-scm.com/docs/git-clone#_git_urls_a_id_urls_a). `branch` should be "master" or other created branches. `entries` is an array of an entry Thrift or Proto file, which usually contain a "service" type. `directory` is a target output directory.
