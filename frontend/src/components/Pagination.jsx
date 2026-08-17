import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems = 0, itemsPerPage = 10 }) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E5E7EB] text-xs font-sans">
      <div className="text-[#6B7280]">
        Showing <span className="font-semibold text-[#1F2937]">{startItem}</span> to{' '}
        <span className="font-semibold text-[#1F2937]">{endItem}</span> of{' '}
        <span className="font-semibold text-[#1F2937]">{totalItems}</span> entries
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn-secondary h-8 w-8 p-0 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-3 py-1.5 font-semibold text-[#374151] bg-[#F8FAFC] rounded-md border border-[#E5E7EB] text-xs">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn-secondary h-8 w-8 p-0 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
