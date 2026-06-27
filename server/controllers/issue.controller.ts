import { Request, Response, NextFunction } from 'express';
import { readJSON, writeJSON } from '../services/db.service';
import { analyzeIssue } from '../services/ai.service';
import { generateTrackingId, generateId } from '../utils/helpers';
import { CivicIssue, Comment, UpdateState, IssueStatus } from '../../src/types';
import { validateAndCorrectHierarchy } from '../../src/utils/location';

function getNeighborhood(lat: number, lng: number): string {
  const districts = [
    { name: 'Downtown Core', lat: 37.7749, lng: -122.4194 },
    { name: 'Nob Hill North', lat: 37.7833, lng: -122.4167 },
    { name: 'SoMa Business Hub', lat: 37.7812, lng: -122.4098 },
    { name: 'Central Park / Sunset', lat: 37.7694, lng: -122.4862 },
    { name: 'Oakwood Heights', lat: 37.7554, lng: -122.4354 }
  ];
  let closest = districts[0];
  let minDist = Infinity;
  districts.forEach(d => {
    const dist = Math.pow(d.lat - lat, 2) + Math.pow(d.lng - lng, 2);
    if (dist < minDist) {
      minDist = dist;
      closest = d;
    }
  });
  return closest.name;
}

// GET /api/issues
export async function getIssues(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req.query.userId as string) || 'default';
    const issues = readJSON<CivicIssue[]>('issues.json', []);
    const supporters = readJSON<Record<string, string[]>>('supporters.json', {});
    const evidenceMap = readJSON<Record<string, string[]>>('evidence.json', {});
    const timelineMap = readJSON<Record<string, UpdateState[]>>('issueTimeline.json', {});

    // Enrich issues with database values and personalized hasUpvoted flag
    const enriched = issues.map(issue => {
      const issueSupporters = supporters[issue.id] || [];
      const hasUpvoted = issueSupporters.includes(userId);
      const evidencePhotos = evidenceMap[issue.id] || (issue.imageUrl ? [issue.imageUrl] : []);
      const updates = timelineMap[issue.trackingId] || issue.updates || [];

      return {
        ...issue,
        upvotes: Math.max(issue.upvotes, issueSupporters.length),
        hasUpvoted,
        evidencePhotos,
        updates
      };
    });

    res.json(enriched);
  } catch (error) {
    next(error);
  }
}

