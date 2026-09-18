import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, Mail, Sparkles, Check, Image as ImageIcon } from 'lucide-react';
import { TeamMember } from '../types';

interface ColaboradorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: TeamMember) => void;
  memberToEdit?: TeamMember | null;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
];

const COMMON_ROLES = [
  'Diretor / Estrategista',
  'Diretora de Arte / UI Designer',
  'Gestor de Tráfego / Growth Hacker',
  'Redator & Copywriter',
  'Desenvolvedor Web',
  'Social Media Manager',
  'Videomaker / Motion Designer',
  'Atendimento & Customer Success',
];

const SUGGESTED_SPECIALTIES = [
  'Social Media',
  'Figma & UI',
  'Meta Ads',
  'Google Ads',
  'Copywriting',
  'React / Web',
  'Edição de Vídeo',
  'Branding',
  'Analytics & Pixel',
  'E-commerce',
];

export const ColaboradorModal: React.FC<ColaboradorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  memberToEdit,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'Disponível' | 'Ocupado' | 'Férias'>('Disponível');
  const [activeTasks, setActiveTasks] = useState(0);
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (memberToEdit) {
      setName(memberToEdit.name || '');
      setRole(memberToEdit.role || '');
      setEmail(memberToEdit.email || '');
      setStatus(memberToEdit.status || 'Disponível');
      setActiveTasks(memberToEdit.activeTasks || 0);
      setAvatar(memberToEdit.avatar || PRESET_AVATARS[0]);
      setSpecialties(memberToEdit.specialties || []);
      setCustomAvatarUrl(memberToEdit.avatar || '');
    } else {
      setName('');
      setRole('');
      setEmail('');
      setStatus('Disponível');
      setActiveTasks(0);
      const randomAvatar = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
      setAvatar(randomAvatar);
      setCustomAvatarUrl('');
      setSpecialties(['Social Media', 'Design']);
    }
  }, [memberToEdit, isOpen]);

  const handleAddTag = (tagToAdd?: string) => {
    const val = (tagToAdd || tagInput).trim();
    if (val && !specialties.includes(val)) {
      setSpecialties((prev) => [...prev, val]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSpecialties((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalAvatar = customAvatarUrl.trim() || avatar || PRESET_AVATARS[0];

    const finalMember: TeamMember = {
      id: memberToEdit ? memberToEdit.id : `tm-${Date.now()}`,
      name: name.trim(),
      role: role.trim() || 'Colaborador',
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@ideiasdigitais.com.br`,
      avatar: finalAvatar,
      activeTasks: Number(activeTasks) || 0,
      status,
      specialties: specialties.length > 0 ? specialties : ['Marketing Digital'],
    };

    onSave(finalMember);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="colaborador-modal-title"
        className="bg-white dark:bg-[#0f172a] rounded-[28px] max-w-xl w-full border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fab518]/20 flex items-center justify-center text-[#fab518] shrink-0">
              <User size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 id="colaborador-modal-title" className="text-base sm:text-lg font-black text-[#142142] dark:text-white">
                {memberToEdit ? 'Editar Colaborador' : 'Adicionar Novo Colaborador'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {memberToEdit ? 'Atualize os dados e competências do profissional' : 'Cadastre um novo membro para a equipe da agência'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Avatar selector & preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Foto de Perfil / Avatar
            </label>
            <div className="flex items-center gap-4 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <img
                src={customAvatarUrl.trim() || avatar?.trim() || PRESET_AVATARS[0]}
                alt="Avatar selecionado"
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#fab518] shrink-0 shadow-xs"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = PRESET_AVATARS[0];
                }}
              />
              <div className="flex-1 space-y-2">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                  Selecione um avatar rápido ou insira o link da foto:
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_AVATARS.slice(0, 6).map((pic, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAvatar(pic);
                        setCustomAvatarUrl('');
                      }}
                      className={`w-7 h-7 rounded-lg overflow-hidden transition-all ring-offset-1 dark:ring-offset-slate-900 cursor-pointer ${
                        (customAvatarUrl === '' && avatar === pic)
                          ? 'ring-2 ring-[#fab518] scale-110'
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <img src={pic} alt={`Opção ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <ImageIcon size={14} className="text-slate-400 shrink-0" />
              <input
                type="url"
                value={customAvatarUrl}
                onChange={(e) => setCustomAvatarUrl(e.target.value)}
                placeholder="Ou cole a URL de uma imagem personalizada..."
                className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:border-[#fab518]"
              />
            </div>
          </div>

          {/* Nome e Cargo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Nome Completo *
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Larissa Martins"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-[#fab518]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Cargo / Função *
              </label>
              <div className="relative">
                <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Ex: Social Media Designer"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-[#fab518]"
                />
              </div>
            </div>
          </div>

          {/* Cargo quick suggestions */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
              Sugestões rápidas de cargo:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_ROLES.slice(0, 5).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    role === r
                      ? 'bg-[#142142] text-white border-[#142142] dark:bg-[#fab518] dark:text-[#142142] dark:border-[#fab518]'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* E-mail e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                E-mail Profissional
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: nome@ideiasdigitais.com.br"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-[#fab518]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Disponibilidade
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-[#fab518]"
              >
                <option value="Disponível">Disponível</option>
                <option value="Ocupado">Ocupado</option>
                <option value="Férias">Férias</option>
              </select>
            </div>
          </div>

          {/* Demandas ativas */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Demandas em Andamento
            </label>
            <input
              type="number"
              min={0}
              max={99}
              value={activeTasks}
              onChange={(e) => setActiveTasks(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-[#fab518]"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Quantidade de tarefas atribuídas a este colaborador atualmente no Kanban.
            </p>
          </div>

          {/* Especialidades */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Especialidades & Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Digite e pressione Enter (ex: Reels, Google Ads)..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-[#fab518]"
              />
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                + Adicionar
              </button>
            </div>

            {/* Selected Tags */}
            <div className="flex flex-wrap gap-1.5 mb-2.5 min-h-[32px] p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
              {specialties.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Nenhuma especialidade selecionada</span>
              ) : (
                specialties.map((spec) => (
                  <span
                    key={spec}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#fab518]/20 text-[#142142] dark:text-[#fab518]"
                  >
                    <span>{spec}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(spec)}
                      className="hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remover"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1">
              {SUGGESTED_SPECIALTIES.map((item) => {
                const isSelected = specialties.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        handleRemoveTag(item);
                      } else {
                        handleAddTag(item);
                      }
                    }}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#fab518] hover:bg-[#fab518]/90 text-[#142142] font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Check size={16} className="stroke-[3]" />
              <span>{memberToEdit ? 'Salvar Alterações' : 'Cadastrar Colaborador'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
