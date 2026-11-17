import React, { useEffect, useRef, useState } from 'react';
import { Dices, Sparkles, ArrowLeft, Play, MapPin, HeartHandshake } from 'lucide-react';
import { BIRTH_CLASSES, PROPERTIES, VEHICLES } from '../game/angolaData';
import { formatKz, rollBirthLotteryOutcome } from '../game/simulation';
import { BirthLotteryOutcome, CharacterAppearance } from '../game/types';

interface LifeLotteryModalProps {
  appearance: CharacterAppearance;
  onConfirm: (outcome: BirthLotteryOutcome) => void;
  onBack: () => void;
}

export const LifeLotteryModal: React.FC<LifeLotteryModalProps> = ({
  appearance,
  onConfirm,
  onBack,
}) => {
  const [spinning, setSpinning] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<BirthLotteryOutcome | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleSpin = () => {
    if (spinning || outcome) return;
    setSpinning(true);

    const rolled = rollBirthLotteryOutcome();
    const winnerIndex = Math.max(
      0,
      BIRTH_CLASSES.findIndex((c) => c.id === rolled.birthClassId),
    );
    const totalSteps = 12 + winnerIndex;
    let step = 0;

    const advance = () => {
      setHighlightedIndex(step % BIRTH_CLASSES.length);
      step += 1;
      if (step <= totalSteps) {
        const delay = 55 + Math.round((step / totalSteps) * 95);
        timerRef.current = window.setTimeout(advance, delay);
      } else {
        setSpinning(false);
        setHighlightedIndex(winnerIndex);
        setOutcome(rolled);
      }
    };

    advance();
  };

  const drawnDef = outcome
    ? BIRTH_CLASSES.find((c) => c.id === outcome.birthClassId) ?? null
    : null;
  const drawnProp = drawnDef
    ? PROPERTIES.find((p) => p.id === drawnDef.startingPropertyId)
    : null;
  const drawnVehicle = drawnDef?.startingVehicleId
    ? VEHICLES.find((v) => v.id === drawnDef.startingVehicleId)
    : null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-6 pointer-events-auto"
      style={{ backgroundColor: 'rgba(13, 10, 8, 0.84)' }}
    >
      <div
        role="dialog"
        aria-label="Lotaria da Vida"
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto banda-scroll rounded-2xl border border-[#f59e0b]/40 p-5 sm:p-7 space-y-5"
        style={{ backgroundColor: '#16110d' }}
      >
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#f59e0b]">
              <Dices className="w-4 h-4" />
              <span>Sorteio Único de Nascimento · Angola</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#faf6ef] mt-1">
              Lotaria da Vida
            </h1>
            <p className="text-xs sm:text-sm text-[#cbd5e1] mt-1">
              {appearance.firstName} {appearance.lastName}, gira uma única vez para sortear a tua
              classe, o teu bairro de origem e a história da tua mãe.
            </p>
          </div>

          {!outcome && (
            <button
              type="button"
              onClick={onBack}
              disabled={spinning}
              className="px-3 py-2 rounded-lg bg-[#221a14] hover:bg-[#2f251e] border border-white/15 text-xs font-semibold text-[#e7dfd3] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          )}
        </div>

        {/* 4 Birth Tier Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BIRTH_CLASSES.map((tier, idx) => {
            const prop = PROPERTIES.find((p) => p.id === tier.startingPropertyId);
            const veh = tier.startingVehicleId
              ? VEHICLES.find((v) => v.id === tier.startingVehicleId)
              : null;
            const isHighlighted = highlightedIndex === idx;
            const isWinner = outcome?.birthClassId === tier.id;
            const minTotal = tier.minMoneyKz + tier.minBankKz;
            const maxTotal =
              tier.id === 'acima_media'
                ? Math.min(500000, tier.maxMoneyKz + tier.maxBankKz)
                : tier.maxMoneyKz + tier.maxBankKz;

            const motherExamples = tier.motherHistories
              .map((h) => h.motherOccupation)
              .slice(0, 2)
              .join(' / ');

            return (
              <div
                key={tier.id}
                data-testid={`lottery-tier-${tier.id}`}
                data-selected={isWinner ? 'true' : 'false'}
                className="rounded-xl p-4 border transition-colors"
                style={{
                  backgroundColor: isWinner
                    ? '#261d14'
                    : isHighlighted
                      ? '#211912'
                      : '#1c1612',
                  borderColor: isWinner
                    ? tier.accentColor
                    : isHighlighted
                      ? '#fbbf24'
                      : 'rgba(255, 255, 255, 0.1)',
                  boxShadow: isWinner ? `0 0 0 1px ${tier.accentColor}` : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div
                      className="text-base font-extrabold"
                      style={{ color: tier.accentColor }}
                    >
                      {tier.label}
                    </div>
                    <div className="text-[11px] text-[#cbd5e1]">{tier.subtitle}</div>
                  </div>
                  <span className="text-xs font-mono-nums font-bold text-[#94a3b8]">
                    {Math.round(tier.probability * 100)}%
                  </span>
                </div>

                <div className="mt-3 p-2.5 rounded-lg bg-[#14100d] border border-white/5">
                  <div className="text-[10px] text-[#94a3b8]">Património Inicial</div>
                  <div className="text-xs sm:text-sm font-mono-nums font-bold text-[#4ade80]">
                    {formatKz(minTotal)} – {formatKz(maxTotal)}
                  </div>
                </div>

                <div className="mt-2.5 text-[11px] text-[#cbd5e1] space-y-0.5">
                  <div>
                    Mãe possível: <span className="text-[#fbbf24] font-medium">{motherExamples}</span>
                  </div>
                  <div>
                    Casa: <span className="text-[#faf6ef] font-medium">{prop?.name}</span>
                  </div>
                  <div>
                    Transporte:{' '}
                    <span className="text-[#faf6ef] font-medium">
                      {veh ? veh.name : 'A pé (sem veículo próprio)'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Result Banner with Mother's History & Exact Rolled Kwanzas */}
        {outcome && drawnDef && (
          <div
            data-testid="lottery-result"
            className="rounded-xl p-4 sm:p-5 border space-y-3"
            style={{
              backgroundColor: '#211912',
              borderColor: drawnDef.accentColor,
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div
                className="flex items-center gap-2 text-base font-extrabold"
                style={{ color: drawnDef.accentColor }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Destino Sorteado: {drawnDef.label}</span>
              </div>
              <span className="text-xs font-semibold text-[#fbbf24] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Nascido(a) em {outcome.motherHistory.birthDistrict}
              </span>
            </div>

            {/* Mother History Box */}
            <div
              data-testid="lottery-mother-history"
              className="p-3 rounded-lg bg-[#14100d] border border-white/10 space-y-1"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#fbbf24]">
                <HeartHandshake className="w-4 h-4" />
                <span>Histórico da Tua Mãe: {outcome.motherHistory.motherOccupation}</span>
              </div>
              <p className="text-xs text-[#e7dfd3] leading-relaxed">
                {outcome.motherHistory.story}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#14100d] border border-white/5">
                <div className="text-[10px] text-[#94a3b8]">Dinheiro em Mão</div>
                <div className="font-mono-nums font-bold text-[#4ade80]">
                  {formatKz(outcome.moneyKz)}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#14100d] border border-white/5">
                <div className="text-[10px] text-[#94a3b8]">Banco BAI</div>
                <div className="font-mono-nums font-bold text-[#38bdf8]">
                  {formatKz(outcome.bankKz)}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#14100d] border border-white/5">
                <div className="text-[10px] text-[#94a3b8]">Total Inicial</div>
                <div className="font-mono-nums font-bold text-[#fbbf24]">
                  {formatKz(outcome.moneyKz + outcome.bankKz)}
                </div>
              </div>
            </div>

            <div className="text-xs text-[#cbd5e1]">
              Residência: <strong className="text-[#faf6ef]">{drawnProp?.name}</strong> ·{' '}
              Transporte:{' '}
              <strong className="text-[#faf6ef]">
                {drawnVehicle ? drawnVehicle.name : 'Sem veículo (a pé)'}
              </strong>
            </div>
          </div>
        )}

        {/* Action Footer — strictly NO re-roll button */}
        <div className="flex items-center justify-end gap-3 pt-1">
          {!outcome ? (
            <button
              type="button"
              onClick={handleSpin}
              disabled={spinning}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#f59e0b] hover:bg-[#fbbf24] text-[#120e0b] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Dices className="w-4 h-4" />
              <span>{spinning ? 'A sortear o teu destino...' : 'Girar Lotaria da Vida'}</span>
            </button>
          ) : (
            <button
              type="button"
              data-start="true"
              onClick={() => onConfirm(outcome)}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#16a34a] hover:bg-[#22c55e] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Começar Vida na Banda</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
