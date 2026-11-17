import React, { useEffect, useState } from 'react';
import { Car, Plane } from 'lucide-react';
import { formatKz, getMunicipalityDef } from '../game/simulation';
import { TravelPlan } from '../game/types';

interface TravelCutsceneModalProps {
  plan: TravelPlan;
  onComplete: () => void;
}

export const TravelCutsceneModal: React.FC<TravelCutsceneModalProps> = ({ plan, onComplete }) => {
  const [secondsLeft, setSecondsLeft] = useState(plan.durationSec);
  const fromM = getMunicipalityDef(plan.fromMunicipalityId);
  const toM = getMunicipalityDef(plan.toMunicipalityId);

  useEffect(() => {
    setSecondsLeft(plan.durationSec);
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          window.setTimeout(onComplete, 250);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [plan, onComplete]);

  const progress = Math.min(100, Math.round(((plan.durationSec - secondsLeft) / plan.durationSec) * 100));
  const isPlane = plan.mode === 'aviao';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06111c]/95 p-4">
      <div
        role="dialog"
        aria-label={isPlane ? 'Viagem de Avião TAAG' : 'Viagem de Táxi'}
        className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0e1722] overflow-hidden shadow-2xl"
      >
        {/* Animated Scenic Header */}
        <div
          className="relative h-52 overflow-hidden flex items-center justify-center"
          style={{
            background: isPlane
              ? 'linear-gradient(180deg, #0284c7 0%, #38bdf8 55%, #bae6fd 100%)'
              : 'linear-gradient(180deg, #ea580c 0%, #f59e0b 45%, #1e293b 48%, #0f172a 100%)',
          }}
        >
          {isPlane ? (
            <>
              {/* Moving clouds */}
              <div
                className="absolute top-8 w-28 h-8 rounded-full bg-white/75 blur-[1px] transition-all duration-1000"
                style={{ left: `${100 - progress}%` }}
              />
              <div
                className="absolute bottom-10 w-36 h-10 rounded-full bg-white/65 blur-[1px] transition-all duration-1000"
                style={{ left: `${Math.max(-20, 80 - progress * 1.1)}%` }}
              />
              {/* Animated Plane */}
              <div
                className="relative z-10 flex flex-col items-center transition-transform duration-700"
                style={{
                  transform: `translateX(${(progress - 50) * 2.2}px) translateY(${Math.sin(progress * 0.12) * 8}px) rotate(-6deg)`,
                }}
              >
                <div className="p-4 rounded-2xl bg-[#b91c1c] border-2 border-[#facc15] shadow-xl">
                  <Plane className="w-12 h-12 text-white" />
                </div>
                <span className="mt-2 px-3 py-0.5 rounded-full bg-[#111827]/85 text-[11px] font-bold text-[#facc15]">
                  TAAG LINHAS AÉREAS DE ANGOLA
                </span>
              </div>
            </>
          ) : (
            <>
              {/* Road markings */}
              <div className="absolute bottom-10 left-0 right-0 h-1 border-t-4 border-dashed border-white/70" />
              {/* Animated Taxi / Candongueiro */}
              <div
                className="relative z-10 mt-14 flex flex-col items-center transition-transform duration-700"
                style={{
                  transform: `translateX(${(progress - 50) * 2.4}px)`,
                }}
              >
                <div className="p-3.5 rounded-2xl bg-[#0284c7] border-2 border-white shadow-xl">
                  <Car className="w-11 h-11 text-white" />
                </div>
                <span className="mt-1.5 px-3 py-0.5 rounded-full bg-[#111827]/90 text-[11px] font-bold text-[#fbbf24]">
                  TÁXI / CANDONGUEIRO EXPRESSO
                </span>
              </div>
            </>
          )}

          {/* Countdown Badge */}
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/75 border border-white/20 text-xs font-mono-nums font-bold text-white">
            Chegada em {secondsLeft}s
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                {isPlane ? 'Voo Interprovincial TAAG' : 'Deslocação Municipal de Táxi'}
              </div>
              <div className="text-lg font-extrabold text-white mt-0.5">
                {fromM.shortLabel} ({fromM.province}) → {toM.shortLabel} ({toM.province})
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-[#94a3b8]">Bilhete</div>
              <div className="text-sm font-mono-nums font-bold text-[#fbbf24]">
                {formatKz(plan.costKz)}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  backgroundColor: isPlane ? '#38bdf8' : '#f59e0b',
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#94a3b8]">
              <span>A sair de {fromM.name}</span>
              <span>{progress}%</span>
              <span>Destino: {toM.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
