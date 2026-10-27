import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
for(const name of readdirSync(new URL('../lib/',import.meta.url)).filter(name=>name.endsWith('.mjs'))){const result=spawnSync(process.execPath,['--check',fileURLToPath(new URL(`../lib/${name}`,import.meta.url))],{stdio:'inherit'});if(result.status)process.exit(result.status);}
