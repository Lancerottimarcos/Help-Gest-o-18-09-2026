import React, { useState } from 'react';
import { Briefcase, Check, Plus, X, Tag, DollarSign, FileText, Sparkles, Layers, Pencil, Trash2 } from 'lucide-react';
import { initialServices } from '../data/mockData';
import { Service } from '../types';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

interface ServicosViewProps {
  services?: Service[];
  onAddService?: (service: Service) => void;
  onUpdateService?: (service: Service) => void;
  onDeleteService?: (serviceId: string) => void;
}

export const ServicosView: React.FC<ServicosViewProps> = ({
  services = initialServices,
  onAddService,
  onUpdateService,
  onDeleteService,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [basePrice, setBasePrice] = useState<string>('');
  const [category, setCategory] = useState<'Social Media' | 'Tráfego Pago' | 'Criação de Sites' | 'Consultoria'>('Social Media');
  const [description, setDescription] = useState('');
  const [isMonthly, setIsMonthly] = useState(true);
  const [deliverableInput, setDeliverableInput] = useState('');
  const [deliverables, setDeliverables] = useState<string[]>([
    'Alinhamento estratégico inicial',
    'Entrega de relatórios de desempenho'
  ]);

  // Edit Service states
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBasePrice, setEditBasePrice] = useState<string>('');
  const [editCategory, setEditCategory] = useState<'Social Media' | 'Tráfego Pago' | 'Criação de Sites' | 'Consultoria'>('Social Media');
  const [editDescription, setEditDescription] = useState('');
  const [editIsMonthly, setEditIsMonthly] = useState(true);
  const [editDeliverableInput, setEditDeliverableInput] = useState('');
  const [editDeliverables, setEditDeliverables] = useState<string[]>([]);
  const [editActiveClientsCount, setEditActiveClientsCount] = useState<number>(0);

  const handleOpenEditModal = (srv: Service) => {
    setEditingService(srv);
    setShowDeleteConfirm(false);
    setEditTitle(srv.title);
    setEditBasePrice(srv.basePrice.toString());
    setEditCategory(srv.category);
    setEditDescription(srv.description);
    setEditIsMonthly(srv.isMonthly);
    setEditDeliverables(srv.deliverables ? [...srv.deliverables] : []);
    setEditActiveClientsCount(srv.activeClientsCount || 0);
    setEditDeliverableInput('');
  };

  const handleAddDeliverable = () => {
    if (!deliverableInput.trim()) return;
    setDeliverables((prev) => [...prev, deliverableInput.trim()]);
    setDeliverableInput('');
  };

  const handleRemoveDeliverable = (idx: number) => {
    setDeliverables((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddEditDeliverable = () => {
    if (!editDeliverableInput.trim()) return;
    setEditDeliverables((prev) => [...prev, editDeliverableInput.trim()]);
    setEditDeliverableInput('');
  };

  const handleRemoveEditDeliverable = (idx: number) => {
    setEditDeliverables((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !basePrice) return;

    const numericPrice = parseFloat(basePrice.replace(/\./g, '').replace(',', '.')) || 0;

    const newService: Service = {
      id: `srv-${Date.now()}`,
      title: title.trim(),
      basePrice: numericPrice,
      category,
      description: description.trim() || `Serviço de ${title.trim()} prestado com alta qualidade e entregáveis definidos para sua marca.`,
      isMonthly,
      deliverables: deliverables.length > 0 ? deliverables : ['Escopo customizado conforme proposta comercial'],
      activeClientsCount: 0,
    };

    if (onAddService) {
      onAddService(newService);
    }

    // Reset form
    setTitle('');
    setBasePrice('');
    setDescription('');
    setCategory('Social Media');
    setIsMonthly(true);
    setDeliverables([
      'Alinhamento estratégico inicial',
      'Entrega de relatórios de desempenho'
    ]);
    setShowAddModal(false);
  };

  const handleSaveEditService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !editTitle.trim()) return;

    const numericPrice = parseFloat(editBasePrice.toString().replace(/\./g, '').replace(',', '.')) || 0;

    const updated: Service = {
      ...editingService,
      title: editTitle.trim(),
      basePrice: numericPrice,
      category: editCategory,
      description: editDescription.trim(),
      isMonthly: editIsMonthly,
      deliverables: editDeliverables.length > 0 ? editDeliverables : ['Escopo customizado conforme proposta comercial'],
      activeClientsCount: editActiveClientsCount,
    };

    if (onUpdateService) {
      onUpdateService(updated);
    }
    setEditingService(null);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Services Intro & Header */}
      <div className="bg-white dark:bg-[#0f172a] p-6 sm:p-7 rounded-[28px] border border-slate-200/90 dark:border-slate-800 card-elevation-subtle flex flex-wrap items-center justify-between gap-5">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#fab518] flex items-center gap-1.5">
            <Sparkles size={14} />
            <span>Catálogo de Soluções & Precificação</span>
          </span>
          <h3 className="text-2xl font-black text-[#142142] dark:text-white tracking-tight mt-1">
            Serviços & Pacotes
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
            Estrutura padronizada de entregáveis para acelerar propostas comerciais e alinhar o escopo com o time de criação e tráfego.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono font-bold text-xs text-[#142142] dark:text-slate-200 border border-slate-200/60 dark:border-slate-700">
            {services.length} Serviços Ativos
          </span>

          <button
            type="button"
            id="btn-add-service-open"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs sm:text-sm shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>Novo serviço</span>
          </button>
        </div>
      </div>

      {/* Services Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.length === 0 ? (
          <div className="col-span-full py-12 px-6 text-center bg-white dark:bg-[#0f172a] rounded-[28px] border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-[#fab518] flex items-center justify-center mx-auto shadow-xs">
              <Briefcase size={24} />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-[#142142] dark:text-white">Nenhum serviço cadastrado ainda</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cadastre os serviços e pacotes oferecidos pela sua agência com descrição e valores de investimento.
              </p>
            </div>
            <button
              type="button"
              id="btn-empty-add-service"
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-[#fab518] hover:bg-[#e29f11] text-[#142142] font-black text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>Cadastrar Primeiro Serviço</span>
            </button>
          </div>
        ) : (
          services.map((srv) => (
          <div
            key={srv.id}
            id={`service-card-${srv.id}`}
            className="bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-200/90 dark:border-slate-800 p-6 card-elevation-subtle hover:border-[#fab518]/80 dark:hover:border-[#fab518]/80 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group"
          >
            {/* Top Row: Icon Badge & Quick Actions */}
            <div className="flex items-center justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#fab518] flex items-center justify-center border border-amber-200/50 dark:border-amber-500/20 shrink-0 group-hover:scale-105 transition-transform">
                <Briefcase size={18} className="stroke-[2.2]" />
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id={`btn-footer-edit-${srv.id}`}
                  onClick={() => handleOpenEditModal(srv)}
                  className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-[#142142] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={`Editar serviço ${srv.title}`}
                  aria-label={`Editar serviço ${srv.title}`}
                >
                  <Pencil size={14} className="stroke-[2.2]" />
                </button>

                {onDeleteService && (
                  <button
                    type="button"
                    id={`btn-card-delete-service-${srv.id}`}
                    onClick={() => setServiceToDelete(srv)}
                    className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title={`Excluir serviço ${srv.title}`}
                    aria-label={`Excluir serviço ${srv.title}`}
                  >
                    <Trash2 size={14} className="stroke-[2.2]" />
                  </button>
                )}
              </div>
            </div>

            {/* Content: Title & Description */}
            <div className="space-y-1.5 flex-1">
              <h4 className="text-lg font-black text-[#142142] dark:text-white group-hover:text-[#fab518] dark:group-hover:text-[#fab518] transition-colors leading-snug">
                {srv.title}
              </h4>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-3">
                {srv.description || 'Solução estruturada sob medida para atender as demandas da agência.'}
              </p>
            </div>

            {/* Value Highlight Block */}
            <div className="bg-[#F8F9FA] dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 tracking-wider block">
                  Valor
                </span>
                <p className="text-xl font-black text-[#142142] dark:text-white font-mono tabular-nums tracking-tight">
                  R$ {srv.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700/60 text-[#fab518] flex items-center justify-center border border-slate-200/60 dark:border-slate-700 shadow-2xs">
                <DollarSign size={14} className="stroke-[2.5]" />
              </div>
            </div>
          </div>
        ))
      )}
      </div>

      {/* Modal: Adicionar Novo Serviço */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#142142]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-[28px] p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 sticky top-0 bg-white dark:bg-[#0f172a] z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#fab518]/20 text-[#142142] dark:text-[#fab518] flex items-center justify-center font-bold">
                  <Briefcase size={17} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#142142] dark:text-white">
                    Adicionar Novo Serviço
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Defina o nome, valor e especificações do pacote
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-add-service-modal"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-4">
              {/* Nome do Serviço (Requested) */}
              <div>
                <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                  Nome do Serviço <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    id="input-service-name"
                    placeholder="Ex: Gestão de Redes Sociais + Reels"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white p-3 rounded-xl border border-transparent dark:border-slate-700 focus:border-[#fab518] focus:outline-none font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Valor (R$) */}
              <div>
                <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                  Valor (R$) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-500">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    id="input-service-price"
                    placeholder="0,00"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white p-3 pl-10 rounded-xl border border-transparent dark:border-slate-700 focus:border-[#fab518] focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Descrição do Serviço */}
              <div>
                <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                  Descrição Resumida
                </label>
                <textarea
                  rows={3}
                  id="textarea-service-description"
                  placeholder="Explique o que este serviço contempla de forma concisa..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-xs text-[#142142] dark:text-white p-3 rounded-xl border border-transparent dark:border-slate-700 focus:border-[#fab518] focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  id="btn-submit-new-service"
                  className="px-5 py-2 rounded-xl bg-[#fab518] hover:bg-[#fab518]/90 text-[#142142] font-black text-xs transition-all shadow-xs cursor-pointer"
                >
                  Salvar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Serviço Existente */}
      {editingService && (
        <div 
          id="modal-edit-service"
          className="fixed inset-0 bg-[#142142]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-[28px] p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 sticky top-0 bg-white dark:bg-[#0f172a] z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#fab518] text-[#142142] flex items-center justify-center font-bold shadow-xs">
                  <Pencil size={16} className="stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-[#142142] dark:text-white">
                      Editar Serviço
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {editingService.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Altere os dados, valores ou escopo de entrega do serviço
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-edit-service-modal"
                onClick={() => setEditingService(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditService} className="space-y-4">
              {/* Nome do Serviço */}
              <div>
                <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                  Nome do Serviço <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="input-edit-service-name"
                  placeholder="Ex: Gestão de Redes Sociais + Reels"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white p-3 rounded-xl border border-transparent dark:border-slate-700 focus:border-[#fab518] focus:outline-none font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                  Valor (R$) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-500">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    id="input-edit-service-price"
                    placeholder="0,00"
                    value={editBasePrice}
                    onChange={(e) => setEditBasePrice(e.target.value)}
                    className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-sm text-[#142142] dark:text-white p-3 pl-10 rounded-xl border border-transparent dark:border-slate-700 focus:border-[#fab518] focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Descrição do Serviço */}
              <div>
                <label className="block text-xs font-bold text-[#142142] dark:text-slate-200 mb-1">
                  Descrição Resumida
                </label>
                <textarea
                  rows={3}
                  id="textarea-edit-service-description"
                  placeholder="Explique o que este serviço contempla..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-[#F2F2F2] dark:bg-slate-800 text-xs text-[#142142] dark:text-white p-3 rounded-xl border border-transparent dark:border-slate-700 focus:border-[#fab518] focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                />
              </div>

              {/* Form Action Buttons */}
              <div 
                id="edit-service-modal-actions"
                className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                {onDeleteService ? (
                  <button
                    type="button"
                    id="btn-delete-service"
                    onClick={() => {
                      if (editingService) {
                        setServiceToDelete(editingService);
                      }
                    }}
                    className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Excluir este serviço do catálogo"
                  >
                    <Trash2 size={13} />
                    <span>Excluir</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-cancel-edit-service"
                    onClick={() => {
                      setEditingService(null);
                      setShowDeleteConfirm(false);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    id="btn-submit-edit-service"
                    className="px-5 py-2 rounded-xl bg-[#fab518] hover:bg-[#fab518]/90 text-[#142142] font-black text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check size={14} className="stroke-[3]" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generic Confirmation Modal for Service Deletion */}
      <ConfirmDeleteModal
        isOpen={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        onConfirm={() => {
          if (serviceToDelete && onDeleteService) {
            onDeleteService(serviceToDelete.id);
            if (editingService?.id === serviceToDelete.id) {
              setEditingService(null);
            }
            setServiceToDelete(null);
          }
        }}
        itemType="serviço"
        itemName={serviceToDelete?.title}
        description={
          serviceToDelete ? (
            <p>
              Tem certeza que deseja excluir o serviço <strong>{serviceToDelete.title}</strong>? Ele deixará de constar no catálogo de serviços da agência e em novos orçamentos.
            </p>
          ) : undefined
        }
      />
    </div>
  );
};
