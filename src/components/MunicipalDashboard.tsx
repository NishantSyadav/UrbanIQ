import React, { useState } from 'react';
import { 
  Shield, CheckCircle, Clock, AlertTriangle, Layers, Users, LogOut, 
  Search, Filter, Calendar, Edit, Check, MapPin, Sparkles, RefreshCw, X, ChevronRight, UserCheck
} from 'lucide-react';
import { CivicIssue, IssueStatus, IssueSeverity, IssueCategory, UpdateState } from '../types';

interface MunicipalDashboardProps {
  issues: CivicIssue[];
  onUpdateIssue: (trackingId: string, updateData: any) => Promise<boolean>;
  onLogout: () => void;
  officerSession: { id: string; name: string; role: string; department: string } | null;
  preventedDuplicatesCount: number;
}

const DEPARTMENTS = [
  'Road Maintenance',
  'Sanitation',
  'Water Supply',
  'Electricity',
  'Traffic',
  'Public Works'
];

const STATUSES: IssueStatus[] = [
  'Reported',
  'Verified',
  'Assigned',
  'Inspection Scheduled',
  'Work In Progress',
  'Resolved',
  'Closed'
];

const SEVERITIES: IssueSeverity[] = ['Minor', 'Moderate', 'Severe', 'Critical'];

const STATUS_BADGES: Record<IssueStatus, string> = {
  'Reported': 'bg-amber-50 text-amber-700 border-amber-200/60',
  'Verified': 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
  'Assigned': 'bg-blue-50 text-blue-700 border-blue-200/60',
  'Inspection Scheduled': 'bg-purple-50 text-purple-700 border-purple-200/60',
  'Work In Progress': 'bg-sky-50 text-sky-700 border-sky-200/60 animate-pulse',
  'Resolved': 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  'Closed': 'bg-slate-50 text-slate-600 border-slate-200/60'
};

const SEVERITY_BADGES: Record<IssueSeverity, string> = {
  'Minor': 'bg-slate-100 text-slate-700 border-slate-200',
  'Moderate': 'bg-amber-100 text-amber-800 border-amber-200',
  'Severe': 'bg-orange-100 text-orange-800 border-orange-200',
  'Critical': 'bg-rose-100 text-rose-800 border-rose-200 font-extrabold ring-1 ring-rose-300 animate-pulse'
};

