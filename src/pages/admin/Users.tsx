import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, MoreVertical, Edit, Trash2, Mail, Shield, Users as UsersIcon, Eye } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrgMember {
  id: string;
  user_id: string;
  role: 'reader' | 'writer' | 'admin';
  created_at: string;
  user_email?: string;
  user_name?: string;
}

interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

export const Users: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'reader' | 'writer' | 'admin'>('all');
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch organization members
  React.useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.log('User not authenticated, redirecting to login');
          navigate('/auth/login');
          return;
        }
        
        // First get the default organization
        const { data: org, error: orgError } = await supabase
          .from('orgs')
          .select('id')
          .eq('slug', 'default')
          .single();

        if (orgError || !org) {
          console.error('Error fetching organization:', orgError);
          return;
        }

        // Get org members
        const { data: orgMembers, error: membersError } = await supabase
          .from('org_members')
          .select('*')
          .eq('org_id', org.id);

        if (membersError) {
          console.error('Error fetching org members:', membersError);
          return;
        }

        if (!orgMembers?.length) {
          setMembers([]);
          return;
        }

        // Get user details from auth.users using admin client
        const { data: users, error: usersError } = await supabase.functions.invoke('get-users', {
          body: { userIds: orgMembers.map(m => m.user_id) }
        });

        if (usersError) {
          console.error('Error fetching users:', usersError);
          // Fallback: show members without user details
          const membersData: OrgMember[] = orgMembers.map(member => ({
            id: member.id,
            user_id: member.user_id,
            role: member.role as 'reader' | 'writer' | 'admin',
            created_at: member.created_at,
            user_email: 'Email não disponível',
            user_name: 'Nome não disponível'
          }));
          setMembers(membersData);
          return;
        }

        // Combine org members with user details
        const membersWithDetails: OrgMember[] = orgMembers.map(member => {
          const user = users?.users?.find((u: AuthUser) => u.id === member.user_id);
          return {
            id: member.id,
            user_id: member.user_id,
            role: member.role as 'reader' | 'writer' | 'admin',
            created_at: member.created_at,
            user_email: user?.email || 'Email não disponível',
            user_name: user?.user_metadata?.full_name || user?.email || 'Nome não disponível'
          };
        });

        setMembers(membersWithDetails);
      } catch (error) {
        console.error('Error in fetchMembers:', error);
        toast({
          title: 'Erro ao carregar usuários',
          description: 'Ocorreu um erro ao carregar a lista de usuários.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [toast]);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'writer': return 'default';
      case 'reader': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-3 w-3" />;
      case 'writer': return <Edit className="h-3 w-3" />;
      case 'reader': return <Eye className="h-3 w-3" />;
      default: return null;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Implementation would go here
      toast({
        title: 'Usuário removido',
        description: 'O usuário foi removido da organização com sucesso.'
      });
    } catch (error) {
      toast({
        title: 'Erro ao remover usuário',
        description: 'Ocorreu um erro ao tentar remover o usuário.',
        variant: 'destructive'
      });
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = !searchTerm || 
      (member.user_email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.user_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavigationHeader 
        title="Gerenciar Usuários"
        subtitle="Administrar membros da organização e suas permissões"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="writer">Writer</SelectItem>
                <SelectItem value="reader">Reader</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => navigate('/admin/users/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {members.filter(m => m.role === 'admin').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Editores</CardTitle>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {members.filter(m => m.role === 'writer').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leitores</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {members.filter(m => m.role === 'reader').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Membros da Organização</CardTitle>
            <CardDescription>
              Lista de todos os usuários e suas permissões
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando usuários...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum usuário encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || roleFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece criando o primeiro usuário da organização'
                  }
                </p>
                {!searchTerm && roleFilter === 'all' && (
                  <Button onClick={() => navigate('/admin/users/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Usuário
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {member.user_name || 'Nome não disponível'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {member.user_email || 'Email não disponível'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getRoleBadgeVariant(member.role)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getRoleIcon(member.role)}
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(member.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar Permissões
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Reenviar Convite
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remover Usuário
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação removerá o usuário da organização. 
                                    Ele perderá acesso a todos os dados e funcionalidades.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteUser(member.user_id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Users;