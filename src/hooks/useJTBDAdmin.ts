import { useState, useCallback, useMemo } from 'react';
import { JTBDHierarchy, AdminBigJob, AdminLittleJob, AdminOutcome, AuditLog, ValidationError } from '@/types/admin';
import { mockResearchRounds } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

// Convert existing data to admin format
const convertToAdminFormat = (): JTBDHierarchy => {
  const baseData = mockResearchRounds[0]?.data?.bigJobs || [];
  return {
    bigJobs: baseData.map((bigJob, bigIndex) => ({
      id: bigJob.id,
      name: bigJob.name,
      description: bigJob.description,
      status: 'active' as const,
      orderIndex: bigIndex,
      littleJobs: bigJob.littleJobs.map((littleJob, littleIndex) => ({
        id: littleJob.id,
        name: littleJob.name,
        description: littleJob.description,
        status: 'active' as const,
        orderIndex: littleIndex,
        outcomes: littleJob.outcomes.map((outcome, outcomeIndex) => ({
          id: outcome.id,
          name: outcome.name,
          description: outcome.description,
          status: 'active' as const,
          orderIndex: outcomeIndex,
          tags: []
        }))
      }))
    }))
  };
};

export const useJTBDAdmin = () => {
  const [hierarchy, setHierarchy] = useState<JTBDHierarchy>(convertToAdminFormat);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');

  // Generate unique ID from name
  const generateId = useCallback((name: string, type: string): string => {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    return `${type}-${base}`;
  }, []);

  // Validate ID uniqueness
  const isIdUnique = useCallback((id: string, excludeId?: string): boolean => {
    const allIds: string[] = [];
    
    hierarchy.bigJobs.forEach(bigJob => {
      allIds.push(bigJob.id);
      bigJob.littleJobs.forEach(littleJob => {
        allIds.push(littleJob.id);
        littleJob.outcomes.forEach(outcome => {
          allIds.push(outcome.id);
        });
      });
    });

    return !allIds.some(existingId => existingId === id && existingId !== excludeId);
  }, [hierarchy]);

  // Validation
  const validateEntity = useCallback((entity: Partial<AdminBigJob | AdminLittleJob | AdminOutcome>, type: string): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!entity.name || entity.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Nome deve ter pelo menos 2 caracteres' });
    }

    if (entity.name && entity.name.length > 120) {
      errors.push({ field: 'name', message: 'Nome não pode exceder 120 caracteres' });
    }

    if (entity.description && entity.description.length > 500) {
      errors.push({ field: 'description', message: 'Descrição não pode exceder 500 caracteres' });
    }

    if (entity.id && entity.id !== '' && !isIdUnique(entity.id)) {
      errors.push({ field: 'id', message: 'Este ID já está em uso' });
    }

    return errors;
  }, [isIdUnique]);

  // Create audit log entry
  const createAuditLog = useCallback((action: AuditLog['action'], entityType: AuditLog['entityType'], entityId: string, entityName: string, changes: Record<string, any> = {}) => {
    const log: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action,
      entityType,
      entityId,
      entityName,
      changes
    };
    setAuditLogs(prev => [log, ...prev.slice(0, 49)]); // Keep last 50 logs
  }, []);

  // CRUD Operations
  const createBigJob = useCallback((data: Partial<AdminBigJob>): boolean => {
    const errors = validateEntity(data, 'bigJob');
    if (errors.length > 0) {
      toast({
        title: "Erro de validação",
        description: errors.map(e => e.message).join(', '),
        variant: "destructive"
      });
      return false;
    }

    const newBigJob: AdminBigJob = {
      id: data.id || generateId(data.name!, 'big'),
      name: data.name!,
      description: data.description || '',
      littleJobs: [],
      status: 'active',
      orderIndex: hierarchy.bigJobs.length
    };

    setHierarchy(prev => ({
      ...prev,
      bigJobs: [...prev.bigJobs, newBigJob]
    }));

    createAuditLog('create', 'bigJob', newBigJob.id, newBigJob.name);
    setUnsavedChanges(true);
    
    toast({
      title: "Big Job criado",
      description: `"${newBigJob.name}" foi criado com sucesso.`
    });

    return true;
  }, [hierarchy.bigJobs.length, generateId, validateEntity, createAuditLog]);

  const createLittleJob = useCallback((bigJobId: string, data: Partial<AdminLittleJob>): boolean => {
    const errors = validateEntity(data, 'littleJob');
    if (errors.length > 0) {
      toast({
        title: "Erro de validação",
        description: errors.map(e => e.message).join(', '),
        variant: "destructive"
      });
      return false;
    }

    const bigJob = hierarchy.bigJobs.find(bj => bj.id === bigJobId);
    if (!bigJob) return false;

    const newLittleJob: AdminLittleJob = {
      id: data.id || generateId(data.name!, 'little'),
      name: data.name!,
      description: data.description || '',
      outcomes: [],
      status: 'active',
      orderIndex: bigJob.littleJobs.length
    };

    setHierarchy(prev => ({
      ...prev,
      bigJobs: prev.bigJobs.map(bj => 
        bj.id === bigJobId 
          ? { ...bj, littleJobs: [...bj.littleJobs, newLittleJob] }
          : bj
      )
    }));

    createAuditLog('create', 'littleJob', newLittleJob.id, newLittleJob.name);
    setUnsavedChanges(true);
    
    toast({
      title: "Little Job criado",
      description: `"${newLittleJob.name}" foi criado com sucesso.`
    });

    return true;
  }, [hierarchy.bigJobs, generateId, validateEntity, createAuditLog]);

  const createOutcome = useCallback((bigJobId: string, littleJobId: string, data: Partial<AdminOutcome>): boolean => {
    const errors = validateEntity(data, 'outcome');
    if (errors.length > 0) {
      toast({
        title: "Erro de validação",
        description: errors.map(e => e.message).join(', '),
        variant: "destructive"
      });
      return false;
    }

    const bigJob = hierarchy.bigJobs.find(bj => bj.id === bigJobId);
    const littleJob = bigJob?.littleJobs.find(lj => lj.id === littleJobId);
    if (!bigJob || !littleJob) return false;

    const newOutcome: AdminOutcome = {
      id: data.id || generateId(data.name!, 'outcome'),
      name: data.name!,
      description: data.description || '',
      tags: data.tags || [],
      status: 'active',
      orderIndex: littleJob.outcomes.length
    };

    setHierarchy(prev => ({
      ...prev,
      bigJobs: prev.bigJobs.map(bj => 
        bj.id === bigJobId 
          ? {
              ...bj,
              littleJobs: bj.littleJobs.map(lj => 
                lj.id === littleJobId
                  ? { ...lj, outcomes: [...lj.outcomes, newOutcome] }
                  : lj
              )
            }
          : bj
      )
    }));

    createAuditLog('create', 'outcome', newOutcome.id, newOutcome.name);
    setUnsavedChanges(true);
    
    toast({
      title: "Outcome criado",
      description: `"${newOutcome.name}" foi criado com sucesso.`
    });

    return true;
  }, [hierarchy.bigJobs, generateId, validateEntity, createAuditLog]);

  // Update operations
  const updateBigJob = useCallback((id: string, data: Partial<AdminBigJob>): boolean => {
    const errors = validateEntity(data, 'bigJob');
    if (errors.length > 0) {
      toast({
        title: "Erro de validação",
        description: errors.map(e => e.message).join(', '),
        variant: "destructive"
      });
      return false;
    }

    setHierarchy(prev => ({
      ...prev,
      bigJobs: prev.bigJobs.map(bj => 
        bj.id === id ? { ...bj, ...data } : bj
      )
    }));

    createAuditLog('update', 'bigJob', id, data.name || '', data);
    setUnsavedChanges(true);
    return true;
  }, [validateEntity, createAuditLog]);

  const updateLittleJob = useCallback((bigJobId: string, id: string, data: Partial<AdminLittleJob>): boolean => {
    const errors = validateEntity(data, 'littleJob');
    if (errors.length > 0) {
      toast({
        title: "Erro de validação",
        description: errors.map(e => e.message).join(', '),
        variant: "destructive"
      });
      return false;
    }

    setHierarchy(prev => ({
      ...prev,
      bigJobs: prev.bigJobs.map(bj => 
        bj.id === bigJobId 
          ? {
              ...bj,
              littleJobs: bj.littleJobs.map(lj => 
                lj.id === id ? { ...lj, ...data } : lj
              )
            }
          : bj
      )
    }));

    createAuditLog('update', 'littleJob', id, data.name || '', data);
    setUnsavedChanges(true);
    return true;
  }, [validateEntity, createAuditLog]);

  const updateOutcome = useCallback((bigJobId: string, littleJobId: string, id: string, data: Partial<AdminOutcome>): boolean => {
    const errors = validateEntity(data, 'outcome');
    if (errors.length > 0) {
      toast({
        title: "Erro de validação",
        description: errors.map(e => e.message).join(', '),
        variant: "destructive"
      });
      return false;
    }

    setHierarchy(prev => ({
      ...prev,
      bigJobs: prev.bigJobs.map(bj => 
        bj.id === bigJobId 
          ? {
              ...bj,
              littleJobs: bj.littleJobs.map(lj => 
                lj.id === littleJobId
                  ? {
                      ...lj,
                      outcomes: lj.outcomes.map(o => 
                        o.id === id ? { ...o, ...data } : o
                      )
                    }
                  : lj
              )
            }
          : bj
      )
    }));

    createAuditLog('update', 'outcome', id, data.name || '', data);
    setUnsavedChanges(true);
    return true;
  }, [validateEntity, createAuditLog]);

  // Delete operations
  const deleteBigJob = useCallback((id: string): boolean => {
    const bigJob = hierarchy.bigJobs.find(bj => bj.id === id);
    if (!bigJob) return false;

    const totalOutcomes = bigJob.littleJobs.reduce((acc, lj) => acc + lj.outcomes.length, 0);
    
    setHierarchy(prev => ({
      ...prev,
      bigJobs: prev.bigJobs.filter(bj => bj.id !== id)
    }));

    createAuditLog('delete', 'bigJob', id, bigJob.name, { deletedOutcomes: totalOutcomes });
    setUnsavedChanges(true);
    
    toast({
      title: "Big Job excluído",
      description: `"${bigJob.name}" e ${totalOutcomes} outcomes foram excluídos.`,
      variant: "destructive"
    });

    return true;
  }, [hierarchy.bigJobs, createAuditLog]);

  // Archive operations
  const archiveEntity = useCallback((type: 'bigJob' | 'littleJob' | 'outcome', id: string, bigJobId?: string, littleJobId?: string): boolean => {
    if (type === 'bigJob') {
      return updateBigJob(id, { status: 'archived' });
    } else if (type === 'littleJob' && bigJobId) {
      return updateLittleJob(bigJobId, id, { status: 'archived' });
    } else if (type === 'outcome' && bigJobId && littleJobId) {
      return updateOutcome(bigJobId, littleJobId, id, { status: 'archived' });
    }
    return false;
  }, [updateBigJob, updateLittleJob, updateOutcome]);

  // Export/Import
  const exportHierarchy = useCallback((): string => {
    return JSON.stringify(hierarchy, null, 2);
  }, [hierarchy]);

  const importHierarchy = useCallback((jsonData: string): boolean => {
    try {
      const importedData = JSON.parse(jsonData) as JTBDHierarchy;
      setHierarchy(importedData);
      setUnsavedChanges(true);
      
      toast({
        title: "Dados importados",
        description: "A hierarquia foi importada com sucesso."
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Formato JSON inválido.",
        variant: "destructive"
      });
      return false;
    }
  }, []);

  // Filtered and searched data
  const filteredHierarchy = useMemo(() => {
    let filtered = hierarchy.bigJobs;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bj => bj.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(bj => {
        const matchesBigJob = bj.name.toLowerCase().includes(term) || 
                            bj.description?.toLowerCase().includes(term) ||
                            bj.id.toLowerCase().includes(term);
        
        const matchesLittleJob = bj.littleJobs.some(lj => 
          lj.name.toLowerCase().includes(term) ||
          lj.description?.toLowerCase().includes(term) ||
          lj.id.toLowerCase().includes(term)
        );

        const matchesOutcome = bj.littleJobs.some(lj => 
          lj.outcomes.some(o => 
            o.name.toLowerCase().includes(term) ||
            o.description?.toLowerCase().includes(term) ||
            o.id.toLowerCase().includes(term) ||
            o.tags?.some(tag => tag.toLowerCase().includes(term))
          )
        );

        return matchesBigJob || matchesLittleJob || matchesOutcome;
      });
    }

    return { bigJobs: filtered };
  }, [hierarchy, statusFilter, searchTerm]);

  const saveChanges = useCallback(() => {
    setUnsavedChanges(false);
    toast({
      title: "Alterações salvas",
      description: "Todas as alterações foram salvas com sucesso."
    });
  }, []);

  const discardChanges = useCallback(() => {
    setHierarchy(convertToAdminFormat());
    setUnsavedChanges(false);
    toast({
      title: "Alterações descartadas",
      description: "Todas as alterações foram descartadas."
    });
  }, []);

  return {
    hierarchy: filteredHierarchy,
    auditLogs,
    unsavedChanges,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    
    // CRUD operations
    createBigJob,
    createLittleJob,
    createOutcome,
    updateBigJob,
    updateLittleJob,
    updateOutcome,
    deleteBigJob,
    archiveEntity,
    
    // Utility functions
    generateId,
    isIdUnique,
    validateEntity,
    exportHierarchy,
    importHierarchy,
    saveChanges,
    discardChanges
  };
};