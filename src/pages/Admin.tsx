import React, { useState } from 'react';
import { Search, Plus, Save, X, FileDown, FileUp, Archive, Trash2, Edit, MoreVertical } from 'lucide-react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSupabaseJTBDAdmin } from '@/hooks/useSupabaseJTBDAdmin';
import { SupabaseBigJob, SupabaseLittleJob, SupabaseOutcome } from '@/types/supabase';
import { ChevronDown, ChevronRight } from 'lucide-react';

type EntityType = 'bigJob' | 'littleJob' | 'outcome';

interface TreeItemProps {
  type: EntityType;
  item: SupabaseBigJob | SupabaseLittleJob | SupabaseOutcome;
  level: number;
  onSelect: (type: EntityType, item: any) => void;
  onEdit: (type: EntityType, item: any) => void;
  onDelete: (type: EntityType, id: string) => void;
  onArchive: (type: EntityType, id: string) => void;
  selected?: boolean;
  parentIds?: { bigJobId?: string; littleJobId?: string };
}

const TreeItem: React.FC<TreeItemProps> = ({ 
  type, 
  item, 
  level, 
  onSelect, 
  onEdit, 
  onDelete, 
  onArchive, 
  selected,
  parentIds 
}) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = (type === 'bigJob' && 'littleJobs' in item && item.littleJobs.length > 0) ||
                     (type === 'littleJob' && 'outcomes' in item && item.outcomes.length > 0);

  const renderActions = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(type, item)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onArchive(type, item.id)}>
          <Archive className="h-4 w-4 mr-2" />
          {item.status === 'archived' ? 'Desarquivar' : 'Arquivar'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onDelete(type, item.id)}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div>
      <div 
        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors ${
          selected ? 'bg-accent' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(type, { ...item, ...parentIds })}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
        ) : (
          <div className="w-4" />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{item.name}</span>
            {item.status === 'archived' && (
              <Badge variant="secondary" className="text-xs">Arquivado</Badge>
            )}
            {item && 'tags' in item && item.tags && item.tags.length > 0 && (
              <div className="flex gap-1">
                {item.tags.slice(0, 2).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
                {item.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">+{item.tags.length - 2}</Badge>
                )}
              </div>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {type === 'bigJob' && item && 'littleJobs' in item && (
            <Badge variant="secondary" className="text-xs">
              {item.littleJobs.length} Little Jobs
            </Badge>
          )}
          {type === 'littleJob' && item && 'outcomes' in item && (
            <Badge variant="secondary" className="text-xs">
              {item.outcomes.length} Outcomes
            </Badge>
          )}
          {renderActions()}
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {type === 'bigJob' && 'littleJobs' in item && item.littleJobs.map(littleJob => (
            <TreeItem
              key={littleJob.id}
              type="littleJob"
              item={littleJob}
              level={level + 1}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onArchive={onArchive}
              parentIds={{ bigJobId: item.id }}
            />
          ))}
          {type === 'littleJob' && 'outcomes' in item && item.outcomes.map(outcome => (
            <TreeItem
              key={outcome.id}
              type="outcome"
              item={outcome}
              level={level + 1}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onArchive={onArchive}
              parentIds={parentIds}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface EntityFormProps {
  type: EntityType;
  entity?: SupabaseBigJob | SupabaseLittleJob | SupabaseOutcome;
  onSave: (data: any) => void;
  onCancel: () => void;
  generateSlug: (name: string) => string;
  isSubmitting?: boolean;
}

const EntityForm: React.FC<EntityFormProps> = ({ type, entity, onSave, onCancel, generateSlug, isSubmitting }) => {
  const [formData, setFormData] = useState({
    id: entity?.id || '',
    name: entity?.name || '',
    description: entity?.description || '',
    tags: entity && 'tags' in entity ? entity.tags?.join(', ') || '' : ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      tags: type === 'outcome' ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined
    };
    
    if (!entity && !formData.id) {
      data.id = generateSlug(formData.name);
    }
    
    onSave(data);
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      id: !entity ? generateSlug(value) : prev.id
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder={`Nome do ${type === 'bigJob' ? 'Big Job' : type === 'littleJob' ? 'Little Job' : 'Outcome'}`}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="id">ID</Label>
        <Input
          id="id"
          value={formData.id}
          onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
          placeholder="ID único (será gerado automaticamente)"
          disabled={!!entity}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Descrição detalhada..."
          rows={3}
        />
      </div>
      
      {type === 'outcome' && (
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            placeholder="tag1, tag2, tag3"
          />
          <p className="text-xs text-muted-foreground">Separar tags com vírgulas</p>
        </div>
      )}
      
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : entity ? 'Atualizar' : 'Criar'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export const Admin: React.FC = () => {
  const {
    hierarchy,
    isLoading,
    isSubmitting,
    error,
    createBigJob,
    createLittleJob,
    createOutcome,
    updateBigJob,
    updateLittleJob,
    updateOutcome,
    deleteBigJob,
    archiveBigJob,
    generateSlug
  } = useSupabaseJTBDAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');

  const [selectedEntity, setSelectedEntity] = useState<{
    type: EntityType;
    item: any;
  } | null>(null);
  const [editingEntity, setEditingEntity] = useState<{
    type: EntityType;
    item: any;
  } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState<{
    type: EntityType;
    parentIds?: { bigJobId?: string; littleJobId?: string };
  } | null>(null);

  const handleSelect = (type: EntityType, item: any) => {
    setSelectedEntity({ type, item });
  };

  const handleEdit = (type: EntityType, item: any) => {
    setEditingEntity({ type, item });
  };

  const handleDelete = async (type: EntityType, id: string) => {
    if (type === 'bigJob') {
      await deleteBigJob(id);
    }
    // Add other delete operations as needed
  };

  const handleArchive = async (type: EntityType, id: string) => {
    if (type === 'bigJob') {
      await archiveBigJob(id);
    }
    // Add other archive operations as needed
  };

  const handleSave = async (data: any) => {
    if (editingEntity) {
      const { type, item } = editingEntity;
      if (type === 'bigJob') {
        const success = await updateBigJob(item.id, data);
        if (success) setEditingEntity(null);
      } else if (type === 'littleJob') {
        const success = await updateLittleJob(item.id, data);
        if (success) setEditingEntity(null);
      } else if (type === 'outcome') {
        const success = await updateOutcome(item.id, data);
        if (success) setEditingEntity(null);
      }
    } else if (showCreateDialog) {
      const { type, parentIds } = showCreateDialog;
      if (type === 'bigJob') {
        const success = await createBigJob(data);
        if (success) setShowCreateDialog(null);
      } else if (type === 'littleJob' && parentIds?.bigJobId) {
        const success = await createLittleJob({ ...data, bigJobSlug: parentIds.bigJobId });
        if (success) setShowCreateDialog(null);
      } else if (type === 'outcome' && parentIds?.littleJobId) {
        const success = await createOutcome({ ...data, littleJobSlug: parentIds.littleJobId });
        if (success) setShowCreateDialog(null);
      }
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export not yet implemented');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Implement import functionality  
    console.log('Import not yet implemented');
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavigationHeader 
        title="Administração JTBD"
        subtitle="Gerenciar estrutura hierárquica"
      />
      
      <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col p-4">
        {isLoading && (
          <div className="text-center py-8">
            <Badge variant="secondary">
              Carregando...
            </Badge>
          </div>
        )}
        {error && (
          <div className="text-center py-8">
            <Badge variant="destructive">
              Erro: {error}
            </Badge>
          </div>
        )}
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="archived">Arquivados</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateDialog({ type: 'bigJob' })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Big Job
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleExport}>
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <FileUp className="h-4 w-4 mr-2" />
                  Import
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Tree */}
        <div className="w-80 border-r bg-card">
          <ScrollArea className="h-full p-4">
            {isLoading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : (
              <div className="space-y-1">
                {hierarchy?.bigJobs?.map(bigJob => (
                  <TreeItem
                    key={bigJob.id}
                    type="bigJob"
                    item={bigJob}
                    level={0}
                    onSelect={handleSelect}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onArchive={handleArchive}
                    selected={selectedEntity?.type === 'bigJob' && selectedEntity.item.id === bigJob.id}
                  />
                )) || []}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Main Panel */}
        <div className="flex-1 p-6 overflow-auto">
          {selectedEntity ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedEntity.item.name}
                        {selectedEntity.item.status === 'archived' && (
                          <Badge variant="secondary">Arquivado</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {selectedEntity.type === 'bigJob' && 'Big Job'}
                        {selectedEntity.type === 'littleJob' && 'Little Job'}
                        {selectedEntity.type === 'outcome' && 'Outcome'}
                        {' • ID: ' + selectedEntity.item.id}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(selectedEntity.type, selectedEntity.item)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedEntity.item.description && (
                      <div>
                        <h4 className="font-medium mb-2">Descrição</h4>
                        <p className="text-sm text-muted-foreground">{selectedEntity.item.description}</p>
                      </div>
                    )}
                    
                    {selectedEntity.item && 'tags' in selectedEntity.item && selectedEntity.item.tags && selectedEntity.item.tags.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedEntity.item.tags.map((tag: string) => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {selectedEntity.type === 'bigJob' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCreateDialog({
                            type: 'littleJob',
                            parentIds: { bigJobId: selectedEntity.item.id }
                          })}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Little Job
                        </Button>
                      )}
                      
                      {selectedEntity.type === 'littleJob' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCreateDialog({
                            type: 'outcome',
                            parentIds: { 
                              bigJobId: selectedEntity.item.bigJobId,
                              littleJobId: selectedEntity.item.id 
                            }
                          })}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Outcome
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold text-muted-foreground">
                  Selecione um item na árvore para editar
                </h2>
                <Button
                  onClick={() => setShowCreateDialog({ type: 'bigJob' })}
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Primeiro Big Job
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <Dialog open={!!showCreateDialog} onOpenChange={() => setShowCreateDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Criar {showCreateDialog.type === 'bigJob' ? 'Big Job' : 
                      showCreateDialog.type === 'littleJob' ? 'Little Job' : 'Outcome'}
              </DialogTitle>
            </DialogHeader>
            <EntityForm
              type={showCreateDialog.type}
              onSave={handleSave}
              onCancel={() => setShowCreateDialog(null)}
              generateSlug={generateSlug}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog */}
      {editingEntity && (
        <Dialog open={!!editingEntity} onOpenChange={() => setEditingEntity(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Editar {editingEntity.type === 'bigJob' ? 'Big Job' : 
                       editingEntity.type === 'littleJob' ? 'Little Job' : 'Outcome'}
              </DialogTitle>
            </DialogHeader>
            <EntityForm
              type={editingEntity.type}
              entity={editingEntity.item}
              onSave={handleSave}
              onCancel={() => setEditingEntity(null)}
              generateSlug={generateSlug}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Admin;