import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import React from 'react';

interface RequireRoleProps {
  roles: string[];
  children: React.ReactNode;
  redirectTo?: string;
}

export const RequireRole = ({ roles, children, redirectTo = '/' }: RequireRoleProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm text-gray-400 font-medium">Validating permissions...</p>
        </div>
      </div>
    );
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
