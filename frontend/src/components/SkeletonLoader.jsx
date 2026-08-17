import React from 'react';

export default function SkeletonLoader({ rows = 4, columns = 3, type = 'table' }) {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] p-4">
            <div className="h-4 bg-[#E2E8F0] rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-[#CBD5E1] rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-[#E2E8F0] rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, rIndex) => (
        <div key={rIndex} className="flex gap-4 p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg">
          {Array.from({ length: columns }).map((_, cIndex) => (
            <div key={cIndex} className="h-4 bg-[#E2E8F0] rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
}
