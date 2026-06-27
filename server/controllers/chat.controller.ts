import { Request, Response, NextFunction } from 'express';
import { runChatAssistant } from '../services/ai.service';
import { readJSON } from '../services/db.service';
import { CivicIssue } from '../../src/types';

export async function chatAssistant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message, history } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    // Retrieve active issues directly from the database for model grounding
    const issues = readJSON<CivicIssue[]>('issues.json', []);

    console.log(`Running chat session for message: "${message.substring(0, 40)}..."`);
    const result = await runChatAssistant(message, history, issues);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
}
