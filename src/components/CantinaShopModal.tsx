import React, { useState } from 'react';
import { Bath, Coffee, CheckCircle2, ShoppingBag, Utensils, X } from 'lucide-react';
import { BATHTUBS, MARKET_ITEMS } from '../game/angolaData';
import { formatKz } from '../game/simulation';
import { BathtubId, GameSnapshot } from '../game/types';

interface CantinaShopModalProps {
  state: GameSnapshot;
  initialTab?: 'cantina' | 'banheiras';
  onClose: () => void;
  onBuyMarketItem: (itemId: string) => void;
  onBuyBathtub: (bathtubId: BathtubId) => void;
}

export const CantinaShopModal: React.FC<CantinaShopModalProps> = ({
  state,
  initialTab = 'cantina',
  onClose,
  onBuyMarketItem,
  onBuyBathtub,
}) => {
  const [tab, setTab] = useState<'cantina' | 'banheiras'>(initialTab);

  const foodItems = MARKET_ITEMS.filter(
    (m) => m.category === 'Comida Típica' || m.category === 'Café & Energia',
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4">
      <div
        role="dialog"
        aria-label="Cantina e Loja de Banheiras"
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto banda-scroll rounded-2xl border border-[#f59e0b]/40 bg-[#14100d] p-5 space-y-4"
      >
        <div className="flex items-start justify-between border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#fbbf24]">
              <ShoppingBag className="w-4 h-4" />
              <span>Cantinho da Bita & Loja de Decoração</span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-0.5">
              Comida, Cafés de Energia & Banheiras
            </h2>
            <p className="text-xs text-[#cbd5e1]">
              Saldo: <span className="font-mono-nums font-bold text-[#4ade80]">{formatKz(state.moneyKz)}</span> · Comida:{' '}
              <span className="font-bold text-[#fbbf24]">{Math.round(state.needs.hunger)}%</span> · Energia:{' '}
              <span className="font-bold text-[#38bdf8]">{Math.round(state.needs.energy)}%</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Cantina"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTab('cantina')}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'cantina'
                ? 'bg-[#f59e0b] text-[#120e0b]'
                : 'bg-[#1e1712] text-[#cbd5e1] border border-white/10'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Cantina: Comida & Cafés</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('banheiras')}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'banheiras'
                ? 'bg-[#0284c7] text-white'
                : 'bg-[#1e1712] text-[#cbd5e1] border border-white/10'
            }`}
          >
            <Bath className="w-4 h-4" />
            <span>Banheiras (&gt;60.000 Kz)</span>
          </button>
        </div>

        {tab === 'cantina' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {foodItems.map((item) => {
              const isCoffee = item.category === 'Café & Energia';
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[#1e1712] border border-white/10 flex flex-col justify-between gap-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-white flex items-center gap-1.5">
                        {isCoffee ? (
                          <Coffee className="w-4 h-4 text-[#38bdf8]" />
                        ) : (
                          <Utensils className="w-4 h-4 text-[#f59e0b]" />
                        )}
                        <span>{item.name}</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8] mt-1">{item.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-[11px] font-semibold">
                      {item.hungerRestore && (
                        <span className="text-[#fbbf24]">+{item.hungerRestore} Comida</span>
                      )}
                      {item.energyRestore && (
                        <span className="text-[#38bdf8]">+{item.energyRestore} Energia</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onBuyMarketItem(item.id)}
                    className="w-full py-2 rounded-lg bg-[#f59e0b] hover:bg-[#fbbf24] text-[#120e0b] text-xs font-extrabold cursor-pointer"
                  >
                    Comprar & Consumir · {formatKz(item.priceKz)}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-[#0c4a6e]/35 border border-[#38bdf8]/35 text-xs text-[#e0f2fe]">
              Compra uma banheira para decorar a tua Casa ou Condomínio. Quando entrares em Casa 3D,
              clica na Banheira para ganhar Energia instantaneamente!
            </div>
            {BATHTUBS.map((tub) => {
              const owned = state.ownedBathtubs.includes(tub.id);
              const placed = state.placedBathtubId === tub.id;
              return (
                <div
                  key={tub.id}
                  className="p-3.5 rounded-xl bg-[#1e1712] border border-white/10 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/40 shrink-0"
                        style={{ backgroundColor: tub.trimColor }}
                      />
                      <span className="text-sm font-bold text-white">{tub.name}</span>
                      {placed && (
                        <span className="px-2 py-0.5 rounded bg-[#16a34a]/30 text-[#4ade80] text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Instalada
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#cbd5e1] mt-1">{tub.description}</p>
                    <div className="text-[11px] font-mono-nums text-[#38bdf8] mt-1">
                      Ao clicar na banheira: +{tub.energyRestore} Energia · +{tub.moodRestore} Humor
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onBuyBathtub(tub.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-extrabold cursor-pointer whitespace-nowrap ${
                      placed
                        ? 'bg-[#16a34a] text-white'
                        : owned
                          ? 'bg-[#0284c7] hover:bg-[#0ea5e9] text-white'
                          : 'bg-[#f59e0b] hover:bg-[#fbbf24] text-[#120e0b]'
                    }`}
                  >
                    {placed
                      ? 'Em Uso na Casa 3D'
                      : owned
                        ? 'Instalar na Casa'
                        : `Comprar · ${formatKz(tub.priceKz)}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
