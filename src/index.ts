/* eslint-disable no-param-reassign */

import * as shell from 'shelljs';
import * as path from 'path';
import * as fs from 'fs';
import * as glob from 'glob';
// import * as proto from 'proto-parser';
import 'core-js/features/string/match-all';
// import * as thrift from '@creditkarma/thrift-parser';

const repositoryReferMap: Record<string, number> = {};

function getIncludePaths(text: string) {
  const regExp = /(?<!(\/\/|\/\*|#).*)(include|cpp_include|import)\s+(['"])(.*?)\3/g;
  const matches: any[] = Array.from(
    (text as any).matchAll(regExp) /* istanbul ignore next */ || []
  );
  const includePaths = matches.map(match => match[4]);
  return includePaths;
}

function gitClone(repository: string, branch: string) {
  let repositoryUrl = repository.trim();
  if (repositoryUrl[repositoryUrl.length - 1] === '/') {
    repositoryUrl = repositoryUrl.slice(0, repositoryUrl.length - 1);
  }

  // if (repositoryUrl.substr(-4) !== '.git') {
  //   throw new Error(`invalid repository url: '${repositoryUrl}'`);
  // }

  const repositoryName = (repositoryUrl.split('/').pop() as string).slice(
    0,
    -4
  );
  const minute = Math.floor(Date.now() / (1000 * 60));
  const tempDir = `${process.env.TMPDIR}git-${repositoryName}-${process.pid}-${minute}`;

  if (tempDir in repositoryReferMap) {
    repositoryReferMap[tempDir] += 1;
  } else {
    repositoryReferMap[tempDir] = 1;
  }

  // reuse the repository within a minute
  if (fs.existsSync(tempDir)) {
    return tempDir;
  }

  const command = `git clone ${repositoryUrl} ${tempDir} --depth=1 --quiet --branch ${branch}`;
  const result = shell.exec(command);

  if (result.code !== 0) {
    const stderr = result.stderr as string;

    /* istanbul ignore next */
    const message = stderr.split('fatal:')[1] || 'git clone failed';
    throw new Error(message);
  }

  return tempDir;
}

function getIdlFileMap(
  filename: string,
  tempDir: string,
  parentPath: string,
  fileMap: Record<string, string>
) {
  if (/^google\/protobuf/.test(filename)) {
    return;
  }

  // try relative path
  let filePath = path.join(path.dirname(parentPath), filename);
  let fullFilePath = path.resolve(tempDir, filePath);
  if (!fs.existsSync(fullFilePath)) {
    // try absolute path
    /* istanbul ignore else */
    if (filename[0] !== '.') {
      filePath = filename;
      fullFilePath = path.resolve(tempDir, filePath);
    }

    /* istanbul ignore next */
    if (!fs.existsSync(fullFilePath)) {
      // eslint-disable-next-line no-console
      console.log(`invalid refer path: ${filename}`);
      return;
    }
  }

  if (filePath in fileMap) return;
  const content = fs.readFileSync(fullFilePath, 'utf8');
  fileMap[filePath] = content;

  const includePaths = getIncludePaths(content);
  for (const includePath of includePaths) {
    getIdlFileMap(includePath, tempDir, filePath, fileMap);
  }
}

function makeDirectory(directoryName: string) {
  if (
    fs.existsSync(directoryName) &&
    fs.statSync(directoryName).isDirectory()
  ) {
    return;
  }

  const parts = directoryName.split(path.sep);
  let currentDirectory = parts.shift();

  parts.forEach(part => {
    currentDirectory = `${currentDirectory}${path.sep}${part}`;
    if (
      !fs.existsSync(currentDirectory) ||
      !fs.statSync(currentDirectory).isDirectory()
    ) {
      fs.mkdirSync(currentDirectory);
    }
  });
}

function writeFileSync(filename: string, content: string | Buffer) {
  const directoryName = path.dirname(filename);
  makeDirectory(directoryName);
  fs.writeFileSync(filename, content);
}

export default function fetchIdl(
  repository: string,
  branch: string,
  entryGlob: string,
  /* istanbul ignore next */
  outDir = 'idl',
  /* istanbul ignore next */
  rootDir = '.'
) {
  if (typeof entryGlob !== 'string' || entryGlob === '') {
    throw new Error('invalid entryGlob');
  }

  const tempDir = gitClone(repository, branch);
  const idlRootDir = path.resolve(tempDir, rootDir);

  const filePaths = glob
    .sync(entryGlob as string, { cwd: idlRootDir })
    .filter((filePath: string) => /\.((thrift)|(proto))$/.test(filePath));

  if (filePaths.length === 0) {
    throw new Error(`no thrift or proto files match the glob: '${entryGlob}'`);
  }

  const fileMap: Record<string, string> = {};

  for (const entry of filePaths) {
    getIdlFileMap(entry, idlRootDir, './index', fileMap);
  }

  // wite valid files
  for (const filename of Object.keys(fileMap)) {
    const copyFilePath = path.resolve(process.cwd(), outDir, filename);
    writeFileSync(copyFilePath, fileMap[filename]);
  }

  let commitMessge = 'get the last git commit message failed';
  const result = shell.exec('git log -1');
  if (result.code === 0) {
    commitMessge = result.stdout;
  }

  // // clean and throw error
  // if (typeof error !== 'undefined') {
  //   repositoryReferMap[tempDir] -= 1;

  //   // delete the outDir when reference equals to 0
  //   /* istanbul ignore next */
  //   if (repositoryReferMap[tempDir] === 0) {
  //     shell.rm('-rf', tempDir);
  //   }

  //   throw error;
  // }

  setTimeout(() => {
    repositoryReferMap[tempDir] -= 1;

    // delete the outDir when reference equals to 0
    /* istanbul ignore next */
    if (repositoryReferMap[tempDir] === 0) {
      shell.rm('-rf', tempDir);
    }
  }, 200);

  return {
    commit: commitMessge,
  };
}
