import React from 'react';

interface SkeletonCardProps {
  count?: number;
}

export function SkeletonCard({ count = 4 }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="adm-card p-5 md:p-6 space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className="adm-skeleton w-11 h-11 rounded-xl" />
            <div className="adm-skeleton w-14 h-5 rounded-md" />
          </div>
          <div className="space-y-2 mt-2">
            <div className="adm-skeleton w-20 h-3 rounded-md" />
            <div className="adm-skeleton w-28 h-7 rounded-lg" />
          </div>
        </div>
      ))}
    </>
  );
}

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export function SkeletonTable({ rows = 5, cols = 5 }: SkeletonTableProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-[var(--adm-border)]">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-5 py-4">
              <div className="adm-skeleton h-4 rounded-md" style={{ width: `${60 + Math.random() * 40}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

interface SkeletonListProps {
  rows?: number;
}

export function SkeletonList({ rows = 4 }: SkeletonListProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="adm-card p-4 flex items-center gap-4">
          <div className="adm-skeleton w-12 h-12 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="adm-skeleton h-4 rounded-md w-3/4" />
            <div className="adm-skeleton h-3 rounded-md w-1/2" />
          </div>
          <div className="adm-skeleton w-16 h-6 rounded-full" />
        </div>
      ))}
    </div>
  );
}
