import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AuthModal } from './components/AuthModal';
import { BandaPhone } from './components/BandaPhone';
import { CantinaShopModal } from './components/CantinaShopModal';
import { CharacterCreator } from './components/CharacterCreator';
import { CompanyModal } from './components/CompanyModal';
import { FullMapModal } from './components/FullMapModal';
import { HudOverlay } from './components/HudOverlay';
import { LifeLotteryModal } from './components/LifeLotteryModal';
import { SchoolModal } from './components/SchoolModal';
import { TitleScreen } from './components/TitleScreen';
import { TravelCutsceneModal } from './components/TravelCutsceneModal';
import { BIRTH_CLASSES, LANDMARKS, MUSIC_TRACKS } from './game/angolaData';
import { bandaAudio } from './game/audio';
import {
  applyBirthLottery,
  applyForCompanyJob,
  bankTransfer,
  buyBathtub,
  buyMarketItem,
  buyVehicle,
  completeMunicipalityTravel,
  createInitialSnapshot,
  enterCompanyRoom,
  enterHomeRoom,
  exitRoomToStreet,
  formatKz,
  handleGatunoEncounter,
  interactWithNpc,
  openOrExpandBusiness,
  performHouseAction,
  performStudySession,
  performWorkShift,
  planMunicipalityTravel,
  rentCondominium,
  selectProfession,
  serviceActiveVehicle,
  stealFromTarget,
  upgradeProperty,
  useBathtub,
} from './game/simulation';
import {
  AuthUser,
  BathtubId,
  BirthLotteryOutcome,
  BusinessState,
  CharacterAppearance,
  CompanyId,
  CondominiumId,
  GameMode,
  GameSnapshot,
  GlobalAnnouncement,
  GovCandidate,
  GovRole,
  MunicipalityId,
  PhoneAppId,
  ProfessionId,
  PropertyTierId,
  TravelPlan,
  VehicleId,
  WeatherType,
} from './game/types';
import { ProjectedLabel, World3DEngine, WorldHudSync } from './game/World3DEngine';

