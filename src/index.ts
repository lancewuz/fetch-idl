/* eslint-disable no-param-reassign */

import * as shell from 'shelljs';
import * as path from 'path';
import * as fs from 'fs';
import * as glob from 'glob';
// import * as proto from 'proto-parser';
import 'core-js/features/string/match-all';
// import * as thrift from '@creditkarma/thrift-parser';

interface RepoCache {
  url: string;
  branch: string;
  time: number;
  dir: string;
}

const repoCacheSeconds = 30;
const repoCaches: RepoCache[] = [];
const fetchTempDir = `${process.env.TMPDIR}fetch-repo`;

function getIncludePaths(text: string) {
  const regExp = /(?<!(\/\/|\/\*|#).*)(include|cpp_include|import)\s+(['"])(.*?)\3/g;
  const matches: any[] = Array.from(
    (text as any).matchAll(regExp) /* istanbul ignore next */ || []
  );
  const includePaths = matches.map(match => match[4]);
  return includePaths;
}

function gitClone(repository: string, branch: string): string {
  let repositoryUrl = repository.trim();
  if (repositoryUrl[repositoryUrl.length - 1] === '/') {
    repositoryUrl = repositoryUrl.slice(0, repositoryUrl.length - 1);
  }

  const seconds = Math.floor(Date.now() / 1000);
  const cached = repoCaches.find(item => {
    return (
      item.url === repositoryUrl &&
      item.branch === branch &&
      seconds - item.time <= repoCacheSeconds
    );
  });

  if (cached) {
    cached.time = seconds;
    return cached.dir;
  }

  // Handle case: git@code.company.org:tic/idl.git
  const repositoryPath = repositoryUrl.split(':').pop() as string;
  const repositoryName = repositoryPath.replace('/', '_').slice(0, -4);
  const random = Math.floor(Math.random() * 1000);
  const tempDir = `${fetchTempDir}/git-fetch-${repositoryName}-${process.pid}-${seconds}-${random}`;

  if (fs.existsSync(tempDir)) {
    shell.exec(`rm -rf ${tempDir}`);
  }

  const command = `git clone ${repositoryUrl} ${tempDir} --depth=1 --quiet --branch ${branch}`;
  const result = shell.exec(command, { silent: true });

  if (result.code !== 0) {
    const stderr = result.stderr as string;

    /* istanbul ignore next */
    const message = stderr.split('fatal:')[1] || 'git clone failed';
    throw new Error(message);
  }

  repoCaches.push({
    url: repositoryUrl,
    branch,
    time: Math.floor(Date.now() / 1000),
    dir: tempDir,
  });
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

function clearCachedRepos() {
  if (fs.existsSync(fetchTempDir)) {
    const stats = fs.statSync(fetchTempDir);
    const seconds = (Date.now() - stats.mtimeMs) / 1000;
    // Delete Directory modified 1 hours ago
    if (seconds > 60 * 60 * 1) {
      shell.rm('-rf', fetchTempDir);
      fs.mkdirSync(fetchTempDir);
    }
  } else {
    fs.mkdirSync(fetchTempDir);
  }
}

export default function fetchIdl(
  repository: string,
  branch: string,
  entryGlob: string,
  /* istanbul ignore next */
  outDir = 'idl',
  /* istanbul ignore next */
  rootDir = '.',
) {
  if (typeof entryGlob !== 'string' || entryGlob === '') {
    throw new Error('invalid entryGlob');
  }

  clearCachedRepos();
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
  const result = shell.exec('git log -1', { silent: true });
  if (result.code === 0) {
    commitMessge = result.stdout;
  }

  return {
    commit: commitMessge,
  };
}
