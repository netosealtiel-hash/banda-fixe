import React, { useEffect, useState } from 'react';
import { Banknote, Megaphone, ShieldCheck, Users, X } from 'lucide-react';
import { formatKz } from '../game/simulation';
import { GlobalAnnouncement } from '../game/types';

interface AdminPlayerRow {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: number;
  accountAgeDays: number;
  moneyKz: number;
  bankKz: number;
  municipalityId: string;
  profession: string;
}

interface AdminPanelModalProps {
  token: string;
  ownerEmail: string;
  onClose: () => void;
  onMoneyUpdated: (targetEmail: string, amountKz: number, newBalanceKz?: number) => void;
  onAnnouncementsUpdated: (announcements: GlobalAnnouncement[]) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  token,
  ownerEmail,
  onClose,
  onMoneyUpdated,
  onAnnouncementsUpdated,
}) => {
  const [players, setPlayers] = useState<AdminPlayerRow[]>([]);
  const [targetEmail, setTargetEmail] = useState(ownerEmail);
  const [amountInput, setAmountInput] = useState('500000');
  const [broadcastInput, setBroadcastInput] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadPlayers = async () => {
    try {
      const res = await fetch('/api/admin/players', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.players || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const handleGiveMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountKz = Number(amountInput);
    if (!Number.isFinite(amountKz) || amountKz === 0) return;

    const res = await fetch('/api/admin/give-money', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetEmail, amountKz }),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.players) setPlayers(data.players);
      onMoneyUpdated(targetEmail, amountKz, data.newBalanceKz);
      setStatusMsg(`Enviado ${formatKz(amountKz)} para ${targetEmail === 'all' ? 'TODOS os jogadores' : targetEmail}!`);
    } else {
      setStatusMsg(data.error || 'Erro ao enviar Kwanzas.');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastInput.trim()) return;
    const res = await fetch('/api/admin/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: broadcastInput.trim() }),
    });
    const data = await res.json();
    if (res.ok && data.announcements) {
      onAnnouncementsUpdated(data.announcements);
      setBroadcastInput('');
      setStatusMsg('Mensagem Global publicada para todos os jogadores da banda!');
    }
  };

  const handleSetAge = async (email: string, ageDays: number) => {
    const res = await fetch('/api/admin/set-age', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetEmail: email, ageDays }),
    });
    const data = await res.json();
    if (res.ok && data.players) {
      setPlayers(data.players);
      setStatusMsg(`Idade da conta ${email} ajustada para ${ageDays} dia(s) reais.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div
        role="dialog"
        aria-label="Painel de ADM do Dono"
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto banda-scroll rounded-2xl border border-[#f59e0b]/50 bg-[#14100d] p-5 space-y-5"
      >
        <div className="flex items-start justify-between border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#fbbf24]">
              <ShieldCheck className="w-4 h-4" />
              <span>Painel de ADM · Dono do Jogo</span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-0.5">
              Controlo Total da Banda ({ownerEmail})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Painel ADM"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {statusMsg && (
          <div className="p-2.5 rounded-xl bg-[#14532d]/45 border border-[#22c55e]/45 text-xs font-semibold text-[#dcfce7]">
            {statusMsg}
          </div>
        )}

        {/* Give Money Form */}
        <form
          onSubmit={handleGiveMoney}
          className="p-4 rounded-xl bg-[#1e1712] border border-white/10 space-y-3"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-[#4ade80]">
            <Banknote className="w-4 h-4" />
            <span>Enviar Dinheiro (Kwanzas)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] text-[#94a3b8] mb-1">Jogador Destino</label>
              <select
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#14100d] border border-white/15 text-xs text-white"
              >
                <option value={ownerEmail}>Minha Conta ({ownerEmail})</option>
                <option value="all">TODOS os Jogadores</option>
                {players
                  .filter((p) => p.email !== ownerEmail)
                  .map((p) => (
                    <option key={p.id} value={p.email}>
                      {p.name} ({p.email})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-[#94a3b8] mb-1">Quantidade (Kz)</label>
              <input
                type="number"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#14100d] border border-white/15 text-xs font-mono-nums text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[50000, 250000, 1000000, 10000000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmountInput(String(preset))}
                className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-mono-nums text-[#fbbf24] cursor-pointer"
              >
                +{formatKz(preset)}
              </button>
            ))}
            <button
              type="submit"
              className="ml-auto px-4 py-1.5 rounded-lg bg-[#16a34a] hover:bg-[#22c55e] text-white text-xs font-bold cursor-pointer"
            >
              Creditar Kwanzas
            </button>
          </div>
        </form>

        {/* Global Message Broadcast */}
        <form
          onSubmit={handleSendBroadcast}
          className="p-4 rounded-xl bg-[#1e1712] border border-white/10 space-y-2.5"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-[#fbbf24]">
            <Megaphone className="w-4 h-4" />
            <span>Enviar Mensagem Global (Para Toda a Banda)</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={broadcastInput}
              onChange={(e) => setBroadcastInput(e.target.value)}
              placeholder="Ex: Evento especial em Luanda hoje! Todos ganham bónus..."
              className="flex-1 px-3 py-2 rounded-lg bg-[#14100d] border border-white/15 text-xs text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#f59e0b] hover:bg-[#fbbf24] text-[#120e0b] text-xs font-bold cursor-pointer whitespace-nowrap"
            >
              Publicar Global
            </button>
          </div>
        </form>

        {/* Registered Players Overview */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#cbd5e1]">
            <Users className="w-4 h-4 text-[#38bdf8]" />
            <span>Contas Registadas ({players.length})</span>
          </div>
          <div className="space-y-2">
            {players.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-[#1e1712] border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-bold text-white">
                    {p.name} {p.isAdmin ? '👑 (ADM)' : ''}
                  </div>
                  <div className="text-[11px] text-[#94a3b8]">
                    {p.email} · Idade da conta: {p.accountAgeDays} dias reais · {p.municipalityId}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-nums font-bold text-[#4ade80]">
                    {formatKz(p.moneyKz)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSetAge(p.email, 4)}
                    className="px-2 py-1 rounded bg-[#2a211b] hover:bg-[#3a2d24] text-[10px] text-[#fbbf24] cursor-pointer"
                    title="Definir 4 dias reais (desbloqueia roubo)"
                  >
                    +4d Idade
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
