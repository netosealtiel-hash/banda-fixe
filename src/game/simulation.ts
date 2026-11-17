import {
  ANGOLAN_COMPANIES,
  BATHTUBS,
  BIRTH_CLASSES,
  CONDOMINIUMS,
  DEFAULT_APPEARANCE,
  EDUCATION_LEVELS,
  INITIAL_FURNITURE,
  INITIAL_NPCS,
  INITIAL_SOCIAL_POSTS,
  LANDMARKS,
  MARKET_ITEMS,
  MISSIONS,
  MUNICIPALITIES,
  MUSIC_TRACKS,
  PROFESSIONS,
  PROPERTIES,
  REAL_DAY_MS,
  STEAL_MIN_ACCOUNT_AGE_MS,
  VEHICLES,
} from './angolaData';
import {
  ActiveCondoRental,
  BathtubId,
  BirthClassDef,
  BirthClassId,
  BirthLotteryOutcome,
  BusinessState,
  CharacterAppearance,
  CompanyId,
  CondominiumId,
  EducationLevelId,
  GameSnapshot,
  LandmarkDef,
  MunicipalityId,
  OwnedVehicleState,
  ProfessionId,
  PropertyTierId,
  RelationshipStage,
  TravelPlan,
  VehicleId,
  WeatherType,
} from './types';

export function formatKz(amount: number): string {
  return `${Math.round(amount).toLocaleString('pt-PT')} Kz`;
}

