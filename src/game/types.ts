export type GameMode = 'auth' | 'title' | 'creator' | 'lottery' | 'playing' | 'paused';

export type SceneViewMode = 'outdoor' | 'company_room' | 'home_room';

export type NetworkMode = 'online' | 'offline';

export type BirthClassId = 'pobre' | 'normal' | 'acima_media' | 'rico';

export interface MotherHistoryDef {
  id: string;
  birthDistrict: string;
  motherOccupation: string;
  story: string;
}

export interface BirthClassDef {
  id: BirthClassId;
  label: string;
  subtitle: string;
  probability: number;
  minMoneyKz: number;
  maxMoneyKz: number;
  minBankKz: number;
  maxBankKz: number;
  startingReputation: number;
  startingPropertyId: PropertyTierId;
  startingVehicleId: VehicleId | null;
  accentColor: string;
  description: string;
  motherHistories: MotherHistoryDef[];
}

export interface BirthLotteryOutcome {
  birthClassId: BirthClassId;
  moneyKz: number;
  bankKz: number;
  motherHistory: MotherHistoryDef;
}

export type Gender = 'Masculino' | 'Feminino';

export type HairStyle =
  | 'corte_baixo'
  | 'afro'
  | 'trancas'
  | 'dreads'
  | 'ondulado'
  | 'coque';

export type BeardStyle = 'nenhuma' | 'cavanhaque' | 'barba_cheia' | 'desenhada';

export type OutfitStyle =
  | 'urbano_luanda'
  | 'samakaka_tradicional'
  | 'executivo'
  | 'desportivo'
  | 'festa_kuduro';

export type BodyBuild = 'esguio' | 'atletico' | 'robusto';

export type CharacterAction =
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'sit'
  | 'sleep'
  | 'dance'
  | 'talk'
  | 'eat'
  | 'drink'
  | 'phone'
  | 'drive'
  | 'work'
  | 'bathe'
  | 'steal';

export interface CharacterAppearance {
  firstName: string;
  lastName: string;
  age: number;
  gender: Gender;
  skinTone: string;
  faceShape: 'oval' | 'angular' | 'redondo';
  eyeColor: string;
  hairStyle: HairStyle;
  hairColor: string;
  beardStyle: BeardStyle;
  height: number;
  bodyBuild: BodyBuild;
  outfit: OutfitStyle;
  shirtColor: string;
  pantsColor: string;
  shoeColor: string;
  hasWatch: boolean;
  hasChain: boolean;
  hasCap: boolean;
  capColor: string;
  hasGlasses: boolean;
}

export type ProfessionId =
  | 'taxista'
  | 'candongueiro'
  | 'mototaxista'
  | 'vendedor'
  | 'empresario'
  | 'mecanico'
  | 'policia'
  | 'seguranca'
  | 'programador'
  | 'medico'
  | 'professor'
  | 'supermercado'
  | 'construcao'
  | 'restaurante'
  | 'criador'
  | 'musico'
  | 'futebolista';

export type EducationLevelId =
  | 'basico'
  | 'medio'
  | 'tecnico'
  | 'licenciatura'
  | 'pos_graduacao';

export interface EducationLevelDef {
  id: EducationLevelId;
  label: string;
  rank: number;
  tuitionKz: number;
  energyCost: number;
  description: string;
}

export interface ProfessionDef {
  id: ProfessionId;
  title: string;
  category: 'Transporte' | 'Comércio' | 'Serviços' | 'Tecnologia' | 'Cultura & Desporto' | 'Negócios';
  shiftPayKz: number;
  energyCost: number;
  hungerCost: number;
  stressGain: number;
  exertionLabel: 'Leve (Escritório/Tech)' | 'Moderado' | 'Pesado (Físico)';
  missionLabel: string;
  zoneId: string;
  minReputation: number;
  minEducation: EducationLevelId;
  acceptanceChance: number;
  description: string;
}

