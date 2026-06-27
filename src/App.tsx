import React, { useState, useEffect } from 'react';
import { 
  Building, MapPin, AlertTriangle, Trash2, Zap, Droplets, 
  CheckCircle2, Clock, ArrowRight, Search, Filter, Plus, 
  Send, User, Map, BarChart3, Shield, Activity, FileText, 
  Check, Loader2, HelpCircle, Briefcase, Wrench, Navigation, 
  UploadCloud, X, ChevronRight, UserCheck, MessageSquare, ExternalLink,
  Sparkles, Layers, ThumbsUp, Eye, PlusCircle, AlertCircle, Award, Bot,
  Camera, Film
} from 'lucide-react';
import { 
  IssueStatus, IssueSeverity, IssueCategory, 
  PRE_SEEDED_ISSUES, CivicIssue, AICivicAnalysis, Comment, UpdateState 
} from './types';
import GisMap, { getGisCoordinates } from './components/GisMap';
import LocationAutocomplete from './components/LocationAutocomplete';
import { CitizenPortal, CitizenProfile } from './components/CitizenPortal';
import MunicipalDashboard from './components/MunicipalDashboard';
import UrbanIqLogo from './components/UrbanIqLogo';
import { validateAndCorrectHierarchy } from './utils/location';

const getCommunityImpactScore = (issue: CivicIssue): number => {
  let score = 0;
  
  // AI Severity weight
  switch (issue.severity) {
    case 'Critical': score += 50; break;
    case 'Severe': score += 40; break;
    case 'Moderate': score += 25; break;
    case 'Minor': score += 10; break;
    default: score += 10;
  }
  
  // Supporters (upvotes)
  score += (issue.upvotes || 0) * 5;
  
  // Evidence photos
  let photoCount = 0;
  if (issue.imageUrl) photoCount += 1;
  if (issue.evidencePhotos) photoCount += issue.evidencePhotos.length;
  score += photoCount * 10;
  
  // Issue age in hours
  try {
    const reportDate = new Date(issue.reportedAt);
    const now = new Date();
    const diffMs = Math.abs(now.getTime() - reportDate.getTime());
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    score += Math.min(30, diffHours * 0.5);
  } catch (e) {
    score += 5;
  }
  
  return Math.round(score);
};

