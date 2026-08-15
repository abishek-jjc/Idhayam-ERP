import React, { useEffect, useState } from 'react';
import { CoreAPI, ProcessEngineAPI, WorkflowAPI, JournalAPI } from '../api';
import { Building2, Users, Cpu, GitPullRequest, Boxes, Truck, CheckCircle2, TrendingUp, LayoutGrid, ArrowRight } from 'lucide-react';
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

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [plantsRes, empRes, macRes, pTypeRes, instRes, propRes, stockRes, widgetRes] = await Promise.all([
          CoreAPI.getPlants(),
          CoreAPI.getEmployees(),
          CoreAPI.getMachines(),
          ProcessEngineAPI.getProcessTypes(),
          ProcessEngineAPI.getInstances(),
          WorkflowAPI.getProposals(),
          JournalAPI.getStocks(),
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
    }
    loadDashboardData();
  }, []);

  const cardData = [
    { title: 'Active Plants & Units', count: stats.plantsCount, icon: Building2, color: 'from-blue-500 to-indigo-500' },
    { title: 'Total Workforce', count: stats.employeesCount, icon: Users, color: 'from-purple-500 to-pink-500' },
    { title: 'Machines & Vehicles', count: stats.machinesCount, icon: Truck, color: 'from-amber-500 to-orange-500' },
    { title: 'Dynamic Process Types', count: stats.processTypesCount, icon: Cpu, color: 'from-emerald-500 to-teal-500' },
    { title: 'Executed Process Instances', count: stats.instancesCount, icon: CheckCircle2, color: 'from-cyan-500 to-blue-500' },
    { title: 'Workflow Proposals', count: stats.proposalsCount, icon: GitPullRequest, color: 'from-rose-500 to-red-500' },
    { title: 'Tracked Bins & Stock', count: stats.stocksCount, icon: Boxes, color: 'from-indigo-500 to-violet-500' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome Banner */}
      <div className="glass-panel p-8 relative overflow-hidden bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5" /> ERP v3 Metadata Engine Running
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Executive Intelligence <span className="gradient-text">ERP v3 Dashboard</span>
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl">
            Metadata-driven ERP platform featuring administrator-configured dynamic navigation, dynamic forms, modal popups, and dashboard widgets.
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none"></div>
      </div>

      {/* Dynamic Metadata Widgets Grid */}
      {dynamicWidgets.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-blue-400" /> Configured Metadata Widgets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {dynamicWidgets.map((w) => (
              <div
                key={w.id}
                className={`glass-panel p-5 relative overflow-hidden group hover:border-white/20 transition-all ${w.grid_width || 'col-span-1'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{w.widget_name}</p>
                    <p className="text-2xl font-black text-white mt-1 font-mono">
                      {w.widget_type === 'kpi' ? (loading ? '...' : (stats.employeesCount || 12)) : 'Live'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">{w.data_source || 'Core Aggregator'}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                </div>
                {w.widget_type === 'shortcut' && (
                  <Link
                    to={w.data_source || '/process-links'}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-400 font-semibold hover:text-blue-300"
                  >
                    Open Feature <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Core Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cardData.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div key={idx} className="glass-panel p-5 relative overflow-hidden group hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{c.title}</p>
                  <p className="text-2xl font-black text-white mt-1">{loading ? '...' : c.count}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${c.color} flex items-center justify-center text-white shadow-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Process Instances Table */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Recent Process Executions</h3>
            <p className="text-xs text-slate-400">Latest dynamic process instances logged in the process engine.</p>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Instance ID</th>
                <th className="pb-3">Process Type</th>
                <th className="pb-3">Plant / Unit</th>
                <th className="pb-3">Operator</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
              {recentInstances.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-400 italic">No recent process instances recorded.</td>
                </tr>
              ) : (
                recentInstances.map((inst) => (
                  <tr key={inst.id} className="hover:bg-white/5 transition-all">
                    <td className="py-3 font-mono text-[11px] text-blue-400 font-bold">{inst.id}</td>
                    <td className="py-3 font-semibold text-white">{inst.process_type_name}</td>
                    <td className="py-3 text-slate-400">{inst.plant_name}</td>
                    <td className="py-3 text-slate-400">{inst.performed_by_name || 'System Operator'}</td>
                    <td className="py-3">
                      <span className="badge badge-active uppercase text-[10px]">
                        {inst.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-slate-400 text-[11px]">
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
