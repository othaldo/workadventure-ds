import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const assetsDir = path.resolve('dist/assets');

let files = [];

try {
    files = await readdir(assetsDir);
} catch {
    process.exit(0);
}

for (const file of files) {
    if (!file.endsWith('.html')) {
        continue;
    }

    const wrapperPath = path.join(assetsDir, file);
    const wrapperContent = await readFile(wrapperPath, 'utf8');
    const fixedWrapperContent = wrapperContent.replace(
        /<script\s+src="(\.\/[^\"]+\.js)"><\/script>/g,
        '<script type="module" src="$1"></script>'
    );

    if (fixedWrapperContent !== wrapperContent) {
        await writeFile(wrapperPath, fixedWrapperContent, 'utf8');
    }
}