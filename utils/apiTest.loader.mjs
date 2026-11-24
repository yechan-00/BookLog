import { register } from 'node:module';

register(new URL('./apiTest.register.mjs', import.meta.url).href, import.meta.url);
