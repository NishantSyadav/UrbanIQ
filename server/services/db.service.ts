import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_USER, DEFAULT_NOTIFICATIONS, PRE_SEEDED_ISSUES } from './seed.data';
import { CivicIssue, UpdateState } from '../../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory path
const DATA_DIR = path.join(__dirname, '..', 'data');

// Resolve path to a specific JSON file
const getFilePath = (fileName: string): string => {
  return path.join(DATA_DIR, fileName);
};

// Initialize database by creating directories and saving default seed data if files don't exist
export function initDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Created database directory at: ${DATA_DIR}`);
  }

  // Define files and their default contents
  const files: Record<string, any> = {
    'users.json': { default: DEFAULT_USER },
    'issues.json': PRE_SEEDED_ISSUES,
    'issueTimeline.json': (() => {
      const timeline: Record<string, UpdateState[]> = {};
      PRE_SEEDED_ISSUES.forEach(issue => {
        timeline[issue.trackingId] = issue.updates || [];
      });
      return timeline;
    })(),
    'supporters.json': (() => {
      const supporters: Record<string, string[]> = {};
      PRE_SEEDED_ISSUES.forEach(issue => {
        supporters[issue.id] = [];
      });
      return supporters;
    })(),
    'evidence.json': (() => {
      const evidence: Record<string, string[]> = {};
      PRE_SEEDED_ISSUES.forEach(issue => {
        evidence[issue.id] = issue.imageUrl ? [issue.imageUrl] : [];
      });
      return evidence;
    })(),
    'notifications.json': DEFAULT_NOTIFICATIONS
  };

  // Create each file with default seed data if it doesn't already exist
  Object.keys(files).forEach(fileName => {
    const filePath = getFilePath(fileName);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(files[fileName], null, 2), 'utf-8');
      console.log(`Initialized database file: ${fileName}`);
    }
  });
}

// Generic Read Utility
export function readJSON<T>(fileName: string, defaultValue: T): T {
  const filePath = getFilePath(fileName);
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Error reading database file: ${fileName}`, err);
    return defaultValue;
  }
}

// Generic Write Utility
export function writeJSON<T>(fileName: string, data: T): void {
  const filePath = getFilePath(fileName);
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing database file: ${fileName}`, err);
  }
}