export default function MunicipalDashboard({
  issues,
  onUpdateIssue,
  onLogout,
  officerSession,
  preventedDuplicatesCount
}: MunicipalDashboardProps) {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Currently being edited issue
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
  
  // Action state managers
  const [actionStatus, setActionStatus] = useState<IssueStatus>('Reported');
  const [actionDepartment, setActionDepartment] = useState<string>('Public Works');
  const [actionOfficerName, setActionOfficerName] = useState('');
  const [actionSeverity, setActionSeverity] = useState<IssueSeverity>('Moderate');
  const [actionInspectionDate, setActionInspectionDate] = useState('');
  const [actionRemarks, setActionRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Statistics Computations
  const totalIssues = issues.length;
  const openIssues = issues.filter(i => i.status === 'Reported').length;
  const verifiedIssues = issues.filter(i => i.status === 'Verified').length;
  const wipIssues = issues.filter(i => i.status === 'Work In Progress').length;
  const resolvedIssues = issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;
  const criticalIssues = issues.filter(i => i.severity === 'Critical').length;
  const totalSupporters = issues.reduce((acc, curr) => acc + (curr.upvotes || 0), 0);

  // Open action modal
  const handleOpenActionModal = (issue: CivicIssue) => {
    setSelectedIssue(issue);
    setActionStatus(issue.status);
    setActionDepartment(issue.assignedDepartment || issue.aiAnalysis?.department || 'Public Works');
    setActionOfficerName(issue.assignedOfficer || '');
    setActionSeverity(issue.severity);
    setActionInspectionDate(issue.inspectionDate || '');
    setActionRemarks(issue.progressRemarks || '');
  };

  // Quick verify
  const handleQuickVerify = async (e: React.MouseEvent, issue: CivicIssue) => {
    e.stopPropagation();
    handleOpenActionModal(issue);
    setActionStatus('Verified');
    setActionRemarks('Issue verified by Municipal Officer Portal.');
  };

  // Submit edits
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    setIsSubmitting(true);
    const success = await onUpdateIssue(selectedIssue.trackingId, {
      status: actionStatus,
      department: actionDepartment,
      officerName: actionOfficerName,
      severity: actionSeverity,
      inspectionDate: actionInspectionDate,
      remarks: actionRemarks
    });

    setIsSubmitting(false);
    if (success) {
      setSelectedIssue(null);
    }
  };

  // Filtered Issues for table
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = 
      issue.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (issue.assignedOfficer && issue.assignedOfficer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      issue.location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.location.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || issue.category === categoryFilter;
    const matchesSeverity = severityFilter === 'All' || issue.severity === severityFilter;
    const matchesStatus = statusFilter === 'All' || issue.status === statusFilter;

    return matchesSearch && matchesCategory && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HEADER ROW */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-brand-blue/20 text-brand-blue text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-brand-blue/30">
                Authorized Access Only
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-400 font-mono">SECURE NODE HOST</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">Municipal Command Center</h1>
            <p className="text-sm text-slate-400 max-w-xl font-medium">
              Logistics control terminal for <strong className="text-slate-200">Officer {officerSession?.name || 'Mohit'}</strong>. Manage dispatcher workloads, schedule on-site engineering crews, and update public-facing timelines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400 font-bold uppercase">Assigned Unit</p>
              <p className="text-sm font-extrabold text-white">{officerSession?.department || 'Operations'}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-rose-900/10 hover:scale-105 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Return to Citizen Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* METRIC COMMAND GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* STAT 1: Total */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2 flex flex-col justify-between hover:border-brand-blue/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Reports</span>
            <span className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-black text-brand-navy">{totalIssues}</p>
          <div className="text-[10px] text-slate-500 font-semibold">Logged complaints database</div>
        </div>

        {/* STAT 2: Open */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2 flex flex-col justify-between hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Open / Reported</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4 animate-spin-slow" />
            </span>
          </div>
          <p className="text-3xl font-black text-amber-600">{openIssues}</p>
          <div className="text-[10px] text-slate-500 font-semibold">Awaiting officer verification</div>
        </div>

        {/* STAT 3: Verified */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2 flex flex-col justify-between hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verified Issues</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <UserCheck className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-black text-indigo-600">{verifiedIssues}</p>
          <div className="text-[10px] text-slate-500 font-semibold">Inspected and confirmed legal</div>
        </div>

        {/* STAT 4: WIP */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2 flex flex-col justify-between hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Work In Progress</span>
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
            </span>
          </div>
          <p className="text-3xl font-black text-sky-600">{wipIssues}</p>
          <div className="text-[10px] text-slate-500 font-semibold">Active contractor crews on-site</div>
        </div>

        {/* STAT 5: Resolved */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved Issues</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-black text-emerald-600">{resolvedIssues}</p>
          <div className="text-[10px] text-slate-500 font-semibold">Remediated & finalized</div>
        </div>

        {/* STAT 6: Critical */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2 flex flex-col justify-between hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Critical Priority</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-black text-rose-600">{criticalIssues}</p>
          <div className="text-[10px] text-slate-500 font-semibold">High risk, immediate priority</div>
        </div>

        {/* STAT 7: Duplicates Prevented */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2 flex flex-col justify-between hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Duplicates Thwarted</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-black text-blue-600">{preventedDuplicatesCount}</p>
          <div className="text-[10px] text-slate-500 font-semibold">AI semantic matching intercepts</div>
        </div>

        {/* STAT 8: Community Supporters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2 flex flex-col justify-between hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Supporters</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-black text-indigo-600">{totalSupporters}</p>
          <div className="text-[10px] text-slate-500 font-semibold">Unique citizen validation upvotes</div>
        </div>
      </div>

      {/* FILTER & DIR BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
            <span>Citizen Incident Management Directory</span>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono font-bold">
              {filteredIssues.length} matching
            </span>
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-grow sm:flex-grow-0 max-w-xs">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ID, title, officer, location..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white font-medium"
              />
            </div>

            {/* Clear filters */}
            {(categoryFilter !== 'All' || severityFilter !== 'All' || statusFilter !== 'All' || searchTerm) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('All');
                  setSeverityFilter('All');
                  setStatusFilter('All');
                }}
                className="text-xs text-slate-500 hover:text-brand-navy font-bold flex items-center gap-1 hover:bg-slate-100 px-3 py-2 rounded-xl transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Droptable filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3" /> Category Filter
            </label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold text-slate-700"
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

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3" /> Severity Priority
            </label>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold text-slate-700"
            >
              <option value="All">All Priorities</option>
              {SEVERITIES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3" /> Execution Status
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold text-slate-700"
            >
              <option value="All">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE DIRECTORY TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="p-4">Tracking ID</th>
                <th className="p-4">Issue Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Location</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Supporters</th>
                <th className="p-4">Current Status</th>
                <th className="p-4">Reported Date</th>
                <th className="p-4">Assigned Dept</th>
                <th className="p-4">Assigned Officer</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredIssues.length > 0 ? (
                filteredIssues.map((issue) => (
                  <tr 
                    key={issue.id} 
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    onClick={() => handleOpenActionModal(issue)}
                  >
                    {/* ID */}
                    <td className="p-4 font-mono font-black text-brand-navy group-hover:text-brand-blue">
                      {issue.trackingId}
                    </td>

                    {/* Title */}
                    <td className="p-4">
                      <div className="max-w-[180px] truncate">
                        <p className="font-semibold text-slate-900 group-hover:underline">{issue.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{issue.description}</p>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          {issue.category}
                        </span>
                        {issue.mediaType === 'Video' && (
                          <span className="text-[8px] font-extrabold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-purple-200">
                            <span className="w-1 h-1 bg-purple-500 rounded-full animate-pulse"></span>
                            <span>VIDEO {issue.videoDuration ? `(${issue.videoDuration})` : ''}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="p-4">
                      <div className="max-w-[220px] space-y-1">
                        <p className="font-bold text-slate-800 line-clamp-1">{issue.location.address}</p>
                        <div className="text-[10px] text-slate-500 space-y-0.5">
                          <p className="flex items-center gap-1 font-semibold text-brand-navy">
                            <span className="text-brand-blue">📍</span>
                            <span>{issue.location.neighborhood || 'Local Locality'}, {issue.location.city || 'City'}</span>
                          </p>
                          <p className="text-[9px] text-slate-400 pl-3.5">
                            {issue.location.district || 'District'} • {issue.location.state || 'State'}
                          </p>
                        </div>
                        {issue.location.exactLocation && (
                          <p className="text-[9px] font-bold text-brand-blue bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 w-fit mt-0.5 max-w-full truncate" title={issue.location.exactLocation}>
                            <span className="font-normal text-slate-400 font-sans">LM:</span> {issue.location.exactLocation}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 border rounded-full text-[10px] font-bold ${SEVERITY_BADGES[issue.severity]}`}>
                        {issue.severity}
                      </span>
                    </td>

                    {/* Supporters */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{issue.upvotes}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold ${STATUS_BADGES[issue.status]}`}>
                        {issue.status}
                      </span>
                    </td>

                    {/* Reported Date */}
                    <td className="p-4 text-slate-400 font-medium whitespace-nowrap">
                      {new Date(issue.reportedAt).toLocaleDateString()}
                    </td>

                    {/* Assigned Department */}
                    <td className="p-4 font-semibold text-slate-600">
                      {issue.assignedDepartment || issue.aiAnalysis?.department || (
                        <span className="text-slate-400 font-medium">Unassigned</span>
                      )}
                    </td>

                    {/* Assigned Officer */}
                    <td className="p-4 font-semibold text-slate-600">
                      {issue.assignedOfficer || (
                        <span className="text-slate-400 font-medium">Unassigned</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="p-4 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        {issue.status === 'Reported' && (
                          <button
                            onClick={(e) => handleQuickVerify(e, issue)}
                            title="Quick Verify"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenActionModal(issue)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 font-bold flex items-center gap-1 text-[10px] transition-all cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Manage</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400 font-medium">
                    No matching citizen reports located. Adjust your search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPREHENSIVE ACTION DIALOG / MODAL */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-8 animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 md:p-6 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-brand-blue tracking-wide bg-brand-blue/10 px-2 py-0.5 rounded">
                    {selectedIssue.trackingId}
                  </span>
                  <span className={`px-2 py-0.5 border rounded-full text-[10px] font-black uppercase ${STATUS_BADGES[selectedIssue.status]}`}>
                    {selectedIssue.status}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold tracking-tight">{selectedIssue.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedIssue(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleFormSubmit} className="p-6 md:p-8 space-y-6 flex-grow max-h-[70vh] overflow-y-auto">
              
                {/* Description & Metadata Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</span>
                    <p className="text-slate-600 font-semibold leading-relaxed">&quot;{selectedIssue.description}&quot;</p>
                  </div>
                  <div className="space-y-2 text-left">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Citizen Address & Locality Hierarchy</span>
                      <p className="text-slate-700 font-bold">{selectedIssue.location.address}</p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        {selectedIssue.location.neighborhood || 'Locality'} • {selectedIssue.location.city || 'City'} • {selectedIssue.location.district || 'District'} • {selectedIssue.location.state || 'State'}
                      </p>
                    </div>
                    {selectedIssue.location.exactLocation && (
                      <div className="bg-blue-50/70 border border-blue-100 p-2.5 rounded-xl mt-1.5">
                        <span className="text-[10px] font-black text-brand-blue uppercase tracking-wider block">Exact Location / Landmark</span>
                        <p className="text-[11px] text-slate-700 font-bold">{selectedIssue.location.exactLocation}</p>
                      </div>
                    )}
                  </div>

                  {selectedIssue.mediaType === 'Video' && selectedIssue.mediaPath ? (
                    <div className="space-y-1.5 md:col-span-2 mt-2 pt-3 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attached Video Evidence</span>
                      <div className="relative rounded-xl overflow-hidden aspect-video border border-slate-200 bg-slate-950 max-h-[220px] flex items-center justify-center">
                        <video src={selectedIssue.mediaPath} controls className="w-full h-full object-contain" />
                      </div>
                    </div>
                  ) : selectedIssue.imageUrl ? (
                    <div className="space-y-1.5 md:col-span-2 mt-2 pt-3 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attached Photo Evidence</span>
                      <div className="relative rounded-xl overflow-hidden aspect-video border border-slate-200 bg-slate-100 max-h-[220px] flex items-center justify-center">
                        <img src={selectedIssue.imageUrl} alt="Evidence" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  ) : null}
                </div>

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Status Update */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Change status</label>
                  <select
                    value={actionStatus}
                    onChange={e => setActionStatus(e.target.value as IssueStatus)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold text-slate-800"
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Priority/Severity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Set Priority</label>
                  <select
                    value={actionSeverity}
                    onChange={e => setActionSeverity(e.target.value as IssueSeverity)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold text-slate-800"
                  >
                    {SEVERITIES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Assign Department */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Assign Department</label>
                  <select
                    value={actionDepartment}
                    onChange={e => setActionDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold text-slate-800"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Assigned Officer */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Assign Officer Name</label>
                  <input
                    type="text"
                    placeholder="E.g., Officer Mohit, Supervisor Harris..."
                    value={actionOfficerName}
                    onChange={e => setActionOfficerName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold text-slate-800"
                  />
                </div>

                {/* 5. Inspection Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Schedule Inspection Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={actionInspectionDate}
                      onChange={e => setActionInspectionDate(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Status-specific helpful notes */}
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                  <Shield className="w-4 h-4 text-brand-blue flex-shrink-0" />
                  <span>
                    Submitting changes will automatically trigger citizen notifications, log timestamps, and update timeline structures.
                  </span>
                </div>
              </div>

              {/* 6. Remarks / Progress update */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Update Remarks & Audit Log Note</label>
                <textarea
                  rows={3}
                  placeholder="Detail action, crew status, technical measurements, or completed metrics..."
                  value={actionRemarks}
                  onChange={e => setActionRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold text-slate-850"
                  required
                />
              </div>

              {/* HISTORIC AUDIT TIMELINE FOR THIS ISSUE */}
              {selectedIssue.updates && selectedIssue.updates.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Update timeline audit history ({selectedIssue.updates.length})
                  </span>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {[...selectedIssue.updates].reverse().map((upd, uIdx) => (
                      <div key={uIdx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs flex justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${STATUS_BADGES[upd.status] || 'bg-slate-200 text-slate-600'}`}>
                              {upd.status}
                            </span>
                            <span className="text-slate-400 font-bold text-[9px]">{new Date(upd.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-600 font-medium">&quot;{upd.note || upd.remarks}&quot;</p>
                        </div>
                        <span className="text-[9px] font-black text-slate-500 uppercase h-fit px-1.5 py-0.5 rounded bg-slate-200/50">
                          {upd.performedBy}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="pt-4 border-t border-slate-150 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-brand-navy hover:bg-slate-800 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-slate-900/10 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  <span>Commit Officer Actions</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
