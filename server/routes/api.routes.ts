import { Router, Request, Response, NextFunction } from 'express';
import { getUser, updateUser } from '../controllers/user.controller';
import { 
  getIssues, 
  getIssueByTrackingId, 
  createIssue, 
  updateIssue, 
  supportIssue, 
  addEvidence,
  verifyIssue,
  assignIssue,
  scheduleInspection,
  startWork,
  completeWork,
  closeIssue,
  updateRemarks
} from '../controllers/issue.controller';
import { 
  officerLogin, 
  officerUpdateIssue 
} from '../controllers/officer.controller';
import { 
  getNotifications, 
  readAllNotifications, 
  clearNotification, 
  addNotification 
} from '../controllers/notification.controller';
import { chatAssistant } from '../controllers/chat.controller';
import { analyzeImage, analyzeIssue, analyzeVideo } from '../services/ai.service';

const router = Router();

// --- Officer Portal Endpoints ---
router.post('/officer/login', officerLogin);
router.post('/officer/issues/:trackingId/update', officerUpdateIssue);

// --- User Profile Endpoints ---
router.get('/users/:id', getUser);
router.patch('/users/:id', updateUser);

// --- Civic Issue Endpoints ---
router.get('/issues', getIssues);
router.get('/issues/:trackingId', getIssueByTrackingId);
router.post('/issues', createIssue);
router.patch('/issues/:trackingId', updateIssue);

// --- Authority Workflow Endpoints ---
router.post('/issues/:trackingId/verify', verifyIssue);
router.post('/issues/:trackingId/assign', assignIssue);
router.post('/issues/:trackingId/schedule', scheduleInspection);
router.post('/issues/:trackingId/start-work', startWork);
router.post('/issues/:trackingId/complete-work', completeWork);
router.post('/issues/:trackingId/close', closeIssue);
router.post('/issues/:trackingId/update-remarks', updateRemarks);

// --- Community Upvote/Support Endpoints ---
router.post('/support', supportIssue);

// --- Evidence Endpoints ---
router.post('/evidence', addEvidence);

// --- Notification Endpoints ---
router.get('/notifications', getNotifications);
router.post('/notifications/read-all', readAllNotifications);
router.post('/notifications', addNotification);
router.delete('/notifications/:id', clearNotification);

// --- Chat AI Assistant Endpoints ---
router.post('/chat-assistant', chatAssistant);

// --- Image & Issue Diagnostics Endpoints ---
router.post('/analyze-image', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { image } = req.body;
    if (!image) {
      res.status(400).json({ error: 'Image is required.' });
      return;
    }
    const result = await analyzeImage(image);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/analyze-video', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { video, clientExtractedFrames, duration } = req.body;
    if (!video) {
      res.status(400).json({ error: 'Video is required.' });
      return;
    }
    const result = await analyzeVideo(video, clientExtractedFrames, duration);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/analyze-issue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, category, description, severity, imageUrl, exactLocation } = req.body;
    if (!title || !description) {
      res.status(400).json({ error: 'Title and description are required.' });
      return;
    }
    const result = await analyzeIssue(title, category, description, severity, imageUrl, undefined, exactLocation);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
