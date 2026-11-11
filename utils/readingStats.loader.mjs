import { register } from 'node:module';

register(new URL('./readingStats.register.mjs', import.meta.url).href, import.meta.url);
