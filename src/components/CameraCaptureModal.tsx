import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, Upload, Sparkles, Check, AlertCircle, Scan, Image as ImageIcon } from 'lucide-react';
import { extractTextFromImage } from '../services/ocrService';
import { OCRResult } from '../types';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ocrResult: OCRResult, fotoUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  
  // Estados do OCR
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Iniciar câmera quando o modal abrir
  useEffect(() => {
    if (isOpen && !capturedPhoto) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, capturedPhoto]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada neste navegador ou ambiente.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Erro ao acessar a câmera:', err);
      setCameraError(
        'Não foi possível acessar a câmera do dispositivo. Verifique as permissões ou envie uma foto do arquivo/galeria.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capturar foto do stream de vídeo
  const tirarFoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPhoto(dataUrl);
    stopCamera();
    processarOCR(dataUrl);
  };

  // Carregar imagem de arquivo/galeria
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCapturedPhoto(result);
        stopCamera();
        processarOCR(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Executar OCR na imagem
  const processarOCR = async (imageSrc: string) => {
    setIsProcessing(true);
    setProgressPercent(10);
    setStatusMessage('Otimizando imagem para leitura...');
    setOcrResult(null);

    try {
      const result = await extractTextFromImage(imageSrc, (pct, msg) => {
        setProgressPercent(pct);
        setStatusMessage(msg);
      });
      setOcrResult(result);
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Não foi possível ler automaticamente. Você poderá preencher manualmente.');
      setOcrResult({
        rawText: '',
        validadeDetectada: undefined,
        loteDetectado: undefined
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Criador de imagens sintéticas de teste para testes rápidos sem câmera
  const carregarExemploTeste = (exemploTipo: 'leite' | 'cafe' | 'remedio') => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fundo simulando embalagem
    if (exemploTipo === 'leite') {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, canvas.width, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Arial';
      ctx.fillText('LEITE INTEGRAL UHT 1L', 40, 65);

      // Caixa de carimbo da validade e lote
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(100, 160, 600, 200);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.strokeRect(100, 160, 600, 200);

      // Carimbo dot-matrix preto
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 38px monospace';
      ctx.fillText('FAB: 12/03/2026', 150, 230);
      ctx.fillText('VAL: 12/09/2026', 150, 290);
      ctx.fillText('LOTE: LT24980', 150, 340);
    } else if (exemploTipo === 'cafe') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 36px Arial';
      ctx.fillText('CAFE PREMIUM 500G', 40, 65);

      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(100, 160, 600, 200);
      ctx.fillStyle = '#1c1917';
      ctx.font = 'bold 40px monospace';
      ctx.fillText('LOTE: CP8841-A', 150, 240);
      ctx.fillText('VENC: 30/11/2026', 150, 310);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, 0, canvas.width, 90);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Arial';
      ctx.fillText('LABORATORIO - USO ORAL', 40, 60);

      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(80, 140, 640, 220);
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 36px monospace';
      ctx.fillText('PARTIDA / LOTE: MED-904', 120, 210);
      ctx.fillText('VALIDADE: 28/02/2027', 120, 280);
      ctx.fillText('7891000100103', 120, 340);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedPhoto(dataUrl);
    stopCamera();
    processarOCR(dataUrl);
  };

  const handleConfirmar = () => {
    if (capturedPhoto) {
      onSuccess(
        ocrResult || {
          rawText: '',
          validadeDetectada: undefined,
          loteDetectado: undefined
        },
        capturedPhoto
      );
      handleFechar();
    }
  };

  const handleTentarNovamente = () => {
    setCapturedPhoto(null);
    setOcrResult(null);
    startCamera();
  };

  const handleFechar = () => {
    stopCamera();
    setCapturedPhoto(null);
    setOcrResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Leitor de Validade e Lote por Foto</h2>
              <p className="text-xs text-slate-400">Aponte a câmera para os dados impressos na embalagem</p>
            </div>
          </div>
          <button
            onClick={handleFechar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo: Visor da Câmera ou Preview da Foto */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] sm:min-h-[380px] overflow-hidden">
          {!capturedPhoto ? (
            /* Stream da Câmera */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover max-h-[460px]"
              />

              {/* Guia de mira / Viewfinder */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                <div className="w-full max-w-md h-48 border-2 border-dashed border-emerald-400/80 rounded-2xl bg-emerald-500/5 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] flex flex-col justify-between p-3">
                  <div className="flex justify-between items-center text-[11px] text-emerald-300 font-medium">
                    <span className="flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded-md">
                      <Scan className="w-3.5 h-3.5" /> Enquadre LOTE e VALIDADE
                    </span>
                    <span className="bg-black/70 px-2 py-0.5 rounded-md font-mono text-[10px]">
                      OCR ATIVO
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] bg-black/70 text-slate-200 px-3 py-1 rounded-full">
                      Mantenha a foto nítida e iluminada
                    </span>
                  </div>
                </div>
              </div>

              {/* Erro de Câmera (se houver) */}
              {cameraError && (
                <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
                  <p className="text-sm font-semibold text-slate-200 max-w-md mb-4">{cameraError}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg"
                  >
                    <Upload className="w-4 h-4" /> Escolher Foto da Galeria
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Preview da Foto Capturada com Feedback de OCR */
            <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
              <img
                src={capturedPhoto}
                alt="Foto capturada"
                className="max-h-[360px] w-auto object-contain rounded-lg"
              />

              {/* Overlay de Processamento do OCR */}
              {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-14 h-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin mb-4" />
                  <p className="text-base font-bold text-white mb-1">Processando OCR Inteligente</p>
                  <p className="text-xs text-slate-300 mb-3">{statusMessage}</p>
                  <div className="w-64 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono mt-2">{progressPercent}%</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resultado Detectado pelo OCR (quando a foto já foi tirada) */}
        {capturedPhoto && !isProcessing && ocrResult && (
          <div className="bg-slate-800/95 border-t border-slate-700/80 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Dados Identificados pelo OCR
              </span>
              {ocrResult.confianca && (
                <span className="text-[11px] text-slate-400">
                  Precisão: <strong className="text-slate-200">{Math.round(ocrResult.confianca)}%</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-2.5">
                <span className="text-[11px] text-slate-400 block mb-0.5">Validade Encontrada</span>
                {ocrResult.validadeDetectada ? (
                  <span className="text-base font-black text-emerald-400 font-mono">
                    {ocrResult.validadeDetectada.split('-').reverse().join('/')}
                  </span>
                ) : (
                  <span className="text-xs text-amber-400 italic">Não detectada automaticamente</span>
                )}
              </div>

              <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-2.5">
                <span className="text-[11px] text-slate-400 block mb-0.5">Lote Encontrado</span>
                {ocrResult.loteDetectado ? (
                  <span className="text-base font-black text-teal-400 font-mono">
                    {ocrResult.loteDetectado}
                  </span>
                ) : (
                  <span className="text-xs text-amber-400 italic">Não detectado automaticamente</span>
                )}
              </div>
            </div>

            {/* Texto bruto lido (para conferência rápida) */}
            {ocrResult.rawText && (
              <details className="text-[11px] text-slate-400 cursor-pointer">
                <summary className="hover:text-slate-200">Ver texto lido na íntegra</summary>
                <div className="p-2 bg-slate-950 rounded-lg font-mono text-[10px] text-slate-300 mt-1 whitespace-pre-wrap max-h-24 overflow-y-auto">
                  {ocrResult.rawText}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Barra de Controles e Ações Inferior */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Input oculto de arquivo */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />

          {!capturedPhoto ? (
            <>
              {/* Opções de Teste Rápido / Alternar Câmera / Carregar Arquivo */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  Galeria/Arquivo
                </button>

                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
                  title="Trocar câmera"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                {/* Dropdown / Botões de Teste Simulado */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400 hidden xs:inline">Testar com:</span>
                  <button
                    onClick={() => carregarExemploTeste('leite')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 rounded border border-slate-700"
                    title="Simular foto de caixa de leite"
                  >
                    Ex. Leite
                  </button>
                  <button
                    onClick={() => carregarExemploTeste('cafe')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 rounded border border-slate-700"
                    title="Simular foto de pacote de café"
                  >
                    Ex. Café
                  </button>
                </div>
              </div>

              {/* Botão Principal de Disparo */}
              <button
                onClick={tirarFoto}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition"
              >
                <Camera className="w-5 h-5 stroke-[2.5]" />
                Tirar Foto Agora
              </button>
            </>
          ) : (
            <>
              {/* Botões pós-captura */}
              <button
                onClick={handleTentarNovamente}
                disabled={isProcessing}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition border border-slate-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                Tirar Outra Foto
              </button>

              <button
                onClick={handleConfirmar}
                disabled={isProcessing}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition disabled:opacity-50"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                Continuar para Planilha
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
