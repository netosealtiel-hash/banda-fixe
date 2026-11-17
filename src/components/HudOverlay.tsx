import React, { useRef, useState } from 'react';
import {
  Bath,
  Briefcase,
  Car,
  Coffee,
  Compass,
  DoorOpen,
  Gamepad2,
  GraduationCap,
  Lightbulb,
  Map as MapIcon,
  Megaphone,
  MessageSquare,
  Music,
  Pause,
  ShieldCheck,
  Smartphone,
  Target,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  ANGOLAN_COMPANIES,
  BATHTUBS,
  CONDOMINIUMS,
  LANDMARKS,
  MISSIONS,
  MUSIC_TRACKS,
} from '../game/angolaData';
import {
  formatKz,
  formatRealRemaining,
  formatTime,
  getActiveJobCosts,
  getDayPhaseLabel,
  getEducationLabel,
  getMunicipalityDef,
  isCondoRentalActive,
} from '../game/simulation';
import { GameSnapshot, GlobalAnnouncement, PhoneAppId } from '../game/types';
import { ProjectedLabel } from '../game/World3DEngine';

interface HudOverlayProps {
  state: GameSnapshot;
  isAdmin: boolean;
  muted: boolean;
  activeNpcModalId: string | null;
  projectedLabels: ProjectedLabel[];
  latestAnnouncement: GlobalAnnouncement | null;
  onToggleMute: () => void;
  onOpenPhone: (app?: PhoneAppId) => void;
  onOpenFullMap: () => void;
  onOpenCantina: (tab?: 'cantina' | 'banheiras') => void;
  onOpenSchool: () => void;
  onOpenAdmin: () => void;
  onInteractLandmark: () => void;
  onClickProjectedLabel: (label: ProjectedLabel) => void;
  onRoomInteract: (action: 'work' | 'jobs' | 'bathtub' | 'sleep' | 'cook' | 'tv' | 'exit') => void;
  onToggleVehicle: () => void;
  onToggleLights: () => void;
  onToggleDoors: () => void;
  onHorn: () => void;
  onToggleRadio: () => void;
  onDance: () => void;
  onPause: () => void;
  onOpenNpcModal: (npcId: string | null) => void;
  onNpcAction: (
    npcId: string,
    action: 'talk' | 'gift' | 'date' | 'marry' | 'child' | 'football',
  ) => void;
  onVirtualInput: (dx: number, dy: number, sprint: boolean) => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  state,
  isAdmin,
  muted,
  activeNpcModalId,
  projectedLabels,
  latestAnnouncement,
  onToggleMute,
  onOpenPhone,
  onOpenFullMap,
  onOpenCantina,
  onOpenSchool,
  onOpenAdmin,
  onInteractLandmark,
  onClickProjectedLabel,
  onRoomInteract,
  onToggleVehicle,
  onToggleLights,
  onToggleDoors,
  onHorn,
  onToggleRadio,
  onDance,
  onPause,
  onOpenNpcModal,
  onNpcAction,
  onVirtualInput,
}) => {
  const [showMissions, setShowMissions] = useState(false);
  const [showVirtualPad, setShowVirtualPad] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const padRef = useRef<HTMLDivElement>(null);
  const draggingPadRef = useRef(false);

  const activeMission = MISSIONS.find((m) => m.id === state.activeMissionId) ?? MISSIONS[0];
  const nearbyLandmark = LANDMARKS.find((l) => l.id === state.nearbyLandmarkId) ?? null;
  const nearbyNpc = state.npcs.find((n) => n.id === state.nearbyNpcId) ?? null;
  const dialogNpc = state.npcs.find((n) => n.id === activeNpcModalId) ?? null;
  const activeVehicle = state.ownedVehicles[state.activeVehicleIndex];
  const currentTrack = MUSIC_TRACKS.find((t) => t.id === state.currentTrackId) ?? MUSIC_TRACKS[0];
  const currentMuni = getMunicipalityDef(state.currentMunicipalityId);
  const activeJob = getActiveJobCosts(state);
  const activeComp = state.activeCompanyRoomId
    ? ANGOLAN_COMPANIES.find((c) => c.id === state.activeCompanyRoomId)
    : null;
  const placedTub = state.placedBathtubId
    ? BATHTUBS.find((b) => b.id === state.placedBathtubId)
    : null;
  const condoActive = isCondoRentalActive(state.activeCondoRental);
  const activeCondoDef = state.activeCondoRental
    ? CONDOMINIUMS.find((c) => c.id === state.activeCondoRental?.condoId)
    : null;

  const updateStick = (clientX: number, clientY: number) => {
    const el = padRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.38;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setKnobPos({ x: dx, y: dy });
    onVirtualInput(dx / maxR, dy / maxR, dist > maxR * 0.88);
  };

  const resetStick = () => {
    draggingPadRef.current = false;
    setKnobPos({ x: 0, y: 0 });
    onVirtualInput(0, 0, false);
  };

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 md:p-4">
      {/* Projected 3D Floating Dark Landmark / Room Station Pills (matching reference photo!) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {projectedLabels.map((lbl) => (
          <button
            key={lbl.id}
            type="button"
            onClick={() => onClickProjectedLabel(lbl)}
            style={{
              left: `${lbl.screenX}px`,
              top: `${lbl.screenY}px`,
              transform: 'translate(-50%, -100%)',
            }}
            className="pointer-events-auto absolute px-2 py-0.5 rounded-md bg-[#111318]/90 hover:bg-[#1e2430] border border-white/20 shadow-lg flex items-center gap-1.5 text-[10px] font-bold text-white whitespace-nowrap cursor-pointer"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: lbl.accentColor }}
            />
            <span>{lbl.label}</span>
          </button>
        ))}
      </div>

      {/* TOP AREA */}
      <div className="relative z-10 flex items-start justify-between gap-2 sm:gap-3">
        {/* Top-Left: Compact Player & Needs Panel */}
        <div
          className="pointer-events-auto rounded-xl px-3 py-2.5 border border-[#f59e0b]/35 min-w-0 flex-1 max-w-[235px] sm:max-w-[320px]"
          style={{ backgroundColor: 'rgba(17, 15, 13, 0.9)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#fbbf24] truncate">
              {state.appearance.firstName} {state.appearance.lastName}
            </span>
            <span className="text-[11px] text-[#cbd5e1] font-mono-nums whitespace-nowrap">
              Dia {state.day} · {formatTime(state.timeMinutes)}
            </span>
          </div>

          <div className="mt-0.5 flex items-baseline justify-between gap-2">
            <span
              data-testid="hud-money"
              className="text-lg font-extrabold font-mono-nums text-[#4ade80] leading-tight"
            >
              {formatKz(state.moneyKz)}
            </span>
            <span className="text-[11px] text-[#94a3b8] truncate">
              {currentMuni.shortLabel} ({currentMuni.province})
            </span>
          </div>

          {/* 3 Compact Needs Bars */}
          <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-[#cbd5e1]">
            <div>
              <div className="flex justify-between mb-0.5">
                <span>Energia</span>
                <span className="font-mono-nums">{Math.round(state.needs.energy)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-[#38bdf8]"
                  style={{ width: `${Math.round(state.needs.energy)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-0.5">
                <span>Comida</span>
                <span className="font-mono-nums">{Math.round(state.needs.hunger)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-[#f59e0b]"
                  style={{ width: `${Math.round(state.needs.hunger)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-0.5">
                <span>Humor</span>
                <span className="font-mono-nums">{Math.round(state.needs.mood)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-[#4ade80]"
                  style={{ width: `${Math.round(state.needs.mood)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-1.5 text-[10px] text-[#cbd5e1] truncate">
            {activeJob.companyName ? `${activeJob.title} (${activeJob.companyName})` : activeJob.title} · {getEducationLabel(state.educationLevel)}
          </div>
          {condoActive && state.activeCondoRental && activeCondoDef && (
            <div className="text-[10px] text-[#5eead4] font-semibold truncate">
              Condomínio {activeCondoDef.name} · {formatRealRemaining(state.activeCondoRental.expiresAtRealMs)}
            </div>
          )}
          <div className="text-[10px] text-[#fbbf24]/90 truncate">
            {state.lastEventMessage}
          </div>
        </div>

        {/* Top-Center: Global Admin Broadcast Banner */}
        {latestAnnouncement && (
          <div className="hidden md:flex items-center gap-2 max-w-md px-3.5 py-2 rounded-xl bg-[#422006]/90 border border-[#f59e0b]/50 text-xs text-[#fef3c7] pointer-events-auto shadow-lg">
            <Megaphone className="w-4 h-4 text-[#fbbf24] shrink-0" />
            <div className="min-w-0 truncate">
              <strong className="text-[#fbbf24]">Aviso Global:</strong> {latestAnnouncement.message}
            </div>
          </div>
        )}

        {/* Top-Right: Admin, Missions & Controls */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto shrink-0">
          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="px-2.5 py-2 rounded-lg bg-[#f59e0b] hover:bg-[#fbbf24] text-[#120e0b] text-xs font-extrabold flex items-center gap-1 cursor-pointer shadow-md"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>ADM</span>
              </button>
            )}

            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowVirtualPad((v) => !v)}
              aria-label="Alternar joystick virtual"
              className={`p-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                showVirtualPad
                  ? 'bg-[#f59e0b] text-[#120e0b] border-[#f59e0b]'
                  : 'bg-[#120e0b]/90 text-[#faf6ef] border-white/15'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowMissions((m) => !m)}
              className="px-2.5 py-2 rounded-lg bg-[#120e0b]/90 border border-[#f59e0b]/35 text-xs font-semibold text-[#fbbf24] flex items-center gap-1 cursor-pointer"
            >
              <Target className="w-4 h-4" />
              <span>
                ({state.completedMissionIds.length}/{MISSIONS.length})
              </span>
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={onToggleMute}
              aria-label={muted ? 'Ativar som' : 'Silenciar som'}
              className="p-2 rounded-lg bg-[#120e0b]/90 border border-white/15 text-[#faf6ef] cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={onPause}
              aria-label="Pausa"
              className="p-2 rounded-lg bg-[#120e0b]/90 border border-white/15 text-[#faf6ef] cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          {!showMissions ? (
            <div
              className="hidden sm:block rounded-lg px-3 py-1.5 border border-white/10 text-[11px] text-[#e7dfd3] max-w-[265px] truncate"
              style={{ backgroundColor: 'rgba(18, 14, 11, 0.86)' }}
            >
              <span className="text-[#fbbf24] font-semibold">Meta:</span> {activeMission.title} ·{' '}
              <span className="text-[#94a3b8]">{getDayPhaseLabel(state.timeMinutes)}</span>
            </div>
          ) : (
            <div
              className="w-[295px] max-h-[270px] overflow-y-auto banda-scroll rounded-xl p-3 border border-[#f59e0b]/30 space-y-2"
              style={{ backgroundColor: 'rgba(18, 14, 11, 0.95)' }}
            >
              <div className="text-xs font-bold text-[#fbbf24]">Missões da Banda</div>
              {MISSIONS.map((m) => {
                const done = state.completedMissionIds.includes(m.id);
                return (
                  <div
                    key={m.id}
                    className={`p-2 rounded-lg border text-xs ${
                      done
                        ? 'bg-[#14532d]/30 border-[#22c55e]/35 text-[#bbf7d0]'
                        : 'bg-[#1c1612] border-white/10 text-[#e7dfd3]'
                    }`}
                  >
                    <div className="font-bold">
                      {done ? '✓ ' : ''}
                      {m.title}
                    </div>
                    <div className="text-[11px] text-[#94a3b8] mt-0.5">{m.description}</div>
                    <div className="text-[11px] text-[#fbbf24] font-mono-nums mt-0.5">
                      Prémio: {formatKz(m.rewardKz)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* NPC Dialogue Popup */}
      {dialogNpc && (
        <div className="relative z-10 mx-auto pointer-events-auto max-w-md w-full rounded-xl p-4 border border-[#f59e0b]/40 bg-[#14100d]/95 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-[#fbbf24]">{dialogNpc.name}</div>
              <div className="text-xs text-[#cbd5e1]">
                {dialogNpc.role} · {dialogNpc.stage} ({dialogNpc.affinity}%)
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenNpcModal(null)}
              className="px-2.5 py-1 rounded bg-[#2a211b] text-xs font-semibold text-[#faf6ef] cursor-pointer"
            >
              Fechar
            </button>
          </div>
          <p className="text-xs text-[#faf6ef] bg-[#1e1712] p-2.5 rounded-lg border border-white/10">
            {state.lastEventMessage}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onNpcAction(dialogNpc.id, 'talk')}
              className="px-3 py-1.5 rounded-lg bg-[#2a211b] hover:bg-[#3a2d24] text-xs font-semibold text-[#faf6ef] cursor-pointer"
            >
              Conversar
            </button>
            <button
              type="button"
              onClick={() => onNpcAction(dialogNpc.id, 'gift')}
              className="px-3 py-1.5 rounded-lg bg-[#2a211b] hover:bg-[#3a2d24] text-xs font-semibold text-[#fbbf24] cursor-pointer"
            >
              Presente (2.000 Kz)
            </button>
            <button
              type="button"
              onClick={() => onNpcAction(dialogNpc.id, 'date')}
              className="px-3 py-1.5 rounded-lg bg-[#be123c] hover:bg-[#e11d48] text-xs font-semibold text-white cursor-pointer"
            >
              Namorar
            </button>
            <button
              type="button"
              onClick={() => onNpcAction(dialogNpc.id, 'marry')}
              className="px-3 py-1.5 rounded-lg bg-[#b45309] hover:bg-[#d97706] text-xs font-semibold text-white cursor-pointer"
            >
              Casar
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM AREA */}
      <div className="relative z-10 flex items-end justify-between gap-3">
        {showVirtualPad ? (
          <div
            ref={padRef}
            onPointerDown={(e) => {
              draggingPadRef.current = true;
              updateStick(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (draggingPadRef.current) updateStick(e.clientX, e.clientY);
            }}
            onPointerUp={resetStick}
            onPointerCancel={resetStick}
            className="pointer-events-auto relative w-28 h-28 rounded-full border-2 border-[#f59e0b]/50 bg-[#120e0b]/80 touch-none flex items-center justify-center shrink-0"
            aria-label="Joystick virtual de movimento"
          >
            <div
              className="w-11 h-11 rounded-full bg-[#f59e0b] border-2 border-[#fef3c7]"
              style={{ transform: `translate(${knobPos.x}px, ${knobPos.y}px)` }}
            />
          </div>
        ) : (
          <div />
        )}

        {/* Unified Bottom Dock */}
        <div
          className="pointer-events-auto mx-auto rounded-2xl px-3 py-2 border border-[#f59e0b]/40 flex flex-wrap items-center justify-center gap-2 max-w-[96vw]"
          style={{ backgroundColor: 'rgba(17, 15, 13, 0.94)' }}
        >
          {state.sceneView === 'company_room' && activeComp ? (
            <>
              <span className="px-2 text-xs font-bold text-[#fbbf24]">
                Sala 3D: {activeComp.name}
              </span>
              <button
                type="button"
                onClick={() => onRoomInteract('work')}
                className="px-3.5 py-2 rounded-lg bg-[#16a34a] hover:bg-[#22c55e] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Briefcase className="w-4 h-4" />
                <span>
                  Trabalhar (-{activeJob.hungerCost}% Comida, -{activeJob.energyCost}% Energia)
                </span>
              </button>
              <button
                type="button"
                onClick={() => onRoomInteract('jobs')}
                className="px-3 py-2 rounded-lg bg-[#f59e0b] hover:bg-[#fbbf24] text-[#120e0b] text-xs font-bold cursor-pointer"
              >
                Vagas RH
              </button>
              <button
                type="button"
                onClick={() => onRoomInteract('exit')}
                className="px-3 py-2 rounded-lg bg-[#dc2626] hover:bg-[#ef4444] text-white text-xs font-bold cursor-pointer"
              >
                Sair para a Rua
              </button>
            </>
          ) : state.sceneView === 'home_room' ? (
            <>
              <span className="px-2 text-xs font-bold text-[#5eead4]">
                Casa 3D {placedTub ? `· ${placedTub.name}` : ''}
              </span>
              <button
                type="button"
                onClick={() => onRoomInteract('bathtub')}
                className="px-3.5 py-2 rounded-lg bg-[#0284c7] hover:bg-[#0ea5e9] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Bath className="w-4 h-4" />
                <span>
                  {placedTub
                    ? `Banheira (+${placedTub.energyRestore} Energia)`
                    : 'Comprar Banheira (>60k)'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onRoomInteract('cook')}
                className="px-3 py-2 rounded-lg bg-[#ea580c] hover:bg-[#f97316] text-white text-xs font-bold cursor-pointer"
              >
                Cozinhar Funge
              </button>
              <button
                type="button"
                onClick={() => onRoomInteract('sleep')}
                className="px-3 py-2 rounded-lg bg-[#b45309] hover:bg-[#d97706] text-white text-xs font-bold cursor-pointer"
              >
                Dormir (100% Energia)
              </button>
              <button
                type="button"
                onClick={() => onRoomInteract('exit')}
                className="px-3 py-2 rounded-lg bg-[#dc2626] hover:bg-[#ef4444] text-white text-xs font-bold cursor-pointer"
              >
                Sair para a Rua
              </button>
            </>
          ) : state.inVehicle && activeVehicle ? (
            <>
              <div className="px-2 text-xs font-mono-nums text-[#faf6ef] flex items-center gap-2">
                <span className="text-base font-extrabold text-[#fbbf24]">{state.vehicleSpeedKmh}</span>
                <span className="text-[#94a3b8]">km/h</span>
                <span className={activeVehicle.fuel < 20 ? 'text-[#ef4444]' : 'text-[#4ade80]'}>
                  Comb. {Math.round(activeVehicle.fuel)}%
                </span>
              </div>
              <button
                type="button"
                onClick={onHorn}
                className="px-3 py-2 rounded-lg bg-[#2a211b] text-xs font-semibold text-[#fbbf24] cursor-pointer"
              >
                Buzina [B]
              </button>
              <button
                type="button"
                onClick={onToggleLights}
                className="px-3 py-2 rounded-lg bg-[#2a211b] text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                Luzes
              </button>
              <button
                type="button"
                onClick={onToggleDoors}
                className="px-3 py-2 rounded-lg bg-[#2a211b] text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
              >
                <DoorOpen className="w-3.5 h-3.5" />
                Portas
              </button>
              <button
                type="button"
                onClick={onToggleRadio}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                  state.radioPlaying ? 'bg-[#9333ea] text-white' : 'bg-[#2a211b] text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                {state.radioPlaying ? currentTrack.genre.toUpperCase() : 'Rádio'}
              </button>
              <button
                type="button"
                onClick={onToggleVehicle}
                className="px-3.5 py-2 rounded-lg bg-[#dc2626] text-xs font-bold text-white cursor-pointer"
              >
                Sair [F]
              </button>
            </>
          ) : (
            <>
              {nearbyLandmark && (
                <button
                  type="button"
                  onClick={onInteractLandmark}
                  className="px-3.5 py-2 rounded-lg bg-[#f59e0b] hover:bg-[#fbbf24] text-[#120e0b] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Compass className="w-4 h-4" />
                  <span>{nearbyLandmark.actionLabel} [E]</span>
                </button>
              )}

              {nearbyNpc && (
                <button
                  type="button"
                  onClick={() => onOpenNpcModal(nearbyNpc.id)}
                  className="px-3 py-2 rounded-lg bg-[#16a34a] hover:bg-[#22c55e] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{nearbyNpc.name} [E]</span>
                </button>
              )}

              {state.nearbyVehiclePrompt && (
                <button
                  type="button"
                  onClick={onToggleVehicle}
                  className="px-3 py-2 rounded-lg bg-[#0284c7] hover:bg-[#0ea5e9] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Car className="w-4 h-4" />
                  <span>Conduzir [F]</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenFullMap}
                className="px-3 py-2 rounded-lg bg-[#0284c7] hover:bg-[#0ea5e9] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <MapIcon className="w-4 h-4" />
                <span>Mapa Completo</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenCantina('cantina')}
                className="px-3 py-2 rounded-lg bg-[#ea580c] hover:bg-[#f97316] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Coffee className="w-4 h-4" />
                <span>Cantina & Banheiras</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenPhone('home')}
                className="px-3 py-2 rounded-lg bg-[#221a14] hover:bg-[#32261d] border border-[#f59e0b]/40 text-xs font-bold text-[#fbbf24] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Smartphone className="w-4 h-4" />
                <span>Telemóvel [M]</span>
              </button>

              <button
                type="button"
                onClick={onOpenSchool}
                className="px-3 py-2 rounded-lg bg-[#1e3a8a]/85 hover:bg-[#2563eb] border border-[#60a5fa]/35 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Escola</span>
              </button>

              <button
                type="button"
                onClick={onDance}
                className="hidden sm:inline-flex px-3 py-2 rounded-lg bg-[#221a14] hover:bg-[#32261d] text-xs font-semibold text-[#e7dfd3] cursor-pointer whitespace-nowrap"
              >
                Dançar [T]
              </button>
            </>
          )}
        </div>

        <div />
      </div>
    </div>
  );
};
