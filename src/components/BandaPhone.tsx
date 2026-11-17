import React, { useState } from 'react';
import {
  AlertCircle,
  Bath,
  Briefcase,
  Building,
  Building2,
  Car,
  CheckCircle2,
  GraduationCap,
  Heart,
  Home,
  Landmark,
  MapPin,
  MessageCircle,
  Music,
  ShieldAlert,
  ShoppingBag,
  Smartphone,
  Wallet,
  X,
} from 'lucide-react';
import {
  ANGOLAN_COMPANIES,
  BATHTUBS,
  BIRTH_CLASSES,
  CONDOMINIUMS,
  LANDMARKS,
  MARKET_ITEMS,
  MUSIC_TRACKS,
  PROFESSIONS,
  PROPERTIES,
  VEHICLES,
} from '../game/angolaData';
import {
  canPlayerSteal,
  formatKz,
  formatRealRemaining,
  formatTime,
  getEducationLabel,
  getEducationRank,
  getEffectiveJobChance,
  isCondoRentalActive,
} from '../game/simulation';
import {
  BathtubId,
  BusinessState,
  CompanyId,
  CondominiumId,
  GameSnapshot,
  GovCandidate,
  GovRole,
  PhoneAppId,
  ProfessionId,
  PropertyTierId,
  VehicleId,
  WeatherType,
} from '../game/types';

interface BandaPhoneProps {
  state: GameSnapshot;
  accountCreatedAt: number;
  govCandidates: GovCandidate[];
  myVotes: Record<string, string>;
  initialApp?: PhoneAppId;
  onClose: () => void;
  onSelectProfession: (id: ProfessionId) => void;
  onApplyCompanyJob: (companyId: CompanyId, jobId: string) => void;
  onWorkShift: () => void;
  onBuyItem: (id: string) => void;
  onBuyBathtub: (id: BathtubId) => void;
  onRentCondo: (condoId: CondominiumId, realDays: number) => void;
  onStealTarget: (targetLabel: string) => void;
  onApplyGov: (role: GovRole, province: string, slogan: string) => void;
  onVoteGov: (candidateId: string) => void;
  onBuyVehicle: (id: VehicleId, color?: string) => void;
  onSelectVehicle: (index: number) => void;
  onServiceVehicle: (mode: 'refuel' | 'repair' | 'paint', color?: string) => void;
  onUpgradeProperty: (id: PropertyTierId) => void;
  onBankTransfer: (dir: 'deposit' | 'withdraw', amount: number) => void;
  onBusinessAction: (
    action: 'open' | 'hire' | 'collect',
    type?: BusinessState['type'],
    name?: string,
  ) => void;
  onNpcAction: (
    npcId: string,
    action: 'talk' | 'gift' | 'date' | 'marry' | 'child' | 'football',
  ) => void;
  onSendChat: (npcId: string, text: string) => void;
  onCreatePost: (caption: string) => void;
  onToggleLikePost: (postId: string) => void;
  onSelectTrack: (trackId: string, play: boolean) => void;
  onFastTravel: (x: number, z: number, label: string) => void;
  onOpenFullMap: () => void;
  onSetWeather: (weather: WeatherType) => void;
  onAdvanceTime: (minutes: number) => void;
  onOpenSchool?: () => void;
}