const TOKEN_STORAGE_KEY = 'vida_na_banda_token_v3';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<World3DEngine | null>(null);

  const [gameState, setGameState] = useState<GameSnapshot>(() => createInitialSnapshot());
  const stateRef = useRef<GameSnapshot>(gameState);
  stateRef.current = gameState;

  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [announcements, setAnnouncements] = useState<GlobalAnnouncement[]>([]);
  const [govCandidates, setGovCandidates] = useState<GovCandidate[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});
  const [projectedLabels, setProjectedLabels] = useState<ProjectedLabel[]>([]);

  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phoneInitialApp, setPhoneInitialApp] = useState<PhoneAppId>('home');
  const [activeNpcModalId, setActiveNpcModalId] = useState<string | null>(null);
  const [activeCompanyModalId, setActiveCompanyModalId] = useState<CompanyId | null>(null);
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [fullMapOpen, setFullMapOpen] = useState(false);
  const [cantinaTab, setCantinaTab] = useState<'cantina' | 'banheiras' | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [activeTravelPlan, setActiveTravelPlan] = useState<TravelPlan | null>(null);
  const [muted, setMuted] = useState(false);

  const authTokenRef = useRef<string | null>(authToken);
  authTokenRef.current = authToken;

  // Sync body[data-state]
  useEffect(() => {
    document.body.dataset.state = gameState.mode;
  }, [gameState.mode]);

  const persistSnapshot = useCallback((snapshot: GameSnapshot, tokenOverride?: string | null) => {
    const token = tokenOverride ?? authTokenRef.current;
    if (!token || snapshot.mode === 'auth') return;
    fetch('/api/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ snapshot }),
    }).catch(() => {});
  }, []);

  const applyState = useCallback(
    (updater: (prev: GameSnapshot) => GameSnapshot, saveNow = true) => {
      setGameState((prev) => {
        const next = updater(prev);
        stateRef.current = next;
        if (saveNow) persistSnapshot(next);
        return next;
      });
    },
    [persistSnapshot],
  );

  // Restore saved session on boot or handle ?autostart=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart') === '1';

    const boot = async () => {
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (savedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            setAuthToken(savedToken);
            setAuthUser(data.user);
            if (data.announcements) setAnnouncements(data.announcements);
            if (data.govCandidates) setGovCandidates(data.govCandidates);
            if (data.myVotes) setMyVotes(data.myVotes);
            setGameState({ ...data.snapshot, mode: 'playing' });
            return;
          }
        } catch {
          // fallback below
        }
      }

      if (autostart) {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'kelson@banda.ao', password: 'luanda123' }),
          });
          if (res.ok) {
            const data = await res.json();
            localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
            setAuthToken(data.token);
            setAuthUser(data.user);
            if (data.announcements) setAnnouncements(data.announcements);
            if (data.govCandidates) setGovCandidates(data.govCandidates);
            if (data.myVotes) setMyVotes(data.myVotes);
            setGameState({ ...data.snapshot, mode: 'playing' });
          }
        } catch {
          // ignore
        }
      }
    };

    boot();
  }, []);

  // Poll world feed (announcements, BandaGov, admin money grants) + periodic autosave
  useEffect(() => {
    if (!authToken) return;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch('/api/world/feed', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.announcements) setAnnouncements(data.announcements);
          if (data.govCandidates) setGovCandidates(data.govCandidates);
          if (data.myVotes) setMyVotes(data.myVotes);
          if (
            typeof data.latestMoneyKz === 'number' &&
            data.latestMoneyKz > stateRef.current.moneyKz + 100
          ) {
            // Sync admin credit into client state
            setGameState((prev) => ({ ...prev, moneyKz: data.latestMoneyKz }));
          }
        }
      } catch {
        // ignore
      }
      if (stateRef.current.mode === 'playing') {
        persistSnapshot(stateRef.current);
      }
    }, 6000);
    return () => window.clearInterval(timer);
  }, [authToken, persistSnapshot]);

  const handleWorldHudSync = useCallback((sync: WorldHudSync) => {
    setProjectedLabels(sync.projectedLabels);
    setGameState((prev) => {
      const updatedVehicles = prev.ownedVehicles.map((v, idx) =>
        idx === prev.activeVehicleIndex ? { ...v, fuel: sync.vehicleFuel } : v,
      );
      const next: GameSnapshot = {
        ...prev,
        playerX: sync.playerX,
        playerZ: sync.playerZ,
        playerDistrict: sync.playerDistrict,
        nearbyLandmarkId: sync.nearbyLandmarkId,
        nearbyNpcId: sync.nearbyNpcId,
        nearbyVehiclePrompt: sync.nearbyVehiclePrompt,
        vehicleSpeedKmh: sync.vehicleSpeedKmh,
        ownedVehicles: updatedVehicles,
        timeMinutes: sync.timeMinutes,
        day: sync.day,
        playerAction: sync.playerAction,
      };
      stateRef.current = next;
      return next;
    });
  }, []);

  const activateLandmarkById = useCallback(
    (landmarkId: string) => {
      const lm = LANDMARKS.find((l) => l.id === landmarkId);
      if (!lm) return;

      if (lm.companyId) {
        applyState((prev) => enterCompanyRoom(prev, lm.companyId!));
      } else if (lm.category === 'Casa') {
        applyState((prev) => enterHomeRoom(prev));
      } else if (lm.category === 'Cantina') {
        setCantinaTab('cantina');
      } else if (lm.category === 'Condomínio') {
        setPhoneInitialApp('condo');
        setPhoneOpen(true);
      } else if (lm.category === 'Transporte') {
        setFullMapOpen(true);
      } else if (lm.id.startsWith('escola')) {
        setSchoolOpen(true);
      } else if (lm.id.startsWith('hospital')) {
        applyState((prev) => ({
          ...prev,
          needs: { ...prev.needs, health: 100, mood: Math.min(100, prev.needs.mood + 10) },
          lastEventMessage: 'Consulta feita na Clínica! Saúde restaurada a 100%.',
        }));
      } else if (lm.id.startsWith('kilombo')) {
        const track = MUSIC_TRACKS[0];
        bandaAudio.startRadio(track.genre);
        engineRef.current?.triggerActionAnimation('dance', 4);
        applyState((prev) => ({
          ...prev,
          radioPlaying: true,
          currentTrackId: track.id,
          needs: { ...prev.needs, mood: Math.min(100, prev.needs.mood + 20) },
          lastEventMessage: 'A dançar Kuduro na Discoteca Kilombo!',
        }));
      } else {
        applyState((prev) => ({
          ...prev,
          needs: { ...prev.needs, mood: Math.min(100, prev.needs.mood + 14) },
          lastEventMessage: `A aproveitar a brisa em ${lm.name}! (+14 Humor)`,
        }));
      }
    },
    [applyState],
  );

  const handleRoomInteract = useCallback(
    (action: 'work' | 'jobs' | 'bathtub' | 'sleep' | 'cook' | 'tv' | 'exit') => {
      const s = stateRef.current;
      if (action === 'exit') {
        applyState((prev) => exitRoomToStreet(prev));
        return;
      }
      if (action === 'jobs') {
        if (s.activeCompanyRoomId) {
          setActiveCompanyModalId(s.activeCompanyRoomId);
        } else {
          setPhoneInitialApp('jobs');
          setPhoneOpen(true);
        }
        return;
      }
      if (action === 'work') {
        engineRef.current?.triggerActionAnimation('work', 1.8);
        applyState((prev) => {
          const next = performWorkShift(prev, prev.activeCompanyRoomId ?? undefined);
          if (next.shiftsCompleted > prev.shiftsCompleted) bandaAudio.playCashChime();
          return next;
        });
        return;
      }
      if (action === 'bathtub') {
        if (!s.placedBathtubId) {
          setCantinaTab('banheiras');
          return;
        }
        engineRef.current?.triggerActionAnimation('bathe', 2.0);
        bandaAudio.playCashChime();
        applyState((prev) => useBathtub(prev));
        return;
      }
      if (action === 'sleep') {
        applyState((prev) => performHouseAction(prev, 'sleep'));
        return;
      }
      if (action === 'cook') {
        applyState((prev) => performHouseAction(prev, 'cook_funge'));
        return;
      }
      if (action === 'tv') {
        applyState((prev) => performHouseAction(prev, 'tv'));
      }
    },
    [applyState],
  );

  const handleGatunoCatch = useCallback(
    (gatunoName: string) => {
      applyState((prev) => handleGatunoEncounter(prev, gatunoName, Date.now()));
    },
    [applyState],
  );

  // Mount Three.js World3DEngine once
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;
    const engine = new World3DEngine(container, stateRef, {
      onHudSync: handleWorldHudSync,
      onLandmarkActivate: activateLandmarkById,
      onRoomInteract: handleRoomInteract,
      onGatunoCatch: handleGatunoCatch,
    });
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [activateLandmarkById, handleGatunoCatch, handleRoomInteract, handleWorldHudSync]);

  // Modal pause flag for WebGL loop
  useEffect(() => {
    const anyModal =
      phoneOpen ||
      schoolOpen ||
      fullMapOpen ||
      adminOpen ||
      Boolean(cantinaTab) ||
      Boolean(activeCompanyModalId) ||
      Boolean(activeNpcModalId) ||
      Boolean(activeTravelPlan);
    engineRef.current?.setModalOpen(anyModal);
  }, [
    activeCompanyModalId,
    activeNpcModalId,
    activeTravelPlan,
    adminOpen,
    cantinaTab,
    fullMapOpen,
    phoneOpen,
    schoolOpen,
  ]);

  const setMode = useCallback(
    (mode: GameMode) => {
      applyState((prev) => ({ ...prev, mode }));
    },
    [applyState],
  );

  const handleConfirmCreator = useCallback(
    (appearance: CharacterAppearance) => {
      engineRef.current?.rebuildPlayer(appearance);
      applyState((prev) => ({
        ...prev,
        appearance,
        mode: 'lottery',
      }));
    },
    [applyState],
  );

  const handleConfirmLottery = useCallback(
    (outcome: BirthLotteryOutcome) => {
      bandaAudio.playCashChime();
      applyState((prev) => ({
        ...applyBirthLottery(prev, outcome),
        mode: 'playing',
      }));
    },
    [applyState],
  );

  const handleToggleVehicle = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const entered = engine.toggleVehicleEntry();
    applyState((prev) => ({
      ...prev,
      inVehicle: entered,
      lastEventMessage: entered
        ? 'Entraste no veículo! Usa WASD para conduzir.'
        : 'Saíste do veículo.',
    }));
  }, [applyState]);

  const handleInteractLandmark = useCallback(() => {
    const s = stateRef.current;
    if (s.nearbyNpcId) {
      setActiveNpcModalId(s.nearbyNpcId);
      applyState((prev) => interactWithNpc(prev, s.nearbyNpcId!, 'talk'));
      return;
    }
    if (s.nearbyLandmarkId) {
      activateLandmarkById(s.nearbyLandmarkId);
    }
  }, [activateLandmarkById, applyState]);

  const handleStartTravel = useCallback(
    (targetMuniId: MunicipalityId) => {
      const plan = planMunicipalityTravel(stateRef.current, targetMuniId);
      if (!plan) return;
      if (stateRef.current.moneyKz < plan.costKz) {
        applyState((prev) => ({
          ...prev,
          lastEventMessage: `Precisas de ${formatKz(plan.costKz)} para esta viagem.`,
        }));
        return;
      }
      setActiveTravelPlan(plan);
    },
    [applyState],
  );

  const handleCompleteTravel = useCallback(() => {
    if (!activeTravelPlan) return;
    const plan = activeTravelPlan;
    setActiveTravelPlan(null);
    bandaAudio.playCashChime();
    applyState((prev) => completeMunicipalityTravel(prev, plan));
  }, [activeTravelPlan, applyState]);

  const handleApplyGov = useCallback(
    async (role: GovRole, province: string, partyOrSlogan: string) => {
      if (!authToken) return;
      const res = await fetch('/api/gov/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ role, province, partyOrSlogan }),
      });
      const data = await res.json();
      if (res.ok && data.govCandidates) {
        setGovCandidates(data.govCandidates);
        applyState((prev) => ({
          ...prev,
          lastEventMessage: `Candidatura oficial submetida para ${role} (${province}) no BandaGov!`,
        }));
      }
    },
    [applyState, authToken],
  );

  const handleVoteGov = useCallback(
    async (candidateId: string) => {
      if (!authToken) return;
      const res = await fetch('/api/gov/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ candidateId }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.govCandidates) setGovCandidates(data.govCandidates);
        if (data.myVotes) setMyVotes(data.myVotes);
        bandaAudio.playCashChime();
        applyState((prev) => ({
          ...prev,
          lastEventMessage: 'Voto registado com sucesso no BandaGov!',
        }));
      }
    },
    [applyState, authToken],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      const mode = stateRef.current.mode;

      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (adminOpen) return setAdminOpen(false);
        if (cantinaTab) return setCantinaTab(null);
        if (fullMapOpen) return setFullMapOpen(false);
        if (schoolOpen) return setSchoolOpen(false);
        if (activeCompanyModalId) return setActiveCompanyModalId(null);
        if (phoneOpen) return setPhoneOpen(false);
        if (activeNpcModalId) return setActiveNpcModalId(null);
        if (mode === 'playing' && stateRef.current.sceneView !== 'outdoor') {
          applyState((prev) => exitRoomToStreet(prev));
          return;
        }
        if (mode === 'playing') setMode('paused');
        else if (mode === 'paused') setMode('playing');
        return;
      }

      if (mode !== 'playing') return;
      if (e.code === 'KeyM') {
        setPhoneInitialApp('home');
        setPhoneOpen((o) => !o);
      } else if (e.code === 'KeyF') {
        handleToggleVehicle();
      } else if (e.code === 'KeyE') {
        if (stateRef.current.sceneView === 'company_room') {
          handleRoomInteract('work');
        } else if (stateRef.current.sceneView === 'home_room') {
          handleRoomInteract('bathtub');
        } else {
          handleInteractLandmark();
        }
      } else if (e.code === 'KeyT') {
        engineRef.current?.triggerActionAnimation('dance', 3.5);
        applyState((prev) => ({
          ...prev,
          needs: { ...prev.needs, mood: Math.min(100, prev.needs.mood + 8) },
          lastEventMessage: 'A mandar passos de Kuduro & Semba na banda!',
        }));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeCompanyModalId,
    activeNpcModalId,
    adminOpen,
    applyState,
    cantinaTab,
    fullMapOpen,
    handleInteractLandmark,
    handleRoomInteract,
    handleToggleVehicle,
    phoneOpen,
    schoolOpen,
    setMode,
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#067cb8]">
      {/* Isolated 3D WebGL Viewport */}
      <div
        ref={canvasMountRef}
        data-testid="luanda-canvas-container"
        className="absolute inset-0 w-full h-full"
      />

      {/* Login / Registration before entering */}
      {gameState.mode === 'auth' && (
        <AuthModal
          onSuccess={(payload) => {
            localStorage.setItem(TOKEN_STORAGE_KEY, payload.token);
            setAuthToken(payload.token);
            setAuthUser(payload.user);
            if (payload.announcements) setAnnouncements(payload.announcements);
            if (payload.govCandidates) setGovCandidates(payload.govCandidates);
            if (payload.myVotes) setMyVotes(payload.myVotes);
            engineRef.current?.rebuildPlayer(payload.snapshot.appearance);
            setGameState({
              ...payload.snapshot,
              mode: payload.needsLottery ? 'creator' : 'playing',
            });
          }}
        />
      )}

      {gameState.mode === 'title' && (
        <TitleScreen
          onOpenCreator={() => setMode('creator')}
          onQuickStart={() => setMode('lottery')}
        />
      )}

      {gameState.mode === 'creator' && (
        <CharacterCreator
          initialAppearance={gameState.appearance}
          onConfirm={handleConfirmCreator}
          onBack={() => setMode(authUser ? 'playing' : 'auth')}
        />
      )}

      {gameState.mode === 'lottery' && (
        <LifeLotteryModal
          appearance={gameState.appearance}
          onConfirm={handleConfirmLottery}
          onBack={() => setMode('creator')}
        />
      )}

      {gameState.mode === 'playing' && (
        <HudOverlay
          state={gameState}
          isAdmin={Boolean(authUser?.isAdmin)}
          muted={muted}
          activeNpcModalId={activeNpcModalId}
          projectedLabels={projectedLabels}
          latestAnnouncement={announcements[0] ?? null}
          onToggleMute={() => {
            const next = !muted;
            setMuted(next);
            bandaAudio.setMuted(next);
          }}
          onOpenPhone={(app = 'home') => {
            setPhoneInitialApp(app);
            setPhoneOpen(true);
            engineRef.current?.triggerActionAnimation('phone', 1.4);
          }}
          onOpenFullMap={() => setFullMapOpen(true)}
          onOpenCantina={(tab = 'cantina') => setCantinaTab(tab)}
          onOpenSchool={() => setSchoolOpen(true)}
          onOpenAdmin={() => setAdminOpen(true)}
          onInteractLandmark={handleInteractLandmark}
          onClickProjectedLabel={(lbl) => {
            if (lbl.isRoomItem) {
              handleRoomInteract(
                lbl.category as 'work' | 'jobs' | 'bathtub' | 'sleep' | 'cook' | 'tv' | 'exit',
              );
              return;
            }
            const lm = LANDMARKS.find((l) => l.id === lbl.id);
            if (!lm) return;
            const d = Math.hypot(lm.x - gameState.playerX, lm.z - gameState.playerZ);
            if (d <= lm.radius + 0.5) {
              activateLandmarkById(lm.id);
            } else {
              engineRef.current?.setWalkDestination(
                lm.x,
                Math.min(21, lm.z + lm.depth / 2 + 1.4),
                lm.id,
              );
            }
          }}
          onRoomInteract={handleRoomInteract}
          onToggleVehicle={handleToggleVehicle}
          onToggleLights={() => {
            const lightsOn = engineRef.current?.toggleVehicleLights() ?? false;
            applyState((prev) => ({
              ...prev,
              ownedVehicles: prev.ownedVehicles.map((v, i) =>
                i === prev.activeVehicleIndex ? { ...v, lightsOn } : v,
              ),
            }));
          }}
          onToggleDoors={() => {
            const doorsOpen = engineRef.current?.toggleVehicleDoors() ?? false;
            applyState((prev) => ({
              ...prev,
              ownedVehicles: prev.ownedVehicles.map((v, i) =>
                i === prev.activeVehicleIndex ? { ...v, doorsOpen } : v,
              ),
            }));
          }}
          onHorn={() => bandaAudio.playHorn()}
          onToggleRadio={() => {
            applyState((prev) => {
              const nextPlay = !prev.radioPlaying;
              const track = MUSIC_TRACKS.find((t) => t.id === prev.currentTrackId) ?? MUSIC_TRACKS[0];
              if (nextPlay) bandaAudio.startRadio(track.genre);
              else bandaAudio.stopRadio();
              return { ...prev, radioPlaying: nextPlay };
            });
          }}
          onDance={() => {
            engineRef.current?.triggerActionAnimation('dance', 3.5);
            applyState((prev) => ({
              ...prev,
              needs: { ...prev.needs, mood: Math.min(100, prev.needs.mood + 8) },
              lastEventMessage: 'A dançar Kuduro na Banda!',
            }));
          }}
          onPause={() => setMode('paused')}
          onOpenNpcModal={setActiveNpcModalId}
          onNpcAction={(npcId, action) => {
            applyState((prev) => interactWithNpc(prev, npcId, action));
            engineRef.current?.triggerActionAnimation('talk', 2.0);
          }}
          onVirtualInput={(dx, dy, sprint) => {
            engineRef.current?.setVirtualInput(dx, dy, sprint);
          }}
        />
      )}

      {/* BandaPhone */}
      {phoneOpen && gameState.mode === 'playing' && (
        <BandaPhone
          state={gameState}
          accountCreatedAt={authUser?.createdAt ?? Date.now()}
          govCandidates={govCandidates}
          myVotes={myVotes}
          initialApp={phoneInitialApp}
          onClose={() => setPhoneOpen(false)}
          onSelectProfession={(id: ProfessionId) =>
            applyState((prev) => {
              const next = selectProfession(prev, id);
              if (next.lastJobApplication?.accepted) bandaAudio.playCashChime();
              return next;
            })
          }
          onApplyCompanyJob={(companyId, jobId) => {
            applyState((prev) => {
              const next = applyForCompanyJob(prev, companyId, jobId);
              if (next.lastJobApplication?.accepted) bandaAudio.playCashChime();
              return next;
            });
          }}
          onWorkShift={() => {
            applyState((prev) => {
              const next = performWorkShift(prev);
              if (next.shiftsCompleted > prev.shiftsCompleted) bandaAudio.playCashChime();
              return next;
            });
          }}
          onBuyItem={(id: string) => {
            applyState((prev) => buyMarketItem(prev, id, true));
            bandaAudio.playCashChime();
          }}
          onBuyBathtub={(id: BathtubId) => {
            applyState((prev) => buyBathtub(prev, id));
            bandaAudio.playCashChime();
          }}
          onRentCondo={(condoId: CondominiumId, realDays: number) => {
            applyState((prev) => rentCondominium(prev, condoId, realDays, Date.now()));
            bandaAudio.playCashChime();
          }}
          onStealTarget={(targetLabel: string) => {
            applyState((prev) =>
              stealFromTarget(prev, authUser?.createdAt ?? Date.now(), Date.now(), targetLabel),
            );
          }}
          onApplyGov={handleApplyGov}
          onVoteGov={handleVoteGov}
          onBuyVehicle={(id: VehicleId, color?: string) => {
            applyState((prev) => buyVehicle(prev, id, color));
            bandaAudio.playCashChime();
          }}
          onSelectVehicle={(idx: number) =>
            applyState((prev) => ({
              ...prev,
              activeVehicleIndex: idx,
              lastEventMessage: 'Veículo selecionado na garagem!',
            }))
          }
          onServiceVehicle={(mode, color) => {
            applyState((prev) => serviceActiveVehicle(prev, mode, color));
            bandaAudio.playCashChime();
          }}
          onUpgradeProperty={(id: PropertyTierId) => {
            applyState((prev) => upgradeProperty(prev, id));
            bandaAudio.playCashChime();
          }}
          onBankTransfer={(dir, amount) => {
            applyState((prev) => bankTransfer(prev, dir, amount));
            bandaAudio.playCashChime();
          }}
          onBusinessAction={(action, type?: BusinessState['type'], name?: string) => {
            applyState((prev) => openOrExpandBusiness(prev, action, type, name));
            bandaAudio.playCashChime();
          }}
          onNpcAction={(npcId, action) => {
            applyState((prev) => interactWithNpc(prev, npcId, action));
          }}
          onSendChat={(npcId, text) => {
            applyState((prev) => {
              const existing = prev.chatThreads[npcId] ?? [];
              const npc = prev.npcs.find((n) => n.id === npcId);
              const reply = npc?.greetings[0] ?? 'Estamos juntos na banda!';
              return {
                ...prev,
                chatThreads: {
                  ...prev.chatThreads,
                  [npcId]: [
                    ...existing,
                    {
                      id: `p_${Date.now()}`,
                      sender: prev.appearance.firstName,
                      text,
                      timeLabel: 'Agora',
                      fromPlayer: true,
                    },
                    {
                      id: `n_${Date.now() + 1}`,
                      sender: npc?.name ?? 'Amigo',
                      text: reply,
                      timeLabel: 'Agora',
                      fromPlayer: false,
                    },
                  ],
                },
              };
            });
          }}
          onCreatePost={(caption) => {
            applyState((prev) => ({
              ...prev,
              reputation: prev.reputation + 2,
              socialPosts: [
                {
                  id: `post_${Date.now()}`,
                  author: `${prev.appearance.firstName} ${prev.appearance.lastName}`,
                  handle: `@${prev.appearance.firstName.toLowerCase()}.ao`,
                  location: prev.playerDistrict,
                  caption,
                  likes: 1,
                  likedByPlayer: true,
                  timeLabel: 'Agora mesmo',
                },
                ...prev.socialPosts,
              ],
              lastEventMessage: 'Publicaste no BandaSocial (+2 Reputação)!',
            }));
          }}
          onToggleLikePost={(postId) => {
            applyState((prev) => ({
              ...prev,
              socialPosts: prev.socialPosts.map((p) =>
                p.id === postId
                  ? {
                      ...p,
                      likedByPlayer: !p.likedByPlayer,
                      likes: p.likedByPlayer ? p.likes - 1 : p.likes + 1,
                    }
                  : p,
              ),
            }));
          }}
          onSelectTrack={(trackId, play) => {
            const track = MUSIC_TRACKS.find((t) => t.id === trackId) ?? MUSIC_TRACKS[0];
            if (play) bandaAudio.startRadio(track.genre);
            else bandaAudio.stopRadio();
            applyState((prev) => ({
              ...prev,
              currentTrackId: track.id,
              radioPlaying: play,
            }));
          }}
          onFastTravel={(x, z, label) => {
            engineRef.current?.setWalkDestination(x, z);
            applyState((prev) => ({
              ...prev,
              lastEventMessage: `A caminhar até ${label}...`,
            }));
          }}
          onOpenFullMap={() => setFullMapOpen(true)}
          onSetWeather={(weather: WeatherType) => {
            applyState((prev) => ({ ...prev, weather }));
          }}
          onAdvanceTime={(minutes) => {
            applyState((prev) => ({
              ...prev,
              timeMinutes: (prev.timeMinutes + minutes) % 1440,
            }));
          }}
          onOpenSchool={() => setSchoolOpen(true)}
        />
      )}

      {/* Company HR & Jobs Modal (inside 3D Company Room) */}
      {activeCompanyModalId && gameState.mode === 'playing' && (
        <CompanyModal
          companyId={activeCompanyModalId}
          state={gameState}
          onClose={() => setActiveCompanyModalId(null)}
          onApplyJob={(companyId, jobId) => {
            applyState((prev) => {
              const next = applyForCompanyJob(prev, companyId, jobId);
              if (next.lastJobApplication?.accepted) bandaAudio.playCashChime();
              return next;
            });
          }}
          onWorkShift={() => {
            applyState((prev) => {
              const next = performWorkShift(prev, activeCompanyModalId);
              if (next.shiftsCompleted > prev.shiftsCompleted) bandaAudio.playCashChime();
              return next;
            });
          }}
          onServiceVehicle={(mode) => {
            applyState((prev) => serviceActiveVehicle(prev, mode));
            bandaAudio.playCashChime();
          }}
          onOpenPhoneApp={(app) => {
            setPhoneInitialApp(app);
            setPhoneOpen(true);
          }}
          onOpenSchool={() => setSchoolOpen(true)}
        />
      )}

      {/* Cantina & Bathtub Shop Modal */}
      {cantinaTab && gameState.mode === 'playing' && (
        <CantinaShopModal
          state={gameState}
          initialTab={cantinaTab}
          onClose={() => setCantinaTab(null)}
          onBuyMarketItem={(itemId) => {
            applyState((prev) => buyMarketItem(prev, itemId, true));
            bandaAudio.playCashChime();
          }}
          onBuyBathtub={(bathtubId) => {
            applyState((prev) => buyBathtub(prev, bathtubId));
            bandaAudio.playCashChime();
          }}
        />
      )}

      {/* Full Angola Map & Municipality/Province Travel Modal */}
      {fullMapOpen && gameState.mode === 'playing' && (
        <FullMapModal
          state={gameState}
          onClose={() => setFullMapOpen(false)}
          onWalkToLandmark={(x, z, landmarkId, label) => {
            engineRef.current?.setWalkDestination(x, z, landmarkId);
            applyState((prev) => ({
              ...prev,
              lastEventMessage: `A caminhar até ${label}...`,
            }));
          }}
          onTravelToMunicipality={handleStartTravel}
        />
      )}

      {/* Travel Cutscene Modal (Animated TAAG Plane or Taxi with timer!) */}
      {activeTravelPlan && (
        <TravelCutsceneModal plan={activeTravelPlan} onComplete={handleCompleteTravel} />
      )}

      {/* School & University Modal */}
      {schoolOpen && gameState.mode === 'playing' && (
        <SchoolModal
          state={gameState}
          onClose={() => setSchoolOpen(false)}
          onStudy={(studyMode) => {
            applyState((prev) => performStudySession(prev, studyMode));
            bandaAudio.playCashChime();
          }}
          onOpenJobs={() => {
            setPhoneInitialApp('jobs');
            setPhoneOpen(true);
          }}
        />
      )}

      {/* Owner Admin Panel Modal */}
      {adminOpen && authUser?.isAdmin && authToken && (
        <AdminPanelModal
          token={authToken}
          ownerEmail={authUser.email}
          onClose={() => setAdminOpen(false)}
          onMoneyUpdated={(targetEmail, amountKz, newBalanceKz) => {
            if (targetEmail === 'all' || targetEmail === authUser.email) {
              applyState(
                (prev) => ({
                  ...prev,
                  moneyKz:
                    typeof newBalanceKz === 'number'
                      ? newBalanceKz
                      : prev.moneyKz + amountKz,
                  lastEventMessage: `Painel ADM creditou +${formatKz(amountKz)}!`,
                }),
                true,
              );
            }
          }}
          onAnnouncementsUpdated={setAnnouncements}
        />
      )}

      {/* Pause Modal */}
      {gameState.mode === 'paused' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div
            role="dialog"
            aria-label="Jogo em Pausa"
            className="w-full max-w-sm rounded-2xl bg-[#16110d] border border-[#f59e0b]/40 p-6 space-y-5 text-center"
          >
            <div>
              <h2 className="text-2xl font-bold text-[#fbbf24]">Pausa</h2>
              <p className="text-xs text-[#cbd5e1] mt-1">
                {authUser?.name ?? gameState.appearance.firstName} · Dia {gameState.day} ·{' '}
                {BIRTH_CLASSES.find((c) => c.id === gameState.birthClass)?.label ?? 'Normal'}
              </p>
              <p className="text-[11px] text-[#94a3b8] mt-1">
                Conta: {authUser?.email ?? 'Local'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-left">
              <div className="p-3 rounded-xl bg-[#1f1813] border border-white/10">
                <div className="text-[11px] text-[#94a3b8]">Dinheiro</div>
                <div className="text-sm font-bold font-mono-nums text-[#4ade80]">
                  {formatKz(gameState.moneyKz)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#1f1813] border border-white/10">
                <div className="text-[11px] text-[#94a3b8]">Reputação</div>
                <div className="text-sm font-bold font-mono-nums text-[#fbbf24]">
                  {gameState.reputation} pts
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setMode('playing')}
                className="w-full py-2.5 rounded-lg bg-[#f59e0b] hover:bg-[#fbbf24] text-[#120e0b] font-bold text-sm cursor-pointer"
              >
                Continuar na Banda
              </button>
              <button
                type="button"
                onClick={() => setMode('creator')}
                className="w-full py-2.5 rounded-lg bg-[#221a14] hover:bg-[#2f251e] border border-white/15 text-[#faf6ef] font-semibold text-sm cursor-pointer"
              >
                Personalizar Personagem
              </button>
              <button
                type="button"
                onClick={() => {
                  bandaAudio.stopRadio();
                  persistSnapshot(gameState);
                  localStorage.removeItem(TOKEN_STORAGE_KEY);
                  setAuthToken(null);
                  setAuthUser(null);
                  setMode('auth');
                }}
                className="w-full py-2.5 rounded-lg bg-[#1c1612] hover:bg-[#2a211b] text-[#cbd5e1] font-semibold text-sm cursor-pointer"
              >
                Terminar Sessão (Guardar & Sair)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
