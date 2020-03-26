/* eslint-disable no-param-reassign */

import * as shell from 'shelljs';
import * as path from 'path';
import * as fs from 'fs';
import * as glob from 'glob';
import * as proto from 'proto-parser';
import * as thrift from '@creditkarma/thrift-parser';

const repositoryReferMap: Record<string, number> = {};

function gitClone(repository: string, branch: string) {
  let repositoryUrl = repository.trim();
  if (repositoryUrl[repositoryUrl.length - 1] === '/') {
    repositoryUrl = repositoryUrl.slice(0, repositoryUrl.length - 1);
  }

  if (repositoryUrl.substr(-4) !== '.git') {
    throw new Error(`invalid repository url: '${repositoryUrl}'`);
  }

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

function getThriftFileMap(
  filename: string,
  tempDir: string,
  parentPath: string,
  fileMap: Record<string, string>
) {
  // absolute path
  let filePath = filename;
  // relative path
  if (filename[0] === '.') {
    filePath = path.join(path.dirname(parentPath), filename);
  }

  if (filePath in fileMap) return;
  const content = fs.readFileSync(path.resolve(tempDir, filePath), 'utf8');
  fileMap[filePath] = content;

  // parse content
  const document = thrift.parse(content);

  if (
    (document as thrift.ThriftErrors).type === thrift.SyntaxType.ThriftErrors
  ) {
    const error = (document as thrift.ThriftErrors).errors[0];
    const { start } = error.loc;
    const message = `${error.message}(${filename}:${start.line}:${start.column})`;
    throw new Error(message);
  }

  for (const statement of (document as thrift.ThriftDocument).body) {
    if (statement.type === thrift.SyntaxType.IncludeDefinition) {
      const includeFilePath = statement.path.value;
      getThriftFileMap(includeFilePath, tempDir, filePath, fileMap);
    }
  }
}

function getProtoFileMap(
  filename: string,
  tempDir: string,
  parentPath: string,
  fileMap: Record<string, string>
) {
  if (/google\/protobuf/.test(filename)) return;

  // absolute path
  let filePath = filename;
  // relative path
  if (filename[0] === '.') {
    filePath = path.join(path.dirname(parentPath), filename);
  }

  if (filePath in fileMap) return;
  const content = fs.readFileSync(path.resolve(tempDir, filePath), 'utf8');
  fileMap[filePath] = content;

  // parse content
  const document = proto.parse(content);
  if (
    (document as proto.ProtoError).syntaxType === proto.SyntaxType.ProtoError
  ) {
    const { line, message } = document as proto.ProtoError;
    const fullMessage = `${message}(${filePath}:${line}:0)`;
    throw new Error(fullMessage);
  }

  const { imports } = document as proto.ProtoDocument;
  if (imports && imports.length > 0) {
    imports.forEach(importPath => {
      getProtoFileMap(importPath, tempDir, filePath, fileMap);
    });
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
  outDir = 'idl'
) {
  if (typeof entryGlob !== 'string' || entryGlob === '') {
    throw new Error('invalid entryGlob');
  }

  const tempDir = gitClone(repository, branch);

  const filePaths = glob
    .sync(entryGlob as string, { cwd: tempDir })
    .filter((filePath: string) => /\.((thrift)|(proto))$/.test(filePath));

  if (filePaths.length === 0) {
    throw new Error(`no thrift or proto files match the glob: '${entryGlob}'`);
  }

  const fileMap: Record<string, string> = {};
  let error: Error | undefined;

  try {
    for (const entry of filePaths) {
      /* istanbul ignore else */
      if (/\.thrift$/.test(entry)) {
        getThriftFileMap(entry, tempDir, './index', fileMap);
      } else if (/\.proto$/.test(entry)) {
        getProtoFileMap(entry, tempDir, './index', fileMap);
      }
    }
  } catch (err) {
    error = err;
  }

  // wite valid files
  for (const filename of Object.keys(fileMap)) {
    const copyFilePath = path.resolve(process.cwd(), outDir, filename);
    writeFileSync(copyFilePath, fileMap[filename]);
  }

  // clean and throw error
  if (typeof error !== 'undefined') {
    repositoryReferMap[tempDir] -= 1;

    // delete the outDir when reference equals to 0
    /* istanbul ignore next */
    if (repositoryReferMap[tempDir] === 0) {
      shell.rm('-rf', tempDir);
    }

    throw error;
  } else {
    setTimeout(() => {
      repositoryReferMap[tempDir] -= 1;

      // delete the outDir when reference equals to 0
      /* istanbul ignore next */
      if (repositoryReferMap[tempDir] === 0) {
        shell.rm('-rf', tempDir);
      }
    }, 200);
  }
}
