import { Request, Response, NextFunction } from 'express';
import { readJSON, writeJSON } from '../services/db.service';
import { DEFAULT_USER } from '../services/seed.data';

export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const users = readJSON<Record<string, any>>('users.json', { default: DEFAULT_USER });
    
    // Default to the default profile if not found
    const user = users[id] || users['default'] || DEFAULT_USER;
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (!updates || Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No update data provided.' });
      return;
    }

    const users = readJSON<Record<string, any>>('users.json', { default: DEFAULT_USER });
    const currentProfile = users[id] || users['default'] || DEFAULT_USER;
    
    const updatedProfile = {
      ...currentProfile,
      ...updates
    };
    
    users[id] = updatedProfile;
    // Also keep the 'default' key in sync if that was targeted or if we want single-user simplicity
    if (id === 'default' || !users['default']) {
      users['default'] = updatedProfile;
    }
    
    writeJSON('users.json', users);
    res.json(updatedProfile);
  } catch (error) {
    next(error);
  }
}
