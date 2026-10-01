import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
for(const name of readdirSync(new URL('../lib/',import.meta.url)).filter(name=>name.endsWith('.mjs'))){const result=spawnSync(process.execPath,['--check',new URL(`../lib/${name}`,import.meta.url).pathname],{stdio:'inherit'});if(result.status)process.exit(result.status);}
