import React from 'react';

interface TitleScreenProps {
  onOpenCreator: () => void;
  onQuickStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onOpenCreator, onQuickStart }) => {
  return (
    <div
      className="fixed inset-0 z-20 flex flex-col justify-between p-6 md:p-12 pointer-events-none"
      style={{
        background:
          'linear-gradient(90deg, rgba(13,10,8,0.88) 0%, rgba(13,10,8,0.58) 42%, rgba(13,10,8,0.12) 100%)',
      }}
    >
      <div className="max-w-xl my-auto pointer-events-auto">
        {/* Bespoke inline SVG Angolan Crest & Title Lockup */}
        <svg
          viewBox="0 0 460 132"
          className="w-full max-w-[440px] mb-5"
          role="img"
          aria-label="Vida na Banda - Luanda Angola"
        >
          <defs>
            <linearGradient id="bandaGold" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fde047" />
            </linearGradient>
          </defs>
          {/* Emblema geométrico Samakaka + Roda dentada estilizada */}
          <rect x="4" y="14" width="64" height="64" rx="14" fill="#991b1b" stroke="#f59e0b" strokeWidth="3" />
          <polygon points="36,24 56,46 36,68 16,46" fill="#111827" stroke="#fbbf24" strokeWidth="2.5" />
          <circle cx="36" cy="46" r="7" fill="#f59e0b" />

          <text
            x="84"
            y="44"
            fill="url(#bandaGold)"
            fontFamily="Outfit, sans-serif"
            fontWeight="800"
            fontSize="38"
            letterSpacing="1"
          >
            VIDA NA BANDA
          </text>
          <text
            x="86"
            y="72"
            fill="#e7dfd3"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontWeight="600"
            fontSize="15"
            letterSpacing="3.5"
          >
            LUANDA · ANGOLA · SIMULADOR 3D
          </text>
          <line x1="4" y1="98" x2="360" y2="98" stroke="#f59e0b" strokeOpacity="0.45" strokeWidth="2" />
          <text
            x="4"
            y="120"
            fill="#cbd5e1"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontWeight="500"
            fontSize="14"
          >
            Do primeiro Kwanza ao topo da cidade — vive a cultura angolana.
          </text>
        </svg>

        <div className="flex flex-wrap items-center gap-3 mt-6">
          <button
            type="button"
            onClick={onOpenCreator}
            className="px-6 py-3.5 rounded-lg bg-[#f59e0b] hover:bg-[#fbbf24] text-[#120e0b] font-bold text-base transition-colors cursor-pointer whitespace-nowrap"
          >
            Criar Personagem
          </button>

          <button
            type="button"
            data-start="true"
            onClick={onQuickStart}
            className="px-6 py-3.5 rounded-lg bg-[#1c1612]/90 hover:bg-[#2a211b] text-[#faf6ef] border border-[#f59e0b]/45 font-semibold text-base transition-colors cursor-pointer whitespace-nowrap"
          >
            Entrar Direto na Banda
          </button>
        </div>
      </div>

      {/* Single flat borderless control hint line */}
      <div className="text-xs md:text-sm text-[#cbd5e1] tracking-wide">
        Tocar no Chão / WASD Mover · Clicar no Edifício Entrar na Sala 3D · M Telemóvel · T Dançar Kuduro
      </div>
    </div>
  );
};
