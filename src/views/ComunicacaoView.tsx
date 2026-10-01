import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Hash,
  Users,
  Search,
  Pin,
  Smile,
  Trash2,
  CheckCheck,
  Radio,
  Palette,
  Kanban,
  AtSign,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  Circle,
  Copy,
  Check,
  CornerDownRight,
  Bold,
  Italic,
  Code,
  List,
  PanelRightClose,
  PanelRightOpen,
  ArrowDown,
  Reply,
  Quote,
  Link2,
  Info,
  Lock,
  Globe,
  SlidersHorizontal,
  UserCheck,
  Paperclip,
  Sparkles,
} from 'lucide-react';
import { ChatMessage, ChatChannel, TeamMember, UserProfile } from '../types';

interface ComunicacaoViewProps {
  currentUser: UserProfile;
  teamMembers?: TeamMember[];
  onSimulateMember?: (member: TeamMember | null) => void;
  simulatedMemberId?: string;
}

const COMMON_EMOJIS = ['👍', '❤️', '🚀', '🔥', '👏', '👀', '🎉', '💡', '✅', '🙌'];
const EMOJI_PALETTE = ['👍', '❤️', '🚀', '🔥', '👏', '👀', '🎉', '💡', '✅', '🙌', '💯', '✨', '⚡', '🤝', '🎯', '📌'];

