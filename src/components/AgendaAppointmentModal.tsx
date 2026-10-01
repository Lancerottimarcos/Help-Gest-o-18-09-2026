import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  FileText,
  Building2,
  Sparkles,
  Check,
  Search,
  Trash2,
} from 'lucide-react';
import { AgencyAppointment, AppointmentCategory, Client } from '../types';
import { CreateAppointmentInput } from '../services/googleCalendarService';

interface AgendaAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: CreateAppointmentInput, editingId?: string, googleEventId?: string) => Promise<boolean>;
  onDelete?: (appointment: AgencyAppointment) => void;
  editingAppointment: AgencyAppointment | null;
  clients: Client[];
  isGoogleConnected: boolean;
  initialDate?: string;
}

const CATEGORY_OPTIONS: Array<{ id: AppointmentCategory; label: string; color: string }> = [
  { id: 'briefing', label: 'Briefing & Onboarding', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' },
  { id: 'apresentacao', label: 'Apresentação de Métricas', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
  { id: 'trafego', label: 'Alinhamento de Tráfego Pago', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
  { id: 'design_web', label: 'Design & Desenvolvimento', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { id: 'comercial', label: 'Reunião Comercial / Proposta', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' },
  { id: 'sprint_interna', label: 'Sprint & Alinhamento Interno', color: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { id: 'outro', label: 'Outro Compromisso', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400' },
];

const PAUTA_PRESETS = [
  {
    name: 'Briefing',
    text: 'Pauta da Reunião de Briefing:\n1. Alinhamento de objetivos e KPIs prioritários\n2. Público-alvo, personas e tom de voz da marca\n3. Definição do cronograma inicial de entregas\n4. Próximos passos e responsáveis',
  },
  {
    name: 'Métricas',
    text: 'Apresentação de Resultados Mensais:\n1. Resumo executivo dos investimentos em mídia\n2. Desempenho de CPL, CPC e Taxa de Conversão\n3. Análise de criativos campeões do período\n4. Recomendações e plano de escala para o próximo mês',
  },
  {
    name: 'Sprint Interno',
    text: 'Sprint Planning da Agência:\n1. Revisão do quadro de demandas ativas no Kanban\n2. Prazos da semana e priorização de gargalos\n3. Distribuição de novas tarefas de design e tráfego\n4. Dúvidas da equipe',
  },
];

export const AgendaAppointmentModal: React.FC<AgendaAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingAppointment,
  clients,
  isGoogleConnected,
  initialDate,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<AppointmentCategory>('briefing');
  const [clientId, setClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('11:00');
  const [addGoogleMeet, setAddGoogleMeet] = useState(true);
  const [location, setLocation] = useState('');
  const [attendeeEmailInput, setAttendeeEmailInput] = useState('');
  const [attendeesList, setAttendeesList] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset or populate fields when modal opens or editingAppointment changes
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      if (editingAppointment) {
        setTitle(editingAppointment.title);
        setCategory(editingAppointment.category || 'briefing');
        setClientId(editingAppointment.clientId || '');
        const clientFound = clients.find((c) => c.id === editingAppointment.clientId);
        setClientSearch(clientFound ? clientFound.name : editingAppointment.clientName || '');
        setStartDate(editingAppointment.startDate);
        setStartTime(editingAppointment.startTime || '10:00');
        setEndDate(editingAppointment.endDate || editingAppointment.startDate);
        setEndTime(editingAppointment.endTime || '11:00');
        setAddGoogleMeet(Boolean(editingAppointment.meetLink || editingAppointment.location?.includes('Meet')));
        setLocation(editingAppointment.location || '');
        setAttendeesList(editingAppointment.attendees?.map((a) => a.email) || []);
        setDescription(editingAppointment.description || '');
      } else {
        const defaultDate = initialDate || new Date().toISOString().split('T')[0];
        setTitle('');
        setCategory('briefing');
        setClientId('');
        setClientSearch('');
        setStartDate(defaultDate);
        setStartTime('10:00');
        setEndDate(defaultDate);
        setEndTime('11:00');
        setAddGoogleMeet(true);
        setLocation('');
        setAttendeesList([]);
        setDescription('');
      }
    }
  }, [isOpen, editingAppointment, initialDate, clients]);

  if (!isOpen) return null;

  // Filter clients
  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.companyName?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleSelectClient = (client: Client) => {
    setClientId(client.id);
    setClientSearch(client.name);
    setIsClientDropdownOpen(false);

    // Auto-suggest meeting title if empty
    if (!title.trim()) {
      setTitle(`Reunião de Alinhamento • ${client.name}`);
    }

    // Auto-add client email to attendees if available
    if (client.email && !attendeesList.includes(client.email)) {
      setAttendeesList((prev) => [...prev, client.email!]);
    }
  };

  const handleAddAttendee = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = attendeeEmailInput.trim();
    if (clean && clean.includes('@') && !attendeesList.includes(clean)) {
      setAttendeesList((prev) => [...prev, clean]);
      setAttendeeEmailInput('');
    }
  };

  const handleRemoveAttendee = (emailToRemove: string) => {
    setAttendeesList((prev) => prev.filter((e) => e !== emailToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('Por favor, informe o título do compromisso.');
      return;
    }

    if (!startDate || !startTime || !endTime) {
      setErrorMessage('Por favor, defina a data e o intervalo de horários.');
      return;
    }

    setIsSaving(true);
    try {
      const selectedClient = clients.find((c) => c.id === clientId);

      const payload: CreateAppointmentInput = {
        title: title.trim(),
        category,
        clientId: clientId || undefined,
        clientName: selectedClient?.name || (clientSearch.trim() || undefined),
        description: description.trim(),
        startDate,
        startTime,
        endDate: endDate || startDate,
        endTime,
        addGoogleMeet,
        location: addGoogleMeet ? 'Google Meet' : (location.trim() || undefined),
        attendeesEmails: attendeesList,
      };

      const success = await onSave(
        payload,
        editingAppointment?.id,
        editingAppointment?.googleEventId
      );

      if (success) {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar compromisso na agenda.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#142142]/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 transform transition-all">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fab518]/15 text-[#142142] dark:text-[#fab518] flex items-center justify-center font-bold">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#142142] dark:text-white">
                {editingAppointment ? 'Editar Compromisso da Agenda' : 'Novo Agendamento Corporativo'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isGoogleConnected
                  ? 'Sincronizado em tempo real com o Google Calendar'
                  : 'Modo local (conecte o Google Calendar para sincronizar)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#142142] dark:text-white mb-1">
              Título do Compromisso <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião de Alinhamento de Tráfego • Apolar Imóveis"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-[#142142] dark:text-white focus:outline-none focus:border-[#fab518] font-lufga-regular"
            />
          </div>

          {/* Category & Client Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-[#142142] dark:text-white mb-1">
                Tipo / Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AppointmentCategory)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-[#142142] dark:text-white focus:outline-none focus:border-[#fab518]"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Client selector */}
            <div className="relative">
              <label className="block text-xs font-bold text-[#142142] dark:text-white mb-1 flex items-center justify-between">
                <span>Cliente da Agência</span>
                {clientId && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Selecionado
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={clientSearch}
                  onFocus={() => setIsClientDropdownOpen(true)}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setClientId('');
                    setIsClientDropdownOpen(true);
                  }}
                  placeholder="Buscar cliente cadastrado..."
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-[#142142] dark:text-white focus:outline-none focus:border-[#fab518]"
                />
                <Building2 size={14} className="absolute left-2.5 top-3 text-slate-400" />
              </div>

              {/* Client Dropdown */}
              {isClientDropdownOpen && (
                <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 space-y-1">
                  {filteredClients.length > 0 ? (
                    filteredClients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectClient(c)}
                        className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between group cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-[#142142] dark:text-white">{c.name}</div>
                          {c.companyName && (
                            <div className="text-[10px] text-slate-400">{c.companyName}</div>
                          )}
                        </div>
                        {clientId === c.id && <Check size={14} className="text-[#fab518]" />}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-slate-400 text-center">
                      Nenhum cliente encontrado com este nome
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setClientId('');
                      setIsClientDropdownOpen(false);
                    }}
                    className="w-full text-center py-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border-t border-slate-100 dark:border-slate-800 mt-1 cursor-pointer"
                  >
                    Fechar lista
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Dates & Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-[#142142] dark:text-white mb-1 flex items-center gap-1.5">
                <Calendar size={13} className="text-[#fab518]" />
                Data
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setEndDate(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-[#142142] dark:text-white focus:outline-none focus:border-[#fab518] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#142142] dark:text-white mb-1 flex items-center gap-1.5">
                <Clock size={13} className="text-[#fab518]" />
                Horário Inicial
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-[#142142] dark:text-white focus:outline-none focus:border-[#fab518] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#142142] dark:text-white mb-1 flex items-center gap-1.5">
                <Clock size={13} className="text-slate-400" />
                Horário Final
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-[#142142] dark:text-white focus:outline-none focus:border-[#fab518] font-mono"
              />
            </div>
          </div>

          {/* Google Meet & Location Options */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Video size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#142142] dark:text-white">
                    Videoconferência Google Meet
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Gera link oficial do Google Meet na criação do evento
                  </div>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={addGoogleMeet}
                  onChange={(e) => setAddGoogleMeet(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {!addGoogleMeet && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Local Presencial ou Plataforma Alternativa
                </label>
                <div className="relative">
                  <MapPin size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Sala de Reuniões 01 • Help Ideias Digitais"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-[#142142] dark:text-white focus:outline-none focus:border-[#fab518]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-xs font-bold text-[#142142] dark:text-white mb-1 flex items-center justify-between">
              <span>Convidados (E-mails):</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Receberão o convite no Google Calendar
              </span>
            </label>

            <div className="flex gap-2 mb-2">
              <input
                type="email"
                value={attendeeEmailInput}
                onChange={(e) => setAttendeeEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAttendee();
                  }
                }}
                placeholder="convidado@empresa.com.br"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-[#142142] dark:text-white focus:outline-none focus:border-[#fab518]"
              />
              <button
                type="button"
                onClick={() => handleAddAttendee()}
                className="px-3.5 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-[#142142] dark:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Adicionar
              </button>
            </div>

            {/* Attendees list pills */}
            {attendeesList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                {attendeesList.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveAttendee(email)}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description & Pauta */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#142142] dark:text-white flex items-center gap-1.5">
                <FileText size={13} className="text-[#fab518]" />
                Pauta & Observações
              </label>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 mr-1">Atalhos:</span>
                {PAUTA_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setDescription(p.text)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#fab518]/20 hover:text-[#142142] dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva os tópicos a serem abordados nesta reunião..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-[#142142] dark:text-white focus:outline-none focus:border-[#fab518] leading-relaxed resize-y font-lufga-regular"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5">
            <div>
              {editingAppointment && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDelete(editingAppointment);
                  }}
                  disabled={isSaving}
                  className="px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Excluir este compromisso"
                >
                  <Trash2 size={14} />
                  <span>Excluir Compromisso</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 text-xs font-bold text-[#142142] bg-[#fab518] hover:bg-[#e29f11] rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#142142] border-t-transparent rounded-full animate-spin" />
                    <span>Sincronizando com Google...</span>
                  </>
                ) : (
                  <>
                    <Calendar size={14} />
                    <span>{editingAppointment ? 'Salvar Alterações' : 'Confirmar e Agendar'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
