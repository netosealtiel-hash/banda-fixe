import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyBirthLottery,
  applyForCompanyJob,
  bankTransfer,
  buyBathtub,
  buyMarketItem,
  buyVehicle,
  canPlayerSteal,
  completeMunicipalityTravel,
  createInitialSnapshot,
  enterCompanyRoom,
  enterHomeRoom,
  exitRoomToStreet,
  formatKz,
  formatRealRemaining,
  formatTime,
  getDayPhaseLabel,
  handleGatunoEncounter,
  interactWithNpc,
  isCondoRentalActive,
  openOrExpandBusiness,
  performHouseAction,
  performStudySession,
  performWorkShift,
  planMunicipalityTravel,
  rentCondominium,
  rollBirthClass,
  rollBirthLotteryOutcome,
  selectProfession,
  serviceActiveVehicle,
  stealFromTarget,
  upgradeProperty,
  useBathtub,
} from './simulation';
import { BATHTUBS, REAL_DAY_MS } from './angolaData';

test('formatting Kwanza, real durations, and Angolan time phases', () => {
  assert.match(formatKz(65000), /65[\s.]?000\sKz/);
  assert.equal(formatTime(8 * 60 + 5), '08:05');
  assert.equal(getDayPhaseLabel(9 * 60), 'Manhã');
  assert.equal(getDayPhaseLabel(15 * 60), 'Tarde');
  assert.equal(getDayPhaseLabel(19 * 60), 'Entardecer');
  assert.equal(getDayPhaseLabel(23 * 60), 'Noite');

  const now = 1_700_000_000_000;
  assert.equal(formatRealRemaining(now + 2 * REAL_DAY_MS + 3_600_000, now), '2d 1h 0m');
  assert.equal(formatRealRemaining(now - 1000, now), 'Expirado');
});

test('food-gated work: heavy jobs consume more hunger and energy than programmer', () => {
  const base = createInitialSnapshot();

  // Safety guard job (heavy exertion)
  let heavy = applyForCompanyJob(
    { ...base, reputation: 10, educationLevel: 'basico' },
    'sonangol',
    'sonangol_seguranca',
    () => 0.1,
  );
  assert.equal(heavy.currentCompanyId, 'sonangol');

  // Block work when hunger is too low
  const hungryState = { ...heavy, needs: { ...heavy.needs, hunger: 10, energy: 90 } };
  const blockedByFood = performWorkShift(hungryState);
  assert.equal(blockedByFood.shiftsCompleted, 0);
  assert.match(blockedByFood.lastEventMessage, /Comida insuficiente/i);

  // Programmer job (light exertion)
  let tech = applyForCompanyJob(
    { ...base, reputation: 25, educationLevel: 'tecnico' },
    'unitel',
    'unitel_programador',
    () => 0.1,
  );
  assert.equal(tech.currentCompanyId, 'unitel');

  // Execute one shift in each and compare hunger + energy drain
  const heavyAfter = performWorkShift({
    ...heavy,
    needs: { ...heavy.needs, hunger: 100, energy: 100 },
  });
  const techAfter = performWorkShift({
    ...tech,
    needs: { ...tech.needs, hunger: 100, energy: 100 },
  });

  const heavyDrain = (100 - heavyAfter.needs.energy) + (100 - heavyAfter.needs.hunger);
  const techDrain = (100 - techAfter.needs.energy) + (100 - techAfter.needs.hunger);
  assert.ok(heavyDrain > techDrain * 2, `Expected heavy (${heavyDrain}) >> tech (${techDrain})`);
  assert.equal(heavyAfter.shiftsCompleted, 1);
  assert.ok(heavyAfter.completedMissionIds.includes('m1_emprego'));
});

test('cantina sells coffees & food and bathtubs (>60k Kz) restore energy when clicked', () => {
  // Verify normal bathtub costs strictly more than 60.000 Kz
  const normalTub = BATHTUBS.find((b) => b.id === 'banheira_normal')!;
  assert.ok(normalTub.priceKz > 60000);

  let state = createInitialSnapshot();
  state = {
    ...state,
    moneyKz: 200000,
    needs: { ...state.needs, hunger: 35, energy: 25 },
  };

  // Buy coffee for energy and funge for hunger
  state = buyMarketItem(state, 'cafe_expresso', true);
  assert.ok(state.needs.energy >= 45);
  state = buyMarketItem(state, 'funge_muamba', true);
  assert.ok(state.needs.hunger >= 80);

  // Buy normal bathtub (65.000 Kz) and click it to restore energy
  const energyBeforeTub = 30;
  state = { ...state, needs: { ...state.needs, energy: energyBeforeTub } };
  state = buyBathtub(state, 'banheira_normal');
  assert.equal(state.placedBathtubId, 'banheira_normal');
  assert.ok(state.completedMissionIds.includes('m3_banheira'));

  state = useBathtub(state);
  assert.equal(state.needs.energy, energyBeforeTub + normalTub.energyRestore);
  assert.equal(state.playerAction, 'bathe');
});

