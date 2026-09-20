import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Briefcase, 
  Mail, 
  Sparkles, 
  Check, 
  Image as ImageIcon,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Target,
  Share2,
  Palette,
  Receipt,
  BadgeDollarSign,
  Code2,
  AlertCircle,
  RefreshCw,
  Crown,
  Copy,
  CheckCircle2,
  Shield
} from 'lucide-react';
import { TeamMember, TeamFunctionOption } from '../types';
import { isOwnerOrMarcos, updateMasterPassword } from '../utils/securityProtocols';

interface ColaboradorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: TeamMember) => void;
  memberToEdit?: TeamMember | null;
  isMarcosLancerotti?: boolean;
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

export interface RoleDefinition {
  id: TeamFunctionOption;
  label: TeamFunctionOption;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  badgeBg: string;
  suggestedTags: string[];
}

export const PREDEFINED_ROLES: RoleDefinition[] = [
  {
    id: 'CEO',
    label: 'CEO',
    icon: Crown,
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    description: 'Direção executiva, liderança estratégica da agência e decisões-chave.',
    suggestedTags: ['Direção Executiva', 'Liderança', 'Visão Estratégica', 'Gestão Geral', 'Tomada de Decisão', 'Cultura'],
  },
  {
    id: 'Gestor de tráfego',
    label: 'Gestor de tráfego',
    icon: Target,
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    description: 'Gestão de tráfego pago (Meta Ads, Google Ads) e conversão.',
    suggestedTags: ['Meta Ads', 'Google Ads', 'Tráfego Pago', 'Pixel & CAPI', 'Analytics & ROI'],
  },
  {
    id: 'Social media',
    label: 'Social media',
    icon: Share2,
    badgeBg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700',
    description: 'Gestão de redes sociais, cronogramas, copies e engajamento.',
    suggestedTags: ['Gestão de Redes', 'Pautas & Calendário', 'Reels & Stories', 'Copywriting', 'Engajamento'],
  },
  {
    id: 'Design',
    label: 'Design',
    icon: Palette,
    badgeBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700',
    description: 'Criação de identidades visuais, posts, criativos e interfaces.',
    suggestedTags: ['Social Media Design', 'Figma & UI', 'Identidade Visual', 'Criativos Publicitários', 'Photoshop'],
  },
  {
    id: 'Contador',
    label: 'Contador',
    icon: Receipt,
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    description: 'Emissão de notas fiscais, conciliação contábil e rotinas fiscais.',
    suggestedTags: ['Emissão de NF-e', 'Conciliação Bancária', 'Gestão Financeira', 'Impostos', 'Relatórios Fiscais'],
  },
  {
    id: 'Vendedor',
    label: 'Vendedor',
    icon: BadgeDollarSign,
    badgeBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    description: 'Prospecção comercial B2B, negociação e fechamento de contratos.',
    suggestedTags: ['Prospecção Ativa', 'Qualificação B2B', 'Fechamento de Vendas', 'Negociação', 'CRM & Follow-up'],
  },
  {
    id: 'Desenvolvedor web',
    label: 'Desenvolvedor web',
    icon: Code2,
    badgeBg: 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700',
    description: 'Desenvolvimento de sites, landing pages, sistemas e integrações.',
    suggestedTags: ['Landing Pages', 'React / TypeScript', 'Wordpress / Webflow', 'Integrações & APIs', 'Otimização SEO'],
  },
];

