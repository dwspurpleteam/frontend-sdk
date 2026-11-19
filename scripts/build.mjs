import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJsonPath = resolve(projectDir, 'package.json');
const distDir = resolve(projectDir, 'dist');
const args = process.argv.slice(2);
const sdkVersion = args.find((arg) => arg.startsWith('--sdk-version='))?.split('=', 2)[1]
  ?? process.env.SDK_VERSION;
const packageName = args.find((arg) => arg.startsWith('--package-name='))?.split('=', 2)[1]
  ?? process.env.PACKAGE_NAME;

if (!sdkVersion) {
  console.error('SDK version is required: npm run build -- --sdk-version=0.1.0');
  process.exit(1);
}

const sourcePackage = JSON.parse(await readFile(packageJsonPath, 'utf8'));
const publishedPackage = {
  name: packageName ?? sourcePackage.name,
  version: sdkVersion,
  description: sourcePackage.description,
  license: sourcePackage.license,
  type: sourcePackage.type,
  main: 'src/index.js',
  types: 'src/index.d.ts',
  files: ['src', 'README.md'],
  exports: {
    '.': {
      types: './src/index.d.ts',
      import: './src/index.js'
    }
  }
};

await new Promise((resolvePromise, reject) => {
  const compiler = spawn('tsc', ['-p', 'tsconfig.json'], { cwd: projectDir, stdio: 'inherit' });
  compiler.on('error', reject);
  compiler.on('close', (code) => code === 0 ? resolvePromise() : reject(new Error(`tsc exited with ${code}`)));
});

await mkdir(distDir, { recursive: true });
await cp(resolve(projectDir, 'README.md'), resolve(distDir, 'README.md'));
await writeFile(resolve(distDir, 'package.json'), `${JSON.stringify(publishedPackage, null, 2)}\n`);
