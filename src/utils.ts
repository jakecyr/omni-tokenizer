import fs from 'fs/promises';
import crypto from 'crypto';

/**
 * Check if a given file or directory path exists.
 * @param path The path to check for existence.
 * @returns True if the path exists, false otherwise.
 */
export const fileExists = async (path: string): Promise<boolean> => {
  try {
    await fs.stat(path);
    return true;
  } catch {
    return false;
  }
};

export const hashString = (stringToHash: string, method = 'sha256'): string => {
  return crypto.createHash(method).update(stringToHash).digest('hex');
};