// GET /api/issues/:trackingId
export async function getIssueByTrackingId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { trackingId } = req.params;
    const userId = (req.query.userId as string) || 'default';
    
    const issues = readJSON<CivicIssue[]>('issues.json', []);
    const issue = issues.find(i => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id === trackingId);
    
    if (!issue) {
      res.status(404).json({ error: `No issue found matching tracking ID: ${trackingId}` });
      return;
    }

    const supporters = readJSON<Record<string, string[]>>('supporters.json', {});
    const evidenceMap = readJSON<Record<string, string[]>>('evidence.json', {});
    const timelineMap = readJSON<Record<string, UpdateState[]>>('issueTimeline.json', {});

    const issueSupporters = supporters[issue.id] || [];
    const hasUpvoted = issueSupporters.includes(userId);
    const evidencePhotos = evidenceMap[issue.id] || (issue.imageUrl ? [issue.imageUrl] : []);
    const updates = timelineMap[issue.trackingId] || issue.updates || [];

    res.json({
      ...issue,
      upvotes: Math.max(issue.upvotes, issueSupporters.length),
      hasUpvoted,
      evidencePhotos,
      updates
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/issues
export async function createIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { 
      title, 
      description, 
      category, 
      severity, 
      address, 
      latitude, 
      longitude, 
      imageUrl,
      mediaType,
      mediaPath,
      videoThumbnail,
      videoDuration,
      videoSummary,
      state,
      city,
      district,
      exactLocation
    } = req.body;
    const userId = req.body.userId || 'default';

    if (!title || !description) {
      res.status(400).json({ error: 'Title and description are required.' });
      return;
    }

    const lat = latitude ? parseFloat(latitude) : 37.7749;
    const lng = longitude ? parseFloat(longitude) : -122.4194;
    const trackingId = generateTrackingId(category);

    // Call Gemini to perform diagnostic AI analysis
    console.log('Running AI Diagnostic analysis on backend for reported issue...');
    const aiAnalysis = await analyzeIssue(title, category, description, severity, imageUrl, videoSummary, exactLocation);

    const issues = readJSON<CivicIssue[]>('issues.json', []);
    const issueId = generateId('iss');

    // For videos, use videoThumbnail as the primary imageUrl so card/list views render properly
    const resolvedImageUrl = mediaType === 'Video' ? (videoThumbnail || imageUrl) : (imageUrl || '');

    const resolvedGeo = validateAndCorrectHierarchy(state || '', city || '', district || '', '', address || '');

    const newIssue: CivicIssue = {
      id: issueId,
      trackingId,
      title,
      description,
      category: category || 'Other',
      severity: severity || 'Moderate',
      status: 'Reported',
      location: {
        lat,
        lng,
        address: address || 'San Francisco, CA',
        neighborhood: resolvedGeo.district,
        state: resolvedGeo.state,
        city: resolvedGeo.city,
        district: resolvedGeo.district,
        exactLocation: exactLocation || ''
      },
      reportedAt: new Date().toISOString(),
      upvotes: 1,
      hasUpvoted: true,
      imageUrl: resolvedImageUrl,
      evidencePhotos: resolvedImageUrl ? [resolvedImageUrl] : [],
      aiAnalysis,
      mediaType: mediaType || 'Image',
      mediaPath: mediaPath || imageUrl || '',
      videoThumbnail: videoThumbnail || '',
      videoDuration: videoDuration || '',
      videoSummary: videoSummary || '',
      comments: [
        {
          id: generateId('c'),
          userName: 'UrbanIQ Core AI',
          userRole: 'AI Auditor',
          text: `Neural diagnostic completed. Suggested dispatch: ${aiAnalysis.department} (Priority: ${aiAnalysis.priorityLevel}). Initial status logged as REPORTED.`,
          timestamp: new Date().toISOString()
        }
      ],
      updates: [
        {
          status: 'Reported',
          timestamp: new Date().toISOString(),
          note: 'Civic report logged securely. AI Dispatcher designated routing parameters.',
          performedBy: 'Citizen Reporter'
        }
      ]
    };

    // Save to issues list
    issues.unshift(newIssue);
    writeJSON('issues.json', issues);

    // Save initial timeline
    const timelineMap = readJSON<Record<string, UpdateState[]>>('issueTimeline.json', {});
    timelineMap[trackingId] = newIssue.updates;
    writeJSON('issueTimeline.json', timelineMap);

    // Save initial supporter (reporter automatically supports their reported issue)
    const supporters = readJSON<Record<string, string[]>>('supporters.json', {});
    supporters[issueId] = [userId];
    writeJSON('supporters.json', supporters);

    // Save initial evidence photos
    const evidenceMap = readJSON<Record<string, string[]>>('evidence.json', {});
    evidenceMap[issueId] = imageUrl ? [imageUrl] : [];
    writeJSON('evidence.json', evidenceMap);

    // Add a notification about this report
    const notifications = readJSON<any[]>('notifications.json', []);
    notifications.unshift({
      id: generateId('notif'),
      title: 'Report Logged Successfully',
      body: `Your report "${title}" was submitted successfully. Tracking ID: ${trackingId}`,
      type: 'general',
      timestamp: new Date().toISOString(),
      read: false
    });
    writeJSON('notifications.json', notifications);

    res.status(211).json(newIssue); // Wait, 211 or 201? Let's use 201 or 200, 201 Created is standard
  } catch (error) {
    next(error);
  }
}

