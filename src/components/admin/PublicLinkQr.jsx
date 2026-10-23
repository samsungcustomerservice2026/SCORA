'use client';

import { useRef } from 'react';
import QRCode from 'react-qr-code';
import { Download } from 'lucide-react';

const EXPORT_PX = 1024;
const EXPORT_MARGIN = 64;

/** QR for a public URL, with a print-ready PNG download (white quiet zone included). */
export default function PublicLinkQr({ url, fileName = 'scora-qr', label = 'QR code', onError }) {
  const wrapRef = useRef(null);

  const downloadPng = () => {
    const svg = wrapRef.current?.querySelector('svg');
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = EXPORT_PX + EXPORT_MARGIN * 2;
      canvas.height = EXPORT_PX + EXPORT_MARGIN * 2;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, EXPORT_MARGIN, EXPORT_MARGIN, EXPORT_PX, EXPORT_PX);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${fileName}.png`;
      a.click();
    };
    img.onerror = () => onError?.();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  };

  return (
    <div className="flex items-center gap-3">
      <div ref={wrapRef} className="w-24 h-24 flex-shrink-0 rounded-lg bg-white p-1.5" aria-label={label} role="img">
        <QRCode value={url} size={256} level="M" className="w-full h-full" />
      </div>
      <button
        type="button"
        onClick={downloadPng}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 text-[9px] font-black uppercase tracking-widest hover:text-white hover:bg-zinc-800 transition-all"
      >
        <Download className="w-3.5 h-3.5" />
        Download QR
      </button>
    </div>
  );
}
