import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: 'reader' | 'writer' | 'admin';
  fallback?: React.ReactNode;
}

export const RoleGuard = ({ children, requiredRole, fallback }: RoleGuardProps) => {
  const { hasRole, isLoading, profile } = useAuth();

  console.log('🛡️ RoleGuard:', { requiredRole, isLoading, profile, hasAccess: hasRole(requiredRole) });

  if (isLoading) {
    console.log('⏳ RoleGuard: Still loading...');
    return null; // or loading spinner
  }

  if (!hasRole(requiredRole)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>
          Você não tem permissão para acessar esta funcionalidade. É necessário ter papel de "{requiredRole}" ou superior.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};