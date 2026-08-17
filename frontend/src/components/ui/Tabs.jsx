import React from 'react';

export default function Tabs({ tabs = [], activeTab, onChange, className = '' }) {
  return (
    <div className={`tabs-container custom-scrollbar ${className}`.trim()}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id || activeTab === tab.key;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id || tab.key}
            type="button"
            onClick={() => onChange(tab.id || tab.key)}
            className={`tab-pill ${isActive ? 'active' : ''}`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{tab.label || tab.name}</span>
            {tab.count !== undefined && (
              <span className="badge-count">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