export function formatTime(minutes: number): string {
  const m = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function formatRealRemaining(targetMs: number, nowMs: number = Date.now()): string {
  const diff = Math.max(0, targetMs - nowMs);
  if (diff <= 0) return 'Expirado';
  const days = Math.floor(diff / REAL_DAY_MS);
  const hours = Math.floor((diff % REAL_DAY_MS) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${Math.max(1, mins)}m`;
}

export function getDayPhaseLabel(minutes: number): string {
  const h = Math.floor((((minutes % 1440) + 1440) % 1440) / 60);
  if (h >= 5 && h < 12) return 'Manhã';
  if (h >= 12 && h < 18) return 'Tarde';
  if (h >= 18 && h < 21) return 'Entardecer';
  return 'Noite';
}

export function getWeatherLabel(weather: WeatherType): string {
  switch (weather) {
    case 'sol':
      return 'Sol Brilhante';
    case 'nuvens':
      return 'Nublado';
    case 'chuva':
      return 'Chuva Tropical';
    case 'trovoada':
      return 'Trovoada';
    case 'vento':
      return 'Brisa Forte';
  }
}

export function getMunicipalityDef(id: MunicipalityId) {
  return MUNICIPALITIES.find((m) => m.id === id) ?? MUNICIPALITIES[0];
}

export function getMunicipalityLandmarks(municipalityId: MunicipalityId): LandmarkDef[] {
  return LANDMARKS.filter((l) => l.municipalityId === municipalityId);
}

export function getDistrictAt(
  x: number,
  z: number,
  municipalityId: MunicipalityId = 'ingombota',
): string {
  const m = getMunicipalityDef(municipalityId);
  if (x < -8 && z < -8) return `${m.shortLabel} · Costa`;
  if (x > 8 && z < -8) return `${m.shortLabel} · Norte`;
  if (z > 8) return `${m.shortLabel} · Bairro & Cantinas`;
  return m.name;
}

export function createInitialSnapshot(
  appearance: CharacterAppearance = DEFAULT_APPEARANCE,
): GameSnapshot {
  return {
    mode: 'auth',
    sceneView: 'outdoor',
    activeCompanyRoomId: null,
    currentMunicipalityId: 'ingombota',
    homeMunicipalityId: 'ingombota',
    birthClass: 'normal',
    birthDistrict: 'Maianga',
    motherOccupation: 'Taxista',
    motherStory: 'Nasceste na Maianga. A tua mãe foi taxista durante anos pelas avenidas da capital.',
    appearance,
    moneyKz: 14000,
    bankKz: 6000,
    reputation: 6,
    day: 1,
    timeMinutes: 8 * 60 + 30,
    weather: 'sol',
    needs: {
      energy: 92,
      hunger: 85,
      hygiene: 90,
      mood: 84,
      health: 100,
    },
    educationLevel: 'basico',
    studyProgress: 0,
    studySessionsCompleted: 0,
    profession: null,
    currentCompanyId: null,
    currentCompanyJobTitle: null,
    lastJobApplication: null,
    shiftsCompleted: 0,
    propertyId: 'quarto_alugado',
    activeCondoRental: null,
    ownedBathtubs: [],
    placedBathtubId: null,
    furniture: INITIAL_FURNITURE.map((f) => ({ ...f })),
    inventory: {
      cafe_expresso: 1,
    },
    ownedVehicles: [
      {
        id: 'candongueiro_hiace',
        color: '#0284c7',
        fuel: 90,
        health: 100,
        x: 8.2,
        z: 4.5,
        rotationY: 0,
        lightsOn: false,
        doorsOpen: false,
      },
    ],
    activeVehicleIndex: 0,
    inVehicle: false,
    vehicleSpeedKmh: 0,
    business: {
      owned: false,
      name: 'Banda Empreendimentos',
      type: 'Loja de Bairro',
      employees: 0,
      level: 1,
      dailyRevenueKz: 0,
      pendingCashKz: 0,
    },
    npcs: INITIAL_NPCS.map((n) => ({ ...n })),
    childrenCount: 0,
    partiesHosted: 0,
    racesWon: 0,
    stealSuccessCount: 0,
    lastStealAtMs: 0,
    completedMissionIds: [],
    activeMissionId: MISSIONS[0].id,
    chatThreads: {
      tia_maria: [
        {
          id: 'c1',
          sender: 'Tia Maria',
          text: 'Mekie sobrinho! Bem-vindo a Ingombota. Passa no Cantinho da Bita para comer ou comprar café, e entra numa empresa para trabalhar!',
          timeLabel: '08:15',
          fromPlayer: false,
        },
      ],
      kizua_candongueiro: [
        {
          id: 'c2',
          sender: 'Kizua',
          text: 'Tropa, toca no chão para caminhar ou clica numa empresa para entrar na sala 3D!',
          timeLabel: '08:20',
          fromPlayer: false,
        },
      ],
    },
    socialPosts: INITIAL_SOCIAL_POSTS.map((p) => ({ ...p })),
    radioPlaying: false,
    currentTrackId: MUSIC_TRACKS[0].id,
    playerAction: 'idle',
    playerDistrict: 'Ingombota & Baixa',
    playerX: -4.2,
    playerZ: 7.8,
    nearbyLandmarkId: null,
    nearbyNpcId: null,
    nearbyVehiclePrompt: false,
    lastEventMessage: 'Bem-vindo à Banda 3D! Toca no terreno para andar ou entra num edifício.',
  };
}

export function rollBirthClass(rng: () => number = Math.random): BirthClassDef {
  const roll = Math.max(0, Math.min(0.999999999, rng()));
  let cumulative = 0;
  for (const tier of BIRTH_CLASSES) {
    cumulative += tier.probability;
    if (roll < cumulative) {
      return tier;
    }
  }
  return BIRTH_CLASSES[BIRTH_CLASSES.length - 1];
}

function rollRangeRounded(min: number, max: number, step: number, r: number): number {
  if (max <= min) return min;
  const raw = min + r * (max - min);
  const snapped = Math.round(raw / step) * step;
  return Math.max(min, Math.min(max, snapped));
}

export function rollBirthLotteryOutcome(
  rng: () => number = Math.random,
  forcedClassId?: BirthClassId,
): BirthLotteryOutcome {
  const tier = forcedClassId
    ? BIRTH_CLASSES.find((c) => c.id === forcedClassId) ?? BIRTH_CLASSES[1]
    : rollBirthClass(rng);

  const step = tier.id === 'rico' ? 50000 : tier.id === 'acima_media' ? 5000 : 500;
  let moneyKz = rollRangeRounded(tier.minMoneyKz, tier.maxMoneyKz, step, rng());
  let bankKz = rollRangeRounded(tier.minBankKz, tier.maxBankKz, step, rng());

  if (tier.id === 'acima_media' && moneyKz + bankKz > 500000) {
    bankKz = Math.max(tier.minBankKz, 500000 - moneyKz);
  }
  if (tier.id === 'rico') {
    const total = moneyKz + bankKz;
    if (total < 4000000) {
      bankKz += 4000000 - total;
    } else if (total > 10000000) {
      bankKz = Math.max(tier.minBankKz, 10000000 - moneyKz);
    }
  }

  const histories = tier.motherHistories;
  const histIdx = Math.min(
    histories.length - 1,
    Math.max(0, Math.floor(rng() * histories.length)),
  );
  const motherHistory = histories[histIdx];

  return {
    birthClassId: tier.id,
    moneyKz,
    bankKz,
    motherHistory,
  };
}

export function applyBirthLottery(
  state: GameSnapshot,
  input: BirthLotteryOutcome | BirthClassId,
): GameSnapshot {
  const outcome = typeof input === 'string' ? rollBirthLotteryOutcome(() => 0.5, input) : input;
  const tier = BIRTH_CLASSES.find((c) => c.id === outcome.birthClassId) ?? BIRTH_CLASSES[1];
  const vehicleSpec = tier.startingVehicleId
    ? VEHICLES.find((v) => v.id === tier.startingVehicleId) ?? null
    : null;
  const propertySpec = PROPERTIES.find((p) => p.id === tier.startingPropertyId) ?? PROPERTIES[0];

  const ownedVehicles: OwnedVehicleState[] = vehicleSpec
    ? [
        {
          id: vehicleSpec.id,
          color: vehicleSpec.defaultColor,
          fuel: 90,
          health: 100,
          x: 8.2,
          z: 4.5,
          rotationY: 0,
          lightsOn: false,
          doorsOpen: false,
        },
      ]
    : [];

  const startingEducation: EducationLevelId =
    tier.id === 'rico' ? 'tecnico' : tier.id === 'normal' || tier.id === 'acima_media' ? 'medio' : 'basico';
  const startingProgress = tier.id === 'acima_media' ? 50 : 0;

  return {
    ...state,
    birthClass: tier.id,
    birthDistrict: outcome.motherHistory.birthDistrict,
    motherOccupation: outcome.motherHistory.motherOccupation,
    motherStory: outcome.motherHistory.story,
    moneyKz: outcome.moneyKz,
    bankKz: outcome.bankKz,
    reputation: tier.startingReputation,
    educationLevel: startingEducation,
    studyProgress: startingProgress,
    propertyId: tier.startingPropertyId,
    ownedVehicles,
    activeVehicleIndex: 0,
    inVehicle: false,
    vehicleSpeedKmh: 0,
    nearbyVehiclePrompt: false,
    lastEventMessage: `${tier.label} (${outcome.motherHistory.birthDistrict}) · Mãe: ${outcome.motherHistory.motherOccupation} · ${propertySpec.name}.`,
  };
}

export function getEducationRank(id: EducationLevelId): number {
  return EDUCATION_LEVELS.find((e) => e.id === id)?.rank ?? 0;
}

export function getEducationLabel(id: EducationLevelId): string {
  return EDUCATION_LEVELS.find((e) => e.id === id)?.label ?? 'Ensino Básico';
}

export function getEffectiveJobChance(
  state: GameSnapshot,
  baseChance: number,
  minEducation: EducationLevelId,
  minReputation: number,
): number {
  const eduDiff = Math.max(0, getEducationRank(state.educationLevel) - getEducationRank(minEducation));
  const repDiff = Math.max(0, state.reputation - minReputation);
  return Math.min(0.95, Math.max(0.28, baseChance + eduDiff * 0.08 + Math.floor(repDiff / 5) * 0.02));
}

export function clampNeed(val: number): number {
  return Math.max(0, Math.min(100, Math.round(val)));
}

export function performStudySession(
  state: GameSnapshot,
  studyMode: 'free_library' | 'paid_course' = 'paid_course',
): GameSnapshot {
  const currentRank = getEducationRank(state.educationLevel);
  const nextTier = EDUCATION_LEVELS.find((e) => e.rank === currentRank + 1) ?? null;

  const energyCost = studyMode === 'free_library' ? 12 : nextTier?.energyCost ?? 16;
  const costKz = studyMode === 'free_library' ? 0 : nextTier?.tuitionKz ?? 5000;

  if (state.needs.energy < energyCost) {
    return {
      ...state,
      lastEventMessage: 'Estás cansado demais para estudar! Toma um café na cantina ou usa a tua banheira.',
    };
  }
  if (state.moneyKz < costKz) {
    return {
      ...state,
      lastEventMessage: `Precisas de ${formatKz(costKz)} para este curso. Podes usar a Biblioteca Gratuita!`,
    };
  }

  if (!nextTier) {
    return {
      ...state,
      moneyKz: state.moneyKz - costKz,
      reputation: state.reputation + 5,
      studySessionsCompleted: state.studySessionsCompleted + 1,
      timeMinutes: (state.timeMinutes + 90) % 1440,
      needs: {
        ...state.needs,
        energy: clampNeed(state.needs.energy - energyCost),
        hunger: clampNeed(state.needs.hunger - 8),
      },
      lastEventMessage: 'Investigação avançada concluída na Universidade (+5 Reputação)!',
    };
  }

  const progressGain = studyMode === 'free_library' ? 25 : 50;
  const newProgress = state.studyProgress + progressGain;
  const graduated = newProgress >= 100;

  return {
    ...state,
    moneyKz: state.moneyKz - costKz,
    educationLevel: graduated ? nextTier.id : state.educationLevel,
    studyProgress: graduated ? 0 : newProgress,
    studySessionsCompleted: state.studySessionsCompleted + 1,
    reputation: state.reputation + (graduated ? 12 : 4),
    timeMinutes: (state.timeMinutes + 90) % 1440,
    needs: {
      ...state.needs,
      energy: clampNeed(state.needs.energy - energyCost),
      hunger: clampNeed(state.needs.hunger - 10),
      mood: clampNeed(state.needs.mood + (graduated ? 12 : 2)),
    },
    lastEventMessage: graduated
      ? `Diploma conquistado: ${nextTier.label}! (+12 Reputação e mais vagas desbloqueadas)`
      : `Estudaste para ${nextTier.label} (${newProgress}% concluído).`,
  };
}

export function getRelationshipStage(affinity: number, current: RelationshipStage): RelationshipStage {
  if (current === 'Casado(a)') return 'Casado(a)';
  if (affinity >= 85 && current === 'Namorado(a)') return 'Namorado(a)';
  if (affinity >= 70) return 'Melhor Amigo';
  if (affinity >= 40) return 'Amigo';
  if (affinity >= 15) return 'Conhecido';
  return 'Desconhecido';
}

export function selectProfession(
  state: GameSnapshot,
  professionId: ProfessionId,
  rng: () => number = Math.random,
): GameSnapshot {
  const prof = PROFESSIONS.find((p) => p.id === professionId);
  if (!prof) return state;

  if (getEducationRank(state.educationLevel) < getEducationRank(prof.minEducation)) {
    const reqLabel = getEducationLabel(prof.minEducation);
    const message = `Candidatura recusada para ${prof.title}: exige ${reqLabel}. Vai estudar primeiro!`;
    return {
      ...state,
      lastJobApplication: {
        accepted: false,
        title: prof.title,
        companyName: 'Mercado da Banda',
        message,
      },
      lastEventMessage: message,
    };
  }

  if (state.reputation < prof.minReputation) {
    const message = `Precisas de ${prof.minReputation} de reputação para ${prof.title}.`;
    return {
      ...state,
      lastJobApplication: {
        accepted: false,
        title: prof.title,
        companyName: 'Mercado da Banda',
        message,
      },
      lastEventMessage: message,
    };
  }

  const chance = getEffectiveJobChance(
    state,
    prof.acceptanceChance,
    prof.minEducation,
    prof.minReputation,
  );
  if (rng() > chance) {
    const message = `Vaga para ${prof.title} não foi aceite desta vez (${Math.round(chance * 100)}% hipótese). Estuda mais ou tenta novamente!`;
    return {
      ...state,
      timeMinutes: (state.timeMinutes + 30) % 1440,
      needs: {
        ...state.needs,
        energy: clampNeed(state.needs.energy - 4),
      },
      lastJobApplication: {
        accepted: false,
        title: prof.title,
        companyName: 'Mercado da Banda',
        message,
      },
      lastEventMessage: message,
    };
  }

  const message = `Emprego aceite: ${prof.title} (${formatKz(prof.shiftPayKz)}/turno · Desgaste ${prof.exertionLabel}).`;
  return {
    ...state,
    profession: professionId,
    currentCompanyId: null,
    currentCompanyJobTitle: null,
    timeMinutes: (state.timeMinutes + 30) % 1440,
    lastJobApplication: {
      accepted: true,
      title: prof.title,
      companyName: 'Autónomo / Banda',
      message,
    },
    lastEventMessage: message,
  };
}

export function applyForCompanyJob(
  state: GameSnapshot,
  companyId: CompanyId,
  jobId: string,
  rng: () => number = Math.random,
): GameSnapshot {
  const company = ANGOLAN_COMPANIES.find((c) => c.id === companyId);
  const job = company?.jobs.find((j) => j.id === jobId);
  if (!company || !job) return state;

  if (getEducationRank(state.educationLevel) < getEducationRank(job.minEducation)) {
    const reqLabel = getEducationLabel(job.minEducation);
    const message = `Recusado na ${company.name}: ${job.title} exige ${reqLabel}. Vai estudar na Escola!`;
    return {
      ...state,
      lastJobApplication: {
        accepted: false,
        title: job.title,
        companyName: company.name,
        message,
      },
      lastEventMessage: message,
    };
  }

  if (state.reputation < job.minReputation) {
    const message = `Recusado na ${company.name}: precisas de ${job.minReputation} de reputação para ${job.title}.`;
    return {
      ...state,
      lastJobApplication: {
        accepted: false,
        title: job.title,
        companyName: company.name,
        message,
      },
      lastEventMessage: message,
    };
  }

  const chance = getEffectiveJobChance(
    state,
    job.acceptanceChance,
    job.minEducation,
    job.minReputation,
  );

  if (rng() > chance) {
    const message = `Entrevista na ${company.name} para ${job.title} foi recusada (${Math.round(chance * 100)}% hipótese). Estuda mais ou tenta novamente!`;
    return {
      ...state,
      timeMinutes: (state.timeMinutes + 30) % 1440,
      needs: {
        ...state.needs,
        energy: clampNeed(state.needs.energy - 4),
      },
      lastJobApplication: {
        accepted: false,
        title: job.title,
        companyName: company.name,
        message,
      },
      lastEventMessage: message,
    };
  }

  const message = `Contratado na ${company.name}: ${job.title} (${formatKz(job.shiftPayKz)}/turno · Desgaste ${job.exertionLabel})!`;
  return {
    ...state,
    profession: job.professionId,
    currentCompanyId: company.id,
    currentCompanyJobTitle: job.title,
    timeMinutes: (state.timeMinutes + 30) % 1440,
    lastJobApplication: {
      accepted: true,
      title: job.title,
      companyName: company.name,
      message,
    },
    lastEventMessage: message,
  };
}

export function getActiveJobCosts(state: GameSnapshot): {
  title: string;
  companyName: string | null;
  shiftPayKz: number;
  energyCost: number;
  hungerCost: number;
  exertionLabel: string;
} {
  const company = state.currentCompanyId
    ? ANGOLAN_COMPANIES.find((c) => c.id === state.currentCompanyId)
    : null;
  const companyJob =
    company && state.currentCompanyJobTitle
      ? company.jobs.find((j) => j.title === state.currentCompanyJobTitle)
      : null;

  if (company && companyJob) {
    return {
      title: companyJob.title,
      companyName: company.name,
      shiftPayKz: companyJob.shiftPayKz,
      energyCost: companyJob.energyCost,
      hungerCost: companyJob.hungerCost,
      exertionLabel: companyJob.exertionLabel,
    };
  }

  const prof = PROFESSIONS.find((p) => p.id === (state.profession ?? 'vendedor')) ?? PROFESSIONS[0];
  return {
    title: prof.title,
    companyName: null,
    shiftPayKz: prof.shiftPayKz,
    energyCost: prof.energyCost,
    hungerCost: prof.hungerCost,
    exertionLabel: prof.exertionLabel,
  };
}

export function performWorkShift(state: GameSnapshot, overrideCompanyId?: CompanyId): GameSnapshot {
  let targetCompany = overrideCompanyId
    ? ANGOLAN_COMPANIES.find((c) => c.id === overrideCompanyId) ?? null
    : null;
  if (!targetCompany && state.currentCompanyId) {
    targetCompany = ANGOLAN_COMPANIES.find((c) => c.id === state.currentCompanyId) ?? null;
  }

  const active = getActiveJobCosts(state);
  const workLabel = active.companyName ? `${active.title} (${active.companyName})` : active.title;

  if (state.needs.hunger < active.hungerCost) {
    return {
      ...state,
      lastEventMessage: `Comida insuficiente (${state.needs.hunger}% < ${active.hungerCost}% necessários para ${active.title})! Passa numa Cantina ou Restaurante antes de trabalhar.`,
    };
  }

  if (state.needs.energy < active.energyCost) {
    return {
      ...state,
      lastEventMessage: `Energia insuficiente (${state.needs.energy}% < ${active.energyCost}% necessários para ${active.title})! Toma um Café na Cantina ou usa a tua Banheira em casa.`,
    };
  }

  const repBonus = Math.round(state.reputation * 25);
  const earned = active.shiftPayKz + repBonus;
  const next: GameSnapshot = {
    ...state,
    profession: state.profession ?? 'vendedor',
    moneyKz: state.moneyKz + earned,
    reputation: state.reputation + 4,
    shiftsCompleted: state.shiftsCompleted + 1,
    playerAction: 'work',
    timeMinutes: (state.timeMinutes + 120) % 1440,
    needs: {
      ...state.needs,
      energy: clampNeed(state.needs.energy - active.energyCost),
      hunger: clampNeed(state.needs.hunger - active.hungerCost),
      hygiene: clampNeed(state.needs.hygiene - 8),
      mood: clampNeed(state.needs.mood + 3),
    },
    lastEventMessage: `Turno concluído em ${workLabel}: +${formatKz(earned)} (-${active.energyCost} Energia, -${active.hungerCost} Comida).`,
  };

  return evaluateMissions(next);
}

export function buyMarketItem(state: GameSnapshot, itemId: string, consumeNow = true): GameSnapshot {
  const item = MARKET_ITEMS.find((i) => i.id === itemId);
  if (!item) return state;

  if (state.moneyKz < item.priceKz) {
    return {
      ...state,
      lastEventMessage: `Saldo insuficiente! Faltam ${formatKz(item.priceKz - state.moneyKz)}.`,
    };
  }

  const nextInventory = { ...state.inventory };
  let nextNeeds = { ...state.needs };

  if (consumeNow && (item.hungerRestore || item.energyRestore || item.moodRestore)) {
    nextNeeds = {
      ...nextNeeds,
      hunger: clampNeed(nextNeeds.hunger + (item.hungerRestore ?? 0)),
      energy: clampNeed(nextNeeds.energy + (item.energyRestore ?? 0)),
      mood: clampNeed(nextNeeds.mood + (item.moodRestore ?? 0)),
    };
  } else {
    nextInventory[item.id] = (nextInventory[item.id] ?? 0) + 1;
  }

  const next: GameSnapshot = {
    ...state,
    moneyKz: state.moneyKz - item.priceKz,
    inventory: nextInventory,
    needs: nextNeeds,
    playerAction: item.hungerRestore ? 'eat' : item.energyRestore ? 'drink' : state.playerAction,
    lastEventMessage: consumeNow
      ? `Compraste ${item.name} (-${formatKz(item.priceKz)})${item.energyRestore ? ` · +${item.energyRestore} Energia` : ''}${item.hungerRestore ? ` · +${item.hungerRestore} Comida` : ''}.`
      : `${item.name} guardado na mochila (-${formatKz(item.priceKz)}).`,
  };

  return evaluateMissions(next);
}

export function consumeInventoryItem(state: GameSnapshot, itemId: string): GameSnapshot {
  const count = state.inventory[itemId] ?? 0;
  const item = MARKET_ITEMS.find((i) => i.id === itemId);
  if (count <= 0 || !item) return state;

  const nextInventory = { ...state.inventory, [itemId]: count - 1 };
  if (nextInventory[itemId] <= 0) delete nextInventory[itemId];

  return {
    ...state,
    inventory: nextInventory,
    playerAction: item.hungerRestore ? 'eat' : 'drink',
    needs: {
      ...state.needs,
      hunger: clampNeed(state.needs.hunger + (item.hungerRestore ?? 0)),
      energy: clampNeed(state.needs.energy + (item.energyRestore ?? 0)),
      mood: clampNeed(state.needs.mood + (item.moodRestore ?? 0)),
    },
    lastEventMessage: `Consumiste ${item.name}! Comida e Energia reforçadas.`,
  };
}

export function buyBathtub(state: GameSnapshot, bathtubId: BathtubId): GameSnapshot {
  const tub = BATHTUBS.find((b) => b.id === bathtubId);
  if (!tub) return state;

  if (state.ownedBathtubs.includes(bathtubId)) {
    return {
      ...state,
      placedBathtubId: bathtubId,
      lastEventMessage: `${tub.name} colocada na tua casa/condomínio! Clica nela na sala 3D para ganhar +${tub.energyRestore} Energia.`,
    };
  }

  if (state.moneyKz < tub.priceKz) {
    return {
      ...state,
      lastEventMessage: `Precisas de ${formatKz(tub.priceKz)} para comprar ${tub.name}.`,
    };
  }

  const next: GameSnapshot = {
    ...state,
    moneyKz: state.moneyKz - tub.priceKz,
    ownedBathtubs: [...state.ownedBathtubs, bathtubId],
    placedBathtubId: bathtubId,
    reputation: state.reputation + 10,
    needs: {
      ...state.needs,
      mood: clampNeed(state.needs.mood + 12),
    },
    lastEventMessage: `Compraste e instalaste ${tub.name} (-${formatKz(tub.priceKz)})! Entra em Casa 3D e clica na banheira para recuperar Energia.`,
  };

  return evaluateMissions(next);
}

export function useBathtub(state: GameSnapshot): GameSnapshot {
  if (!state.placedBathtubId) {
    return {
      ...state,
      lastEventMessage: 'Ainda não compraste nenhuma Banheira! A Banheira Normal custa 65.000 Kz na loja.',
    };
  }

  const tub = BATHTUBS.find((b) => b.id === state.placedBathtubId);
  if (!tub) return state;

  return {
    ...state,
    timeMinutes: (state.timeMinutes + 20) % 1440,
    playerAction: 'bathe',
    needs: {
      ...state.needs,
      energy: clampNeed(state.needs.energy + tub.energyRestore),
      hygiene: clampNeed(state.needs.hygiene + tub.hygieneRestore),
      mood: clampNeed(state.needs.mood + tub.moodRestore),
    },
    lastEventMessage: `Banho relaxante na ${tub.name}! +${tub.energyRestore} Energia, +${tub.moodRestore} Humor.`,
  };
}

export function isCondoRentalActive(
  rental: ActiveCondoRental | null,
  nowMs: number = Date.now(),
): boolean {
  return Boolean(rental && rental.expiresAtRealMs > nowMs);
}

export function rentCondominium(
  state: GameSnapshot,
  condoId: CondominiumId,
  realDays: number,
  nowMs: number = Date.now(),
): GameSnapshot {
  const condo = CONDOMINIUMS.find((c) => c.id === condoId);
  const days = Math.max(1, Math.min(30, Math.floor(realDays)));
  if (!condo) return state;

  const totalCost = condo.dailyRealPriceKz * days;
  if (state.moneyKz < totalCost) {
    return {
      ...state,
      lastEventMessage: `Precisas de ${formatKz(totalCost)} para alugar ${condo.name} por ${days} dia(s) real(is).`,
    };
  }

  const existingSame =
    state.activeCondoRental &&
    state.activeCondoRental.condoId === condoId &&
    state.activeCondoRental.expiresAtRealMs > nowMs
      ? state.activeCondoRental.expiresAtRealMs
      : nowMs;

  const nextRental: ActiveCondoRental = {
    condoId,
    rentedAtRealMs: nowMs,
    expiresAtRealMs: existingSame + days * REAL_DAY_MS,
    daysPaid: (state.activeCondoRental?.condoId === condoId ? state.activeCondoRental.daysPaid : 0) + days,
  };

  const next: GameSnapshot = {
    ...state,
    moneyKz: state.moneyKz - totalCost,
    activeCondoRental: nextRental,
    reputation: state.reputation + 12,
    needs: {
      ...state.needs,
      mood: clampNeed(state.needs.mood + condo.comfortBonus),
    },
    lastEventMessage: `Condomínio ${condo.name} alugado por ${days} dia(s) REAL(is) (-${formatKz(totalCost)})!`,
  };

  return evaluateMissions(next);
}

export function canPlayerSteal(
  accountCreatedAtMs: number,
  nowMs: number = Date.now(),
): { allowed: boolean; remainingMs: number; remainingLabel: string } {
  const ageMs = Math.max(0, nowMs - accountCreatedAtMs);
  const remainingMs = Math.max(0, STEAL_MIN_ACCOUNT_AGE_MS - ageMs);
  return {
    allowed: remainingMs === 0,
    remainingMs,
    remainingLabel: formatRealRemaining(accountCreatedAtMs + STEAL_MIN_ACCOUNT_AGE_MS, nowMs),
  };
}

export function stealFromTarget(
  state: GameSnapshot,
  accountCreatedAtMs: number,
  nowMs: number = Date.now(),
  targetLabel: string = 'Cidadão distraído',
  rng: () => number = Math.random,
): GameSnapshot {
  const gate = canPlayerSteal(accountCreatedAtMs, nowMs);
  if (!gate.allowed) {
    return {
      ...state,
      lastEventMessage: `Roubo bloqueado! A tua conta precisa de no mínimo 3 dias reais (faltam ${gate.remainingLabel}).`,
    };
  }

  if (nowMs - state.lastStealAtMs < 60_000) {
    return {
      ...state,
      lastEventMessage: 'Acabaste de agir! Espera 1 minuto antes de tentar outro golpe.',
    };
  }

  if (state.needs.energy < 15) {
    return {
      ...state,
      lastEventMessage: 'Sem energia suficiente para correr depois do golpe!',
    };
  }

  const success = rng() < 0.62;
  if (!success) {
    const fine = Math.min(state.moneyKz, 4000);
    return {
      ...state,
      moneyKz: state.moneyKz - fine,
      reputation: Math.max(0, state.reputation - 6),
      lastStealAtMs: nowMs,
      playerAction: 'steal',
      needs: {
        ...state.needs,
        energy: clampNeed(state.needs.energy - 15),
        mood: clampNeed(state.needs.mood - 12),
      },
      lastEventMessage: `Foste apanhado ao tentar roubar ${targetLabel}! Multa da polícia: -${formatKz(fine)}.`,
    };
  }

  const loot = Math.round((3500 + rng() * 9500) / 500) * 500;
  return {
    ...state,
    moneyKz: state.moneyKz + loot,
    reputation: Math.max(0, state.reputation - 4),
    stealSuccessCount: state.stealSuccessCount + 1,
    lastStealAtMs: nowMs,
    playerAction: 'steal',
    needs: {
      ...state.needs,
      energy: clampNeed(state.needs.energy - 15),
    },
    lastEventMessage: `Golpe bem-sucedido em ${targetLabel}: +${formatKz(loot)} no bolso!`,
  };
}

export function handleGatunoEncounter(
  state: GameSnapshot,
  gatunoName: string,
  nowMs: number = Date.now(),
): GameSnapshot {
  const hasProtection =
    state.profession === 'policia' ||
    state.profession === 'seguranca' ||
    isCondoRentalActive(state.activeCondoRental, nowMs);

  if (hasProtection) {
    return {
      ...state,
      lastEventMessage: `${gatunoName} tentou aproximar-se, mas intimidaste-o e protegiste os teus Kwanzas!`,
    };
  }

  const stolen = Math.min(state.moneyKz, Math.max(500, Math.round(state.moneyKz * 0.08)));
  if (stolen <= 0) {
    return {
      ...state,
      lastEventMessage: `${gatunoName} revistou-te mas não tinhas dinheiro no bolso! Guarda sempre no Banco BAI.`,
    };
  }

  return {
    ...state,
    moneyKz: state.moneyKz - stolen,
    needs: {
      ...state.needs,
      mood: clampNeed(state.needs.mood - 8),
    },
    lastEventMessage: `Alerta Gatuno! ${gatunoName} roubou-te ${formatKz(stolen)} na rua! Afasta-te dos gatunos de capuz preto.`,
  };
}

export function planMunicipalityTravel(
  state: GameSnapshot,
  targetMunicipalityId: MunicipalityId,
): TravelPlan | null {
  if (state.currentMunicipalityId === targetMunicipalityId) return null;
  const fromDef = getMunicipalityDef(state.currentMunicipalityId);
  const toDef = getMunicipalityDef(targetMunicipalityId);

  const isProvinceFlight = fromDef.province !== toDef.province;
  return {
    fromMunicipalityId: fromDef.id,
    toMunicipalityId: toDef.id,
    mode: isProvinceFlight ? 'aviao' : 'taxi',
    costKz: isProvinceFlight ? toDef.flightCostKz : toDef.taxiCostKz,
    durationSec: isProvinceFlight ? 6 : 4,
  };
}

export function completeMunicipalityTravel(
  state: GameSnapshot,
  plan: TravelPlan,
): GameSnapshot {
  const toDef = getMunicipalityDef(plan.toMunicipalityId);
  if (state.moneyKz < plan.costKz) {
    return {
      ...state,
      lastEventMessage: `Precisas de ${formatKz(plan.costKz)} para viajar até ${toDef.name}.`,
    };
  }

  const next: GameSnapshot = {
    ...state,
    moneyKz: state.moneyKz - plan.costKz,
    currentMunicipalityId: toDef.id,
    sceneView: 'outdoor',
    activeCompanyRoomId: null,
    playerX: -2,
    playerZ: 4,
    inVehicle: false,
    playerDistrict: toDef.name,
    timeMinutes: (state.timeMinutes + (plan.mode === 'aviao' ? 95 : 35)) % 1440,
    lastEventMessage:
      plan.mode === 'aviao'
        ? `Aterraste de Avião TAAG em ${toDef.name} (${toDef.province})! (-${formatKz(plan.costKz)})`
        : `Chegaste de Táxi a ${toDef.name}! (-${formatKz(plan.costKz)})`,
  };

  return evaluateMissions(next);
}

export function enterCompanyRoom(state: GameSnapshot, companyId: CompanyId): GameSnapshot {
  const comp = ANGOLAN_COMPANIES.find((c) => c.id === companyId);
  if (!comp) return state;
  return {
    ...state,
    sceneView: 'company_room',
    activeCompanyRoomId: companyId,
    inVehicle: false,
    playerX: 0,
    playerZ: 5.5,
    lastEventMessage: `Entraste na sala 3D da ${comp.name}. Clica na Secretária / Posto de Trabalho para trabalhar ou pedir vaga!`,
  };
}

export function enterHomeRoom(state: GameSnapshot): GameSnapshot {
  return {
    ...state,
    sceneView: 'home_room',
    activeCompanyRoomId: null,
    inVehicle: false,
    playerX: 0,
    playerZ: 4.5,
    lastEventMessage: state.placedBathtubId
      ? 'Entraste na tua Casa 3D! Clica na Banheira para ganhar Energia ou na Cama para dormir.'
      : 'Entraste na tua Casa 3D! Compra uma Banheira (>60.000 Kz) na Cantina/Loja para recuperar energia ao clicar.',
  };
}

export function exitRoomToStreet(state: GameSnapshot): GameSnapshot {
  const lm = state.activeCompanyRoomId
    ? LANDMARKS.find(
        (l) =>
          l.municipalityId === state.currentMunicipalityId &&
          l.companyId === state.activeCompanyRoomId,
      )
    : LANDMARKS.find(
        (l) => l.municipalityId === state.currentMunicipalityId && l.category === 'Casa',
      );
  return {
    ...state,
    sceneView: 'outdoor',
    activeCompanyRoomId: null,
    playerX: lm ? lm.x : -2,
    playerZ: lm ? Math.min(20, lm.z + 4.5) : 7.5,
    lastEventMessage: 'Saíste para a rua!',
  };
}

export function buyVehicle(state: GameSnapshot, vehicleId: VehicleId, color?: string): GameSnapshot {
  const spec = VEHICLES.find((v) => v.id === vehicleId);
  if (!spec) return state;
  if (state.moneyKz < spec.priceKz) {
    return {
      ...state,
      lastEventMessage: `Precisas de ${formatKz(spec.priceKz)} para comprar ${spec.name}.`,
    };
  }

  const newVehicle: OwnedVehicleState = {
    id: spec.id,
    color: color ?? spec.defaultColor,
    fuel: 100,
    health: 100,
    x: state.playerX + 3,
    z: state.playerZ + 3,
    rotationY: 0,
    lightsOn: false,
    doorsOpen: false,
  };

  const ownedVehicles = [...state.ownedVehicles, newVehicle];
  const next: GameSnapshot = {
    ...state,
    moneyKz: state.moneyKz - spec.priceKz,
    ownedVehicles,
    activeVehicleIndex: ownedVehicles.length - 1,
    reputation: state.reputation + 8,
    lastEventMessage: `Parabéns! Compraste ${spec.name} por ${formatKz(spec.priceKz)}.`,
  };

  return evaluateMissions(next);
}

export function serviceActiveVehicle(
  state: GameSnapshot,
  mode: 'refuel' | 'repair' | 'paint',
  color?: string,
): GameSnapshot {
  const vehicle = state.ownedVehicles[state.activeVehicleIndex];
  if (!vehicle) return state;

  const cost = mode === 'refuel' ? 1800 : mode === 'repair' ? 3500 : 2500;
  if (state.moneyKz < cost) {
    return {
      ...state,
      lastEventMessage: `Precisas de ${formatKz(cost)} na oficina.`,
    };
  }

  const updated = state.ownedVehicles.map((v, idx) => {
    if (idx !== state.activeVehicleIndex) return v;
    if (mode === 'refuel') return { ...v, fuel: 100 };
    if (mode === 'repair') return { ...v, health: 100 };
    return { ...v, color: color ?? v.color };
  });

  const label =
    mode === 'refuel'
      ? 'Depósito atestado a 100%'
      : mode === 'repair'
        ? 'Veículo reparado na oficina'
        : 'Pintura personalizada aplicada';

  return {
    ...state,
    moneyKz: state.moneyKz - cost,
    ownedVehicles: updated,
    lastEventMessage: `${label} (-${formatKz(cost)}).`,
  };
}

export function upgradeProperty(state: GameSnapshot, propertyId: PropertyTierId): GameSnapshot {
  const prop = PROPERTIES.find((p) => p.id === propertyId);
  if (!prop) return state;
  if (state.propertyId === propertyId) return state;

  if (state.moneyKz < prop.priceKz) {
    return {
      ...state,
      lastEventMessage: `Faltam ${formatKz(prop.priceKz - state.moneyKz)} para ${prop.name}.`,
    };
  }

  const next: GameSnapshot = {
    ...state,
    moneyKz: state.moneyKz - prop.priceKz,
    propertyId,
    reputation: state.reputation + 15,
    needs: {
      ...state.needs,
      mood: clampNeed(state.needs.mood + prop.comfortBonus),
    },
    lastEventMessage: `Nova casa adquirida: ${prop.name} em ${prop.district}!`,
  };

  return evaluateMissions(next);
}

export function performHouseAction(
  state: GameSnapshot,
  action: 'sleep' | 'tv' | 'cook_funge' | 'shower' | 'party' | 'decorate',
  furnitureId?: string,
): GameSnapshot {
  const prop = PROPERTIES.find((p) => p.id === state.propertyId) ?? PROPERTIES[0];
  if (action === 'sleep') {
    const nextDay = state.day + 1;
    const rentDue = prop.dailyRentKz;
    const bizIncome = state.business.owned
      ? 6500 + state.business.employees * 4200 + state.business.level * 3000
      : 0;
    const netCash = state.moneyKz - rentDue + bizIncome;
    return evaluateMissions({
      ...state,
      day: nextDay,
      timeMinutes: 7 * 60 + 30,
      moneyKz: Math.max(0, netCash),
      playerAction: 'sleep',
      needs: {
        ...state.needs,
        energy: 100,
        health: clampNeed(state.needs.health + 15),
        mood: clampNeed(state.needs.mood + 10),
      },
      lastEventMessage:
        bizIncome > 0
          ? `Bom dia (Dia ${nextDay})! Receita do negócio: +${formatKz(bizIncome)}.`
          : rentDue > 0
            ? `Bom dia (Dia ${nextDay})! Aluguer pago: -${formatKz(rentDue)}.`
            : `Bom dia (Dia ${nextDay})! Energia restaurada a 100%.`,
    });
  }

  if (action === 'tv') {
    return {
      ...state,
      timeMinutes: (state.timeMinutes + 45) % 1440,
      playerAction: 'sit',
      needs: {
        ...state.needs,
        mood: clampNeed(state.needs.mood + 16),
        energy: clampNeed(state.needs.energy + 6),
      },
      lastEventMessage: 'Viste os sucessos musicais e notícias de Angola na TV.',
    };
  }

  if (action === 'cook_funge') {
    return evaluateMissions({
      ...state,
      timeMinutes: (state.timeMinutes + 30) % 1440,
      playerAction: 'eat',
      needs: {
        ...state.needs,
        hunger: clampNeed(state.needs.hunger + 52),
        mood: clampNeed(state.needs.mood + 14),
      },
      lastEventMessage: 'Cozinhaste Funge com Muamba quentinho em casa! (+52 Comida)',
    });
  }

  if (action === 'shower') {
    if (state.placedBathtubId) {
      return useBathtub(state);
    }
    return {
      ...state,
      timeMinutes: (state.timeMinutes + 20) % 1440,
      needs: {
        ...state.needs,
        hygiene: 100,
        energy: clampNeed(state.needs.energy + 8),
        mood: clampNeed(state.needs.mood + 8),
      },
      lastEventMessage: 'Lavaste o rosto! Compra uma Banheira (>60.000 Kz) para recuperar muito mais Energia.',
    };
  }

  if (action === 'decorate' && furnitureId) {
    const cost = 3500;
    const target = state.furniture.find((f) => f.id === furnitureId);
    if (!target) return state;
    if (!target.placed && state.moneyKz < cost) {
      return {
        ...state,
        lastEventMessage: `Precisas de ${formatKz(cost)} para mobilar ${target.name}.`,
      };
    }
    const nextFurniture = state.furniture.map((f) =>
      f.id === furnitureId ? { ...f, placed: !f.placed } : f,
    );
    return {
      ...state,
      moneyKz: !target.placed ? state.moneyKz - cost : state.moneyKz,
      furniture: nextFurniture,
      needs: {
        ...state.needs,
        mood: clampNeed(state.needs.mood + 8),
      },
      lastEventMessage: !target.placed
        ? `Colocaste ${target.name} na tua sala (-${formatKz(cost)}).`
        : `Guardaste ${target.name} no depósito.`,
    };
  }

  if (action === 'party') {
    const cost = 5000;
    if (state.moneyKz < cost) {
      return {
        ...state,
        lastEventMessage: `Precisas de ${formatKz(cost)} para organizar uma festa com comida e música.`,
      };
    }
    const boostedNpcs = state.npcs.map((n) => ({
      ...n,
      affinity: Math.min(100, n.affinity + 12),
      stage: getRelationshipStage(Math.min(100, n.affinity + 12), n.stage),
    }));
    return evaluateMissions({
      ...state,
      moneyKz: state.moneyKz - cost,
      partiesHosted: state.partiesHosted + 1,
      reputation: state.reputation + 12,
      npcs: boostedNpcs,
      playerAction: 'dance',
      needs: {
        ...state.needs,
        mood: 100,
        hunger: clampNeed(state.needs.hunger + 25),
      },
      lastEventMessage: 'Festa épica na banda! Kuduro, kizomba, mufete e amigos satisfeitos.',
    });
  }

  return state;
}

export function openOrExpandBusiness(
  state: GameSnapshot,
  action: 'open' | 'hire' | 'collect',
  businessType?: BusinessState['type'],
  businessName?: string,
): GameSnapshot {
  if (action === 'open') {
    const cost = 45000;
    if (state.business.owned) return state;
    if (state.moneyKz < cost) {
      return {
        ...state,
        lastEventMessage: `Precisas de ${formatKz(cost)} para abrir a tua própria empresa.`,
      };
    }
    return evaluateMissions({
      ...state,
      moneyKz: state.moneyKz - cost,
      reputation: state.reputation + 20,
      business: {
        owned: true,
        name: businessName?.trim() || 'Grupo Banda Forte',
        type: businessType ?? 'Loja de Bairro',
        employees: 1,
        level: 1,
        dailyRevenueKz: 10700,
        pendingCashKz: 5000,
      },
      lastEventMessage: 'Empresa aberta! Começaste com 1 funcionário e lucro diário garantido.',
    });
  }

  if (action === 'hire') {
    if (!state.business.owned) return state;
    const cost = 15000;
    if (state.moneyKz < cost) {
      return {
        ...state,
        lastEventMessage: `Precisas de ${formatKz(cost)} para contratar mais um funcionário.`,
      };
    }
    const employees = state.business.employees + 1;
    const dailyRevenueKz = 6500 + employees * 4200 + state.business.level * 3000;
    return evaluateMissions({
      ...state,
      moneyKz: state.moneyKz - cost,
      business: {
        ...state.business,
        employees,
        dailyRevenueKz,
        pendingCashKz: state.business.pendingCashKz + 3500,
      },
      lastEventMessage: `Novo funcionário contratado! Equipa agora com ${employees} pessoas.`,
    });
  }

  if (action === 'collect') {
    if (!state.business.owned || state.business.pendingCashKz <= 0) return state;
    const amount = state.business.pendingCashKz;
    return {
      ...state,
      moneyKz: state.moneyKz + amount,
      business: {
        ...state.business,
        pendingCashKz: 0,
      },
      lastEventMessage: `Lucro da empresa levantado: +${formatKz(amount)}.`,
    };
  }

  return state;
}

export function interactWithNpc(
  state: GameSnapshot,
  npcId: string,
  action: 'talk' | 'gift' | 'date' | 'marry' | 'child' | 'football',
): GameSnapshot {
  const npc = state.npcs.find((n) => n.id === npcId);
  if (!npc) return state;

  if (npc.isGatuno && action === 'talk') {
    return {
      ...state,
      lastEventMessage: `${npc.name}: "${npc.greetings[0]}"`,
    };
  }

  let affinityDelta = 0;
  let cost = 0;
  let nextStage: RelationshipStage = npc.stage;
  let extraMessage = '';
  let childrenDelta = 0;
  let moodDelta = 8;

  if (action === 'talk') {
    affinityDelta = 12;
    const greeting = npc.greetings[Math.floor(Math.random() * npc.greetings.length)];
    extraMessage = `${npc.name}: "${greeting}"`;
  } else if (action === 'gift') {
    cost = 2000;
    if (state.moneyKz < cost) {
      return { ...state, lastEventMessage: `Precisas de ${formatKz(cost)} para oferecer uma lembrança.` };
    }
    affinityDelta = 20;
    extraMessage = `Ofereceste um presente a ${npc.name} (+20 afinidade).`;
  } else if (action === 'date') {
    if (npc.affinity < 45) {
      return { ...state, lastEventMessage: `Aumenta mais a amizade com ${npc.name} antes de convidar para namorar.` };
    }
    cost = 3500;
    if (state.moneyKz < cost) {
      return { ...state, lastEventMessage: `Precisas de ${formatKz(cost)} para um jantar na Ilha.` };
    }
    affinityDelta = 22;
    nextStage = 'Namorado(a)';
    moodDelta = 20;
    extraMessage = `Encontro romântico na Marginal com ${npc.name}! Agora estão a namorar.`;
  } else if (action === 'marry') {
    if (npc.stage !== 'Namorado(a)' && npc.affinity < 80) {
      return { ...state, lastEventMessage: `Precisas de namorar com ${npc.name} (afinidade >= 80) para casar.` };
    }
    cost = 18000;
    if (state.moneyKz < cost) {
      return { ...state, lastEventMessage: `O casamento na banda custa ${formatKz(cost)}.` };
    }
    affinityDelta = 20;
    nextStage = 'Casado(a)';
    moodDelta = 30;
    extraMessage = `Casamento celebrado na banda com ${npc.name}! Parabéns aos noivos!`;
  } else if (action === 'child') {
    if (npc.stage !== 'Casado(a)') {
      return { ...state, lastEventMessage: `Precisas de estar casado(a) com ${npc.name} para construir família.` };
    }
    childrenDelta = 1;
    moodDelta = 25;
    extraMessage = 'Novo membro na família! A casa ganhou mais alegria.';
  } else if (action === 'football') {
    affinityDelta = 15;
    moodDelta = 22;
    extraMessage = `Jogaste uma pelada épica com ${npc.name} e ganhaste 2.500 Kz do torneio!`;
  }

  const nextNpcs = state.npcs.map((n) => {
    if (n.id !== npcId) return n;
    const affinity = Math.min(100, n.affinity + affinityDelta);
    const stage = nextStage !== n.stage ? nextStage : getRelationshipStage(affinity, n.stage);
    return { ...n, affinity, stage };
  });

  const existingThread = state.chatThreads[npcId] ?? [];
  const nextThread = [
    ...existingThread,
    {
      id: `msg_${Date.now()}_${Math.random()}`,
      sender: npc.name,
      text: extraMessage,
      timeLabel: formatTime(state.timeMinutes),
      fromPlayer: false,
    },
  ];

  const footballReward = action === 'football' ? 2500 : 0;

  return evaluateMissions({
    ...state,
    moneyKz: state.moneyKz - cost + footballReward,
    reputation: state.reputation + (action === 'marry' ? 20 : 3),
    childrenCount: state.childrenCount + childrenDelta,
    npcs: nextNpcs,
    chatThreads: {
      ...state.chatThreads,
      [npcId]: nextThread.slice(-12),
    },
    playerAction: action === 'talk' ? 'talk' : state.playerAction,
    needs: {
      ...state.needs,
      mood: clampNeed(state.needs.mood + moodDelta),
    },
    lastEventMessage: extraMessage,
  });
}

export function bankTransfer(
  state: GameSnapshot,
  direction: 'deposit' | 'withdraw',
  amount: number,
): GameSnapshot {
  const clean = Math.floor(amount);
  if (clean <= 0) return state;
  if (direction === 'deposit') {
    if (state.moneyKz < clean) return { ...state, lastEventMessage: 'Dinheiro em mão insuficiente.' };
    return {
      ...state,
      moneyKz: state.moneyKz - clean,
      bankKz: state.bankKz + clean,
      lastEventMessage: `Depositaste ${formatKz(clean)} no Banco BAI.`,
    };
  }
  if (state.bankKz < clean) return { ...state, lastEventMessage: 'Saldo bancário insuficiente.' };
  return {
    ...state,
    moneyKz: state.moneyKz + clean,
    bankKz: state.bankKz - clean,
    lastEventMessage: `Levantaste ${formatKz(clean)} no Multicaixa.`,
  };
}

export function evaluateMissions(state: GameSnapshot): GameSnapshot {
  const completed = new Set(state.completedMissionIds);
  let bonusKz = 0;
  let bonusRep = 0;
  let newlyCompletedTitle = '';

  const check = (id: string, condition: boolean) => {
    if (!completed.has(id) && condition) {
      const m = MISSIONS.find((item) => item.id === id);
      if (m) {
        completed.add(id);
        bonusKz += m.rewardKz;
        bonusRep += m.rewardReputation;
        newlyCompletedTitle = m.title;
      }
    }
  };

  check('m1_emprego', state.shiftsCompleted >= 1);
  check('m2_cantina', state.moneyKz + state.bankKz >= 20000);
  check('m3_banheira', state.ownedBathtubs.length >= 1);
  check('m4_viagem', state.currentMunicipalityId !== state.homeMunicipalityId);
  check('m5_condo', Boolean(state.activeCondoRental));

  const nextActive = MISSIONS.find((m) => !completed.has(m.id))?.id ?? MISSIONS[MISSIONS.length - 1].id;

  if (bonusKz === 0 && nextActive === state.activeMissionId) {
    return state;
  }

  return {
    ...state,
    moneyKz: state.moneyKz + bonusKz,
    reputation: state.reputation + bonusRep,
    completedMissionIds: Array.from(completed),
    activeMissionId: nextActive,
    lastEventMessage: newlyCompletedTitle
      ? `Missão concluída: ${newlyCompletedTitle} (+${formatKz(bonusKz)})!`
      : state.lastEventMessage,
  };
}

export function findNearestLandmark(
  x: number,
  z: number,
  municipalityId: MunicipalityId = 'ingombota',
): LandmarkDef | null {
  let best: LandmarkDef | null = null;
  let bestDist = Infinity;
  for (const lm of LANDMARKS) {
    if (lm.municipalityId !== municipalityId) continue;
    const dx = lm.x - x;
    const dz = lm.z - z;
    const dist = Math.hypot(dx, dz);
    if (dist <= lm.radius && dist < bestDist) {
      best = lm;
      bestDist = dist;
    }
  }
  return best;
}

export function clampWorldPosition(x: number, z: number): { x: number; z: number } {
  // Compact island diorama bounds matching reference photo: [-22.5, 22.5]
  return {
    x: Math.max(-22.5, Math.min(22.5, x)),
    z: Math.max(-22.5, Math.min(22.5, z)),
  };
}
