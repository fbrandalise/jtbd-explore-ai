import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, UserPlus, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  email: z.string().email('E-mail inválido'),
  name: z.string().optional(),
  permissions: z.object({
    read: z.boolean(),
    write: z.boolean(),
    admin: z.boolean()
  }).refine(
    (permissions) => permissions.read || permissions.write || permissions.admin,
    { message: 'Selecione pelo menos uma permissão' }
  ),
  orgSlug: z.string().min(1, 'Organização é obrigatória')
});

type FormData = z.infer<typeof formSchema>;

const resolveRole = (permissions: { read: boolean; write: boolean; admin: boolean }): 'reader' | 'writer' | 'admin' => {
  if (permissions.admin) return 'admin';
  if (permissions.write) return 'writer';
  return 'reader';
};

export const NewUser: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      name: '',
      permissions: {
        read: false,
        write: false,
        admin: false
      },
      orgSlug: 'default'
    }
  });

  const watchPermissions = form.watch('permissions');

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const role = resolveRole({
        read: data.permissions.read || false,
        write: data.permissions.write || false,
        admin: data.permissions.admin || false
      });
      
      const { data: result, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: data.email,
          name: data.name || undefined,
          role,
          orgSlug: data.orgSlug
        }
      });

      if (error) throw error;

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: 'Usuário criado com sucesso',
        description: `${data.email} foi ${result.user.status === 'invited' ? 'convidado' : 'adicionado'} como ${role} da organização.`
      });

      navigate('/admin/users');
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Erro ao criar usuário',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-adjust permissions based on admin toggle
  const handleAdminChange = (checked: boolean) => {
    form.setValue('permissions.admin', checked);
    if (checked) {
      form.setValue('permissions.read', false);
      form.setValue('permissions.write', false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavigationHeader 
        title="Novo Usuário"
        subtitle="Criar e convidar novos usuários para a organização"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/users')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Usuários
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Criar Novo Usuário
              </CardTitle>
              <CardDescription>
                Convide um novo usuário para sua organização e defina suas permissões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Informações Básicas</h3>
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="usuario@exemplo.com"
                              type="email"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            O usuário receberá um convite neste e-mail
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nome do usuário (opcional)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="orgSlug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organização</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a organização" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="default">Organização Padrão</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Permissions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Permissões</h3>
                    
                    <FormField
                      control={form.control}
                      name="permissions"
                      render={() => (
                        <FormItem>
                          <div className="space-y-4">
                            {/* Admin Permission */}
                            <FormField
                              control={form.control}
                              name="permissions.admin"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={handleAdminChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-medium">
                                      Admin
                                    </FormLabel>
                                    <FormDescription>
                                      Acesso total, incluindo gerenciamento de usuários e configurações
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />

                            {!watchPermissions.admin && (
                              <>
                                {/* Write Permission */}
                                <FormField
                                  control={form.control}
                                  name="permissions.write"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel className="font-medium">
                                          Escrita
                                        </FormLabel>
                                        <FormDescription>
                                          Pode criar, editar e excluir conteúdo (inclui permissão de leitura)
                                        </FormDescription>
                                      </div>
                                    </FormItem>
                                  )}
                                />

                                {/* Read Permission */}
                                <FormField
                                  control={form.control}
                                  name="permissions.read"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value || watchPermissions.write}
                                          onCheckedChange={field.onChange}
                                          disabled={watchPermissions.write}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel className="font-medium">
                                          Leitura
                                        </FormLabel>
                                        <FormDescription>
                                          Pode visualizar e navegar pelo conteúdo
                                        </FormDescription>
                                      </div>
                                    </FormItem>
                                  )}
                                />
                              </>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Permission Summary */}
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Papel resultante:</strong>{' '}
                        {watchPermissions.admin 
                          ? 'Admin (acesso total)'
                          : watchPermissions.write 
                            ? 'Writer (escrita + leitura)'
                            : watchPermissions.read
                              ? 'Reader (apenas leitura)'
                              : 'Nenhuma permissão selecionada'
                        }
                      </AlertDescription>
                    </Alert>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? 'Criando...' : 'Criar Usuário'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/admin/users')}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewUser;