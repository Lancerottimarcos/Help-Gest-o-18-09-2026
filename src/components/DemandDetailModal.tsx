import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  User, 
  Building2, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  Paperclip, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Tag, 
  Layers, 
  Image as ImageIcon,
  ExternalLink,
  Send,
  AlertCircle,
  UploadCloud,
  ClipboardList,
  Film,
  Download,
  MessageCircle,
  XCircle,
  Edit3,
  Flag,
  CalendarDays,
  UserCheck,
  FolderGit2,
  FileText,
  Loader2
} from 'lucide-react';
import { DemandItem, KanbanColumnId, Priority, Client, DemandAttachment, KanbanColumn, TeamMember } from '../types';
import { kanbanColumnsData, initialTeamMembers } from '../data/mockData';
import { FileUploadDropzone } from './FileUploadDropzone';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomPrioritySelect } from './CustomPrioritySelect';
import { processAttachmentFile } from '../utils/fileUtils';

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
  authorAvatar: string;
  text: string;
  createdAt: string;
}

export const DemandDetailModal: React.FC<DemandDetailModalProps> = ({
  demand,
  clients = [],
  teamMembers = [],
  columns,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onOpenWhatsAppNotification,
  onOpenClientApprovalPortal,
}) => {
  // List of active team members (prefer props from Equipe page, fallback to localStorage if available, or initialTeamMembers)
  const activeTeamMembers = useMemo(() => {
    if (teamMembers && teamMembers.length > 0) {
      return teamMembers;
    }
    try {
      const saved = localStorage.getItem('agency_team_members');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return initialTeamMembers;
  }, [teamMembers]);

  // Helper to normalize piece types to the new standardized set
  const normalizePieceType = (val?: string): string => {
    if (!val) return 'Post';
    const lower = val.trim().toLowerCase();
    if (lower === 'post' || lower.includes('carrossel') || lower.includes('vídeo') || lower.includes('video') || lower.includes('reels') || lower.includes('feed')) {
      return 'Post';
    }
    if (lower === 'meta ads' || lower.includes('tráfego') || lower.includes('trafego') || lower.includes('ads')) {
      return 'Meta Ads';
    }
    if (lower === 'des. de site' || lower.includes('site') || lower.includes('landing') || lower.includes('web')) {
      return 'Des. de Site';
    }
    if (lower === 'logotipo' || lower.includes('logo') || lower.includes('identidade') || lower.includes('branding')) {
      return 'Logotipo';
    }
    if (lower === 'outros') {
      return 'Outros';
    }
    return val;
  };

  // Form states initialized safely with demand values
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
  const [assigneeName, setAssigneeName] = useState(demand?.assignee?.name || '');
  const [assigneeAvatar, setAssigneeAvatar] = useState(() => {
    const rawName = demand?.assignee?.name || '';
    const cleanName = rawName.trim().toLowerCase();
    const firstName = cleanName.split(' ')[0];
    const matched = activeTeamMembers.find((m) => {
      const mName = (m.name || '').trim().toLowerCase();
      const mFirst = mName.split(' ')[0];
      const mUser = (m.username || '').trim().toLowerCase();
      return mName === cleanName || mFirst === firstName || (mUser && mUser === cleanName);
    });
    return matched?.avatar || demand?.assignee?.avatar || '';
  });

  // Resolve dynamically the most up-to-date avatar for the selected assignee from activeTeamMembers
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

  // Attachments state (files, images, videos up to 200MB)
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

  // Active sub-tab inside the modal: Details, Arquivos, Checklist & Activity
  const [activeTab, setActiveTab] = useState<'details' | 'attachments' | 'checklist' | 'comments'>('details');

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

  // Active media upload state
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isMediaDragOver, setIsMediaDragOver] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const currentDemandIdRef = useRef<string | null>(null);

  // Keep state in sync when demand changes (keyed on demand.id to avoid clobbering user edits on re-render)
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
      setServiceCategory(demand.serviceCategory);
      setColumnId(demand.columnId);
      setPriority(demand.priority);
      setDueDate(demand.dueDate || '');
      const initialAssigneeName = demand.assignee?.name || '';
      setAssigneeName(initialAssigneeName);
      const cleanName = initialAssigneeName.trim().toLowerCase();
      const firstName = cleanName.split(' ')[0];
      const matchedMember = activeTeamMembers.find((m) => {
        const mName = (m.name || '').trim().toLowerCase();
        const mFirst = mName.split(' ')[0];
        const mUser = (m.username || '').trim().toLowerCase();
        return mName === cleanName || mFirst === firstName || (mUser && mUser === cleanName);
      });
      setAssigneeAvatar(matchedMember?.avatar || demand.assignee?.avatar || '');
      
      const initialAttachments = demand.attachments && demand.attachments.length > 0
        ? demand.attachments
        : (demand.thumbnail ? [
            {
              id: 'att-initial-1',
              name: `${demand.title.replace(/\s+/g, '_').toLowerCase()}_preview.jpg`,
              size: 1.4 * 1024 * 1024,
              type: 'image' as const,
              url: demand.thumbnail,
              uploadedAt: 'Criado com a demanda'
            }
          ] : []);

      setAttachments(initialAttachments);

      setChecklist([
        { id: 'chk-1', text: 'Receber briefing e direcionamento criativo', completed: true },
        { id: 'chk-2', text: 'Desenvolvimento e revisão da arte / copywriting', completed: (demand.checklistCompleted || 0) >= 2 },
        { id: 'chk-3', text: 'Aprovação interna com a equipe da agência', completed: (demand.checklistCompleted || 0) >= 3 },
        { id: 'chk-4', text: 'Validação final com o cliente', completed: (demand.checklistCompleted || 0) >= 4 },
      ]);
    }
  }, [demand?.id]);

  // Filter media attachments (images or videos)
  const mediaAttachments = attachments.filter((a) => a.type === 'image' || a.type === 'video');

  // Direct media upload handler with persistent Data URL and multi-file support
  const handleDirectMediaUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingMedia(true);
    try {
      const newItems: DemandAttachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 200 * 1024 * 1024) {
          alert(`O arquivo "${file.name}" excede o limite máximo de 200MB.`);
          continue;
        }
        const processed = await processAttachmentFile(file);
        newItems.push(processed);
      }

      if (newItems.length > 0) {
        setAttachments((prev) => [...newItems, ...prev]);
      }
    } catch (err) {
      console.error('Erro ao processar anexos:', err);
    } finally {
      setIsUploadingMedia(false);
      if (mediaInputRef.current) {
        mediaInputRef.current.value = '';
      }
    }
  };

  // Remove media attachment
  const handleRemoveMedia = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Download media attachment
  const handleDownloadMedia = (media: DemandAttachment) => {
    if (!media.url) return;
    const a = document.createElement('a');
    a.href = media.url;
    a.download = media.name || 'anexo';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Toggle checklist item
  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  // Add checklist item
  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      text: newChecklistText.trim(),
      completed: false,
    };
    setChecklist((prev) => [...prev, newItem]);
    setNewChecklistText('');
  };

  // Remove checklist item
  const handleRemoveChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  // Add comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const newComment: DemandComment = {
      id: `comm-${Date.now()}`,
      authorName: 'Marcos Lancerotti',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      text: newCommentText.trim(),
      createdAt: 'Agora mesmo',
    };
    setComments((prev) => [...prev, newComment]);
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

    // Use the first image attachment as thumbnail if available, or clear if all images were removed
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
    }, 600);
  };

  const completedChecklistCount = checklist.filter((i) => i.completed).length;
  const checklistPercentage = checklist.length > 0 
    ? Math.round((completedChecklistCount / checklist.length) * 100) 
    : 0;

  if (!isOpen || !demand) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#142142]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="demand-detail-modal-card"
        className="bg-white dark:bg-[#0f172a] w-full max-w-4xl xl:max-w-5xl rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] my-auto transition-all ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#142142] text-white px-5 sm:px-6 py-4 flex items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {/* Icon: refined badge */}
            <div className="h-10 w-10 rounded-xl bg-[#fab518] text-[#142142] flex items-center justify-center shrink-0 shadow-sm font-black select-none">
              <ClipboardList className="w-5 h-5 text-[#142142] stroke-[2.4]" />
            </div>

            {/* Title */}
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight truncate leading-snug">
                {title || demand.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
              title="Fechar janela"
              aria-label="Fechar modal"
            >
              <X size={18} className="stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div id="demand-detail-modal-body" className="p-4 sm:p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 space-y-4">
          {activeTab === 'details' && (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Form Container */}
              <div className="space-y-4">
                {/* Row 1: Título da Demanda */}
                <div>
                  <label htmlFor="demand-title-input" className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Título da Demanda <span className="text-amber-500 font-black">*</span>
                  </label>
                  <input
                    id="demand-title-input"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Campanha Mês do Consumidor - Promoção Especial"
                    className="w-full bg-slate-50/70 dark:bg-slate-800/80 hover:bg-slate-100/60 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/25 focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-normal shadow-2xs"
                  />
                </div>

                {/* Row 2: Cliente Vinculado & Tipo de Peça */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="demand-client-select" className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      Cliente Vinculado <span className="text-amber-500 font-black">*</span>
                    </label>
                    <select
                      id="demand-client-select"
                      value={selectedClientId || client}
                      onChange={(e) => {
                        const val = e.target.value;
                        const found = (clients || []).find((c) => c.id === val || c.name === val);
                        if (found) {
                          setSelectedClientId(found.id);
                          setClient(found.name);
                        } else {
                          setSelectedClientId('');
                          setClient(val);
                        }
                      }}
                      className="w-full bg-slate-50/70 dark:bg-slate-800/80 hover:bg-slate-100/60 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/25 focus:outline-none transition-all cursor-pointer shadow-2xs"
                    >
                      {/* Se o cliente da demanda não estiver cadastrado com o mesmo ID ou nome, preserva como opção atual */}
                      {client && !(clients || []).some((c) => c.id === selectedClientId || c.name.trim().toLowerCase() === client.trim().toLowerCase()) && (
                        <option value={client}>
                          {client} (Atual)
                        </option>
                      )}
                      {sortedClients.length > 0 ? (
                        sortedClients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}{c.companyName && c.companyName !== c.name ? ` (${c.companyName})` : ''}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="COLLAB RAM">COLLAB RAM</option>
                          <option value="Bella Moda Boutique">Bella Moda Boutique</option>
                          <option value="Sabor da Serra Restaurante">Sabor da Serra Restaurante</option>
                          <option value="Auto Mecânica Silva">Auto Mecânica Silva</option>
                          <option value="Dra. Camila Odontologia">Dra. Camila Odontologia</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="demand-type-select" className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      Tipo de Peça
                    </label>
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
                      className="w-full bg-slate-50/70 dark:bg-slate-800/80 hover:bg-slate-100/60 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/25 focus:outline-none transition-all cursor-pointer shadow-2xs"
                    >
                      <option value="Post">Post (Feed / Carrossel)</option>
                      <option value="Meta Ads">Meta Ads (Anúncio)</option>
                      <option value="Des. de Site">Des. de Site / Landing Page</option>
                      <option value="Logotipo">Logotipo & Identidade</option>
                      <option value="Vídeo / Reels">Vídeo / Reels</option>
                      <option value="Outros">Outros Formatos</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Etapa Kanban, Prioridade & Data / Prazo (Properly spaced) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="demand-kanban-step" className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      Etapa Kanban <span className="text-amber-500 font-black">*</span>
                    </label>
                    <select
                      id="demand-kanban-step"
                      value={columnId}
                      onChange={(e) => setColumnId(e.target.value as KanbanColumnId)}
                      className="w-full bg-slate-50/70 dark:bg-slate-800/80 hover:bg-slate-100/60 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/25 focus:outline-none transition-all cursor-pointer shadow-2xs"
                    >
                      {(columns && columns.length > 0 ? columns : kanbanColumnsData).map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <CustomPrioritySelect
                      id="demand-detail-priority"
                      label="Prioridade *"
                      value={priority}
                      onChange={setPriority}
                    />
                  </div>

                  <div>
                    <CustomDatePicker
                      id="demand-detail-due-date"
                      label="Data / Prazo"
                      value={dueDate}
                      onChange={setDueDate}
                      placeholder="Definir prazo..."
                    />
                  </div>
                </div>

                {/* Row 4: Responsável na Equipe with Visual Avatar */}
                <div>
                  <label htmlFor="demand-assignee-select" className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Responsável na Equipe
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 pointer-events-none flex items-center">
                      {resolvedAssigneeAvatar ? (
                        <img src={resolvedAssigneeAvatar} alt="" className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-[#142142] text-[#fab518] text-[9px] font-bold flex items-center justify-center">
                          {assigneeName.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
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
                      className="w-full bg-slate-50/70 dark:bg-slate-800/80 hover:bg-slate-100/60 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/25 focus:outline-none transition-all cursor-pointer shadow-2xs"
                    >
                      {activeTeamMembers.map((member) => {
                        const roleLabel = member.functionRole || (member.role ? member.role.split('/')[0].trim() : 'Colaborador');
                        return (
                          <option key={member.id} value={member.name}>
                            {member.name} ({roleLabel})
                          </option>
                        );
                      })}
                      {assigneeName && !activeTeamMembers.some((m) => m.name === assigneeName) && (
                        <option value={assigneeName}>
                          {assigneeName} (Responsável atual)
                        </option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Row 5: Descrição e Briefing da Demanda */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="demand-description-textarea" className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Descrição & Briefing da Demanda
                    </label>
                    <span className="text-[11px] text-slate-400 font-normal">Orientações de criação</span>
                  </div>
                  <textarea
                    id="demand-description-textarea"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o escopo, orientações, briefing ou detalhes da demanda..."
                    className="w-full bg-slate-50/70 dark:bg-slate-800/80 hover:bg-slate-100/60 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/25 focus:outline-none resize-none placeholder:text-slate-400 leading-relaxed transition-all shadow-2xs"
                  />
                </div>

                {/* Row 6: Anexos (Compacto conforme imagem de referência) */}
                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMediaDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMediaDragOver(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMediaDragOver(false);
                    handleDirectMediaUpload(e.dataTransfer.files);
                  }}
                  className={`pt-1 relative transition-all ${
                    isMediaDragOver ? 'ring-2 ring-[#fab518]/50 rounded-xl p-2 bg-amber-50/30 dark:bg-amber-950/20' : ''
                  }`}
                >
                  {/* Uploading indicator overlay */}
                  {isUploadingMedia && (
                    <div className="absolute inset-0 z-30 bg-white/90 dark:bg-slate-900/90 rounded-xl flex items-center justify-center gap-2 text-slate-800 dark:text-white backdrop-blur-xs p-2">
                      <Loader2 size={16} className="animate-spin text-[#fab518]" />
                      <span className="text-xs font-semibold">Anexando mídia...</span>
                    </div>
                  )}

                  {/* Header: "Anexos [3] +" matching reference image */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-slate-100">
                      Anexos
                    </span>
                    {mediaAttachments.length > 0 && (
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 min-w-[20px] text-center leading-none">
                        {mediaAttachments.length}
                      </span>
                    )}
                    <input
                      type="file"
                      ref={mediaInputRef}
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onClick={(e) => {
                        (e.target as HTMLInputElement).value = '';
                      }}
                      onChange={(e) => handleDirectMediaUpload(e.target.files)}
                    />
                    <button
                      type="button"
                      onClick={() => mediaInputRef.current?.click()}
                      className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                      title="Adicionar anexo"
                    >
                      <Plus size={16} className="stroke-[2.2]" />
                    </button>
                  </div>

                  {/* Row of Compact Thumbnails (square cards with subtle rounded corners and dashed '+' card) */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {mediaAttachments.map((media) => (
                      <div
                        key={media.id}
                        className="group relative w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-600"
                      >
                        {media.type === 'video' ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 bg-slate-900 text-white">
                            <Film size={18} className="text-[#fab518]" />
                            <span className="text-[8px] font-bold uppercase tracking-wider">Vídeo</span>
                          </div>
                        ) : media.url?.trim() ? (
                          <img
                            src={media.url}
                            alt={media.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ImageIcon size={18} />
                          </div>
                        )}

                        {/* Action buttons overlay on hover: Download and Remove */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-1 p-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadMedia(media);
                            }}
                            className="w-6 h-6 rounded-md bg-slate-900/90 hover:bg-[#fab518] hover:text-[#142142] text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                            title="Baixar anexo"
                          >
                            <Download size={11} className="stroke-[2.5]" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMedia(media.id);
                            }}
                            className="w-6 h-6 rounded-md bg-slate-900/90 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                            title="Remover anexo"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Dashed '+' Add Button Card (Exact style from reference screenshot) */}
                    <button
                      type="button"
                      onClick={() => mediaInputRef.current?.click()}
                      className="w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-500 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer shrink-0"
                      title="Adicionar outro anexo"
                    >
                      <Plus size={20} className="stroke-[2]" />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Dedicated Attachments Tab */}
          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#142142]">
                  Arquivos, Imagens e Vídeos da Demanda
                </h4>
                <p className="text-xs text-slate-500">
                  Faça o upload de artes prontas, gravações de reels, vídeos em alta qualidade, PSDs ou briefings com limite de até 200MB por arquivo.
                </p>
              </div>

              <FileUploadDropzone
                attachments={attachments}
                onAddAttachment={(newAtt) => setAttachments((prev) => [newAtt, ...prev])}
                onRemoveAttachment={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
                maxSizeBytes={200 * 1024 * 1024}
              />
            </div>
          )}

          {/* Checklist Tab */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#142142]">Etapas e Tarefas da Demanda</h4>
                  <p className="text-xs text-slate-500">Marque os passos concluídos para atualizar o status.</p>
                </div>
                <div className="text-xs font-extrabold text-[#142142] bg-[#F2F2F2] px-3 py-1 rounded-xl">
                  {completedChecklistCount} de {checklist.length} concluídos ({checklistPercentage}%)
                </div>
              </div>

              {/* Add checklist item */}
              <form onSubmit={handleAddChecklistItem} className="flex gap-2">
                <input
                  type="text"
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  placeholder="Adicionar novo item ao checklist..."
                  className="flex-1 bg-[#F2F2F2] text-xs font-normal font-sofia-regular text-[#142142] p-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newChecklistText.trim()}
                  className="px-4 py-2.5 bg-[#142142] hover:bg-[#142142]/90 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Adicionar</span>
                </button>
              </form>

              {/* Items List */}
              <div className="space-y-2 pt-1">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      item.completed 
                        ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-900' 
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <label className="flex items-center gap-3 flex-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleChecklist(item.id)}
                        className="w-4 h-4 rounded text-[#fab518] focus:ring-[#fab518] cursor-pointer"
                      />
                      <span className={`text-xs font-semibold ${item.completed ? 'line-through opacity-70' : ''}`}>
                        {item.text}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Excluir item"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments & Notes Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#142142]">Histórico de Notas & Observações</h4>
                <p className="text-xs text-slate-500">Mantenha feedbacks do cliente ou instruções da agência salvos nesta demanda.</p>
              </div>

              {/* New Comment Input */}
              <form onSubmit={handleAddComment} className="space-y-2 bg-[#F8F9FA] p-3 rounded-xl border border-slate-200">
                <textarea
                  rows={2}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Escreva uma observação interna, feedback do cliente ou link de arquivos..."
                  className="w-full bg-white text-xs font-normal font-sofia-regular text-[#142142] p-2.5 rounded-lg border border-slate-200 focus:border-[#fab518] focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="px-4 py-1.5 bg-[#fab518] hover:bg-[#e29f11] disabled:opacity-40 text-[#142142] text-xs font-black rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Send size={12} />
                    <span>Publicar Nota</span>
                  </button>
                </div>
              </form>

              {/* Comments Feed */}
              <div className="space-y-3 pt-2">
                {comments.map((comm) => (
                  <div key={comm.id} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {comm.authorAvatar?.trim() ? (
                          <img
                            src={comm.authorAvatar}
                            alt={comm.authorName}
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[#142142] text-[#fab518] text-[9px] font-bold flex items-center justify-center ring-1 ring-slate-200 shrink-0">
                            {comm.authorName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-bold text-[#142142]">{comm.authorName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{comm.createdAt}</span>
                    </div>
                    <p className="text-xs text-slate-600 pl-7 leading-relaxed font-medium">
                      {comm.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-900/90 px-5 sm:px-7 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div>
            {onDelete && (
              <button
                type="button"
                id="btn-trigger-delete-demand"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-3.5 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/60"
              >
                <Trash2 size={15} />
                <span>Excluir Demanda</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-5 py-2.5 bg-[#fab518] hover:bg-[#e29f11] active:bg-[#c98b0a] text-[#142142] rounded-xl text-xs font-black shadow-sm flex items-center gap-2 transition-all hover:shadow-md active:scale-98 cursor-pointer ring-2 ring-[#fab518]/20"
            >
              <Save size={15} className="stroke-[2.5]" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {isSavedToast && (
          <div className="absolute top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} />
            <span>Demanda atualizada com sucesso!</span>
          </div>
        )}
      </div>

      {/* Generic Confirmation Modal for Demand Deletion */}
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