// PATCH /api/issues/:trackingId
export async function updateIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { trackingId } = req.params;
    const { status, note, performedBy, comments } = req.body;

    const issues = readJSON<CivicIssue[]>('issues.json', []);
    const issueIndex = issues.findIndex(i => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id === trackingId);

    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found: ${trackingId}` });
      return;
    }

    const issue = issues[issueIndex];

    // Handle comment submission
    if (comments && comments.text) {
      const newComment: Comment = {
        id: generateId('c'),
        userName: comments.userName || 'You (Citizen)',
        userRole: comments.userRole || 'Citizen',
        text: comments.text,
        timestamp: new Date().toISOString()
      };
      issue.comments.push(newComment);
    }

    // Handle advancing status and recording timeline update
    if (status && status !== issue.status) {
      const oldStatus = issue.status;
      issue.status = status;

      const newUpdate: UpdateState = {
        status,
        timestamp: new Date().toISOString(),
        note: note || `Status advanced from ${oldStatus} to ${status}.`,
        performedBy: performedBy || 'System'
      };

      issue.updates.push(newUpdate);

      // Save to Timeline JSON
      const timelineMap = readJSON<Record<string, UpdateState[]>>('issueTimeline.json', {});
      timelineMap[issue.trackingId] = issue.updates;
      writeJSON('issueTimeline.json', timelineMap);

      // Create status update notification
      const notifications = readJSON<any[]>('notifications.json', []);
      notifications.unshift({
        id: generateId('notif'),
        title: 'Issue Status Advanced',
        body: `Your reported issue "${issue.title}" has been updated to: ${status.toUpperCase()}.`,
        type: 'update',
        timestamp: new Date().toISOString(),
        read: false
      });
      writeJSON('notifications.json', notifications);
    }

    issues[issueIndex] = issue;
    writeJSON('issues.json', issues);

    res.json(issue);
  } catch (error) {
    next(error);
  }
}

// POST /api/support (Upvote/Support issue)
export async function supportIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { trackingId, issueId, userId } = req.body;
    const activeUserId = userId || 'default';

    const issues = readJSON<CivicIssue[]>('issues.json', []);
    const issueIndex = issues.findIndex(i => 
      (trackingId && i.trackingId.toLowerCase() === trackingId.toLowerCase()) || 
      (issueId && i.id === issueId)
    );

    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found to support.` });
      return;
    }

    const issue = issues[issueIndex];
    const supporters = readJSON<Record<string, string[]>>('supporters.json', {});
    
    if (!supporters[issue.id]) {
      supporters[issue.id] = [];
    }

    const alreadySupported = supporters[issue.id].includes(activeUserId);
    
    if (!alreadySupported) {
      supporters[issue.id].push(activeUserId);
      issue.upvotes = supporters[issue.id].length;
      issue.hasUpvoted = true;

      // Add system support comment
      issue.comments.push({
        id: generateId('c'),
        userName: 'System (Citizen Support)',
        userRole: 'Citizen',
        text: 'A citizen reported a matching concern and upvoted to confirm urgency.',
        timestamp: new Date().toISOString()
      });

      // Write changes
      writeJSON('supporters.json', supporters);
      issues[issueIndex] = issue;
      writeJSON('issues.json', issues);

      // Trigger notification
      const notifications = readJSON<any[]>('notifications.json', []);
      notifications.unshift({
        id: generateId('notif'),
        title: 'New Community Supporter',
        body: `Your reported issue "${issue.title}" has gained new support from the community.`,
        type: 'support',
        timestamp: new Date().toISOString(),
        read: false
      });
      writeJSON('notifications.json', notifications);

      res.json({
        ...issue,
        hasUpvoted: true,
        upvotes: supporters[issue.id].length
      });
    } else {
      // Toggle support: remove it
      supporters[issue.id] = supporters[issue.id].filter(u => u !== activeUserId);
      issue.upvotes = supporters[issue.id].length;
      issue.hasUpvoted = false;

      // Write changes
      writeJSON('supporters.json', supporters);
      issues[issueIndex] = issue;
      writeJSON('issues.json', issues);

      res.json({
        ...issue,
        hasUpvoted: false,
        upvotes: supporters[issue.id].length
      });
    }
  } catch (error) {
    next(error);
  }
}

