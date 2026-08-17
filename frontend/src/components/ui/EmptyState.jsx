import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No records found', message = 'There are no entries to display at this time.', icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#1B4E9B] flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="card-title text-[#1F2937]">{title}</h4>
      <p className="helper-text mt-1 max-w-sm">{message}</p>
    </div>
  );
}
