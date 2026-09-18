import React, { useState, useRef, useEffect } from 'react';
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
  Eye,
  Maximize2,
  MessageCircle,
  XCircle,
  Edit3
} from 'lucide-react';
import { DemandItem, KanbanColumnId, Priority, Client, DemandAttachment, KanbanColumn } from '../types';
import { kanbanColumnsData } from '../data/mockData';
import { FileUploadDropzone } from './FileUploadDropzone';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface DemandDetailModalProps {
  demand: DemandItem;
  clients?: Client[];
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
  columns,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onOpenWhatsAppNotification,
  onOpenClientApprovalPortal,
}) => {
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
  const [title, setTitle] = useState(demand?.title || '');
  const [client, setClient] = useState(demand?.client || '');
  const [description, setDescription] = useState(demand?.description || '');
  const [type, setType] = useState(normalizePieceType(demand?.type));
  const [serviceCategory, setServiceCategory] = useState(demand?.serviceCategory || 'Social Media');
  const [columnId, setColumnId] = useState<KanbanColumnId>(demand?.columnId || 'ideias');
  const [priority, setPriority] = useState<Priority>(demand?.priority || 'media');
  const [dueDate, setDueDate] = useState(demand?.dueDate || '');
  const [assigneeName, setAssigneeName] = useState(demand?.assignee?.name || '');
  const [assigneeAvatar, setAssigneeAvatar] = useState(demand?.assignee?.avatar || '');

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

  // Active media preview selection & Lightbox viewer
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<DemandAttachment | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Keep state in sync when demand changes
  useEffect(() => {
    if (demand) {
      setTitle(demand.title);
      setClient(demand.client);
      setDescription(demand.description || '');
      setType(normalizePieceType(demand.type));
      setServiceCategory(demand.serviceCategory);
      setColumnId(demand.columnId);
      setPriority(demand.priority);
      setDueDate(demand.dueDate || '');
      setAssigneeName(demand.assignee?.name || '');
      setAssigneeAvatar(demand.assignee?.avatar || '');
      setAttachments(
        demand.attachments || (demand.thumbnail ? [
          {
            id: 'att-initial-1',
            name: `${demand.title.replace(/\s+/g, '_').toLowerCase()}_preview.jpg`,
            size: 1.4 * 1024 * 1024,
            type: 'image',
            url: demand.thumbnail,
            uploadedAt: 'Criado com a demanda'
          }
        ] : [])
      );
      setChecklist([
        { id: 'chk-1', text: 'Receber briefing e direcionamento criativo', completed: true },
        { id: 'chk-2', text: 'Desenvolvimento e revisão da arte / copywriting', completed: (demand.checklistCompleted || 0) >= 2 },
        { id: 'chk-3', text: 'Aprovação interna com a equipe da agência', completed: (demand.checklistCompleted || 0) >= 3 },
        { id: 'chk-4', text: 'Validação final com o cliente', completed: (demand.checklistCompleted || 0) >= 4 },
      ]);
    }
  }, [demand]);

  // Filter media attachments (images or videos)
  const mediaAttachments = attachments.filter((a) => a.type === 'image' || a.type === 'video');
  const currentMedia = (selectedMediaId ? mediaAttachments.find((m) => m.id === selectedMediaId) : null) || mediaAttachments[0] || null;

  // Direct media upload handler
  const handleDirectMediaUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 200 * 1024 * 1024) {
      alert(`O arquivo excede o limite máximo de 200MB.`);
      return;
    }
    let type: 'image' | 'video' | 'document' | 'other' = 'other';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else type = 'document';

    const objectUrl = URL.createObjectURL(file);
    const newAtt: DemandAttachment = {
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: file.name,
      size: file.size,
      type,
      url: objectUrl,
      uploadedAt: 'Agora mesmo',
    };
    setAttachments((prev) => [newAtt, ...prev]);
    setSelectedMediaId(newAtt.id);
  };

  // Remove media attachment
  const handleRemoveMedia = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    if (selectedMediaId === id) {
      setSelectedMediaId(null);
    }
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

    // Use the first image attachment as thumbnail if available, or keep existing
    const effectiveThumbnail = 
      attachments.find((a) => a.type === 'image')?.url 
      || demand.thumbnail;

    const updatedDemand: DemandItem = {
      ...demand,
      title: title.trim() || demand.title,
      client,
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
        avatar: assigneeAvatar,
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
        className="bg-white w-full max-w-4xl xl:max-w-5xl rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh] my-auto transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#142142] text-white px-5 sm:px-6 py-3.5 flex items-center justify-between gap-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
            {/* Icon: circle with background #fab518 and dark contrast icon */}
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-[#fab518] text-[#142142] flex items-center justify-center shrink-0 shadow-sm ring-2 ring-black/5 select-none">
              <ClipboardList className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-[#142142] stroke-[2.2]" />
            </div>

            {/* Title & Identification */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-black bg-[#fab518] text-[#142142] shadow-xs shrink-0">
                  #{demand.id.replace('dem-', '')}
                </span>
                <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight truncate leading-snug">
                  {title || demand.title}
                </h3>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="h-8.5 w-8.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 ring-1 ring-white/10"
              title="Fechar janela"
              aria-label="Fechar modal"
            >
              <X size={18} className="stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Quick Navigation Tabs */}
        <div className="bg-[#F8F9FA] px-5 sm:px-6 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1 py-2">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-[#142142] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#142142] hover:bg-slate-200/60'
              }`}
            >
              <Layers size={14} />
              <span>Informações da Demanda</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attachments')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'attachments'
                  ? 'bg-[#142142] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#142142] hover:bg-slate-200/60'
              }`}
            >
              <UploadCloud size={14} />
              <span>Arquivos & Vídeos (até 200MB)</span>
              <span className="bg-[#fab518] text-[#142142] text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {attachments.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('checklist')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'checklist'
                  ? 'bg-[#142142] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#142142] hover:bg-slate-200/60'
              }`}
            >
              <CheckSquare size={14} />
              <span>Checklist</span>
              <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {completedChecklistCount}/{checklist.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'comments'
                  ? 'bg-[#142142] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#142142] hover:bg-slate-200/60'
              }`}
            >
              <MessageSquare size={14} />
              <span>Notas & Atividades</span>
              <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {comments.length}
              </span>
            </button>
          </div>

          {/* Quick status progress pill */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500 shrink-0">
            <span>Progresso:</span>
            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#fab518] rounded-full transition-all"
                style={{ width: `${checklistPercentage}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-700 font-bold">{checklistPercentage}%</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div id="demand-detail-modal-body" className="p-4 sm:p-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200">
          {activeTab === 'details' && (
            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Interactive Client Approval Banner */}
              {(columnId === 'aprovacao' || demand.approvalStatus) && (
                <div className="p-3 sm:p-3.5 bg-linear-to-r from-amber-50/95 via-orange-50/90 to-amber-50/95 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#fab518]/20 border border-[#fab518]/40 flex items-center justify-center text-[#fab518] shrink-0">
                      <Sparkles size={18} className="text-amber-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">
                          Fluxo de Aprovação com Cliente
                        </span>
                        {demand.approvalStatus === 'aprovado' ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 size={11} className="text-emerald-600" />
                            Aprovado pelo Cliente
                          </span>
                        ) : demand.approvalStatus === 'alteracao_solicitada' ? (
                          <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Edit3 size={11} className="text-amber-700" />
                            Ajuste Solicitado
                          </span>
                        ) : demand.approvalStatus === 'reprovado' ? (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <XCircle size={11} className="text-rose-600" />
                            Reprovado pelo Cliente
                          </span>
                        ) : (
                          <span className="bg-amber-200/70 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md animate-pulse flex items-center gap-1">
                            <Clock size={11} className="text-amber-700" />
                            Aguardando Resposta do Cliente
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-amber-900/80 mt-0.5">
                        {demand.approvalFeedback
                          ? `Feedback: "${demand.approvalFeedback}"`
                          : 'Material pronto para validação externa pelo cliente no portal.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    {onOpenClientApprovalPortal && (
                      <button
                        type="button"
                        onClick={() => onOpenClientApprovalPortal(demand)}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-white hover:bg-slate-50 text-[#142142] border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        title="Abrir o Portal do Cliente exatamente como o cliente vê"
                      >
                        <ExternalLink size={12} />
                        <span>Portal do Cliente</span>
                      </button>
                    )}
                    {onOpenWhatsAppNotification && (
                      <button
                        type="button"
                        onClick={() => onOpenWhatsAppNotification(demand)}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        title="Enviar ou reenviar link por WhatsApp"
                      >
                        <MessageCircle size={13} />
                        <span>Notificar WhatsApp</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Bento Grid 2 Columns: Left Column (Form Fields) & Right Column (Visual Media Preview) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:gap-4.5 items-start">
                {/* Left Column (col-span-7) */}
                <div className="lg:col-span-7 space-y-3">
                  {/* Row 1: Title & Client */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-7">
                      <label className="block text-[11px] font-bold text-[#142142] mb-1">
                        Título da Demanda *
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Post Carrossel Lançamento Coleção"
                        className="w-full bg-[#F4F5F7] hover:bg-[#EBEDF0] focus:bg-white text-xs font-normal font-sofia-regular text-[#142142] px-3 py-2 rounded-xl border border-transparent focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/25 focus:outline-none transition-all"
                      />
                    </div>

                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-bold text-[#142142] mb-1">
                        Cliente Vinculado *
                      </label>
                      <select
                        value={client}
                        onChange={(e) => setClient(e.target.value)}
                        className="w-full bg-[#F4F5F7] hover:bg-[#EBEDF0] focus:bg-white text-xs font-normal font-sofia-regular text-[#142142] px-3 py-2 rounded-xl border border-transparent focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/25 focus:outline-none transition-all cursor-pointer"
                      >
                        {clients.length > 0 ? (
                          clients.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
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
                  </div>

                  {/* Row 2: Etapa Kanban, Prioridade, Prazo */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#142142] mb-1">
                        Etapa Kanban *
                      </label>
                      <select
                        value={columnId}
                        onChange={(e) => setColumnId(e.target.value as KanbanColumnId)}
                        className="w-full bg-[#F4F5F7] hover:bg-[#EBEDF0] focus:bg-white text-xs font-normal font-sofia-regular text-[#142142] px-2.5 py-2 rounded-xl border border-transparent focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/25 focus:outline-none transition-all cursor-pointer"
                      >
                        {(columns && columns.length > 0 ? columns : kanbanColumnsData).map((col) => (
                          <option key={col.id} value={col.id}>
                            {col.title}
                          </option>
                        ))}
                      </select>
                      {columnId === 'aprovacao' && (
                        <p className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
                          <MessageCircle size={11} className="text-[#25D366] shrink-0" />
                          <span>Dispara Portal & WhatsApp</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#142142] mb-1">
                        Prioridade *
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as Priority)}
                        className="w-full bg-[#F4F5F7] hover:bg-[#EBEDF0] focus:bg-white text-xs font-normal font-sofia-regular text-[#142142] px-2.5 py-2 rounded-xl border border-transparent focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/25 focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="baixa">Baixa (1 barra)</option>
                        <option value="media">Média (2 barras)</option>
                        <option value="alta">Alta (3 barras)</option>
                        <option value="urgente">Urgente (Crítico)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#142142] mb-1">
                        Data / Prazo
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-[#F4F5F7] hover:bg-[#EBEDF0] focus:bg-white text-xs font-normal font-sofia-regular text-[#142142] px-2.5 py-2 rounded-xl border border-transparent focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/25 focus:outline-none transition-all cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Row 3: Responsável na Equipe e Tipo de Peça */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#142142] mb-1">
                        Responsável na Equipe
                      </label>
                      <select
                        value={assigneeName}
                        onChange={(e) => {
                          const name = e.target.value;
                          setAssigneeName(name);
                          if (name.includes('Beatriz')) {
                            setAssigneeAvatar('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80');
                          } else if (name.includes('Lucas')) {
                            setAssigneeAvatar('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80');
                          } else if (name.includes('Matheus')) {
                            setAssigneeAvatar('https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80');
                          } else {
                            setAssigneeAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
                          }
                        }}
                        className="w-full bg-[#F4F5F7] hover:bg-[#EBEDF0] focus:bg-white text-xs font-normal font-sofia-regular text-[#142142] px-3 py-2 rounded-xl border border-transparent focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/25 focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="Beatriz Lima">Beatriz Lima (Design)</option>
                        <option value="Lucas Rocha">Lucas Rocha (Copywriting)</option>
                        <option value="Matheus Costa">Matheus Costa (Web Dev)</option>
                        <option value="Marcos Lancerotti">Marcos Lancerotti (Gestor)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#142142] mb-1">
                        Tipo de Peça
                      </label>
                      <select
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
                        className="w-full bg-[#F4F5F7] hover:bg-[#EBEDF0] focus:bg-white text-xs font-normal font-sofia-regular text-[#142142] px-3 py-2 rounded-xl border border-transparent focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/25 focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="Post">Post</option>
                        <option value="Meta Ads">Meta Ads</option>
                        <option value="Des. de Site">Des. de Site</option>
                        <option value="Logotipo">Logotipo</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 4: Descrição e Briefing */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#142142] mb-1">
                      Descrição e Briefing da Demanda
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descreva o escopo, orientações, briefing ou detalhes da demanda..."
                      className="w-full bg-[#F4F5F7] hover:bg-[#EBEDF0] focus:bg-white text-xs font-normal font-sofia-regular text-[#142142] px-3 py-2 rounded-xl border border-transparent focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/25 focus:outline-none resize-none placeholder:text-slate-400 leading-relaxed transition-all"
                    />
                  </div>
                </div>

                {/* Right Column (col-span-5): Imagem ou Vídeo Anexado */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#142142] flex items-center gap-1.5">
                      <ImageIcon size={13} className="text-[#fab518]" />
                      <span>Imagem ou Vídeo Anexado</span>
                      {mediaAttachments.length > 0 && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-[#142142]/10 text-[#142142]">
                          {mediaAttachments.length}
                        </span>
                      )}
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={mediaInputRef}
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => handleDirectMediaUpload(e.target.files)}
                      />
                      <button
                        type="button"
                        onClick={() => mediaInputRef.current?.click()}
                        className="text-[10.5px] font-bold text-[#142142] hover:text-[#fab518] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>{mediaAttachments.length > 0 ? 'Adicionar' : 'Anexar'}</span>
                      </button>
                      {mediaAttachments.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('attachments')}
                          className="text-[10.5px] font-semibold text-slate-500 hover:text-[#142142] transition-colors cursor-pointer"
                        >
                          • Ver todos
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Display Media Preview or Empty Drop Target */}
                  {currentMedia ? (
                    <div className="bg-[#F8F9FA] rounded-2xl border border-slate-200/90 p-2 space-y-2 flex-1 flex flex-col justify-between">
                      {/* Active Media Container */}
                      <div className="relative group rounded-xl overflow-hidden bg-slate-950 border border-slate-200/60 shadow-inner flex items-center justify-center h-44 sm:h-48">
                        {currentMedia.type === 'video' ? (
                          <video
                            src={currentMedia.url}
                            controls
                            className="w-full h-full object-contain bg-black rounded-xl"
                            poster={currentMedia.thumbnailUrl}
                          />
                        ) : (
                          <div 
                            className="relative w-full h-full flex items-center justify-center cursor-pointer group"
                            onClick={() => setLightboxMedia(currentMedia)}
                          >
                            {currentMedia.url?.trim() ? (
                              <img
                                src={currentMedia.url}
                                alt={currentMedia.name}
                                className="w-full h-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-[1.01]"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <ImageIcon size={32} />
                              </div>
                            )}
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl backdrop-blur-xs">
                              <span className="px-2.5 py-1 bg-white/95 hover:bg-white text-[#142142] text-[11px] font-bold rounded-lg shadow-md flex items-center gap-1.5 transition-all">
                                <Eye size={12} />
                                Tela Cheia
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 flex items-center gap-1 z-10 pointer-events-none">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#142142]/90 text-white shadow-xs backdrop-blur-xs flex items-center gap-1">
                            {currentMedia.type === 'video' ? <Film size={10} className="text-[#fab518]" /> : <ImageIcon size={10} className="text-[#fab518]" />}
                            {currentMedia.type === 'video' ? 'Vídeo' : 'Imagem'}
                          </span>
                        </div>

                        {/* Top Right Quick Actions */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                          <button
                            type="button"
                            onClick={() => setLightboxMedia(currentMedia)}
                            className="h-6 w-6 rounded-md bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                            title="Expandir visualização"
                          >
                            <Maximize2 size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(currentMedia.id)}
                            className="h-6 w-6 rounded-md bg-red-500/80 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                            title="Remover este arquivo"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Thumbnails strip if more than 1 media file */}
                      {mediaAttachments.length > 1 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-0.5">
                          {mediaAttachments.map((media) => {
                            const isSelected = media.id === currentMedia.id;
                            return (
                              <button
                                key={media.id}
                                type="button"
                                onClick={() => setSelectedMediaId(media.id)}
                                className={`relative h-10 w-12 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'border-[#fab518] ring-2 ring-[#fab518]/30 shadow-xs' 
                                    : 'border-slate-200 opacity-70 hover:opacity-100'
                                }`}
                              >
                                {media.type === 'video' ? (
                                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white">
                                    <Film size={13} className="text-[#fab518]" />
                                  </div>
                                ) : media.url?.trim() ? (
                                  <img
                                    src={media.url}
                                    alt={media.name}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <ImageIcon size={13} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Empty state / drop area when no image/video attached */
                    <div
                      onClick={() => mediaInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDirectMediaUpload(e.dataTransfer.files);
                      }}
                      className="group border-2 border-dashed border-slate-200 hover:border-[#fab518] bg-[#F4F5F7]/70 hover:bg-[#fab518]/5 rounded-2xl p-4 flex-1 flex flex-col items-center justify-center text-center transition-all cursor-pointer min-h-[140px]"
                    >
                      <div className="w-9 h-9 rounded-full bg-white group-hover:bg-[#fab518]/20 flex items-center justify-center text-slate-400 group-hover:text-[#142142] transition-all shadow-2xs mb-1.5">
                        <UploadCloud size={18} className="stroke-[2]" />
                      </div>
                      <p className="text-xs font-bold text-[#142142] group-hover:text-[#142142]">
                        Clique para anexar mídia
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        PNG, JPG, MP4, MOV (até 200MB)
                      </p>
                    </div>
                  )}
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
        <div className="bg-[#F8F9FA] px-5 sm:px-7 py-3 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div>
            {onDelete && (
              <button
                type="button"
                id="btn-trigger-delete-demand"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Excluir Demanda</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200/80 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-5 py-2.5 bg-[#fab518] hover:bg-[#e29f11] text-[#142142] rounded-xl text-xs font-black shadow-xs flex items-center gap-2 transition-transform active:scale-98 cursor-pointer"
            >
              <Save size={14} />
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

      {/* Lightbox / Zoom Modal for Attached Media */}
      {lightboxMedia && (
        <div 
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxMedia(null)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-[#142142] text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#fab518] text-[#142142]">
                  {lightboxMedia.type === 'video' ? 'Vídeo' : 'Imagem'}
                </span>
                <span className="text-xs font-bold truncate">{lightboxMedia.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxMedia(null)}
                className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Fechar prévia"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-2 sm:p-4 flex items-center justify-center bg-black/50 overflow-auto max-h-[calc(90vh-52px)]">
              {lightboxMedia.type === 'video' ? (
                <video 
                  src={lightboxMedia.url} 
                  controls 
                  autoPlay 
                  className="max-h-[78vh] max-w-full rounded-xl bg-black" 
                />
              ) : lightboxMedia.url?.trim() ? (
                <img 
                  src={lightboxMedia.url} 
                  alt={lightboxMedia.name} 
                  className="max-h-[78vh] max-w-full object-contain rounded-xl" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <div className="text-white text-sm">Mídia não disponível</div>
              )}
            </div>
          </div>
        </div>
      )}

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
