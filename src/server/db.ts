import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { REAL_DAY_MS } from '../game/angolaData';
import { createInitialSnapshot } from '../game/simulation';
import {
  AuthUser,
  GameSnapshot,
  GlobalAnnouncement,
  GovCandidate,
  GovRole,
} from '../game/types';

export const OWNER_EMAIL = 'netosealtiel@gmail.com';

export interface StoredAccount {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  isAdmin: boolean;
  createdAt: number;
  snapshot: GameSnapshot;
}

export interface BandaDbData {
  accounts: Record<string, StoredAccount>; // keyed by lowercased email
  sessions: Record<string, string>; // token -> lowercased email
  announcements: GlobalAnnouncement[];
  govCandidates: GovCandidate[];
  govVotes: Record<string, Record<string, string>>; // email -> role -> candidateId
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'banda_db.json');

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

function makeAccount(
  email: string,
  name: string,
  password: string,
  createdAt: number,
  initialMoneyKz?: number,
): StoredAccount {
  const cleanEmail = email.trim().toLowerCase();
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const snap = createInitialSnapshot();
  const parts = name.trim().split(/\s+/);
  snap.appearance = {
    ...snap.appearance,
    firstName: parts[0] || 'Cidadão',
    lastName: parts.slice(1).join(' ') || 'Angola',
  };
  snap.mode = 'playing';
  if (typeof initialMoneyKz === 'number') {
    snap.moneyKz = initialMoneyKz;
  }
  return {
    id: `usr_${crypto.randomBytes(6).toString('hex')}`,
    email: cleanEmail,
    name: name.trim(),
    passwordHash,
    salt,
    isAdmin: cleanEmail === OWNER_EMAIL,
    createdAt,
    snapshot: snap,
  };
}

function createSeedDb(): BandaDbData {
  const now = Date.now();
  const ownerAcc = makeAccount(
    OWNER_EMAIL,
    'Neto Sealtiel (Dono ADM)',
    'banda2025',
    now - 10 * REAL_DAY_MS,
    250000,
  );
  const demoCitizen = makeAccount(
    'kelson@banda.ao',
    'Kelson Manuel',
    'luanda123',
    now - 4 * REAL_DAY_MS,
    35000,
  );
  const newCitizen = makeAccount(
    'novato@banda.ao',
    'Jelson Novato',
    'luanda123',
    now - 2 * 3600_000,
    14000,
  );

  const govCandidates: GovCandidate[] = [
    {
      id: 'cand_pres_1',
      name: 'Eng. Sebastião Kilamba',
      email: 'kilamba@gov.ao',
      role: 'Presidente',
      province: 'Nacional',
      partyOrSlogan: 'Mais Empregos, Energia e Condomínios Acessíveis',
      votes: 14,
      createdAtMs: now - 5 * REAL_DAY_MS,
    },
    {
      id: 'cand_pres_2',
      name: 'Dra. Helena Miramar',
      email: 'helena@gov.ao',
      role: 'Presidente',
      province: 'Nacional',
      partyOrSlogan: 'Educação Tecnológica e Segurança nas Ruas',
      votes: 11,
      createdAtMs: now - 4 * REAL_DAY_MS,
    },
    {
      id: 'cand_min_1',
      name: 'Dr. Mateus Sonangol',
      email: 'mateus@gov.ao',
      role: 'Ministro',
      province: 'Economia & Finanças',
      partyOrSlogan: 'Kwanza Forte e Apoio às Cantinas e Empresas',
      votes: 9,
      createdAtMs: now - 3 * REAL_DAY_MS,
    },
    {
      id: 'cand_gov_1',
      name: 'Neusa Domingos',
      email: 'neusa@gov.ao',
      role: 'Governador',
      province: 'Luanda',
      partyOrSlogan: 'Infraestruturas Modernas e Transportes TAAG & Táxis',
      votes: 12,
      createdAtMs: now - 2 * REAL_DAY_MS,
    },
  ];

  return {
    accounts: {
      [ownerAcc.email]: ownerAcc,
      [demoCitizen.email]: demoCitizen,
      [newCitizen.email]: newCitizen,
    },
    sessions: {},
    announcements: [
      {
        id: 'ann_welcome',
        authorName: 'Administração Vida na Banda',
        message: 'Bem-vindos a Luanda 3D! Entra nas empresas para trabalhar, visita o Cantinho da Bita e candidata-te no BandaGov!',
        createdAtMs: now,
      },
    ],
    govCandidates,
    govVotes: {},
  };
}

class BandaStore {
  private data: BandaDbData;

  constructor() {
    this.data = this.load();
  }