// POST /api/evidence (Add evidence photo)
export async function addEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { trackingId, issueId, imageUrl, userId } = req.body;
    const activeUserId = userId || 'default';

    if (!imageUrl) {
      res.status(400).json({ error: 'Evidence imageUrl is required.' });
      return;
    }

    const issues = readJSON<CivicIssue[]>('issues.json', []);
    const issueIndex = issues.findIndex(i => 
      (trackingId && i.trackingId.toLowerCase() === trackingId.toLowerCase()) || 
      (issueId && i.id === issueId)
    );

    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found to add evidence.` });
      return;
    }

    const issue = issues[issueIndex];
    const evidenceMap = readJSON<Record<string, string[]>>('evidence.json', {});
    const supporters = readJSON<Record<string, string[]>>('supporters.json', {});

    // Save evidence
    if (!evidenceMap[issue.id]) {
      evidenceMap[issue.id] = issue.imageUrl ? [issue.imageUrl] : [];
    }

    if (!evidenceMap[issue.id].includes(imageUrl)) {
      evidenceMap[issue.id].push(imageUrl);
    }
    writeJSON('evidence.json', evidenceMap);

    // Upvote automatically on evidence upload if not supported yet
    if (!supporters[issue.id]) {
      supporters[issue.id] = [];
    }
    if (!supporters[issue.id].includes(activeUserId)) {
      supporters[issue.id].push(activeUserId);
      writeJSON('supporters.json', supporters);
    }

    issue.evidencePhotos = evidenceMap[issue.id];
    issue.upvotes = supporters[issue.id].length;
    issue.hasUpvoted = true;

    // Add comment
    issue.comments.push({
      id: generateId('c'),
      userName: 'System (Additional Evidence)',
      userRole: 'Citizen',
      text: `Added additional photo evidence to this issue.`,
      timestamp: new Date().toISOString()
    });

    issues[issueIndex] = issue;
    writeJSON('issues.json', issues);

    // Notification
    const notifications = readJSON<any[]>('notifications.json', []);
    notifications.unshift({
      id: generateId('notif'),
      title: 'Evidence Uploaded',
      body: `Additional photo evidence has been attached to reported issue: "${issue.title}".`,
      type: 'update',
      timestamp: new Date().toISOString(),
      read: false
    });
    writeJSON('notifications.json', notifications);

    res.json({
      ...issue,
      evidencePhotos: evidenceMap[issue.id],
      hasUpvoted: true,
      upvotes: supporters[issue.id].length
    });
  } catch (error) {
    next(error);
  }
}

// Helper to record timeline & notify
function recordTimelineAndNotify(
  issue: CivicIssue, 
  newStatus: IssueStatus, 
  note: string, 
  performedBy: string, 
  officerName?: string, 
  department?: string, 
  remarks?: string
) {
  // Update issue status
  issue.status = newStatus;
  
  if (officerName !== undefined) issue.assignedOfficer = officerName;
  if (department !== undefined) issue.assignedDepartment = department;
  if (remarks !== undefined) issue.progressRemarks = remarks;

  const newUpdate: UpdateState = {
    status: newStatus,
    timestamp: new Date().toISOString(),
    note: note || `Status advanced to ${newStatus}.`,
    performedBy,
    officerName,
    department,
    remarks
  };

  if (!issue.updates) issue.updates = [];
  issue.updates.push(newUpdate);

  // Save to Timeline JSON
  const timelineMap = readJSON<Record<string, UpdateState[]>>('issueTimeline.json', {});
  timelineMap[issue.trackingId] = issue.updates;
  writeJSON('issueTimeline.json', timelineMap);

  // Create notification
  const notifications = readJSON<any[]>('notifications.json', []);
  notifications.unshift({
    id: generateId('notif'),
    title: `Issue Status Update: ${newStatus}`,
    body: `Your reported issue "${issue.title}" has been updated to: ${newStatus}. Note: ${note}`,
    type: 'update',
    timestamp: new Date().toISOString(),
    read: false
  });
  writeJSON('notifications.json', notifications);
}

// POST /api/issues/:trackingId/verify
export async function verifyIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { trackingId } = req.params;
    const { remarks } = req.body;

    const issues = readJSON<CivicIssue[]>('issues.json', []);
    const issueIndex = issues.findIndex(i => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id === trackingId);

    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found: ${trackingId}` });
      return;
    }

    const issue = issues[issueIndex];
    
    recordTimelineAndNotify(
      issue,
      'Verified',
      remarks || 'Issue has been inspected and verified by municipal engineers.',
      'Municipal Inspector',
      undefined,
      undefined,
      remarks
    );

    issues[issueIndex] = issue;
    writeJSON('issues.json', issues);

    res.json(issue);
  } catch (error) {
    next(error);
  }
}

// POST /api/issues/:trackingId/assign
export async function assignIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { trackingId } = req.params;
    const { department, officerName, remarks } = req.body;

    if (!department) {
      res.status(400).json({ error: 'Department is required for assignment.' });
      return;
    }

    const issues = readJSON<CivicIssue[]>('issues.json', []);
    const issueIndex = issues.findIndex(i => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id === trackingId);

    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found: ${trackingId}` });
      return;
    }

    const issue = issues[issueIndex];
    
    recordTimelineAndNotify(
      issue,
      'Assigned',
      remarks || `Issue assigned to ${department} department under officer ${officerName || 'TBD'}.`,
      'Municipal Dispatcher',
      officerName,
      department,
      remarks
    );

    issues[issueIndex] = issue;
    writeJSON('issues.json', issues);

    res.json(issue);
  } catch (error) {
    next(error);
  }
}

// POST /api/issues/:trackingId/schedule
export async function scheduleInspection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { trackingId } = req.params;
    const { inspectionDate, officerName, remarks } = req.body;

    if (!inspectionDate) {
      res.status(400).json({ error: 'Inspection date is required.' });
      return;
    }

    const issues = readJSON<CivicIssue[]>('issues.json', []);
    const issueIndex = issues.findIndex(i => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id === trackingId);

    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found: ${trackingId}` });
      return;
    }

    const issue = issues[issueIndex];
    issue.inspectionDate = inspectionDate;
    
    recordTimelineAndNotify(
      issue,
      'Inspection Scheduled',
      remarks || `On-site inspection scheduled for ${inspectionDate} by officer ${officerName || 'TBD'}.`,
      'Municipal Scheduler',
      officerName,
      issue.assignedDepartment,
      remarks
    );

    issues[issueIndex] = issue;
    writeJSON('issues.json', issues);

    res.json(issue);
  } catch (error) {
    next(error);
  }
}