export const ColaboradorModal: React.FC<ColaboradorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  memberToEdit,
  isMarcosLancerotti = true,
}) => {
  const [name, setName] = useState('');
  const [selectedFunction, setSelectedFunction] = useState<TeamFunctionOption>('Gestor de tráfego');
  const [customRoleTitle, setCustomRoleTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'Disponível' | 'Ocupado' | 'Férias'>('Disponível');
  const [activeTasks, setActiveTasks] = useState(0);
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [formError, setFormError] = useState('');

  // Auto-generate username from name
  const generateUsernameFromName = (inputName: string) => {
    return inputName
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '.')
      .replace(/\.+/g, '.')
      .replace(/^\.|\.$/g, '');
  };

  const [copiedCredential, setCopiedCredential] = useState(false);

  const handleGeneratePassword = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newPass = `Help${randomNum}!`;
    setPassword(newPass);
    setShowPassword(true);
  };

  const isEditingOwner = Boolean(memberToEdit && isOwnerOrMarcos(memberToEdit));

  useEffect(() => {
    if (memberToEdit) {
      setName(memberToEdit.name || '');
      
      // Determine function role
      const matchedFunc = PREDEFINED_ROLES.find(
        (r) => r.id === memberToEdit.functionRole || r.id === memberToEdit.role
      );
      if (matchedFunc) {
        setSelectedFunction(matchedFunc.id);
        setCustomRoleTitle(memberToEdit.role !== matchedFunc.id ? memberToEdit.role : '');
      } else {
        setSelectedFunction('Gestor de tráfego');
        setCustomRoleTitle(memberToEdit.role || '');
      }

      const isMarcos = isOwnerOrMarcos(memberToEdit);
      const defaultUser = isMarcos ? 'lancerotti' : generateUsernameFromName(memberToEdit.name || '');
      const defaultPass = isMarcos ? '521Spide#*' : '123456';

      setUsername(memberToEdit.username || defaultUser);
      setPassword(memberToEdit.password || defaultPass);
      setEmail(memberToEdit.email || (isMarcos ? 'lancerottirmarcos@gmail.com' : ''));
      setStatus(memberToEdit.status || 'Disponível');
      setActiveTasks(memberToEdit.activeTasks || 0);
      setAvatar(memberToEdit.avatar || PRESET_AVATARS[0]);
      setSpecialties(memberToEdit.specialties || []);
      setCustomAvatarUrl(memberToEdit.avatar || '');
      setFormError('');
    } else {
      setName('');
      setSelectedFunction('Gestor de tráfego');
      setCustomRoleTitle('');
      setUsername('');
      setPassword('123456');
      setEmail('');
      setStatus('Disponível');
      setActiveTasks(0);
      const randomAvatar = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
      setAvatar(randomAvatar);
      setCustomAvatarUrl('');
      setSpecialties(['Meta Ads', 'Google Ads']);
      setFormError('');
    }
  }, [memberToEdit, isOpen]);

  // When function changes, offer matching default tags if list is small or empty
  const handleSelectFunction = (func: TeamFunctionOption) => {
    setSelectedFunction(func);
    const roleDef = PREDEFINED_ROLES.find((r) => r.id === func);
    if (roleDef && (!memberToEdit || specialties.length === 0)) {
      setSpecialties(roleDef.suggestedTags.slice(0, 3));
    }
  };

  const handleNameBlur = () => {
    if (!memberToEdit && name.trim() && !username.trim()) {
      const suggested = generateUsernameFromName(name);
      setUsername(suggested);
      if (!email.trim()) {
        setEmail(`${suggested}@ideiasdigitais.com.br`);
      }
    }
  };

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

  const handleCopyCredentials = () => {
    const textToCopy = `Usuário: ${username}\nSenha: ${password}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedCredential(true);
    setTimeout(() => setCopiedCredential(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!isMarcosLancerotti) {
      setFormError('Acesso negado: Somente o Marcos Lancerotti tem permissão para adicionar colaboradores.');
      return;
    }

    if (!name.trim()) {
      setFormError('Por favor, informe o nome completo do colaborador.');
      return;
    }

    const cleanUsername = (username.trim() || generateUsernameFromName(name)).replace(/^@/, '');
    if (!cleanUsername) {
      setFormError('Por favor, defina um usuário de acesso para login.');
      return;
    }

    const finalPassword = password.trim() || '123456';
    const finalRole = customRoleTitle.trim() || selectedFunction;
    const finalAvatar = customAvatarUrl.trim() || avatar || PRESET_AVATARS[0];
    const finalEmail = email.trim() || `${cleanUsername}@ideiasdigitais.com.br`;

    const finalMember: TeamMember = {
      id: memberToEdit ? memberToEdit.id : `tm-${Date.now()}`,
      name: name.trim(),
      role: finalRole,
      functionRole: selectedFunction,
      email: finalEmail,
      avatar: finalAvatar,
      activeTasks: Number(activeTasks) || 0,
      status,
      specialties: specialties.length > 0 ? specialties : [selectedFunction],
      username: cleanUsername,
      password: finalPassword,
      createdBy: memberToEdit?.createdBy || 'Marcos Lancerotti',
      createdAt: memberToEdit?.createdAt || new Date().toISOString(),
    };

    // Se o colaborador salvo for o Marcos Lancerotti, sincroniza com a Senha Mestra
    const isMarcos = (memberToEdit && isOwnerOrMarcos(memberToEdit)) || isOwnerOrMarcos(finalMember);
    if (isMarcos) {
      updateMasterPassword(finalPassword);
      try {
        localStorage.setItem('help_agency_master_user', cleanUsername);
      } catch {}
    }

    onSave(finalMember);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="colaborador-modal-title"
        className="bg-white dark:bg-[#0f172a] rounded-2xl max-w-2xl w-full border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header with Permission Status */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fab518]/20 flex items-center justify-center text-[#fab518] shrink-0">
              <User size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="colaborador-modal-title" className="text-base font-black text-[#142142] dark:text-white">
                  {memberToEdit ? 'Editar Colaborador' : 'Novo Colaborador'}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#142142] text-[#fab518] dark:bg-[#fab518]/20 dark:text-[#fab518]">
                  <ShieldCheck size={11} />
                  Marcos Lancerotti
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {memberToEdit 
                  ? 'Atualize dados, função e credenciais de acesso ao sistema' 
                  : 'Cadastre o profissional com função e credenciais de login'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Error Banner */}
        {formError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-semibold">
            <AlertCircle size={16} className="shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Section 1: Official Agency Roles including CEO */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="block text-xs font-black text-[#142142] dark:text-white uppercase tracking-wider">
                Função na Equipe *
              </label>
              <span className="text-[11px] font-medium text-slate-400">
                Selecione a função oficial na agência
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {PREDEFINED_ROLES.map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedFunction === item.id;
                const isCeo = item.id === 'CEO';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectFunction(item.id)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer relative group ${
                      isSelected
                        ? isCeo
                          ? 'bg-[#142142] text-white border-[#fab518] shadow-md ring-2 ring-[#fab518]'
                          : 'bg-[#142142] text-white border-[#142142] dark:bg-[#fab518] dark:text-[#142142] dark:border-[#fab518] shadow-md'
                        : isCeo
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/60 hover:border-amber-400'
                        : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected 
                          ? isCeo
                            ? 'bg-[#fab518] text-[#142142]'
                            : 'bg-white/20 dark:bg-[#142142]/20 text-white dark:text-[#142142]' 
                          : isCeo
                          ? 'bg-[#fab518]/20 text-amber-700 dark:text-[#fab518]'
                          : 'bg-white dark:bg-slate-700 text-[#142142] dark:text-[#fab518] shadow-2xs'
                      }`}>
                        <IconComponent size={16} />
                      </div>
                      {isCeo && !isSelected && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Diretoria
                        </span>
                      )}
                      {isSelected && (
                        <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold text-[9px] ${
                          isCeo 
                            ? 'bg-[#fab518] text-[#142142]' 
                            : 'bg-[#fab518] dark:bg-[#142142] text-[#142142] dark:text-[#fab518]'
                        }`}>
                          ✓
                        </span>
                      )}
                    </div>
                    <div>
                      <p className={`font-black text-xs sm:text-sm tracking-tight ${
                        isSelected ? (isCeo ? 'text-[#fab518]' : 'text-white dark:text-[#142142]') : 'text-[#142142] dark:text-white'
                      }`}>
                        {item.label}
                      </p>
                      <p className={`text-[10px] mt-0.5 leading-snug line-clamp-2 ${
                        isSelected 
                          ? (isCeo ? 'text-white/90' : 'text-white/80 dark:text-[#142142]/80') 
                          : 'text-slate-400 dark:text-slate-400'
                      }`}>
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Role Subtitle */}
            <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-1.5 text-slate-500">
              <span className="text-[11px] font-semibold shrink-0">Título complementar ou nível (opcional):</span>
              <input
                type="text"
                value={customRoleTitle}
                onChange={(e) => setCustomRoleTitle(e.target.value)}
                placeholder={`Ex: ${selectedFunction} Executivo / Sênior`}
                className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:border-[#fab518]"
              />
            </div>
          </div>

          {/* Section 2: Credenciais de Acesso (Usuário e Senha para Login) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-50/50 dark:to-slate-900/40 border border-amber-300/70 dark:border-amber-500/30 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#fab518] text-[#142142] flex items-center justify-center font-black shrink-0 shadow-xs ring-2 ring-[#fab518]/20">
                  <KeyRound size={17} className="stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-black text-[#142142] dark:text-white tracking-tight">
                      Credenciais de Acesso ao Sistema
                    </h3>
                    {isEditingOwner ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                        <Crown size={11} className="text-amber-600 dark:text-amber-400" />
                        Conta Mestra (Dono)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        <ShieldCheck size={11} />
                        Acesso Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Usuário e senha criptografados para login direto na plataforma
                  </p>
                </div>
              </div>

              {/* Botão Copiar Dados de Acesso */}
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-2xs active:scale-95 cursor-pointer"
                title="Copiar usuário e senha para a área de transferência"
              >
                {copiedCredential ? (
                  <>
                    <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} className="text-slate-400" />
                    <span>Copiar Credenciais</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Login Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Usuário de Login *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 font-black text-xs">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="Ex: beatriz.design ou lancerotti"
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-hidden focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/20 transition-all font-semibold"
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <span>
                    Login: <strong className="font-mono text-slate-700 dark:text-slate-200">@{username || 'usuario'}</strong>
                  </span>
                  {name.trim() && !isEditingOwner && (
                    <button
                      type="button"
                      onClick={() => setUsername(generateUsernameFromName(name))}
                      className="text-[#142142] dark:text-[#fab518] font-bold hover:underline cursor-pointer"
                    >
                      Sugerir do nome
                    </button>
                  )}
                </div>
              </div>

              {/* Login Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Senha de Acesso *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={14} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Defina a senha"
                    className="w-full pl-9 pr-16 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-hidden focus:border-[#fab518] focus:ring-2 focus:ring-[#fab518]/20 transition-all font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      <div className={`h-1.5 w-3 rounded-full ${password.length > 0 ? (password.length >= 6 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-slate-200 dark:bg-slate-700'}`} />
                      <div className={`h-1.5 w-3 rounded-full ${password.length >= 6 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                      <div className={`h-1.5 w-3 rounded-full ${password.length >= 8 && /[!@#$%^&*]/.test(password) ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    </div>
                    <span>{password.length < 6 ? 'Mín. 6 chars' : (password.length >= 8 && /[!@#$%^&*]/.test(password) ? 'Segura' : 'Boa')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[#142142] dark:text-[#fab518] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={9} /> Gerar forte
                  </button>
                </div>
              </div>
            </div>

            {/* Reassuring Security Note */}
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
              <Shield size={14} className="text-[#fab518] shrink-0 mt-0.5" />
              <p className="leading-tight">
                {isEditingOwner
                  ? 'Como Marcos Lancerotti é o Dono da Agência, atualizar a senha aqui também sincroniza automaticamente a Senha Mestra do sistema.'
                  : 'Este usuário e senha são gravados na nuvem e no armazenamento seguro local para autenticação imediata na tela de login.'}
              </p>
            </div>
          </div>

          {/* Section 3: Nome e E-mail */}
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
                  onBlur={handleNameBlur}
                  placeholder="Ex: Beatriz Lima"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-[#fab518]"
                />
              </div>
            </div>

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
                  placeholder="Ex: beatriz@ideiasdigitais.com.br"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-[#fab518]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Foto / Avatar */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Foto de Perfil / Avatar
            </label>
            <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
              <img
                src={customAvatarUrl.trim() || avatar?.trim() || PRESET_AVATARS[0]}
                alt="Avatar"
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#fab518] shrink-0 shadow-xs"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = PRESET_AVATARS[0];
                }}
              />
              <div className="flex-1 space-y-1.5">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                  Escolha um avatar rápido:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_AVATARS.map((pic, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAvatar(pic);
                        setCustomAvatarUrl('');
                      }}
                      className={`w-7 h-7 rounded-lg overflow-hidden transition-all cursor-pointer ${
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
                placeholder="Ou insira o link da foto de perfil..."
                className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:border-[#fab518]"
              />
            </div>
          </div>

          {/* Section 5: Disponibilidade & Demandas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Disponibilidade
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-[#fab518]"
              >
                <option value="Disponível">🟢 Disponível</option>
                <option value="Ocupado">🟡 Ocupado</option>
                <option value="Férias">🔵 Férias</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Demandas Ativas Atribuídas
              </label>
              <input
                type="number"
                min={0}
                max={99}
                value={activeTasks}
                onChange={(e) => setActiveTasks(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-[#fab518]"
              />
            </div>
          </div>

          {/* Section 6: Especialidades & Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Especialidades & Competências
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
                placeholder="Adicione competência (ex: Meta Ads, Figma, React)..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-[#fab518]"
              />
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                + Inserir
              </button>
            </div>

            {/* Selected Tags */}
            <div className="flex flex-wrap gap-1.5 mb-2.5 min-h-[32px] p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
              {specialties.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Nenhuma especialidade adicionada</span>
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

            {/* Suggested Tags tailored to chosen function */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Sugestões para {selectedFunction}:</span>
              {PREDEFINED_ROLES.find((r) => r.id === selectedFunction)?.suggestedTags.map((item) => {
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

          {/* Action Buttons */}
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
              disabled={!isMarcosLancerotti}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#fab518] hover:bg-[#fab518]/90 text-[#142142] font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
