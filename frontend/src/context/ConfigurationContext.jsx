import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const ConfigurationContext = createContext(null);
const API_ROOT = 'http://127.0.0.1:8000/api/core';
const asList = (response) => response?.data?.results || response?.data || [];

const applyTheme = (theme) => {
  if (!theme) return;
  const root = document.documentElement;
  const variables = {
    '--theme-primary': theme.primary_color,
    '--theme-secondary': theme.secondary_color,
    '--theme-accent': theme.accent_color,
    '--theme-bg': theme.background_color,
    '--theme-card': theme.card_bg_color,
    '--theme-sidebar': theme.sidebar_color,
    '--sidebar-text': theme.sidebar_text_color,
    '--sidebar-active-bg': theme.sidebar_active_bg,
    '--sidebar-active-text': theme.sidebar_active_text,
    '--sidebar-hover-bg': theme.sidebar_hover_bg,
    '--sidebar-hover-text': theme.sidebar_hover_text,
    '--sidebar-icon': theme.sidebar_icon_color,
    '--sidebar-active-icon': theme.sidebar_active_icon_color,
    '--sidebar-border': theme.sidebar_border_color,
    '--sidebar-width': theme.sidebar_width,
    '--menu-spacing': theme.menu_spacing,
    '--theme-navbar': theme.navbar_color,
    '--navbar-text': theme.navbar_text_color,
    '--navbar-border': theme.navbar_border_color,
    '--navbar-icon': theme.navbar_icon_color,
    '--login-background': theme.login_background_color,
    '--login-card': theme.login_card_color,
    '--input-background': theme.input_background_color,
    '--input-border': theme.input_border_color,
    '--input-text': theme.input_text_color,
    '--table-header': theme.table_header_color,
    '--table-row': theme.table_row_color,
    '--success': theme.success_color,
    '--warning': theme.warning_color,
    '--danger': theme.danger_color,
    '--info': theme.info_color,
    '--theme-shadow': theme.shadow_value,
    '--theme-text': theme.text_color,
    '--theme-border': theme.border_color,
    '--theme-radius': theme.button_radius,
    '--theme-font': theme.font_family,
    '--primary': theme.primary_color,
    '--primary-dark': theme.secondary_color,
    '--secondary': theme.secondary_color,
    '--background': theme.background_color,
    '--surface': theme.card_bg_color,
    '--text-primary': theme.text_color,
    '--border': theme.border_color,
    '--radius-sm': theme.button_radius,
    '--radius-md': theme.button_radius,
    '--radius-lg': theme.button_radius,
  };
  Object.entries(variables).forEach(([name, value]) => {
    if (value) root.style.setProperty(name, value);
  });
};

export function ConfigurationProvider({ children }) {
  const [configuration, setConfiguration] = useState({
    menus: [], navbars: [], forms: [], modals: [], widgets: [], dashboardLayouts: [], theme: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastImpact, setLastImpact] = useState(null);

  const refreshConfiguration = useCallback(async () => {
    try {
      const token = localStorage.getItem('erp_v2_token');
      const requestConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
      const [menus, navbars, forms, modals, widgets, dashboardLayouts, themes] = await Promise.all([
        axios.get(`${API_ROOT}/ui-menus/?active=true`, requestConfig),
        axios.get(`${API_ROOT}/ui-navbars/?active=true`, requestConfig),
        token ? axios.get(`${API_ROOT}/ui-forms/?active=true`, requestConfig) : Promise.resolve({ data: [] }),
        token ? axios.get(`${API_ROOT}/ui-modals/?active=true`, requestConfig) : Promise.resolve({ data: [] }),
        token ? axios.get(`${API_ROOT}/ui-widgets/?active=true`, requestConfig) : Promise.resolve({ data: [] }),
        token ? axios.get(`${API_ROOT}/ui-dashboard-layouts/?active=true`, requestConfig) : Promise.resolve({ data: [] }),
        axios.get(`${API_ROOT}/ui-themes/?active=true`, requestConfig),
      ]);
      const activeThemes = asList(themes);
      const activeTheme = activeThemes.find((item) => item.active) || activeThemes[0] || null;
      setConfiguration({
        menus: asList(menus).sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
        navbars: asList(navbars),
        forms: asList(forms),
        modals: asList(modals),
        widgets: asList(widgets).sort((a, b) => (a.position || 0) - (b.position || 0)),
        dashboardLayouts: asList(dashboardLayouts),
        theme: activeTheme,
      });
      applyTheme(activeTheme);
      setError(null);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConfiguration();
    const refresh = () => refreshConfiguration();
    window.addEventListener('erp_ui_metadata_updated', refresh);
    window.addEventListener('erp_theme_updated', refresh);
    window.addEventListener('erp_auth_changed', refresh);
    window.addEventListener('erp_permissions_updated', refresh);
    return () => {
      window.removeEventListener('erp_ui_metadata_updated', refresh);
      window.removeEventListener('erp_theme_updated', refresh);
      window.removeEventListener('erp_auth_changed', refresh);
      window.removeEventListener('erp_permissions_updated', refresh);
    };
  }, [refreshConfiguration]);

  useEffect(() => {
    const typeMap = {
      'ui-menus': 'menu', 'ui-navbars': 'navbar', 'ui-forms': 'form',
      'ui-form-fields': 'form_field', 'ui-modals': 'modal',
      'ui-widgets': 'widget', 'ui-themes': 'theme',
      'ui-dashboard-layouts': 'dashboard_layout', 'ui-search-configurations': 'search',
    };
    const interceptor = axios.interceptors.response.use((response) => {
      const method = response.config?.method?.toLowerCase();
      const url = response.config?.url || '';
      const match = url.match(/\/(ui-(?:menus|navbars|forms|form-fields|modals|widgets|themes|dashboard-layouts|search-configurations))\/(?:([^/?]+)\/)?/);
      if (match && ['post', 'put', 'patch'].includes(method)) {
        const configType = typeMap[match[1]];
        const itemId = response.data?.id || match[2];
        if (configType && itemId) {
          axios.get(`${API_ROOT}/ui-config-impact/?config_type=${configType}&item_id=${encodeURIComponent(itemId)}`)
            .then((impactResponse) => setLastImpact({
              configType,
              itemId,
              ...impactResponse.data,
              timestamp: Date.now(),
            }))
            .catch(() => setLastImpact({
              configType, itemId, connected_to_live_pages: false,
              affected_pages: [], affected_components: [], timestamp: Date.now(),
            }));
        }
      }
      return response;
    });
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const clearLastImpact = useCallback(() => setLastImpact(null), []);

  const value = useMemo(() => ({
    ...configuration,
    loading,
    error,
    refreshConfiguration,
    lastImpact,
    clearLastImpact,
    getNavbar: (pageName) => configuration.navbars.find((item) => item.page_name === pageName) || null,
    getForm: (formName) => configuration.forms.find((item) => item.form_name === formName) || null,
  }), [clearLastImpact, configuration, error, lastImpact, loading, refreshConfiguration]);

  return <ConfigurationContext.Provider value={value}>{children}</ConfigurationContext.Provider>;
}

export function useConfiguration() {
  const context = useContext(ConfigurationContext);
  if (!context) throw new Error('useConfiguration must be used within ConfigurationProvider');
  return context;
}