// POST /api/issues/:trackingId/start-work
export async function startWork(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { trackingId } = req.params;
    const { remarks, officerName } = req.body;

    const issues = readJSON<CivicIssue[]>('issues.json', []);
    const issueIndex = issues.findIndex(i => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id === trackingId);

    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found: ${trackingId}` });
      return;
    }

    const issue = issues[issueIndex];
    
    recordTimelineAndNotify(
      issue,
      'Work In Progress',
      remarks || 'Field team has arrived on site and work is actively in progress.',
      'Field Supervisor',
      officerName || issue.assignedOfficer,
      issue.assignedDepartment,
      remarks
    );

    issues[issueIndex] = issue;
    writeJSON('issues.json', issues);

    res.json(issue);
  } catch (error) {
    next(error);
  }
}

// POST /api/issues/:trackingId/complete-work
export async function completeWork(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { trackingId } = req.params;
    const { remarks, officerName } = req.body;

    const issues = readJSON<CivicIssue[]>('issues.json', []);
    const issueIndex = issues.findIndex(i => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id === trackingId);

    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found: ${trackingId}` });
      return;
    }

    const issue = issues[issueIndex];
    
    recordTimelineAndNotify(
      issue,
      'Resolved',
      remarks || 'Work successfully completed and site cleared. Operations finalized.',
      'Field Supervisor',
      officerName || issue.assignedOfficer,
      issue.assignedDepartment,
      remarks
    );

    issues[issueIndex] = issue;
    writeJSON('issues.json', issues);

    res.json(issue);
  } catch (error) {
    next(error);
  }
}

// POST /api/issues/:trackingId/close
export async function closeIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { trackingId } = req.params;
    const { remarks } = req.body;

    const issues = readJSON<CivicIssue[]>('issues.json', []);
    const issueIndex = issues.findIndex(i => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id === trackingId);

    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found: ${trackingId}` });
      return;
    }

    const issue = issues[issueIndex];
    
    recordTimelineAndNotify(
      issue,
      'Closed',
      remarks || 'Issue has been closed and archived in the municipal database.',
      'Municipal Administrator',
      issue.assignedOfficer,
      issue.assignedDepartment,
      remarks
    );

    issues[issueIndex] = issue;
    writeJSON('issues.json', issues);

    res.json(issue);
  } catch (error) {
    next(error);
  }
}

// POST /api/issues/:trackingId/update-remarks
export async function updateRemarks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { trackingId } = req.params;
    const { remarks, officerName } = req.body;

    if (!remarks) {
      res.status(400).json({ error: 'Remarks are required.' });
      return;
    }

    const issues = readJSON<CivicIssue[]>('issues.json', []);
    const issueIndex = issues.findIndex(i => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id === trackingId);

    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found: ${trackingId}` });
      return;
    }

    const issue = issues[issueIndex];
    issue.progressRemarks = remarks;
    if (officerName) issue.assignedOfficer = officerName;

    const newUpdate: UpdateState = {
      status: issue.status,
      timestamp: new Date().toISOString(),
      note: `Remarks updated: ${remarks}`,
      performedBy: officerName ? `Officer ${officerName}` : 'Field Engineer',
      officerName: officerName || issue.assignedOfficer,
      department: issue.assignedDepartment,
      remarks
    };

    issue.updates.push(newUpdate);

    // Save to Timeline JSON
    const timelineMap = readJSON<Record<string, UpdateState[]>>('issueTimeline.json', {});
    timelineMap[issue.trackingId] = issue.updates;
    writeJSON('issueTimeline.json', timelineMap);

    issues[issueIndex] = issue;
    writeJSON('issues.json', issues);

    res.json(issue);
  } catch (error) {
    next(error);
  }
}
