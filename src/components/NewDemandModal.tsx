import React, { useState } from 'react';
import { X, Plus, Calendar, User, Tag, Sparkles, UploadCloud } from 'lucide-react';
import { Client, DemandItem, KanbanColumnId, Priority, DemandAttachment, TeamMember, KanbanColumn } from '../types';
import { initialTeamMembers } from '../data/mockData';
import { FileUploadDropzone } from './FileUploadDropzone';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomPrioritySelect } from './CustomPrioritySelect';
import { detectAndSanitizeInput } from '../utils/securityProtocols';

interface NewDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDemand: (demand: DemandItem) => void;
  clients: Client[];
  teamMembers?: TeamMember[];
  columns?: KanbanColumn[];
  initialData?: {
    title?: string;
    client?: string;
    dueDate?: string;
    description?: string;
  } | null;
}

export const NewDemandModal: React.FC<NewDemandModalProps> = ({
  isOpen,
  onClose,
  onAddDemand,
  clients,
  teamMembers = initialTeamMembers,
  columns,
  initialData,
}) => {
  const activeMembersList = teamMembers && teamMembers.length > 0 ? teamMembers : initialTeamMembers;

  const [title, setTitle] = useState(initialData?.title || '');
  const [selectedClient, setSelectedClient] = useState(initialData?.client || clients[0]?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');

  // Sync selected client if clients list updates or initialData changes
  React.useEffect(() => {
    if (initialData) {
      if (initialData.title) setTitle(initialData.title);
      if (initialData.client) setSelectedClient(initialData.client);
      if (initialData.description) setDescription(initialData.description);
      if (initialData.dueDate) setDueDate(initialData.dueDate);
    }
  }, [initialData]);

  React.useEffect(() => {
    if (clients.length > 0 && !selectedClient && !initialData?.client) {
      setSelectedClient(clients[0].name);
    }
  }, [clients, selectedClient, initialData]);
  const [type, setType] = useState('Post');
  const [category, setCategory] = useState<'Social Media' | 'Tráfego Pago' | 'Criação de Sites' | 'Design Geral'>('Social Media');
  const [priority, setPriority] = useState<Priority>('media');
  const [columnId, setColumnId] = useState<KanbanColumnId>(columns?.[0]?.id || 'ideias');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '2026-09-20');
  const [assigneeName, setAssigneeName] = useState(activeMembersList[0]?.name || 'Beatriz Lima');
  const [attachments, setAttachments] = useState<DemandAttachment[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const sanitizedTitle = detectAndSanitizeInput(title, 'Nova Demanda - Título').sanitized;
    const sanitizedDesc = description.trim() ? detectAndSanitizeInput(description, 'Nova Demanda - Descrição').sanitized : undefined;

    const assignedMember = activeMembersList.find((m) => m.name === assigneeName) || activeMembersList[0];

    const priorityBarsMap: Record<Priority, number> = {
      baixa: 1,
      media: 2,
      alta: 3,
      urgente: 3,
    };

    const firstImageAttachment = attachments.find((a) => {
      if (a.type === 'image') return true;
      if (typeof a.url === 'string' && (a.url.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(a.url))) return true;
      if (typeof a.name === 'string' && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(a.name)) return true;
      return false;
    });

    const newDemand: DemandItem = {
      id: `DEM-${Math.floor(100 + Math.random() * 900)}`,
      title: sanitizedTitle,
      client: selectedClient,
      clientProject: selectedClient,
      description: sanitizedDesc,
      type,
      serviceCategory: category,
      columnId,
      priority,
      priorityBars: priorityBarsMap[priority],
      dueDate,
      assignee: {
        name: assignedMember.name,
        avatar: assignedMember.avatar,
      },
      statusLabel: columnId === 'ideias' ? 'Briefing Inicial' : columnId === 'aprovacao' ? 'Aguardando Cliente' : 'Em Produção',
      approvalStatus: columnId === 'aprovacao' ? 'pendente' : undefined,
      clientPortalToken: columnId === 'aprovacao' ? `dem-${Math.floor(100 + Math.random() * 900)}` : undefined,
      whatsappNotified: false,
      checklistTotal: 4,
      checklistCompleted: 0,
      commentsCount: 0,
      thumbnail: firstImageAttachment ? firstImageAttachment.url : undefined,
      attachmentsCount: attachments.length,
      attachments: attachments,
    };

    onAddDemand(newDemand);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#142142]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-[28px] p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#fab518] text-[#142142] flex items-center justify-center font-bold shadow-xs">
              <Plus size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#142142] dark:text-white">Criar Nova Demanda</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Adicione ao fluxo de produção da agência</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#142142] dark:text-white mb-1">
              Título da Demanda *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Post Carrossel 5 Dicas de Moda / Setup Campanha Meta"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-slate-100 p-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#142142] dark:text-white mb-1">
              Cliente *
            </label>
            {clients && clients.length > 0 ? (
              <select
                required
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-xs sm:text-sm font-semibold text-[#142142] dark:text-slate-100 p-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none transition-colors"
              >
                <option value="" disabled>Selecione um cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                placeholder="Ex: Nome da Empresa ou Cliente..."
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-xs sm:text-sm font-semibold text-[#142142] dark:text-slate-100 p-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none transition-colors"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#142142] dark:text-white mb-1">
              Descrição da Demanda
            </label>
            <textarea
              rows={3}
              placeholder="Descreva o escopo, orientações, briefing ou detalhes da demanda..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-xs sm:text-sm text-[#142142] dark:text-slate-100 p-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none resize-none placeholder:text-slate-400 font-medium transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#142142] dark:text-white mb-1">Tipo de Peça</label>
              <select
                value={type}
                onChange={(e) => {
                  const val = e.target.value;
                  setType(val);
                  if (val === 'Meta Ads') {
                    setCategory('Tráfego Pago');
                  } else if (val === 'Des. de Site') {
                    setCategory('Criação de Sites');
                  } else if (val === 'Logotipo') {
                    setCategory('Design Geral');
                  } else if (val === 'Post') {
                    setCategory('Social Media');
                  } else {
                    setCategory('Social Media');
                  }
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
                id="new-demand-priority"
                label="Prioridade"
                value={priority}
                onChange={setPriority}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#142142] dark:text-white mb-1">Etapa Inicial</label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value as KanbanColumnId)}
                className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-xs font-semibold text-[#142142] dark:text-slate-100 p-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none transition-colors"
              >
                {(columns && columns.length > 0 ? columns : [
                  { id: 'ideias', title: 'Ideias' },
                  { id: 'producao', title: 'Em Produção' },
                  { id: 'aprovacao', title: 'Aprovação' },
                  { id: 'agendamento', title: 'Agendamento' },
                  { id: 'concluidas', title: 'Concluídas' },
                ]).map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#142142] dark:text-white mb-1">Responsável</label>
              <select
                value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)}
                className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-xs font-semibold text-[#142142] dark:text-slate-100 p-2.5 rounded-xl border border-transparent focus:border-[#fab518] focus:outline-none transition-colors"
              >
                {activeMembersList.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.role.split('/')[0]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <CustomDatePicker
                id="new-demand-due-date"
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

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-[#fab518] text-[#142142] font-black text-xs hover:bg-[#fab518]/90 cursor-pointer shadow-xs transition-transform active:scale-95"
            >
              Criar Demanda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