export type CompanyId =
  | 'sonangol'
  | 'pumangol'
  | 'unitel'
  | 'banco_bai'
  | 'taag'
  | 'refriango'
  | 'kero';

export interface CompanyJobDef {
  id: string;
  title: string;
  professionId: ProfessionId;
  shiftPayKz: number;
  energyCost: number;
  hungerCost: number;
  stressGain: number;
  exertionLabel: 'Leve' | 'Moderado' | 'Pesado';
  minReputation: number;
  minEducation: EducationLevelId;
  acceptanceChance: number;
  description: string;
}

export interface AngolanCompanyDef {
  id: CompanyId;
  name: string;
  sector: string;
  municipalityId: MunicipalityId;
  district: string;
  landmarkId: string;
  brandColor: string;
  accentColor: string;
  roomFloorColor: string;
  roomWallColor: string;
  description: string;
  jobs: CompanyJobDef[];
}

export interface ActiveWorkShift {
  companyId: CompanyId | null;
  jobTitle: string;
  companyName: string | null;
  startsAtMs: number;
  endsAtMs: number;
  basePayKz: number;
  energyCost: number;
  hungerCost: number;
  stressGain: number;
}

export type MunicipalityId =
  | 'ingombota'
  | 'ilha_luanda'
  | 'talatona'
  | 'viana'
  | 'benguela'
  | 'huambo';

export interface MunicipalityDef {
  id: MunicipalityId;
  name: string;
  province: 'Luanda' | 'Benguela' | 'Huambo';
  shortLabel: string;
  tagline: string;
  groundColor: string;
  waterColor: string;
  accentColor: string;
  travelModeFromLuanda: 'taxi' | 'aviao';
  taxiCostKz: number;
  flightCostKz: number;
  description: string;
}

export type BathtubId =
  | 'banheira_normal'
  | 'banheira_classica'
  | 'banheira_hidro'
  | 'banheira_marmore'
  | 'jacuzzi_ilha';

export interface BathtubDef {
  id: BathtubId;
  name: string;
  priceKz: number;
  energyRestore: number;
  hygieneRestore: number;
  moodRestore: number;
  stressRelief: number;
  primaryColor: string;
  trimColor: string;
  hasBubbles: boolean;
  hasJets: boolean;
  description: string;
}

export type CondominiumId =
  | 'condo_talatona_garden'
  | 'condo_ilha_praia'
  | 'condo_miramar_sky';

export interface CondominiumDef {
  id: CondominiumId;
  name: string;
  municipalityId: MunicipalityId;
  district: string;
  dailyRealPriceKz: number;
  comfortBonus: number;
  accentColor: string;
  description: string;
}

export interface ActiveCondoRental {
  condoId: CondominiumId;
  rentedAtRealMs: number;
  expiresAtRealMs: number;
  daysPaid: number;
}

export type PropertyTierId =
  | 'quarto_alugado'
  | 'casa_simples'
  | 'casa_familiar'
  | 'apartamento_moderno'
  | 'vivenda_luxo'
  | 'mansao';

export interface PropertyDef {
  id: PropertyTierId;
  name: string;
  district: string;
  rentOrBuy: 'Aluguer' | 'Compra';
  priceKz: number;
  dailyRentKz: number;
  comfortBonus: number;
  rooms: number;
  landmarkId: string;
  description: string;
}

export type VehicleId =
  | 'motorizada'
  | 'hyundai_i10'
  | 'toyota_corolla'
  | 'candongueiro_hiace'
  | 'toyota_hiace_vip'
  | 'toyota_hilux'
  | 'bmw_serie3'
  | 'mercedes_c'
  | 'range_rover'
  | 'autocarro';

export interface VehicleDef {
  id: VehicleId;
  name: string;
  category: 'Motorizada' | 'Ligeiro' | 'Candongueiro' | 'SUV / Pick-up' | 'Luxo' | 'Pesado';
  priceKz: number;
  maxSpeedKmh: number;
  acceleration: number;
  fuelCapacity: number;
  defaultColor: string;
  isCandongueiro?: boolean;
  isMoto?: boolean;
  isBus?: boolean;
  description: string;
}

