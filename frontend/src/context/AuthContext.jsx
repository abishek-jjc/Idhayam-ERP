import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('erp_v2_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [designation, setDesignation] = useState(() => {
    const saved = localStorage.getItem('erp_v2_designation');
    return saved ? JSON.parse(saved) : null;
  });

  const [permissions, setPermissions] = useState(() => {
    const saved = localStorage.getItem('erp_v2_permissions');
    return saved ? JSON.parse(saved) : [];
  });

  const [loading, setLoading] = useState(false);

  const isSuperAdmin = user?.is_superadmin || designation?.id === 'DSG-SUPERADMIN' || designation?.hierarchy_level >= 99;

  const login = async (loginPayload) => {
    setLoading(true);
    try {
      const res = await AuthAPI.login(loginPayload);
      if (res.data && res.data.success) {
        const u = res.data.user;
        const d = res.data.designation;
        const p = res.data.permissions || [];

        setUser(u);
        setDesignation(d);
        setPermissions(p);

        localStorage.setItem('erp_v2_user', JSON.stringify(u));
        localStorage.setItem('erp_v2_designation', JSON.stringify(d));
        localStorage.setItem('erp_v2_permissions', JSON.stringify(p));

        return { success: true, user: u };
      } else {
        return { success: false, error: res.data.error || 'Login failed' };
      }
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, error: err.response?.data?.error || err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setDesignation(null);
    setPermissions([]);
    localStorage.removeItem('erp_v2_user');
    localStorage.removeItem('erp_v2_designation');
    localStorage.removeItem('erp_v2_permissions');
  };

  const updatePermissionsState = (newPerms) => {
    setPermissions(newPerms);
    localStorage.setItem('erp_v2_permissions', JSON.stringify(newPerms));
  };

  const hasPermission = (moduleName, processTypeId = null, action = 'view') => {
    if (isSuperAdmin) return true;
    if (!permissions || permissions.length === 0) return false;

    // Check if permission exists for module or specific process_type
    return permissions.some((p) => {
      const matchesModule = p.module === moduleName || p.module === 'all';
      const matchesPT = !processTypeId || p.process_type === processTypeId || p.process_type_code === processTypeId;
      
      if (!matchesModule) return false;
      if (processTypeId && !matchesPT) return false;

      if (action === 'view') return p.can_view !== false;
      if (action === 'create') return !!p.can_create;
      if (action === 'edit') return !!p.can_edit;
      if (action === 'delete') return !!p.can_delete;
      if (action === 'approve') return !!p.can_approve;

      return true;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        designation,
        permissions,
        isSuperAdmin,
        loading,
        login,
        logout,
        hasPermission,
        updatePermissionsState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
