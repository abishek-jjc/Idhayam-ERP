import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CoreAPI } from '../api';
import { ShieldCheck, UserCheck, KeyRound, Sparkles, Building2, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { login, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('superadmin'); // 'superadmin' | 'designation'
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('SuperAdminPassword123!');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [designations, setDesignations] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDesignations();
  }, []);

  async function loadDesignations() {
    try {
      const res = await CoreAPI.getDesignations();
      const list = res.data.results || res.data || [];
      setDesignations(list);
      if (list.length > 0) {
        setSelectedDesignation(list[0].id);
      }
    } catch (err) {
      console.error("Failed to load designations for login page:", err);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    let payload = {};
    if (activeTab === 'superadmin') {
      payload = { username, password };
    } else {
      payload = { designation_id: selectedDesignation };
    }

    const res = await login(payload);
    setSubmitting(false);

    if (res.success) {
      if (res.user.is_superadmin) {
        navigate('/admin-console');
      } else {
        navigate('/user');
      }
    } else {
      setErrorMsg(res.error || 'Authentication failed. Please check credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-2xl shadow-xl shadow-indigo-500/30 mb-2">
            E2
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            ERP <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">v2 Enterprise</span>
          </h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Generic Access & Workflow Portal</p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-slate-900/90 shadow-2xl backdrop-blur-xl space-y-6">
          
          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setActiveTab('superadmin'); setUsername('superadmin'); setPassword('SuperAdminPassword123!'); }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'superadmin'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> SuperAdmin
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('designation')}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'designation'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" /> Designation User
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping shrink-0" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'superadmin' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> SuperAdmin Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input bg-slate-950/80 border-slate-800 focus:border-blue-500 text-white text-sm"
                    placeholder="Enter superadmin"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-purple-400" /> SuperAdmin Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input bg-slate-950/80 border-slate-800 focus:border-purple-500 text-white text-sm"
                    placeholder="Enter password"
                  />
                </div>

                {/* Notice Box with Credentials */}
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1 text-slate-300">
                  <p className="font-bold text-blue-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Provided SuperAdmin Credentials:
                  </p>
                  <p className="font-mono text-[11px] text-slate-200">Username: <span className="text-emerald-400 font-bold">superadmin</span></p>
                  <p className="font-mono text-[11px] text-slate-200">Password: <span className="text-amber-400 font-bold">SuperAdminPassword123!</span></p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Select User Designation
                  </label>
                  <select
                    value={selectedDesignation}
                    onChange={(e) => setSelectedDesignation(e.target.value)}
                    className="form-input bg-slate-950/90 border-slate-800 text-white text-sm font-semibold rounded-xl"
                  >
                    {designations.map((d) => (
                      <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                        {d.title} ({d.department_name || 'General'}) - Level {d.hierarchy_level}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-slate-400 italic">
                  Logging in with this designation will load its customized Process Engine and Master Type permissions configured by SuperAdmin.
                </p>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to {activeTab === 'superadmin' ? 'SuperAdmin Console' : 'User Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        <p className="text-center text-xs text-slate-500">
          ERP v2 Architecture &bull; Process Type Access & Designation Role Matrix Enabled
        </p>

      </div>
    </div>
  );
}
