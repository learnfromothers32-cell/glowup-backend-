import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { appConfig } from '../config/app';
import logger from '../utils/logger';

const BACKUP_DIR = path.resolve(__dirname, '../../backups');

export async function runDatabaseBackup(): Promise<string> {
  if (!appConfig.mongoUri) {
    throw new Error('MONGODB_URI not configured');
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dumpPath = path.join(BACKUP_DIR, `backup-${timestamp}`);
  const dbName = appConfig.mongoUri.split('/').pop()?.split('?')[0] || 'glowup';

  try {
    execSync(
      `mongodump --uri="${appConfig.mongoUri}" --db="${dbName}" --out="${dumpPath}" --gzip`,
      { stdio: 'pipe', timeout: 300_000 },
    );
    logger.info(`Database backup completed: ${dumpPath}`);

    // Keep only last 7 backups
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith('backup-'))
      .sort()
      .reverse();
    if (backups.length > 7) {
      backups.slice(7).forEach((old) => {
        fs.rmSync(path.join(BACKUP_DIR, old), { recursive: true, force: true });
        logger.info(`Removed old backup: ${old}`);
      });
    }

    return dumpPath;
  } catch (err) {
    logger.error('Database backup failed', { error: (err as Error).message });
    throw err;
  }
}