  private load(): BandaDbData {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as BandaDbData;
        if (parsed && parsed.accounts) {
          // Ensure owner account always exists & retains admin rights
          if (!parsed.accounts[OWNER_EMAIL]) {
            const seed = createSeedDb();
            parsed.accounts[OWNER_EMAIL] = seed.accounts[OWNER_EMAIL];
          } else {
            parsed.accounts[OWNER_EMAIL].isAdmin = true;
          }
          return parsed;
        }
      }
    } catch {
      // Fallback to fresh seed if corrupted
    }
    const seed = createSeedDb();
    this.saveData(seed);
    return seed;
  }

  private saveData(target: BandaDbData = this.data) {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(target, null, 2), 'utf-8');
  }

  public toAuthUser(acc: StoredAccount): AuthUser {
    return {
      id: acc.id,
      email: acc.email,
      name: acc.name,
      isAdmin: acc.isAdmin || acc.email === OWNER_EMAIL,
      createdAt: acc.createdAt,
    };
  }

  public register(
    email: string,
    name: string,
    password: string,
  ): { ok: true; token: string; user: AuthUser; snapshot: GameSnapshot; needsLottery: boolean } | { ok: false; error: string } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { ok: false, error: 'Insere um email válido.' };
    }
    if (cleanName.length < 2) {
      return { ok: false, error: 'Insere o teu nome completo.' };
    }
    if (!password || password.length < 4) {
      return { ok: false, error: 'A senha deve ter pelo menos 4 caracteres.' };
    }
    if (this.data.accounts[cleanEmail]) {
      return { ok: false, error: 'Este email já está registado. Faz login com a tua senha!' };
    }

    const acc = makeAccount(cleanEmail, cleanName, password, Date.now());
    acc.snapshot.mode = 'creator';
    this.data.accounts[cleanEmail] = acc;
    const token = crypto.randomBytes(24).toString('hex');
    this.data.sessions[token] = cleanEmail;
    this.saveData();

    return {
      ok: true,
      token,
      user: this.toAuthUser(acc),
      snapshot: acc.snapshot,
      needsLottery: true,
    };
  }

  public login(
    email: string,
    password: string,
  ): { ok: true; token: string; user: AuthUser; snapshot: GameSnapshot } | { ok: false; error: string } {
    const cleanEmail = email.trim().toLowerCase();
    const acc = this.data.accounts[cleanEmail];
    if (!acc) {
      return { ok: false, error: 'Conta não encontrada. Cria uma conta nova no separador Registar.' };
    }
    const checkHash = hashPassword(password, acc.salt);
    if (checkHash !== acc.passwordHash) {
      return { ok: false, error: 'Palavra-passe incorreta.' };
    }

    const token = crypto.randomBytes(24).toString('hex');
    this.data.sessions[token] = cleanEmail;
    this.saveData();

    return {
      ok: true,
      token,
      user: this.toAuthUser(acc),
      snapshot: { ...acc.snapshot, mode: 'playing' },
    };
  }

  public getAccountByToken(token: string | undefined): StoredAccount | null {
    if (!token) return null;
    const email = this.data.sessions[token];
    if (!email) return null;
    return this.data.accounts[email] ?? null;
  }

  public saveSnapshot(token: string, snapshot: GameSnapshot): boolean {
    const acc = this.getAccountByToken(token);
    if (!acc) return false;
    // Never downgrade or erase mode to auth inside stored game save
    acc.snapshot = {
      ...snapshot,
      mode: snapshot.mode === 'auth' ? 'playing' : snapshot.mode,
    };
    this.saveData();
    return true;
  }

  public getWorldFeed(userEmail?: string) {
    const myVotes = userEmail ? this.data.govVotes[userEmail.toLowerCase()] ?? {} : {};
    return {
      announcements: this.data.announcements.slice(0, 8),
      govCandidates: [...this.data.govCandidates].sort((a, b) => b.votes - a.votes),
      myVotes,
    };
  }

  public applyGovCandidate(
    acc: StoredAccount,
    role: GovRole,
    province: string,
    partyOrSlogan: string,
  ): GovCandidate[] {
    const cleanSlogan = partyOrSlogan.trim() || 'Desenvolvimento para toda a Banda!';
    const existing = this.data.govCandidates.find(
      (c) => c.email === acc.email && c.role === role,
    );
    if (existing) {
      existing.province = province;
      existing.partyOrSlogan = cleanSlogan;
      existing.name = acc.name;
    } else {
      this.data.govCandidates.push({
        id: `cand_${crypto.randomBytes(5).toString('hex')}`,
        name: acc.name,
        email: acc.email,
        role,
        province: province || 'Luanda',
        partyOrSlogan: cleanSlogan,
        votes: 1,
        createdAtMs: Date.now(),
      });
    }
    this.saveData();
    return [...this.data.govCandidates].sort((a, b) => b.votes - a.votes);
  }

  public voteGovCandidate(
    acc: StoredAccount,
    candidateId: string,
  ): { ok: boolean; error?: string; govCandidates: GovCandidate[]; myVotes: Record<string, string> } {
    const cand = this.data.govCandidates.find((c) => c.id === candidateId);
    if (!cand) {
      return {
        ok: false,
        error: 'Candidato não encontrado.',
        govCandidates: this.data.govCandidates,
        myVotes: this.data.govVotes[acc.email] ?? {},
      };
    }
    if (!this.data.govVotes[acc.email]) {
      this.data.govVotes[acc.email] = {};
    }
    const prevId = this.data.govVotes[acc.email][cand.role];
    if (prevId === cand.id) {
      return {
        ok: true,
        govCandidates: [...this.data.govCandidates].sort((a, b) => b.votes - a.votes),
        myVotes: this.data.govVotes[acc.email],
      };
    }
    if (prevId) {
      const prevCand = this.data.govCandidates.find((c) => c.id === prevId);
      if (prevCand && prevCand.votes > 0) prevCand.votes -= 1;
    }
    cand.votes += 1;
    this.data.govVotes[acc.email][cand.role] = cand.id;
    this.saveData();
    return {
      ok: true,
      govCandidates: [...this.data.govCandidates].sort((a, b) => b.votes - a.votes),
      myVotes: this.data.govVotes[acc.email],
    };
  }

  public adminListPlayers() {
    const now = Date.now();
    return Object.values(this.data.accounts).map((acc) => ({
      id: acc.id,
      email: acc.email,
      name: acc.name,
      isAdmin: acc.isAdmin,
      createdAt: acc.createdAt,
      accountAgeDays: Number(((now - acc.createdAt) / REAL_DAY_MS).toFixed(2)),
      moneyKz: acc.snapshot.moneyKz,
      bankKz: acc.snapshot.bankKz,
      municipalityId: acc.snapshot.currentMunicipalityId,
      profession: acc.snapshot.currentCompanyJobTitle ?? acc.snapshot.profession ?? 'Desempregado',
    }));
  }

  public adminGiveMoney(
    targetEmail: string,
    amountKz: number,
  ): { ok: boolean; updatedEmails: string[]; newBalanceKz?: number; error?: string } {
    const cleanAmount = Math.round(Number(amountKz));
    if (!Number.isFinite(cleanAmount) || cleanAmount === 0) {
      return { ok: false, updatedEmails: [], error: 'Valor inválido em Kwanzas.' };
    }
    const cleanTarget = targetEmail.trim().toLowerCase();
    if (cleanTarget === 'all') {
      const updatedEmails: string[] = [];
      for (const acc of Object.values(this.data.accounts)) {
        acc.snapshot.moneyKz = Math.max(0, acc.snapshot.moneyKz + cleanAmount);
        acc.snapshot.lastEventMessage = `ADM enviou ${cleanAmount.toLocaleString('pt-PT')} Kz para a tua conta!`;
        updatedEmails.push(acc.email);
      }
      this.saveData();
      return { ok: true, updatedEmails };
    }

    const acc = this.data.accounts[cleanTarget];
    if (!acc) {
      return { ok: false, updatedEmails: [], error: `Jogador ${targetEmail} não encontrado.` };
    }
    acc.snapshot.moneyKz = Math.max(0, acc.snapshot.moneyKz + cleanAmount);
    acc.snapshot.lastEventMessage = `Painel ADM creditou +${cleanAmount.toLocaleString('pt-PT')} Kz na tua carteira!`;
    this.saveData();
    return { ok: true, updatedEmails: [acc.email], newBalanceKz: acc.snapshot.moneyKz };
  }

  public adminBroadcast(authorName: string, message: string): GlobalAnnouncement[] {
    const clean = message.trim();
    if (!clean) return this.data.announcements;
    const item: GlobalAnnouncement = {
      id: `ann_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      authorName,
      message: clean,
      createdAtMs: Date.now(),
    };
    this.data.announcements = [item, ...this.data.announcements].slice(0, 12);
    this.saveData();
    return this.data.announcements;
  }

  public adminSetAccountAgeDays(targetEmail: string, ageDays: number): boolean {
    const acc = this.data.accounts[targetEmail.trim().toLowerCase()];
    if (!acc) return false;
    const clampedDays = Math.max(0, Math.min(365, Number(ageDays)));
    acc.createdAt = Date.now() - clampedDays * REAL_DAY_MS;
    this.saveData();
    return true;
  }
}

export const bandaStore = new BandaStore();
