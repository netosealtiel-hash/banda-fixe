import React, { useState } from 'react';
import { KeyRound, Loader2, LogIn, Mail, ShieldCheck, User, UserPlus } from 'lucide-react';
import { AuthUser, GameSnapshot, GlobalAnnouncement, GovCandidate } from '../game/types';

interface AuthResultPayload {
  token: string;
  user: AuthUser;
  snapshot: GameSnapshot;
  needsLottery?: boolean;
  announcements?: GlobalAnnouncement[];
  govCandidates?: GovCandidate[];
  myVotes?: Record<string, string>;
}

interface AuthModalProps {
  onSuccess: (payload: AuthResultPayload) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitAuth = async (
    mode: 'login' | 'register',
    targetEmail = email,
    targetPassword = password,
    targetName = name,
  ) => {
    setError(null);
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'login'
          ? { email: targetEmail, password: targetPassword }
          : { email: targetEmail, name: targetName, password: targetPassword };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao autenticar.');
        return;
      }
      onSuccess(data);
    } catch {
      setError('Falha de ligação ao servidor da Banda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(circle at 50% 25%, rgba(245,158,11,0.18), rgba(10,8,7,0.88) 70%)',
      }}
    >
      <div
        role="dialog"
        aria-label="Entrar em Vida na Banda 3D"
        className="w-full max-w-md rounded-2xl border border-[#f59e0b]/40 bg-[#14100d]/95 p-6 shadow-2xl space-y-5"
      >
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f59e0b]/15 border border-[#f59e0b]/40 text-[#fbbf24] text-[11px] font-bold tracking-wider uppercase">
            <span>Luanda 3D · Progresso Guardado</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#faf6ef] tracking-tight">
            VIDA NA BANDA <span className="text-[#f59e0b]">3D</span>
          </h1>
          <p className="text-xs text-[#cbd5e1]">
            Entra ou cria a tua conta com email, nome e senha para guardar o teu dinheiro, casas e empresas.
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#1e1712] border border-white/10">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'login'
                ? 'bg-[#f59e0b] text-[#120e0b]'
                : 'text-[#cbd5e1] hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar (Login)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'register'
                ? 'bg-[#f59e0b] text-[#120e0b]'
                : 'text-[#cbd5e1] hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Criar Conta</span>
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-[#7f1d1d]/40 border border-[#ef4444]/50 text-xs text-[#fecaca]">
            {error}
          </div>
        )}

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            submitAuth(tab);
          }}
        >
          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-semibold text-[#cbd5e1] mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#94a3b8] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Kelson Manuel"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1e1712] border border-white/15 text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-[#f59e0b]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-[#cbd5e1] mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#94a3b8] absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teu.email@exemplo.ao"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1e1712] border border-white/15 text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-[#f59e0b]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#cbd5e1] mb-1">
              Senha (Palavra-passe)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#94a3b8] absolute left-3 top-2.5" />
              <input
                type="password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1e1712] border border-white/15 text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-[#f59e0b]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] text-[#120e0b] font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{tab === 'login' ? 'Entrar em Luanda 3D' : 'Registar & Sortear Vida'}</span>
          </button>
        </form>

        {/* Quick demo / owner login shortcuts */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="text-[11px] text-[#94a3b8] text-center">Acesso Rápido Guardado</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => submitAuth('login', 'kelson@banda.ao', 'luanda123')}
              className="py-2 px-2.5 rounded-lg bg-[#1e1712] hover:bg-[#2a2018] border border-white/10 text-[11px] font-semibold text-[#e2e8f0] cursor-pointer"
            >
              Cidadão Demo (4 dias)
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => submitAuth('login', 'netosealtiel@gmail.com', 'banda2025')}
              className="py-2 px-2.5 rounded-lg bg-[#422006]/70 hover:bg-[#713f12] border border-[#f59e0b]/40 text-[11px] font-bold text-[#fbbf24] flex items-center justify-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Dono ADM</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