export interface OwnedVehicleState {
  id: VehicleId;
  color: string;
  fuel: number;
  health: number;
  x: number;
  z: number;
  rotationY: number;
  lightsOn: boolean;
  doorsOpen: boolean;
}

export type PetSpecies = 'cao' | 'gato';

export interface PetBreedDef {
  id: string;
  species: PetSpecies;
  breedName: string;
  tierLabel: 'Popular' | 'Raça Média' | 'Luxo Importado';
  priceKz: number;
  coatColor: string;
  accentColor: string;
  stressRelief: number;
  moodBonus: number;
  sizeScale: number;
  description: string;
}

export interface OwnedPet {
  id: string;
  breedId: string;
  species: PetSpecies;
  breedName: string;
  name: string;
  coatColor: string;
  accentColor: string;
  affection: number;
  hunger: number;
  adoptedAtMs: number;
}

export interface FamilyChild {
  id: string;
  name: string;
  gender: Gender;
  isAdopted: boolean;
  parentName: string;
  bornAtMs: number;
}

export type WeatherType = 'sol' | 'nuvens' | 'chuva' | 'trovoada' | 'vento';

export type MusicGenre = 'kuduro' | 'semba' | 'afrohouse' | 'kizomba';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  genre: MusicGenre;
  bpm: number;
}

export type RelationshipStage =
  | 'Desconhecido'
  | 'Conhecido'
  | 'Amigo'
  | 'Melhor Amigo'
  | 'Namorado(a)'
  | 'Casado(a)';

export interface NpcProfile {
  id: string;
  name: string;
  role: string;
  personality: string;
  municipalityId: MunicipalityId;
  district: string;
  skinTone: string;
  shirtColor: string;
  hairStyle: HairStyle;
  gender: Gender;
  affinity: number;
  stage: RelationshipStage;
  isFamily?: boolean;
  isGatuno?: boolean;
  isMendigo?: boolean;
  isBurlador?: boolean;
  scamOfferTitle?: string;
  scamAskKz?: number;
  scamPromiseKz?: number;
  homeX: number;
  homeZ: number;
  greetings: string[];
  topics: string[];
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timeLabel: string;
  fromPlayer: boolean;
}

export interface GlobalChatMessage {
  id: string;
  senderEmail: string;
  senderName: string;
  isAdmin: boolean;
  municipalityId: MunicipalityId;
  text: string;
  createdAtMs: number;
}

export interface OnlinePlayerPresence {
  email: string;
  name: string;
  isAdmin: boolean;
  municipalityId: MunicipalityId;
  sceneView: SceneViewMode;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  action: CharacterAction;
  appearance: CharacterAppearance;
  updatedAtMs: number;
}

export interface SocialPost {
  id: string;
  author: string;
  handle: string;
  location: string;
  caption: string;
  likes: number;
  likedByPlayer: boolean;
  timeLabel: string;
}

export interface MarketItem {
  id: string;
  name: string;
  category: 'Comida Típica' | 'Café & Energia' | 'Moda' | 'Casa & Decoração';
  priceKz: number;
  hungerRestore?: number;
  energyRestore?: number;
  moodRestore?: number;
  stressRelief?: number;
  description: string;
}

export interface FurnitureSlot {
  id: string;
  name: string;
  placed: boolean;
  xOffset: number;
  zOffset: number;
  color: string;
}

export interface MissionDef {
  id: string;
  type: 'Principal' | 'Secundária';
  title: string;
  description: string;
  rewardKz: number;
  rewardReputation: number;
}

