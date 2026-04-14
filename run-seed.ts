import 'dotenv/config';
import { seedDictationWords } from './server/dictation-seed';

await seedDictationWords();
process.exit(0);