export default function App() {
  // Global State
  const [issues, setIssues] = useState<CivicIssue[]>([]);

  // Municipal Officer Portal States
  const [officerSession, setOfficerSession] = useState<{ id: string; name: string; role: string; department: string } | null>(() => {
    const saved = localStorage.getItem('urban_iq_officer_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [isOfficerLoginModalOpen, setIsOfficerLoginModalOpen] = useState(false);
  const [officerIdInput, setOfficerIdInput] = useState('');
  const [officerPasswordInput, setOfficerPasswordInput] = useState('');
  const [officerLoginError, setOfficerLoginError] = useState('');

  const [preventedDuplicatesCount, setPreventedDuplicatesCount] = useState<number>(() => {
    const saved = localStorage.getItem('prevented_duplicates_count');
    return saved ? parseInt(saved, 10) : 12;
  });
  const [mergedIssuesCount, setMergedIssuesCount] = useState<number>(() => {
    const saved = localStorage.getItem('merged_issues_count');
    return saved ? parseInt(saved, 10) : 8;
  });
  const [duplicateFoundIssue, setDuplicateFoundIssue] = useState<CivicIssue | null>(null);
  const [duplicateConfidenceScore, setDuplicateConfidenceScore] = useState<number>(0);
  const [duplicateFactors, setDuplicateFactors] = useState<{ image: number; location: number; description: number; category: number } | null>(null);
  
  // Global Profile State (Single Source of Truth)
  const [profile, setProfile] = useState<CitizenProfile>({
    fullName: 'The Blood Gaming',
    email: 'dummy@gmail.com',
    phone: '+1 (555) 019-2834',
    occupation: 'Engineer',
    city: 'San Francisco',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
  });

  const loadData = async () => {
    try {
      const issuesRes = await fetch('/api/issues');
      if (issuesRes.ok) {
        const issuesData = await issuesRes.json();
        setIssues(issuesData);
      }
      const profileRes = await fetch('/api/users/default');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }
    } catch (e) {
      console.error('Error loading data from full-stack backend:', e);
    }
  };

  const handleOfficerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfficerLoginError('');
    try {
      const response = await fetch('/api/officer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officerId: officerIdInput, password: officerPasswordInput })
      });
      if (response.ok) {
        const sessionData = await response.json();
        setOfficerSession(sessionData);
        localStorage.setItem('urban_iq_officer_session', JSON.stringify(sessionData));
        setIsOfficerLoginModalOpen(false);
        setActiveTab('dashboard'); // Redirect to dashboard
        
        // Show success toast
        setNebulaToast({ message: `🏛 Officer ${sessionData.name} successfully logged in!`, type: 'success' });
        setTimeout(() => setNebulaToast(null), 4000);
      } else {
        const errorData = await response.json();
        setOfficerLoginError(errorData.error || 'Invalid Officer ID or Password.');
      }
    } catch (err) {
      console.error('Officer login error:', err);
      setOfficerLoginError('Invalid Officer ID or Password.');
    }
  };

  const handleOfficerUpdateIssue = async (trackingId: string, updateData: any) => {
    try {
      const response = await fetch(`/api/officer/issues/${trackingId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updateData,
          performedBy: officerSession ? `Officer ${officerSession.name}` : 'Officer Mohit'
        })
      });
      if (response.ok) {
        const updatedIssue = await response.json();
        
        // Update local issues state
        setIssues(prev => prev.map(issue => issue.trackingId === updatedIssue.trackingId ? updatedIssue : issue));
        
        // Update trackedIssue if it's currently loaded in tracking tab
        if (trackedIssue && trackedIssue.trackingId === trackingId) {
          setTrackedIssue(updatedIssue);
        }

        // Show success toast
        setNebulaToast({ message: `✅ Officer updates logged for ${trackingId}! Notification sent to citizen.`, type: 'success' });
        setTimeout(() => setNebulaToast(null), 4000);
        return true;
      } else {
        const errorData = await response.json();
        setNebulaToast({ message: `❌ Error: ${errorData.error || 'Failed to update issue.'}`, type: 'error' });
        setTimeout(() => setNebulaToast(null), 4000);
        return false;
      }
    } catch (err) {
      console.error('Officer issue update error:', err);
      setNebulaToast({ message: '❌ Connection error updating issue.', type: 'error' });
      setTimeout(() => setNebulaToast(null), 4000);
      return false;
    }
  };

  useEffect(() => {
    loadData();

    // Sync with other triggers
    const handleProfileUpdate = () => {
      loadData();
    };
    window.addEventListener('urban_iq_profile_updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('urban_iq_profile_updated', handleProfileUpdate);
    };
  }, []);

  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
  const [trackingSearchId, setTrackingSearchId] = useState<string>('');
  const [trackedIssue, setTrackedIssue] = useState<CivicIssue | null>(null);
  
  // Community Tab Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Map Tab State
  const [mapSubTab, setMapSubTab] = useState<'gis' | 'civic'>('gis');
  const [mapHoveredDistrict, setMapHoveredDistrict] = useState<string | null>(null);
  const [mapOverlayMode, setMapOverlayMode] = useState<'standard' | 'heatmap' | 'departments'>('standard');
  const [selectedMapPin, setSelectedMapPin] = useState<CivicIssue | null>(null);

  // Authority Dashboard Workflow States
  const [dashboardSubTab, setDashboardSubTab] = useState<'analytics' | 'workflow'>('analytics');
  const [selectedWorkflowIssueId, setSelectedWorkflowIssueId] = useState<string | null>(null);
  const [workflowRemarks, setWorkflowRemarks] = useState('');
  const [workflowOfficerName, setWorkflowOfficerName] = useState('');
  const [workflowDepartment, setWorkflowDepartment] = useState('Public Works');
  const [workflowInspectionDate, setWorkflowInspectionDate] = useState('');
  const [workflowSearch, setWorkflowSearch] = useState('');

  // Floating AI Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'model', content: string}>>([
    { 
      role: 'model', 
      content: `Hello! I'm Nebula, your AI assistant for UrbanIQ.\n\nI can help you perform actions across the platform, including:\n\n✅ Update your profile information\n✅ Track an issue using its Tracking ID\n✅ Search community issues\n✅ Open different sections of UrbanIQ\n✅ Find reported civic issues\n✅ Assist you with navigating the platform\n\nJust tell me what you'd like to do in natural language.\n\nExamples:\n• "Update my name to Mohit"\n• "Track issue UIQ-102"\n• "Search pothole complaints"\n• "Open my profile"\n• "Show community issues"`
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // New Report Form State
  const [reportMode, setReportMode] = useState<'ai' | 'manual'>('ai');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<IssueCategory>('Potholes');
  const [formSeverity, setFormSeverity] = useState<IssueSeverity>('Moderate');
  const [formDescription, setFormDescription] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formExactLocation, setFormExactLocation] = useState('');
  const [formLat, setFormLat] = useState<number | null>(null);
  const [formLng, setFormLng] = useState<number | null>(null);
  const [formNeighborhood, setFormNeighborhood] = useState('Downtown Core');
  const [formState, setFormState] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formDistrict, setFormDistrict] = useState('');
  const [formImage, setFormImage] = useState<string>('');
  const [aiOptimize, setAiOptimize] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStep, setSubmittingStep] = useState(0);

  // Photo Upload State
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formVideo, setFormVideo] = useState<string | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<{
    duration: string;
    thumbnail: string;
    frames: string[];
  } | null>(null);
  const [mediaType, setMediaType] = useState<'Image' | 'Video'>('Image');
  const [isDragging, setIsDragging] = useState(false);

  // AI Diagnostic Simulation State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Success Submit State
  const [submittedIssue, setSubmittedIssue] = useState<CivicIssue | null>(null);

  // Nebula custom UX states for animations & highlighting
  const [highlightedTab, setHighlightedTab] = useState<string | null>(null);
  const [nebulaToast, setNebulaToast] = useState<{ message: string; type: 'working' | 'success' | 'error' } | null>(null);

  // File Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const extractVideoMetadataAndFrames = (file: File): Promise<{
    duration: string;
    thumbnail: string;
    frames: string[];
  }> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.src = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        const durationSec = video.duration || 0;
        const durationStr = `${Math.round(durationSec)}s`;
        
        // Extract 3 representative frames at 10%, 50%, and 90% of duration
        const frameTimes = [durationSec * 0.1, durationSec * 0.5, durationSec * 0.9];
        const frames: string[] = [];
        let currentFrameIndex = 0;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const seekAndCapture = () => {
          if (currentFrameIndex >= frameTimes.length) {
            resolve({
              duration: durationStr,
              thumbnail: frames[1] || frames[0] || '',
              frames
            });
            URL.revokeObjectURL(video.src);
            return;
          }
          video.currentTime = frameTimes[currentFrameIndex];
        };
        
        video.onseeked = () => {
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 240;
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            frames.push(dataUrl);
          }
          currentFrameIndex++;
          seekAndCapture();
        };
        
        seekAndCapture();
      };
      
      video.onerror = () => {
        resolve({
          duration: '0s',
          thumbnail: '',
          frames: []
        });
      };
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const fileArray = Array.from(files);
    fileArray.forEach(file => {
      const isVideo = file.type.startsWith('video/') || 
                      ['mp4', 'mov', 'webm'].some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (isVideo) {
        setMediaType('Video');
        const reader = new FileReader();
        reader.onloadend = async () => {
          if (typeof reader.result === 'string') {
            setFormVideo(reader.result);
            setFormImages([]); // Clear image previews when video is uploaded
            
            // Extract metadata and frames
            const meta = await extractVideoMetadataAndFrames(file);
            setVideoMetadata(meta);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setMediaType('Image');
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setFormImages(prev => [...prev, reader.result as string]);
            setFormVideo(null);
            setVideoMetadata(null);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemoveImage = (index: number) => {
    setFormImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePresetSelect = (url: string) => {
    setFormImages(prev => {
      if (prev.includes(url)) {
        return prev.filter(img => img !== url);
      }
      return [...prev, url];
    });
  };

  // AI Diagnostics Simulation
  const aiAnalysisSteps = [
    'Initializing Multi-Modal Vision Decoder...',
    'Analyzing pixel contours for structural fracturing...',
    'Locating geocoordinates & checking municipal proximity...',
    'Matching against spatial duplicate index...',
    'Classifying severity score & dispatch parameters...'
  ];

  const detectCategoryFromImage = (imageUrl?: string): IssueCategory => {
    if (!imageUrl) return 'Potholes';
    if (imageUrl.includes('photo-1515162305')) return 'Potholes';
    if (imageUrl.includes('photo-16112844463')) return 'Garbage accumulation';
    if (imageUrl.includes('photo-150430765125')) return 'Water leakage';
    
    // Default fallback list for custom uploads
    const categories: IssueCategory[] = ['Potholes', 'Garbage accumulation', 'Water leakage', 'Drainage blockage', 'Road damage', 'Broken streetlights'];
    const randomIndex = Math.floor(Math.random() * categories.length);
    return categories[randomIndex];
  };

  const MOCK_AI_GENERATIONS: Record<IssueCategory, {
    title: string;
    category: IssueCategory;
    description: string;
    severity: IssueSeverity;
    detectedType: string;
    priority: string;
    confidence: string;
    duplicateProbability: number;
    department: string;
    similarIssueIds: string[];
    technicalSummary: string;
  }> = {
    'Potholes': {
      title: 'Severe Cavity & Pavement Fracture near School Crossing',
      category: 'Potholes',
      description: 'A deep, high-impact pavement crater measuring approximately 4.5 inches in depth and 22 inches in diameter. Located directly in the main driving lane, forcing passing vehicles to make emergency lane adjustments to avoid tire blowouts.',
      severity: 'Severe',
      detectedType: 'Pavement Disintegration & Structural Cavity (Grade 4)',
      priority: 'High Priority (Dispatch within 12h)',
      confidence: '98.4%',
      duplicateProbability: 89,
      department: 'Public Works (Road Repair Team Beta)',
      similarIssueIds: ['UIQ-POT-2026-482903'],
      technicalSummary: 'Severe pavement fatigue on road surface. High kinetic friction hazard detected. Immediate risk to vehicle suspensions.'
    },
    'Garbage accumulation': {
      title: 'Commercial Sidewalk Rubbish Pile & Walkway Obstruction',
      category: 'Garbage accumulation',
      description: 'Unregulated solid waste accumulation spanning across the public walkway. The pile consists of multiple discarded wooden pallets, heavy plastic containers, food debris, and cardboard boxes, restricting wheelchair access.',
      severity: 'Moderate',
      detectedType: 'Solid Waste Obstruction & Sidewalk Encroachment',
      priority: 'Medium Priority (Schedule within 24h)',
      confidence: '95.1%',
      duplicateProbability: 14,
      department: 'Sanitation & Waste Management (Depot 5 Truck)',
      similarIssueIds: ['UIQ-GRB-2026-109245'],
      technicalSummary: 'Medium density residential/commercial waste blocking sidewalk. Violation of public sanitary code and ADA accessibility pathways.'
    },
    'Water leakage': {
      title: 'Active High-Pressure Main Line Subgrade Leak',
      category: 'Water leakage',
      description: 'Clean municipal water main pipe discharge actively rising from underneath the paving slab at approximately 40 gallons per minute. Surrounding asphalt is waterlogged and shows signs of early pavement subsidence.',
      severity: 'Critical',
      detectedType: 'High-Pressure Subsurface Water Line Rupture',
      priority: 'Emergency Dispatch (Immediate response)',
      confidence: '99.2%',
      duplicateProbability: 8,
      department: 'Water Authority (Hydrant & Pressure Squad)',
      similarIssueIds: ['UIQ-WTR-2026-993812'],
      technicalSummary: 'Subsurface hydrostatic pressure buildup from a secondary main line failure. Flowing water is flooding adjacent sewer inlets.'
    },
    'Drainage blockage': {
      title: 'Sewer Inlet Silt Clog & Localized Standing Floodwater',
      category: 'Drainage blockage',
      description: 'Sewer intake grate completely obstructed by heavy leaf mulch, plastic bottles, and organic silt. Standing blackwater has pooled to a depth of 5 inches, overflowing onto adjacent pedestrian pathways.',
      severity: 'Critical',
      detectedType: 'Subsurface Storm Sewer Mainline Obstruction',
      priority: 'Emergency Dispatch (Immediate response)',
      confidence: '94.6%',
      duplicateProbability: 76,
      department: 'Water Authority (Storm Drain Crew)',
      similarIssueIds: ['UIQ-DRN-2026-220199'],
      technicalSummary: 'Intake obstruction causing hydraulic pooling in stormwater channels. High bio-hazard risk due to stagnant street runoff.'
    },
    'Road damage': {
      title: 'Transverse Asphalt Fissure & Severe Lane Settlement',
      category: 'Road damage',
      description: 'An extensive transverse crack stretching across the entire width of the lane, with visible subgrade shifting. One side of the crack has dropped by nearly 3 inches, causing significant jolting to passing vehicles.',
      severity: 'Severe',
      detectedType: 'Major Asphalt Fissures & Subgrade Settlement',
      priority: 'High Priority (Dispatch within 18h)',
      confidence: '96.2%',
      duplicateProbability: 62,
      department: 'Public Works (Heavy Paving Squad)',
      similarIssueIds: [],
      technicalSummary: 'Subsurface base layer shifting leading to shear failure in the asphalt wearing course. Pavement core drilling required.'
    },
    'Broken streetlights': {
      title: 'Sequential Luminaire Circuit Darkness Zone',
      category: 'Broken streetlights',
      description: 'Three consecutive high-pressure sodium street lamps are completely offline, leaving a dark corridor of approximately 150 meters. Visual safety and night driving visibility are severely compromised.',
      severity: 'Moderate',
      detectedType: 'Sequential Luminaire Circuit Outage & Dark Zone',
      priority: 'Medium Priority (Schedule within 48h)',
      confidence: '92.8%',
      duplicateProbability: 5,
      department: 'Transportation & Lighting (Grid Team Delta)',
      similarIssueIds: ['UIQ-LGT-2026-772914'],
      technicalSummary: 'Luminaire relay malfunction or terminal fuse cutout. Bulbs appear physically intact but drawing zero current.'
    },
    'Other': {
      title: 'General Civic Asset Disruption & Inspection Request',
      category: 'Other',
      description: 'An unidentified structural/environmental concern observed on municipal property. General request for site inspection and appropriate department dispatch routing.',
      severity: 'Minor',
      detectedType: 'General Municipal Inspection Asset Concern',
      priority: 'Low Priority (Standard schedule)',
      confidence: '88.5%',
      duplicateProbability: 11,
      department: 'Public Works (Civil Division)',
      similarIssueIds: [],
      technicalSummary: 'Non-critical asset inspection requested. Logged into dispatch system for inspector queue.'
    }
  };

  const generateMockAIAnalysis = (category: IssueCategory, title: string, description: string, images: string[]) => {
    const finalImage = images[0] || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=400';
    
    const baseAnalyses: Record<IssueCategory, any> = {
      'Potholes': {
        detectedType: 'Pavement Disintegration & Structural Cavity (Grade 4)',
        severity: 'Severe',
        confidence: '98.4%',
        priority: 'High Priority (Dispatch within 12h)',
        duplicateProbability: 89,
        department: 'Public Works (Road Repair Team Beta)',
        similarIssueIds: ['UIQ-4829-X8'], // Points to pre-seeded iss-1
        technicalSummary: `Severe localized asphalt distress at coordinates. Multiple circular pavement cavities measured at depths >3.2 inches, creating immediate tire burst/kinetic hazard to moving vehicles.`
      },
      'Garbage accumulation': {
        detectedType: 'Solid Waste Obstruction & Sidewalk Encroachment',
        severity: 'Moderate',
        confidence: '95.1%',
        priority: 'Medium Priority (Schedule within 24h)',
        duplicateProbability: 14,
        department: 'Sanitation & Waste Management (Depot 5 Truck)',
        similarIssueIds: ['UIQ-1092-B2'], // Points to pre-seeded iss-2
        technicalSummary: `Medium-density municipal waste heap blocking pedestrian right-of-way. Potential vector attraction. ADA-compliance violation flagged for prompt sidewalk clearance.`
      },
      'Water leakage': {
        detectedType: 'High-Pressure Subsurface Water Line Rupture',
        severity: 'Critical',
        confidence: '99.2%',
        priority: 'Emergency Dispatch (Immediate response)',
        duplicateProbability: 8,
        department: 'Water Authority (Hydrant & Pressure Squad)',
        similarIssueIds: ['UIQ-9938-Z1'], // Points to pre-seeded iss-3
        technicalSummary: `Active clean-water main discharge measured at approximately 45 gpm. Potential risk of localized subgrade soil liquefaction and street pavement subsidence.`
      },
      'Drainage blockage': {
        detectedType: 'Subsurface Storm Sewer Mainline Obstruction',
        severity: 'Critical',
        confidence: '94.6%',
        priority: 'Emergency Dispatch (Immediate response)',
        duplicateProbability: 76,
        department: 'Water Authority (Storm Drain Crew)',
        similarIssueIds: ['UIQ-2201-P9'], // Points to pre-seeded iss-5
        technicalSummary: `Active wastewater backup overflowing into surrounding pedestrian lanes. Clogged sewer inlet grates. High chemical/sanitation biohazard warning.`
      },
      'Road damage': {
        detectedType: 'Major Asphalt Fissures & Subgrade Settlement',
        severity: 'Severe',
        confidence: '96.2%',
        priority: 'High Priority (Dispatch within 18h)',
        duplicateProbability: 62,
        department: 'Public Works (Heavy Paving Squad)',
        similarIssueIds: [],
        technicalSummary: `Linear transverse cracking spanning entire lane width. Subgrade shifting detected, indicating base-layer instability requiring core drilling and resurfacing.`
      },
      'Broken streetlights': {
        detectedType: 'Sequential Luminaire Circuit Outage & Dark Zone',
        severity: 'Moderate',
        confidence: '92.8%',
        priority: 'Medium Priority (Schedule within 48h)',
        duplicateProbability: 5,
        department: 'Transportation & Lighting (Grid Team Delta)',
        similarIssueIds: ['UIQ-7729-M4'], // Points to pre-seeded iss-4
        technicalSummary: `Multiple sequential light-pole failures indicating centralized controller/relay terminal fault or substation blown grid fuse rather than individual bulb fatigue.`
      },
      'Other': {
        detectedType: 'General Municipal Inspection Asset Concern',
        severity: 'Minor',
        confidence: '88.5%',
        priority: 'Low Priority (Standard schedule)',
        duplicateProbability: 11,
        department: 'Public Works (Civil Division)',
        similarIssueIds: [],
        technicalSummary: `General structural/environmental report logged. Non-critical public concern flagged for municipal spatial inspector routing.`
      }
    };

    const selected = baseAnalyses[category] || baseAnalyses['Other'];
    return {
      ...selected,
      image: finalImage,
      title: title || `Untitled ${category} Report`,
      description: description || 'No description provided.'
    };
  };

  const runAIEngine = async () => {
    setIsAnalyzing(true);
    setAnalyzingStep(0);
    setAiError(null);
    setAiAnalysisResult(null);
    
    // Start incrementing progress steps periodically to keep user engaged
    let currentStep = 0;
    const stepInterval = setInterval(() => {
      if (currentStep < aiAnalysisSteps.length - 1) {
        currentStep += 1;
        setAnalyzingStep(currentStep);
      }
    }, 600);

    try {
      let data: any;
      let usedMedia: string = '';

      if (mediaType === 'Video') {
        if (!formVideo) {
          throw new Error('Please upload a video file before running the AI analysis.');
        }
        
        usedMedia = videoMetadata?.thumbnail || '';

        const response = await fetch('/api/analyze-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            video: formVideo,
            clientExtractedFrames: videoMetadata?.frames || [],
            duration: videoMetadata?.duration || 'Unknown'
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `Server returned ${response.status}`);
        }

        data = await response.json();
      } else {
        let images = [...formImages];
        if (images.length === 0) {
          // Auto-select Pothole Preset for demonstration
          const potholePreset = 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600';
          images = [potholePreset];
          setFormImages([potholePreset]);
        }

        const imageToAnalyze = images[0];
        usedMedia = imageToAnalyze;

        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ image: imageToAnalyze })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `Server returned ${response.status}`);
        }

        data = await response.json();
      }

      // Fast-forward progress steps to the end
      clearInterval(stepInterval);
      setAnalyzingStep(aiAnalysisSteps.length - 1);
      
      // Smoothly transition off the loading state
      setTimeout(() => {
        setIsAnalyzing(false);

        // Auto-fill form fields
        setFormCategory(data.category);
        setFormTitle(data.title);
        setFormDescription(data.description);
        setFormSeverity(data.severity);

        // Set the AI Analysis Result card content
        setAiAnalysisResult({
          detectedType: data.detectedType,
          severity: data.severity,
          confidence: data.confidence,
          priority: data.priority,
          duplicateProbability: data.duplicateProbability,
          department: data.department,
          similarIssueIds: data.similarIssueIds || [],
          technicalSummary: data.technicalSummary,
          image: usedMedia,
          videoSummary: data.videoSummary,
          mediaType: mediaType
        });
      }, 300);

    } catch (err: any) {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
      setAiError(err.message || 'An error occurred during AI analysis. Please verify your GEMINI_API_KEY environment variable.');
      console.error('AI Engine Error:', err);
    }
  };

  // Upvote duplicate helper
  const handleUpvoteAndSupportDuplicate = async (trackingId: string) => {
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingId, userId: 'default' })
      });
      if (response.ok) {
        const updatedIssue = await response.json();
        setIssues(prev => prev.map(i => i.trackingId === trackingId ? { ...i, ...updatedIssue } : i));
        alert(`Successfully registered your support for issue ${trackingId}! This issue's priority is elevated.`);
        setFormTitle('');
        setFormDescription('');
        setFormAddress('');
        setFormExactLocation('');
        setFormLat(null);
        setFormLng(null);
        setFormImages([]);
        setAiAnalysisResult(null);
        setSearchQuery(trackingId); // Prefilter search
        setActiveTab('community');
      }
    } catch (err) {
      console.error('Error supporting duplicate issue:', err);
    }
  };

  // Interactive Landing Page Demo State
  const [demoSelectedId, setDemoSelectedId] = useState<string>('pothole');
  const [demoAnalyzing, setDemoAnalyzing] = useState<boolean>(false);
  const [demoCompleted, setDemoCompleted] = useState<boolean>(true);

  // Save to local storage on changes
  useEffect(() => {
    localStorage.setItem('urban_iq_issues', JSON.stringify(issues));
  }, [issues]);

  useEffect(() => {
    localStorage.setItem('prevented_duplicates_count', preventedDuplicatesCount.toString());
  }, [preventedDuplicatesCount]);

  useEffect(() => {
    localStorage.setItem('merged_issues_count', mergedIssuesCount.toString());
  }, [mergedIssuesCount]);

  // AI Submission Step simulation
  const submissionSteps = [
    'Scanning report text with UrbanIQ NLP models...',
    'Evaluating hazard indicators & cross-referencing district grids...',
    'Generating optimal dispatcher task parameters...',
    'Formulating citizen safety guidelines...'
  ];

  // Interactive Landing Page Demo Presets
  const DEMO_PRESETS: Record<string, {
    title: string;
    category: string;
    severity: string;
    neighborhood: string;
    image: string;
    confidence: string;
    analysis: string;
    action: string;
  }> = {
    pothole: {
      title: "Double Deep Pothole",
      category: "Road damage",
      severity: "Severe",
      neighborhood: "Downtown Core",
      image: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=400",
      confidence: "98.4%",
      analysis: "Multi-layered pavement distress. Heavy tire impact hazard. Grade 4 hazard rating.",
      action: "Dispatched to Road Patch Team Beta (ETA: 12h)"
    },
    streetlight: {
      title: "Unlit Streetlight Grid",
      category: "Broken streetlights",
      severity: "Moderate",
      neighborhood: "Nob Hill North",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400",
      confidence: "95.1%",
      analysis: "Corrupted grid ballast or broken bulb array. Safety concern for school zone.",
      action: "Scheduled for Night Shift Utility Team Delta (ETA: 24h)"
    },
    water: {
      title: "Active Main Water Leak",
      category: "Water leakage",
      severity: "Critical",
      neighborhood: "Oakwood Heights",
      image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400",
      confidence: "99.2%",
      analysis: "High-pressure utility water main rupture. Potential flooding & subsidence risk.",
      action: "Emergency Hydrant Dispatch Squad (ETA: 2h)"
    }
  };

  // Quick Preset Sample Images for Reporting
  const presetImages: Record<IssueCategory, string> = {
    'Potholes': 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=400',
    'Garbage accumulation': 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=400',
    'Water leakage': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400',
    'Drainage blockage': 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400',
    'Road damage': 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=400',
    'Broken streetlights': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
    'Other': 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=400'
  };

  // Icon mapping
  const categoryIcons: Record<string, any> = {
    'Potholes': AlertTriangle,
    'Garbage accumulation': Trash2,
    'Water leakage': Droplets,
    'Drainage blockage': Activity,
    'Road damage': Navigation,
    'Broken streetlights': Zap,
    'Other': HelpCircle
  };

  // Color mapping
  const severityColors: Record<IssueSeverity, { bg: string, text: string, border: string }> = {
    'Minor': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    'Moderate': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    'Severe': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'Critical': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  };

  const statusColors: Record<IssueStatus, string> = {
    'Reported': 'bg-slate-100 text-slate-800 border border-slate-200',
    'Verified': 'bg-blue-50 text-blue-700 border border-blue-100',
    'Assigned': 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    'Inspection Scheduled': 'bg-purple-50 text-purple-700 border border-purple-100',
    'Work In Progress': 'bg-amber-50 text-amber-700 border border-amber-100',
    'Resolved': 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    'Closed': 'bg-rose-50 text-rose-700 border border-rose-100'
  };

  const districtColors: Record<string, string> = {
    'Downtown Core': '#3B82F6',
    'Nob Hill North': '#8B5CF6',
    'SoMa Business Hub': '#EC4899',
    'Central Park / Sunset': '#10B981',
    'Oakwood Heights': '#F59E0B'
  };

  // Upvote issue
  const handleUpvote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: id, userId: 'default' })
      });
      if (response.ok) {
        const updatedIssue = await response.json();
        setIssues(prev => prev.map(i => i.id === id ? { ...i, ...updatedIssue } : i));
        if (selectedIssue && selectedIssue.id === id) {
          setSelectedIssue(prev => prev ? { ...prev, ...updatedIssue } : null);
        }
      }
    } catch (err) {
      console.error('Error upvoting issue:', err);
    }
  };

  // Submit dynamic comment
  const [commentText, setCommentText] = useState('');
  const handleAddComment = async (issueId: string) => {
    if (!commentText.trim()) return;
    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comments: {
            text: commentText,
            userName: 'You (Citizen Reporter)',
            userRole: 'Citizen'
          }
        })
      });
      if (response.ok) {
        const updatedIssue = await response.json();
        setIssues(prev => prev.map(i => i.id === issueId ? { ...i, ...updatedIssue } : i));
        setSelectedIssue(prev => prev && prev.id === issueId ? { ...prev, ...updatedIssue } : null);
        setCommentText('');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const findDuplicateIssue = (
    category: IssueCategory,
    title: string,
    description: string,
    imageUrl: string,
    neighborhood: string,
    address: string,
    lat?: number | null,
    lng?: number | null,
    exactLocation?: string
  ): CivicIssue | null => {
    // Look through active unresolved issues
    for (const existing of issues) {
      if (existing.status === 'Resolved') continue;

      // New weighted duplicate score:
      // - Category similarity: 10%
      // - Location similarity: 35%
      // - Description similarity: 25%
      // - Image similarity: 30%
      // Only mark as duplicate if the final score exceeds 75%.

      // 1. Same Category (Requirement 1 & Weight 10%)
      let categoryScore = 0.0;
      if (existing.category === category) {
        categoryScore = 1.0;
      } else {
        continue; // MUST have same category to be considered a duplicate!
      }

      // 2. Similar Location / Same Locality (Requirement 2 & Weight 35%)
      let locationScore = 0.0;
      const isSameNeighborhood = (existing.location.district || existing.location.neighborhood || '').toLowerCase().trim() === neighborhood.toLowerCase().trim();
      const isSameAddress = address.trim() && (
        existing.location.address.toLowerCase().includes(address.toLowerCase()) || 
        address.toLowerCase().includes(existing.location.address.toLowerCase())
      );

      // Coordinate proximity check (Requirement 5)
      // Standard distance threshold of ~150-200 meters. (0.0018 degrees is ~200 meters)
      if (lat !== undefined && lat !== null && lng !== undefined && lng !== null &&
          existing.location.lat !== undefined && existing.location.lat !== null &&
          existing.location.lng !== undefined && existing.location.lng !== null) {
        const distLat = Math.abs(existing.location.lat - lat);
        const distLng = Math.abs(existing.location.lng - lng);
        const deltaDegrees = Math.sqrt(distLat * distLat + distLng * distLng);

        if (deltaDegrees <= 0.0018) {
          locationScore = 1.0; // Within ~200 meters threshold
        } else if (deltaDegrees <= 0.004) {
          locationScore = 0.75; // Within ~400 meters
        } else if (deltaDegrees <= 0.01) {
          locationScore = 0.4; // Moderately close (~1km)
        } else {
          locationScore = 0.0;
        }
      } else {
        if (isSameAddress) {
          locationScore = 1.0;
        } else if (isSameNeighborhood) {
          locationScore = 0.7;
        } else {
          // Spatial distance check based on coordinates (Requirement 9 / mapping helpers)
          const c1 = getGisCoordinates(existing);
          const mockIssue: CivicIssue = {
            id: 'temp',
            title,
            category,
            description,
            reportedAt: new Date().toISOString(),
            status: 'Reported',
            severity: 'Moderate',
            upvotes: 0,
            comments: [],
            updates: [],
            trackingId: '',
            location: {
              lat: existing.location.lat,
              lng: existing.location.lng,
              neighborhood,
              address
            }
          };
          const c2 = getGisCoordinates(mockIssue);
          const distLat = Math.abs(c1[0] - c2[0]);
          const distLng = Math.abs(c1[1] - c2[1]);
          const deltaDegrees = Math.sqrt(distLat * distLat + distLng * distLng);
          if (deltaDegrees <= 0.0018) {
            locationScore = 0.95;
          } else if (deltaDegrees <= 0.005) {
            locationScore = 0.6;
          }
        }
      }

      // Exact Location description / landmark similarity boost (Requirement 5)
      if (exactLocation && existing.location.exactLocation) {
        const el1 = exactLocation.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
        const el2 = existing.location.exactLocation.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
        
        let landmarkScore = 0.0;
        if (el1 === el2 || el1.includes(el2) || el2.includes(el1)) {
          landmarkScore = 1.0;
        } else {
          const tokens1 = el1.split(/\s+/).filter(t => t.length > 3);
          const tokens2 = el2.split(/\s+/).filter(t => t.length > 3);
          if (tokens1.length > 0 && tokens2.length > 0) {
            const set2 = new Set(tokens2);
            let overlapCount = 0;
            tokens1.forEach(t => {
              if (set2.has(t)) overlapCount++;
            });
            landmarkScore = overlapCount / Math.min(tokens1.length, tokens2.length);
          }
        }

        // Boost the location score if high landmark similarity detected
        if (landmarkScore > 0.4) {
          locationScore = Math.min(1.0, Math.max(locationScore, landmarkScore * 1.1));
        }
      }

      // 3. Similar Description (Requirement 3 & Weight 25%)
      let descriptionScore = 0.0;
      const d1 = description.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      const d2 = existing.description.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      const words1 = d1.split(/\s+/).filter(w => w.length > 3);
      const words2 = d2.split(/\s+/).filter(w => w.length > 3);

      if (words1.length > 0 && words2.length > 0) {
        let overlap = 0;
        const wordSet2 = new Set(words2);
        words1.forEach(w => {
          if (wordSet2.has(w)) overlap++;
        });
        const smallerLen = Math.min(words1.length, words2.length);
        descriptionScore = overlap / smallerLen;
      }

      // 4. Similar Image When Available (Requirement 4 & Weight 30%)
      let imageScore = 1.0; // Default to 1.0 when image is NOT available on one or both, so we don't penalize
      if (imageUrl && existing.imageUrl) {
        if (imageUrl === existing.imageUrl) {
          imageScore = 1.0;
        } else {
          imageScore = 0.0; // Different images provided
        }
      }

      const finalScore = Math.round(
        (categoryScore * 10) +
        (locationScore * 35) +
        (descriptionScore * 25) +
        (imageScore * 30)
      );

      if (finalScore > 75) {
        setDuplicateConfidenceScore(finalScore);
        setDuplicateFactors({
          category: Math.round(categoryScore * 100),
          location: Math.round(locationScore * 100),
          description: Math.round(descriptionScore * 100),
          image: Math.round(imageScore * 100)
        });
        return existing;
      }
    }
    return null;
  };

  const handleSupportDuplicate = async (dupIssue: CivicIssue) => {
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: dupIssue.id, userId: 'default' })
      });
      if (response.ok) {
        const updatedIssue = await response.json();
        setIssues(prev => prev.map(i => i.id === dupIssue.id ? { ...i, ...updatedIssue } : i));
        setPreventedDuplicatesCount(prev => prev + 1);
        
        // Clear form and show success
        setDuplicateFoundIssue(null);
        setFormTitle('');
        setFormDescription('');
        setFormAddress('');
        setFormExactLocation('');
        setFormLat(null);
        setFormLng(null);
        setFormImages([]);
        setAiAnalysisResult(null);
        setSearchQuery(dupIssue.trackingId);
        setActiveTab('community');
      }
    } catch (err) {
      console.error('Error supporting duplicate:', err);
    }
  };

  const handleAddEvidenceToDuplicate = async (dupIssue: CivicIssue) => {
    const finalImage = formImages[0] || formImage || presetImages[formCategory];
    try {
      const response = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: dupIssue.id, imageUrl: finalImage, userId: 'default' })
      });
      if (response.ok) {
        const updatedIssue = await response.json();
        setIssues(prev => prev.map(i => i.id === dupIssue.id ? { ...i, ...updatedIssue } : i));
        setPreventedDuplicatesCount(prev => prev + 1);
        
        // Clear form and show success
        setDuplicateFoundIssue(null);
        setFormTitle('');
        setFormDescription('');
        setFormAddress('');
        setFormExactLocation('');
        setFormLat(null);
        setFormLng(null);
        setFormImages([]);
        setAiAnalysisResult(null);
        setSearchQuery(dupIssue.trackingId);
        setActiveTab('community');
      }
    } catch (err) {
      console.error('Error adding evidence to duplicate:', err);
    }
  };

  const handleViewDuplicateDetails = (dupIssue: CivicIssue) => {
    setSelectedIssue(dupIssue);
  };

  const handleCreateSeparateReport = async () => {
    setDuplicateFoundIssue(null);
    await handleFormSubmit(undefined, true);
  };

  // Handle New Issue Submit (With Server AI Integration)
  const handleFormSubmit = async (e?: React.FormEvent, bypassDuplicate: boolean = false) => {
    if (e) e.preventDefault();
    if (!formTitle || !formDescription) return;

    setIsSubmitting(true);
    setSubmittingStep(0);

    // Animate the loading steps for the user
    const interval = setInterval(() => {
      setSubmittingStep(prev => {
        if (prev < submissionSteps.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 1000);

    // Abbreviation helper
    const getCategoryAbbr = (cat: IssueCategory): string => {
      switch (cat) {
        case 'Potholes': return 'POT';
        case 'Garbage accumulation': return 'GRB';
        case 'Water leakage': return 'WTR';
        case 'Drainage blockage': return 'DRN';
        case 'Road damage': return 'ROD';
        case 'Broken streetlights': return 'LGT';
        default: return 'OTH';
      }
    };

    const year = "2026";
    const randomNum = Math.floor(100000 + Math.random() * 900000).toString();
    const trackingId = `UIQ-${getCategoryAbbr(formCategory)}-${year}-${randomNum}`;
    const finalImage = formImages[0] || formImage || presetImages[formCategory];

    // Check for smart duplicate detection
    if (!bypassDuplicate) {
      const duplicate = findDuplicateIssue(formCategory, formTitle, formDescription, finalImage, formDistrict, formAddress, formLat, formLng, formExactLocation);
      if (duplicate) {
        clearInterval(interval);
        setDuplicateFoundIssue(duplicate);
        setIsSubmitting(false);
        return;
      }
    }

    let aiAnalysis: AICivicAnalysis | undefined;

    // Use pre-computed aiAnalysisResult if available, otherwise generate mock
    if (aiOptimize) {
      const selectedAnalysis = aiAnalysisResult || generateMockAIAnalysis(formCategory, formTitle, formDescription, formImages);
      aiAnalysis = {
        technicalSummary: selectedAnalysis.technicalSummary,
        department: selectedAnalysis.department.split(' (')[0],
        priorityLevel: (selectedAnalysis.severity === 'Critical' ? 'Critical' : selectedAnalysis.severity === 'Severe' ? 'High' : 'Medium') as any,
        complexityRating: (formCategory === 'Water leakage' || formCategory === 'Drainage blockage' || formCategory === 'Road damage' ? 'Complex' : 'Moderate') as any,
        estimatedTimeline: formCategory === 'Water leakage' ? '6-12 hours' : formCategory === 'Potholes' ? '24-48 hours' : '2-4 days',
        aiConfidence: parseInt(selectedAnalysis.confidence) || 95,
        citizenSafetyGuidelines: formCategory === 'Potholes' 
          ? [
              'Reduce speed to under 15 MPH when approaching this intersection.',
              'Do not swerve into oncoming lanes.',
              'Cyclists should dismount and walk along pedestrian sidewalk paths.'
            ]
          : [
              'Stay cautious when traversing this specific area.',
              'Keep clean distance from structural road debris.'
            ],
        requiredEquipment: formCategory === 'Potholes'
          ? [
              'Rapid-set cold-mix asphalt compound',
              'Vibratory plate compactor / roller',
              'Active safety warning signage and safety pylons'
            ]
          : [
              'Standard municipal tools',
              'Safety signaling gear'
            ],
        aiAutoKeywords: ['CitizenReport', formCategory.replace(' ', '')]
      };
    }

    clearInterval(interval);

    // Fallback if somehow disabled or empty
    if (!aiAnalysis) {
      aiAnalysis = {
        technicalSummary: `A reported municipal concern titled "${formTitle}" requiring inspection. Registered for dispatcher assessment.`,
        department: formCategory === 'Water leakage' || formCategory === 'Drainage blockage' ? 'Water Authority' : formCategory === 'Broken streetlights' ? 'Transportation & Lighting' : formCategory === 'Garbage accumulation' ? 'Sanitation & Waste Management' : 'Public Works',
        priorityLevel: formSeverity === 'Critical' ? 'Critical' : formSeverity === 'Severe' ? 'High' : 'Medium',
        complexityRating: 'Moderate',
        estimatedTimeline: '3-5 days',
        aiConfidence: 80,
        citizenSafetyGuidelines: ['Stay cautious when traversing this specific area.', 'Keep clean distance from structural road debris.'],
        requiredEquipment: ['Standard municipal tools', 'Safety signaling gear'],
        aiAutoKeywords: ['CitizenReport', formCategory.replace(' ', '')]
      } as any;
    }

    setIsSubmitting(true);
    try {
      let finalLat = formLat;
      let finalLng = formLng;
      let finalState = formState;
      let finalCity = formCity;
      let finalDistrict = formDistrict;

      // Geocode address if GPS coordinates are not available
      if (finalLat === null || finalLng === null) {
        try {
          const query = formAddress || 'New Delhi, India';
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              const result = data[0];
              finalLat = parseFloat(result.lat);
              finalLng = parseFloat(result.lon);
              
              const addr = result.address || {};
              const country = addr.country || '';
              const rawSt = addr.state || addr.region || '';
              const rawCt = addr.city || addr.town || addr.village || addr.municipality || addr.city_district || '';
              const rawDst = addr.county || addr.suburb || addr.city_district || addr.neighbourhood || '';
              
              const resolved = validateAndCorrectHierarchy(rawSt, rawCt, rawDst, country, result.display_name);
              finalState = resolved.state;
              finalCity = resolved.city;
              finalDistrict = resolved.district;
            }
          }
        } catch (e) {
          console.error('On-demand geocoding failed', e);
        }
      }

      // Ensure that coordinates are always filled (if geocoding failed)
      if (finalLat === null || finalLng === null) {
        finalLat = 37.7749;
        finalLng = -122.4194;
      }

      // Always validate and correct hierarchy before submission to ensure absolute geographical consistency
      const resolved = validateAndCorrectHierarchy(finalState, finalCity, finalDistrict, '', formAddress);
      finalState = resolved.state;
      finalCity = resolved.city;
      finalDistrict = resolved.district;

      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          category: formCategory,
          severity: formSeverity,
          address: formAddress || '100 Municipal Way',
          exactLocation: formExactLocation,
          latitude: finalLat,
          longitude: finalLng,
          imageUrl: mediaType === 'Video' ? (videoMetadata?.thumbnail || '') : finalImage,
          mediaType: mediaType,
          mediaPath: mediaType === 'Video' ? (formVideo || '') : '',
          videoThumbnail: mediaType === 'Video' ? (videoMetadata?.thumbnail || '') : '',
          videoDuration: mediaType === 'Video' ? (videoMetadata?.duration || '') : '',
          videoSummary: mediaType === 'Video' ? (aiAnalysisResult?.videoSummary || '') : '',
          state: finalState,
          city: finalCity,
          district: finalDistrict
        })
      });
      if (response.ok) {
        const createdIssue = await response.json();
        setIssues(prev => [createdIssue, ...prev]);
        setSubmittedIssue(createdIssue);
      }
    } catch (err) {
      console.error('Error submitting reported issue:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // AI Civic Action Execution
  const executeAiAction = (name: string, args: any) => {
    console.log('Executing AI Action:', name, args);

    // Show 'working' toast
    setNebulaToast({ message: `Nebula: Initiating ${name.replace(/([A-Z])/g, ' $1').toLowerCase()}...`, type: 'working' });

    const completeToast = (message: string, isSuccess = true) => {
      setNebulaToast({ message, type: isSuccess ? 'success' : 'error' });
      setTimeout(() => {
        setNebulaToast(null);
      }, 4000);
    };

    const triggerHighlight = (tab: string) => {
      setHighlightedTab(tab);
      setTimeout(() => {
        setHighlightedTab(null);
      }, 2500);
    };

    const smoothScrollTo = (elementId: string) => {
      setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);
    };

    switch (name) {
      case 'updateProfile': {
        const performProfileUpdate = async () => {
          try {
            const response = await fetch('/api/users/default', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(args)
            });
            if (response.ok) {
              const updatedProfile = await response.json();
              setProfile(updatedProfile);
              window.dispatchEvent(new CustomEvent('urban_iq_profile_updated', { detail: updatedProfile }));
              
              // Add activity log to local events
              const customEvents = JSON.parse(localStorage.getItem('urban_iq_custom_events') || '[]');
              const newEvent = {
                id: `evt-${Date.now()}`,
                type: 'profile',
                title: 'Profile Updated via Nebula',
                desc: `Nebula modified details: ${Object.keys(args).join(', ')}.`,
                timestamp: new Date().toISOString()
              };
              localStorage.setItem('urban_iq_custom_events', JSON.stringify([newEvent, ...customEvents]));
              window.dispatchEvent(new CustomEvent('urban_iq_custom_events_updated'));

              triggerHighlight('profile');
              setActiveTab('profile');
              completeToast(`✅ Profile successfully updated via Nebula!`);
            } else {
              completeToast(`❌ Failed to update profile details.`, false);
            }
          } catch (e) {
            console.error('Error updating profile via Nebula:', e);
            completeToast(`❌ Profile update failed due to a server error.`, false);
          }
        };
        performProfileUpdate();
        break;
      }
      
      case 'navigate': {
        if (args.tab) {
          setActiveTab(args.tab);
          setSelectedIssue(null);
          triggerHighlight(args.tab);
          completeToast(`🚀 Navigated to ${args.tab.toUpperCase()} page!`);
          
          if (args.tab === 'map') {
            smoothScrollTo('map-container');
          } else if (args.tab === 'dashboard') {
            smoothScrollTo('dashboard-container');
          }
        }
        break;
      }

      case 'trackIssue': {
        if (args.trackingId) {
          const trackingId = args.trackingId.toUpperCase();
          setTrackingSearchId(trackingId);
          const found = issues.find(i => 
            i.trackingId.toUpperCase() === trackingId ||
            i.id.toUpperCase() === trackingId
          );
          setTrackedIssue(found || null);
          setActiveTab('track');
          triggerHighlight('track');
          
          if (found) {
            completeToast(`🔍 Located report "${found.title}"! Showing timeline.`);
            smoothScrollTo('tracked-issue-container');
          } else {
            completeToast(`❌ No active issue found with Tracking ID: ${trackingId}`, false);
          }
        }
        break;
      }

      case 'searchIssues': {
        setSearchQuery(args.query || '');
        if (args.category) setCategoryFilter(args.category);
        else setCategoryFilter('All');
        
        if (args.severity) setSeverityFilter(args.severity);
        else setSeverityFilter('All');
        
        if (args.status) setStatusFilter(args.status);
        else setStatusFilter('All');
        
        setActiveTab('community');
        triggerHighlight('community');
        completeToast(`🔍 Feed filtered according to your search query.`);
        smoothScrollTo('community-feed');
        break;
      }

      case 'filterIssuesByCategory': {
        if (args.category) {
          setCategoryFilter(args.category);
          setSearchQuery('');
          setActiveTab('community');
          triggerHighlight('community');
          completeToast(`📁 Filtered feed by category: ${args.category}`);
          smoothScrollTo('community-feed');
        }
        break;
      }

      case 'showMyReports': {
        setActiveTab('profile');
        triggerHighlight('profile');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('urban_iq_portal_subtab', { detail: 'reports' }));
        }, 100);
        completeToast(`📋 Loading your submitted reports list...`);
        break;
      }

      case 'supportIssue': {
        if (args.trackingId) {
          const performSupport = async () => {
            try {
              const response = await fetch('/api/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackingId: args.trackingId, userId: 'default' })
              });
              if (response.ok) {
                const updated = await response.json();
                setIssues(prev => prev.map(i => i.trackingId.toLowerCase() === args.trackingId.toLowerCase() ? updated : i));
                if (selectedIssue?.trackingId.toLowerCase() === args.trackingId.toLowerCase()) {
                  setSelectedIssue(updated);
                }
                completeToast(`⭐ Registered your support for "${updated.title}"!`);
              } else {
                completeToast(`❌ Tracking ID "${args.trackingId}" not found.`, false);
              }
            } catch (e) {
              console.error('Error supporting issue via Nebula:', e);
              completeToast(`❌ Error recording your upvote.`, false);
            }
          };
          performSupport();
        }
        break;
      }

      case 'viewIssueDetails': {
        if (args.trackingId) {
          const found = issues.find(i => 
            i.trackingId.toLowerCase() === args.trackingId.toLowerCase() ||
            i.id.toLowerCase() === args.trackingId.toLowerCase()
          );
          if (found) {
            setSelectedIssue(found);
            completeToast(`📄 Displaying detailed modal for report.`);
          } else {
            completeToast(`❌ Tracking ID "${args.trackingId}" not found.`, false);
          }
        }
        break;
      }

      case 'showHighestImpactIssues': {
        setSortBy('upvotes');
        setActiveTab('community');
        triggerHighlight('community');
        completeToast(`🔥 Sorting community feed by highest upvotes/impact!`);
        smoothScrollTo('community-feed');
        break;
      }

      case 'openReportForm': {
        setReportMode('manual');
        setActiveTab('report');
        triggerHighlight('report');
        completeToast(`📝 Opening report filing form.`);
        break;
      }

      case 'prefillReportForm': {
        setReportMode('manual');
        if (args.category) setFormCategory(args.category);
        if (args.title) setFormTitle(args.title);
        if (args.description) setFormDescription(args.description);
        if (args.location) setFormAddress(args.location);
        setActiveTab('report');
        triggerHighlight('report');
        completeToast(`📝 Form pre-filled for ${args.category || 'your complaint'}! Ready for submission.`);
        break;
      }

      case 'openMunicipalDashboard': {
        setActiveTab('dashboard');
        triggerHighlight('dashboard');
        completeToast('🏛 Loading Municipal Command Center Dashboard...');
        break;
      }

      case 'showCriticalIssues': {
        setSeverityFilter('Critical');
        setActiveTab('community');
        triggerHighlight('community');
        completeToast('🔥 Filtering community feed to Critical priority issues.');
        smoothScrollTo('community-feed');
        break;
      }

      case 'assignIssue': {
        const performAssign = async () => {
          try {
            const { trackingId, department, officerName, remarks } = args;
            const res = await fetch(`/api/officer/issues/${trackingId}/update`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ department, status: 'Assigned', officerName, remarks })
            });
            if (res.ok) {
              const updated = await res.json();
              setIssues(prev => prev.map(i => i.trackingId === updated.trackingId ? updated : i));
              completeToast(`✅ Assigned issue ${trackingId} to ${department}`);
              setActiveTab('dashboard');
              triggerHighlight('dashboard');
            } else {
              completeToast(`❌ Failed to assign issue ${trackingId}`, false);
            }
          } catch (e) {
            completeToast(`❌ Network error while assigning issue.`, false);
          }
        };
        performAssign();
        break;
      }

      case 'markIssueResolved': {
        const performResolve = async () => {
          try {
            const { trackingId, remarks } = args;
            const res = await fetch(`/api/officer/issues/${trackingId}/update`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'Resolved', remarks: remarks || 'Resolved via Nebula Command.' })
            });
            if (res.ok) {
              const updated = await res.json();
              setIssues(prev => prev.map(i => i.trackingId === updated.trackingId ? updated : i));
              completeToast(`✅ Issue ${trackingId} marked as RESOLVED!`);
              setActiveTab('dashboard');
              triggerHighlight('dashboard');
            } else {
              completeToast(`❌ Failed to resolve issue ${trackingId}`, false);
            }
          } catch (e) {
            completeToast(`❌ Network error while resolving issue.`, false);
          }
        };
        performResolve();
        break;
      }

      case 'updateInspectionRemarks': {
        const performRemarksUpdate = async () => {
          try {
            const { trackingId, remarks } = args;
            const res = await fetch(`/api/officer/issues/${trackingId}/update`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ remarks })
            });
            if (res.ok) {
              const updated = await res.json();
              setIssues(prev => prev.map(i => i.trackingId === updated.trackingId ? updated : i));
              completeToast(`📝 Remarks updated for issue ${trackingId}`);
              setActiveTab('dashboard');
              triggerHighlight('dashboard');
            } else {
              completeToast(`❌ Failed to update remarks.`, false);
            }
          } catch (e) {
            completeToast(`❌ Network error.`, false);
          }
        };
        performRemarksUpdate();
        break;
      }

      default:
        console.warn('Unknown AI Action:', name);
        setNebulaToast(null);
    }
  };

  // Floating AI Chat Submission helper
  const submitMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    setChatHistory(prev => [...prev, { role: 'user', content: messageText }]);
    setChatLoading(true);

    try {
      const response = await fetch('/api/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: [...chatHistory, { role: 'user', content: messageText }],
          issues: issues.map(i => ({
            id: i.id,
            trackingId: i.trackingId,
            title: i.title,
            status: i.status,
            category: i.category,
            description: i.description,
            location: i.location,
            reportedAt: i.reportedAt,
            severity: i.severity,
            upvotes: i.upvotes,
            updates: i.updates,
            aiAnalysis: i.aiAnalysis,
            assignedDepartment: i.assignedDepartment,
            assignedOfficer: i.assignedOfficer,
            inspectionDate: i.inspectionDate,
            progressRemarks: i.progressRemarks
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory(prev => [...prev, { role: 'model', content: data.reply }]);
        
        // Execute real action if provided by Nebula response
        if (data.action) {
          executeAiAction(data.action.name, data.action.args);
        }
      } else {
        throw new Error('Chat API returned error');
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', content: "I am having trouble reaching Nebula. Please make sure the server is healthy and try again later!" }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMessage = chatInput;
    setChatInput('');
    await submitMessage(userMessage);
  };

  // Look up issue by tracking ID
  const handleTrackingSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = issues.find(i => i.trackingId.toLowerCase() === trackingSearchId.trim().toLowerCase());
    setTrackedIssue(found || null);
    if (!found) {
      alert('No record found with that Tracking ID.');
    }
  };

  // Admin Dispatcher Simulation: Advance Status
  const handleAdvanceStatus = async (issueId: string, nextStatus: IssueStatus) => {
    const notes: Record<IssueStatus, string> = {
      'Reported': 'Report opened and awaiting manual dispatch review.',
      'Verified': 'Field supervisor assigned to verify reported coordinates.',
      'Assigned': 'Repair assigned in municipal work queue.',
      'Inspection Scheduled': 'On-site safety and engineering inspection scheduled.',
      'Work In Progress': 'Heavy machinery and repair crew on site.',
      'Resolved': 'Civil engineering works finalized and site cleared. Operations completed.',
      'Closed': 'Ticket closed and archived.'
    };

    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          note: notes[nextStatus],
          performedBy: 'Municipal Dispatcher (Simulated)'
        })
      });
      if (response.ok) {
        const updated = await response.json();
        setIssues(prev => prev.map(issue => issue.id === issueId ? updated : issue));
        if (selectedIssue?.id === issueId) setSelectedIssue(updated);
        if (trackedIssue?.id === issueId) setTrackedIssue(updated);
      }
    } catch (err) {
      console.error('Error advancing issue status:', err);
    }
  };

  const handleAuthorityAction = async (
    trackingId: string,
    action: 'verify' | 'assign' | 'schedule' | 'start-work' | 'complete-work' | 'close' | 'update-remarks',
    payload: any
  ) => {
    try {
      const res = await fetch(`/api/issues/${trackingId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updatedIssue = await res.json();
        setIssues(prev => prev.map(i => i.trackingId === trackingId || i.id === trackingId ? updatedIssue : i));
        if (selectedIssue && (selectedIssue.trackingId === trackingId || selectedIssue.id === trackingId)) {
          setSelectedIssue(updatedIssue);
        }
        if (trackedIssue && (trackedIssue.trackingId === trackingId || trackedIssue.id === trackingId)) {
          setTrackedIssue(updatedIssue);
        }
        return updatedIssue;
      } else {
        const errData = await res.json();
        alert(`Error executing action: ${errData.error || 'Server error'}`);
      }
    } catch (e) {
      console.error('Error triggering authority action:', e);
      alert('Network error communicating with the municipal server.');
    }
    return null;
  };

  // Filter Issues
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          issue.trackingId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || issue.category === categoryFilter;
    const matchesSeverity = severityFilter === 'All' || issue.severity === severityFilter;
    const matchesStatus = statusFilter === 'All' || issue.status === statusFilter;
    return matchesSearch && matchesCategory && matchesSeverity && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
    if (sortBy === 'upvotes') return b.upvotes - a.upvotes;
    if (sortBy === 'severity') {
      const rank = { 'Critical': 4, 'Severe': 3, 'Moderate': 2, 'Minor': 1 };
      return rank[b.severity] - rank[a.severity];
    }
    return 0;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 bg-brand-navy border-b border-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
              <UrbanIqLogo size="2.5rem" className="shadow-sm" />
              <div>
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-200 bg-clip-text text-transparent">
                  UrbanIQ
                </span>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide">SMART CIVIC HUB</p>
              </div>
            </div>

            {/* Nav Menu */}
            <div className="hidden lg:flex items-center space-x-1">
              {[
                { id: 'home', label: 'Home' },
                { id: 'report', label: 'Report an Issue' },
                { id: 'community', label: 'Explore Community Issues' },
                { id: 'track', label: 'Track My Report' },
                { id: 'map', label: 'Map Intelligence' },
                { id: 'profile', label: 'Profile' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSelectedIssue(null);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === item.id 
                      ? 'bg-brand-blue text-white shadow-md shadow-blue-500/10' 
                      : highlightedTab === item.id 
                        ? 'bg-amber-500 text-slate-950 font-extrabold animate-pulse scale-105 shadow-lg ring-2 ring-amber-400'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              {/* Staff Access Control */}
              {officerSession ? (
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setSelectedIssue(null);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/10'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Staff Dashboard</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setOfficerLoginError('');
                    setOfficerIdInput('');
                    setOfficerPasswordInput('');
                    setIsOfficerLoginModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all duration-200 cursor-pointer"
                >
                  <Building className="w-4 h-4 text-slate-400" />
                  <span>Staff Login</span>
                </button>
              )}
            </div>

            {/* Right Quick Action */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('report')}
                className="bg-brand-blue hover:bg-brand-blue-dark text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>File Report</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Submenu Slider */}
        <div className="lg:hidden bg-brand-navy-light border-t border-slate-700 overflow-x-auto whitespace-nowrap px-4 py-2 scrollbar-none flex gap-1.5 items-center">
          {[
            { id: 'home', label: 'Home' },
            { id: 'report', label: 'Report an Issue' },
            { id: 'community', label: 'Explore Community Issues' },
            { id: 'track', label: 'Track My Report' },
            { id: 'map', label: 'Map GIS' },
            { id: 'profile', label: 'Citizen Portal' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSelectedIssue(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold inline-block transition-all cursor-pointer ${
                activeTab === item.id 
                  ? 'bg-brand-blue text-white' 
                  : highlightedTab === item.id 
                    ? 'bg-amber-500 text-slate-950 font-extrabold animate-pulse scale-105 shadow-lg ring-2 ring-amber-400'
                    : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* Mobile Staff Access Control */}
          {officerSession ? (
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setSelectedIssue(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Staff Dashboard</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setOfficerLoginError('');
                setOfficerIdInput('');
                setOfficerPasswordInput('');
                setIsOfficerLoginModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1 bg-slate-800 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            >
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>Staff Login</span>
            </button>
          )}
        </div>
      </nav>

      {/* CORE CANVAS WORKSPACE */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* HOME TAB - PREMIUM LANDING PAGE */}
        {activeTab === 'home' && (
          <div className="space-y-20 pb-16 animate-fade-in">
            
            {/* SECTION 1: HERO SECTION */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-3xl p-8 sm:p-16 border border-slate-800 shadow-2xl">
              {/* Decorative gradients */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-blue/20 rounded-full blur-3xl -mr-40 -mt-40"></div>
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
              
              <div className="relative flex flex-col items-center justify-center text-center">
                
                {/* Centered content block */}
                <div className="max-w-3xl mx-auto space-y-6 flex flex-col items-center justify-center">
                  <div className="inline-flex items-center gap-2 bg-brand-blue/20 text-blue-300 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-blue-500/30">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                    <span>Powered by UrbanIQ</span>
                  </div>
                  
                  <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
                    Smarter Communities. <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Better Civic Services.</span>
                  </h1>
                  
                  <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
                    UrbanIQ is an AI-powered civic intelligence platform that helps citizens and local authorities report, monitor, and resolve public infrastructure issues. From villages and towns to large cities, UrbanIQ enables faster reporting, smarter prioritization, and transparent issue resolution.
                  </p>
                  
                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-4 pt-4 justify-center">
                    <button
                      onClick={() => setActiveTab('report')}
                      className="bg-brand-blue hover:bg-brand-blue-dark text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:translate-y-[-2px] active:translate-y-0 transition-all duration-200 cursor-pointer text-base"
                    >
                      <span>Report an Issue</span>
                      <ArrowRight className="w-5 h-5 text-blue-200" />
                    </button>
                    <button
                      onClick={() => setActiveTab('community')}
                      className="bg-slate-800/80 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2.5 border border-slate-700/80 hover:border-slate-600 hover:translate-y-[-2px] active:translate-y-0 transition-all duration-200 cursor-pointer text-base"
                    >
                      <span>Explore Community Issues</span>
                      <Search className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  {/* Trust indicator or feature snippets */}
                  <div className="pt-6 border-t border-slate-800/60 flex flex-wrap gap-x-8 gap-y-3 text-xs text-slate-400 justify-center w-full">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Zero Administration Lag</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Predictive Routing API</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Public Audit Trails</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* SECTION 2: STATISTICS SECTION */}
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-brand-blue uppercase tracking-widest bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
                  INTEGRATED CIVIC NETWORK
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy">
                  Powering Modern Municipal Logistics
                </h2>
                <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                  Real-time synchronization across local wards, civil engineers, emergency dispatch lines, and municipal dashboards.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                {[
                  { 
                    label: 'Issues Reported', 
                    value: (14820 + issues.length).toLocaleString(), 
                    change: '+14% this week',
                    icon: FileText, 
                    color: 'from-blue-500 to-indigo-600',
                    bg: 'bg-blue-50',
                    iconColor: 'text-blue-600',
                    spark: [40, 45, 42, 50, 58, 62, 65]
                  },
                  { 
                    label: 'Issues Resolved', 
                    value: (12490 + issues.filter(i => i.status === 'Resolved').length).toLocaleString(), 
                    change: '94.2% success rate',
                    icon: CheckCircle2, 
                    color: 'from-emerald-500 to-teal-600',
                    bg: 'bg-emerald-50',
                    iconColor: 'text-emerald-600',
                    spark: [30, 35, 38, 45, 52, 59, 62]
                  },
                  { 
                    label: 'Active Citizens', 
                    value: '42,850+', 
                    change: 'Live local contributors',
                    icon: UserCheck, 
                    color: 'from-violet-500 to-fuchsia-600',
                    bg: 'bg-purple-50',
                    iconColor: 'text-purple-600',
                    spark: [70, 72, 75, 78, 81, 84, 88]
                  },
                  { 
                    label: 'Localities Covered', 
                    value: '35 Wards', 
                    change: 'Full regional coverage',
                    icon: MapPin, 
                    color: 'from-amber-500 to-orange-600',
                    bg: 'bg-amber-50',
                    iconColor: 'text-amber-600',
                    spark: [35, 35, 35, 35, 35, 35, 35]
                  }
                ].map((stat, idx) => (
                  <div 
                    key={idx} 
                    className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between text-left hover:-translate-y-1"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className={`p-3 rounded-xl ${stat.bg}`}>
                          <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase">SECURE NETWORK</span>
                      </div>
                      
                      <div>
                        <span className="text-3xl font-extrabold text-brand-navy tracking-tight group-hover:text-brand-blue transition-colors block">
                          {stat.value}
                        </span>
                        <p className="text-sm font-bold text-slate-800 pt-0.5">{stat.label}</p>
                        <p className="text-xs text-slate-400 pt-0.5">{stat.change}</p>
                      </div>
                    </div>

                    {/* Elegant Sparkline Graphic (Micro visual trend indicator) */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-end justify-between">
                      <span className="text-[10px] font-mono text-slate-400">TREND PROFILE</span>
                      <div className="flex items-end gap-0.5 h-6">
                        {stat.spark.map((val, sIdx) => {
                          const maxVal = Math.max(...stat.spark);
                          const heightPct = (val / maxVal) * 100;
                          return (
                            <div 
                              key={sIdx} 
                              className={`w-1 rounded-full bg-gradient-to-t ${stat.color}`} 
                              style={{ height: `${Math.max(20, heightPct)}%` }}
                            ></div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: FEATURES SECTION & INTERACTIVE AI DEMO */}
            <div className="space-y-12 text-left">
              <div className="text-center space-y-2">
                <span className="text-xs font-extrabold text-brand-blue uppercase tracking-widest bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
                  SYSTEM REPERTOIRE
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy">
                  Civic Engineering Redefined
                </h2>
                <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                  Discover six essential pillars of the UrbanIQ civic stack, turning community insights into real-time public infrastructure repairs.
                </p>
              </div>

              {/* Bento Grid layout with Features & AI Interactive Sandbox */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side: 6 Features (Grid of cards) */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      title: "AI-Assisted Detection",
                      desc: "Utilizes advanced models for AI-assisted issue detection, extracting details directly from submitted photos and video files.",
                      icon: Eye,
                      color: "text-blue-500",
                      bg: "bg-blue-50"
                    },
                    {
                      title: "Community Participation",
                      desc: "Empower citizen collaboration and community participation by letting residents upvote, discuss, and confirm local reports.",
                      icon: ThumbsUp,
                      color: "text-emerald-500",
                      bg: "bg-emerald-50"
                    },
                    {
                      title: "Duplicate Prevention",
                      desc: "Smart duplicate report prevention algorithms analyze geolocation data to merge matching claims and optimize public resources.",
                      icon: Layers,
                      color: "text-amber-500",
                      bg: "bg-amber-50"
                    },
                    {
                      title: "Faster Municipal Response",
                      desc: "Intelligent routing schedules issue verification and dispatches local response crews to secure a faster municipal response.",
                      icon: Zap,
                      color: "text-purple-500",
                      bg: "bg-purple-50"
                    },
                    {
                      title: "Data-Driven Decisions",
                      desc: "Interactive heatmaps and high-density sector grids support local authorities in making data-driven decision making.",
                      icon: Map,
                      color: "text-teal-500",
                      bg: "bg-teal-50"
                    },
                    {
                      title: "Transparent Issue Tracking",
                      desc: "Provides transparent issue tracking with live timeline updates, assigned department logs, and public verification records.",
                      icon: FileText,
                      color: "text-pink-500",
                      bg: "bg-pink-50"
                    }
                  ].map((feat, fIdx) => (
                    <div 
                      key={fIdx} 
                      className="p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 space-y-3 text-left"
                    >
                      <div className={`p-2.5 rounded-lg inline-block ${feat.bg}`}>
                        <feat.icon className={`w-5 h-5 ${feat.color}`} />
                      </div>
                      <h3 className="font-bold text-brand-navy text-sm">{feat.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Right Side: Interactive AI Image Diagnostics Sandbox Mockup */}
                <div className="lg:col-span-5 bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-2xl border border-slate-800 p-6 text-white space-y-6 shadow-xl text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] text-blue-400 font-mono uppercase tracking-widest block">INTERACTIVE SIMULATOR</span>
                    <h3 className="text-lg font-bold text-white">Interactive AI Analysis</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Select a sample image below to see how our AI-powered civic intelligence analyzes images, extracts severity ratings, and optimizes automated work routing.
                    </p>
                  </div>

                  {/* Thumbnail selectors */}
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(DEMO_PRESETS).map(([key, item]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setDemoSelectedId(key);
                          setDemoAnalyzing(true);
                          setDemoCompleted(false);
                          setTimeout(() => {
                            setDemoAnalyzing(false);
                            setDemoCompleted(true);
                          }, 800);
                        }}
                        className={`p-1 rounded-xl border transition-all text-left overflow-hidden cursor-pointer relative group ${
                          demoSelectedId === key 
                            ? 'border-brand-blue bg-blue-950/40 ring-2 ring-blue-500/20' 
                            : 'border-slate-800 hover:border-slate-700 bg-slate-900/50'
                        }`}
                      >
                        <div className="h-14 w-full rounded-lg overflow-hidden relative">
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          {demoSelectedId === key && (
                            <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                              <span className="bg-brand-blue/95 text-[8px] font-bold text-white px-1.5 py-0.5 rounded shadow">ACTIVE</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-center mt-1.5 truncate text-slate-300">{item.title}</p>
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Simulation Terminal */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-left space-y-3.5 min-h-[220px] relative overflow-hidden">
                    
                    {demoAnalyzing && (
                      <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
                        <span className="text-[10px] text-blue-400 font-mono animate-pulse">CLASSIFYING METADATA CLUSTERS...</span>
                      </div>
                    )}

                    {demoCompleted && (
                      <div className="space-y-3 animate-fade-in">
                        
                        {/* Terminal header */}
                        <div className="flex justify-between items-center text-[10px] text-slate-500 pb-2 border-b border-slate-900">
                          <span>FILE REFERENCE: COMPLAINT_DET_#{demoSelectedId.toUpperCase()}</span>
                          <span className="text-emerald-400">SCAN SUCCESS: {DEMO_PRESETS[demoSelectedId].confidence}</span>
                        </div>

                        {/* Title & Classification */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">REPORT: <span className="text-white font-bold">{DEMO_PRESETS[demoSelectedId].title}</span></span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                              {DEMO_PRESETS[demoSelectedId].category}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            District ward: {DEMO_PRESETS[demoSelectedId].neighborhood}
                          </p>
                        </div>

                        {/* Neural Insight output */}
                        <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1 text-[10px]">
                          <span className="text-brand-blue font-bold">AI ANALYSIS:</span>
                          <p className="text-slate-300 leading-relaxed font-mono">
                            {DEMO_PRESETS[demoSelectedId].analysis}
                          </p>
                        </div>

                        {/* Status classification */}
                        <div className="flex justify-between items-center text-[10px]">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                            <span className="text-slate-400">PRIORITY LEVEL:</span>
                            <span className="text-rose-400 font-bold">{DEMO_PRESETS[demoSelectedId].severity}</span>
                          </div>
                          <div className="text-slate-400">
                            ACTION ROUTE: <span className="text-indigo-400 font-bold">{DEMO_PRESETS[demoSelectedId].action}</span>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* SECTION 4: HOW IT WORKS SECTION */}
            <div className="space-y-12 text-left">
              <div className="text-center space-y-2">
                <span className="text-xs font-extrabold text-brand-blue uppercase tracking-widest bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
                  WORKFLOW PIPELINE
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy">
                  From Report to Resolution
                </h2>
                <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                  How UrbanIQ handles complaints, optimizing municipal operations seamlessly.
                </p>
              </div>

              {/* Horizontal / Vertical workflow visual card list */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                {[
                  {
                    step: "01",
                    title: "Citizen Report",
                    desc: "An active citizen uploads a photo & details via mobile or web portal.",
                    badge: "Submit",
                    color: "border-blue-200"
                  },
                  {
                    step: "02",
                    title: "AI Analysis",
                    desc: "AI-assisted issue detection logs coordinates, predicts severity, and routes tickets.",
                    badge: "Evaluate",
                    color: "border-indigo-200"
                  },
                  {
                    step: "03",
                    title: "Validation",
                    desc: "Local community upvotes, comments, and verifies issue location.",
                    badge: "Upvote & Audit",
                    color: "border-purple-200"
                  },
                  {
                    step: "04",
                    title: "Authority Action",
                    desc: "Assigned civil engineers schedule, patch, or repair on-site.",
                    badge: "Crew Dispatch",
                    color: "border-amber-200"
                  },
                  {
                    step: "05",
                    title: "Resolution",
                    desc: "The completed task is publically documented, archived, and updated.",
                    badge: "Verified Solved",
                    color: "border-emerald-200"
                  }
                ].map((wk, wIdx) => (
                  <div 
                    key={wIdx} 
                    className={`bg-white rounded-2xl p-6 border ${wk.color} shadow-sm space-y-4 hover:shadow-md transition-shadow relative text-left`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-4xl font-black text-slate-100 font-mono">{wk.step}</span>
                      <span className="text-[9px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase font-mono border border-slate-200">
                        {wk.badge}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-brand-navy text-sm flex items-center gap-2">
                        <span>{wk.title}</span>
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {wk.desc}
                      </p>
                    </div>

                    {/* Stepper Arrow overlay on desktop */}
                    {wIdx < 5 && wIdx !== 4 && (
                      <div className="hidden md:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10 bg-white border border-slate-200 p-1 rounded-full shadow text-slate-400">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 5: CALL TO ACTION */}
            <div className="relative bg-gradient-to-br from-brand-navy to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-blue opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              
              <div className="relative max-w-3xl mx-auto text-center space-y-6">
                <span className="bg-brand-blue/30 text-blue-300 text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full border border-blue-500/20">
                  COMMUNITY-WIDE COLLABORATION
                </span>
                
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                  Shape the Future of Your Neighborhood Today
                </h2>
                
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                  Take ownership of your neighborhood. Use UrbanIQ to log maintenance issues, report utility outages, consult our real-time AI Civic Assistant, and collaborate directly with local engineering teams to ensure quick and transparent fixes.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <button
                    onClick={() => setActiveTab('report')}
                    className="bg-brand-blue hover:bg-brand-blue-dark text-white px-7 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 hover:translate-y-[-1px] transition-all cursor-pointer text-sm"
                  >
                    <span>File a Local Report</span>
                    <Plus className="w-4.5 h-4.5" />
                  </button>
                  <button
                    onClick={() => setChatOpen(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-7 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer text-sm"
                  >
                    <span>Consult Nebula</span>
                    <Bot className="w-4.5 h-4.5 text-blue-300 animate-pulse" />
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 6: MUNICIPAL STAFF PORTAL CARD */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 md:p-10 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row justify-between items-center gap-6 mt-8">
              <div className="flex items-start gap-4 text-left max-w-2xl">
                <div className="p-4 bg-slate-900 text-white rounded-2xl flex-shrink-0 shadow-md">
                  <Building className="w-6 h-6 text-brand-blue" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">
                      CIVIC ADMINISTRATION NODE
                    </span>
                    <span className="bg-slate-200/60 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                      STAFF ACCESS
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <span>🏛 Municipal Staff Portal</span>
                  </h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Secure portal for authorized municipal personnel and officers to manage civic issues. Log in with your security credentials to access administrative dashboard controls, manage work crews, schedule on-site inspections, and resolve reported public hazards.
                  </p>
                </div>
              </div>
              
              <div className="flex-shrink-0 w-full md:w-auto flex flex-col sm:flex-row items-center gap-4 justify-end">
                {officerSession ? (
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-sm w-full md:w-auto">
                    <div className="text-left space-y-0.5">
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                        ACTIVE DISPATCHER
                      </span>
                      <p className="text-xs font-extrabold text-slate-800">{officerSession.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono font-semibold">{officerSession.department}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          setActiveTab('dashboard');
                          setSelectedIssue(null);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex-grow text-center"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => {
                          localStorage.removeItem('urban_iq_officer_session');
                          setOfficerSession(null);
                        }}
                        className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all cursor-pointer flex-grow text-center"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setOfficerLoginError('');
                      setOfficerIdInput('');
                      setOfficerPasswordInput('');
                      setIsOfficerLoginModalOpen(true);
                    }}
                    className="w-full md:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-black transition-all shadow-md shadow-slate-900/10 cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5"
                  >
                    <Building className="w-4 h-4" />
                    <span>Staff Login</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

        {/* REPORT TAB */}
        {activeTab === 'report' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {duplicateFoundIssue ? (
              <div className="max-w-2xl mx-auto bg-white border-2 border-amber-500/30 rounded-2xl p-8 shadow-lg space-y-6 animate-fade-in">
                <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-500">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-extrabold text-brand-navy">A similar issue already exists in your area.</h2>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
                    Our UrbanIQ Smart Duplicate Detection system has identified an active report matching your concern nearby. You can support this issue to expedite repairs!
                  </p>
                </div>

                {/* Duplicate Confidence Score Indicator */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
                    <div>
                      <span className="text-[10px] font-mono text-amber-700 font-bold block uppercase tracking-wider">Duplicate Match Matchmaker</span>
                      <span className="text-xs font-extrabold text-amber-950">Confidence Score Assessment</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-black text-amber-600 font-mono">{duplicateConfidenceScore}%</span>
                    <span className="text-[9px] text-amber-600 font-bold uppercase tracking-wider">Similar Match</span>
                  </div>
                </div>

                {/* Matching Factors breakdown */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase tracking-wider">Smart Duplicate Signal Analysis</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Category */}
                    <div className="bg-white p-3 rounded-lg border border-slate-150 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Category Match</span>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-lg font-extrabold text-slate-800 font-mono">
                          {duplicateFactors?.category ?? 100}%
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">(Weight 10%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all" 
                          style={{ width: `${duplicateFactors?.category ?? 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="bg-white p-3 rounded-lg border border-slate-150 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Location Match</span>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-lg font-extrabold text-slate-800 font-mono">
                          {duplicateFactors?.location ?? 0}%
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">(Weight 30%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className="bg-brand-blue h-full rounded-full transition-all" 
                          style={{ width: `${duplicateFactors?.location ?? 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white p-3 rounded-lg border border-slate-150 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Desc. Match</span>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-lg font-extrabold text-slate-800 font-mono">
                          {duplicateFactors?.description ?? 0}%
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">(Weight 20%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className="bg-amber-500 h-full rounded-full transition-all" 
                          style={{ width: `${duplicateFactors?.description ?? 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Image */}
                    <div className="bg-white p-3 rounded-lg border border-slate-150 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Image Match</span>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-lg font-extrabold text-slate-800 font-mono">
                          {duplicateFactors?.image ?? 100}%
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">(Weight 40%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className="bg-purple-500 h-full rounded-full transition-all" 
                          style={{ width: `${duplicateFactors?.image ?? 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-90% warning indicator */}
                {duplicateConfidenceScore < 90 && (
                  <div className="bg-red-50 border border-red-200 text-red-950 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1 text-left">
                      <p className="font-extrabold text-sm text-red-950">Different Issue Detected?</p>
                      <p className="text-xs text-red-800 leading-relaxed font-bold">
                        This may be a different issue. You can still create a separate report.
                      </p>
                    </div>
                  </div>
                )}

                {/* Existing Issue details */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b border-slate-200 gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase">Existing Issue ID</span>
                      <span className="text-brand-navy font-mono font-black text-sm bg-amber-50 border border-amber-200 px-2.5 py-1 rounded inline-block mt-1">
                        {duplicateFoundIssue.trackingId}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[duplicateFoundIssue.status]}`}>
                        {duplicateFoundIssue.status}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${severityColors[duplicateFoundIssue.severity].bg} ${severityColors[duplicateFoundIssue.severity].text} ${severityColors[duplicateFoundIssue.severity].border}`}>
                        {duplicateFoundIssue.severity} Severity
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block uppercase mb-1">Title</span>
                      <span className="text-slate-800 font-semibold">{duplicateFoundIssue.title}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase mb-1">Current Supporters</span>
                      <span className="text-slate-800 font-bold flex items-center gap-1.5">
                        <ThumbsUp className="w-4 h-4 text-brand-blue" />
                        {duplicateFoundIssue.upvotes} Citizens Supporting
                      </span>
                    </div>
                    {duplicateFoundIssue.location && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 font-bold block uppercase mb-1">Reported Location</span>
                        <span className="text-slate-800 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          {duplicateFoundIssue.location.address} ({duplicateFoundIssue.location.district || duplicateFoundIssue.location.neighborhood})
                        </span>
                      </div>
                    )}
                    {duplicateFoundIssue.imageUrl && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 font-bold block uppercase mb-1.5">Original Attached Image</span>
                        <div className="relative h-40 w-full rounded-lg overflow-hidden border border-slate-200">
                          <img src={duplicateFoundIssue.imageUrl} alt="Existing reported issue" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Grid (4 buttons) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleSupportDuplicate(duplicateFoundIssue)}
                    className="bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border-0"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>Support Existing Issue</span>
                  </button>
                  <button
                    onClick={() => handleAddEvidenceToDuplicate(duplicateFoundIssue)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border-0"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Add Evidence</span>
                  </button>
                  <button
                    onClick={() => handleViewDuplicateDetails(duplicateFoundIssue)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border-0"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Issue Details</span>
                  </button>
                  <button
                    onClick={handleCreateSeparateReport}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border-0"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>Create Separate Report</span>
                  </button>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setDuplicateFoundIssue(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-semibold underline cursor-pointer border-0 bg-transparent"
                  >
                    Go back and edit my report
                  </button>
                </div>
              </div>
            ) : submittedIssue ? (
              <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-6 animate-fade-in">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold text-brand-navy">Report Successfully Filed!</h2>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Your report has been logged in the municipal GIS database. The UrbanIQ AI has routed this to the appropriate civil repair team.
                  </p>
                </div>

                {/* Issue Details Box */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 space-y-4 text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 text-xs">
                    <span className="text-slate-400 font-mono font-bold">GENERATED ISSUE ID:</span>
                    <span className="text-brand-navy font-mono font-black text-sm bg-blue-50 border border-blue-200 px-2.5 py-1 rounded">
                      {submittedIssue.trackingId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block font-bold">CURRENT STATUS</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1.5 mt-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Reported
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold">ESTIMATED REVIEW TIME</span>
                      <span className="text-brand-navy font-bold mt-1 block">Within 4 Hours</span>
                    </div>
                  </div>

                  {submittedIssue.aiAnalysis && (
                    <div className="pt-3 text-xs border-t border-slate-200/60">
                      <span className="text-slate-400 block font-bold mb-1">DESIGNATED ROUTE</span>
                      <p className="text-brand-navy font-medium leading-relaxed">
                        {submittedIssue.aiAnalysis.department} • Priority Level: <span className="font-bold text-amber-600">{submittedIssue.aiAnalysis.priorityLevel}</span>
                      </p>
                    </div>
                  )}

                  {/* Tracking Link representation */}
                  <div className="pt-3 text-xs border-t border-slate-200/60 flex flex-col gap-1.5">
                    <span className="text-slate-400 block font-bold">SHAREABLE TRACKING LINK</span>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 font-mono text-[11px] text-slate-600 justify-between">
                      <span className="truncate">https://urba-iq.city/track/{submittedIssue.trackingId}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://urba-iq.city/track/${submittedIssue.trackingId}`);
                          alert('Copied tracking link to clipboard!');
                        }}
                        className="text-brand-blue hover:text-brand-blue-dark font-extrabold flex items-center gap-1 cursor-pointer bg-transparent border-0 outline-none"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => {
                      setTrackedIssue(submittedIssue);
                      setTrackingSearchId(submittedIssue.trackingId);
                      setActiveTab('track');
                      setSubmittedIssue(null);
                    }}
                    className="flex-grow bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold py-3.5 px-5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15 cursor-pointer transition-colors border-0"
                  >
                    <Activity className="w-4 h-4" />
                    <span>Track Active Issue</span>
                  </button>
                  <button
                    onClick={() => {
                      setSubmittedIssue(null);
                      setFormTitle('');
                      setFormDescription('');
                      setFormAddress('');
                      setFormExactLocation('');
                      setFormLat(null);
                      setFormLng(null);
                      setFormImages([]);
                      setAiAnalysisResult(null);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-brand-navy font-bold py-3.5 px-5 rounded-xl text-sm transition-colors cursor-pointer border border-slate-200"
                  >
                    File Another Report
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy">Report a Civic Issue</h1>
                  <p className="text-slate-500 text-sm">Provide details below. Our AI processes and routes submissions automatically.</p>
                </div>

                {/* REPORTING MODE TOGGLE */}
                <div className="flex bg-slate-100 p-1 rounded-xl max-w-md mx-auto border border-slate-200/80 shadow-sm animate-fade-in my-4">
                  <button
                    type="button"
                    onClick={() => {
                      setReportMode('ai');
                      setAiOptimize(true);
                    }}
                    className={`flex-1 py-2 px-3 sm:py-2.5 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer border-0 outline-none ${
                      reportMode === 'ai'
                        ? 'bg-brand-blue text-white shadow-sm'
                        : 'text-slate-600 hover:text-brand-navy hover:bg-slate-200 bg-transparent'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>AI Assisted Reporting</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReportMode('manual');
                      setAiOptimize(false);
                      setAiAnalysisResult(null);
                    }}
                    className={`flex-1 py-2 px-3 sm:py-2.5 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer border-0 outline-none ${
                      reportMode === 'manual'
                        ? 'bg-white text-brand-navy shadow-sm border border-slate-200/50'
                        : 'text-slate-600 hover:text-brand-navy hover:bg-slate-200 bg-transparent'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Manual Reporting</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <form onSubmit={handleFormSubmit} className="p-6 sm:p-8 space-y-6">

                    {reportMode === 'ai' && (
                      <div className="space-y-6 animate-fade-in">
                        {/* PHOTO & VIDEO UPLOAD SYSTEM */}
                        <div className="space-y-4">
                          <label className="text-sm font-bold text-brand-navy flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <UploadCloud className="w-4.5 h-4.5 text-brand-blue" />
                              <span>1. Attach Photo or Video for AI Analysis <span className="text-xs font-normal text-slate-400">(Required for AI Mode)</span></span>
                            </span>
                            {mediaType === 'Video' && formVideo && (
                              <span className="text-[10px] font-extrabold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                Video Attached
                              </span>
                            )}
                            {mediaType === 'Image' && formImages.length > 0 && (
                              <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                Photo Attached
                              </span>
                            )}
                          </label>
                          
                          {/* Drag and Drop Zone */}
                          <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                              isDragging 
                                ? 'border-brand-blue bg-blue-50/50 scale-[0.99]' 
                                : 'border-slate-200 hover:border-brand-blue/50 bg-slate-50'
                            }`}
                            onClick={() => document.getElementById('device-photos-upload')?.click()}
                          >
                            <input 
                              type="file" 
                              id="device-photos-upload" 
                              accept="image/png, image/jpeg, image/jpg, image/webp, video/mp4, video/quicktime, video/webm" 
                              onChange={handleFileSelect} 
                              className="hidden" 
                            />
                            <div className="flex flex-col items-center gap-3">
                              <div className="flex items-center gap-4">
                                <div className={`flex flex-col items-center gap-1 p-2 rounded-xl border ${mediaType === 'Image' && formImages.length > 0 ? 'border-brand-blue bg-blue-50/50' : 'border-slate-200 bg-white'}`}>
                                  <Camera className={`w-5.5 h-5.5 ${mediaType === 'Image' && formImages.length > 0 ? 'text-brand-blue' : 'text-slate-400'}`} />
                                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Image</span>
                                </div>
                                <div className={`flex flex-col items-center gap-1 p-2 rounded-xl border ${mediaType === 'Video' && formVideo ? 'border-purple-300 bg-purple-50/50' : 'border-slate-200 bg-white'}`}>
                                  <Film className={`w-5.5 h-5.5 ${mediaType === 'Video' && formVideo ? 'text-purple-600' : 'text-slate-400'}`} />
                                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Video</span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-slate-700">
                                Drag & drop media here, or <span className="text-brand-blue underline font-black">click to select from device</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">Supports Images (JPG, PNG, WEBP) & Videos (MP4, MOV, WEBM)</span>
                            </div>
                          </div>

                          {/* Video Playback Preview */}
                          {mediaType === 'Video' && formVideo && (
                            <div className="space-y-2 text-left">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
                                  <Film className="w-3.5 h-3.5 text-purple-600" />
                                  <span>Uploaded Video Preview ({videoMetadata?.duration || 'Analyzing...'})</span>
                                </h4>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormVideo(null);
                                    setVideoMetadata(null);
                                    setMediaType('Image');
                                  }}
                                  className="text-[10px] font-bold text-red-500 hover:text-red-600 cursor-pointer flex items-center gap-0.5 bg-transparent border-0"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Remove Video</span>
                                </button>
                              </div>
                              <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video shadow-sm bg-slate-950 flex items-center justify-center">
                                <video 
                                  src={formVideo} 
                                  controls 
                                  className="w-full h-full max-h-[240px] object-contain"
                                />
                                {videoMetadata?.duration && (
                                  <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md text-white font-mono text-[9px] font-bold px-2 py-1 rounded-md border border-slate-700/50">
                                    Duration: {videoMetadata.duration}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
 
                          {/* Previews Grid with delete button */}
                          {mediaType === 'Image' && formImages.length > 0 && (
                            <div className="space-y-2 text-left">
                              <h4 className="text-xs font-bold text-brand-navy">Uploaded Previews ({formImages.length})</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {formImages.map((img, index) => (
                                  <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video shadow-sm bg-slate-100">
                                    <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveImage(index);
                                      }}
                                      className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-all flex items-center justify-center border-0 cursor-pointer"
                                      title="Remove image"
                                    >
                                      <X className="w-3 h-3 text-white" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Quick Preset Buttons */}
                          <div className="space-y-2 text-left">
                            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Or Use Quick Preset Sample Images</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setFormImages([]);
                                  setAiAnalysisResult(null);
                                }}
                                className={`p-3 border rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${formImages.length === 0 ? 'bg-blue-50 text-brand-blue' : 'hover:bg-slate-50 bg-slate-100 text-slate-700'}`}
                              >
                                Reset / No Image
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePresetSelect('https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600')}
                                className={`p-1.5 border rounded-xl overflow-hidden relative group transition-all bg-white cursor-pointer ${formImages.includes('photo-1515162305') ? 'border-brand-blue ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}
                              >
                                <img src="https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=150" alt="pothole" className="w-full h-10 object-cover rounded-md" />
                                <span className="text-[9px] block font-bold text-slate-500 mt-1 text-center font-sans">Pothole Preset</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePresetSelect('https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600')}
                                className={`p-1.5 border rounded-xl overflow-hidden relative group transition-all bg-white cursor-pointer ${formImages.includes('photo-16112844463') ? 'border-brand-blue ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}
                              >
                                <img src="https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=150" alt="trash" className="w-full h-10 object-cover rounded-md" />
                                <span className="text-[9px] block font-bold text-slate-500 mt-1 text-center font-sans">Garbage Preset</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePresetSelect('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600')}
                                className={`p-1.5 border rounded-xl overflow-hidden relative group transition-all bg-white cursor-pointer ${formImages.includes('photo-150430765125') ? 'border-brand-blue ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}
                              >
                                <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=150" alt="leak" className="w-full h-10 object-cover rounded-md" />
                                <span className="text-[9px] block font-bold text-slate-500 mt-1 text-center font-sans">Water Main Preset</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* AI Optimization Switch & Analyze Trigger */}
                        <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 space-y-4 text-left">
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5 text-left">
                              <span className="text-xs font-black text-brand-blue flex items-center gap-1.5 uppercase tracking-wide">
                                <Shield className="w-3.5 h-3.5" />
                                <span>UrbanIQ AI Engine</span>
                              </span>
                              <h4 className="text-sm font-bold text-brand-navy">Enable Automated AI Analysis</h4>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                Optimizes titles, auto-assigns municipal departments, determines priority indexes, lists necessary field gear, and formulates citizen safety bulletins using Gemini 3.5.
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={aiOptimize}
                                onChange={e => {
                                  setAiOptimize(e.target.checked);
                                  if (!e.target.checked) {
                                    setAiAnalysisResult(null);
                                  }
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                            </label>
                          </div>

                          {aiOptimize && (
                            <div className="pt-2 border-t border-blue-100/60 flex flex-col gap-3 text-left">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-slate-500">
                                  Inspect compliance and verify routing before submitting:
                                </span>
                                <button
                                  type="button"
                                  disabled={isAnalyzing}
                                  onClick={runAIEngine}
                                  className="w-full sm:w-auto bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed transition-all border-0"
                                >
                                  {isAnalyzing ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                  ) : (
                                    <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                                  )}
                                  <span>{isAnalyzing ? 'Running Neural Diagnostic...' : 'Run UrbanIQ AI Engine'}</span>
                                </button>
                              </div>

                              {/* Loading state with animation steps */}
                              {isAnalyzing && (
                                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-3 animate-pulse">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-brand-blue font-bold tracking-widest uppercase">AI ENGINE DIAGNOSING</span>
                                    <span className="text-[11px] font-mono font-bold text-slate-400">{Math.round((analyzingStep + 1) / aiAnalysisSteps.length * 100)}%</span>
                                  </div>
                                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-brand-blue transition-all duration-300"
                                      style={{ width: `${((analyzingStep + 1) / aiAnalysisSteps.length) * 100}%` }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-slate-300 font-mono flex items-center gap-2">
                                    <Loader2 className="w-3 h-3 text-brand-blue animate-spin" />
                                    <span>{aiAnalysisSteps[analyzingStep]}</span>
                                  </p>
                                </div>
                              )}

                              {/* Error state */}
                              {aiError && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-xs flex gap-2 items-start mt-2">
                                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                  <div className="space-y-1">
                                    <p className="font-bold">AI Diagnostics Failed</p>
                                    <p>{aiError}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* AI Analysis Result Card */}
                        {aiOptimize && aiAnalysisResult && !isAnalyzing && (
                          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 overflow-hidden shadow-xl animate-fade-in space-y-0 text-left">
                            
                            {/* Card Header */}
                            <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-brand-blue animate-pulse" />
                                <div>
                                  <h3 className="text-sm font-extrabold tracking-tight uppercase">UrbanIQ AI Analysis Result</h3>
                                  <p className="text-[10px] text-slate-400 font-medium font-mono">NEURAL DISPATCH FEED v4.2</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-mono font-bold text-slate-400">Confidence:</span>
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-mono font-black">
                                  {aiAnalysisResult.confidence}
                                </span>
                              </div>
                            </div>

                            {/* Card Grid Content */}
                            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                              
                              {/* Left side: Scanned Image/Video Preview */}
                              <div className="md:col-span-5 space-y-4">
                                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">
                                  {aiAnalysisResult.mediaType === 'Video' ? 'AI Scanned Video Thumbnail' : 'AI Scanned Image'}
                                </span>
                                <div className="relative rounded-xl overflow-hidden aspect-video border border-slate-800 bg-slate-950 flex items-center justify-center">
                                  <img 
                                    src={aiAnalysisResult.image} 
                                    alt="Scanned" 
                                    className="w-full h-full object-cover" 
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                                  <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-slate-950/70 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono font-semibold text-slate-300">
                                    <Layers className="w-3 h-3 text-brand-blue" />
                                    <span>{aiAnalysisResult.mediaType === 'Video' ? 'VIDEO VERIFIED' : 'IMAGE VERIFIED'}</span>
                                  </div>
                                </div>

                                {aiAnalysisResult.mediaType === 'Video' && videoMetadata && (
                                  <div className="space-y-2 mt-4 pt-4 border-t border-slate-800">
                                    <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">Representative Frames Analyzed</span>
                                    <div className="grid grid-cols-3 gap-2">
                                      {videoMetadata.frames.map((frame, idx) => (
                                        <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-800 aspect-video bg-slate-950">
                                          <img src={frame} alt={`Frame ${idx + 1}`} className="w-full h-full object-cover" />
                                          <div className="absolute bottom-1 right-1 bg-slate-950/80 px-1 py-0.5 rounded text-[8px] font-mono text-slate-400">
                                            Frame {idx + 1}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-1">
                                  <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">Detected Issue Type</span>
                                  <span className="text-sm font-extrabold text-slate-200 leading-snug block">
                                    {aiAnalysisResult.detectedType}
                                  </span>
                                </div>
                              </div>

                              {/* Right side: Dynamic Diagnostic metrics */}
                              <div className="md:col-span-7 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">Severity Level</span>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-black uppercase ${
                                      aiAnalysisResult.severity === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                      aiAnalysisResult.severity === 'Severe' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                      aiAnalysisResult.severity === 'Moderate' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                      'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                    }`}>
                                      {aiAnalysisResult.severity}
                                    </span>
                                  </div>

                                  <div>
                                    <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">Suggested Priority</span>
                                    <span className="block mt-1 text-xs font-bold text-slate-200">
                                      {aiAnalysisResult.priority}
                                    </span>
                                  </div>

                                  <div className="col-span-2">
                                    <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">Recommended Department</span>
                                    <span className="block mt-1 text-xs font-bold text-slate-200 flex items-center gap-1.5 font-sans">
                                      <Building className="w-4 h-4 text-brand-blue" />
                                      <span>{aiAnalysisResult.department}</span>
                                    </span>
                                  </div>

                                  <div className="col-span-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Duplicate Probability</span>
                                      <span className={`text-xs font-bold font-mono ${aiAnalysisResult.duplicateProbability > 70 ? 'text-red-400' : 'text-slate-400'}`}>
                                        {aiAnalysisResult.duplicateProbability}%
                                      </span>
                                    </div>
                                    <div className="mt-1.5 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${aiAnalysisResult.duplicateProbability > 70 ? 'bg-red-500' : 'bg-brand-blue'}`}
                                        style={{ width: `${aiAnalysisResult.duplicateProbability}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 leading-relaxed space-y-1">
                                  <span className="font-bold text-slate-300 block font-mono">TECHNICAL SUMMARY:</span>
                                  <p>{aiAnalysisResult.technicalSummary}</p>
                                </div>

                                {aiAnalysisResult.videoSummary && (
                                  <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 leading-relaxed space-y-1 animate-fade-in">
                                    <span className="font-bold text-purple-400 block font-mono flex items-center gap-1">
                                      <span>🎥 AI VIDEO SUMMARY:</span>
                                    </span>
                                    <p className="text-slate-200 bg-slate-950/40 border border-slate-800/85 rounded-xl p-3 font-medium italic">{aiAnalysisResult.videoSummary}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Smart Duplicate Warning Box if probability is high (> 70) */}
                            {aiAnalysisResult.duplicateProbability > 70 && aiAnalysisResult.similarIssueIds.length > 0 && (
                              <div className="mx-6 mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
                                <div className="flex gap-2.5">
                                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                  <div className="space-y-1">
                                    <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wide text-left">Potential Duplicate Issue Identified</h4>
                                    <p className="text-xs text-slate-300 leading-relaxed text-left">
                                      Our spatial AI indicates a very similar report has already been logged nearby under Tracking ID <span className="font-mono font-bold text-white bg-slate-950 px-1.5 py-0.5 rounded">{aiAnalysisResult.similarIssueIds[0]}</span>. 
                                      Instead of creating a new duplicate report, you can directly upvote the existing report to help city repair teams prioritize this sector and speed up restoration!
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2.5 pt-1 pl-7">
                                  <button
                                    type="button"
                                    onClick={() => handleUpvoteAndSupportDuplicate(aiAnalysisResult.similarIssueIds[0])}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border-0"
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                    <span>Upvote & Support Existing Report</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="border-t border-slate-100 pt-6">
                          <div className="flex items-center gap-2 text-left mb-6">
                            <span className="text-xs font-extrabold text-brand-blue uppercase tracking-wider bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md flex items-center gap-1 font-sans">
                              <Sparkles className="w-3 h-3 text-brand-blue" />
                              <span>2. AI Generated Report Review</span>
                            </span>
                            <span className="text-xs text-slate-400 hidden sm:inline">Confirm or edit the fields below:</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-brand-navy">Report Title <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formTitle}
                        onChange={e => setFormTitle(e.target.value)}
                        placeholder="e.g. Deep double pothole near school crossing"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-blue text-sm"
                      />
                    </div>

                    {/* Grid Category / Severity */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-brand-navy">Category</label>
                        <select
                          value={formCategory}
                          onChange={e => {
                            setFormCategory(e.target.value as IssueCategory);
                            setAiAnalysisResult(null); // Reset stale AI analysis on category change
                          }}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-brand-blue text-sm"
                        >
                          <option value="Potholes">Potholes</option>
                          <option value="Garbage accumulation">Garbage accumulation</option>
                          <option value="Water leakage">Water leakage</option>
                          <option value="Drainage blockage">Drainage blockage</option>
                          <option value="Road damage">Road damage</option>
                          <option value="Broken streetlights">Broken streetlights</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-brand-navy">Citizen-Assessed Severity</label>
                        <select
                          value={formSeverity}
                          onChange={e => {
                            setFormSeverity(e.target.value as IssueSeverity);
                            setAiAnalysisResult(null); // Reset stale AI analysis on severity change
                          }}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-brand-blue text-sm"
                        >
                          <option value="Minor">Minor (Static problem, low hazard)</option>
                          <option value="Moderate">Moderate (Intermittent disturbance)</option>
                          <option value="Severe">Severe (Active hazard to tires/vehicles)</option>
                          <option value="Critical">Critical (Immediate danger, flooding, darkness)</option>
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-brand-navy">Description <span className="text-red-500">*</span></label>
                      <textarea
                        required
                        rows={4}
                        value={formDescription}
                        onChange={e => {
                          setFormDescription(e.target.value);
                          setAiAnalysisResult(null); // Reset stale AI analysis on description change
                        }}
                        placeholder="Provide full details: size, depth, how long it has been present, block numbers..."
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-blue text-sm"
                      ></textarea>
                    </div>

                    {/* Grid Location / District */}
                    <div className="w-full">
                      <LocationAutocomplete
                        formAddress={formAddress}
                        setFormAddress={setFormAddress}
                        formLat={formLat}
                        setFormLat={setFormLat}
                        formLng={formLng}
                        setFormLng={setFormLng}
                        formNeighborhood={formNeighborhood}
                        setFormNeighborhood={setFormNeighborhood}
                        formState={formState}
                        setFormState={setFormState}
                        formCity={formCity}
                        setFormCity={setFormCity}
                        formDistrict={formDistrict}
                        setFormDistrict={setFormDistrict}
                        formExactLocation={formExactLocation}
                        setFormExactLocation={setFormExactLocation}
                      />
                    </div>

                    {/* Photo Upload System */}
                    <div className="hidden">
                      <label className="text-sm font-bold text-brand-navy flex items-center gap-1">
                        <UploadCloud className="w-4.5 h-4.5 text-brand-blue" />
                        <span>Attach Photos <span className="text-xs font-normal text-slate-400">(Device upload or preset)</span></span>
                      </label>
                      
                      {/* Drag and Drop Zone */}
                      <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                          isDragging 
                            ? 'border-brand-blue bg-blue-50/50 scale-[0.99]' 
                            : 'border-slate-200 hover:border-brand-blue/50 bg-slate-50'
                        }`}
                        onClick={() => document.getElementById('device-photos-upload')?.click()}
                      >
                        <input 
                          type="file" 
                          id="device-photos-upload" 
                          multiple 
                          accept="image/*" 
                          onChange={handleFileSelect} 
                          className="hidden" 
                        />
                        <div className="flex flex-col items-center gap-2">
                          <UploadCloud className="w-8 h-8 text-brand-blue/80 animate-pulse" />
                          <span className="text-xs font-bold text-slate-700">
                            Drag & drop images here, or <span className="text-brand-blue underline font-black">click to select from device</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">Supports multiple images (JPG, PNG, GIF up to 5MB)</span>
                        </div>
                      </div>

                      {/* Previews Grid with delete button */}
                      {formImages.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-brand-navy">Uploaded Previews ({formImages.length})</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {formImages.map((img, index) => (
                              <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video shadow-sm bg-slate-100">
                                <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveImage(index);
                                  }}
                                  className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-all flex items-center justify-center border-0"
                                  title="Remove image"
                                >
                                  <X className="w-3 h-3 text-white" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Preset Buttons */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Or Use Quick Preset Sample Images</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <button
                            type="button"
                            onClick={() => setFormImages([])}
                            className={`p-3 border rounded-xl text-xs font-bold transition-all border-0 ${formImages.length === 0 ? 'bg-blue-50 text-brand-blue' : 'hover:bg-slate-50 bg-slate-100 text-slate-700'}`}
                          >
                            Reset / No Image
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePresetSelect('https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600')}
                            className={`p-1.5 border rounded-xl overflow-hidden relative group transition-all bg-white ${formImages.includes('photo-1515162305') ? 'border-brand-blue ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}
                          >
                            <img src="https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=150" alt="pothole" className="w-full h-10 object-cover rounded-md" />
                            <span className="text-[9px] block font-bold text-slate-500 mt-1 text-center">Pothole Preset</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePresetSelect('https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600')}
                            className={`p-1.5 border rounded-xl overflow-hidden relative group transition-all bg-white ${formImages.includes('photo-16112844463') ? 'border-brand-blue ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}
                          >
                            <img src="https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=150" alt="trash" className="w-full h-10 object-cover rounded-md" />
                            <span className="text-[9px] block font-bold text-slate-500 mt-1 text-center">Garbage Preset</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePresetSelect('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600')}
                            className={`p-1.5 border rounded-xl overflow-hidden relative group transition-all bg-white ${formImages.includes('photo-150430765125') ? 'border-brand-blue ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}
                          >
                            <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=150" alt="leak" className="w-full h-10 object-cover rounded-md" />
                            <span className="text-[9px] block font-bold text-slate-500 mt-1 text-center">Water Main Preset</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* AI Optimization Switch & Analyze Trigger */}
                    <div className="hidden">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5 text-left">
                          <span className="text-xs font-black text-brand-blue flex items-center gap-1.5 uppercase tracking-wide">
                            <Shield className="w-3.5 h-3.5" />
                            <span>UrbanIQ AI Engine</span>
                          </span>
                          <h4 className="text-sm font-bold text-brand-navy">Enable Automated AI Analysis</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Optimizes titles, auto-assigns municipal departments, determines priority indexes, lists necessary field gear, and formulates citizen safety bulletins using Gemini 3.5.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={aiOptimize}
                            onChange={e => {
                              setAiOptimize(e.target.checked);
                              if (!e.target.checked) {
                                setAiAnalysisResult(null);
                              }
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                        </label>
                      </div>

                      {aiOptimize && (
                        <div className="pt-2 border-t border-blue-100/60 flex flex-col gap-3 text-left">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-500">
                              Inspect compliance and verify routing before submitting:
                            </span>
                            <button
                              type="button"
                              disabled={isAnalyzing}
                              onClick={runAIEngine}
                              className="w-full sm:w-auto bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed transition-all border-0"
                            >
                              {isAnalyzing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                              )}
                              <span>{isAnalyzing ? 'Running Neural Diagnostic...' : 'Run UrbanIQ AI Engine'}</span>
                            </button>
                          </div>

                          {/* Loading state with animation steps */}
                          {isAnalyzing && (
                            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-3 animate-pulse">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-brand-blue font-bold tracking-widest uppercase">AI ENGINE DIAGNOSING</span>
                                <span className="text-[11px] font-mono font-bold text-slate-400">{Math.round((analyzingStep + 1) / aiAnalysisSteps.length * 100)}%</span>
                              </div>
                              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-brand-blue transition-all duration-300"
                                  style={{ width: `${((analyzingStep + 1) / aiAnalysisSteps.length) * 100}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-slate-300 font-mono flex items-center gap-2">
                                <Loader2 className="w-3 h-3 text-brand-blue animate-spin" />
                                <span>{aiAnalysisSteps[analyzingStep]}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* AI Analysis Result Card */}
                    {aiOptimize && aiAnalysisResult && !isAnalyzing && (
                      <div className="hidden">
                        
                        {/* Card Header */}
                        <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-brand-blue animate-pulse" />
                            <div>
                              <h3 className="text-sm font-extrabold tracking-tight uppercase">UrbanIQ AI Analysis Result</h3>
                              <p className="text-[10px] text-slate-400 font-medium font-mono">NEURAL DISPATCH FEED v4.2</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono font-bold text-slate-400">Confidence:</span>
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-mono font-black">
                              {aiAnalysisResult.confidence}
                            </span>
                          </div>
                        </div>

                        {/* Card Grid Content */}
                        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                          
                          {/* Left side: Scanned Image Preview */}
                          <div className="md:col-span-5 space-y-4">
                            <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">AI Scanned Image</span>
                            <div className="relative rounded-xl overflow-hidden aspect-video border border-slate-800 bg-slate-950 flex items-center justify-center">
                              <img 
                                src={aiAnalysisResult.image} 
                                alt="Scanned" 
                                className="w-full h-full object-cover" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-slate-950/70 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono font-semibold text-slate-300">
                                <Layers className="w-3 h-3 text-brand-blue" />
                                <span>IMAGE VERIFIED</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">Detected Issue Type</span>
                              <span className="text-sm font-extrabold text-slate-200 leading-snug block">
                                {aiAnalysisResult.detectedType}
                              </span>
                            </div>
                          </div>

                          {/* Right side: Dynamic Diagnostic metrics */}
                          <div className="md:col-span-7 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">Severity Level</span>
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-black uppercase ${
                                  aiAnalysisResult.severity === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                  aiAnalysisResult.severity === 'Severe' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                  aiAnalysisResult.severity === 'Moderate' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                  'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                }`}>
                                  {aiAnalysisResult.severity}
                                </span>
                              </div>

                              <div>
                                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">Suggested Priority</span>
                                <span className="block mt-1 text-xs font-bold text-slate-200">
                                  {aiAnalysisResult.priority}
                                </span>
                              </div>

                              <div className="col-span-2">
                                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wider">Recommended Department</span>
                                <span className="block mt-1 text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                  <Building className="w-4 h-4 text-brand-blue" />
                                  {aiAnalysisResult.department}
                                </span>
                              </div>

                              <div className="col-span-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Duplicate Probability</span>
                                  <span className={`text-xs font-bold font-mono ${aiAnalysisResult.duplicateProbability > 70 ? 'text-red-400' : 'text-slate-400'}`}>
                                    {aiAnalysisResult.duplicateProbability}%
                                  </span>
                                </div>
                                <div className="mt-1.5 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${aiAnalysisResult.duplicateProbability > 70 ? 'bg-red-500' : 'bg-brand-blue'}`}
                                    style={{ width: `${aiAnalysisResult.duplicateProbability}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 leading-relaxed space-y-1">
                              <span className="font-bold text-slate-300 block font-mono">TECHNICAL SUMMARY:</span>
                              <p>{aiAnalysisResult.technicalSummary}</p>
                            </div>
                          </div>
                        </div>

                        {/* Smart Duplicate Warning Box if probability is high (> 70) */}
                        {aiAnalysisResult.duplicateProbability > 70 && aiAnalysisResult.similarIssueIds.length > 0 && (
                          <div className="mx-6 mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
                            <div className="flex gap-2.5">
                              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wide text-left">Potential Duplicate Issue Identified</h4>
                                <p className="text-xs text-slate-300 leading-relaxed text-left">
                                  Our spatial AI indicates a very similar report has already been logged nearby under Tracking ID <span className="font-mono font-bold text-white bg-slate-950 px-1.5 py-0.5 rounded">{aiAnalysisResult.similarIssueIds[0]}</span>. 
                                  Instead of creating a new duplicate report, you can directly upvote the existing report to help city repair teams prioritize this sector and speed up restoration!
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2.5 pt-1 pl-7">
                              <button
                                type="button"
                                onClick={() => handleUpvoteAndSupportDuplicate(aiAnalysisResult.similarIssueIds[0])}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border-0"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                                <span>Upvote & Support Existing Report</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold py-3.5 px-4 rounded-xl text-sm shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed border-0"
                    >
                      <Send className="w-4 h-4 text-white" />
                      <span>Submit Civil Incident Report</span>
                    </button>
                  </form>
                </div>
              </>
            )}

            {/* AI Diagnostics loading overlay */}
            {isSubmitting && (
              <div className="fixed inset-0 z-50 bg-brand-navy/95 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-6 text-center shadow-2xl">
                  <div className="flex justify-center">
                    <Loader2 className="w-10 h-10 text-brand-blue animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold">UrbanIQ Neural Dispatching</h3>
                    <p className="text-slate-400 text-xs">Analyzing civic complaint in real-time...</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {submissionSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-left">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${submittingStep >= idx ? 'bg-brand-blue text-white' : 'bg-slate-800 text-slate-500'}`}>
                          {submittingStep > idx ? <Check className="w-3 h-3" /> : idx + 1}
                        </div>
                        <span className={`text-xs ${submittingStep >= idx ? 'text-slate-200 font-medium' : 'text-slate-600'}`}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMMUNITY FEED TAB */}
        {activeTab === 'community' && (
          <div id="community-feed" className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-brand-navy">Community Issues Feed</h1>
                <p className="text-sm text-slate-500">Explore real-time active citizen reported issues and city repair statuses.</p>
              </div>
            </div>

            {/* Filtration bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="relative">
                <Search className="absolute top-3 left-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tracking ID, title..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-brand-blue text-slate-700 bg-slate-50"
                />
              </div>

              <div>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-brand-blue bg-slate-50 text-slate-700"
                >
                  <option value="All">All Categories</option>
                  <option value="Potholes">Potholes</option>
                  <option value="Garbage accumulation">Garbage accumulation</option>
                  <option value="Water leakage">Water leakage</option>
                  <option value="Drainage blockage">Drainage blockage</option>
                  <option value="Road damage">Road damage</option>
                  <option value="Broken streetlights">Broken streetlights</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <select
                  value={severityFilter}
                  onChange={e => setSeverityFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-brand-blue bg-slate-50 text-slate-700"
                >
                  <option value="All">All Severities</option>
                  <option value="Minor">Minor</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-brand-blue bg-slate-50 text-slate-700"
                >
                  <option value="All">All Statuses</option>
                  <option value="Reported">Reported</option>
                  <option value="Verified">Verified</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Inspection Scheduled">Inspection Scheduled</option>
                  <option value="Work In Progress">Work In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-brand-blue bg-slate-50 text-slate-700"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="upvotes">Sort: Most Upvotes</option>
                  <option value="severity">Sort: Highest Hazard</option>
                </select>
              </div>
            </div>

            {/* Main grid of cards */}
            {filteredIssues.length === 0 ? (
              <div className="bg-white text-center py-12 rounded-2xl border border-slate-200 text-slate-500 space-y-3">
                <AlertTriangle className="w-10 h-10 mx-auto text-slate-300" />
                <h3 className="font-bold text-brand-navy">No Civic Issues Found</h3>
                <p className="text-xs text-slate-500">No matching civic issues are currently indexed. Try updating your filters or search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIssues.map(issue => {
                  const Icon = categoryIcons[issue.category] || HelpCircle;
                  const sev = severityColors[issue.severity];
                  return (
                    <div
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:translate-y-[-1px] transition-all flex flex-col justify-between cursor-pointer"
                    >
                      {/* Image header */}
                      {issue.imageUrl && (
                        <div className="h-44 w-full overflow-hidden relative">
                          <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover" />
                          <div className="absolute top-2 right-2 flex gap-1.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow ${statusColors[issue.status]}`}>
                              {issue.status}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-5 flex-grow space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-400 font-bold tracking-wider">{issue.trackingId}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${sev.bg} ${sev.text} ${sev.border}`}>
                            {issue.severity}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h3 className="font-bold text-brand-navy line-clamp-1 text-sm sm:text-base">{issue.title}</h3>
                          <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{issue.location.address} • {issue.location.district || issue.location.neighborhood}</span>
                          </p>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {issue.description}
                        </p>

                        {/* Supporter and Impact Scores Row */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] font-bold">
                          <span className="text-slate-500 flex items-center gap-1">
                            <ThumbsUp className="w-3.5 h-3.5 text-brand-blue" />
                            <span>{issue.upvotes} Supporters</span>
                          </span>
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 font-extrabold uppercase text-[10px]">
                            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>Impact Score: {getCommunityImpactScore(issue)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Footer actions */}
                      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                          <Icon className="w-4 h-4 text-brand-blue" />
                          <span>{issue.category}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleUpvote(issue.id, e)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all ${
                              issue.hasUpvoted 
                                ? 'bg-blue-100 text-brand-blue border-blue-200' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span>▲</span>
                            <span>{issue.upvotes}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TRACK ACTIVE ISSUE TAB */}
        {activeTab === 'track' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy">Track Issue Progress</h1>
              <p className="text-slate-500 text-sm">Enter a unique municipal Tracking ID to monitor crew progress, dispatch status, and photos.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <form onSubmit={handleTrackingSearch} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. UIQ-4829-X8"
                  value={trackingSearchId}
                  onChange={e => setTrackingSearchId(e.target.value)}
                  className="flex-grow px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-blue text-sm text-brand-navy uppercase font-mono font-bold tracking-wider"
                />
                <button
                  type="submit"
                  className="bg-brand-navy hover:bg-brand-navy-light text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Locate</span>
                </button>
              </form>

              {/* Show active track shortcuts */}
              <div className="pt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Quick Links:</span>
                {issues.slice(0, 3).map(i => (
                  <button
                    key={i.id}
                    onClick={() => {
                      setTrackingSearchId(i.trackingId);
                      setTrackedIssue(i);
                    }}
                    className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] rounded border border-slate-200 font-mono font-bold uppercase transition-all cursor-pointer"
                  >
                    {i.trackingId}
                  </button>
                ))}
              </div>
            </div>

            {trackedIssue ? (
              <div id="tracked-issue-container" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6">
                
                {/* Header overview */}
                <div className="bg-slate-50 p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold text-slate-400">{trackedIssue.trackingId}</span>
                    <h2 className="text-lg font-bold text-brand-navy">{trackedIssue.title}</h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{trackedIssue.location.address} • {trackedIssue.location.district || trackedIssue.location.neighborhood}</span>
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide self-start sm:self-center ${statusColors[trackedIssue.status]}`}>
                    {trackedIssue.status}
                  </span>
                </div>

                {trackedIssue.mediaType === 'Video' && trackedIssue.mediaPath ? (
                  <div className="px-6 sm:px-8 pt-4 space-y-2 text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Attached Video Evidence</span>
                    <div className="relative rounded-xl overflow-hidden aspect-video border border-slate-200 bg-slate-950 max-h-[240px] flex items-center justify-center">
                      <video src={trackedIssue.mediaPath} controls className="w-full h-full object-contain" />
                    </div>
                  </div>
                ) : trackedIssue.imageUrl ? (
                  <div className="px-6 sm:px-8 pt-4 space-y-2 text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Attached Photo Evidence</span>
                    <div className="relative rounded-xl overflow-hidden aspect-video border border-slate-200 bg-slate-50 max-h-[240px] flex items-center justify-center">
                      <img src={trackedIssue.imageUrl} alt="Evidence" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                ) : null}

                {/* Sub-status vertical stepper */}
                <div className="p-6 sm:p-8 space-y-6">
                  <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">Vertical Repair Timeline</h3>
                  
                  <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    
                    {/* Stepper Logic mapped directly from issue.updates */}
                    {trackedIssue.updates.map((update, idx) => (
                      <div key={idx} className="relative space-y-1">
                        {/* Dot indicator */}
                        <div className={`absolute -left-6 top-1 w-4.5 h-4.5 rounded-full border-4 flex items-center justify-center ${
                          idx === trackedIssue.updates.length - 1 
                            ? 'bg-brand-blue border-blue-100 animate-pulse' 
                            : 'bg-slate-100 border-slate-200'
                        }`} />
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-brand-navy">
                            Stage: {update.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {new Date(update.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(update.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">
                          {update.note}
                        </p>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          Action by: <span className="text-slate-500 font-bold">{update.performedBy}</span>
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* AI Assistance insights block if generated */}
                  {trackedIssue.aiAnalysis && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 pt-3">
                      <span className="text-[10px] font-black text-brand-blue flex items-center gap-1 uppercase tracking-wide">
                        <Shield className="w-3.5 h-3.5" />
                        <span>UrbanIQ Dispatcher Recommendations</span>
                      </span>
                      <p className="text-xs text-slate-500 leading-relaxed italic">
                        &quot;{trackedIssue.aiAnalysis.technicalSummary}&quot;
                      </p>
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-extrabold uppercase">Department Assignment</span>
                          <span className="text-xs font-bold text-slate-700">{trackedIssue.aiAnalysis.department}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-extrabold uppercase">Est. Resolution Velocity</span>
                          <span className="text-xs font-bold text-slate-700">{trackedIssue.aiAnalysis.estimatedTimeline}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Citizen Subscription Panel */}
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-2">
                    <h4 className="text-xs font-bold text-brand-blue uppercase tracking-wider">SMS & Email Tracking Alerts</h4>
                    <p className="text-[11px] text-slate-500">Subscribe to receive instant field-engineer photos and completion logs once this issue is resolved.</p>
                    <div className="flex gap-2">
                      <input type="email" placeholder="citizen@example.com" className="bg-white border border-slate-200 text-xs rounded px-3 py-1.5 focus:outline-none focus:border-brand-blue flex-grow" />
                      <button onClick={() => alert('Subscription registered! Mock system alerts active.')} className="bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-bold px-3 py-1.5 rounded cursor-pointer">
                        Subscribe
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              <div className="bg-white text-center py-12 rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-300" />
                <h3 className="font-bold text-brand-navy text-sm">No Active Track Search</h3>
                <p className="text-xs px-6">Input a Tracking ID or use one of the quicklinks above to display live dispatch records.</p>
              </div>
            )}
          </div>
        )}

        {/* MAP INTELLIGENCE TAB */}
        {activeTab === 'map' && (
          <div id="map-container" className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-brand-navy">Smart City GIS System</h1>
                <p className="text-sm text-slate-500">Professional geographic information system integrating real-time incident tracking, AI classification, and hotspot intelligence.</p>
              </div>
              
              {/* GIS vs Civic toggle */}
              <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm text-xs font-bold self-start sm:self-center">
                <button
                  onClick={() => setMapSubTab('gis')}
                  className={`px-4 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    mapSubTab === 'gis'
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>Interactive GIS Map</span>
                </button>
                <button
                  onClick={() => setMapSubTab('civic')}
                  className={`px-4 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    mapSubTab === 'civic'
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Sector Intelligence</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* MAP VISUALIZATION CONTAINER */}
              <div className="lg:col-span-2 flex flex-col space-y-4">
                {mapSubTab === 'gis' ? (
                  /* TAB 1: GIS MAP (LEAFLET) */
                  <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative p-4 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-center bg-slate-900 text-white p-3 rounded-xl">
                      <div>
                        <span className="text-[9px] font-mono text-brand-blue font-bold tracking-wider uppercase">Active GIS Region</span>
                        <h3 className="text-xs font-bold">Bangalore Metropolitan, India</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
                        <span className="text-[10px] font-mono font-bold text-green-400">LIVE GIS LAYER CONNECTED</span>
                      </div>
                    </div>

                    {/* Leaflet map container wrapper */}
                    <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-100 relative">
                      <GisMap
                        issues={issues}
                        selectedMapPin={selectedMapPin}
                        onSelectMapPin={setSelectedMapPin}
                        onLaunchDispatch={setSelectedIssue}
                      />
                    </div>

                    {/* GIS Color-Coded Marker Legend */}
                    <div className="flex flex-wrap gap-4 bg-slate-50 border border-slate-150 p-3 rounded-xl text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white shadow"></span>
                        <span className="font-medium text-slate-700">Critical Severity</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-orange-500 rounded-full border-2 border-white shadow"></span>
                        <span className="font-medium text-slate-700">High / Severe</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-yellow-500 rounded-full border-2 border-white shadow"></span>
                        <span className="font-medium text-slate-700">Medium / Moderate</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow"></span>
                        <span className="font-medium text-slate-700">Low / Minor / Resolved</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* TAB 2: CIVIC INTELLIGENCE (CLASSIC VECTOR SVG MAP) */
                  <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative aspect-video flex flex-col justify-between p-4">
                    {/* HUD Overlay */}
                    <div className="relative z-10 flex justify-between items-center bg-slate-900/80 backdrop-blur border border-slate-800 p-3 rounded-xl text-white">
                      <div>
                        <span className="text-[9px] font-mono text-brand-blue font-bold tracking-wider uppercase">Active Sector</span>
                        <h3 className="text-sm font-bold">{mapHoveredDistrict || 'Central Community Zone'}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
                        <span className="text-[10px] font-mono font-bold text-green-400">VECTOR MAP SECURE</span>
                      </div>
                    </div>

                    {/* SVG Map Core */}
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                      <svg viewBox="0 0 800 500" className="w-full h-full max-h-[420px] select-none">
                        {/* District Area Paths */}
                        <path
                          d="M 100,50 L 300,50 L 400,200 L 250,350 L 100,200 Z"
                          fill={mapOverlayMode === 'departments' ? 'rgba(37, 99, 235, 0.4)' : mapOverlayMode === 'heatmap' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(30, 41, 59, 0.5)'}
                          stroke="#475569"
                          strokeWidth="2"
                          className="transition-all duration-300 cursor-pointer"
                          onMouseEnter={() => setMapHoveredDistrict('Downtown Core')}
                        />
                        <path
                          d="M 300,50 L 600,50 L 650,220 L 400,200 Z"
                          fill={mapOverlayMode === 'departments' ? 'rgba(139, 92, 246, 0.4)' : mapOverlayMode === 'heatmap' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.6)'}
                          stroke="#475569"
                          strokeWidth="2"
                          className="transition-all duration-300 cursor-pointer"
                          onMouseEnter={() => setMapHoveredDistrict('Nob Hill North')}
                        />
                        <path
                          d="M 400,200 L 650,220 L 700,450 L 500,450 Z"
                          fill={mapOverlayMode === 'departments' ? 'rgba(236, 72, 153, 0.4)' : mapOverlayMode === 'heatmap' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(30, 41, 59, 0.6)'}
                          stroke="#475569"
                          strokeWidth="2"
                          className="transition-all duration-300 cursor-pointer"
                          onMouseEnter={() => setMapHoveredDistrict('SoMa Business Hub')}
                        />
                        <path
                          d="M 100,200 L 250,350 L 350,450 L 100,450 Z"
                          fill={mapOverlayMode === 'departments' ? 'rgba(16, 185, 129, 0.4)' : mapOverlayMode === 'heatmap' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(15, 23, 42, 0.5)'}
                          stroke="#475569"
                          strokeWidth="2"
                          className="transition-all duration-300 cursor-pointer"
                          onMouseEnter={() => setMapHoveredDistrict('Central Park / Sunset')}
                        />
                        <path
                          d="M 250,350 L 500,450 L 350,450 Z"
                          fill={mapOverlayMode === 'departments' ? 'rgba(245, 158, 11, 0.4)' : mapOverlayMode === 'heatmap' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(30, 41, 59, 0.5)'}
                          stroke="#475569"
                          strokeWidth="2"
                          className="transition-all duration-300 cursor-pointer"
                          onMouseEnter={() => setMapHoveredDistrict('Oakwood Heights')}
                        />

                        {/* SVG Coordinates Text Labels */}
                        <text x="200" y="130" fill="#94A3B8" fontSize="12" fontWeight="bold" textAnchor="middle">Downtown Core</text>
                        <text x="470" y="110" fill="#94A3B8" fontSize="12" fontWeight="bold" textAnchor="middle">Nob Hill North</text>
                        <text x="560" y="320" fill="#94A3B8" fontSize="12" fontWeight="bold" textAnchor="middle">SoMa Business Hub</text>
                        <text x="180" y="360" fill="#94A3B8" fontSize="12" fontWeight="bold" textAnchor="middle">Central Park / Sunset</text>
                        <text x="370" y="415" fill="#94A3B8" fontSize="12" fontWeight="bold" textAnchor="middle">Oakwood Heights</text>

                        {/* GIS Coordinates overlay grids */}
                        <line x1="0" y1="250" x2="800" y2="250" stroke="#334155" strokeDasharray="5,5" strokeWidth="0.5" />
                        <line x1="400" y1="0" x2="400" y2="500" stroke="#334155" strokeDasharray="5,5" strokeWidth="0.5" />

                        {/* Dynamic Map Pins mapped from Issues coordinates */}
                        {mapOverlayMode !== 'heatmap' && issues.map((issue, idx) => {
                          const latPercent = (issue.location.lat - 37.75) / 0.04;
                          const lngPercent = (issue.location.lng - (-122.49)) / 0.09;
                          const x = 100 + Math.max(0, Math.min(600, lngPercent * 600));
                          const y = 400 - Math.max(0, Math.min(300, latPercent * 300));
                          const isSelected = selectedMapPin?.id === issue.id;
                          
                          let color = '#2563EB';
                          if (issue.severity === 'Critical') color = '#EF4444';
                          if (issue.severity === 'Severe') color = '#F59E0B';
                          if (issue.status === 'Resolved') color = '#10B981';

                          return (
                            <g 
                              key={issue.id} 
                              className="cursor-pointer group"
                              onClick={() => setSelectedMapPin(issue)}
                            >
                              <circle cx={x} cy={y} r={isSelected ? 14 : 7} fill={color} opacity="0.3" className="transition-all group-hover:scale-150 duration-200" />
                              <circle cx={x} cy={y} r={isSelected ? 7 : 4.5} fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    {/* Legend overlay */}
                    <div className="relative z-10 flex gap-3.5 bg-slate-900/80 backdrop-blur border border-slate-800 p-2.5 rounded-lg text-white text-[10px] sm:text-xs max-w-sm self-start">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                        <span>Critical / Active Flooding</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
                        <span>Severe / Road obstruction</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                        <span>Resolved</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Map Information Sidebar */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-5 font-sans">
                <div className="space-y-4">
                  <h3 className="font-bold text-brand-navy">Map Pin Information</h3>
                  
                  {selectedMapPin ? (
                    <div className="space-y-4 animate-fade-in">
                      <div className="relative h-28 w-full rounded-xl overflow-hidden">
                        <img src={selectedMapPin.imageUrl} alt={selectedMapPin.title} className="w-full h-full object-cover" />
                        <span className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${statusColors[selectedMapPin.status]}`}>
                          {selectedMapPin.status}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 font-bold">{selectedMapPin.trackingId}</span>
                        <h4 className="font-extrabold text-brand-navy text-sm line-clamp-1">{selectedMapPin.title}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{selectedMapPin.location.address}</span>
                        </p>
                      </div>

                      <div className="py-2.5 px-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs font-bold gap-2">
                        <span className="text-slate-600 flex items-center gap-1">
                          <ThumbsUp className="w-3.5 h-3.5 text-brand-blue" />
                          <span>{selectedMapPin.upvotes} Supporters</span>
                        </span>
                        <span className="bg-amber-100/60 text-amber-800 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 font-black">
                          <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>IMPACT: {getCommunityImpactScore(selectedMapPin)}</span>
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex gap-2">
                        <button
                          onClick={() => setSelectedIssue(selectedMapPin)}
                          className="flex-grow bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-bold py-2 px-3 rounded-lg text-center transition-all cursor-pointer border-0"
                        >
                          Launch Dispatch Report
                        </button>
                        <button
                          onClick={() => setSelectedMapPin(null)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-lg transition-all cursor-pointer border-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <Navigation className="w-8 h-8 mx-auto text-slate-300 animate-pulse" />
                      <p className="text-xs">Click any color-coded coordinate marker on the district map to explore dynamic municipal dispatch parameters.</p>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                  <span className="font-extrabold text-brand-navy block uppercase tracking-wider text-[10px]">District Status Indicators</span>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Active Workload:</span>
                      <span className="text-red-500 font-bold">94% (Heavy)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Resolution Speed:</span>
                      <span className="text-green-600 font-bold">14.8 hr average</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* HOTSPOT INTELLIGENCE PANEL (REQUIREMENT 8) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-brand-blue animate-pulse" />
                  <h3 className="font-bold text-brand-navy">Hotspot Intelligence & Spatial Risk Registry</h3>
                </div>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded flex items-center gap-1 border border-amber-200">
                  <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" /> Real-time Density Clusters
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                The GIS core monitors district density nodes and aggregates reported incidents. Municipal dispatchers rely on these active hotspot analytics to schedule crew allocation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {(() => {
                  const neighborhoodMap: Record<string, {
                    activeIssues: number;
                    totalSeverityVal: number;
                    supporters: number;
                    highestImpactIssue: CivicIssue | null;
                    highestImpactScore: number;
                  }> = {};

                  issues.forEach(issue => {
                    const neighborhood = issue.location.district || issue.location.neighborhood || 'General';
                    const impactScore = getCommunityImpactScore(issue);
                    
                    let severityVal = 1;
                    if (issue.severity === 'Critical') severityVal = 4;
                    else if (issue.severity === 'Severe') severityVal = 3;
                    else if (issue.severity === 'Moderate') severityVal = 2;

                    if (!neighborhoodMap[neighborhood]) {
                      neighborhoodMap[neighborhood] = {
                        activeIssues: issue.status !== 'Resolved' ? 1 : 0,
                        totalSeverityVal: issue.status !== 'Resolved' ? severityVal : 0,
                        supporters: issue.upvotes || 0,
                        highestImpactIssue: issue,
                        highestImpactScore: impactScore
                      };
                    } else {
                      const current = neighborhoodMap[neighborhood];
                      if (issue.status !== 'Resolved') {
                        current.activeIssues += 1;
                        current.totalSeverityVal += severityVal;
                      }
                      current.supporters += (issue.upvotes || 0);
                      if (impactScore > current.highestImpactScore) {
                        current.highestImpactScore = impactScore;
                        current.highestImpactIssue = issue;
                      }
                    }
                  });

                  const hotspots = Object.entries(neighborhoodMap).map(([neighborhood, stats]) => {
                    const avgSeverityNum = stats.activeIssues > 0 
                      ? Math.round((stats.totalSeverityVal / stats.activeIssues) * 10) / 10 
                      : 1;
                    
                    let avgSeverityStr = 'Minor';
                    if (avgSeverityNum >= 3.5) avgSeverityStr = 'Critical';
                    else if (avgSeverityNum >= 2.5) avgSeverityStr = 'Severe';
                    else if (avgSeverityNum >= 1.5) avgSeverityStr = 'Moderate';

                    return {
                      neighborhood,
                      activeIssuesCount: stats.activeIssues,
                      avgSeverity: avgSeverityStr,
                      totalSupporters: stats.supporters,
                      highestImpactIssue: stats.highestImpactIssue,
                      highestImpactScore: stats.highestImpactScore
                    };
                  }).sort((a, b) => b.activeIssuesCount - a.activeIssuesCount);

                  return hotspots.map((hotspot, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between space-y-3 hover:border-brand-blue/30 transition-all font-sans">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">District Node</span>
                          <h4 className="font-extrabold text-brand-navy text-sm">{hotspot.neighborhood}</h4>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          hotspot.activeIssuesCount > 2 
                            ? 'bg-red-100 text-red-700 border border-red-200' 
                            : hotspot.activeIssuesCount > 0 
                            ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {hotspot.activeIssuesCount} Active
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-200/50 pt-2 font-bold">
                        <div>
                          <span className="text-slate-400 text-[9px] block uppercase font-bold">Avg Severity</span>
                          <span className={`font-bold ${
                            hotspot.avgSeverity === 'Critical' ? 'text-red-600' :
                            hotspot.avgSeverity === 'Severe' ? 'text-orange-500' :
                            hotspot.avgSeverity === 'Moderate' ? 'text-yellow-600' : 'text-emerald-600'
                          }`}>{hotspot.avgSeverity}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[9px] block uppercase font-bold">Total Supporters</span>
                          <span className="font-bold text-brand-blue">{hotspot.totalSupporters}</span>
                        </div>
                      </div>

                      {hotspot.highestImpactIssue && (
                        <div className="bg-white p-2 rounded-lg border border-slate-200/80 text-[10px] space-y-1">
                          <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider block">Highest Impact Incident</span>
                          <div className="flex justify-between items-center font-bold">
                            <span className="font-mono text-slate-400 font-bold">{hotspot.highestImpactIssue.trackingId}</span>
                            <span className="bg-amber-50 text-amber-800 text-[9px] px-1 rounded font-black">
                              {hotspot.highestImpactScore} pts
                            </span>
                          </div>
                          <p className="font-extrabold text-brand-navy truncate">{hotspot.highestImpactIssue.title}</p>
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>

          </div>
        )}

        {/* ANALYTICS DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          officerSession ? (
            <MunicipalDashboard
              issues={issues}
              onUpdateIssue={handleOfficerUpdateIssue}
              onLogout={() => {
                localStorage.removeItem('urban_iq_officer_session');
                setOfficerSession(null);
              }}
              officerSession={officerSession}
              preventedDuplicatesCount={preventedDuplicatesCount}
            />
          ) : (
            <div id="dashboard-container" className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h1 className="text-2xl font-extrabold text-brand-navy">Authority & Operations Dashboard</h1>
                <p className="text-sm text-slate-500">Real-time performance metrics and live authority issue dispatch tools.</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start sm:self-center border border-slate-200/60 shadow-sm">
                <button
                  onClick={() => setDashboardSubTab('analytics')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    dashboardSubTab === 'analytics'
                      ? 'bg-white text-brand-navy shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Operational Analytics</span>
                </button>
                <button
                  onClick={() => setDashboardSubTab('workflow')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    dashboardSubTab === 'workflow'
                      ? 'bg-white text-brand-navy shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Authority Work Dispatcher</span>
                </button>
              </div>
            </div>

            {dashboardSubTab === 'analytics' ? (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* ISSUE HOTSPOT ZONES */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-red-500 animate-pulse" />
                        <h3 className="font-bold text-brand-navy text-sm uppercase tracking-wider">Issue Hotspot Zones</h3>
                      </div>
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border border-slate-200">
                        Spatial Density Nodes
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Real-time geographic risk classification of reported civic issues calculated dynamically using active reports, unresolved issues, severity multipliers, and citizen upvotes.
                    </p>

                    <div className="space-y-3 pt-2">
                      {(() => {
                        const groups: Record<string, CivicIssue[]> = {};
                        
                        issues.forEach(issue => {
                          const nh = issue.location.district || issue.location.neighborhood || 'General';
                          if (!groups[nh]) {
                            groups[nh] = [];
                          }
                          groups[nh].push(issue);
                        });

                        const zones = Object.entries(groups).map(([name, nhIssues]) => {
                          const totalIssues = nhIssues.length;
                          const unresolvedIssues = nhIssues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed');
                          const activeIssues = unresolvedIssues.length;
                          const communitySupportCount = nhIssues.reduce((sum, i) => sum + (i.upvotes || 0), 0);
                          
                          const severitySum = nhIssues.reduce((sum, i) => {
                            const sev = i.severity.toLowerCase();
                            if (sev === 'critical' || sev === 'severe') return sum + 3;
                            if (sev === 'moderate') return sum + 2;
                            return sum + 1;
                          }, 0);
                          
                          const avgSeverity = totalIssues > 0 ? (severitySum / totalIssues) : 0;
                          
                          const hotspotScore = Math.round((activeIssues * 15) + (avgSeverity * 12) + (communitySupportCount * 0.4));
                          
                          let riskLevel: 'High' | 'Medium' | 'Low' = 'Low';
                          if (hotspotScore >= 30 || activeIssues >= 2) {
                            riskLevel = 'High';
                          } else if (hotspotScore >= 10 || activeIssues >= 1) {
                            riskLevel = 'Medium';
                          }

                          return {
                            name,
                            totalIssues,
                            activeIssues,
                            communitySupportCount,
                            hotspotScore,
                            riskLevel
                          };
                        }).sort((a, b) => b.hotspotScore - a.hotspotScore);

                        return zones.map((zone, idx) => (
                          <div key={idx} className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl hover:border-slate-200 transition-all">
                            <div className="flex justify-between items-start gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">
                                    {zone.riskLevel === 'High' && '🔴'}
                                    {zone.riskLevel === 'Medium' && '🟡'}
                                    {zone.riskLevel === 'Low' && '🟢'}
                                  </span>
                                  <span className="font-extrabold text-brand-navy text-sm">{zone.name}</span>
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                                    zone.riskLevel === 'High' ? 'bg-red-50 text-red-700 border border-red-100' :
                                    zone.riskLevel === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                    'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  }`}>
                                    {zone.riskLevel} Risk
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                                  <span>{zone.totalIssues} Total Issues</span>
                                  <span>•</span>
                                  <span className="text-brand-blue">{zone.activeIssues} Active / Unresolved</span>
                                  <span>•</span>
                                  <span>{zone.communitySupportCount} Supporters</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Hotspot Score</span>
                                <span className={`text-sm font-black ${
                                  zone.riskLevel === 'High' ? 'text-red-600' :
                                  zone.riskLevel === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                                }`}>{zone.hotspotScore} pts</span>
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* COMMUNITY ENGAGEMENT SCORE */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        <h3 className="font-bold text-brand-navy text-sm uppercase tracking-wider">Community Engagement</h3>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border border-emerald-200">
                        Citizen Powered
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Real-time indicators measuring direct citizen contributions, support validations, evidence transparency, and automated duplicate management savings.
                    </p>

                    {(() => {
                      const totalSupporters = issues.reduce((sum, i) => sum + (i.upvotes || 0), 0);
                      const duplicatePrevented = preventedDuplicatesCount;
                      const totalVotes = totalSupporters;
                      const evidencePhotosCount = issues.reduce((sum, i) => {
                        let count = 0;
                        if (i.imageUrl) count += 1;
                        if (i.evidencePhotos) count += i.evidencePhotos.length;
                        return sum + count;
                      }, 0);

                      let mostSupportedIssue: CivicIssue | null = null;
                      if (issues.length > 0) {
                        mostSupportedIssue = [...issues].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))[0];
                      }

                      const stats = [
                        { label: 'Total Community Supporters', value: totalSupporters, trend: '↑ Increased this week', color: 'text-brand-blue bg-blue-50/50' },
                        { label: 'Duplicate Reports Prevented', value: duplicatePrevented, trend: '↑ Increased this week', color: 'text-amber-600 bg-amber-50/50' },
                        { label: 'Evidence Photos Contributed', value: evidencePhotosCount, trend: '↑ Increased this week', color: 'text-indigo-600 bg-indigo-50/50' },
                        { label: 'Total Community Votes', value: totalVotes, trend: '↑ Increased this week', color: 'text-emerald-600 bg-emerald-50/50' },
                      ];

                      return (
                        <div className="space-y-4 pt-1">
                          <div className="grid grid-cols-2 gap-3">
                            {stats.map((s, idx) => (
                              <div key={idx} className={`${s.color} p-3 rounded-xl border border-slate-100 flex flex-col justify-between`}>
                                <div>
                                  <span className="text-2xl font-black text-slate-900 block leading-none">{s.value}</span>
                                  <span className="text-[10px] font-extrabold text-slate-500 uppercase leading-snug block mt-1">{s.label}</span>
                                </div>
                                <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 mt-2">
                                  {s.trend}
                                </span>
                              </div>
                            ))}
                          </div>

                          {mostSupportedIssue && (
                            <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/30 p-3.5 rounded-xl border border-amber-100/70 space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-black text-amber-800">
                                <span>🏆 Most Supported Issue</span>
                              </div>
                              <div className="space-y-1">
                                <p className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-1">{mostSupportedIssue.title}</p>
                                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                                  <span>Support Count: <span className="text-brand-blue text-xs font-black">{mostSupportedIssue.upvotes}</span></span>
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${statusColors[mostSupportedIssue.status] || 'bg-slate-100 text-slate-700'}`}>{mostSupportedIssue.status}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                </div>

                {/* DUPLICATE DETECTION & COMMUNITY IMPACT ENGAGEMENT PANEL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Duplicate Prevention Panel */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-amber-500" />
                        <h3 className="font-bold text-brand-navy text-sm uppercase tracking-wider">Smart Duplicate Prevention</h3>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-200">
                        Active AI Guardian
                      </span>
                    </div>
                    
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Our spatial duplicate-detection models prevent citizens from logging identical complaints. By merging matching coordinate alerts into single records, we maximize work efficiency.
                    </p>

                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/80 text-center">
                        <span className="text-2xl font-black text-amber-600 block">{preventedDuplicatesCount}</span>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase leading-snug block">Duplicate Prevented</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/80 text-center">
                        <span className="text-2xl font-black text-brand-blue block">{mergedIssuesCount}</span>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase leading-snug block">Issues Merged</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/80 text-center">
                        <span className="text-2xl font-black text-emerald-600 block">
                          {issues.reduce((sum, i) => sum + (i.upvotes || 0), 0)}
                        </span>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase leading-snug block">Total Supporters</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-2">Recent Automatic Merge Logs</span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        <div className="p-2 bg-slate-50/60 border border-slate-100 rounded-lg flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-slate-500">UIQ-POT-2026-943</span>
                          <span className="text-slate-400">Merged into POT-2026-829</span>
                          <span className="text-emerald-600 font-extrabold font-mono">+1 supporter</span>
                        </div>
                        <div className="p-2 bg-slate-50/60 border border-slate-100 rounded-lg flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-slate-500">UIQ-WTR-2026-402</span>
                          <span className="text-slate-400">Merged into WTR-2026-118</span>
                          <span className="text-emerald-600 font-extrabold font-mono">+1 support & evidence</span>
                        </div>
                        <div className="p-2 bg-slate-50/60 border border-slate-100 rounded-lg flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-slate-500">UIQ-GRB-2026-311</span>
                          <span className="text-slate-400">Merged into GRB-2026-724</span>
                          <span className="text-emerald-600 font-extrabold font-mono">+1 supporter</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* High Impact Incidents Panel */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-brand-blue" />
                        <h3 className="font-bold text-brand-navy text-sm uppercase tracking-wider">High Impact Incidents</h3>
                      </div>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Community Impact Ranked
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      Calculated automatically using incident severity, supporter upvotes, uploaded citizen photo evidence, and age. City dispatchers utilize this score to allocate work crew schedules.
                    </p>

                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {issues
                        .map(issue => ({ issue, score: getCommunityImpactScore(issue) }))
                        .sort((a, b) => b.score - a.score)
                        .map(({ issue, score }) => (
                          <div 
                            key={issue.id} 
                            onClick={() => setSelectedIssue(issue)}
                            className="p-2.5 bg-slate-50/60 border border-slate-100 hover:border-brand-blue/30 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer"
                          >
                            <div className="space-y-0.5 min-w-0 font-sans">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono text-slate-400 font-bold">{issue.trackingId}</span>
                                <span className="font-extrabold text-brand-navy truncate text-xs">{issue.title}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">{issue.location.address}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Supporters</span>
                                <span className="text-xs font-extrabold text-slate-700">{issue.upvotes}</span>
                              </div>
                              <div className="bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg text-center min-w-[50px]">
                                <span className="text-[9px] text-amber-600 block font-bold uppercase leading-none">Score</span>
                                <span className="text-sm font-black text-amber-700">{score}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              /* WORKFLOW DISPATCHER INNER VIEW */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                
                {/* Left side: Active issues list (5 cols) */}
                <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[700px]">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-brand-navy text-sm uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-brand-blue" />
                        <span>Active Civic Tickets</span>
                      </h3>
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                        {issues.length} Total
                      </span>
                    </div>
                    
                    {/* Search inside dispatch list */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search by ID, title, or status..."
                        value={workflowSearch}
                        onChange={e => setWorkflowSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-blue bg-slate-50/50"
                      />
                    </div>
                  </div>

                  {/* High Density Scrollable Ticket List */}
                  <div className="flex-grow overflow-y-auto space-y-2.5 pr-1">
                    {(() => {
                      const list = issues.filter(i => {
                        if (!workflowSearch) return true;
                        const s = workflowSearch.toLowerCase();
                        return i.title.toLowerCase().includes(s) ||
                               i.trackingId.toLowerCase().includes(s) ||
                               i.status.toLowerCase().includes(s) ||
                               i.category.toLowerCase().includes(s);
                      });

                      if (list.length === 0) {
                        return (
                          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                            <HelpCircle className="w-8 h-8 stroke-1 mb-2 text-slate-300 animate-pulse" />
                            <p className="text-xs font-semibold">No matching active tickets found.</p>
                          </div>
                        );
                      }

                      return list.map(issue => {
                        const isSelected = selectedWorkflowIssueId === issue.id;
                        return (
                          <div
                            key={issue.id}
                            onClick={() => {
                              setSelectedWorkflowIssueId(issue.id);
                              setWorkflowRemarks(issue.progressRemarks || '');
                              setWorkflowOfficerName(issue.assignedOfficer || '');
                              setWorkflowDepartment(issue.assignedDepartment || 'Public Works');
                              setWorkflowInspectionDate(issue.inspectionDate || '');
                            }}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left flex flex-col gap-2 ${
                              isSelected
                                ? 'bg-gradient-to-r from-blue-50/40 to-indigo-50/40 border-brand-blue shadow-sm ring-1 ring-blue-100'
                                : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[10px] font-black text-slate-400">{issue.trackingId}</span>
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                                    issue.severity === 'Critical' ? 'bg-red-50 text-red-600 border border-red-100' :
                                    issue.severity === 'Severe' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                    'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}>
                                    {issue.severity}
                                  </span>
                                </div>
                                <h4 className="font-extrabold text-brand-navy text-xs line-clamp-1">{issue.title}</h4>
                              </div>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase self-start ${statusColors[issue.status] || 'bg-slate-100 text-slate-700'}`}>
                                {issue.status}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-2 mt-0.5">
                              <span className="truncate max-w-[150px]">
                                📍 {issue.location.neighborhood || 'Downtown Core'}
                              </span>
                              <span className="text-slate-500">
                                {issue.assignedDepartment ? `🏢 ${issue.assignedDepartment}` : '🏢 Unassigned'}
                              </span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Right side: Detailed Workspace & Action Panel (7 cols) */}
                <div className="lg:col-span-7 flex flex-col h-[700px]">
                  {(() => {
                    const selectedIssue = issues.find(i => i.id === selectedWorkflowIssueId);
                    
                    if (!selectedIssue) {
                      return (
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center h-full space-y-4">
                          <div className="w-16 h-16 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center border border-blue-100 shadow-inner">
                            <Briefcase className="w-8 h-8 stroke-[1.5]" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-brand-navy text-base">Select a Ticket to Dispatch</h3>
                            <p className="text-sm text-slate-400 max-w-sm mt-1 leading-relaxed">
                              Select any reported citizen ticket from the left panel to verify details, schedule inspections, assign crews, and manage the full urban maintenance lifecycle.
                            </p>
                          </div>
                        </div>
                      );
                    }

                    const stages: { status: IssueStatus; label: string }[] = [
                      { status: 'Reported', label: 'Reported' },
                      { status: 'Verified', label: 'Verified' },
                      { status: 'Assigned', label: 'Assigned' },
                      { status: 'Inspection Scheduled', label: 'Scheduled' },
                      { status: 'Work In Progress', label: 'In Progress' },
                      { status: 'Resolved', label: 'Resolved' },
                      { status: 'Closed', label: 'Closed' }
                    ];

                    const activeIndex = stages.findIndex(s => s.status === selectedIssue.status);

                    return (
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-y-auto space-y-5 text-left">
                        
                        {/* Title & Stats */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                          <div>
                            <span className="font-mono text-xs font-black text-slate-400 block">{selectedIssue.trackingId}</span>
                            <h3 className="font-extrabold text-brand-navy text-base leading-tight mt-0.5">{selectedIssue.title}</h3>
                            <p className="text-xs text-slate-400 font-bold mt-1">📍 {selectedIssue.location.address}</p>
                            {selectedIssue.location.exactLocation && (
                              <div className="mt-2">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-blue bg-blue-50/50 border border-blue-100 px-2 py-0.5 rounded">
                                  <span className="text-slate-400 font-normal">Landmark:</span>
                                  <span>{selectedIssue.location.exactLocation}</span>
                                </span>
                              </div>
                            )}
                          </div>
                          <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${statusColors[selectedIssue.status] || 'bg-slate-100 text-slate-700'}`}>
                            {selectedIssue.status}
                          </span>
                        </div>

                        {/* Interactive Workflow Progress Steps */}
                        <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl space-y-3">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                            Active Issue Lifecycle Phase
                          </span>
                          <div className="flex items-center justify-between overflow-x-auto pb-1 gap-2">
                            {stages.map((stage, idx) => {
                              const isCompleted = idx < activeIndex;
                              const isActive = idx === activeIndex;
                              return (
                                <div key={idx} className="flex items-center flex-1 min-w-[75px] flex-col text-center">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold transition-all border ${
                                    isCompleted ? 'bg-emerald-500 text-white border-emerald-600 shadow' :
                                    isActive ? 'bg-brand-blue text-white border-brand-blue ring-4 ring-blue-100' :
                                    'bg-white text-slate-400 border-slate-200'
                                  }`}>
                                    {isCompleted ? '✓' : idx + 1}
                                  </div>
                                  <span className={`text-[9px] font-black uppercase mt-1.5 tracking-tighter ${
                                    isActive ? 'text-brand-blue' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
                                  }`}>
                                    {stage.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Current Dispatch Parameters */}
                        <div className="grid grid-cols-2 gap-4 bg-slate-50/30 p-3 rounded-xl border border-slate-100/50 text-xs">
                          <div className="space-y-1">
                            <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px] block">Assigned Department</span>
                            <span className="font-extrabold text-brand-navy">{selectedIssue.assignedDepartment || 'Not Assigned Yet'}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px] block">Field Assignee / Officer</span>
                            <span className="font-extrabold text-brand-navy">{selectedIssue.assignedOfficer || 'Not Assigned Yet'}</span>
                          </div>
                          <div className="space-y-1 border-t border-slate-100/50 pt-2">
                            <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px] block">Scheduled Inspection Date</span>
                            <span className="font-extrabold text-brand-navy">{selectedIssue.inspectionDate || 'Not Scheduled Yet'}</span>
                          </div>
                          <div className="space-y-1 border-t border-slate-100/50 pt-2">
                            <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px] block">Latest Progress Remarks</span>
                            <p className="font-semibold text-slate-600 leading-snug truncate max-w-xs">{selectedIssue.progressRemarks || 'No remarks logged.'}</p>
                          </div>
                        </div>

                        {/* Authority Action Form Container */}
                        <div className="bg-gradient-to-br from-slate-50/30 to-blue-50/10 p-5 rounded-2xl border border-blue-100/30 space-y-4 flex-grow">
                          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                            <Wrench className="w-4.5 h-4.5 text-brand-blue" />
                            <h4 className="font-black text-brand-navy text-xs uppercase tracking-wider">Authority Action Panel</h4>
                          </div>

                          {/* DYNAMIC FORMS BASED ON CURRENT STATUS */}
                          {selectedIssue.status === 'Reported' && (
                            <div className="space-y-3.5 animate-fade-in text-xs">
                              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/60">
                                <p className="font-bold text-brand-blue text-[11px] leading-relaxed">
                                  ⚡ <strong>ACTION REQUIRED:</strong> This issue was recently reported by a citizen. Verify its severity and coordinate details to lock it into the queue.
                                </p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Verification Remarks</label>
                                <textarea
                                  placeholder="Enter inspection findings or verification remarks..."
                                  value={workflowRemarks}
                                  onChange={e => setWorkflowRemarks(e.target.value)}
                                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue min-h-[70px] bg-white text-xs leading-relaxed"
                                />
                              </div>
                              <button
                                onClick={async () => {
                                  const updated = await handleAuthorityAction(selectedIssue.trackingId, 'verify', { remarks: workflowRemarks });
                                  if (updated) {
                                    setWorkflowRemarks('');
                                    alert('Ticket verified successfully!');
                                  }
                                }}
                                className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs uppercase"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Verify Ticket Urgency</span>
                              </button>
                            </div>
                          )}

                          {selectedIssue.status === 'Verified' && (
                            <div className="space-y-3.5 animate-fade-in text-xs">
                              <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/50">
                                <p className="font-bold text-indigo-700 text-[11px] leading-relaxed">
                                  🏢 <strong>ASSIGN ACTION:</strong> Delegate this verified ticket to the specialized municipal department and assign a Lead Field Officer.
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-3.5">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Responsible Department</label>
                                  <select
                                    value={workflowDepartment}
                                    onChange={e => setWorkflowDepartment(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue bg-white font-bold text-slate-700"
                                  >
                                    <option value="Public Works">Public Works</option>
                                    <option value="Sanitation & Waste Management">Sanitation & Waste</option>
                                    <option value="Water Department">Water Department</option>
                                    <option value="Transport & Traffic Control">Transport & Traffic</option>
                                    <option value="Parks & Recreation">Parks & Rec</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Officer / Crew Lead Name</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Inspector Davis"
                                    value={workflowOfficerName}
                                    onChange={e => setWorkflowOfficerName(e.target.value)}
                                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue bg-white font-semibold"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Assignment Remarks / Instructions</label>
                                <textarea
                                  placeholder="Provide assignment briefing or specialized dispatch notes..."
                                  value={workflowRemarks}
                                  onChange={e => setWorkflowRemarks(e.target.value)}
                                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue min-h-[60px] bg-white text-xs leading-relaxed"
                                />
                              </div>
                              <button
                                onClick={async () => {
                                  if (!workflowOfficerName.trim()) {
                                    alert('Please specify an officer name.');
                                    return;
                                  }
                                  const updated = await handleAuthorityAction(selectedIssue.trackingId, 'assign', {
                                    department: workflowDepartment,
                                    officerName: workflowOfficerName,
                                    remarks: workflowRemarks
                                  });
                                  if (updated) {
                                    setWorkflowRemarks('');
                                    alert('Ticket assigned successfully!');
                                  }
                                }}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md shadow-indigo-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs uppercase"
                              >
                                <UserCheck className="w-4 h-4" />
                                <span>Assign Department & Officer</span>
                              </button>
                            </div>
                          )}

                          {selectedIssue.status === 'Assigned' && (
                            <div className="space-y-3.5 animate-fade-in text-xs">
                              <div className="bg-purple-50/40 p-3 rounded-xl border border-purple-100/50">
                                <p className="font-bold text-purple-700 text-[11px] leading-relaxed">
                                  📅 <strong>SCHEDULE INSPECTION:</strong> Set the official calendar target date for on-site engineering inspection or equipment setup.
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-3.5">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Inspection Target Date</label>
                                  <input
                                    type="date"
                                    value={workflowInspectionDate}
                                    onChange={e => setWorkflowInspectionDate(e.target.value)}
                                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue bg-white font-bold text-slate-700"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Lead Officer</label>
                                  <input
                                    type="text"
                                    placeholder="Officer Name"
                                    value={workflowOfficerName}
                                    onChange={e => setWorkflowOfficerName(e.target.value)}
                                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue bg-white font-semibold"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Scheduling Instructions</label>
                                <textarea
                                  placeholder="Specify scheduling details, lane closure requirements, etc..."
                                  value={workflowRemarks}
                                  onChange={e => setWorkflowRemarks(e.target.value)}
                                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue min-h-[60px] bg-white text-xs"
                                />
                              </div>
                              <button
                                onClick={async () => {
                                  if (!workflowInspectionDate) {
                                    alert('Please specify an inspection date.');
                                    return;
                                  }
                                  const updated = await handleAuthorityAction(selectedIssue.trackingId, 'schedule', {
                                    inspectionDate: workflowInspectionDate,
                                    officerName: workflowOfficerName,
                                    remarks: workflowRemarks
                                  });
                                  if (updated) {
                                    setWorkflowRemarks('');
                                    alert('Inspection scheduled successfully!');
                                  }
                                }}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md shadow-purple-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs uppercase"
                              >
                                <Clock className="w-4 h-4" />
                                <span>Lock Scheduled Date</span>
                              </button>
                            </div>
                          )}

                          {selectedIssue.status === 'Inspection Scheduled' && (
                            <div className="space-y-3.5 animate-fade-in text-xs">
                              <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/50">
                                <p className="font-bold text-amber-700 text-[11px] leading-relaxed">
                                  🚜 <strong>START WORK:</strong> Dispatch repair machinery and field personnel to site. Mark work actively in progress.
                                </p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Supervisor Name</label>
                                <input
                                  type="text"
                                  placeholder="Supervisor / Lead Name"
                                  value={workflowOfficerName}
                                  onChange={e => setWorkflowOfficerName(e.target.value)}
                                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue bg-white font-semibold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Field Status Remarks</label>
                                <textarea
                                  placeholder="e.g., Road crew has barricaded lane 2. Asphalt cutter deployed."
                                  value={workflowRemarks}
                                  onChange={e => setWorkflowRemarks(e.target.value)}
                                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue min-h-[70px] bg-white text-xs"
                                />
                              </div>
                              <button
                                onClick={async () => {
                                  const updated = await handleAuthorityAction(selectedIssue.trackingId, 'start-work', {
                                    officerName: workflowOfficerName,
                                    remarks: workflowRemarks
                                  });
                                  if (updated) {
                                    setWorkflowRemarks('');
                                    alert('Work marked as started successfully!');
                                  }
                                }}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md shadow-amber-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs uppercase"
                              >
                                <Zap className="w-4 h-4" />
                                <span>Commence On-Site Work</span>
                              </button>
                            </div>
                          )}

                          {selectedIssue.status === 'Work In Progress' && (
                            <div className="space-y-3.5 animate-fade-in text-xs">
                              <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/50">
                                <p className="font-bold text-emerald-700 text-[11px] leading-relaxed">
                                  🔧 <strong>COMPLETE WORK:</strong> Field team reports complete structural resolution. Post repair proof summary to clear the queue.
                                </p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Final Technical Resolutions Remarks</label>
                                <textarea
                                  placeholder="Detail materials used, surface test status, and clearance signatures..."
                                  value={workflowRemarks}
                                  onChange={e => setWorkflowRemarks(e.target.value)}
                                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue min-h-[70px] bg-white text-xs"
                                />
                              </div>
                              <button
                                onClick={async () => {
                                  const updated = await handleAuthorityAction(selectedIssue.trackingId, 'complete-work', {
                                    officerName: workflowOfficerName,
                                    remarks: workflowRemarks
                                  });
                                  if (updated) {
                                    setWorkflowRemarks('');
                                    alert('Work marked as completed successfully!');
                                  }
                                }}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs uppercase"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Mark Work Completed</span>
                              </button>
                            </div>
                          )}

                          {selectedIssue.status === 'Resolved' && (
                            <div className="space-y-3.5 animate-fade-in text-xs">
                              <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100/50">
                                <p className="font-bold text-rose-700 text-[11px] leading-relaxed">
                                  🔒 <strong>CLOSE & ARCHIVE:</strong> Formally archive this resolved ticket in the city ledger. This marks all workflows complete.
                                </p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Closing Audit Remarks</label>
                                <textarea
                                  placeholder="Log final administrative audits or closeout statements..."
                                  value={workflowRemarks}
                                  onChange={e => setWorkflowRemarks(e.target.value)}
                                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue min-h-[70px] bg-white text-xs"
                                />
                              </div>
                              <button
                                onClick={async () => {
                                  const updated = await handleAuthorityAction(selectedIssue.trackingId, 'close', { remarks: workflowRemarks });
                                  if (updated) {
                                    setWorkflowRemarks('');
                                    alert('Ticket closed and archived!');
                                  }
                                }}
                                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md shadow-rose-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs uppercase"
                              >
                                <Check className="w-4 h-4" />
                                <span>Close & Archive Ticket</span>
                              </button>
                            </div>
                          )}

                          {selectedIssue.status === 'Closed' && (
                            <div className="bg-slate-100 p-4 rounded-xl text-center border border-slate-200 animate-fade-in text-xs text-slate-500 space-y-2">
                              <span>🎉 This ticket is completely Resolved, Closed, and securely archived in the municipal database.</span>
                            </div>
                          )}

                          {/* GENERAL PROGRESS NOTES & OFFICER CHANGE - ALWAYS AVAILABLE FOR ACTIVE (NON-CLOSED) TICKETS */}
                          {selectedIssue.status !== 'Closed' && (
                            <div className="pt-3.5 border-t border-slate-100 space-y-3">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                Quick Admin Update (Set Assignee & Remarks)
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Update Officer Name</label>
                                  <input
                                    type="text"
                                    placeholder="Enter active officer..."
                                    value={workflowOfficerName}
                                    onChange={e => setWorkflowOfficerName(e.target.value)}
                                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-medium"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Quick Progress Note</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="Log progress remark..."
                                      value={workflowRemarks}
                                      onChange={e => setWorkflowRemarks(e.target.value)}
                                      className="flex-grow px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-medium"
                                    />
                                    <button
                                      onClick={async () => {
                                        if (!workflowRemarks.trim()) {
                                          alert('Please enter progress remarks.');
                                          return;
                                        }
                                        const updated = await handleAuthorityAction(selectedIssue.trackingId, 'update-remarks', {
                                          remarks: workflowRemarks,
                                          officerName: workflowOfficerName || undefined
                                        });
                                        if (updated) {
                                          setWorkflowRemarks('');
                                          alert('Remarks successfully updated!');
                                        }
                                      }}
                                      className="bg-brand-navy hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                                    >
                                      Post
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Recent Timeline Log on detail workspace */}
                        <div className="border-t border-slate-100 pt-4 space-y-3">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                            Audit Trail & Incident Timeline ({selectedIssue.updates?.length || 0})
                          </span>
                          <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                            {selectedIssue.updates && [...selectedIssue.updates].reverse().map((upd, uIdx) => (
                              <div key={uIdx} className="text-xs bg-slate-50/50 p-3 rounded-xl border border-slate-100/50 space-y-2 flex justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${statusColors[upd.status] || 'bg-slate-100 text-slate-700'}`}>
                                      {upd.status}
                                    </span>
                                    <span className="text-slate-400 font-bold text-[10px]">{new Date(upd.timestamp).toLocaleString()}</span>
                                  </div>
                                  <p className="text-slate-600 font-semibold leading-relaxed">&quot;{upd.note || upd.remarks}&quot;</p>
                                  {(upd.department || upd.officerName) && (
                                    <div className="text-[10px] text-slate-400 font-extrabold flex gap-3">
                                      {upd.department && <span>🏢 {upd.department}</span>}
                                      {upd.officerName && <span>👤 Officer {upd.officerName}</span>}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[9px] font-black text-brand-navy bg-slate-100/70 border border-slate-200/50 px-2 py-0.5 rounded-full uppercase self-start">
                                  {upd.performedBy}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </div>

              </div>
            )}

          </div>
          )
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <CitizenPortal
              issues={issues}
              setIssues={setIssues}
              onViewIssue={(issue) => {
                setSelectedIssue(issue);
                // Also toggle detail view or scroll to top as needed
              }}
              preventedDuplicatesCount={preventedDuplicatesCount}
              profile={profile}
              setProfile={setProfile}
            />

            {/* Municipal Officer Access Divider Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 space-y-4 shadow-sm hover:border-slate-300 transition-all mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">
                    SECURE ADMINISTRATIVE NODE
                  </span>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>🏛 Municipal Officer Access</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Authorized city administrators and engineering crew dispatchers may log in here to manage service requests, adjust timelines, and update status badges.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {officerSession ? (
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                      <div className="text-right">
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Active Session</span>
                        <p className="text-xs font-extrabold text-slate-800">{officerSession.name}</p>
                      </div>
                      <button
                        onClick={() => {
                          localStorage.removeItem('urban_iq_officer_session');
                          setOfficerSession(null);
                        }}
                        className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setOfficerLoginError('');
                        setOfficerIdInput('');
                        setOfficerPasswordInput('');
                        setIsOfficerLoginModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-slate-900/10 cursor-pointer"
                    >
                      Officer Login
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Nebula floating state-driven action toast/badge */}
      {nebulaToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90%] bg-slate-900 border border-slate-700 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            {nebulaToast.type === 'working' ? (
              <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : nebulaToast.type === 'success' ? (
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm flex-shrink-0">✓</div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm flex-shrink-0">✗</div>
            )}
            <span className="text-sm font-semibold tracking-wide">{nebulaToast.message}</span>
          </div>
          <button 
            onClick={() => setNebulaToast(null)} 
            className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded hover:bg-slate-800 transition-all cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* COMPACT MODAL DETAIL POPUP FOR ISSUES */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 bg-brand-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-3xl w-full bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row shadow-2xl max-h-[85vh] animate-fade-in">
            
            {/* Visual Photo column */}
            <div className="md:w-5/12 bg-slate-950 relative h-48 md:h-auto flex-shrink-0">
              <img src={selectedIssue.imageUrl} alt={selectedIssue.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white md:hidden">
                <span className="text-[10px] font-mono text-slate-400">{selectedIssue.trackingId}</span>
                <h3 className="font-extrabold text-sm">{selectedIssue.title}</h3>
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="absolute top-3 left-3 bg-slate-900/80 p-2 rounded-full text-white md:hidden cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Details Column */}
            <div className="md:w-7/12 flex flex-col justify-between overflow-y-auto max-h-[70vh] md:max-h-none">
              
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 font-bold hidden md:inline">{selectedIssue.trackingId}</span>
                  <h2 className="text-lg font-bold text-brand-navy line-clamp-2">{selectedIssue.title}</h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{selectedIssue.location.address}</span>
                  </p>
                  {selectedIssue.location.exactLocation && (
                    <p className="text-[11px] font-bold text-brand-blue bg-blue-50/50 border border-blue-100/50 px-2 py-0.5 rounded inline-block mt-1">
                      <span className="text-slate-400 font-normal">Landmark:</span> {selectedIssue.location.exactLocation}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="bg-slate-50 hover:bg-slate-100 p-2 rounded-lg text-slate-400 hover:text-slate-600 hidden md:inline transition-all cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Dynamic Tabs */}
              <div className="p-6 flex-grow space-y-4">
                
                {/* Description block */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase">Citizen Description</span>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">{selectedIssue.description}</p>
                </div>

                {/* Verified Location parameters */}
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-2">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-extrabold uppercase">
                    <span>📍 Verified Location Parameters</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-medium block">State</span>
                      <span className="text-slate-700 font-bold">{selectedIssue.location.state || 'California'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">City</span>
                      <span className="text-slate-700 font-bold">{selectedIssue.location.city || 'San Francisco'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">District</span>
                      <span className="text-slate-700 font-bold">{selectedIssue.location.district || selectedIssue.location.neighborhood || 'San Francisco County'}</span>
                    </div>
                    {selectedIssue.location.exactLocation && (
                      <div className="col-span-3 border-t border-slate-200/60 pt-2 mt-1">
                        <span className="text-slate-400 font-medium block">Exact Location / Landmark</span>
                        <span className="text-brand-blue font-bold">{selectedIssue.location.exactLocation}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI generated smart summary and safety parameters if exists */}
                {selectedIssue.aiAnalysis && (
                  <div className="bg-blue-50/50 border border-blue-100/70 p-4 rounded-xl space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-brand-blue flex items-center gap-1 uppercase tracking-wide">
                        <Shield className="w-3.5 h-3.5" />
                        <span>UrbanIQ AI Engine Dispatch Evaluation</span>
                      </span>
                      <span className="text-[10px] font-mono text-blue-500 font-bold">Confidence {selectedIssue.aiAnalysis.aiConfidence}%</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-slate-700 leading-relaxed font-semibold italic">
                        &quot;{selectedIssue.aiAnalysis.technicalSummary}&quot;
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-200">
                      <div>
                        <span className="text-[9px] text-slate-400 font-black block uppercase">Route Department</span>
                        <span className="font-bold text-brand-navy">{selectedIssue.aiAnalysis.department}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-black block uppercase">Complexity / Timeline</span>
                        <span className="font-bold text-brand-navy">{selectedIssue.aiAnalysis.complexityRating} • {selectedIssue.aiAnalysis.estimatedTimeline}</span>
                      </div>
                    </div>

                    {/* Citizen Safety guidelines if present */}
                    {selectedIssue.aiAnalysis.citizenSafetyGuidelines?.length > 0 && (
                      <div className="space-y-1 pt-1.5 border-t border-slate-200">
                        <span className="text-[9px] text-brand-critical font-black block uppercase">Immediate Safety Advisories</span>
                        <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-1 leading-relaxed">
                          {selectedIssue.aiAnalysis.citizenSafetyGuidelines.map((g, i) => (
                            <li key={i}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Required equipment */}
                    {selectedIssue.aiAnalysis.requiredEquipment?.length > 0 && (
                      <div className="space-y-1 pt-1.5 border-t border-slate-200">
                        <span className="text-[9px] text-slate-400 font-black block uppercase">Required Field Equipment</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedIssue.aiAnalysis.requiredEquipment.map((eq, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-600">
                              {eq}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* Comments Thread Section */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase">Comments ({selectedIssue.comments.length})</span>
                  
                  <div className="space-y-2.5 max-h-[160px] overflow-y-auto">
                    {selectedIssue.comments.map(c => (
                      <div key={c.id} className="text-xs bg-slate-50 p-2.5 rounded border border-slate-100 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span className="text-brand-navy">{c.userName} <span className="text-[9px] font-normal px-1.5 py-0.2 bg-slate-200 rounded text-slate-500 ml-1">{c.userRole}</span></span>
                          <span className="text-[9px] text-slate-400">{new Date(c.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-600 font-medium leading-relaxed">{c.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add comment form */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add an update or ask a question..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      className="flex-grow px-3 py-2 text-xs rounded border border-slate-200 focus:outline-none focus:border-brand-blue"
                    />
                    <button
                      onClick={() => handleAddComment(selectedIssue.id)}
                      className="bg-brand-navy hover:bg-brand-navy-light text-white font-bold px-3 py-2 rounded text-xs transition-all cursor-pointer"
                    >
                      Comment
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* PROFESSIONAL OFFICER LOGIN MODAL */}
      {isOfficerLoginModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 border-b border-slate-800 relative">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-brand-blue tracking-wider uppercase font-mono">
                  Authorized Municipal Personnel Only
                </span>
                <h3 className="text-xl font-black flex items-center gap-2">
                  <span>🏛 Municipal Staff Login</span>
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsOfficerLoginModalOpen(false)}
                className="absolute top-6 right-6 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer border border-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleOfficerLogin} className="p-6 md:p-8 space-y-4">
              
              {/* Login instructions */}
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Please enter your credentials to initiate a secure dispatcher session. This event is logged on the municipal ledger.
              </p>

              {/* Error Box */}
              {officerLoginError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold animate-pulse flex items-center gap-2">
                  <span className="text-sm">⚠️</span>
                  <span>{officerLoginError}</span>
                </div>
              )}

              {/* Officer ID Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Officer ID</label>
                <input
                  type="text"
                  placeholder="e.g. OFFICER001"
                  value={officerIdInput}
                  onChange={e => setOfficerIdInput(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold text-slate-800"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Password</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={officerPasswordInput}
                  onChange={e => setOfficerPasswordInput(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold text-slate-800"
                  required
                />
              </div>

              {/* Demo Account Tip Box */}
              <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl space-y-1 text-[10px]">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <span className="text-xs">💡</span>
                  <span>Demo Access Credentials:</span>
                </div>
                <div className="text-amber-700 font-mono space-y-0.5 pl-4 list-disc">
                  <div>Officer ID: <strong className="font-extrabold select-all">OFFICER001</strong></div>
                  <div>Password: <strong className="font-extrabold select-all">urbaniq@2026</strong></div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-[10px] text-center text-slate-400 font-semibold italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                Demo credentials are available for hackathon evaluation.
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOfficerLoginModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-slate-900/10 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Authenticate Session</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* FLOATING AI CHAT CONCIERGE COMPANION */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {chatOpen && (
          <div className="w-[340px] sm:w-[380px] h-[480px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col justify-between mb-3 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-brand-navy p-4 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <h4 className="text-sm font-extrabold">Nebula</h4>
                  <p className="text-[9px] text-slate-400 font-medium tracking-wide">ACTIVE DEEPMIND GEMINI MODEL</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat History Messages */}
            <div className="p-4 flex-grow overflow-y-auto space-y-3.5 bg-slate-50">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className="space-y-2">
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed whitespace-pre-line ${
                      msg.role === 'user' 
                        ? 'bg-brand-blue text-white rounded-br-none shadow' 
                        : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>

                  {/* Clickable Suggestion Chips below welcome message */}
                  {idx === 0 && msg.role === 'model' && (
                    <div className="flex flex-wrap gap-1.5 pl-1 pt-1 max-w-[95%]">
                      {[
                        "Update my name to Mohit",
                        "Track issue UIQ-102",
                        "Search pothole complaints",
                        "Open my profile",
                        "Show community issues"
                      ].map((chipText, chipIdx) => (
                        <button
                          key={chipIdx}
                          type="button"
                          onClick={() => submitMessage(chipText)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-brand-blue border border-blue-200/50 rounded-lg text-[11px] font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] text-left cursor-pointer shadow-xs"
                        >
                          {chipText}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl text-xs rounded-bl-none shadow-sm flex items-center gap-1.5 animate-pulse">
                    <Loader2 className="w-4 h-4 text-brand-blue animate-spin" />
                    <span className="text-slate-400">Nebula is thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleChatSubmit} className="p-3 bg-white border-t border-slate-100 flex gap-2">
              <input
                type="text"
                placeholder="Ask Nebula..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="flex-grow px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-brand-blue text-slate-700"
              />
              <button
                type="submit"
                className="bg-brand-blue hover:bg-brand-blue-dark text-white p-2 rounded-lg shadow-md transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Floating Bubble trigger with Tooltip */}
        <div className="relative group">
          {/* Tooltip */}
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 flex items-center gap-1.5 border border-slate-800">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            UrbanIQ AI Assistant
          </div>

          <button
            onClick={() => setChatOpen(!chatOpen)}
            title="UrbanIQ AI Assistant"
            className="bg-brand-blue hover:bg-brand-blue-dark text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer relative z-10 overflow-visible"
          >
            {/* Pulsing Glow Rings */}
            <span className="absolute inset-0 rounded-full bg-brand-blue/30 animate-ping pointer-events-none"></span>
            <span className="absolute inset-0 rounded-full bg-brand-blue/40 animate-pulse -z-10 shadow-[0_0_15px_rgba(59,130,246,0.6)] pointer-events-none"></span>

            <Bot className="w-6 h-6 relative z-20 animate-pulse" />
            <span className="absolute -top-1 -right-1 bg-red-500 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white z-30">1</span>
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-900 text-left">
          
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2 text-left">
              <UrbanIqLogo size="2.25rem" />
              <span className="text-lg font-extrabold text-white tracking-tight">UrbanIQ</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              The premier civic intelligence dashboard integrating citizen reports with AI-powered physical dispatch operations. Accelerating public safety and utility restoration community-wide.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-mono font-bold text-slate-500">CIVIC SERVICES PORTAL: SECURE</span>
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => setActiveTab('home')} className="hover:text-white transition-colors cursor-pointer p-0 text-left bg-transparent border-0 outline-none">Main Landing</button></li>
              <li><button onClick={() => setActiveTab('report')} className="hover:text-white transition-colors cursor-pointer p-0 text-left bg-transparent border-0 outline-none">File Complaint</button></li>
              <li><button onClick={() => setActiveTab('community')} className="hover:text-white transition-colors cursor-pointer p-0 text-left bg-transparent border-0 outline-none">Community Feed</button></li>
              <li><button onClick={() => setActiveTab('track')} className="hover:text-white transition-colors cursor-pointer p-0 text-left bg-transparent border-0 outline-none">Track Repair</button></li>
              <li><button onClick={() => setActiveTab('map')} className="hover:text-white transition-colors cursor-pointer p-0 text-left bg-transparent border-0 outline-none">GIS Intelligence Map</button></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Sectors Covered</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>• Potholes & Structural Pavements</li>
              <li>• Public Sanitation & Blockages</li>
              <li>• Water Leakage & Hydro Distress</li>
              <li>• Drainage Failures & Storm Runoffs</li>
              <li>• Broken Streetlights & Grid Safety</li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">System Integrity</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              All uploads pass through strict multi-modal censorship & validation pipelines under supervision code v4.2.
            </p>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">NETWORK SPEED</span>
              <span className="text-[11px] text-emerald-400 font-mono font-bold">14.8 Hour SLA</span>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <p className="text-xs text-slate-500">
            © 2026 UrbanIQ Civic Technology Division. Developed for smarter communities.
          </p>
          <div className="flex gap-4 text-xs font-semibold text-slate-500">
            <span className="hover:text-slate-300 cursor-pointer">Citizen Charter</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">Developer API</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">Security Protocol</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
