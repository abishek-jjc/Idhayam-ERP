import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CoreAPI } from '../api';
import { ShieldCheck, UserCheck, KeyRound, Building2, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 relative font-sans text-[#1F2937]">
      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#1B4E9B] text-white font-black text-2xl shadow-md mb-1">
            E3
          </div>
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">
            ERP v3 Corporate System
          </h1>
          <p className="text-xs text-[#6B7280] font-medium uppercase tracking-wider">Enterprise Resource Planning & Metadata Engine</p>
        </div>

        {/* Login Card */}
        <div className="standard-card space-y-6">
          
          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 bg-[#F1F5F9] rounded-lg border border-[#E5E7EB] text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setActiveTab('superadmin'); setUsername('superadmin'); setPassword('SuperAdminPassword123!'); }}
              className={`py-2 rounded-md transition-all flex items-center justify-center gap-2 ${
                activeTab === 'superadmin'
                  ? 'bg-[#1B4E9B] text-white font-bold'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> SuperAdmin
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('designation')}
              className={`py-2 rounded-md transition-all flex items-center justify-center gap-2 ${
                activeTab === 'designation'
                  ? 'bg-[#1B4E9B] text-white font-bold'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
            >
              <UserCheck className="w-4 h-4" /> Designation User
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#DC2626] shrink-0" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'superadmin' ? (
              <>
                <div className="space-y-1">
                  <label className="form-label flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1B4E9B]" /> SuperAdmin Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input"
                    placeholder="Enter superadmin"
                  />
                </div>

                <div className="space-y-1">
                  <label className="form-label flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#1B4E9B]" /> SuperAdmin Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="Enter password"
                  />
                </div>

                {/* Notice Box with Credentials */}
                <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-xs space-y-1 text-[#1F2937]">
                  <p className="font-bold text-[#1B4E9B] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> Default SuperAdmin Credentials:
                  </p>
                  <p className="font-mono text-[11px]">Username: <span className="font-bold text-[#16A34A]">superadmin</span></p>
                  <p className="font-mono text-[11px]">Password: <span className="font-bold text-[#CA8A04]">SuperAdminPassword123!</span></p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="form-label flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#1B4E9B]" /> Select User Designation
                  </label>
                  <select
                    value={selectedDesignation}
                    onChange={(e) => setSelectedDesignation(e.target.value)}
                    className="form-input"
                  >
                    {designations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.department_name || 'General'}) - Level {d.hierarchy_level}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-[#6B7280] italic">
                  Logging in with this designation loads configured Process Engine and Master Type permissions.
                </p>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full h-[40px] text-sm"
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

        <p className="text-center text-xs text-[#6B7280]">
          ERP v3 System Matrix &bull; Enterprise Resource Architecture
        </p>

      </div>
    </div>
  );
}
