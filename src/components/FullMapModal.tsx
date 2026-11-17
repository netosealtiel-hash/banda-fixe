import React, { useState } from 'react';
import {
  Briefcase,
  Building2,
  Car,
  Coffee,
  Home,
  MapPin,
  Plane,
  ShieldAlert,
  X,
} from 'lucide-react';
import { ANGOLAN_COMPANIES, LANDMARKS, MUNICIPALITIES } from '../game/angolaData';
import { formatKz, getMunicipalityDef } from '../game/simulation';
import { GameSnapshot, MunicipalityId } from '../game/types';

interface FullMapModalProps {
  state: GameSnapshot;
  onClose: () => void;
  onWalkToLandmark: (x: number, z: number, landmarkId: string, label: string) => void;
  onTravelToMunicipality: (targetId: MunicipalityId) => void;
}

export const FullMapModal: React.FC<FullMapModalProps> = ({
  state,
  onClose,
  onWalkToLandmark,
  onTravelToMunicipality,
}) => {
  const [selectedMuniId, setSelectedMuniId] = useState<MunicipalityId>(state.currentMunicipalityId);
  const currentMuni = getMunicipalityDef(state.currentMunicipalityId);
  const viewingMuni = getMunicipalityDef(selectedMuniId);
  const landmarks = LANDMARKS.filter((l) => l.municipalityId === selectedMuniId);
  const isViewingCurrent = selectedMuniId === state.currentMunicipalityId;

  const isProvinceFlight = currentMuni.province !== viewingMuni.province;
  const travelCost = isProvinceFlight ? viewingMuni.flightCostKz : viewingMuni.taxiCostKz;

  const myCompanyName = state.currentCompanyId
    ? ANGOLAN_COMPANIES.find((c) => c.id === state.currentCompanyId)?.name ?? null
    : null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-3 sm:p-5">
      <div
        role="dialog"
        aria-label="Mapa Completo de Angola e Municípios"
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto banda-scroll rounded-2xl border border-[#f59e0b]/40 bg-[#14100d] p-4 sm:p-6 space-y-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#fbbf24]">
              <MapPin className="w-4 h-4" />
              <span>Mapa Completo · Vida na Banda 3D</span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-0.5">
              {viewingMuni.name} ({viewingMuni.province})
            </h2>
            <p className="text-xs text-[#cbd5e1]">{viewingMuni.tagline}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar mapa"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary of Player Key Locations */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-[#1e1712] border border-[#14b8a6]/35 flex items-center gap-2.5">
            <Home className="w-5 h-5 text-[#14b8a6] shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-[#94a3b8] uppercase font-bold">Tua Casa & Condomínio</div>
              <div className="font-bold text-white truncate">
                {state.activeCondoRental ? 'Condomínio Ativo' : 'Casa em ' + getMunicipalityDef(state.homeMunicipalityId).shortLabel}
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#1e1712] border border-[#f59e0b]/35 flex items-center gap-2.5">
            <Briefcase className="w-5 h-5 text-[#fbbf24] shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-[#94a3b8] uppercase font-bold">Teu Trabalho Atual</div>
              <div className="font-bold text-white truncate">
                {state.currentCompanyJobTitle
                  ? `${state.currentCompanyJobTitle} (${myCompanyName})`
                  : state.profession || 'Sem emprego (vai a uma Empresa)'}
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#1e1712] border border-[#ef4444]/35 flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-[#f87171] shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-[#94a3b8] uppercase font-bold">Aviso da Banda</div>
              <div className="font-bold text-[#fecaca] truncate">
                Gatunos rondam esquinas!
              </div>
            </div>
          </div>
        </div>

        {/* Municipality & Province Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {MUNICIPALITIES.map((m) => {
            const active = m.id === selectedMuniId;
            const here = m.id === state.currentMunicipalityId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMuniId(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? 'bg-[#f59e0b] text-[#120e0b] border-[#f59e0b]'
                    : 'bg-[#1e1712] text-[#e2e8f0] border-white/10 hover:border-[#f59e0b]/40'
                }`}
              >
                {m.province !== 'Luanda' ? (
                  <Plane className="w-3.5 h-3.5" />
                ) : (
                  <Car className="w-3.5 h-3.5" />
                )}
                <span>{m.shortLabel}</span>
                {here && (
                  <span className="px-1.5 py-0.2 rounded bg-black/25 text-[10px]">
                    Estás aqui
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Travel Action Banner when viewing another municipality/province */}
        {!isViewingCurrent && (
          <div className="p-3.5 rounded-xl bg-[#0c4a6e]/40 border border-[#38bdf8]/40 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-[#e0f2fe]">
              <div className="font-bold text-sm text-white">
                Viajar para {viewingMuni.name} ({viewingMuni.province})
              </div>
              <div>
                {isProvinceFlight
                  ? 'Viagem interprovincial de Avião TAAG com animação de voo.'
                  : 'Viagem de Táxi / Candongueiro entre municípios de Luanda.'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onTravelToMunicipality(viewingMuni.id);
              }}
              className="px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0ea5e9] text-white text-xs font-extrabold flex items-center gap-2 cursor-pointer"
            >
              {isProvinceFlight ? <Plane className="w-4 h-4" /> : <Car className="w-4 h-4" />}
              <span>
                {isProvinceFlight ? 'Apanhar Avião TAAG' : 'Apanhar Táxi'} ({formatKz(travelCost)})
              </span>
            </button>
          </div>
        )}

        {/* Interactive Schematic Grid of the Compact Diorama + Legend List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top-down Diorama Island Map */}
          <div
            className="relative aspect-square rounded-xl border border-white/15 overflow-hidden"
            style={{ backgroundColor: viewingMuni.waterColor }}
          >
            {/* Sand Island */}
            <div
              className="absolute inset-[7%] rounded-lg border-2 border-[#c49d64]"
              style={{ backgroundColor: viewingMuni.groundColor }}
            >
              {/* Roads at 33% and 67% */}
              <div className="absolute left-0 right-0 top-[31%] h-[7%] bg-[#262930]" />
              <div className="absolute left-0 right-0 top-[62%] h-[7%] bg-[#262930]" />
              <div className="absolute top-0 bottom-0 left-[31%] w-[7%] bg-[#262930]" />
              <div className="absolute top-0 bottom-0 left-[62%] w-[7%] bg-[#262930]" />

              {/* Landmarks plotted accurately */}
              {landmarks.map((lm) => {
                const leftPct = ((lm.x + 24) / 48) * 100;
                const topPct = ((lm.z + 24) / 48) * 100;
                const isMyJob = state.currentCompanyId && lm.companyId === state.currentCompanyId;
                return (
                  <button
                    key={lm.id}
                    type="button"
                    disabled={!isViewingCurrent}
                    onClick={() => {
                      if (!isViewingCurrent) return;
                      onWalkToLandmark(lm.x, Math.min(20, lm.z + 3.5), lm.id, lm.name);
                      onClose();
                    }}
                    title={isViewingCurrent ? `Caminhar até ${lm.name}` : lm.name}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute px-1.5 py-1 rounded-md text-[10px] font-bold shadow border transition-transform hover:scale-105 ${
                      isMyJob
                        ? 'bg-[#f59e0b] text-[#120e0b] border-white'
                        : 'bg-[#111318]/90 text-white border-white/25'
                    } ${isViewingCurrent ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    {lm.shortLabel}
                  </button>
                );
              })}

              {/* Player Position Dot when viewing current municipality */}
              {isViewingCurrent && (
                <div
                  title="Tua posição atual"
                  style={{
                    left: `${((state.playerX + 24) / 48) * 100}%`,
                    top: `${((state.playerZ + 24) / 48) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute w-4 h-4 rounded-full bg-[#22c55e] border-2 border-white shadow-lg animate-pulse"
                />
              )}
            </div>
          </div>

          {/* Clickable Locations List */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto banda-scroll pr-1">
            <div className="text-xs font-bold text-[#fbbf24]">
              Locais em {viewingMuni.shortLabel} {isViewingCurrent ? '(clica para ir a pé)' : ''}
            </div>
            {landmarks.map((lm) => {
              const isMyJob = state.currentCompanyId && lm.companyId === state.currentCompanyId;
              return (
                <button
                  key={lm.id}
                  type="button"
                  disabled={!isViewingCurrent}
                  onClick={() => {
                    onWalkToLandmark(lm.x, Math.min(20, lm.z + 3.5), lm.id, lm.name);
                    onClose();
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                    isViewingCurrent
                      ? 'bg-[#1e1712] hover:bg-[#2a2119] border-white/10 cursor-pointer'
                      : 'bg-[#1a1410] border-white/5 opacity-85 cursor-default'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="p-2 rounded-lg shrink-0"
                      style={{ backgroundColor: `${lm.accentColor}25`, color: lm.accentColor }}
                    >
                      {lm.category === 'Casa' || lm.category === 'Condomínio' ? (
                        <Home className="w-4 h-4" />
                      ) : lm.category === 'Cantina' ? (
                        <Coffee className="w-4 h-4" />
                      ) : lm.category === 'Trabalho' ? (
                        <Building2 className="w-4 h-4" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {lm.name} {isMyJob ? '★ (Teu Trabalho)' : ''}
                      </div>
                      <div className="text-[11px] text-[#94a3b8] truncate">{lm.description}</div>
                    </div>
                  </div>
                  {isViewingCurrent && (
                    <span className="text-[11px] font-bold text-[#fbbf24] shrink-0">Ir →</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
