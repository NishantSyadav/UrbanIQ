import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Briefcase, MapPin, Edit2, Save, Award, 
  Activity, FileText, ThumbsUp, Image, Bell, Settings, Check, 
  Lock, Shield, Trash2, Camera, Globe, ChevronRight, AlertCircle, X, Info
} from 'lucide-react';
import { CivicIssue, IssueStatus } from '../types';

export interface CitizenProfile {
  fullName: string;
  email: string;
  phone: string;
  occupation: string;
  city: string;
  photoUrl: string;
}

interface NotificationPrefs {
  emailUpdates: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  resolutionAlerts: boolean;
}

interface PrivacySettings {
  publicProfile: boolean;
  anonymousReports: boolean;
}

interface CitizenPortalProps {
  issues: CivicIssue[];
  setIssues: React.Dispatch<React.SetStateAction<CivicIssue[]>>;
  onViewIssue: (issue: CivicIssue) => void;
  preventedDuplicatesCount: number;
  profile: CitizenProfile;
  setProfile: React.Dispatch<React.SetStateAction<CitizenProfile>>;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150'
];

export function CitizenPortal({ 
  issues, 
  setIssues, 
  onViewIssue, 
  preventedDuplicatesCount,
  profile,
  setProfile
}: CitizenPortalProps) {

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<CitizenProfile>({ ...profile });

  // Sync editedProfile when profile prop changes
  useEffect(() => {
    setEditedProfile({ ...profile });
  }, [profile]);

  // --- Preferences State ---
  const [notifications, setNotifications] = useState<NotificationPrefs>(() => {
    const saved = localStorage.getItem('urban_iq_notification_prefs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      emailUpdates: true,
      pushNotifications: true,
      weeklyDigest: false,
      resolutionAlerts: true
    };
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>(() => {
    const saved = localStorage.getItem('urban_iq_privacy_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      publicProfile: true,
      anonymousReports: false
    };
  });

  // --- Active Sub-tab State inside Portal ---
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'reports' | 'notifications' | 'settings'>('overview');

  // --- Custom Activity Events ---
  const [customEvents, setCustomEvents] = useState<Array<{ id: string; type: string; title: string; desc: string; timestamp: string }>>(() => {
    const saved = localStorage.getItem('urban_iq_custom_events');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Local Notification State ---
  const [systemNotifications, setSystemNotifications] = useState<Array<{ id: string; title: string; body: string; type: 'update' | 'resolve' | 'support' | 'general'; timestamp: string; read: boolean }>>([]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setSystemNotifications(data);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleEvents = () => {
      fetchNotifications();
    };
    window.addEventListener('urban_iq_profile_updated', handleEvents);
    window.addEventListener('urban_iq_custom_events_updated', handleEvents);
    return () => {
      window.removeEventListener('urban_iq_profile_updated', handleEvents);
      window.removeEventListener('urban_iq_custom_events_updated', handleEvents);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('urban_iq_notification_prefs', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('urban_iq_privacy_settings', JSON.stringify(privacy));
  }, [privacy]);

  useEffect(() => {
    localStorage.setItem('urban_iq_custom_events', JSON.stringify(customEvents));
  }, [customEvents]);

  // Sync with AI Action Agent custom window events
  useEffect(() => {
    const handleSubtabUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveSubTab(customEvent.detail);
      }
    };

    window.addEventListener('urban_iq_portal_subtab', handleSubtabUpdate);

    return () => {
      window.removeEventListener('urban_iq_portal_subtab', handleSubtabUpdate);
    };
  }, []);

  // Helper to add activity events
  const logActivity = (type: string, title: string, desc: string) => {
    const newEvent = {
      id: `evt-${Date.now()}`,
      type,
      title,
      desc,
      timestamp: new Date().toISOString()
    };
    setCustomEvents(prev => [newEvent, ...prev]);
  };

  // Profile Save Handler
  const handleSaveProfile = async () => {
    try {
      const res = await fetch('/api/users/default', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedProfile)
      });
      if (res.ok) {
        const saved = await res.json();
        setProfile(saved);
        setIsEditing(false);
        logActivity('profile', 'Profile Updated', 'You modified your contact details, occupation, or location settings.');
        
        // Add a read alert on server
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Profile Updated',
            body: 'Your citizen profile updates have been successfully written to local registry.',
            type: 'general'
          })
        });
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  // Base64 Photo Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditedProfile(prev => ({ ...prev, photoUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Dynamic Stats Calculations ---
  // Count user reports: let's filter reports marked as created by me.
  // We can treat issues with ID starting with a timestamp (like iss-171...) or marked by reportedByMe
  // Let's check for both.
  const myReports = issues.filter(issue => {
    // If it has our marker or is from our local submission
    const isLocalNew = parseInt(issue.id.replace('iss-', '')) > 1700000000000; // generated from Date.now()
    const markedByMe = (issue as any).reportedByMe === true;
    // Let's also treat iss-3 and iss-5 as "My Reports" by default to seed the list nicely
    const isSeedAssigned = issue.id === 'iss-3' || issue.id === 'iss-5';
    return isLocalNew || markedByMe || isSeedAssigned;
  });

  const reportsCount = myReports.length;
  const resolvedReportsCount = myReports.filter(i => i.status === 'Resolved').length;

  // Support votes given: issues upvoted by the user (hasUpvoted === true)
  const votesGivenCount = issues.filter(i => i.hasUpvoted).length;

  // Evidence photos added
  const evidencePhotosCount = myReports.reduce((sum, issue) => {
    let count = 0;
    if (issue.imageUrl) count += 1;
    if (issue.evidencePhotos) count += issue.evidencePhotos.length;
    return sum + count;
  }, 0);

  // Impact Score formula: ReportsSubmitted*15 + Resolved*25 + UpvotesGiven*5 + EvidenceAdded*10
  const communityImpactScore = (reportsCount * 15) + (resolvedReportsCount * 25) + (votesGivenCount * 8) + (evidencePhotosCount * 12);

  // --- Badge logic ---
  const badges = [
    {
      id: 'first-reporter',
      title: 'First Reporter',
      desc: 'File your first official civic concern',
      metric: 'reportsCount',
      required: 1,
      current: reportsCount,
      icon: '📢',
      color: 'from-blue-500 to-indigo-600',
      active: reportsCount >= 1
    },
    {
      id: 'community-hero',
      title: 'Community Hero',
      desc: 'Support or upvote 3+ active issues',
      metric: 'votesGivenCount',
      required: 3,
      current: votesGivenCount,
      icon: '🦸‍♂️',
      color: 'from-purple-500 to-pink-600',
      active: votesGivenCount >= 3
    },
    {
      id: 'evidence-contrib',
      title: 'Evidence Contributor',
      desc: 'Submit a report with valid photo evidence',
      metric: 'evidencePhotosCount',
      required: 1,
      current: evidencePhotosCount,
      icon: '📸',
      color: 'from-amber-500 to-orange-600',
      active: evidencePhotosCount >= 1
    },
    {
      id: 'top-supporter',
      title: 'Top Supporter',
      desc: 'Lend your civic validation to 5+ reports',
      metric: 'votesGivenCount',
      required: 5,
      current: votesGivenCount,
      icon: '🤝',
      color: 'from-teal-500 to-emerald-600',
      active: votesGivenCount >= 5
    },
    {
      id: 'civic-champion',
      title: 'Civic Champion',
      desc: 'Exceed a community impact score of 100 points',
      metric: 'impactScore',
      required: 100,
      current: communityImpactScore,
      icon: '🏆',
      color: 'from-red-500 to-yellow-500 animate-pulse',
      active: communityImpactScore >= 100
    }
  ];

  // --- Unified Activity Timeline ---
  const timelineEvents = [
    // Preseeded events
    {
      id: 'pre-1',
      type: 'report',
      title: 'Report Submitted',
      desc: 'You logged a report for "Central Park Pavement Cracked"',
      timestamp: new Date(Date.now() - 3600000 * 48).toISOString()
    },
    {
      id: 'pre-2',
      type: 'support',
      title: 'Support Vote Cast',
      desc: 'You supported deep potholes on Main St and 4th Ave Intersection',
      timestamp: new Date(Date.now() - 3600000 * 20).toISOString()
    },
    ...customEvents
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Mark all notification as read
  const markAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error('Error marking all notifications read:', e);
    }
  };

  // Clear single notification
  const clearNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error('Error deleting notification:', e);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION WITH USER SUMMARY CARD */}
      <div className="bg-gradient-to-r from-brand-navy to-slate-800 p-6 md:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
          <div className="relative group">
            <img 
              src={profile.photoUrl} 
              alt={profile.fullName} 
              className="w-24 h-24 rounded-full object-cover border-4 border-white/25 shadow-lg flex-shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight">{profile.fullName}</h2>
              <span className="bg-brand-blue/30 text-brand-blue text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-brand-blue/40 inline-block self-center">
                Level {Math.floor(communityImpactScore / 40) + 1} Civic Sentinel
              </span>
            </div>
            
            <p className="text-slate-300 text-xs flex items-center justify-center md:justify-start gap-1">
              <Briefcase className="w-3.5 h-3.5" /> {profile.occupation} • <MapPin className="w-3.5 h-3.5" /> {profile.city}
            </p>
            <p className="text-slate-400 text-xs">
              Registered via {profile.email}
            </p>
          </div>
        </div>

        {/* Community Score Display Card */}
        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-center w-full md:w-auto md:min-w-[200px]">
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest block">Community Impact</span>
          <span className="text-4xl font-black text-amber-400 block mt-1">{communityImpactScore}</span>
          <div className="w-full bg-white/20 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-amber-400 h-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (communityImpactScore / 200) * 100)}%` }}
            ></div>
          </div>
          <span className="text-[9px] text-slate-300 mt-1.5 block">
            {communityImpactScore < 100 ? `${100 - communityImpactScore} pts to Civic Champion` : 'Maximum Tier Active!'}
          </span>
        </div>
      </div>

      {/* PORTAL NAVIGATION TABS */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: 'Impact Overview', icon: Activity },
          { id: 'reports', label: `My Reports (${reportsCount})`, icon: FileText },
          { id: 'notifications', label: `Notifications`, badge: systemNotifications.filter(n => !n.read).length, icon: Bell },
          { id: 'settings', label: 'Portal Settings', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm whitespace-nowrap cursor-pointer transition-all ${
                isActive 
                  ? 'border-brand-blue text-brand-blue' 
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* SUB-TAB CONTENTS */}
      <div className="space-y-6">
        
        {/* TAB 1: IMPACT OVERVIEW */}
        {activeSubTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMN 1: DASHBOARD ANALYTICS & RECENT TIMELINE */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* IMPACT DASHBOARD STATS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Reports Logged', value: reportsCount, icon: FileText, color: 'text-blue-500 bg-blue-50' },
                  { label: 'Issues Resolved', value: resolvedReportsCount, icon: Check, color: 'text-emerald-500 bg-emerald-50' },
                  { label: 'Votes Contributed', value: votesGivenCount, icon: ThumbsUp, color: 'text-amber-500 bg-amber-50' },
                  { label: 'Evidence Photos', value: evidencePhotosCount, icon: Image, color: 'text-indigo-500 bg-indigo-50' }
                ].map((stat, idx) => {
                  const StatIcon = stat.icon;
                  return (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-2xl font-black text-brand-navy">{stat.value}</span>
                        <span className={`${stat.color} p-1.5 rounded-lg`}>
                          <StatIcon className="w-4 h-4" />
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-snug">{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* ACHIEVEMENTS & BADGE SYSTEM */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-brand-navy text-sm uppercase tracking-wider">Achievements & Badges</h3>
                    <p className="text-xs text-slate-500">Milestones unlocked by your public works reporting.</p>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded border border-amber-200">
                    {badges.filter(b => b.active).length} / {badges.length} Unlocked
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {badges.map(badge => (
                    <div 
                      key={badge.id}
                      className={`p-3.5 border rounded-xl flex items-center gap-4 transition-all ${
                        badge.active 
                          ? 'bg-gradient-to-r from-slate-50 to-white border-slate-200' 
                          : 'bg-slate-50/50 border-slate-100 opacity-60'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${
                        badge.active ? 'bg-gradient-to-br text-white ' + badge.color : 'bg-slate-200'
                      }`}>
                        {badge.active ? badge.icon : '🔒'}
                      </div>
                      
                      <div className="flex-grow min-w-0 space-y-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-xs text-brand-navy truncate">{badge.title}</h4>
                          {badge.active && (
                            <span className="text-[9px] text-emerald-600 font-black uppercase tracking-wider flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5 stroke-[3]" /> Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed truncate">{badge.desc}</p>
                        
                        {/* Progress Bar for Locked Badges */}
                        {!badge.active && (
                          <div className="space-y-1 pt-1">
                            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                              <div 
                                className="bg-slate-400 h-full" 
                                style={{ width: `${Math.min(100, (badge.current / badge.required) * 100)}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                              <span>Progress</span>
                              <span>{badge.current} / {badge.required}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTIVITY TIMELINE */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Activity className="w-4 h-4 text-brand-blue" />
                  <h3 className="font-extrabold text-brand-navy text-sm uppercase tracking-wider">Citizen Activity Timeline</h3>
                </div>

                <div className="relative border-l border-slate-200 pl-4 ml-2.5 space-y-6 pt-1">
                  {timelineEvents.slice(0, 6).map((evt, idx) => (
                    <div key={evt.id || idx} className="relative group">
                      {/* Circle indicator */}
                      <span className="absolute -left-[24.5px] top-1 w-4.5 h-4.5 bg-white border-2 border-brand-blue rounded-full flex items-center justify-center">
                        <span className="w-2 h-2 bg-brand-blue rounded-full"></span>
                      </span>

                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="font-extrabold text-xs text-brand-navy">{evt.title}</h4>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {new Date(evt.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{evt.desc}</p>
                      </div>
                    </div>
                  ))}

                  {timelineEvents.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No registered activities yet. Submit reports or upvote other issues to populate your history.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* COLUMN 2: QUICK EDIT PROFILE INFO PANEL */}
            <div className="space-y-6">
              
              {/* EDITABLE PROFILE CARD */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-brand-navy text-sm uppercase tracking-wider">Citizen Profile</h3>
                  {!isEditing ? (
                    <button 
                      onClick={() => {
                        setEditedProfile({ ...profile });
                        setIsEditing(true);
                      }}
                      className="text-brand-blue hover:text-blue-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveProfile}
                        className="text-emerald-600 hover:text-emerald-700 text-xs font-black flex items-center gap-0.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                    </div>
                  )}
                </div>

                {!isEditing ? (
                  <div className="space-y-4">
                    {/* Display Mode */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-brand-navy border border-slate-100">
                        <User className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-400 uppercase font-black block">Full Name</span>
                        <p className="text-sm font-extrabold text-slate-800">{profile.fullName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-brand-navy border border-slate-100">
                        <Mail className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-400 uppercase font-black block">Email Address</span>
                        <p className="text-sm font-extrabold text-slate-800 break-all">{profile.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-brand-navy border border-slate-100">
                        <Phone className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-400 uppercase font-black block">Phone Number</span>
                        <p className="text-sm font-extrabold text-slate-800">{profile.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-brand-navy border border-slate-100">
                        <Briefcase className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-400 uppercase font-black block">Occupation Sector</span>
                        <p className="text-sm font-extrabold text-slate-800">{profile.occupation}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-brand-navy border border-slate-100">
                        <MapPin className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-400 uppercase font-black block">Assigned District</span>
                        <p className="text-sm font-extrabold text-slate-800">{profile.city}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Photo Selector */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 uppercase font-black block">Profile Avatar</label>
                      <div className="flex flex-wrap gap-2.5 items-center">
                        {DEFAULT_AVATARS.map((av, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditedProfile(prev => ({ ...prev, photoUrl: av }))}
                            className={`w-10 h-10 rounded-full border-2 overflow-hidden cursor-pointer transition-all ${
                              editedProfile.photoUrl === av ? 'border-brand-blue scale-110 shadow-sm' : 'border-transparent'
                            }`}
                          >
                            <img src={av} alt="Preset avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                        
                        <label className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 hover:border-brand-blue flex items-center justify-center cursor-pointer transition-colors relative">
                          <Camera className="w-4 h-4 text-slate-400" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handlePhotoUpload} 
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-black block">Full Name</label>
                      <input 
                        type="text" 
                        value={editedProfile.fullName}
                        onChange={e => setEditedProfile(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-black block">Email Address</label>
                      <input 
                        type="email" 
                        value={editedProfile.email}
                        onChange={e => setEditedProfile(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-black block">Phone Number</label>
                      <input 
                        type="text" 
                        value={editedProfile.phone}
                        onChange={e => setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-black block">Occupation</label>
                      <select 
                        value={editedProfile.occupation}
                        onChange={e => setEditedProfile(prev => ({ ...prev, occupation: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-brand-blue bg-white"
                      >
                        {['Student', 'Teacher', 'Engineer', 'Government Employee', 'Business Owner', 'Healthcare Worker', 'Other'].map((occ) => (
                          <option key={occ} value={occ}>{occ}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-black block">City</label>
                      <input 
                        type="text" 
                        value={editedProfile.city}
                        onChange={e => setEditedProfile(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    <button 
                      onClick={handleSaveProfile}
                      className="w-full bg-brand-blue hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 mt-2 shadow-sm"
                    >
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: MY REPORTS SECTION */}
        {activeSubTab === 'reports' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-brand-navy text-sm uppercase tracking-wider">Your Submitted Reports</h3>
              <p className="text-xs text-slate-500">Track and view real-time remediation status on your reported concerns.</p>
            </div>

            <div className="space-y-3.5">
              {myReports.map((report) => (
                <div 
                  key={report.id}
                  onClick={() => onViewIssue(report)}
                  className="p-4 border border-slate-100 rounded-xl hover:border-slate-300 hover:shadow-sm cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/40 hover:bg-white"
                >
                  <div className="flex items-start gap-3.5">
                    {report.imageUrl ? (
                      <img 
                        src={report.imageUrl} 
                        alt={report.title} 
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-slate-200" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}
                    
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[9px] font-extrabold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                          {report.trackingId}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">•</span>
                        <span className="text-xs text-slate-500 font-medium">{report.category}</span>
                        {report.mediaType === 'Video' && (
                          <>
                            <span className="text-xs text-slate-400 font-bold">•</span>
                            <span className="text-[9px] font-extrabold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
                              <span>VIDEO {report.videoDuration ? `(${report.videoDuration})` : ''}</span>
                            </span>
                          </>
                        )}
                      </div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-brand-navy leading-snug truncate pr-4">
                        {report.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate max-w-[450px]">
                        <MapPin className="w-3 h-3 text-slate-300" /> {report.location.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div className="text-left sm:text-right space-y-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider block text-center ${
                        report.status === 'Reported' ? 'bg-slate-100 text-slate-800 border border-slate-200' :
                        report.status === 'Verified' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        report.status === 'Assigned' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        report.status === 'Inspection Scheduled' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                        report.status === 'Work In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        report.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {report.status}
                      </span>
                      <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase block text-center ${
                        report.severity === 'Critical' ? 'bg-red-50 text-red-600' :
                        report.severity === 'Severe' ? 'bg-orange-50 text-orange-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {report.severity} Priority
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 hidden sm:block" />
                  </div>
                </div>
              ))}

              {myReports.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  You haven't submitted any reports yet. Use the "Report Issue" tab to submit your first concern.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: NOTIFICATION CENTER */}
        {activeSubTab === 'notifications' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-brand-navy text-sm uppercase tracking-wider">Citizen Notification Center</h3>
                <p className="text-xs text-slate-500">Real-time alerts, status updates, and support approvals.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={markAllRead}
                  className="text-brand-blue hover:text-blue-700 text-xs font-bold cursor-pointer"
                >
                  Mark All Read
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {systemNotifications.map((n) => (
                <div 
                  key={n.id}
                  className={`p-3.5 border rounded-xl flex items-start gap-3.5 relative transition-all ${
                    n.read 
                      ? 'bg-white border-slate-100/80 opacity-75' 
                      : 'bg-blue-50/30 border-blue-100 shadow-xs'
                  }`}
                >
                  {!n.read && (
                    <span className="absolute top-3.5 right-12 w-2 h-2 bg-brand-blue rounded-full"></span>
                  )}
                  
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    n.type === 'resolve' ? 'bg-emerald-50 text-emerald-600' :
                    n.type === 'support' ? 'bg-amber-50 text-amber-600' :
                    n.type === 'update' ? 'bg-indigo-50 text-indigo-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>

                  <div className="flex-grow min-w-0 space-y-1">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="font-extrabold text-xs text-brand-navy leading-snug">{n.title}</h4>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(n.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed pr-8">{n.body}</p>
                  </div>

                  <button 
                    onClick={() => clearNotification(n.id)}
                    className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors cursor-pointer self-center"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {systemNotifications.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No alerts inside your notification center. You're completely up to date!
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PORTAL SETTINGS */}
        {activeSubTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* PANEL 1: NOTIFICATION SETTINGS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-brand-navy text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-brand-blue" /> Notification Preferences
                </h3>
                <p className="text-xs text-slate-500">Configure how and when UrbanIQ contacts you.</p>
              </div>

              <div className="space-y-4 pt-1">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifications.emailUpdates}
                    onChange={e => setNotifications(prev => ({ ...prev, emailUpdates: e.target.checked }))}
                    className="mt-1 rounded text-brand-blue border-slate-300 focus:ring-brand-blue w-4 h-4"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-extrabold text-brand-navy">Email Reports & Actions</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Receive confirmations and status updates sent to {profile.email}.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifications.pushNotifications}
                    onChange={e => setNotifications(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                    className="mt-1 rounded text-brand-blue border-slate-300 focus:ring-brand-blue w-4 h-4"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-extrabold text-brand-navy">Real-time Push Alerts</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Show immediate browser notifications when dispatchers or technicians update your reports.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifications.resolutionAlerts}
                    onChange={e => setNotifications(prev => ({ ...prev, resolutionAlerts: e.target.checked }))}
                    className="mt-1 rounded text-brand-blue border-slate-300 focus:ring-brand-blue w-4 h-4"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-extrabold text-brand-navy">Resolution Alerts</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Get instant alerts the moment local work crews complete a cleanup or road repair.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifications.weeklyDigest}
                    onChange={e => setNotifications(prev => ({ ...prev, weeklyDigest: e.target.checked }))}
                    className="mt-1 rounded text-brand-blue border-slate-300 focus:ring-brand-blue w-4 h-4"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-extrabold text-brand-navy">Weekly District Digest</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">A high-level weekly synthesis of all civic issues resolved and smart duplicate savings in {profile.city}.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* PANEL 2: PRIVACY & SYSTEM SETTINGS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-brand-navy text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-brand-blue" /> Privacy & Security Settings
                </h3>
                <p className="text-xs text-slate-500">Manage visibility and data footprint parameters.</p>
              </div>

              <div className="space-y-4 pt-1">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={privacy.publicProfile}
                    onChange={e => setPrivacy(prev => ({ ...prev, publicProfile: e.target.checked }))}
                    className="mt-1 rounded text-brand-blue border-slate-300 focus:ring-brand-blue w-4 h-4"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-extrabold text-brand-navy">Public Contributor Profile</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Allow other citizens to view your profile photo, city, badges, and public impact score on local leaderboards.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={privacy.anonymousReports}
                    onChange={e => setPrivacy(prev => ({ ...prev, anonymousReports: e.target.checked }))}
                    className="mt-1 rounded text-brand-blue border-slate-300 focus:ring-brand-blue w-4 h-4"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-extrabold text-brand-navy">Submit Anonymous Reports</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Hide your email and full name from the public map pins and reports details list (AI validation audits still apply).</p>
                  </div>
                </label>

                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 flex items-start gap-2.5 mt-2">
                  <Shield className="w-4 h-4 text-brand-blue flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-600 font-extrabold uppercase block">Data Retention Policy</span>
                    <p className="text-[9px] text-slate-400 leading-normal">
                      UrbanIQ encrypts all geographic reports and active communication metadata. You retain standard deletion control over all submitted evidence assets.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