test('condominiums rent by real calendar days and expose accurate expiration', () => {
  const now = 1_700_000_000_000;
  let state = createInitialSnapshot();
  state = { ...state, moneyKz: 250000 };

  state = rentCondominium(state, 'condo_talatona_garden', 2, now);
  assert.ok(state.activeCondoRental);
  assert.equal(state.activeCondoRental?.daysPaid, 2);
  assert.equal(state.activeCondoRental?.expiresAtRealMs, now + 2 * REAL_DAY_MS);
  assert.equal(isCondoRentalActive(state.activeCondoRental, now + REAL_DAY_MS), true);
  assert.equal(isCondoRentalActive(state.activeCondoRental, now + 2 * REAL_DAY_MS + 1), false);
});

test('stealing requires minimum 3 real days account age and gatunos rob unprotected players', () => {
  const createdAt = 1_700_000_000_000;
  const twoDaysLater = createdAt + 2 * REAL_DAY_MS;
  const threeDaysLater = createdAt + 3 * REAL_DAY_MS + 1000;

  assert.equal(canPlayerSteal(createdAt, twoDaysLater).allowed, false);
  assert.equal(canPlayerSteal(createdAt, threeDaysLater).allowed, true);

  let state = createInitialSnapshot();
  state = { ...state, moneyKz: 20000, needs: { ...state.needs, energy: 80 } };

  // Blocked at 2 real days
  const blocked = stealFromTarget(state, createdAt, twoDaysLater, 'Zé', () => 0.1);
  assert.equal(blocked.stealSuccessCount, 0);
  assert.match(blocked.lastEventMessage, /3 dias reais/i);

  // Allowed at 3+ real days
  const stolen = stealFromTarget(state, createdAt, threeDaysLater, 'Turista', () => 0.2);
  assert.equal(stolen.stealSuccessCount, 1);
  assert.ok(stolen.moneyKz > state.moneyKz);

  // Gatuno encounter steals money unless player has protection (police / security / active condo)
  const robbed = handleGatunoEncounter(state, 'Zé Sombra (Gatuno)', threeDaysLater);
  assert.ok(robbed.moneyKz < state.moneyKz);

  const protectedState = { ...state, profession: 'policia' as const };
  const safe = handleGatunoEncounter(protectedState, 'Zé Sombra (Gatuno)', threeDaysLater);
  assert.equal(safe.moneyKz, protectedState.moneyKz);
});

test('travel plans select taxi inside Luanda and aviao across provinces, plus 3D room entry/exit', () => {
  let state = createInitialSnapshot();
  state = { ...state, moneyKz: 80000 };

  const taxiPlan = planMunicipalityTravel(state, 'ilha_luanda');
  assert.ok(taxiPlan);
  assert.equal(taxiPlan?.mode, 'taxi');
  state = completeMunicipalityTravel(state, taxiPlan!);
  assert.equal(state.currentMunicipalityId, 'ilha_luanda');
  assert.ok(state.completedMissionIds.includes('m4_viagem'));

  const flightPlan = planMunicipalityTravel(state, 'benguela');
  assert.ok(flightPlan);
  assert.equal(flightPlan?.mode, 'aviao');
  state = completeMunicipalityTravel(state, flightPlan!);
  assert.equal(state.currentMunicipalityId, 'benguela');

  // Entering and exiting 3D company and home rooms
  state = enterCompanyRoom(state, 'sonangol');
  assert.equal(state.sceneView, 'company_room');
  assert.equal(state.activeCompanyRoomId, 'sonangol');

  state = exitRoomToStreet(state);
  assert.equal(state.sceneView, 'outdoor');
  assert.equal(state.activeCompanyRoomId, null);

  state = enterHomeRoom(state);
  assert.equal(state.sceneView, 'home_room');
});

