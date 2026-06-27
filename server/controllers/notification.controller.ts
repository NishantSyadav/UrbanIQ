import { Request, Response, NextFunction } from 'express';
import { readJSON, writeJSON } from '../services/db.service';
import { generateId } from '../utils/helpers';

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const notifications = readJSON<any[]>('notifications.json', []);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
}

export async function readAllNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const notifications = readJSON<any[]>('notifications.json', []);
    const updated = notifications.map(n => ({ ...n, read: true }));
    writeJSON('notifications.json', updated);
    res.json({ success: true, count: updated.length });
  } catch (error) {
    next(error);
  }
}

export async function clearNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const notifications = readJSON<any[]>('notifications.json', []);
    const filtered = notifications.filter(n => n.id !== id);
    writeJSON('notifications.json', filtered);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function addNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, body, type } = req.body;
    if (!title || !body) {
      res.status(400).json({ error: 'Title and body are required.' });
      return;
    }

    const notifications = readJSON<any[]>('notifications.json', []);
    const newNotif = {
      id: generateId('notif'),
      title,
      body,
      type: type || 'general',
      timestamp: new Date().toISOString(),
      read: false
    };

    const updated = [newNotif, ...notifications];
    writeJSON('notifications.json', updated);
    res.status(201).json(newNotif);
  } catch (error) {
    next(error);
  }
}
