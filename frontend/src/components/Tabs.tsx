/**
 * CreditGuard AI - Tab Component
 * Reusable tab system with smooth animations
 */

import { ReactNode, useState } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, defaultTab, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Headers */}
      <div className="flex border-b border-slate-700 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-300
              relative whitespace-nowrap
              ${
                activeTab === tab.id
                  ? 'text-emerald-400 border-b-2 border-emerald-500'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
              }
            `}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tab-panel-${tab.id}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 animate-slide-in"></div>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        key={activeTab}
        id={`tab-panel-${activeTab}`}
        role="tabpanel"
        className="animate-fade-in"
      >
        {activeTabContent}
      </div>
    </div>
  );
};

export default Tabs;

