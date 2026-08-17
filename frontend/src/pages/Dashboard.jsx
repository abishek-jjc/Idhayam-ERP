import React, { useEffect, useState } from 'react';
import { CoreAPI, ProcessEngineAPI, WorkflowAPI, JournalAPI } from '../api';
import { Building2, Users, Cpu, GitPullRequest, Boxes, Truck, CheckCircle2, LayoutGrid, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const [stats, setStats] = useState({
    plantsCount: 0,
    employeesCount: 0,
    machinesCount: 0,
    processTypesCount: 0,
    instancesCount: 0,
    proposalsCount: 0,
    stocksCount: 0,
  });
  const [recentInstances, setRecentInstances] = useState([]);
  const [dynamicWidgets, setDynamicWidgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [plantsRes, empRes, macRes, pTypeRes, instRes, propRes, stockRes, widgetRes] = await Promise.all([
        CoreAPI.getPlants().catch(() => ({ data: [] })),
        CoreAPI.getEmployees().catch(() => ({ data: [] })),
        CoreAPI.getMachines().catch(() => ({ data: [] })),
        ProcessEngineAPI.getProcessTypes().catch(() => ({ data: [] })),
        ProcessEngineAPI.getInstances().catch(() => ({ data: [] })),
        WorkflowAPI.getProposals().catch(() => ({ data: [] })),
        JournalAPI.getStocks().catch(() => ({ data: [] })),
        axios.get('http://127.0.0.1:8000/api/core/ui-widgets/?active=true').catch(() => ({ data: [] }))
      ]);

      setStats({
        plantsCount: plantsRes.data.count || plantsRes.data.results?.length || plantsRes.data.length || 0,
        employeesCount: empRes.data.count || empRes.data.results?.length || empRes.data.length || 0,
        machinesCount: macRes.data.count || macRes.data.results?.length || macRes.data.length || 0,
        processTypesCount: pTypeRes.data.count || pTypeRes.data.results?.length || pTypeRes.data.length || 0,
        instancesCount: instRes.data.count || instRes.data.results?.length || instRes.data.length || 0,
        proposalsCount: propRes.data.count || propRes.data.results?.length || propRes.data.length || 0,
        stocksCount: stockRes.data.count || stockRes.data.results?.length || stockRes.data.length || 0,
      });

      setRecentInstances((instRes.data.results || instRes.data || []).slice(0, 5));
      setDynamicWidgets(widgetRes.data?.results || widgetRes.data || []);
    } catch (err) {
      console.error("Failed to load dashboard statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    window.addEventListener('erp_ui_metadata_updated', loadDashboardData);
    return () => window.removeEventListener('erp_ui_metadata_updated', loadDashboardData);
  }, []);

  const getWidgetValue = (w) => {
    if (w.widget_type !== 'kpi') return 'Active';
    if (loading) return '...';
    const src = (w.data_source || '').toLowerCase().trim();
    if (src.includes('emp') || src.includes('user') || src.includes('workforce')) return stats.employeesCount;
    if (src.includes('plant') || src.includes('facil')) return stats.plantsCount;
    if (src.includes('mach') || src.includes('vehic')) return stats.machinesCount;
    if (src.includes('inst') || src.includes('exec')) return stats.instancesCount;
    if (src.includes('prop') || src.includes('work')) return stats.proposalsCount;
    if (src.includes('stock') || src.includes('bin') || src.includes('loc')) return stats.stocksCount;
    if (src.includes('proc') || src.includes('type')) return stats.processTypesCount;
    return stats.employeesCount || 10;
  };

  const cardData = [
    { title: 'Active Plants & Units', count: stats.plantsCount, icon: Building2 },
    { title: 'Total Workforce', count: stats.employeesCount, icon: Users },
    { title: 'Machines & Vehicles', count: stats.machinesCount, icon: Truck },
    { title: 'Dynamic Process Types', count: stats.processTypesCount, icon: Cpu },
    { title: 'Executed Instances', count: stats.instancesCount, icon: CheckCircle2 },
    { title: 'Workflow Proposals', count: stats.proposalsCount, icon: GitPullRequest },
    { title: 'Tracked Bins & Stock', count: stats.stocksCount, icon: Boxes },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-[13px] text-[#6B7280] mt-1">Universal Enterprise Resource Planning & Metadata Engine</p>
      </div>

      {/* Dynamic Metadata Widgets Grid */}
      {dynamicWidgets.length > 0 && (
        <div className="space-y-3">
          <h3 className="section-title text-[15px] flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-[#1B4E9B]" /> Configured Metadata Widgets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dynamicWidgets.map((w) => (
              <div key={w.id} className="kpi-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="kpi-label">{w.widget_name}</p>
                    <p className="kpi-number mt-1">
                      {getWidgetValue(w)}
                    </p>
                    <p className="text-[11px] text-[#6B7280] mt-1">{w.data_source || 'Core Aggregator'}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#1B4E9B] flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                </div>
                {w.widget_type === 'shortcut' && (
                  <Link
                    to={w.data_source || '/process-links'}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#1B4E9B] font-semibold hover:underline"
                  >
                    Open Feature <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main KPI Grid: 4 columns on large desktop, 2 on tablet, 1 on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardData.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div key={idx} className="kpi-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="kpi-label">{c.title}</p>
                  <p className="kpi-number mt-2">{loading ? '...' : c.count}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#1B4E9B] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Process Executions Table */}
      <div className="standard-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="section-title">Recent Process Executions</h3>
            <p className="text-[12px] text-[#6B7280]">Latest dynamic process instances logged in the process engine.</p>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Instance ID</th>
                <th>Process Type</th>
                <th>Plant / Unit</th>
                <th>Operator</th>
                <th>Status</th>
                <th className="text-right">Created Date</th>
              </tr>
            </thead>
            <tbody>
              {recentInstances.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-[#6B7280] italic">No recent process instances recorded.</td>
                </tr>
              ) : (
                recentInstances.map((inst) => (
                  <tr key={inst.id}>
                    <td className="font-mono text-[#1B4E9B] font-semibold">{inst.id}</td>
                    <td className="font-medium text-[#1F2937]">{inst.process_type_name}</td>
                    <td>{inst.plant_name}</td>
                    <td>{inst.performed_by_name || 'System Operator'}</td>
                    <td>
                      <span className="badge badge-success">
                        {inst.status}
                      </span>
                    </td>
                    <td className="text-right font-mono text-[#6B7280] text-[12px]">
                      {new Date(inst.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
