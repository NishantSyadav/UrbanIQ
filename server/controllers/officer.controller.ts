import { Request, Response, NextFunction } from 'express';
import { readJSON, writeJSON } from '../services/db.service';
import { CivicIssue, UpdateState, IssueStatus } from '../../src/types';
import { generateId } from '../utils/helpers';

export async function officerLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { officerId, password } = req.body;

    if (!officerId || !password) {
      res.status(400).json({ error: 'Officer ID and password are required.' });
      return;
    }

    if (officerId === 'OFFICER001' && password === 'urbaniq@2026') {
      res.json({
        success: true,
        officer: {
          id: 'OFFICER001',
          name: 'Officer Mohit',
          role: 'Municipal Officer',
          department: 'Public Works'
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid Officer ID or Password.' });
    }
  } catch (error) {
    next(error);
  }
}

export async function officerUpdateIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { trackingId } = req.params;
    const { status, department, officerName, severity, inspectionDate, remarks } = req.body;

    const issues = readJSON<CivicIssue[]>('issues.json', []);
    const issueIndex = issues.findIndex(i => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id === trackingId);

    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found: ${trackingId}` });
      return;
    }

    const issue = issues[issueIndex];
    const oldStatus = issue.status;
    const changes: string[] = [];

    // Apply severity / priority
    if (severity && issue.severity !== severity) {
      changes.push(`Priority changed from ${issue.severity} to ${severity}`);
      issue.severity = severity;
      if (issue.aiAnalysis) {
        // Keep priority level aligned
        issue.aiAnalysis.priorityLevel = severity === 'Critical' ? 'Critical' : severity === 'High' ? 'High' : severity === 'Low' ? 'Low' : 'Medium';
      }
    }

    // Apply department assignment
    if (department && issue.assignedDepartment !== department) {
      changes.push(`Department assigned: ${department}`);
      issue.assignedDepartment = department;
      if (issue.aiAnalysis) {
        issue.aiAnalysis.department = department;
      }
    }

    // Apply officer assignment
    if (officerName && issue.assignedOfficer !== officerName) {
      changes.push(`Officer assigned: ${officerName}`);
      issue.assignedOfficer = officerName;
    }

    // Apply inspection date
    if (inspectionDate && issue.inspectionDate !== inspectionDate) {
      changes.push(`Inspection scheduled for ${inspectionDate}`);
      issue.inspectionDate = inspectionDate;
    }

    // Apply remarks
    if (remarks && issue.progressRemarks !== remarks) {
      changes.push(`Remarks updated: "${remarks}"`);
      issue.progressRemarks = remarks;
    }

    // Apply status change
    if (status && issue.status !== status) {
      changes.push(`Status advanced from ${issue.status} to ${status}`);
      issue.status = status;
    }

    if (changes.length === 0) {
      res.json(issue);
      return;
    }

    // Build timeline event
    const timestamp = new Date().toISOString();
    const officer = officerName || issue.assignedOfficer || 'Officer Mohit';
    const dept = department || issue.assignedDepartment || 'Public Works';
    const finalRemarks = remarks || issue.progressRemarks || 'Issue updated by municipal authority.';

    const timelineNote = `Updates made by municipal authority: ${changes.join(', ')}.`;

    const newUpdate: UpdateState = {
      status: issue.status,
      timestamp,
      note: timelineNote,
      performedBy: `Officer ${officer}`,
      officerName: officer,
      department: dept,
      remarks: finalRemarks
    };

    if (!issue.updates) {
      issue.updates = [];
    }
    issue.updates.push(newUpdate);

    // Save to issues.json
    issues[issueIndex] = issue;
    writeJSON('issues.json', issues);

    // Save to issueTimeline.json
    const timelineMap = readJSON<Record<string, UpdateState[]>>('issueTimeline.json', {});
    timelineMap[issue.trackingId] = issue.updates;
    writeJSON('issueTimeline.json', timelineMap);

    // Automatically create citizen notifications
    const notifications = readJSON<any[]>('notifications.json', []);
    
    // Add specific notification messages as requested:
    // "Your issue has been verified.", "Road Maintenance has been assigned.", "Work has started.", "Issue resolved successfully."
    let notificationText = `Municipal update for "${issue.title}": ${timelineNote}`;
    let notificationTitle = 'Issue Updated';

    if (status === 'Verified') {
      notificationTitle = 'Issue Verified';
      notificationText = 'Your issue has been verified.';
    } else if (department && (status === 'Assigned' || oldStatus !== 'Assigned')) {
      notificationTitle = 'Department Assigned';
      notificationText = `${department} has been assigned.`;
    } else if (status === 'Work In Progress') {
      notificationTitle = 'Work Started';
      notificationText = 'Work has started.';
    } else if (status === 'Resolved') {
      notificationTitle = 'Issue Resolved';
      notificationText = 'Issue resolved successfully.';
    } else if (status === 'Closed') {
      notificationTitle = 'Issue Closed';
      notificationText = 'Issue closed and archived.';
    }

    notifications.unshift({
      id: generateId('notif'),
      title: notificationTitle,
      body: notificationText,
      type: 'update',
      timestamp,
      read: false
    });
    writeJSON('notifications.json', notifications);

    res.json(issue);
  } catch (error) {
    next(error);
  }
}
