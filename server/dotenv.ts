import dotenv from 'dotenv';
import path from 'path';

// Fix for Issue #2: Properly configure dotenv with absolute path
export function configDotenv() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}
