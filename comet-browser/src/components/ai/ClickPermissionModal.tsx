import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointerClick, Zap, Eye, Brain, X } from 'lucide-react';

interface ClickPermissionModalProps {
  context: {
    action: string;
    target: string;
    reason: string;
    risk: 'low' | 'medium' | 'high';
    actionType?: string;
    what?: string;
    highRiskQr?: string | null;  // Now expects a JSON string with {qrImage, pin, token}
  };
  onAllow: (alwaysAllow?: boolean) => void;
  onDeny: () => void;
}

const RISK_CONFIG = {
  low: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Low Risk', icon: '🟢' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Medium Risk', icon: '🟡' },
  high: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'High Risk', icon: '🔴' },
};

const ClickPermissionModal = memo(function ClickPermissionModal({ context, onAllow, onDeny }: ClickPermissionModalProps) {
  const [alwaysAllow, setAlwaysAllow] = React.useState(false);
  const risk = RISK_CONFIG[context.risk || 'medium'];

  let qrData = null;
  if (context.highRiskQr) {
    try {
      qrData = JSON.parse(context.highRiskQr);
    } catch (_) {
      qrData = { qrImage: context.highRiskQr, pin: '' };
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 12 }}
      className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d0d1a] shadow-2xl overflow-hidden backdrop-blur-2xl"
    >
      {/* Header */}
      <div className={`flex items-center gap-3 px-5 py-4 border-b border-white/5 ${risk.bg}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${risk.bg} border ${risk.border}`}>
           {context.actionType === 'CLICK_ELEMENT' ? '🖱️' :
            context.actionType === 'FIND_AND_CLICK' ? '🔍' :
            context.actionType === 'FILL_FORM' ? '✏️' :
            context.actionType === 'OPEN_APP' ? '🚀' :
            context.actionType === 'READ_PAGE_CONTENT' ? '📖' : '⚡'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-black uppercase tracking-widest text-white/40">AI wants to interact</div>
          <div className="text-sm font-bold text-white truncate mt-0.5">{context.action}</div>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex-shrink-0 ${risk.bg} ${risk.color} border ${risk.border}`}>
           {risk.label}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">What</div>
          <div className="text-sm text-white/80 leading-relaxed font-medium">
            {context.what || context.action}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Why</div>
          <div className="text-sm text-white/60 leading-relaxed italic">
            {context.reason}
          </div>
        </div>

        {context.target && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Target</div>
            <div className="text-[11px] font-mono text-sky-300/80 bg-sky-500/5 border border-sky-500/10 rounded-lg px-3 py-2 break-all">
               {context.target.length > 120 ? context.target.substring(0, 120) + '...' : context.target}
            </div>
          </div>
        )}

        {context.risk === 'high' && qrData?.qrImage && (
          <div className="pt-2 border-t border-red-500/10 flex flex-col items-center">
            <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 animate-pulse">
              🚨 High Risk: Scan to Authorize on Mobile
            </div>
            <div className="p-3 bg-white rounded-xl shadow-2xl">
               <img src={qrData.qrImage} alt="Authorize" className="w-32 h-32" />
            </div>
            {qrData.pin && (
              <div className="mt-4 flex flex-col items-center">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Match this PIN on mobile</span>
                <span className="text-xl font-mono font-black tracking-[0.4em] text-white mt-1 bg-white/5 py-1 px-4 rounded-lg border border-white/10">{qrData.pin}</span>
              </div>
            )}
            <p className="text-[10px] text-white/30 text-center mt-3 leading-relaxed">
              Scanning opens **Comet Mobile** <br/> to safely verify this action.
            </p>
          </div>
        )}
      </div>

      {/* "Remember Choice" for non-high risk */}
      {context.risk !== 'high' && (
        <label className="px-5 py-2 flex items-center gap-3 cursor-pointer group">
          <div 
            onClick={() => setAlwaysAllow(!alwaysAllow)}
            className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${alwaysAllow ? 'bg-sky-500 border-sky-500 text-white' : 'border-white/10 bg-white/5 group-hover:border-white/20'}`}
          >
            {alwaysAllow && <Zap size={12} fill="currentColor" />}
          </div>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest group-hover:text-white/60 transition-colors">Remember my choice for this action</span>
          <input 
            type="checkbox" 
            className="hidden" 
            checked={alwaysAllow} 
            onChange={(e) => setAlwaysAllow(e.target.checked)} 
          />
        </label>
      )}

      {/* Buttons */}
      <div className="px-5 pb-5 flex gap-3">
        <button
          onClick={onDeny}
          className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-white/60 hover:bg-white/10 hover:text-white transition-all"
        >
          ✕ Deny
        </button>
        <button
          onClick={() => onAllow(alwaysAllow)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${
            context.risk === 'high' ? 'bg-red-500/80 hover:bg-red-500 text-white' :
            context.risk === 'medium' ? 'bg-amber-500/80 hover:bg-amber-500 text-white' :
            'bg-sky-500/80 hover:bg-sky-500 text-white'
          }`}
        >
          ✓ Allow
        </button>
      </div>

      {/* Shift+Tab shortcut hint for low/medium risk */}
      {context.risk !== 'high' && (
        <div className="px-5 pb-4 flex items-center justify-center gap-2">
          <kbd className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-mono text-white/30">
            Shift
          </kbd>
          <span className="text-[9px] text-white/20">+</span>
          <kbd className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-mono text-white/30">
            Tab
          </kbd>
          <span className="text-[9px] text-white/20 uppercase tracking-widest">to quick-allow</span>
        </div>
      )}
    </motion.div>
  );
});

export default ClickPermissionModal;