test('property upgrade, hosting party, opening business, and vehicle garage work', () => {
  let state = createInitialSnapshot();
  state = { ...state, moneyKz: 250000 };

  state = upgradeProperty(state, 'casa_simples');
  assert.equal(state.propertyId, 'casa_simples');

  state = performHouseAction(state, 'party');
  assert.equal(state.partiesHosted, 1);

  state = openOrExpandBusiness(state, 'open', 'Restaurante Típico', 'Sabores do Kuduro');
  assert.equal(state.business.owned, true);
  assert.equal(state.business.employees, 1);

  state = buyVehicle(state, 'motorizada', '#dc2626');
  assert.equal(state.ownedVehicles.length, 2);
});

test('social progression, banking, and vehicle service update state accurately', () => {
  let state = createInitialSnapshot();
  state = { ...state, moneyKz: 60000 };
  for (let i = 0; i < 4; i++) {
    state = interactWithNpc(state, 'neusa_dev', 'talk');
  }
  state = interactWithNpc(state, 'neusa_dev', 'date');
  let neusa = state.npcs.find((n) => n.id === 'neusa_dev')!;
  assert.equal(neusa.stage, 'Namorado(a)');

  state = interactWithNpc(state, 'neusa_dev', 'marry');
  neusa = state.npcs.find((n) => n.id === 'neusa_dev')!;
  assert.equal(neusa.stage, 'Casado(a)');

  state = interactWithNpc(state, 'neusa_dev', 'child');
  assert.equal(state.childrenCount, 1);

  const beforeBank = state.moneyKz;
  state = bankTransfer(state, 'deposit', 2000);
  assert.equal(state.moneyKz, beforeBank - 2000);

  state = {
    ...state,
    ownedVehicles: state.ownedVehicles.map((v) => ({ ...v, fuel: 25, health: 50 })),
  };
  state = serviceActiveVehicle(state, 'refuel');
  assert.equal(state.ownedVehicles[0].fuel, 100);
  state = serviceActiveVehicle(state, 'repair');
  assert.equal(state.ownedVehicles[0].health, 100);
});

test('life lottery rolls all four birth classes with exact money bounds and mother history', () => {
  assert.equal(rollBirthClass(() => 0.1).id, 'pobre');
  assert.equal(rollBirthClass(() => 0.5).id, 'normal');
  assert.equal(rollBirthClass(() => 0.85).id, 'acima_media');
  assert.equal(rollBirthClass(() => 0.97).id, 'rico');

  const base = createInitialSnapshot();

  const pobre = applyBirthLottery(base, rollBirthLotteryOutcome(() => 0.0, 'pobre'));
  assert.equal(pobre.birthClass, 'pobre');
  assert.equal(pobre.motherOccupation, 'Zungueira');
  assert.equal(pobre.birthDistrict, 'Cazenga');
  assert.equal(pobre.bankKz, 0);
  assert.equal(pobre.ownedVehicles.length, 0);

  for (const r of [0.0, 0.5, 0.99]) {
    const out = rollBirthLotteryOutcome(() => r, 'acima_media');
    const total = out.moneyKz + out.bankKz;
    assert.ok(total <= 500000 && total >= 270000);
  }

  for (const r of [0.0, 0.5, 0.99]) {
    const out = rollBirthLotteryOutcome(() => r, 'rico');
    const total = out.moneyKz + out.bankKz;
    assert.ok(total >= 4000000 && total <= 10000000);
  }
});

test('company hiring enforces education diplomas and interview chance', () => {
  let state = createInitialSnapshot();
  state = { ...state, reputation: 20, moneyKz: 40000, educationLevel: 'basico' };

  state = applyForCompanyJob(state, 'sonangol', 'sonangol_programador', () => 0.1);
  assert.equal(state.currentCompanyId, null);
  assert.equal(state.lastJobApplication?.accepted, false);

  // Study up to Técnico Profissional (basico -> medio -> tecnico)
  for (let i = 0; i < 4; i++) {
    state = performStudySession(state, 'paid_course');
  }
  assert.equal(state.educationLevel, 'tecnico');

  // High rng rejects interview
  state = applyForCompanyJob(state, 'sonangol', 'sonangol_programador', () => 0.99);
  assert.equal(state.currentCompanyId, null);
  assert.equal(state.lastJobApplication?.accepted, false);

  // Low rng accepts interview
  state = applyForCompanyJob(state, 'sonangol', 'sonangol_programador', () => 0.1);
  assert.equal(state.currentCompanyId, 'sonangol');
  assert.equal(state.lastJobApplication?.accepted, true);

  state = selectProfession(state, 'programador', () => 0.1);
  assert.equal(state.profession, 'programador');
});