export const BandaPhone: React.FC<BandaPhoneProps> = ({
  state,
  accountCreatedAt,
  govCandidates,
  myVotes,
  initialApp = 'home',
  onClose,
  onSelectProfession,
  onApplyCompanyJob,
  onWorkShift,
  onBuyItem,
  onBuyBathtub,
  onRentCondo,
  onStealTarget,
  onApplyGov,
  onVoteGov,
  onBuyVehicle,
  onSelectVehicle,
  onServiceVehicle,
  onUpgradeProperty,
  onBankTransfer,
  onBusinessAction,
  onNpcAction,
  onSendChat,
  onCreatePost,
  onToggleLikePost,
  onSelectTrack,
  onFastTravel,
  onOpenFullMap,
  onSetWeather,
  onAdvanceTime,
  onOpenSchool,
}) => {
  const [app, setApp] = useState<PhoneAppId>(initialApp);
  const [activeNpcId, setActiveNpcId] = useState<string>(state.npcs[0]?.id ?? 'tia_maria');
  const [chatInput, setChatInput] = useState('');
  const [postInput, setPostInput] = useState('');
  const [bizName, setBizName] = useState('Grupo Banda Forte');
  const [bizType, setBizType] = useState<BusinessState['type']>('Restaurante Típico');
  const [govRole, setGovRole] = useState<GovRole>('Presidente');
  const [govProvince, setGovProvince] = useState('Luanda');
  const [govSlogan, setGovSlogan] = useState('');
  const [condoDays, setCondoDays] = useState<Record<string, number>>({});

  const apps: { id: PhoneAppId; name: string; color: string; icon: React.ReactNode }[] = [
    { id: 'gov', name: 'BandaGov', color: '#b91c1c', icon: <Landmark className="w-5 h-5" /> },
    { id: 'condo', name: 'Condomínios', color: '#0d9488', icon: <Building className="w-5 h-5" /> },
    { id: 'crime', name: 'Gatunos/Rua', color: '#334155', icon: <ShieldAlert className="w-5 h-5" /> },
    { id: 'jobs', name: 'BandaJobs', color: '#d97706', icon: <Briefcase className="w-5 h-5" /> },
    { id: 'market', name: 'Cantina/Lojas', color: '#ea580c', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'maps', name: 'Mapa & Viagens', color: '#0284c7', icon: <MapPin className="w-5 h-5" /> },
    { id: 'pay', name: 'BandaPay', color: '#0f766e', icon: <Wallet className="w-5 h-5" /> },
    { id: 'chat', name: 'BandaChat', color: '#16a34a', icon: <MessageCircle className="w-5 h-5" /> },
    { id: 'car', name: 'BandaCar', color: '#2563eb', icon: <Car className="w-5 h-5" /> },
    { id: 'house', name: 'BandaHouse', color: '#b45309', icon: <Home className="w-5 h-5" /> },
    { id: 'social', name: 'BandaSocial', color: '#e11d48', icon: <Heart className="w-5 h-5" /> },
    { id: 'music', name: 'BandaMusic', color: '#9333ea', icon: <Music className="w-5 h-5" /> },
  ];

  const activeNpc = state.npcs.find((n) => n.id === activeNpcId) ?? state.npcs[0];
  const activeThread = state.chatThreads[activeNpc?.id ?? ''] ?? [];
  const birthClassLabel = BIRTH_CLASSES.find((c) => c.id === state.birthClass)?.label ?? 'Normal';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 pointer-events-auto">
      <div
        role="dialog"
        aria-label="Telemóvel BandaPhone"
        className="w-full max-w-[430px] h-[640px] max-h-[90vh] rounded-[28px] bg-[#14100d] border-2 border-[#f59e0b]/40 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Top Phone Status Bar */}
        <div className="px-5 py-3 bg-[#1c1612] border-b border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-semibold text-[#fbbf24]">
            <Smartphone className="w-4 h-4" />
            <span>BandaOS</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-nums text-[#faf6ef]">{formatTime(state.timeMinutes)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono-nums font-bold text-[#4ade80]">{formatKz(state.moneyKz)}</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar telemóvel"
              className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-[#faf6ef] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* App Sub-Header */}
        {app !== 'home' && (
          <div className="px-4 py-2 bg-[#1a1410] border-b border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setApp('home')}
              className="text-xs font-semibold text-[#fbbf24] hover:underline cursor-pointer"
            >
              ← Ecrã Inicial
            </button>
            <span className="text-sm font-bold text-[#faf6ef]">
              {apps.find((a) => a.id === app)?.name}
            </span>
          </div>
        )}

        {/* Phone Body */}
        <div className="flex-1 overflow-y-auto banda-scroll p-4">
          {app === 'home' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[#221a14] border border-[#f59e0b]/25">
                <div className="text-xs text-[#cbd5e1]">
                  {state.appearance.firstName} {state.appearance.lastName} · {state.playerDistrict}
                </div>
                <div className="mt-1 text-2xl font-bold font-mono-nums text-[#fbbf24]">
                  {formatKz(state.moneyKz)}
                </div>
                <div className="mt-1 text-xs text-[#94a3b8]">
                  Banco BAI: {formatKz(state.bankKz)} · Reputação: {state.reputation} · {birthClassLabel}
                </div>
                <div className="mt-1 text-[11px] text-[#60a5fa] font-semibold">
                  Formação: {getEducationLabel(state.educationLevel)} ({state.studyProgress}%)
                </div>
                <div className="mt-0.5 text-[11px] text-[#cbd5e1]">
                  Origem: {state.birthDistrict} · Mãe: {state.motherOccupation}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {apps.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setApp(item.id)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#1f1813] hover:bg-[#2c221b] border border-white/10 transition-colors cursor-pointer"
                  >
                    <span
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.icon}
                    </span>
                    <span className="text-xs font-semibold text-[#faf6ef] whitespace-nowrap">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {app === 'chat' && activeNpc && (
            <div className="space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {state.npcs.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setActiveNpcId(n.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                      n.id === activeNpc.id
                        ? 'bg-[#16a34a] text-white'
                        : 'bg-[#221a14] text-[#cbd5e1]'
                    }`}
                  >
                    {n.name}
                  </button>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-[#1e1712] border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#faf6ef]">{activeNpc.name}</div>
                    <div className="text-xs text-[#cbd5e1]">
                      {activeNpc.role} · {activeNpc.stage} ({activeNpc.affinity}%)
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => onNpcAction(activeNpc.id, 'talk')}
                    className="px-2.5 py-1 rounded bg-[#2a211b] hover:bg-[#3a2d24] text-xs font-semibold text-[#faf6ef] cursor-pointer"
                  >
                    Conversar
                  </button>
                  <button
                    type="button"
                    onClick={() => onNpcAction(activeNpc.id, 'gift')}
                    className="px-2.5 py-1 rounded bg-[#2a211b] hover:bg-[#3a2d24] text-xs font-semibold text-[#fbbf24] cursor-pointer"
                  >
                    Presente (2.000 Kz)
                  </button>
                  <button
                    type="button"
                    onClick={() => onNpcAction(activeNpc.id, 'date')}
                    className="px-2.5 py-1 rounded bg-[#9f1239] hover:bg-[#be123c] text-xs font-semibold text-white cursor-pointer"
                  >
                    Namorar
                  </button>
                  <button
                    type="button"
                    onClick={() => onNpcAction(activeNpc.id, 'marry')}
                    className="px-2.5 py-1 rounded bg-[#b45309] hover:bg-[#d97706] text-xs font-semibold text-white cursor-pointer"
                  >
                    Casar
                  </button>
                  <button
                    type="button"
                    onClick={() => onNpcAction(activeNpc.id, 'child')}
                    className="px-2.5 py-1 rounded bg-[#0f766e] hover:bg-[#0d9488] text-xs font-semibold text-white cursor-pointer"
                  >
                    Ter Filho
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[210px] overflow-y-auto banda-scroll p-2 rounded-xl bg-[#100d0b] border border-white/10">
                {activeThread.length === 0 ? (
                  <p className="text-xs text-[#94a3b8] text-center py-4">
                    Inicia conversa com {activeNpc.name}!
                  </p>
                ) : (
                  activeThread.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-lg text-xs ${
                        m.fromPlayer
                          ? 'bg-[#166534] text-white ml-8'
                          : 'bg-[#221a14] text-[#e7dfd3] mr-8'
                      }`}
                    >
                      <div className="font-semibold mb-0.5">{m.sender} · {m.timeLabel}</div>
                      <div>{m.text}</div>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!chatInput.trim()) return;
                  onSendChat(activeNpc.id, chatInput.trim());
                  setChatInput('');
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Escreve uma mensagem..."
                  className="flex-1 px-3 py-2 rounded-lg bg-[#1e1813] border border-white/15 text-xs text-[#faf6ef]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-[#16a34a] text-white text-xs font-bold cursor-pointer"
                >
                  Enviar
                </button>
              </form>
            </div>
          )}

          {app === 'pay' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0f766e]/25 border border-[#14b8a6]/35 space-y-2">
                <div className="flex justify-between text-xs text-[#cbd5e1]">
                  <span>Classe de Nascimento</span>
                  <span className="font-bold text-[#fbbf24]">{birthClassLabel}</span>
                </div>
                <div className="flex justify-between text-xs text-[#cbd5e1]">
                  <span>Origem & Mãe</span>
                  <span className="font-semibold text-[#faf6ef] text-right">
                    {state.birthDistrict} · {state.motherOccupation}
                  </span>
                </div>
                <p className="text-[11px] text-[#cbd5e1] bg-[#14100d]/70 p-2 rounded-lg border border-white/10">
                  {state.motherStory}
                </p>
                <div className="flex justify-between text-xs text-[#cbd5e1]">
                  <span>Em Mão (Kwanzas)</span>
                  <span className="font-mono-nums font-bold text-[#faf6ef]">{formatKz(state.moneyKz)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#cbd5e1]">
                  <span>Conta Banco BAI</span>
                  <span className="font-mono-nums font-bold text-[#5eead4]">{formatKz(state.bankKz)}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => onBankTransfer('deposit', 2500)}
                    className="flex-1 py-2 rounded-lg bg-[#0f766e] hover:bg-[#0d9488] text-xs font-bold text-white cursor-pointer"
                  >
                    Depositar 2.500 Kz
                  </button>
                  <button
                    type="button"
                    onClick={() => onBankTransfer('withdraw', 2500)}
                    className="flex-1 py-2 rounded-lg bg-[#221a14] hover:bg-[#2f251e] border border-white/15 text-xs font-bold text-[#faf6ef] cursor-pointer"
                  >
                    Levantar 2.500 Kz
                  </button>
                </div>
              </div>

              {/* Own Business & Employees */}
              <div className="p-4 rounded-xl bg-[#1e1712] border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-[#fbbf24]">
                  <Building2 className="w-4 h-4" />
                  <span>O Teu Próprio Negócio</span>
                </div>
                {!state.business.owned ? (
                  <div className="space-y-2.5">
                    <p className="text-xs text-[#cbd5e1]">
                      Abre a tua empresa por 45.000 Kz, contrata funcionários e recebe rendimento diário automático.
                    </p>
                    <input
                      type="text"
                      value={bizName}
                      onChange={(e) => setBizName(e.target.value)}
                      placeholder="Nome da Empresa"
                      className="w-full px-3 py-2 rounded-lg bg-[#14100d] border border-white/15 text-xs text-[#faf6ef]"
                    />
                    <select
                      value={bizType}
                      onChange={(e) => setBizType(e.target.value as BusinessState['type'])}
                      className="w-full px-3 py-2 rounded-lg bg-[#14100d] border border-white/15 text-xs text-[#faf6ef]"
                    >
                      <option value="Loja de Bairro">Loja de Bairro</option>
                      <option value="Restaurante Típico">Restaurante Típico</option>
                      <option value="Oficina & Peças">Oficina & Peças</option>
                      <option value="Produtora Kuduro">Produtora Kuduro</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => onBusinessAction('open', bizType, bizName)}
                      className="w-full py-2.5 rounded-lg bg-[#f59e0b] hover:bg-[#fbbf24] text-[#120e0b] text-xs font-bold cursor-pointer"
                    >
                      Abrir Empresa (45.000 Kz)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="font-bold text-[#faf6ef]">{state.business.name} · {state.business.type}</div>
                    <div className="text-[#cbd5e1]">
                      Funcionários: <strong className="text-white">{state.business.employees}</strong> · Receita/dia:{' '}
                      <strong className="text-[#4ade80]">{formatKz(state.business.dailyRevenueKz)}</strong>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onBusinessAction('hire')}
                        className="flex-1 py-2 rounded-lg bg-[#2a211b] hover:bg-[#3a2d24] text-[#fbbf24] font-bold cursor-pointer"
                      >
                        Contratar (15.000 Kz)
                      </button>
                      <button
                        type="button"
                        onClick={() => onBusinessAction('collect')}
                        className="flex-1 py-2 rounded-lg bg-[#16a34a] text-white font-bold cursor-pointer"
                      >
                        Levantar ({formatKz(state.business.pendingCashKz)})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {app === 'maps' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullMap();
                }}
                className="w-full py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0ea5e9] text-white text-xs font-extrabold cursor-pointer"
              >
                Abrir Mapa Completo (Municípios, Avião TAAG & Táxi)
              </button>

              {/* Time & Weather Controls */}
              <div className="p-3 rounded-xl bg-[#1e1712] border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#faf6ef]">Clima & Hora em Angola</span>
                  <button
                    type="button"
                    onClick={() => onAdvanceTime(180)}
                    className="px-2.5 py-1 rounded bg-[#0284c7] text-white font-semibold cursor-pointer"
                  >
                    Avançar +3h
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(['sol', 'nuvens', 'chuva', 'trovoada', 'vento'] as WeatherType[]).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => onSetWeather(w)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize cursor-pointer ${
                        state.weather === w ? 'bg-[#f59e0b] text-[#120e0b]' : 'bg-[#2a211b] text-[#cbd5e1]'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {LANDMARKS.filter((l) => l.municipalityId === state.currentMunicipalityId).map((lm) => (
                  <div
                    key={lm.id}
                    className="p-3 rounded-xl bg-[#1e1712] border border-white/10 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#faf6ef] truncate">{lm.name}</div>
                      <div className="text-[11px] text-[#94a3b8] truncate">
                        {lm.district} · {lm.category}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Ir até ${lm.name}`}
                      onClick={() => {
                        onFastTravel(lm.x, Math.min(20, lm.z + 3.5), lm.name);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0ea5e9] text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                    >
                      Caminhar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {app === 'gov' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#7f1d1d]/30 border border-[#ef4444]/40 space-y-2">
                <div className="text-xs font-bold text-[#fca5a5] flex items-center gap-1.5">
                  <Landmark className="w-4 h-4" />
                  <span>Governo da Banda — Candidatar-se</span>
                </div>
                <p className="text-[11px] text-[#e2e8f0]">
                  Candidata-te a Presidente, Ministro ou Governador Provincial e conquista os votos dos cidadãos!
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={govRole}
                    onChange={(e) => setGovRole(e.target.value as GovRole)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#14100d] border border-white/15 text-xs text-white"
                  >
                    <option value="Presidente">Presidente</option>
                    <option value="Ministro">Ministro</option>
                    <option value="Governador">Governador</option>
                  </select>
                  <select
                    value={govProvince}
                    onChange={(e) => setGovProvince(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#14100d] border border-white/15 text-xs text-white"
                  >
                    <option value="Nacional">Nacional</option>
                    <option value="Luanda">Luanda</option>
                    <option value="Benguela">Benguela</option>
                    <option value="Huambo">Huambo</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={govSlogan}
                  onChange={(e) => setGovSlogan(e.target.value)}
                  placeholder="Proposta / Slogan da Campanha"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#14100d] border border-white/15 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    onApplyGov(govRole, govProvince, govSlogan);
                    setGovSlogan('');
                  }}
                  className="w-full py-2 rounded-lg bg-[#dc2626] hover:bg-[#ef4444] text-white text-xs font-bold cursor-pointer"
                >
                  Lançar Candidatura a {govRole}
                </button>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-[#fbbf24]">Boletim de Voto Oficial</div>
                {govCandidates.map((cand) => {
                  const votedHere = myVotes[cand.role] === cand.id;
                  return (
                    <div
                      key={cand.id}
                      className="p-3 rounded-xl bg-[#1e1712] border border-white/10 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase text-[#f87171]">
                          {cand.role} · {cand.province}
                        </div>
                        <div className="text-xs font-bold text-white truncate">{cand.name}</div>
                        <div className="text-[11px] text-[#94a3b8] line-clamp-2">{cand.partyOrSlogan}</div>
                        <div className="text-[11px] font-mono-nums text-[#4ade80] mt-0.5">
                          {cand.votes} votos
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onVoteGov(cand.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                          votedHere
                            ? 'bg-[#16a34a] text-white'
                            : 'bg-[#f59e0b] hover:bg-[#fbbf24] text-[#120e0b]'
                        }`}
                      >
                        {votedHere ? 'Votado ✓' : 'Votar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {app === 'condo' && (
            <div className="space-y-3">
              {state.activeCondoRental && (
                <div className="p-3 rounded-xl bg-[#14532d]/40 border border-[#22c55e]/45 text-xs space-y-1">
                  <div className="font-bold text-[#4ade80]">
                    Condomínio Ativo (Tempo REAL):{' '}
                    {CONDOMINIUMS.find((c) => c.id === state.activeCondoRental?.condoId)?.name}
                  </div>
                  <div className="text-[#dcfce7] font-mono-nums">
                    Estado:{' '}
                    {isCondoRentalActive(state.activeCondoRental)
                      ? `Restam ${formatRealRemaining(state.activeCondoRental.expiresAtRealMs)}`
                      : 'Expirado — Renova abaixo'}
                  </div>
                </div>
              )}

              <div className="text-[11px] text-[#cbd5e1] bg-[#1e1712] p-2.5 rounded-xl border border-white/10">
                Os condomínios são alugados por <strong>dias REAIS</strong> (24 horas reais por dia pago) e dão acesso seguro e conforto extra.
              </div>

              {CONDOMINIUMS.map((c) => {
                const days = condoDays[c.id] ?? 1;
                return (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-[#1e1712] border border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{c.name}</span>
                      <span className="text-xs font-mono-nums font-bold text-[#fbbf24]">
                        {formatKz(c.dailyRealPriceKz)} / dia real
                      </span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8]">{c.description}</p>
                    <div className="flex items-center gap-2">
                      <select
                        value={days}
                        onChange={(e) =>
                          setCondoDays((prev) => ({ ...prev, [c.id]: Number(e.target.value) }))
                        }
                        className="px-2 py-1.5 rounded bg-[#14100d] border border-white/15 text-xs text-white"
                      >
                        <option value={1}>1 dia real</option>
                        <option value={3}>3 dias reais</option>
                        <option value={7}>7 dias reais</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => onRentCondo(c.id, days)}
                        className="flex-1 py-1.5 rounded-lg bg-[#0d9488] hover:bg-[#14b8a6] text-white text-xs font-bold cursor-pointer"
                      >
                        Alugar ({formatKz(c.dailyRealPriceKz * days)})
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {app === 'crime' && (
            <div className="space-y-3">
              {(() => {
                const gate = canPlayerSteal(accountCreatedAt);
                return (
                  <div
                    className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                      gate.allowed
                        ? 'bg-[#14532d]/30 border-[#22c55e]/45 text-[#dcfce7]'
                        : 'bg-[#7f1d1d]/35 border-[#ef4444]/45 text-[#fee2e2]'
                    }`}
                  >
                    <div className="font-bold text-sm flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      <span>
                        {gate.allowed
                          ? 'Acesso Desbloqueado (Conta >= 3 dias reais)'
                          : 'Roubo Bloqueado (Mínimo 3 dias reais de conta)'}
                      </span>
                    </div>
                    {!gate.allowed ? (
                      <p>
                        Só contas com no mínimo <strong>3 dias reais</strong> podem roubar na banda.
                        Tempo restante para desbloquear:{' '}
                        <strong className="font-mono-nums text-[#fbbf24]">{gate.remainingLabel}</strong>.
                      </p>
                    ) : (
                      <p>
                        A tua conta cumpre os 3 dias reais mínimos. Escolhe um alvo com cuidado — se fores apanhado pagas multa!
                      </p>
                    )}

                    <div className="grid grid-cols-1 gap-2 pt-1">
                      <button
                        type="button"
                        disabled={!gate.allowed}
                        onClick={() => onStealTarget('Carteira na Esquina da Baixa')}
                        className="w-full py-2 rounded-lg bg-[#dc2626] hover:bg-[#ef4444] disabled:opacity-45 text-white font-bold cursor-pointer"
                      >
                        Tentar Roubar na Rua
                      </button>
                      <button
                        type="button"
                        disabled={!gate.allowed}
                        onClick={() => onStealTarget('Caixa da Loja Distraída')}
                        className="w-full py-2 rounded-lg bg-[#991b1b] hover:bg-[#b91c1c] disabled:opacity-45 text-white font-bold cursor-pointer"
                      >
                        Roubar Mercadoria / Caixa
                      </button>
                    </div>
                  </div>
                );
              })()}
              <div className="p-3 rounded-xl bg-[#1e1712] border border-white/10 text-[11px] text-[#cbd5e1]">
                <strong>Atenção aos Gatunos da Banda:</strong> Ladrões de capuz preto patrulham as esquinas dos bairros. Se chegares muito perto, podem roubar Kwanzas do teu bolso!
              </div>
            </div>
          )}

          {app === 'jobs' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#241b12] border border-[#f59e0b]/35 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs text-[#cbd5e1]">Emprego Atual</div>
                  <div className="text-sm font-bold text-[#fbbf24] truncate">
                    {state.currentCompanyJobTitle
                      ? `${state.currentCompanyJobTitle}`
                      : PROFESSIONS.find((p) => p.id === state.profession)?.title ?? 'Sem emprego fixo'}
                  </div>
                  {state.currentCompanyId && (
                    <div className="text-[11px] text-[#4ade80]">
                      Empresa:{' '}
                      {ANGOLAN_COMPANIES.find((c) => c.id === state.currentCompanyId)?.name}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onWorkShift}
                  className="px-3.5 py-2 rounded-lg bg-[#f59e0b] hover:bg-[#fbbf24] text-[#120e0b] text-xs font-bold whitespace-nowrap cursor-pointer"
                >
                  Fazer Turno Agora
                </button>
              </div>

              {/* Formação Académica + Atalho Escola */}
              <div className="p-3 rounded-xl bg-[#1e1712] border border-[#3b82f6]/35 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] text-[#94a3b8] flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-[#60a5fa]" />
                    <span>Formação Académica</span>
                  </div>
                  <div className="text-xs font-bold text-[#60a5fa] truncate">
                    {getEducationLabel(state.educationLevel)} ({state.studyProgress}%)
                  </div>
                </div>
                {onOpenSchool && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSchool();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#2563eb] hover:bg-[#3b82f6] text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    Estudar na Escola
                  </button>
                )}
              </div>

              {/* Resultado da Última Candidatura (Aceite / Recusado) */}
              {state.lastJobApplication && (
                <div
                  data-testid="phone-job-application-result"
                  className={`p-3 rounded-xl border flex items-start gap-2 text-xs ${
                    state.lastJobApplication.accepted
                      ? 'bg-[#14532d]/35 border-[#22c55e]/50 text-[#dcfce7]'
                      : 'bg-[#7f1d1d]/35 border-[#ef4444]/50 text-[#fee2e2]'
                  }`}
                >
                  {state.lastJobApplication.accepted ? (
                    <CheckCircle2 className="w-4 h-4 text-[#4ade80] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#f87171] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">
                      {state.lastJobApplication.accepted
                        ? 'Candidatura Aceite'
                        : 'Candidatura Recusada'}
                    </div>
                    <div className="mt-0.5">{state.lastJobApplication.message}</div>
                  </div>
                </div>
              )}

              {/* Grandes Empresas de Angola */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#fbbf24]">
                  Empresas de Angola (Entrevista & Formação)
                </div>
                {ANGOLAN_COMPANIES.map((comp) => {
                  const lm = LANDMARKS.find((l) => l.id === comp.landmarkId);
                  return (
                    <div
                      key={comp.id}
                      className="p-3 rounded-xl bg-[#1e1712] border border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-extrabold text-[#faf6ef]">{comp.name}</div>
                          <div className="text-[11px] text-[#94a3b8]">
                            {comp.sector} · {comp.district}
                          </div>
                        </div>
                        {lm && (
                          <button
                            type="button"
                            aria-label={`Ir até sede ${comp.name}`}
                            onClick={() => {
                              onFastTravel(lm.x, lm.z, comp.name);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded bg-[#0284c7] hover:bg-[#0ea5e9] text-white text-[11px] font-bold whitespace-nowrap cursor-pointer"
                          >
                            Ir até à Sede
                          </button>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {comp.jobs.map((job) => {
                          const missingEdu =
                            getEducationRank(state.educationLevel) <
                            getEducationRank(job.minEducation);
                          const missingRep = state.reputation < job.minReputation;
                          const locked = missingEdu || missingRep;
                          const isCurrent =
                            state.currentCompanyId === comp.id &&
                            state.currentCompanyJobTitle === job.title;
                          const chancePct = Math.round(
                            getEffectiveJobChance(
                              state,
                              job.acceptanceChance,
                              job.minEducation,
                              job.minReputation,
                            ) * 100,
                          );
                          return (
                            <div
                              key={job.id}
                              className="p-2 rounded-lg bg-[#14100d] border border-white/5 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="text-[11px] font-bold text-[#faf6ef] truncate">
                                  {job.title}
                                </div>
                                <div className="text-[10px] text-[#94a3b8] font-mono-nums flex flex-wrap gap-x-1.5">
                                  <span>{formatKz(job.shiftPayKz)}/turno</span>
                                  <span className={missingEdu ? 'text-[#f87171]' : 'text-[#60a5fa]'}>
                                    · {getEducationLabel(job.minEducation)}
                                  </span>
                                  {job.minReputation > 0 && (
                                    <span className={missingRep ? 'text-[#f87171]' : ''}>
                                      · {job.minReputation} rep
                                    </span>
                                  )}
                                  {!locked && (
                                    <span className="text-[#fbbf24]">· {chancePct}%</span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={isCurrent}
                                onClick={() => onApplyCompanyJob(comp.id, job.id)}
                                className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                                  isCurrent
                                    ? 'bg-[#16a34a] text-white'
                                    : locked
                                      ? 'bg-[#2a211b] text-[#f87171] border border-[#ef4444]/35'
                                      : 'bg-[#f59e0b] hover:bg-[#fbbf24] text-[#120e0b]'
                                }`}
                              >
                                {isCurrent
                                  ? 'Ativo'
                                  : missingEdu
                                    ? 'Falta Estudo'
                                    : missingRep
                                      ? 'Falta Rep.'
                                      : 'Pedir Emprego'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#cbd5e1]">
                  Profissões Autónomas & Serviços
                </div>
                {PROFESSIONS.map((prof) => {
                  const missingEdu =
                    getEducationRank(state.educationLevel) < getEducationRank(prof.minEducation);
                  const missingRep = state.reputation < prof.minReputation;
                  const locked = missingEdu || missingRep;
                  const active = !state.currentCompanyId && state.profession === prof.id;
                  const chancePct = Math.round(
                    getEffectiveJobChance(
                      state,
                      prof.acceptanceChance,
                      prof.minEducation,
                      prof.minReputation,
                    ) * 100,
                  );
                  return (
                    <div
                      key={prof.id}
                      className="p-3 rounded-xl bg-[#1e1712] border border-white/10 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#faf6ef]">{prof.title}</div>
                        <div className="text-[11px] text-[#94a3b8] flex flex-wrap gap-x-1.5">
                          <span>{formatKz(prof.shiftPayKz)}/turno</span>
                          <span className={missingEdu ? 'text-[#f87171]' : 'text-[#60a5fa]'}>
                            · {getEducationLabel(prof.minEducation)}
                          </span>
                          {prof.minReputation > 0 && (
                            <span className={missingRep ? 'text-[#f87171]' : ''}>
                              · {prof.minReputation} rep
                            </span>
                          )}
                          {!locked && <span className="text-[#fbbf24]">· {chancePct}%</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={active}
                        onClick={() => onSelectProfession(prof.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                          active
                            ? 'bg-[#16a34a] text-white'
                            : locked
                              ? 'bg-[#2a211b] text-[#f87171] border border-[#ef4444]/35'
                              : 'bg-[#d97706] hover:bg-[#f59e0b] text-[#120e0b]'
                        }`}
                      >
                        {active
                          ? 'Ativo'
                          : missingEdu
                            ? 'Falta Estudo'
                            : missingRep
                              ? 'Falta Rep.'
                              : 'Candidatar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {app === 'market' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#fbbf24]">Comidas & Cafés de Energia</div>
              {MARKET_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#1e1712] border border-white/10 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#faf6ef]">{item.name}</div>
                    <div className="text-[11px] text-[#94a3b8]">{item.description}</div>
                    <div className="text-[11px] font-mono-nums font-semibold text-[#fbbf24] mt-0.5">
                      {formatKz(item.priceKz)}
                      {item.energyRestore ? ` · +${item.energyRestore} Energia` : ''}
                      {item.hungerRestore ? ` · +${item.hungerRestore} Comida` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onBuyItem(item.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#ea580c] hover:bg-[#f97316] text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    Comprar
                  </button>
                </div>
              ))}

              <div className="text-xs font-bold text-[#38bdf8] pt-2 flex items-center gap-1.5">
                <Bath className="w-4 h-4" />
                <span>Banheiras (&gt;60.000 Kz · Recuperam Energia em Casa)</span>
              </div>
              {BATHTUBS.map((tub) => {
                const owned = state.ownedBathtubs.includes(tub.id);
                const placed = state.placedBathtubId === tub.id;
                return (
                  <div
                    key={tub.id}
                    className="p-3 rounded-xl bg-[#1e1712] border border-[#0284c7]/30 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white">{tub.name}</div>
                      <div className="text-[11px] text-[#94a3b8]">
                        +{tub.energyRestore} Energia ao clicar em Casa · {formatKz(tub.priceKz)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onBuyBathtub(tub.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                        placed
                          ? 'bg-[#16a34a] text-white'
                          : 'bg-[#0284c7] hover:bg-[#0ea5e9] text-white'
                      }`}
                    >
                      {placed ? 'Instalada' : owned ? 'Instalar' : 'Comprar'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {app === 'social' && (
            <div className="space-y-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!postInput.trim()) return;
                  onCreatePost(postInput.trim());
                  setPostInput('');
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={postInput}
                  onChange={(e) => setPostInput(e.target.value)}
                  placeholder="Partilha um momento na Banda..."
                  className="flex-1 px-3 py-2 rounded-lg bg-[#1e1813] border border-white/15 text-xs text-[#faf6ef]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-[#e11d48] text-white text-xs font-bold cursor-pointer"
                >
                  Publicar
                </button>
              </form>

              <div className="space-y-2.5">
                {state.socialPosts.map((post) => (
                  <div key={post.id} className="p-3 rounded-xl bg-[#1e1712] border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#faf6ef]">{post.author}</span>
                      <span className="text-[#94a3b8]">{post.location} · {post.timeLabel}</span>
                    </div>
                    <p className="text-xs text-[#e7dfd3]">{post.caption}</p>
                    <button
                      type="button"
                      onClick={() => onToggleLikePost(post.id)}
                      className={`text-xs font-semibold cursor-pointer ${
                        post.likedByPlayer ? 'text-[#f43f5e]' : 'text-[#94a3b8]'
                      }`}
                    >
                      ♥ {post.likes} Gostos
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {app === 'car' && (
            <div className="space-y-3">
              {/* Garagem Atual */}
              <div className="p-3 rounded-xl bg-[#1e1712] border border-[#2563eb]/35 space-y-2">
                <div className="text-xs font-bold text-[#60a5fa]">A Tua Garagem ({state.ownedVehicles.length})</div>
                {state.ownedVehicles.length === 0 ? (
                  <p className="text-[11px] text-[#94a3b8]">
                    Ainda estás a pé. Junta Kuanzas para comprar a tua primeira motorizada ou carro abaixo.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {state.ownedVehicles.map((ov, idx) => {
                        const spec = VEHICLES.find((v) => v.id === ov.id);
                        return (
                          <button
                            key={`${ov.id}_${idx}`}
                            type="button"
                            onClick={() => onSelectVehicle(idx)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                              idx === state.activeVehicleIndex
                                ? 'bg-[#2563eb] text-white'
                                : 'bg-[#2a211b] text-[#cbd5e1]'
                            }`}
                          >
                            {spec?.name ?? ov.id}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => onServiceVehicle('refuel')}
                        className="flex-1 py-1.5 rounded bg-[#2a211b] text-[11px] font-semibold text-[#fbbf24] cursor-pointer"
                      >
                        Abastecer (1.800 Kz)
                      </button>
                      <button
                        type="button"
                        onClick={() => onServiceVehicle('repair')}
                        className="flex-1 py-1.5 rounded bg-[#2a211b] text-[11px] font-semibold text-[#4ade80] cursor-pointer"
                      >
                        Reparar (3.500 Kz)
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                {VEHICLES.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl bg-[#1e1712] border border-white/10 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#faf6ef]">{v.name}</div>
                      <div className="text-[11px] text-[#94a3b8]">
                        {v.category} · Vel. máx {v.maxSpeedKmh} km/h
                      </div>
                      <div className="text-[11px] font-mono-nums font-bold text-[#60a5fa]">
                        {formatKz(v.priceKz)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onBuyVehicle(v.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#2563eb] hover:bg-[#3b82f6] text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                    >
                      Comprar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {app === 'house' && (
            <div className="space-y-2.5">
              {PROPERTIES.map((prop) => {
                const owned = state.propertyId === prop.id;
                return (
                  <div
                    key={prop.id}
                    className="p-3 rounded-xl bg-[#1e1712] border border-white/10 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#faf6ef]">{prop.name}</span>
                      <span className="text-xs font-mono-nums font-bold text-[#fbbf24]">
                        {prop.priceKz === 0 ? `${formatKz(prop.dailyRentKz)}/dia` : formatKz(prop.priceKz)}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#94a3b8]">
                      {prop.district} · {prop.rooms} divisões · {prop.description}
                    </div>
                    <button
                      type="button"
                      disabled={owned}
                      onClick={() => onUpgradeProperty(prop.id)}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        owned
                          ? 'bg-[#16a34a] text-white'
                          : 'bg-[#b45309] hover:bg-[#d97706] text-white'
                      }`}
                    >
                      {owned ? 'Residência Atual' : 'Adquirir Propriedade'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {app === 'music' && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-[#3b0764]/45 border border-[#a855f7]/40 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#e9d5ff]">Rádio da Banda</div>
                  <div className="text-sm font-bold text-white">
                    {state.radioPlaying
                      ? MUSIC_TRACKS.find((t) => t.id === state.currentTrackId)?.title
                      : 'Rádio Desligada'}
                  </div>
                </div>
                {state.radioPlaying && (
                  <button
                    type="button"
                    onClick={() => onSelectTrack(state.currentTrackId, false)}
                    className="px-3 py-1.5 rounded-lg bg-[#dc2626] text-white text-xs font-bold cursor-pointer"
                  >
                    Parar
                  </button>
                )}
              </div>

              {MUSIC_TRACKS.map((track) => {
                const playing = state.radioPlaying && state.currentTrackId === track.id;
                return (
                  <div
                    key={track.id}
                    className="p-3 rounded-xl bg-[#1e1712] border border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#faf6ef]">{track.title}</div>
                      <div className="text-[11px] text-[#94a3b8]">
                        {track.artist} · {track.genre.toUpperCase()} · {track.bpm} BPM
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectTrack(track.id, !playing)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        playing ? 'bg-[#16a34a] text-white' : 'bg-[#9333ea] hover:bg-[#a855f7] text-white'
                      }`}
                    >
                      {playing ? 'A Tocar' : 'Ouvir'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