export const ComunicacaoView: React.FC<ComunicacaoViewProps> = ({
  currentUser,
  teamMembers = [],
  onSimulateMember,
  simulatedMemberId,
}) => {
  // Canais e Mensagens
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('geral');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Estados de Interface e UX
  const [searchInChat, setSearchInChat] = useState('');
  const [searchChannels, setSearchChannels] = useState('');
  const [showPinnedDrawer, setShowPinnedDrawer] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState<'members' | 'pinned' | 'about'>('members');
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(null);
  const [showComposerEmojis, setShowComposerEmojis] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [mobileActiveView, setMobileActiveView] = useState<'sidebar' | 'chat'>('chat');
  const [chatLayoutMode, setChatLayoutMode] = useState<'linear' | 'bubbles'>('linear');

  // Resposta / Citação de Mensagem
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Seções retráteis da sidebar
  const [channelsSectionOpen, setChannelsSectionOpen] = useState(true);
  const [dmsSectionOpen, setDmsSectionOpen] = useState(true);

  // Modal Novo Canal
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelIcon, setNewChannelIcon] = useState('Hash');
  const [newChannelIsPrivate, setNewChannelIsPrivate] = useState(false);

  // WebSocket & Presença Real
  const [wsConnected, setWsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Array<{ userId: string; name: string; role?: string; avatar?: string }>>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Usuário ativo no chat (respeita o membro simulado se ativo)
  const effectiveUser = useMemo(() => {
    if (simulatedMemberId && teamMembers.length > 0) {
      const sim = teamMembers.find((m) => m.id === simulatedMemberId);
      if (sim) {
        return {
          id: sim.id,
          name: sim.name,
          role: sim.role || sim.functionRole || 'Colaborador',
          avatarUrl: sim.avatar || '',
        };
      }
    }
    return {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.roleLabel || 'Proprietário da Agência',
      avatarUrl: currentUser.avatarUrl || '',
    };
  }, [currentUser, simulatedMemberId, teamMembers]);

  // Carrega lista de canais
  const fetchChannels = async () => {
    try {
      const res = await fetch('/api/chat/channels');
      const data = await res.json();
      if (data.success && Array.isArray(data.channels)) {
        setChannels(data.channels);
      }
    } catch (err) {
      console.error('Erro ao buscar canais:', err);
    }
  };

  // Carrega mensagens do canal ativo
  const fetchMessages = async (channelId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/messages?channelId=${encodeURIComponent(channelId)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    fetchMessages(activeChannelId);
    setShowPinnedDrawer(false);
    setSearchInChat('');
    setReplyingTo(null);
  }, [activeChannelId]);

  // Auto-scroll suave para o final do chat
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length, activeChannelId]);

  // Conexão WebSocket Real com Presença e Eventos em Tempo Real
  useEffect(() => {
    let isMounted = true;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setWsConnected(true);
          ws.send(
            JSON.stringify({
              type: 'client:join',
              userId: effectiveUser.id,
              name: effectiveUser.name,
              role: effectiveUser.role,
              avatar: effectiveUser.avatarUrl,
              channelId: activeChannelId,
            })
          );
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'presence:sync' || data.type === 'presence:update') {
              if (Array.isArray(data.presence || data.users)) {
                setOnlineUsers(data.presence || data.users);
              }
            } else if (data.type === 'message:new') {
              const newMsg: ChatMessage = data.message;
              if (newMsg.channelId === activeChannelId) {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === newMsg.id)) return prev;
                  return [...prev, newMsg];
                });
                setTimeout(() => scrollToBottom(true), 60);
              }
              fetchChannels();
            } else if (data.type === 'reaction:updated') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === data.messageId ? { ...m, reactions: data.reactions } : m
                )
              );
            } else if (data.type === 'message:pinned') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === data.messageId ? { ...m, isPinned: data.isPinned } : m
                )
              );
            } else if (data.type === 'message:deleted') {
              setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
            } else if (data.type === 'user:typing') {
              if (data.channelId === activeChannelId && data.userId !== effectiveUser.id) {
                setTypingUsers((prev) => {
                  if (data.isTyping) {
                    return { ...prev, [data.userId]: data.userName };
                  }
                  const updated = { ...prev };
                  delete updated[data.userId];
                  return updated;
                });
              }
            } else if (data.type === 'channel:new') {
              fetchChannels();
            }
          } catch (e) {
            console.error('Erro ao processar mensagem WS:', e);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setWsConnected(false);
          reconnectTimer = setTimeout(() => {
            if (isMounted) connectWebSocket();
          }, 2500);
        };

        ws.onerror = () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        };
      } catch (err) {
        console.error('Falha ao conectar WebSocket:', err);
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [effectiveUser, activeChannelId]);

  // Indicador de digitação
  const handleTyping = (text: string) => {
    setMessageText(text);
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (text.trim().length > 0) {
      wsRef.current.send(
        JSON.stringify({
          type: 'typing:start',
          userId: effectiveUser.id,
          userName: effectiveUser.name,
          channelId: activeChannelId,
        })
      );

      typingTimeoutRef.current = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'typing:stop',
              userId: effectiveUser.id,
              userName: effectiveUser.name,
              channelId: activeChannelId,
            })
          );
        }
      }, 1500);
    } else {
      wsRef.current.send(
        JSON.stringify({
          type: 'typing:stop',
          userId: effectiveUser.id,
          userName: effectiveUser.name,
          channelId: activeChannelId,
        })
      );
    }
  };

  // Enviar mensagem com suporte a citação (replyTo)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanContent = messageText.trim();
    if (!cleanContent || sending) return;

    setSending(true);
    try {
      const payload: any = {
        channelId: activeChannelId,
        senderId: effectiveUser.id,
        senderName: effectiveUser.name,
        senderAvatar: effectiveUser.avatarUrl,
        senderRole: effectiveUser.role,
        content: cleanContent,
      };

      if (replyingTo) {
        payload.replyTo = {
          id: replyingTo.id,
          senderName: replyingTo.senderName,
          content: replyingTo.content.substring(0, 140),
        };
      }

      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessageText('');
        setReplyingTo(null);
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setTimeout(() => scrollToBottom(true), 40);
        if (composerTextareaRef.current) {
          composerTextareaRef.current.style.height = 'auto';
        }
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setSending(false);
    }
  };

  // Alternar reação em mensagem
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      await fetch(`/api/chat/messages/${messageId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, userId: effectiveUser.id }),
      });
      setShowEmojiPickerFor(null);
    } catch (err) {
      console.error('Erro ao reagir à mensagem:', err);
    }
  };

  // Fixar / Desfixar mensagem
  const handleTogglePin = async (messageId: string) => {
    try {
      await fetch(`/api/chat/messages/${messageId}/pin`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Erro ao fixar mensagem:', err);
    }
  };

  // Copiar conteúdo de mensagem
  const handleCopyMessage = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedMessageId(msg.id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Iniciar citação / resposta
  const handleReplyMessage = (msg: ChatMessage) => {
    setReplyingTo(msg);
    if (composerTextareaRef.current) {
      composerTextareaRef.current.focus();
    }
  };

  // Inserir formatação no cursor do composer
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const el = composerTextareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = messageText;
    const selected = text.substring(start, end);
    const replacement = prefix + selected + suffix;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setMessageText(newText);
    setTimeout(() => {
      el.focus();
      const newCursor = start + prefix.length + selected.length;
      el.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  // Apagar mensagem
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Erro ao apagar mensagem:', err);
    }
  };

  // Criar novo canal
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      const res = await fetch('/api/chat/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChannelName.trim(),
          description: newChannelDesc.trim(),
          icon: newChannelIcon,
          isPrivate: newChannelIsPrivate,
        }),
      });
      const data = await res.json();
      if (data.success && data.channel) {
        setChannels((prev) => [...prev, data.channel]);
        setActiveChannelId(data.channel.id);
        setShowNewChannelModal(false);
        setNewChannelName('');
        setNewChannelDesc('');
        setNewChannelIsPrivate(false);
        setMobileActiveView('chat');
      }
    } catch (err) {
      console.error('Erro ao criar canal:', err);
    }
  };

  // Iniciar conversa direta (DM)
  const handleStartDM = (member: TeamMember) => {
    const ids = [effectiveUser.id, member.id].sort();
    const dmId = `dm-${ids.join('-')}`;
    const dmName = member.name;
    const dmDesc = `Conversa direta com ${member.name} (${member.role || member.functionRole || 'Colaborador'})`;

    const exists = channels.find((c) => c.id === dmId);
    if (!exists) {
      const newDM: ChatChannel = {
        id: dmId,
        name: dmName,
        description: dmDesc,
        isPrivate: true,
        memberIds: ids,
        icon: 'AtSign',
      };
      setChannels((prev) => [...prev, newDM]);
      fetch('/api/chat/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDM),
      });
    }
    setActiveChannelId(dmId);
    setMobileActiveView('chat');
  };

  // Canal ativo
  const currentChannel = useMemo(() => {
    return (
      channels.find((c) => c.id === activeChannelId) || {
        id: activeChannelId,
        name: activeChannelId === 'geral' ? 'Geral da Agência' : activeChannelId,
        description: 'Canal de alinhamento e comunicação da equipe',
        icon: 'Hash',
      }
    );
  }, [channels, activeChannelId]);

  // Mensagens filtradas por busca
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (searchInChat.trim()) {
        const query = searchInChat.toLowerCase();
        return (
          m.content.toLowerCase().includes(query) ||
          m.senderName.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [messages, searchInChat]);

  // Mensagens fixadas
  const pinnedMessages = useMemo(() => {
    return messages.filter((m) => m.isPinned);
  }, [messages]);

  // Helper para ícones de canais
  const renderChannelIcon = (iconName?: string, isPrivate?: boolean) => {
    if (isPrivate) {
      return <Lock size={14} className="text-purple-500 shrink-0" />;
    }
    switch (iconName) {
      case 'Kanban':
        return <Kanban size={14} className="text-amber-500 shrink-0" />;
      case 'Palette':
        return <Palette size={14} className="text-rose-500 shrink-0" />;
      case 'Users':
        return <Users size={14} className="text-emerald-500 shrink-0" />;
      case 'AtSign':
        return <AtSign size={14} className="text-blue-500 shrink-0" />;
      default:
        return <Hash size={14} className="text-slate-400 shrink-0" />;
    }
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.some((u) => u.userId === userId || (u as any).id === userId);
  };

  // Formatação rica de conteúdo da mensagem com Markdown leve
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');

    return (
      <div className="space-y-1">
        {lines.map((line, lineIdx) => {
          // Bloco de citação (> texto)
          if (line.startsWith('> ')) {
            return (
              <blockquote
                key={`line-${lineIdx}`}
                className="pl-3 border-l-2 border-[#fab518] text-slate-600 dark:text-slate-400 italic text-xs my-1"
              >
                {line.substring(2)}
              </blockquote>
            );
          }

          // Item de lista (- item ou • item)
          if (line.match(/^[-•]\s+/)) {
            return (
              <div key={`line-${lineIdx}`} className="flex items-start gap-1.5 pl-1 text-xs">
                <span className="text-[#fab518] font-bold">·</span>
                <span>{line.replace(/^[-•]\s+/, '')}</span>
              </div>
            );
          }

          // Parser inline para URLs, **negrito**, *itálico*, `código`
          const parts = line.split(/(https?:\/\/[^\s]+|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

          return (
            <p key={`line-${lineIdx}`} className="leading-relaxed">
              {parts.map((part, partIdx) => {
                if (part.match(/^https?:\/\//)) {
                  return (
                    <a
                      key={`part-${partIdx}`}
                      href={part}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 dark:text-amber-400 underline underline-offset-2 hover:opacity-80 transition-opacity break-all font-medium inline-flex items-center gap-0.5"
                    >
                      {part}
                      <Link2 size={11} className="inline ml-0.5 opacity-70" />
                    </a>
                  );
                }
                if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
                  return (
                    <code
                      key={`part-${partIdx}`}
                      className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-[#142142] dark:text-amber-300 font-mono text-[11px] border border-slate-300/60 dark:border-slate-700/60"
                    >
                      {part.slice(1, -1)}
                    </code>
                  );
                }
                if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
                  return (
                    <strong key={`part-${partIdx}`} className="font-bold text-slate-900 dark:text-white">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                  return (
                    <em key={`part-${partIdx}`} className="italic">
                      {part.slice(1, -1)}
                    </em>
                  );
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-7.5rem)] min-h-[640px] flex flex-col bg-white dark:bg-[#0b1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm overflow-hidden animate-in fade-in duration-150">
      
      {/* ==================================================================== */}
      {/* 1. TOP BAR CONTRACT: Brand Title / Channel Identification / Actions */}
      {/* ==================================================================== */}
      <header className="h-14 px-4 sm:px-5 border-b border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0c1424] flex items-center justify-between gap-4 shrink-0 z-20">
        
        {/* Left: Mobile back button + Channel Brand & Title */}
        <div className="flex items-center gap-3 min-w-0">
          {mobileActiveView === 'chat' && (
            <button
              type="button"
              onClick={() => setMobileActiveView('sidebar')}
              className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Voltar aos canais"
            >
              <MessageSquare size={17} />
            </button>
          )}

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-[#fab518] flex items-center justify-center shrink-0 border border-amber-300/80 dark:border-amber-700/60">
              {renderChannelIcon(currentChannel.icon, currentChannel.isPrivate)}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {currentChannel.name}
                </h1>
                {currentChannel.isPrivate && (
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                    Privado
                  </span>
                )}
              </div>

              {/* Zero-Pill Unboxed Metadata with · separator */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                <span className="truncate max-w-[280px]">
                  {currentChannel.description || 'Canal operacional da agência'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{messages.length} mensagens</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: In-Channel Live Search Bar */}
        <div className="hidden md:flex items-center relative max-w-xs w-full">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchInChat}
            onChange={(e) => setSearchInChat(e.target.value)}
            placeholder={`Buscar em ${currentChannel.name}...`}
            className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#fab518] transition-all"
          />
          {searchInChat && (
            <button
              type="button"
              onClick={() => setSearchInChat('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Right: Actions, Layout Selector, and WebSocket Status */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Segmented Layout Mode Switcher (Linear Slack vs Balões WhatsApp) */}
          <div className="hidden xl:flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 text-[11px] font-medium text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setChatLayoutMode('linear')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                chatLayoutMode === 'linear'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Modo Linear (Padrão Corporativo / Slack / Linear)"
            >
              Linear
            </button>
            <button
              type="button"
              onClick={() => setChatLayoutMode('bubbles')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                chatLayoutMode === 'bubbles'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Modo Balões (Estilo WhatsApp)"
            >
              Balões
            </button>
          </div>

          {/* Pinned Messages Button */}
          {pinnedMessages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setShowPinnedDrawer(!showPinnedDrawer);
                if (showRightPanel) setRightPanelTab('pinned');
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showPinnedDrawer
                  ? 'bg-[#fab518] text-[#142142]'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
              title="Ver avisos fixados"
            >
              <Pin size={13} className={showPinnedDrawer ? 'rotate-45' : ''} />
              <span className="font-mono tabular-nums">{pinnedMessages.length}</span>
              <span className="hidden sm:inline">Fixadas</span>
            </button>
          )}

          {/* Discreet Live Presence Indicator (No Pill Candy Box) */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-500 dark:text-slate-400 select-none"
            title={wsConnected ? 'Conexão em tempo real estabelecida' : 'Reconectando WebSocket...'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-[11px] font-medium hidden sm:inline">
              {wsConnected ? 'Ao Vivo' : 'Conectando'}
            </span>
          </div>

          {/* Toggle Right Panel (Inspector) */}
          <button
            type="button"
            onClick={() => setShowRightPanel(!showRightPanel)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              showRightPanel
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
            title={showRightPanel ? 'Ocultar detalhes' : 'Exibir detalhes do canal'}
          >
            {showRightPanel ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. THREE-PANE ARCHITECTURE: Sidebar / Stream / Inspector */}
      {/* ==================================================================== */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        
        {/* PANE 1: CHANNELS & DIRECT MESSAGES SIDEBAR */}
        <aside
          className={`
            w-full md:w-60 lg:w-64 border-r border-slate-200/90 dark:border-slate-800/90
            bg-slate-50/60 dark:bg-[#0c1424]/90 flex flex-col shrink-0
            ${mobileActiveView === 'sidebar' ? 'flex' : 'hidden md:flex'}
          `}
        >
          {/* Sidebar Top: Search & Add Channel */}
          <div className="p-3 border-b border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight">
              Canais & Mensagens
            </span>
            <button
              type="button"
              onClick={() => setShowNewChannelModal(true)}
              className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-[#fab518] hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Novo canal de discussão"
            >
              <Plus size={15} />
            </button>
          </div>

          {/* Quick channel filter */}
          <div className="px-3 pt-2.5 pb-1">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchChannels}
                onChange={(e) => setSearchChannels(e.target.value)}
                placeholder="Filtrar conversas..."
                className="w-full pl-7 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#fab518]"
              />
            </div>
          </div>

          {/* Scrollable Channels & DMs Tree */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 scrollbar-none">
            
            {/* Section 1: Public Agency Channels */}
            <div>
              <button
                type="button"
                onClick={() => setChannelsSectionOpen(!channelsSectionOpen)}
                className="w-full px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 uppercase tracking-wider cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  {channelsSectionOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>Canais</span>
                </div>
                <span className="font-mono tabular-nums text-[10px]">
                  {channels.filter((c) => !c.isPrivate).length}
                </span>
              </button>

              {channelsSectionOpen && (
                <div className="mt-1 space-y-0.5">
                  {channels
                    .filter((c) => !c.isPrivate)
                    .filter((c) => !searchChannels || c.name.toLowerCase().includes(searchChannels.toLowerCase()))
                    .map((ch) => {
                      const isActive = activeChannelId === ch.id;
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => {
                            setActiveChannelId(ch.id);
                            setMobileActiveView('chat');
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer group ${
                            isActive
                              ? 'bg-[#142142] text-white dark:bg-[#fab518] dark:text-[#142142] font-semibold'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 font-normal'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={isActive ? 'text-[#fab518] dark:text-[#142142]' : 'text-slate-400'}>
                              {renderChannelIcon(ch.icon, false)}
                            </span>
                            <span className="truncate">{ch.name}</span>
                          </div>
                          {ch.totalMessages !== undefined && ch.totalMessages > 0 && (
                            <span
                              className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
                                isActive
                                  ? 'bg-white/20 text-white dark:bg-black/20 dark:text-[#142142]'
                                  : 'text-slate-400'
                              }`}
                            >
                              {ch.totalMessages}
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Section 2: Direct Messages (DMs) */}
            <div>
              <button
                type="button"
                onClick={() => setDmsSectionOpen(!dmsSectionOpen)}
                className="w-full px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 uppercase tracking-wider cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  {dmsSectionOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>Mensagens Diretas</span>
                </div>
                <span className="font-mono tabular-nums text-[10px]">
                  {teamMembers.length}
                </span>
              </button>

              {dmsSectionOpen && (
                <div className="mt-1 space-y-0.5">
                  {teamMembers
                    .filter((m) => !searchChannels || m.name.toLowerCase().includes(searchChannels.toLowerCase()))
                    .map((member) => {
                      const isMe = member.id === effectiveUser.id;
                      const online = isUserOnline(member.id);
                      const ids = [effectiveUser.id, member.id].sort();
                      const dmId = `dm-${ids.join('-')}`;
                      const isDMActive = activeChannelId === dmId;

                      return (
                        <button
                          key={`sidebar-dm-${member.id}`}
                          type="button"
                          onClick={() => handleStartDM(member)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer group ${
                            isDMActive
                              ? 'bg-[#142142] text-white dark:bg-[#fab518] dark:text-[#142142] font-semibold'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 font-normal'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="relative shrink-0">
                              {member.avatar ? (
                                <img
                                  src={member.avatar}
                                  alt={member.name}
                                  className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-white font-semibold text-[9px] flex items-center justify-center">
                                  {member.name.charAt(0)}
                                </div>
                              )}
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-1 ring-white dark:ring-[#0c1424] ${
                                  online ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                            </div>
                            <span className="truncate">
                              {member.name} {isMe ? '(Você)' : ''}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] ${
                              isDMActive
                                ? 'opacity-90'
                                : online
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {online ? 'Online' : 'Off'}
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Dock: Simulator Mode */}
          {teamMembers.length > 0 && onSimulateMember && (
            <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70">
              <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <UserCheck size={11} className="text-[#fab518]" />
                <span>Simular Colaborador:</span>
              </div>
              <select
                value={simulatedMemberId || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    onSimulateMember(null);
                  } else {
                    const found = teamMembers.find((m) => m.id === val);
                    if (found) onSimulateMember(found);
                  }
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#fab518] cursor-pointer"
              >
                <option value="">Marcos Lancerotti (Dono)</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role || m.functionRole || 'Colaborador'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </aside>

        {/* PANE 2: MAIN CONVERSATION STREAM & COMPOSER */}
        <main
          className={`
            flex-1 min-w-0 flex flex-col h-full bg-white dark:bg-[#0f172a]
            ${mobileActiveView === 'chat' ? 'flex' : 'hidden md:flex'}
          `}
        >
          {/* Top Tray: Pinned Messages Bar */}
          {showPinnedDrawer && pinnedMessages.length > 0 && (
            <div className="bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200/90 dark:border-amber-900/60 px-4 py-2.5 max-h-40 overflow-y-auto space-y-1.5 shrink-0 animate-in fade-in duration-100">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-1.5">
                  <Pin size={12} className="text-amber-600 dark:text-amber-400 rotate-45" />
                  <span>Avisos Fixados no Canal ({pinnedMessages.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPinnedDrawer(false)}
                  className="text-amber-700 hover:text-amber-900 dark:text-amber-300 cursor-pointer p-0.5"
                >
                  <X size={13} />
                </button>
              </div>

              {pinnedMessages.map((pm) => (
                <div
                  key={`pinned-tray-${pm.id}`}
                  className="bg-white/90 dark:bg-slate-900/90 p-2 rounded-lg border border-amber-200 dark:border-amber-800/80 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {pm.senderName}{' '}
                      <span className="text-[10px] font-normal text-slate-500 font-mono tabular-nums">
                        · {pm.createdAt}
                      </span>
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 line-clamp-2 mt-0.5">
                      {pm.content}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePin(pm.id)}
                    className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer shrink-0"
                    title="Desafixar"
                  >
                    <Pin size={12} className="rotate-45" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search Result Feedback Bar */}
          {searchInChat && (
            <div className="px-4 py-1.5 bg-amber-50/70 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
              <span>
                Filtrando por <strong>"{searchInChat}"</strong> ({filteredMessages.length}{' '}
                {filteredMessages.length === 1 ? 'resultado' : 'resultados'})
              </span>
              <button
                type="button"
                onClick={() => setSearchInChat('')}
                className="text-amber-700 dark:text-amber-300 hover:underline cursor-pointer text-[11px] font-medium"
              >
                Limpar busca
              </button>
            </div>
          )}

          {/* Message List Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin">
            {loadingMessages ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 gap-2">
                <div className="w-4 h-4 border-2 border-[#fab518] border-t-transparent rounded-full animate-spin" />
                <span>Carregando histórico do canal...</span>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2.5">
                  <MessageSquare size={22} />
                </div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Nenhuma mensagem neste canal
                </h2>
                <p className="text-xs max-w-sm text-slate-500 dark:text-slate-400">
                  {searchInChat
                    ? `Nenhum resultado para "${searchInChat}".`
                    : `Inicie a conversa em #${currentChannel.name}. Envie uma mensagem abaixo para toda a equipe!`}
                </p>
              </div>
            ) : (
              filteredMessages.map((msg, index) => {
                const isMe = msg.senderId === effectiveUser.id;
                const prevMsg = filteredMessages[index - 1];
                const isSameAuthor =
                  prevMsg &&
                  prevMsg.senderId === msg.senderId &&
                  Math.abs(msg.timestamp - prevMsg.timestamp) < 5 * 60 * 1000;
                const reactions = msg.reactions || {};
                const hasReactions = Object.keys(reactions).length > 0;

                // Estilo 1: Fluxo Linear Corporativo (Slack / Linear / Discord)
                if (chatLayoutMode === 'linear') {
                  return (
                    <div
                      key={msg.id}
                      id={`msg-${msg.id}`}
                      className={`group relative flex gap-3 px-2 py-1 -mx-2 rounded-lg hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isSameAuthor ? 'mt-0.5' : 'mt-3'
                      }`}
                    >
                      {/* Avatar Column */}
                      <div className="w-8 shrink-0 flex flex-col items-center">
                        {!isSameAuthor ? (
                          msg.senderAvatar ? (
                            <img
                              src={msg.senderAvatar}
                              alt={msg.senderName}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#142142] text-[#fab518] text-xs font-bold flex items-center justify-center ring-1 ring-slate-200 dark:ring-slate-700">
                              {msg.senderName.charAt(0)}
                            </div>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 select-none font-mono tabular-nums pt-1">
                            {msg.createdAt.split(' ')[2] || ''}
                          </span>
                        )}
                      </div>

                      {/* Content Column */}
                      <div className="flex-1 min-w-0">
                        {/* Header if first in sequence */}
                        {!isSameAuthor && (
                          <div className="flex items-center gap-1.5 mb-0.5 text-xs">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {msg.senderName}
                            </span>
                            {msg.senderRole && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                · {msg.senderRole}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                              · {msg.createdAt}
                            </span>
                            {msg.isPinned && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-semibold ml-1">
                                <Pin size={10} className="rotate-45" /> Fixada
                              </span>
                            )}
                          </div>
                        )}

                        {/* Quoted reply box if present */}
                        {msg.replyTo && (
                          <div className="mb-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800/80 border-l-2 border-[#fab518] text-xs text-slate-600 dark:text-slate-300">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              ↳ {msg.replyTo.senderName}:
                            </span>{' '}
                            <span className="italic truncate">{msg.replyTo.content}</span>
                          </div>
                        )}

                        {/* Message Text */}
                        <div className="text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 select-text">
                          {renderMessageContent(msg.content)}
                        </div>

                        {/* Reaction Badges */}
                        {hasReactions && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {Object.entries(reactions).map(([emoji, userIds]) => {
                              const userReacted = userIds.includes(effectiveUser.id);
                              return (
                                <button
                                  key={`react-${msg.id}-${emoji}`}
                                  type="button"
                                  onClick={() => handleToggleReaction(msg.id, emoji)}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs transition-colors cursor-pointer border ${
                                    userReacted
                                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-semibold'
                                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                                  }`}
                                  title={`${userIds.length} pessoa(s) reagiram com ${emoji}`}
                                >
                                  <span>{emoji}</span>
                                  <span className="text-[10px] font-mono tabular-nums">{userIds.length}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Floating Message Action Bar (Hover) */}
                      <div className="absolute right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-0.5 gap-0.5 z-10">
                        {/* Emoji Reaction */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setShowEmojiPickerFor(showEmojiPickerFor === msg.id ? null : msg.id)
                            }
                            className="p-1 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                            title="Reagir"
                          >
                            <Smile size={13} />
                          </button>

                          {showEmojiPickerFor === msg.id && (
                            <div className="absolute bottom-full mb-1 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-lg flex items-center gap-1 z-30 animate-in fade-in zoom-in-95">
                              {EMOJI_PALETTE.slice(0, 8).map((emoji) => (
                                <button
                                  key={`emoji-${emoji}`}
                                  type="button"
                                  onClick={() => handleToggleReaction(msg.id, emoji)}
                                  className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-xs transition-transform hover:scale-125 cursor-pointer"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Responder (Reply) */}
                        <button
                          type="button"
                          onClick={() => handleReplyMessage(msg)}
                          className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                          title="Responder"
                        >
                          <Reply size={13} />
                        </button>

                        {/* Pin Message Toggle */}
                        <button
                          type="button"
                          onClick={() => handleTogglePin(msg.id)}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            msg.isPinned
                              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                              : 'text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                          title={msg.isPinned ? 'Desafixar' : 'Fixar'}
                        >
                          <Pin size={13} className={msg.isPinned ? 'rotate-45' : ''} />
                        </button>

                        {/* Copy Text */}
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg)}
                          className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                          title="Copiar texto"
                        >
                          {copiedMessageId === msg.id ? (
                            <Check size={13} className="text-emerald-500" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>

                        {/* Delete Message (Author or Master) */}
                        {(isMe || effectiveUser.id === currentUser.id) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors cursor-pointer"
                            title="Apagar"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                // Estilo 2: Modo Balões (WhatsApp)
                return (
                  <div
                    key={msg.id}
                    id={`msg-${msg.id}`}
                    className={`group relative flex gap-3 transition-colors ${
                      isSameAuthor ? 'mt-1' : 'mt-4'
                    } ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Author Avatar */}
                    <div className="w-8 shrink-0 flex flex-col items-center">
                      {!isSameAuthor ? (
                        msg.senderAvatar ? (
                          <img
                            src={msg.senderAvatar}
                            alt={msg.senderName}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#142142] text-[#fab518] text-xs font-bold flex items-center justify-center ring-1 ring-slate-200 dark:ring-slate-700">
                            {msg.senderName.charAt(0)}
                          </div>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 select-none pt-1 font-mono tabular-nums">
                          {msg.createdAt.split(' ')[2] || ''}
                        </span>
                      )}
                    </div>

                    {/* Bubble Content Box */}
                    <div className={`max-w-[82%] sm:max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isSameAuthor && (
                        <div className={`flex items-center gap-1.5 mb-1 text-[11px] ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {msg.senderName}
                          </span>
                          {msg.senderRole && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              · {msg.senderRole}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                            · {msg.createdAt}
                          </span>
                          {msg.isPinned && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-semibold">
                              <Pin size={10} className="rotate-45" /> Fixada
                            </span>
                          )}
                        </div>
                      )}

                      {/* Quoted reply box */}
                      {msg.replyTo && (
                        <div
                          className={`mb-1 px-3 py-1 rounded text-xs border-l-2 border-[#fab518] ${
                            isMe
                              ? 'bg-slate-800 text-slate-200'
                              : 'bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="font-semibold">↳ {msg.replyTo.senderName}:</span>{' '}
                          <span className="italic truncate">{msg.replyTo.content}</span>
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-xs sm:text-[13px] leading-relaxed break-words shadow-2xs ${
                          isMe
                            ? 'bg-[#142142] text-white dark:bg-[#fab518] dark:text-[#142142] rounded-tr-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/80 dark:border-slate-700/80'
                        }`}
                      >
                        {renderMessageContent(msg.content)}
                      </div>

                      {/* Reactions */}
                      {hasReactions && (
                        <div className={`flex flex-wrap gap-1 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {Object.entries(reactions).map(([emoji, userIds]) => {
                            const userReacted = userIds.includes(effectiveUser.id);
                            return (
                              <button
                                key={`react-${msg.id}-${emoji}`}
                                type="button"
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors cursor-pointer border ${
                                  userReacted
                                    ? 'bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-bold'
                                    : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span className="text-[10px] font-mono tabular-nums">{userIds.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Floating Message Action Toolbar */}
                    <div
                      className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-0.5 gap-0.5 z-10 ${
                        isMe ? 'left-10' : 'right-4'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setShowEmojiPickerFor(showEmojiPickerFor === msg.id ? null : msg.id)
                        }
                        className="p-1 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                        title="Reagir"
                      >
                        <Smile size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReplyMessage(msg)}
                        className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                        title="Responder"
                      >
                        <Reply size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTogglePin(msg.id)}
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          msg.isPinned
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                            : 'text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                        title={msg.isPinned ? 'Desafixar' : 'Fixar'}
                      >
                        <Pin size={13} className={msg.isPinned ? 'rotate-45' : ''} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg)}
                        className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                        title="Copiar texto"
                      >
                        {copiedMessageId === msg.id ? (
                          <Check size={13} className="text-emerald-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>

                      {(isMe || effectiveUser.id === currentUser.id) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors cursor-pointer"
                          title="Apagar"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing Indicator Bar */}
            {Object.keys(typingUsers).length > 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1 pl-11">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fab518] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fab518] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fab518] animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>
                  {Object.values(typingUsers).join(', ')} está digitando...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ================================================================ */}
          {/* COMPOSER DOCK (Enterprise Markdown, Shortcuts, Quotes & Emojis) */}
          {/* ================================================================ */}
          <div className="p-3 sm:p-4 border-t border-slate-200/90 dark:border-slate-800/90 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
            
            {/* Active Replying / Quote banner */}
            {replyingTo && (
              <div className="mb-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between text-xs animate-in fade-in duration-100">
                <div className="flex items-center gap-2 min-w-0">
                  <Reply size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-amber-900 dark:text-amber-200">
                    Respondendo a <strong>@{replyingTo.senderName}</strong>:
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 truncate max-w-xs sm:max-w-md">
                    "{replyingTo.content}"
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer p-0.5"
                  title="Cancelar resposta"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Input Composer Box with Integrated Formatting Bar */}
            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs focus-within:ring-1 focus-within:ring-[#fab518] focus-within:border-transparent transition-all overflow-hidden">
                
                {/* Textarea */}
                <textarea
                  ref={composerTextareaRef}
                  value={messageText}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                  placeholder={`Conversar em #${currentChannel.name}... (Enter para enviar)`}
                  className="w-full resize-none p-3 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />

                {/* Bottom Formatting Toolbar */}
                <div className="px-2.5 py-1.5 bg-slate-50/60 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  
                  {/* Formatting Buttons */}
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <button
                      type="button"
                      onClick={() => insertFormatting('**', '**')}
                      className="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                      title="Negrito (**texto**)"
                    >
                      <Bold size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('*', '*')}
                      className="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                      title="Itálico (*texto*)"
                    >
                      <Italic size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('`', '`')}
                      className="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                      title="Código (`código`)"
                    >
                      <Code size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('> ')}
                      className="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                      title="Citação (> texto)"
                    >
                      <Quote size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('- ')}
                      className="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                      title="Lista (- item)"
                    >
                      <List size={13} />
                    </button>

                    <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-800 mx-1" />

                    {/* Quick Emoji Menu Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowComposerEmojis(!showComposerEmojis)}
                        className="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                        title="Inserir emoji"
                      >
                        <Smile size={13} />
                      </button>

                      {showComposerEmojis && (
                        <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 shadow-xl grid grid-cols-6 gap-1 z-30 animate-in fade-in zoom-in-95 w-48">
                          {EMOJI_PALETTE.map((em) => (
                            <button
                              key={`comp-em-${em}`}
                              type="button"
                              onClick={() => {
                                setMessageText((prev) => prev + em);
                                setShowComposerEmojis(false);
                                composerTextareaRef.current?.focus();
                              }}
                              className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-sm transition-transform hover:scale-125 cursor-pointer"
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Send Button & Helper Text */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 hidden lg:inline font-mono">
                      Shift + Enter para quebra
                    </span>

                    <button
                      type="submit"
                      disabled={sending || !messageText.trim()}
                      className="px-3.5 py-1.5 bg-[#fab518] hover:bg-[#e0a215] text-[#142142] font-bold rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-xs"
                      title="Enviar mensagem (Enter)"
                    >
                      <span>Enviar</span>
                      <Send size={12} className={sending ? 'animate-pulse' : ''} />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </main>

        {/* PANE 3: INSPECTOR (PRESENCE, PINNED MESSAGES, & CHANNEL DETAILS) */}
        {showRightPanel && (
          <aside className="hidden lg:flex w-64 xl:w-72 border-l border-slate-200/90 dark:border-slate-800/90 bg-slate-50/60 dark:bg-[#0c1424]/90 flex-col shrink-0">
            
            {/* Inspector Tab Switcher */}
            <div className="p-2 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center bg-slate-100/70 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={() => setRightPanelTab('members')}
                className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  rightPanelTab === 'members'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Membros
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab('pinned')}
                className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  rightPanelTab === 'pinned'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Fixadas ({pinnedMessages.length})
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab('about')}
                className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  rightPanelTab === 'about'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Canal
              </button>
            </div>

            {/* TAB 1: MEMBERS & LIVE PRESENCE */}
            {rightPanelTab === 'members' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-none">
                
                {/* Online Counter Header */}
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span>Colaboradores</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                    <Circle size={6} className="fill-emerald-500 text-emerald-500" />
                    {onlineUsers.length || 1} online
                  </span>
                </div>

                {/* Agency Owner Card */}
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-[#fab518]"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-[#0c1424]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        Proprietário da Agência
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 shrink-0">
                    Líder
                  </span>
                </div>

                {/* Team Members List */}
                <div className="space-y-1">
                  {teamMembers
                    .filter((m) => m.id !== currentUser.id)
                    .map((member) => {
                      const online = isUserOnline(member.id);
                      return (
                        <div
                          key={`presence-item-${member.id}`}
                          onClick={() => handleStartDM(member)}
                          className="p-2 rounded-lg bg-white/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2 transition-colors cursor-pointer group shadow-2xs"
                          title={`Conversar com ${member.name}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="relative shrink-0">
                              {member.avatar ? (
                                <img
                                  src={member.avatar}
                                  alt={member.name}
                                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white font-semibold text-xs flex items-center justify-center">
                                  {member.name.charAt(0)}
                                </div>
                              )}
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-white dark:ring-[#0c1424] ${
                                  online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                                }`}
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                                {member.name}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {member.role || member.functionRole || 'Colaborador'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="p-1 text-slate-400 hover:text-amber-500 rounded transition-colors cursor-pointer"
                            title="Mensagem Direta"
                          >
                            <AtSign size={13} />
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* TAB 2: PINNED MESSAGES BOARD */}
            {rightPanelTab === 'pinned' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-none">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Mural de Fixadas
                </div>

                {pinnedMessages.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    <Pin size={18} className="mx-auto mb-2 opacity-50 rotate-45" />
                    <p>Nenhuma mensagem fixada neste canal.</p>
                  </div>
                ) : (
                  pinnedMessages.map((pm) => (
                    <div
                      key={`side-pin-${pm.id}`}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {pm.senderName}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleTogglePin(pm.id)}
                          className="text-slate-400 hover:text-amber-500 cursor-pointer"
                          title="Desafixar"
                        >
                          <Pin size={12} className="rotate-45" />
                        </button>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {pm.content}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono tabular-nums block">
                        {pm.createdAt}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: ABOUT CHANNEL */}
            {rightPanelTab === 'about' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs scrollbar-none">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Nome do Canal
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {currentChannel.name}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Objetivo
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {currentChannel.description || 'Canal para comunicados operacionais da agência.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Total de Mensagens:</span>
                    <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                      {messages.length}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Mensagens Fixadas:</span>
                    <strong className="font-mono tabular-nums text-amber-600 dark:text-amber-400">
                      {pinnedMessages.length}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Visibilidade:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {currentChannel.isPrivate ? 'Privado (Restrito)' : 'Público na Agência'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Protocolo:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      WebSocket wss://
                    </span>
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 3. MODAL: CRIAR NOVO CANAL */}
      {/* ==================================================================== */}
      {showNewChannelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0c1424] rounded-2xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-[#fab518] flex items-center justify-center font-bold border border-amber-300/80 dark:border-amber-700/60">
                  <Hash size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Criar Novo Canal
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Ambiente dedicado para tópicos ou equipes da agência
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewChannelModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Canal *
                </label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="Ex: Tráfego Pago, Reuniões, Brainstorm"
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#fab518]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Finalidade / Descrição
                </label>
                <input
                  type="text"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="Finalidade e pautas deste canal"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#fab518]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ícone Temático
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'Hash', icon: Hash, label: 'Geral' },
                    { id: 'Kanban', icon: Kanban, label: 'Projetos' },
                    { id: 'Palette', icon: Palette, label: 'Criação' },
                    { id: 'Users', icon: Users, label: 'Equipe' },
                  ].map((ic) => {
                    const IconComp = ic.icon;
                    return (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => setNewChannelIcon(ic.id)}
                        className={`p-2 rounded-lg border flex flex-col items-center gap-1 text-xs font-medium transition-all cursor-pointer ${
                          newChannelIcon === ic.id
                            ? 'border-[#fab518] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <IconComp size={15} />
                        <span className="text-[10px]">{ic.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Private Channel Toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Lock size={15} className="text-purple-500" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Canal Restrito / Privado
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Apenas membros convidados poderão visualizar
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newChannelIsPrivate}
                  onChange={(e) => setNewChannelIsPrivate(e.target.checked)}
                  className="w-4 h-4 text-[#fab518] rounded border-slate-300 focus:ring-[#fab518] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewChannelModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newChannelName.trim()}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#fab518] hover:bg-[#e0a215] text-[#142142] rounded-lg shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  Criar Canal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
