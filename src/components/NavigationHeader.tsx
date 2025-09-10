import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  LogOut, 
  User,
  BarChart3,
  Settings,
  Map,
  Database,
  Users,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

interface NavigationHeaderProps {
  title?: string;
  subtitle?: string;
}

export const NavigationHeader = ({ title, subtitle }: NavigationHeaderProps) => {
  const { signOut, profile, user } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Erro ao fazer logout",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso"
      });
    }
  };

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/analysis", label: "Análise", icon: BarChart3 },
    { path: "/analytics", label: "Analytics", icon: Database },
    { path: "/journey", label: "Jornada", icon: Map },
    { path: "/admin", label: "Admin", icon: Settings },
  ];

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'writer': return 'secondary';
      case 'reader': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'writer': return 'Editor';
      case 'reader': return 'Leitor';
      default: return role;
    }
  };

  return (
    <header className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              <Home className="h-5 w-5" />
              <span className="font-medium">JTBD Marketplace Explorer</span>
            </Link>
            <nav className="flex space-x-6">
              {navItems.slice(1).map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1 text-sm transition-colors ${
                      isActive 
                        ? "text-foreground font-medium" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Title/Subtitle if provided */}
            {(title || subtitle) && (
              <div className="text-right">
                {title && (
                  <div className="text-sm font-medium">{title}</div>
                )}
                {subtitle && (
                  <div className="text-xs text-muted-foreground">{subtitle}</div>
                )}
              </div>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.email}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.email}</p>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={getRoleBadgeVariant(profile?.role || '')}
                        className="text-xs"
                      >
                        {getRoleLabel(profile?.role || '')}
                      </Badge>
                      {profile?.org_name && (
                        <span className="text-xs text-muted-foreground">
                          {profile.org_name}
                        </span>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {profile?.role === 'admin' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/admin">
                        <Settings className="h-4 w-4 mr-2" />
                        JTBD Admin
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/users">
                        <Users className="h-4 w-4 mr-2" />
                        Gerenciar Usuários
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};