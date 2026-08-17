import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Building2, Eye, EyeOff, KeyRound, Loader2, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useConfiguration } from '../context/ConfigurationContext';
import { CoreAPI } from '../api';
import Button from '../components/ui/Button';

const isDevelopment = import.meta.env.DEV;

export default function LoginPage() {
  const { login } = useAuth();
  const { theme } = useConfiguration();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('superadmin');
  const [username, setUsername] = useState(isDevelopment ? 'superadmin' : '');
  const [password, setPassword] = useState(isDevelopment ? 'SuperAdminPassword123!' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [designations, setDesignations] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    CoreAPI.getDesignations().then((response) => {
      const list = response.data.results || response.data || [];
      setDesignations(list);
      if (list.length) setSelectedDesignation(list[0].id);
    }).catch(() => setDesignations([]));
  }, []);

  const chooseLoginMode = (mode) => {
    setActiveTab(mode);
    setErrorMsg('');
    if (mode === 'superadmin' && isDevelopment) {
      setUsername('superadmin');
      setPassword('SuperAdminPassword123!');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setErrorMsg('');
    setSubmitting(true);
    const payload = activeTab === 'superadmin' ? { username, password } : { designation_id: selectedDesignation };
    try {
      const result = await login(payload);
      if (result.success) navigate(result.user.is_superadmin ? '/admin-console' : '/user');
      else setErrorMsg(result.error || 'Authentication failed. Check your details and try again.');
    } catch {
      setErrorMsg('Unable to reach the ERP authentication service.');
    } finally { setSubmitting(false); }
  };

  return <main className="login-shell">
    <div className="login-product-mark" aria-hidden="true" />
    <section className="login-stage" aria-labelledby="login-product-title">
      <header className="login-brand">
        <div className="login-logo">{theme?.logo_text || 'E3'}</div>
        <div>
          <p className="login-eyebrow">Enterprise platform</p>
          <h1 id="login-product-title">{theme?.application_name || 'ERP V3'} <span>Corporate System</span></h1>
          <p>Enterprise Resource Planning &amp; Metadata Engine</p>
        </div>
      </header>

      <div className="login-card">
        <div className="login-card-heading">
          <p className="workspace-kicker">Secure access</p>
          <h2>Welcome back</h2>
          <p>Sign in with your administrative credentials or assigned designation.</p>
        </div>

        <div className="login-segmented" role="tablist" aria-label="Login method">
          <button type="button" role="tab" aria-selected={activeTab === 'superadmin'} className={activeTab === 'superadmin' ? 'active' : ''} onClick={() => chooseLoginMode('superadmin')}><ShieldCheck /> Super Admin</button>
          <button type="button" role="tab" aria-selected={activeTab === 'designation'} className={activeTab === 'designation' ? 'active' : ''} onClick={() => chooseLoginMode('designation')}><UserCheck /> Designation</button>
        </div>

        {errorMsg && <div className="login-error" role="alert"><AlertCircle /><span>{errorMsg}</span></div>}

        <form onSubmit={handleSubmit} className="login-form">
          {activeTab === 'superadmin' ? <>
            <div className="login-field">
              <label htmlFor="erp-username">SuperAdmin username</label>
              <div className="login-input-wrap"><ShieldCheck aria-hidden="true" /><input id="erp-username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter your username" required autoFocus /></div>
            </div>
            <div className="login-field">
              <label htmlFor="erp-password">Password</label>
              <div className="login-input-wrap"><KeyRound aria-hidden="true" /><input id="erp-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /><button type="button" className="login-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff /> : <Eye />}</button></div>
            </div>
          </> : <div className="login-field">
            <label htmlFor="erp-designation">Assigned designation</label>
            <div className="login-input-wrap"><Building2 aria-hidden="true" /><select id="erp-designation" value={selectedDesignation} onChange={(event) => setSelectedDesignation(event.target.value)} required>{designations.length === 0 && <option value="">No designations available</option>}{designations.map((designation) => <option key={designation.id} value={designation.id}>{designation.title} — Level {designation.hierarchy_level}</option>)}</select></div>
            <p className="login-helper">Your designation loads its configured modules, processes, and data permissions.</p>
          </div>}

          <Button type="submit" className="login-submit" disabled={submitting || (activeTab === 'designation' && !selectedDesignation)}>
            {submitting ? <><Loader2 className="animate-spin" /> Signing in...</> : <>Sign In to ERP <ArrowRight /></>}
          </Button>
        </form>

        {isDevelopment && activeTab === 'superadmin' && <details className="development-credentials"><summary>Development credentials</summary><div><span>Username <code>superadmin</code></span><span>Password <code>SuperAdminPassword123!</code></span></div></details>}
      </div>
      <footer>Protected enterprise access · Authorized users only</footer>
    </section>
  </main>;
}
