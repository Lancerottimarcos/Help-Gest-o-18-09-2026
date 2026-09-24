import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, 
  Trash2, 
  Save, 
  UploadCloud, 
  ClipboardList, 
  CheckSquare, 
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { DemandItem, KanbanColumnId, Priority, Client, DemandAttachment, KanbanColumn, TeamMember } from '../types';
import { kanbanColumnsData, initialTeamMembers } from '../data/mockData';
import { FileUploadDropzone } from './FileUploadDropzone';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomPrioritySelect } from './CustomPrioritySelect';
import { CustomClientSelect } from './CustomClientSelect';

interface DemandDetailModalProps {
  demand: DemandItem;
  clients?: Client[];
  teamMembers?: TeamMember[];
  columns?: KanbanColumn[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedDemand: DemandItem) => void;
  onDelete?: (demandId: string) => void;
  onOpenWhatsAppNotification?: (demand: DemandItem) => void;
  onOpenClientApprovalPortal?: (demand: DemandItem) => void;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface DemandComment {
  id: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
}

export const DemandDetailModal: React.FC<DemandDetailModalProps> = ({
  demand,
  clients = [],
  teamMembers = initialTeamMembers,
  columns,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const activeTeamMembers = teamMembers && teamMembers.length > 0 ? teamMembers : initialTeamMembers;

  const normalizePieceType = (rawType?: string): string => {
    if (!rawType) return 'Post';
    const lower = rawType.toLowerCase().trim();
    if (lower.includes('post') || lower.includes('carrossel')) return 'Post';
    if (lower.includes('meta') || lower.includes('tráfego') || lower.includes('trafego') || lower.includes('anúncio') || lower.includes('anuncio')) return 'Meta Ads';
    if (lower.includes('site') || lower.includes('landing') || lower.includes('des.')) return 'Des. de Site';
    if (lower.includes('logo') || lower.includes('marca') || lower.includes('identidade')) return 'Logotipo';
    return rawType;
  };

  const sortedClients = useMemo(() => {
    return (clients || []).slice().sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base', numeric: true })
    );
  }, [clients]);

  const [title, setTitle] = useState(demand?.title || '');
  const [selectedClientId, setSelectedClientId] = useState(() => {
    if (demand?.clientId) return demand.clientId;
    const match = (clients || []).find((c) =>
      demand?.client && (
        c.name.trim().toLowerCase() === demand.client.trim().toLowerCase() ||
        (c.companyName && c.companyName.trim().toLowerCase() === demand.client.trim().toLowerCase())
      )
    );
    return match?.id || '';
  });
  const [client, setClient] = useState(() => {
    const match = (clients || []).find((c) =>
      (demand?.clientId && c.id === demand.clientId) ||
      (demand?.client && (
        c.name.trim().toLowerCase() === demand.client.trim().toLowerCase() ||
        (c.companyName && c.companyName.trim().toLowerCase() === demand.client.trim().toLowerCase())
      ))
    );
    return match ? match.name : (demand?.client || '');
  });
  const [description, setDescription] = useState(demand?.description || '');
  const [type, setType] = useState(normalizePieceType(demand?.type));
  const [serviceCategory, setServiceCategory] = useState(demand?.serviceCategory || 'Social Media');
  const [columnId, setColumnId] = useState<KanbanColumnId>(demand?.columnId || 'ideias');
  const [priority, setPriority] = useState<Priority>(demand?.priority || 'media');
  const [dueDate, setDueDate] = useState(demand?.dueDate || '');
  const [assigneeName, setAssigneeName] = useState(demand?.assignee?.name || activeTeamMembers[0]?.name || 'Beatriz Lima');
  const [assigneeAvatar, setAssigneeAvatar] = useState(demand?.assignee?.avatar || '');

  // Resolve dynamically avatar for the selected assignee
  const resolvedAssigneeAvatar = useMemo(() => {
    if (!assigneeName) return '';
    const cleanName = assigneeName.trim().toLowerCase();
    const firstName = cleanName.split(' ')[0];
    const matched = activeTeamMembers.find((m) => {
      const mName = (m.name || '').trim().toLowerCase();
      const mFirst = mName.split(' ')[0];
      const mUser = (m.username || '').trim().toLowerCase();
      return mName === cleanName || mFirst === firstName || (mUser && mUser === cleanName);
    });
    if (matched?.avatar) {
      return matched.avatar;
    }
    return assigneeAvatar || '';
  }, [assigneeName, activeTeamMembers, assigneeAvatar]);

  // Attachments state
  const [attachments, setAttachments] = useState<DemandAttachment[]>(
    demand?.attachments || (demand?.thumbnail ? [
      {
        id: 'att-initial-1',
        name: `${(demand.title || 'preview').replace(/\s+/g, '_').toLowerCase()}_preview.jpg`,
        size: 1.4 * 1024 * 1024,
        type: 'image',
        url: demand.thumbnail,
        uploadedAt: 'Criado com a demanda'
      }
    ] : [])
  );

  const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'comments'>('details');

  // Interactive Checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 'chk-1', text: 'Receber briefing e direcionamento criativo', completed: true },
    { id: 'chk-2', text: 'Desenvolvimento e revisão da arte / copywriting', completed: ((demand?.checklistCompleted) || 0) >= 2 },
    { id: 'chk-3', text: 'Aprovação interna com a equipe da agência', completed: ((demand?.checklistCompleted) || 0) >= 3 },
    { id: 'chk-4', text: 'Validação final com o cliente', completed: ((demand?.checklistCompleted) || 0) >= 4 },
  ]);
  const [newChecklistText, setNewChecklistText] = useState('');

  // Interactive Comments/Notes
  const [comments, setComments] = useState<DemandComment[]>([
    {
      id: 'comm-1',
      authorName: demand?.assignee?.name || 'Equipe',
      authorAvatar: demand?.assignee?.avatar || '',
      text: `Demanda vinculada ao projeto ${demand?.clientProject || demand?.client || 'Geral'}. Prazo estipulado para ${demand?.dueDate || 'a definir'}.`,
      createdAt: 'Hoje às 09:30',
    },
  ]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const currentDemandIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (demand && demand.id !== currentDemandIdRef.current) {
      currentDemandIdRef.current = demand.id;
      setTitle(demand.title);
      const match = (clients || []).find((c) =>
        (demand.clientId && c.id === demand.clientId) ||
        (demand.client && (
          c.name.trim().toLowerCase() === demand.client.trim().toLowerCase() ||
          (c.companyName && c.companyName.trim().toLowerCase() === demand.client.trim().toLowerCase())
        ))
      );
      if (match) {
        setSelectedClientId(match.id);
        setClient(match.name);
      } else {
        setSelectedClientId(demand.clientId || '');
        setClient(demand.client || '');
      }

      setDescription(demand.description || '');
      setType(normalizePieceType(demand.type));
      setServiceCategory(demand.serviceCategory || 'Social Media');
      setColumnId(demand.columnId || 'ideias');
      setPriority(demand.priority || 'media');
      setDueDate(demand.dueDate || '');
      setAssigneeName(demand.assignee?.name || activeTeamMembers[0]?.name || 'Beatriz Lima');
      setAssigneeAvatar(demand.assignee?.avatar || '');

      setAttachments(
        demand.attachments || (demand.thumbnail ? [
          {
            id: 'att-initial-1',
            name: `${(demand.title || 'preview').replace(/\s+/g, '_').toLowerCase()}_preview.jpg`,
            size: 1.4 * 1024 * 1024,
            type: 'image',
            url: demand.thumbnail,
            uploadedAt: 'Criado com a demanda'
          }
        ] : [])
      );
    }
  }, [demand, clients, activeTeamMembers]);

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      text: newChecklistText.trim(),
      completed: false,
    };
    setChecklist((prev) => [...prev, newItem]);
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: DemandComment = {
      id: `comm-${Date.now()}`,
      authorName: 'Você (Gestor)',
      text: newCommentText.trim(),
      createdAt: 'Agora mesmo',
    };

    setComments((prev) => [newComment, ...prev]);
    setNewCommentText('');
  };

  // Save handler
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const priorityBarsMap: Record<Priority, number> = {
      baixa: 1,
      media: 2,
      alta: 3,
      urgente: 3,
    };

    const completedCount = checklist.filter((i) => i.completed).length;

    const firstImageAttachment = attachments.find((a) => {
      if (a.type === 'image') return true;
      if (typeof a.url === 'string' && (a.url.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(a.url))) return true;
      if (typeof a.name === 'string' && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(a.name)) return true;
      return false;
    });
    const effectiveThumbnail = firstImageAttachment ? (firstImageAttachment.thumbnailUrl || firstImageAttachment.url) : undefined;

    const chosenClient = (clients || []).find((c) =>
      (selectedClientId && c.id === selectedClientId) ||
      c.name.trim().toLowerCase() === client.trim().toLowerCase() ||
      (c.companyName && c.companyName.trim().toLowerCase() === client.trim().toLowerCase())
    );

    const resolvedClientName = chosenClient ? chosenClient.name : client.trim();
    const resolvedClientId = chosenClient ? chosenClient.id : (selectedClientId || demand.clientId);

    const updatedDemand: DemandItem = {
      ...demand,
      title: title.trim() || demand.title,
      client: resolvedClientName,
      clientId: resolvedClientId || undefined,
      clientProject: resolvedClientName,
      description: description.trim() || undefined,
      type,
      serviceCategory,
      columnId,
      priority,
      priorityBars: priorityBarsMap[priority],
      dueDate,
      statusLabel: demand.statusLabel,
      thumbnail: effectiveThumbnail,
      assignee: {
        name: assigneeName,
        avatar: resolvedAssigneeAvatar || assigneeAvatar,
      },
      checklistTotal: checklist.length,
      checklistCompleted: completedCount,
      commentsCount: comments.length,
      attachmentsCount: attachments.length,
      attachments: attachments,
    };

    onSave(updatedDemand);
    setIsSavedToast(true);
    setTimeout(() => {
      setIsSavedToast(false);
      onClose();
    }, 400);
  };

  const completedChecklistCount = checklist.filter((i) => i.completed).length;

  if (!isOpen || !demand) return null;

  return (
    <div 
      className="fixed inset-0 bg-[#142142]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        id="demand-detail-modal-card"
        className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-[28px] p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header matching NewDemandModal */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-full bg-[#fab518] text-[#142142] flex items-center justify-center font-bold shadow-xs shrink-0">
              <ClipboardList size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-extrabold text-[#142142] dark:text-white truncate">
                {title.trim() ? title : 'Editar Demanda'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atualize os detalhes no fluxo de produção da agência
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer shrink-0 ml-2"
            title="Fechar janela"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Título da Demanda */}
          <div>
            <label htmlFor="demand-title-input" className="block text-xs font-bold text-[#142142] dark:text-white mb-1">
              Título da Demanda *
            </label>
            <input
              id="demand-title-input"
              type="text"
              required
              placeholder="Ex: Post Carrossel 5 Dicas de Moda / Setup Campanha Meta"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-slate-100 p-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none transition-colors"
            />
          </div>

          {/* Cliente */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="demand-client-native-select" className="block text-xs font-bold text-[#142142] dark:text-white">
                Cliente <span className="text-[#fab518] font-black">*</span>
              </label>
              {sortedClients.length > 0 && (
                <span className="text-[10px] font-semibold text-slate-400">
                  {sortedClients.length} {sortedClients.length === 1 ? 'cadastrado' : 'cadastrados'}
                </span>
              )}
            </div>

            <select
              id="demand-client-native-select"
              required
              value={client}
              onChange={(e) => {
                const val = e.target.value;
                setClient(val);
                const found = (clients || []).find((c) => c.name === val || c.companyName === val);
                if (found) setSelectedClientId(found.id);
              }}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            >
              <option value="" disabled>Selecione um cliente...</option>
              {sortedClients.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}{c.companyName && c.companyName !== c.name ? ` (${c.companyName})` : ''}
                </option>
              ))}
            </select>

            {sortedClients && sortedClients.length > 0 ? (
              <CustomClientSelect
                clients={sortedClients}
                value={client}
                onChange={(val) => {
                  setClient(val);
                  const found = (clients || []).find((c) => c.name === val || c.companyName === val);
                  if (found) setSelectedClientId(found.id);
                }}
              />
            ) : (
              <input
                type="text"
                required
                placeholder="Ex: Nome da Empresa ou Cliente..."
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-xs sm:text-sm font-semibold text-[#142142] dark:text-slate-100 p-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none transition-colors"
              />
            )}
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="demand-description-textarea" className="block text-xs font-bold text-[#142142] dark:text-white mb-1">
              Descrição da Demanda
            </label>
            <textarea
              id="demand-description-textarea"
              rows={3}
              placeholder="Descreva o escopo, orientações, briefing ou detalhes da demanda..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-xs sm:text-sm text-[#142142] dark:text-slate-100 p-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none resize-none placeholder:text-slate-400 font-medium transition-colors"
            />
          </div>

          {/* Row: Tipo de Peça | Prioridade | Etapa Kanban */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="demand-type-select" className="block text-xs font-bold text-[#142142] dark:text-white mb-1">Tipo de Peça</label>
              <select
                id="demand-type-select"
                value={type}
                onChange={(e) => {
                  const val = e.target.value;
                  setType(val);
                  if (val === 'Meta Ads') setServiceCategory('Tráfego Pago');
                  else if (val === 'Des. de Site') setServiceCategory('Criação de Sites');
                  else if (val === 'Logotipo') setServiceCategory('Design Geral');
                  else if (val === 'Post') setServiceCategory('Social Media');
                  else setServiceCategory('Social Media');
                }}
                className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-xs font-semibold text-[#142142] dark:text-slate-100 p-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none transition-colors cursor-pointer"
              >
                <option value="Post">Post</option>
                <option value="Meta Ads">Meta Ads</option>
                <option value="Des. de Site">Des. de Site</option>
                <option value="Logotipo">Logotipo</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <CustomPrioritySelect
                id="demand-detail-priority"
                label="Prioridade"
                value={priority}
                onChange={setPriority}
              />
            </div>

            <div>
              <label htmlFor="demand-kanban-step" className="block text-xs font-bold text-[#142142] dark:text-white mb-1">Etapa Kanban</label>
              <select
                id="demand-kanban-step"
                value={columnId}
                onChange={(e) => setColumnId(e.target.value as KanbanColumnId)}
                className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-xs font-semibold text-[#142142] dark:text-slate-100 p-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none transition-colors"
              >
                {(columns && columns.length > 0 ? columns : kanbanColumnsData).map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: Responsável | Prazo de Entrega */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="demand-assignee-select" className="block text-xs font-bold text-[#142142] dark:text-white mb-1">Responsável</label>
              <select
                id="demand-assignee-select"
                value={assigneeName}
                onChange={(e) => {
                  const name = e.target.value;
                  setAssigneeName(name);
                  const clean = name.trim().toLowerCase();
                  const first = clean.split(' ')[0];
                  const matched = activeTeamMembers.find((m) => {
                    const mName = (m.name || '').trim().toLowerCase();
                    const mFirst = mName.split(' ')[0];
                    const mUser = (m.username || '').trim().toLowerCase();
                    return mName === clean || mFirst === first || (mUser && mUser === clean);
                  });
                  if (matched?.avatar) {
                    setAssigneeAvatar(matched.avatar);
                  } else if (matched) {
                    setAssigneeAvatar('');
                  }
                }}
                className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-xs font-semibold text-[#142142] dark:text-slate-100 p-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none transition-colors"
              >
                {activeTeamMembers.map((m) => {
                  const roleLabel = m.functionRole || (m.role ? m.role.split('/')[0].trim() : 'Colaborador');
                  return (
                    <option key={m.id} value={m.name}>
                      {m.name} ({roleLabel})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <CustomDatePicker
                id="demand-detail-due-date"
                label="Prazo de Entrega"
                value={dueDate}
                onChange={setDueDate}
                placeholder="Selecione o prazo..."
              />
            </div>
          </div>

          {/* File, Image and Video attachments up to 200MB */}
          <div className="pt-1">
            <label className="block text-xs font-bold text-[#142142] dark:text-white mb-1.5 flex items-center gap-1.5">
              <UploadCloud size={15} className="text-[#fab518]" />
              <span>Arquivos, Imagens ou Vídeos (até 200MB)</span>
            </label>
            <FileUploadDropzone
              attachments={attachments}
              onAddAttachment={(newAtt) => setAttachments((prev) => [newAtt, ...prev])}
              onRemoveAttachment={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
              maxSizeBytes={200 * 1024 * 1024}
            />
          </div>

          {/* Collapsible Sections for Checklist & Notes */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'checklist' ? 'details' : 'checklist')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'checklist'
                    ? 'bg-[#fab518] text-[#142142] shadow-xs'
                    : 'bg-[#F2F2F2] dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <CheckSquare size={13} />
                <span>Checklist ({completedChecklistCount}/{checklist.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'comments' ? 'details' : 'comments')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'comments'
                    ? 'bg-[#fab518] text-[#142142] shadow-xs'
                    : 'bg-[#F2F2F2] dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <MessageSquare size={13} />
                <span>Notas ({comments.length})</span>
              </button>
            </div>

            {/* Checklist Tab Content */}
            {activeTab === 'checklist' && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2 animate-in fade-in">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    placeholder="Adicionar tarefa ao checklist..."
                    className="flex-1 bg-white dark:bg-slate-800 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="px-3 py-1.5 bg-[#fab518] text-[#142142] text-xs font-bold rounded-lg cursor-pointer hover:bg-[#e29f11]"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {checklist.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg text-xs">
                      <label className="flex items-center gap-2 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleChecklist(item.id)}
                          className="w-3.5 h-3.5 text-[#fab518] rounded cursor-pointer"
                        />
                        <span className={item.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200 font-medium'}>
                          {item.text}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistItem(item.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Tab Content */}
            {activeTab === 'comments' && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2 animate-in fade-in">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Escreva uma observação interna..."
                    className="flex-1 bg-white dark:bg-slate-800 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddComment(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => handleAddComment(e)}
                    className="px-3 py-1.5 bg-[#fab518] text-[#142142] text-xs font-bold rounded-lg cursor-pointer hover:bg-[#e29f11]"
                  >
                    Publicar
                  </button>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {comments.map((comm) => (
                    <div key={comm.id} className="p-2 bg-white dark:bg-slate-800 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        <span>{comm.authorName}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{comm.createdAt}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-xs font-medium">{comm.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer matching NewDemandModal */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5">
            {onDelete ? (
              <button
                type="button"
                id="btn-trigger-delete-demand"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Excluir</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#fab518] hover:bg-[#e29f11] text-[#142142] text-xs font-black rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Save size={14} />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </form>

        {/* Success Toast */}
        {isSavedToast && (
          <div className="absolute top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} />
            <span>Demanda atualizada com sucesso!</span>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Demand Deletion */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          setIsDeleteModalOpen(false);
          if (onDelete) {
            onDelete(demand.id);
          }
          onClose();
        }}
        itemType="demanda"
        itemName={demand.title}
        description="Tem certeza que deseja excluir esta demanda? Todo o briefing, arquivos anexados, checklists e histórico de comentários serão removidos permanentemente."
      />
    </div>
  );
};
