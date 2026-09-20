import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Film, 
  Image as ImageIcon, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  File,
  Eye,
  Download,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  X
} from 'lucide-react';
import { DemandAttachment } from '../types';
import { scanFileForMalware, FileScanResult } from '../utils/securityProtocols';
import { processAttachmentFile } from '../utils/fileUtils';

interface FileUploadDropzoneProps {
  attachments: DemandAttachment[];
  onAddAttachment: (attachment: DemandAttachment) => void;
  onRemoveAttachment: (id: string) => void;
  maxSizeBytes?: number; // Default 200MB (200 * 1024 * 1024)
}

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  maxSizeBytes = 200 * 1024 * 1024, // 200MB
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<DemandAttachment | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningName, setScanningName] = useState<string | null>(null);
  const [blockedThreat, setBlockedThreat] = useState<FileScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processFile = async (file: File) => {
    setErrorMessage(null);
    setBlockedThreat(null);

    // Validate size (max 200MB)
    if (file.size > maxSizeBytes) {
      setErrorMessage(`O arquivo "${file.name}" excede o limite máximo permitido de 200MB (${formatFileSize(file.size)}).`);
      return;
    }

    // Run Real-Time Antivirus & Malware Scanning
    setIsScanning(true);
    setScanningName(file.name);

    try {
      const scanResult = await scanFileForMalware(file);

      if (!scanResult.safe) {
        setIsScanning(false);
        setScanningName(null);
        setBlockedThreat(scanResult);
        return;
      }

      // Process file (converts image into durable Base64 and validates format)
      const newAttachment = await processAttachmentFile(file);
      onAddAttachment(newAttachment);
    } catch (err) {
      setErrorMessage(`Falha na verificação de integridade do arquivo "${file.name}".`);
    } finally {
      setIsScanning(false);
      setScanningName(null);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      await processFile(files[i]);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={20} className="text-emerald-500" />;
      case 'video':
        return <Film size={20} className="text-rose-500" />;
      case 'document':
        return <FileText size={20} className="text-blue-500" />;
      default:
        return <File size={20} className="text-amber-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div className="flex items-center justify-between text-xs px-1">
        <span className="font-bold text-[#142142]">Anexar Mídias e Arquivos</span>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          <ShieldCheck size={13} className="text-emerald-600" />
          <span>Antivírus & Heurística Ativos</span>
        </span>
      </div>

      <div
        id="demand-file-dropzone"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all select-none relative
          ${isDragOver 
            ? 'border-[#fab518] bg-amber-50/70 scale-[0.99] shadow-inner' 
            : 'border-slate-300 hover:border-[#fab518] hover:bg-slate-50/80 bg-[#FAFAFA]'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
          accept="image/*,video/*,.pdf,.doc,.docx,.zip,.rar,.psd,.ai,.fig"
        />

        <div className="max-w-md mx-auto space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-[#142142] flex items-center justify-center mx-auto shadow-xs">
            {isScanning ? (
              <Loader2 size={24} className="text-[#fab518] animate-spin" />
            ) : (
              <UploadCloud size={24} className="text-[#fab518]" />
            )}
          </div>

          <div>
            <p className="text-sm font-bold text-[#142142]">
              {isScanning ? 'Escaneando arquivo com Antivírus...' : 'Clique para selecionar ou arraste arquivos aqui'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isScanning 
                ? `Inspecionando assinaturas binárias e scripts de "${scanningName}"` 
                : 'Imagens (PNG, JPG), vídeos (MP4), PDFs e criativos até 200MB protegidos contra malware'
              }
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
              Imagens
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
              Vídeos
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
              PDFs & Documentos
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1">
              <ShieldCheck size={11} />
              Varredura Ativa
            </span>
          </div>
        </div>
      </div>

      {/* Active Scanning Status Banner */}
      {isScanning && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2.5 animate-pulse">
          <Loader2 size={16} className="text-amber-600 animate-spin shrink-0" />
          <div className="flex-1">
            <p className="font-bold">Varredura Antivírus em Progresso...</p>
            <p className="text-[11px] text-amber-700">Checando integridade, extensões perigosas e executáveis disfarçados em "{scanningName}".</p>
          </div>
        </div>
      )}

      {/* Blocked Threat Security Alert Modal/Banner */}
      {blockedThreat && (
        <div 
          id="malware-blocked-alert"
          className="p-4 bg-red-950/90 border-2 border-red-500 rounded-2xl text-xs text-white shadow-xl shadow-red-950/40 space-y-2 animate-in fade-in"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-red-400 font-black text-sm">
              <ShieldAlert size={20} className="text-red-400 shrink-0" />
              <span>AMEAÇA DE MALWARE / VÍRUS BLOQUEADA</span>
            </div>
            <button
              type="button"
              onClick={() => setBlockedThreat(null)}
              className="text-red-300 hover:text-white p-1 rounded-md"
            >
              <X size={16} />
            </button>
          </div>

          <div className="bg-red-900/50 p-3 rounded-xl border border-red-800/80 space-y-1">
            <p className="font-bold text-red-200 text-xs">
              Arquivo: <span className="font-mono text-white">{blockedThreat.fileName}</span>
            </p>
            <p className="text-red-200 text-xs">
              Diagnóstico: <strong className="text-amber-300">{blockedThreat.threatName}</strong>
            </p>
            <p className="text-[11px] text-red-300/90 leading-relaxed">
              {blockedThreat.message}
            </p>
          </div>

          <p className="text-[11px] text-slate-300">
            {blockedThreat.recommendation} O incidente foi registrado no Log de Auditoria de Segurança.
          </p>
        </div>
      )}

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0 text-red-500" />
          <span className="font-semibold flex-1">{errorMessage}</span>
          <button 
            type="button" 
            onClick={() => setErrorMessage(null)} 
            className="text-red-500 hover:text-red-700 font-bold text-xs"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#142142]">
              Arquivos Anexados ({attachments.length})
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              Total: {formatFileSize(attachments.reduce((acc, curr) => acc + curr.size, 0))}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {attachments.map((file) => (
              <div
                key={file.id}
                className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-300 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200/80">
                    {file.type === 'image' && file.url?.trim() ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getFileIcon(file.type)
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#142142] truncate group-hover:text-[#fab518] transition-colors" title={file.name}>
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatFileSize(file.size)}
                      </span>
                      {file.verifiedClean && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded">
                          <ShieldCheck size={10} className="text-emerald-600" />
                          Seguro
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {file.type === 'image' && (
                    <button
                      type="button"
                      onClick={() => setPreviewItem(file)}
                      title="Visualizar"
                      className="p-1.5 text-slate-400 hover:text-[#142142] hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                  )}
                  <a
                    href={file.url}
                    download={file.name}
                    title="Baixar arquivo"
                    className="p-1.5 text-slate-400 hover:text-[#142142] hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Download size={14} />
                  </a>
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(file.id)}
                    title="Remover anexo"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewItem && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div className="bg-white rounded-2xl overflow-hidden max-w-2xl max-h-[85vh] flex flex-col p-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-slate-100">
              <span className="text-xs font-bold text-[#142142] truncate max-w-sm">
                {previewItem.name}
              </span>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg"
              >
                Fechar
              </button>
            </div>
            <div className="p-3 overflow-auto flex items-center justify-center">
              {previewItem.url?.trim() ? (
                <img
                  src={previewItem.url}
                  alt={previewItem.name}
                  className="max-h-[65vh] object-contain rounded-lg"
                />
              ) : (
                <div className="text-slate-400 text-xs p-4">Pré-visualização não disponível</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
