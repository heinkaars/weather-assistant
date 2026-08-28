import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// dotenv is loaded in its own side-effect module, imported first by every module
// that reads process.env at load time (config, logger), so ES module evaluation
// order can never read process.env before it is populated.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });
