'use client'

import React from 'react';
import { UserPlus, Pencil, Trash2 } from 'lucide-react';

type UserStatus = 'Active' | 'Inactive';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
  status: UserStatus;
}

// --- Mock Data ---
const usersData: User[] = [
  {
    id: 1,
    name: 'Elias Thorne',
    email: 'elias.thorne@mrp-corp.com',
    role: 'Admin',
    lastLogin: '2023-10-27 14:02',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Sarah Jenkins',
    email: 's.jenkins@mrp-corp.com',
    role: 'Editor',
    lastLogin: '2023-10-27 09:15',
    status: 'Active',
  },
  {
    id: 3,
    name: 'Marcus Vance',
    email: 'm.vance@mrp-corp.com',
    role: 'Viewer',
    lastLogin: '2023-10-20 16:45',
    status: 'Inactive',
  },
  {
    id: 4,
    name: 'Aiko Tanaka',
    email: 'aiko.t@mrp-corp.com',
    role: 'Editor',
    lastLogin: '2023-10-26 11:30',
    status: 'Active',
  },
  {
    id: 5,
    name: 'David Fischer',
    email: 'd.fischer@mrp-corp.com',
    role: 'Viewer',
    lastLogin: '2023-09-15 08:00',
    status: 'Inactive',
  },
];

// --- Helper: Status Badge Component ---
const StatusBadge = ({ status }: { status: 'Active' | 'Inactive' }) => {
  const baseClasses =
    'inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border';

  if (status === 'Active') {
    return (
      <div
        className={`${baseClasses} bg-mrp-success/10 border-mrp-success/20 text-mrp-success`}
      >
        Active
      </div>
    );
  }

  // Using Warning colors for Inactive to denote a dormant/disabled state visually
  return (
    <div
      className={`${baseClasses} bg-mrp-warning/10 border-mrp-warning/20 text-mrp-warning`}
    >
      Inactive
    </div>
  );
};

// --- Main Component ---
export function UserAccessView() {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white m-0">User Access</h1>

        {/* Primary Action Button */}
        <button className="bg-mrp-primary hover:bg-mrp-primary-hover text-white text-sm font-medium py-2 px-4 rounded-sm transition-colors flex items-center gap-2 border border-transparent shadow-sm ml-auto">
          <UserPlus size={16} />
          Add New User
        </button>
      </div>

      {/* Data Table Container */}
      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            {/* Table Header */}
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">
                  User Name
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">
                  Email
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">
                  Role
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">
                  Last Login
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap text-right">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {usersData.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-mrp-panel transition-colors group"
                >
                  {/* User Name */}
                  <td className="py-3 px-4 text-[13px] text-white font-medium whitespace-nowrap">
                    {user.name}
                  </td>

                  {/* Email (Secondary text) */}
                  <td className="py-3 px-4 text-[13px] text-mrp-text-secondary whitespace-nowrap">
                    {user.email}
                  </td>

                  {/* Role */}
                  <td className="py-3 px-4 text-[13px] text-white font-medium whitespace-nowrap">
                    {user.role}
                  </td>

                  {/* Last Login (Mono font for data-dense aesthetic) */}
                  <td className="py-3 px-4 font-mono text-[13px] text-mrp-text-muted whitespace-nowrap">
                    {user.lastLogin}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusBadge status={user.status} />
                  </td>

                  {/* Actions (Icon-only buttons) */}
                  <td className="py-3 px-4 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-2">
                      {/* Edit Button */}
                      <button
                        title="Edit User"
                        className="inline-flex items-center justify-center p-1 border border-mrp-border text-mrp-text-muted bg-transparent rounded-sm transition-colors hover:bg-mrp-border hover:text-white"
                      >
                        <Pencil size={14} />
                      </button>
                      {/* Delete Button */}
                      <button
                        title="Delete User"
                        className="inline-flex items-center justify-center p-1 border border-mrp-border text-mrp-text-muted bg-transparent rounded-sm transition-colors hover:bg-mrp-border hover:text-mrp-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
