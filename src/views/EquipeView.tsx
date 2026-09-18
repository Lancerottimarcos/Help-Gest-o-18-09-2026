import React, { useState } from 'react';
import { Plus, Mail, Pencil, Trash2, Search, AlertTriangle, X, Check, UsersRound } from 'lucide-react';
import { TeamMember } from '../types';
import { initialTeamMembers } from '../data/mockData';
import { ColaboradorModal } from '../components/ColaboradorModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

interface EquipeViewProps {
  teamMembers?: TeamMember[];
  onAddTeamMember?: (member: TeamMember) => void;
  onUpdateTeamMember?: (member: TeamMember) => void;
  onDeleteTeamMember?: (memberId: string) => void;
}

export const EquipeView: React.FC<EquipeViewProps> = ({
  teamMembers: externalTeamMembers,
  onAddTeamMember,
  onUpdateTeamMember,
  onDeleteTeamMember,
}) => {
  // Local fallback if props are not provided
  const [localTeamMembers, setLocalTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const currentMembers = externalTeamMembers || localTeamMembers;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const handleOpenAddModal = () => {
    setMemberToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: TeamMember) => {
    setMemberToEdit(member);
    setIsModalOpen(true);
  };

  const handleSaveMember = (member: TeamMember) => {
    if (memberToEdit) {
      if (onUpdateTeamMember) {
        onUpdateTeamMember(member);
      } else {
        setLocalTeamMembers((prev) =>
          prev.map((m) => (m.id === member.id ? member : m))
        );
      }
    } else {
      if (onAddTeamMember) {
        onAddTeamMember(member);
      } else {
        setLocalTeamMembers((prev) => [member, ...prev]);
      }
    }
  };

  const handleConfirmDelete = () => {
    if (!memberToDelete) return;

    if (onDeleteTeamMember) {
      onDeleteTeamMember(memberToDelete.id);
    } else {
      setLocalTeamMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));
    }

    setMemberToDelete(null);
  };

  // Filter members
  const filteredMembers = currentMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'todos' || m.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Action, Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0f172a] p-5 sm:p-6 rounded-[28px] border border-slate-200/90 dark:border-slate-800 card-elevation-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por colaborador, especialidade ou cargo..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-[#F4F5F8] dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-[#142142] dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#fab518]"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'disponível', label: 'Disponíveis' },
            { id: 'ocupado', label: 'Ocupados' },
            { id: 'férias', label: 'Férias' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-[#142142] text-white dark:bg-[#fab518] dark:text-[#142142] shadow-xs'
                  : 'bg-[#F4F5F8] dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Counter and Add Button */}
        <div className="flex items-center gap-3 ml-auto sm:ml-0">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 hidden md:inline-block font-mono">
            {filteredMembers.length} {filteredMembers.length === 1 ? 'colaborador' : 'colaboradores'}
          </span>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs sm:text-sm shadow-xs transition-all cursor-pointer whitespace-nowrap"
            title="Cadastrar novo colaborador na equipe"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>Novo colaborador</span>
          </button>
        </div>
      </div>

      {/* Grid of Team Members */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white dark:bg-[#0f172a] rounded-[28px] border border-slate-200/90 dark:border-slate-800 p-12 text-center space-y-3 card-elevation-subtle">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-[#fab518] flex items-center justify-center mx-auto">
            <UsersRound size={24} />
          </div>
          <h4 className="text-base font-bold text-[#142142] dark:text-white">Nenhum colaborador encontrado</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Não encontramos colaboradores com os filtros aplicados. Tente ajustar a busca ou adicione um novo colaborador.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fab518] hover:bg-[#fab518]/90 text-[#142142] font-bold text-xs transition-all cursor-pointer"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>Adicionar Colaborador</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white dark:bg-[#0f172a] rounded-[28px] border border-slate-200/90 dark:border-slate-800 p-6 card-elevation-subtle hover:border-[#fab518] dark:hover:border-[#fab518] flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {member.avatar?.trim() ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-700 shrink-0 shadow-xs"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#142142] to-[#1e3060] text-[#fab518] font-black text-base flex items-center justify-center ring-2 ring-slate-100 dark:ring-slate-700 shrink-0 shadow-xs">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-[#142142] dark:text-white truncate group-hover:text-[#fab518] transition-colors">
                        {member.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`
                      text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0
                      ${
                        member.status === 'Disponível'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : member.status === 'Ocupado'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      }
                    `}
                  >
                    {member.status}
                  </span>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-4 bg-[#F8F9FA] dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <Mail size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Especialidades
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {member.specialties.map((spec, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#F4F5F8] dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer with Tasks and Action Buttons (Edit / Delete) */}
              <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-slate-500 dark:text-slate-400 font-medium truncate">Demandas:</span>
                  <span className="font-mono font-black text-[#142142] dark:text-[#fab518] bg-[#fab518]/15 dark:bg-[#fab518]/20 px-2.5 py-0.5 rounded-lg text-[11px] shrink-0">
                    {member.activeTasks} ativas
                  </span>
                </div>

                {/* Edit and Delete Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(member)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-[#142142] dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                    title={`Editar dados de ${member.name}`}
                  >
                    <Pencil size={11} />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMemberToDelete(member)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all cursor-pointer"
                    title={`Excluir colaborador ${member.name}`}
                  >
                    <Trash2 size={11} />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add / Edit Colaborador */}
      {isModalOpen && (
        <ColaboradorModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setMemberToEdit(null);
          }}
          onSave={handleSaveMember}
          memberToEdit={memberToEdit}
        />
      )}

      {/* Confirmation Dialog for Delete */}
      <ConfirmDeleteModal
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={handleConfirmDelete}
        itemType="membro da equipe"
        itemName={memberToDelete ? `${memberToDelete.name} • ${memberToDelete.role}` : undefined}
        description={
          memberToDelete ? (
            <p>
              Tem certeza que deseja excluir <strong>{memberToDelete.name}</strong>? Se houver demandas atribuídas a este colaborador, elas continuarão registradas no sistema e poderão ser reatribuídas a outros profissionais.
            </p>
          ) : undefined
        }
      />
    </div>
  );
};