export interface LandmarkDef {
  id: string;
  name: string;
  shortLabel: string;
  municipalityId: MunicipalityId;
  district: string;
  category:
    | 'Trabalho'
    | 'Comércio'
    | 'Cantina'
    | 'Casa'
    | 'Condomínio'
    | 'Cultura & Lazer'
    | 'Serviços'
    | 'Transporte';
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  buildingColor: string;
  roofColor: string;
  accentColor: string;
  radius: number;
  description: string;
  actionLabel: string;
  companyId?: CompanyId;
  condoId?: CondominiumId;
}

export interface BusinessState {
  owned: boolean;
  name: string;
  type: 'Loja de Bairro' | 'Restaurante Típico' | 'Oficina & Peças' | 'Produtora Kuduro';
  employees: number;
  level: number;
  dailyRevenueKz: number;
  pendingCashKz: number;
}

export interface PlayerNeeds {
  energy: number;
  hunger: number;
  hygiene: number;
  mood: number;
  health: number;
  stress: number;
}

export type PhoneAppId =
  | 'home'
  | 'chat'
  | 'pay'
  | 'maps'
  | 'jobs'
  | 'market'
  | 'gov'
  | 'condo'
  | 'family'
  | 'social'
  | 'car'
  | 'house'
  | 'crime'
  | 'music';

export type GovRole = 'Presidente' | 'Ministro' | 'Governador';

export interface GovCandidate {
  id: string;
  name: string;
  email: string;
  role: GovRole;
  province: string;
  partyOrSlogan: string;
  votes: number;
  createdAtMs: number;
}

export interface GlobalAnnouncement {
  id: string;
  authorName: string;
  message: string;
  createdAtMs: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  mutedInChat?: boolean;
  createdAt: number;
}

export interface TravelPlan {
  fromMunicipalityId: MunicipalityId;
  toMunicipalityId: MunicipalityId;
  mode: 'taxi' | 'aviao';
  costKz: number;
  durationSec: number;
}

export interface GameSnapshot {
  mode: GameMode;
  networkMode: NetworkMode;
  sceneView: SceneViewMode;
  activeCompanyRoomId: CompanyId | null;
  currentMunicipalityId: MunicipalityId;
  homeMunicipalityId: MunicipalityId;
  birthClass: BirthClassId;
  birthDistrict: string;
  motherOccupation: string;
  motherStory: string;
  appearance: CharacterAppearance;
  moneyKz: number;
  bankKz: number;
  reputation: number;
  day: number;
  timeMinutes: number;
  weather: WeatherType;
  needs: PlayerNeeds;
  educationLevel: EducationLevelId;
  studyProgress: number;
  studySessionsCompleted: number;
  profession: ProfessionId | null;
  currentCompanyId: CompanyId | null;
  currentCompanyJobTitle: string | null;
  activeShift: ActiveWorkShift | null;
  lastJobApplication: {
    accepted: boolean;
    title: string;
    companyName: string;
    message: string;
  } | null;
  shiftsCompleted: number;
  propertyId: PropertyTierId;
  activeCondoRental: ActiveCondoRental | null;
  ownedBathtubs: BathtubId[];
  placedBathtubId: BathtubId | null;
  furniture: FurnitureSlot[];
  inventory: Record<string, number>;
  ownedVehicles: OwnedVehicleState[];
  activeVehicleIndex: number;
  inVehicle: boolean;
  vehicleSpeedKmh: number;
  business: BusinessState;
  npcs: NpcProfile[];
  pets: OwnedPet[];
  children: FamilyChild[];
  childrenCount: number;
  partiesHosted: number;
  racesWon: number;
  stealSuccessCount: number;
  lastStealAtMs: number;
  completedMissionIds: string[];
  activeMissionId: string;
  chatThreads: Record<string, ChatMessage[]>;
  socialPosts: SocialPost[];
  radioPlaying: boolean;
  currentTrackId: string;
  playerAction: CharacterAction;
  playerDistrict: string;
  playerX: number;
  playerY: number;
  playerZ: number;
  nearbyLandmarkId: string | null;
  nearbyNpcId: string | null;
  nearbyVehiclePrompt: boolean;
  lastEventMessage: string;
}
