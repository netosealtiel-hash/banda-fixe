import React from 'react';
import { BookOpen, Briefcase, CheckCircle2, GraduationCap, Lock, X } from 'lucide-react';
import { EDUCATION_LEVELS } from '../game/angolaData';
import { formatKz, getEducationLabel, getEducationRank } from '../game/simulation';
import { GameSnapshot } from '../game/types';

interface SchoolModalProps {
  state: GameSnapshot;
  onClose: () => void;
  onStudy: (mode: 'free_library' | 'paid_course') => void;
  onOpenJobs: () => void;
}

export const SchoolModal: React.FC<SchoolModalProps> = ({
  state,
  onClose,
  onStudy,
  onOpenJobs,
}) => {
  const currentRank = getEducationRank(state.educationLevel);
  const currentLabel = getEducationLabel(state.educationLevel);
  const nextTier = EDUCATION_LEVELS.find((e) => e.rank === currentRank + 1) ?? null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-auto"
      style={{ backgroundColor: 'rgba(13, 10, 8, 0.8)' }}
    >
      <div
        role="dialog"
        aria-label="Escola e Universidade de Luanda"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto banda-scroll rounded-2xl border border-[#3b82f6]/40 overflow-hidden"
        style={{ backgroundColor: '#16110d' }}
      >
        <div
          className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.28) 0%, #1c1612 75%)',
          }}
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#60a5fa]">
              <GraduationCap className="w-4 h-4" />
              <span>Educação · Miramar, Luanda</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#faf6ef] mt-1">
              Escola & Universidade
            </h2>
            <p className="text-xs text-[#cbd5e1] mt-1">
              Estuda para conquistar diplomas, desbloquear vagas na Sonangol e aumentar a tua hipótese de ser aceite nas entrevistas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Escola e Universidade"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#faf6ef] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Current Education Progress */}
          <div className="p-4 rounded-xl bg-[#1e1712] border border-[#3b82f6]/35 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] text-[#94a3b8]">Formação Atual</div>
                <div className="text-base font-extrabold text-[#60a5fa]" data-testid="current-education-label">
                  {currentLabel}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-[#94a3b8]">Aulas Concluídas</div>
                <div className="text-sm font-bold font-mono-nums text-[#fbbf24]">
                  {state.studySessionsCompleted}
                </div>
              </div>
            </div>

            {nextTier ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#e7dfd3]">
                    Progresso para <strong className="text-white">{nextTier.label}</strong>
                  </span>
                  <span className="font-mono-nums font-bold text-[#60a5fa]" data-testid="study-progress-pct">
                    {state.studyProgress}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-[#3b82f6]"
                    style={{ width: `${state.studyProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs font-semibold text-[#4ade80]">
                Nível académico máximo alcançado! Podes continuar a investigar para ganhar reputação.
              </div>
            )}

            <div className="text-xs text-[#cbd5e1] bg-[#14100d] p-2.5 rounded-lg border border-white/10">
              {state.lastEventMessage}
            </div>
          </div>

          {/* Study Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              data-testid="study-paid-btn"
              onClick={() => onStudy('paid_course')}
              className="p-3.5 rounded-xl bg-[#2563eb] hover:bg-[#3b82f6] text-white text-left cursor-pointer space-y-1"
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" />
                  <span>Estudar Curso Intensivo</span>
                </span>
                <span className="font-mono-nums text-[#fef08a]">
                  {nextTier ? formatKz(nextTier.tuitionKz) : '5.000 Kz'}
                </span>
              </div>
              <div className="text-[11px] text-[#dbeafe]">
                {nextTier
                  ? '+50% do diploma · +4 Reputação'
                  : 'Investigação Universitária · +5 Reputação'}
              </div>
            </button>

            <button
              type="button"
              data-testid="study-free-btn"
              onClick={() => onStudy('free_library')}
              className="p-3.5 rounded-xl bg-[#221a14] hover:bg-[#2f251e] border border-white/15 text-[#faf6ef] text-left cursor-pointer space-y-1"
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-[#4ade80]">
                  <BookOpen className="w-4 h-4" />
                  <span>Biblioteca Gratuita</span>
                </span>
                <span className="text-[#4ade80]">Grátis</span>
              </div>
              <div className="text-[11px] text-[#cbd5e1]">
                {nextTier
                  ? '+25% do diploma · -12 Energia'
                  : 'Estudo livre · +5 Reputação'}
              </div>
            </button>
          </div>

          {/* Education Tiers Ladder */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#cbd5e1]">
              Níveis Académicos & Carreiras
            </div>
            {EDUCATION_LEVELS.map((lvl) => {
              const completed = currentRank >= lvl.rank;
              const isNext = currentRank + 1 === lvl.rank;
              return (
                <div
                  key={lvl.id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-2 ${
                    completed
                      ? 'bg-[#14532d]/25 border-[#22c55e]/35'
                      : isNext
                        ? 'bg-[#1e3a8a]/25 border-[#3b82f6]/45'
                        : 'bg-[#1e1712] border-white/10'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-[#faf6ef] flex items-center gap-1.5">
                      {completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80]" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-[#94a3b8]" />
                      )}
                      <span>{lvl.label}</span>
                    </div>
                    <div className="text-[11px] text-[#cbd5e1] mt-0.5">{lvl.description}</div>
                  </div>
                  <span className="text-[11px] font-mono-nums font-bold text-[#fbbf24] whitespace-nowrap">
                    {completed
                      ? 'Concluído'
                      : lvl.tuitionKz === 0
                        ? 'Base'
                        : `${formatKz(lvl.tuitionKz)}/aula`}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenJobs();
            }}
            className="w-full py-2.5 rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] text-[#120e0b] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>Ver Vagas de Emprego (BandaJobs)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
