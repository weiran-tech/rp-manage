import { access, cp, mkdir, rm } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const manage = new URL('packages/manage/dist/', root);
const docs = new URL('docs/.vitepress/dist/', root);
const output = new URL('dist/', root);

// 先检查两份产物，避免构建不完整时清空现有发布目录。
await Promise.all([
  access(new URL('index.html', manage)),
  access(new URL('index.html', docs)),
]);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(manage, output, { recursive: true });
await cp(docs, new URL('docs/', output), { recursive: true });
console.log('站点已合并至 dist/：演示站 /，文档 /docs/');
