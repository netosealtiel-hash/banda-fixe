import React from 'react';
import {
  AlertCircle,
  Briefcase,
  Building2,
  CheckCircle2,
  Fuel,
  GraduationCap,
  ShoppingBag,
  Wallet,
  Wrench,
  X,
} from 'lucide-react';
import { ANGOLAN_COMPANIES } from '../game/angolaData';
import {
  formatKz,
  getEducationLabel,
  getEducationRank,
  getEffectiveJobChance,
} from '../game/simulation';
import { CompanyId, GameSnapshot, PhoneAppId } from '../game/types';

interface CompanyModalProps {
  companyId: CompanyId;
  state: GameSnapshot;
  onClose: () => void;
  onApplyJob: (companyId: CompanyId, jobId: string) => void;
  onWorkShift: () => void;
  onServiceVehicle?: (mode: 'refuel' | 'repair') => void;
  onOpenPhoneApp?: (app: PhoneAppId) => void;
  onOpenSchool?: () => void;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  companyId,
  state,
  onClose,
  onApplyJob,
  onWorkShift,
  onServiceVehicle,
  onOpenPhoneApp,
  onOpenSchool,
}) => {
  const company = ANGOLAN_COMPANIES.find((c) => c.id === companyId);
  if (!company) return null;

  const isEmployedHere = state.currentCompanyId === company.id;
  const currentEduLabel = getEducationLabel(state.educationLevel);
  const currentEduRank = getEducationRank(state.educationLevel);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-auto"
      style={{ backgroundColor: 'rgba(13, 10, 8, 0.78)' }}
    >
      <div
        role="dialog"
        aria-label={`Empresa ${company.name}`}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto banda-scroll rounded-2xl border border-white/15 overflow-hidden"
        style={{ backgroundColor: '#16110d' }}
      >
        {/* Top Brand Banner */}
        <div
          className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-3"
          style={{
            background: `linear-gradient(135deg, ${company.brandColor}33 0%, #1c1612 75%)`,
          }}
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#fbbf24]">
              <Building2 className="w-4 h-4" />
              <span>{company.sector} · {company.district}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#faf6ef] mt-1">{company.name}</h2>
            <p className="text-xs text-[#cbd5e1] mt-1">{company.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Fechar ${company.name}`}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#faf6ef] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Job Application Outcome Banner (Aceite / Recusado) */}
          {state.lastJobApplication && (
            <div
              data-testid="company-application-result"
              className={`p-3 rounded-xl border flex items-start justify-between gap-2 text-xs ${
                state.lastJobApplication.accepted
                  ? 'bg-[#14532d]/35 border-[#22c55e]/50 text-[#dcfce7]'
                  : 'bg-[#7f1d1d]/35 border-[#ef4444]/50 text-[#fee2e2]'
              }`}
            >
              <div className="flex items-start gap-2">
                {state.lastJobApplication.accepted ? (
                  <CheckCircle2 className="w-4 h-4 text-[#4ade80] shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#f87171] shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {state.lastJobApplication.accepted ? 'Candidatura Aceite' : 'Candidatura Recusada'}
                  </div>
                  <div className="mt-0.5">{state.lastJobApplication.message}</div>
                </div>
              </div>
              {!state.lastJobApplication.accepted && onOpenSchool && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSchool();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#2563eb] hover:bg-[#3b82f6] text-white text-[11px] font-bold whitespace-nowrap cursor-pointer shrink-0"
                >
                  Estudar
                </button>
              )}
            </div>
          )}

          {/* Active Employment Box */}
          {isEmployedHere && (
            <div className="p-3.5 rounded-xl bg-[#14532d]/30 border border-[#22c55e]/40 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[11px] text-[#bbf7d0] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Trabalhas nesta empresa</span>
                </div>
                <div className="text-sm font-bold text-white">{state.currentCompanyJobTitle}</div>
              </div>
              <button
                type="button"
                onClick={onWorkShift}
                className="px-4 py-2 rounded-lg bg-[#16a34a] hover:bg-[#22c55e] text-white text-xs font-bold cursor-pointer"
              >
                Fazer Turno Agora
              </button>
            </div>
          )}

          {/* Contextual Building Services (Pumangol / Banco BAI / Kero) */}
          {company.id === 'pumangol' && onServiceVehicle && state.ownedVehicles.length > 0 && (
            <div className="p-3 rounded-xl bg-[#1e1712] border border-white/10 space-y-2">
              <div className="text-xs font-bold text-[#fbbf24]">Serviços do Posto Pumangol</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onServiceVehicle('refuel')}
                  className="flex-1 py-2 rounded-lg bg-[#dc2626] hover:bg-[#ef4444] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Fuel className="w-3.5 h-3.5" />
                  <span>Abastecer (1.800 Kz)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onServiceVehicle('repair')}
                  className="flex-1 py-2 rounded-lg bg-[#2a211b] hover:bg-[#3a2d24] text-[#4ade80] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Reparar (3.500 Kz)</span>
                </button>
              </div>
            </div>
          )}

          {company.id === 'banco_bai' && onOpenPhoneApp && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPhoneApp('pay');
              }}
              className="w-full py-2.5 rounded-xl bg-[#0f766e] hover:bg-[#0d9488] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>Abrir Multicaixa & Gestão de Empresa (BandaPay)</span>
            </button>
          )}

          {company.id === 'kero' && onOpenPhoneApp && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPhoneApp('market');
              }}
              className="w-full py-2.5 rounded-xl bg-[#059669] hover:bg-[#10b981] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Fazer Compras no Hipermercado Kero</span>
            </button>
          )}

          {/* Vacancies List */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-[#faf6ef] flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-[#f59e0b]" />
                <span>Vagas na {company.name}</span>
              </span>
              <span className="text-[#60a5fa] font-semibold flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{currentEduLabel} · {state.reputation} rep</span>
              </span>
            </div>

            {company.jobs.map((job) => {
              const missingEdu = currentEduRank < getEducationRank(job.minEducation);
              const missingRep = state.reputation < job.minReputation;
              const locked = missingEdu || missingRep;
              const isCurrentJob =
                isEmployedHere && state.currentCompanyJobTitle === job.title;
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
                  className="p-3.5 rounded-xl bg-[#1e1712] border border-white/10 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#faf6ef]">{job.title}</div>
                    <div className="text-[11px] text-[#cbd5e1] mt-0.5">{job.description}</div>
                    <div className="text-[11px] font-mono-nums text-[#4ade80] mt-1 flex flex-wrap items-center gap-x-2">
                      <span>Salário: {formatKz(job.shiftPayKz)}/turno</span>
                      <span className="text-[#cbd5e1]">
                        · Desgaste {job.exertionLabel} (-{job.hungerCost}% Comida, -{job.energyCost}% Energia)
                      </span>
                      <span className={missingEdu ? 'text-[#f87171]' : 'text-[#60a5fa]'}>
                        · Formação: {getEducationLabel(job.minEducation)}
                      </span>
                      {job.minReputation > 0 && (
                        <span className={missingRep ? 'text-[#f87171]' : 'text-[#94a3b8]'}>
                          · Req. {job.minReputation} rep
                        </span>
                      )}
                      {!locked && (
                        <span className="text-[#fbbf24]">· Hipótese: {chancePct}%</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isCurrentJob}
                    onClick={() => onApplyJob(company.id, job.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                      isCurrentJob
                        ? 'bg-[#16a34a] text-white cursor-default'
                        : locked
                          ? 'bg-[#2a211b] hover:bg-[#3a2d24] text-[#f87171] border border-[#ef4444]/35'
                          : 'bg-[#f59e0b] hover:bg-[#fbbf24] text-[#120e0b]'
                    }`}
                  >
                    {isCurrentJob
                      ? 'Emprego Atual'
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
      </div>
    </div>
  );
};
