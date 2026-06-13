import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
      {/* Info text */}
      <p className="text-xs text-[var(--adm-text-muted)] font-medium order-2 sm:order-1">
        Hiển thị{' '}
        <span className="font-bold text-[var(--adm-text)]">{start}–{end}</span>
        {' '}trong tổng số{' '}
        <span className="font-bold text-[var(--adm-text)]">{totalItems}</span>{' '}kết quả
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--adm-border)] text-[var(--adm-text-muted)] hover:text-[var(--adm-text)] hover:bg-[var(--adm-surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          aria-label="Trang trước"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-9 h-9 flex items-center justify-center text-xs text-[var(--adm-text-subtle)]"
            >
              ···
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                currentPage === page
                  ? 'bg-[var(--adm-primary)] text-white shadow-md'
                  : 'border border-[var(--adm-border)] text-[var(--adm-text-muted)] hover:text-[var(--adm-text)] hover:bg-[var(--adm-surface-2)]'
              }`}
              aria-label={`Trang ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--adm-border)] text-[var(--adm-text-muted)] hover:text-[var(--adm-text)] hover:bg-[var(--adm-surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          aria-label="Trang sau"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
