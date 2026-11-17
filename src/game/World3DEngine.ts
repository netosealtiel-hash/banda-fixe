import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  ANGOLAN_COMPANIES,
  BATHTUBS,
  INITIAL_NPCS,
  LANDMARKS,
  VEHICLES,
} from './angolaData';
import {
  buildBathtub3DGroup,
  buildBillboardGroup,
  buildCharacterGroup,
  buildCityLandmarkGroup,
  buildCoffeeTableGroup,
  buildDetailedBedGroup,
  buildDetailedKitchenGroup,
  buildDetailedSofaGroup,
  buildDetailedTvAndTableGroup,
  buildOfficeChairGroup,
  buildPalmTreeGroup,
  buildPaneledDoorGroup,
  buildPottedPlantGroup,
  buildStreetLightGroup,
  buildVehicleGroup,
  getCompanyBannerTexture,
  getSamakakaRugTexture,
  getTileFloorTexture,
  getWallArtTexture,
  getWoodPlankTexture,
} from './models3d';
import {
  clampWorldPosition,
  findNearestLandmark,
  getDistrictAt,
  getMunicipalityDef,
} from './simulation';
import {
  BathtubId,
  CharacterAction,
  CharacterAppearance,
  CompanyId,
  GameSnapshot,
  MunicipalityId,
  SceneViewMode,
} from './types';

export interface ProjectedLabel {
  id: string;
  label: string;
  accentColor: string;
  screenX: number;
  screenY: number;
  category: string;
  isRoomItem?: boolean;
}

export interface WorldHudSync {
  playerX: number;
  playerZ: number;
  playerDistrict: string;
  nearbyLandmarkId: string | null;
  nearbyNpcId: string | null;
  nearbyVehiclePrompt: boolean;
  vehicleSpeedKmh: number;
  vehicleFuel: number;
  timeMinutes: number;
  day: number;
  playerAction: CharacterAction;
  projectedLabels: ProjectedLabel[];
}

export interface EngineCallbacks {
  onHudSync: (sync: WorldHudSync) => void;
  onLandmarkActivate: (landmarkId: string) => void;
  onRoomInteract: (action: 'work' | 'jobs' | 'bathtub' | 'sleep' | 'cook' | 'tv' | 'exit') => void;
  onGatunoCatch: (gatunoName: string) => void;
}

interface ActiveNpcActor {
  id: string;
  name: string;
  isGatuno: boolean;
  mesh: THREE.Group;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  pauseTimer: number;
  speed: number;
}

interface TrafficCarActor {
  mesh: THREE.Group;
  axis: 'x' | 'z';
  laneCoord: number;
  pos: number;
  dir: 1 | -1;
  speed: number;
}

const SIDEWALK_WAYPOINTS: [number, number][] = [
  [-5.2, -5.2],
  [5.2, -5.2],
  [5.2, 5.2],
  [-5.2, 5.2],
  [-11.2, -11.2],
  [11.2, -11.2],
  [11.2, 11.2],
  [-11.2, 11.2],
  [-5.2, 11.5],
  [5.2, 11.5],
  [-11.2, 5.2],
  [11.2, -5.2],
];

export class World3DEngine {
  private container: HTMLElement;
  private stateRef: MutableRefObject<GameSnapshot>;
  private callbacks: EngineCallbacks;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private envRT: THREE.WebGLRenderTarget | null = null;
  private isSoftwareGl = false;

  private sunLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  private outdoorGroup = new THREE.Group();
  private roomGroup = new THREE.Group();
  private waterMesh: THREE.Mesh | null = null;
  private groundClickPlane: THREE.Mesh;
  private walkMarker: THREE.Mesh;

  private playerMesh: THREE.Group;
  private playerVehicleMesh: THREE.Group | null = null;

  private npcActors: ActiveNpcActor[] = [];
  private trafficCars: TrafficCarActor[] = [];
  private roomLabelTargets: { id: string; label: string; accentColor: string; pos: THREE.Vector3; action: string }[] = [];

  private keys = new Set<string>();
  private virtualInput = { dx: 0, dy: 0, sprint: false };
  private walkTarget: {
    x: number;
    z: number;
    pendingLandmarkId?: string;
    pendingRoomAction?: 'work' | 'jobs' | 'bathtub' | 'sleep' | 'cook' | 'tv' | 'exit';
  } | null = null;

  private modalOpen = false;
  private disposed = false;
  private rafId: number | null = null;
  private timeoutId: number | null = null;
  private lastFrameTime = performance.now();
  private hudAccumulator = 0;
  private actionTimer = 0;
  private forcedAction: CharacterAction | null = null;
  private gatunoCooldown = 0;

  private builtMunicipalityId: MunicipalityId | null = null;
  private builtSceneView: SceneViewMode | null = null;
  private builtCompanyId: CompanyId | null = null;
  private builtBathtubId: BathtubId | null = null;
  private builtVehicleSig = '';

  private raycaster = new THREE.Raycaster();
  private pointerDownPos: { x: number; y: number } | null = null;

  private simTimeMinutes: number;
  private simDay: number;
  private simVehicleSpeed = 0;
  private simVehicleFuel = 90;

  constructor(
    container: HTMLElement,
    stateRef: MutableRefObject<GameSnapshot>,
    callbacks: EngineCallbacks,
  ) {
    this.container = container;
    this.stateRef = stateRef;
    this.callbacks = callbacks;

    this.simTimeMinutes = stateRef.current.timeMinutes;
    this.simDay = stateRef.current.day;

    // Detect Software WebGL (SwiftShader, llvmpipe, softpipe, Basic Render)
    try {
      const probe = document.createElement('canvas');
      const glProbe = probe.getContext('webgl2') || probe.getContext('webgl');
      if (!glProbe) {
        this.isSoftwareGl = true;
      } else {
        const ext = glProbe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : glProbe.RENDERER;
        const rendererStr = String(glProbe.getParameter(param) || '');
        glProbe.getExtension('WEBGL_lose_context')?.loseContext();
        this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
      }
    } catch {
      this.isSoftwareGl = false;
    }

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(container.clientWidth || 1280, container.clientHeight || 720);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#067cb8');

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRT.texture;
    pmrem.dispose();

    const w = container.clientWidth || 1280;
    const h = container.clientHeight || 720;
    this.camera = new THREE.PerspectiveCamera(30, w / h, 0.5, 260);
    this.camera.position.set(24, 24, 24);
    this.camera.lookAt(0, 0, 0);

    // Crisp sunny Luanda diorama lighting
    this.hemiLight = new THREE.HemisphereLight('#fff7ed', '#92400e', 0.85);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight('#fffbeb', 1.75);
    this.sunLight.position.set(24, 34, 16);
    if (!this.isSoftwareGl) {
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.set(1024, 1024);
      this.sunLight.shadow.camera.left = -28;
      this.sunLight.shadow.camera.right = 28;
      this.sunLight.shadow.camera.top = 28;
      this.sunLight.shadow.camera.bottom = -28;
    }
    this.scene.add(this.sunLight);

    this.scene.add(this.outdoorGroup);
    this.scene.add(this.roomGroup);

    // Invisible click plane for tap-to-move raycasting
    this.groundClickPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    this.groundClickPlane.rotation.x = -Math.PI / 2;
    this.groundClickPlane.position.y = 0.02;
    this.scene.add(this.groundClickPlane);

    // Golden walk destination marker
    this.walkMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.72, 24),
      new THREE.MeshBasicMaterial({
        color: '#facc15',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      }),
    );
    this.walkMarker.rotation.x = -Math.PI / 2;
    this.walkMarker.position.y = 0.08;
    this.walkMarker.visible = false;
    this.scene.add(this.walkMarker);

    // Player mesh
    this.playerMesh = buildCharacterGroup(stateRef.current.appearance);
    this.playerMesh.position.set(stateRef.current.playerX, 0, stateRef.current.playerZ);
    this.scene.add(this.playerMesh);

    this.syncWorldSceneFromState(stateRef.current);
    this.syncVehicleFromState(stateRef.current);

    this.bindEvents();
    this.scheduleNextTick();
  }

  private bindEvents() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.addEventListener('pointerup', this.handlePointerUp);
  }

  private handleResize = () => {
    const w = this.container.clientWidth || 1280;
    const h = this.container.clientHeight || 720;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
    this.keys.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private handlePointerDown = (e: PointerEvent) => {
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (!this.pointerDownPos) return;
    const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
    this.pointerDownPos = null;
    if (dist > 10) return;

    const s = this.stateRef.current;
    if (s.mode !== 'playing' || this.modalOpen) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);

    if (s.sceneView !== 'outdoor') {
      const hits = this.raycaster.intersectObjects([this.roomGroup, this.groundClickPlane], true);
      for (const hit of hits) {
        const interact = this.findUserDataProp(hit.object, 'interact') as
          | 'work'
          | 'jobs'
          | 'bathtub'
          | 'sleep'
          | 'cook'
          | 'tv'
          | 'exit'
          | undefined;
        if (interact) {
          const wp = new THREE.Vector3();
          hit.object.getWorldPosition(wp);
          const clampedX = Math.max(-6.5, Math.min(6.5, wp.x));
          const clampedZ = Math.max(-4.5, Math.min(4.8, wp.z));
          const curDist = Math.hypot(clampedX - this.playerMesh.position.x, clampedZ - this.playerMesh.position.z);
          if (curDist < 2.3) {
            this.callbacks.onRoomInteract(interact);
          } else {
            this.walkTarget = { x: clampedX, z: clampedZ, pendingRoomAction: interact };
            this.walkMarker.position.set(clampedX, 0.08, clampedZ);
            this.walkMarker.visible = true;
          }
          return;
        }
      }
      const floorHit = this.raycaster.intersectObject(this.groundClickPlane, false)[0];
      if (floorHit) {
        const tx = Math.max(-7, Math.min(7, floorHit.point.x));
        const tz = Math.max(-5, Math.min(5, floorHit.point.z));
        this.walkTarget = { x: tx, z: tz };
        this.walkMarker.position.set(tx, 0.08, tz);
        this.walkMarker.visible = true;
      }
      return;
    }

    // Outdoor tap/click-to-move or building click
    const hits = this.raycaster.intersectObjects([this.outdoorGroup, this.groundClickPlane], true);
    for (const hit of hits) {
      const lmId = this.findUserDataProp(hit.object, 'landmarkId') as string | undefined;
      if (lmId) {
        const lm = LANDMARKS.find((l) => l.id === lmId);
        if (lm) {
          const entryZ = Math.min(21.5, lm.z + lm.depth / 2 + 1.4);
          const curDist = Math.hypot(lm.x - this.playerMesh.position.x, lm.z - this.playerMesh.position.z);
          if (curDist <= lm.radius + 0.6) {
            this.callbacks.onLandmarkActivate(lm.id);
          } else {
            this.walkTarget = { x: lm.x, z: entryZ, pendingLandmarkId: lm.id };
            this.walkMarker.position.set(lm.x, 0.08, entryZ);
            this.walkMarker.visible = true;
          }
          return;
        }
      }
    }

    const groundHit = this.raycaster.intersectObject(this.groundClickPlane, false)[0];
    if (groundHit) {
      const clamped = clampWorldPosition(groundHit.point.x, groundHit.point.z);
      this.walkTarget = { x: clamped.x, z: clamped.z };
      this.walkMarker.position.set(clamped.x, 0.08, clamped.z);
      this.walkMarker.visible = true;
    }
  };

  private findUserDataProp(obj: THREE.Object3D | null, key: string): unknown {
    let cur: THREE.Object3D | null = obj;
    while (cur) {
      if (cur.userData && cur.userData[key] !== undefined) {
        return cur.userData[key];
      }
      cur = cur.parent;
    }
    return undefined;
  }

  public setModalOpen(open: boolean) {
    this.modalOpen = open;
  }

  public setVirtualInput(dx: number, dy: number, sprint: boolean) {
    this.virtualInput = { dx, dy, sprint };
    if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
      this.walkTarget = null;
      this.walkMarker.visible = false;
    }
  }

  public rebuildPlayer(appearance: CharacterAppearance) {
    const pos = this.playerMesh.position.clone();
    const rot = this.playerMesh.rotation.y;
    this.scene.remove(this.playerMesh);
    this.playerMesh = buildCharacterGroup(appearance);
    this.playerMesh.position.copy(pos);
    this.playerMesh.rotation.y = rot;
    this.scene.add(this.playerMesh);
  }

  public teleportTo(x: number, z: number) {
    const clamped = clampWorldPosition(x, z);
    this.walkTarget = null;
    this.walkMarker.visible = false;
    this.playerMesh.position.set(clamped.x, 0, clamped.z);
  }

  public setWalkDestination(x: number, z: number, pendingLandmarkId?: string) {
    const clamped = clampWorldPosition(x, z);
    this.walkTarget = { x: clamped.x, z: clamped.z, pendingLandmarkId };
    this.walkMarker.position.set(clamped.x, 0.08, clamped.z);
    this.walkMarker.visible = true;
  }

  public triggerActionAnimation(action: CharacterAction, durationSec = 2.0) {
    this.forcedAction = action;
    this.actionTimer = durationSec;
  }

  public toggleVehicleEntry(): boolean {
    const s = this.stateRef.current;
    if (s.sceneView !== 'outdoor') return false;
    const activeV = s.ownedVehicles[s.activeVehicleIndex];
    if (!activeV || !this.playerVehicleMesh) return false;

    if (s.inVehicle) {
      this.playerMesh.visible = true;
      this.playerMesh.position.set(
        this.playerVehicleMesh.position.x + 1.8,
        0,
        this.playerVehicleMesh.position.z,
      );
      this.simVehicleSpeed = 0;
      return false;
    }

    const d = this.playerMesh.position.distanceTo(this.playerVehicleMesh.position);
    if (d < 5.5) {
      this.playerMesh.visible = false;
      this.walkTarget = null;
      this.walkMarker.visible = false;
      return true;
    }
    return false;
  }

  public toggleVehicleLights(): boolean {
    const s = this.stateRef.current;
    const v = s.ownedVehicles[s.activeVehicleIndex];
    return v ? !v.lightsOn : false;
  }

  public toggleVehicleDoors(): boolean {
    const s = this.stateRef.current;
    const v = s.ownedVehicles[s.activeVehicleIndex];
    return v ? !v.doorsOpen : false;
  }

  public syncVehicleFromState(state: GameSnapshot) {
    const v = state.ownedVehicles[state.activeVehicleIndex];
    const sig = v ? `${v.id}:${v.color}` : 'none';
    if (sig === this.builtVehicleSig) return;
    this.builtVehicleSig = sig;

    if (this.playerVehicleMesh) {
      this.outdoorGroup.remove(this.playerVehicleMesh);
      this.playerVehicleMesh = null;
    }
    if (!v) return;
    const spec = VEHICLES.find((item) => item.id === v.id) ?? VEHICLES[0];
    this.playerVehicleMesh = buildVehicleGroup(spec, v.color);
    this.playerVehicleMesh.position.set(v.x, 0, v.z);
    this.playerVehicleMesh.rotation.y = v.rotationY;
    this.simVehicleFuel = v.fuel;
    this.outdoorGroup.add(this.playerVehicleMesh);
  }

  public syncWorldSceneFromState(state: GameSnapshot) {
    const viewChanged =
      state.sceneView !== this.builtSceneView ||
      (state.sceneView === 'outdoor' && state.currentMunicipalityId !== this.builtMunicipalityId) ||
      (state.sceneView === 'company_room' && state.activeCompanyRoomId !== this.builtCompanyId) ||
      (state.sceneView === 'home_room' && state.placedBathtubId !== this.builtBathtubId);

    if (!viewChanged) return;

    this.builtSceneView = state.sceneView;
    this.builtMunicipalityId = state.currentMunicipalityId;
    this.builtCompanyId = state.activeCompanyRoomId;
    this.builtBathtubId = state.placedBathtubId;
    this.walkTarget = null;
    this.walkMarker.visible = false;

    if (state.sceneView === 'outdoor') {
      this.outdoorGroup.visible = true;
      this.roomGroup.visible = false;
      this.buildMunicipalityDiorama(state.currentMunicipalityId);
      this.playerMesh.position.set(state.playerX, 0, state.playerZ);
    } else if (state.sceneView === 'company_room' && state.activeCompanyRoomId) {
      this.outdoorGroup.visible = false;
      this.roomGroup.visible = true;
      this.buildCompanyInteriorRoom(state.activeCompanyRoomId);
      this.playerMesh.visible = true;
      this.playerMesh.position.set(0, 0, 4.4);
    } else {
      this.outdoorGroup.visible = false;
      this.roomGroup.visible = true;
      this.buildHomeInteriorRoom(state);
      this.playerMesh.visible = true;
      this.playerMesh.position.set(0, 0, 4.2);
    }
  }

  private clearGroup(group: THREE.Group) {
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }
  }

  private buildMunicipalityDiorama(municipalityId: MunicipalityId) {
    this.clearGroup(this.outdoorGroup);
    this.npcActors = [];
    this.trafficCars = [];
    this.roomLabelTargets = [];
    this.builtVehicleSig = '';

    const muni = getMunicipalityDef(municipalityId);
    this.scene.background = new THREE.Color(muni.waterColor);

    // Expansive turquoise Atlantic ocean surrounding diorama
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 240),
      new THREE.MeshStandardMaterial({
        color: muni.waterColor,
        roughness: 0.25,
        metalness: 0.15,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.35;
    this.waterMesh = water;
    this.outdoorGroup.add(water);

    // Compact island terrain base (48x48 matching reference photo)
    const islandTop = new THREE.Mesh(
      new THREE.BoxGeometry(48, 0.5, 48),
      new THREE.MeshStandardMaterial({ color: muni.groundColor, roughness: 0.92 }),
    );
    islandTop.position.y = -0.25;
    islandTop.receiveShadow = true;
    this.outdoorGroup.add(islandTop);

    // Coastal dark rim skirt
    const islandEdge = new THREE.Mesh(
      new THREE.BoxGeometry(48.8, 0.3, 48.8),
      new THREE.MeshStandardMaterial({ color: '#c49d64', roughness: 0.95 }),
    );
    islandEdge.position.y = -0.38;
    this.outdoorGroup.add(islandEdge);

    // Asphalt roads on X = -8, +8 and Z = -8, +8 (exact 3x3 block layout)
    const roadMat = new THREE.MeshStandardMaterial({ color: '#262930', roughness: 0.85 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.5 });

    [-8, 8].forEach((rz) => {
      const hRoad = new THREE.Mesh(new THREE.BoxGeometry(48, 0.04, 3.8), roadMat);
      hRoad.position.set(0, 0.015, rz);
      hRoad.receiveShadow = true;
      this.outdoorGroup.add(hRoad);

      for (let sx = -22; sx <= 22; sx += 3.0) {
        if (Math.abs(sx + 8) < 2.2 || Math.abs(sx - 8) < 2.2) continue;
        const dash = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.045, 0.16), stripeMat);
        dash.position.set(sx, 0.022, rz);
        this.outdoorGroup.add(dash);
      }
    });

    [-8, 8].forEach((rx) => {
      const vRoad = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.04, 48), roadMat);
      vRoad.position.set(rx, 0.014, 0);
      vRoad.receiveShadow = true;
      this.outdoorGroup.add(vRoad);

      for (let sz = -22; sz <= 22; sz += 3.0) {
        if (Math.abs(sz + 8) < 2.2 || Math.abs(sz - 8) < 2.2) continue;
        const dash = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.045, 1.5), stripeMat);
        dash.position.set(rx, 0.022, sz);
        this.outdoorGroup.add(dash);
      }
    });

    // Crisp zebra crosswalks at the 4 intersections (-8,-8), (8,-8), (-8,8), (8,8)
    const intersections: [number, number][] = [
      [-8, -8],
      [8, -8],
      [-8, 8],
      [8, 8],
    ];
    for (const [ix, iz] of intersections) {
      for (let s = -1.2; s <= 1.25; s += 0.6) {
        const cw1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 0.25), stripeMat);
        cw1.position.set(ix - 2.5, 0.024, iz + s);
        const cw2 = cw1.clone();
        cw2.position.set(ix + 2.5, 0.024, iz + s);
        const cw3 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.85), stripeMat);
        cw3.position.set(ix + s, 0.024, iz - 2.5);
        const cw4 = cw3.clone();
        cw4.position.set(ix + s, 0.024, iz + 2.5);
        this.outdoorGroup.add(cw1, cw2, cw3, cw4);
      }
    }

    // Landmarks for current municipality
    const landmarks = LANDMARKS.filter((l) => l.municipalityId === municipalityId);
    for (const lm of landmarks) {
      this.outdoorGroup.add(buildCityLandmarkGroup(lm));
    }

    // Iconic VIDA NA BANDA Billboard (matches photo!)
    const billboard = buildBillboardGroup();
    billboard.position.set(-13.5, 0, 4.4);
    billboard.rotation.y = Math.PI * 0.25;
    this.outdoorGroup.add(billboard);

    // Palm trees along avenues & coastal corners
    const palmCoords: [number, number][] = [
      [-21, -21],
      [-12, -21],
      [11.5, -21],
      [21, -11.5],
      [-21, 5.2],
      [-11.5, 11.5],
      [11.5, 11.5],
      [21, 21],
      [-21, 21],
      [5.2, -11.5],
      [-5.2, 11.5],
    ];
    palmCoords.forEach(([px, pz], idx) => {
      const palm = buildPalmTreeGroup(4.0 + (idx % 3) * 0.55);
      palm.position.set(px, 0, pz);
      this.outdoorGroup.add(palm);
    });

    // Streetlights at road edges
    const lightCoords: [number, number, number][] = [
      [-5.8, -5.8, Math.PI * 0.75],
      [5.8, -5.8, -Math.PI * 0.75],
      [-5.8, 5.8, Math.PI * 0.25],
      [5.8, 5.8, -Math.PI * 0.25],
      [-10.2, 10.2, Math.PI * 0.25],
      [10.2, 10.2, -Math.PI * 0.25],
    ];
    for (const [lx, lz, lrot] of lightCoords) {
      const sl = buildStreetLightGroup();
      sl.position.set(lx, 0, lz);
      sl.rotation.y = lrot;
      this.outdoorGroup.add(sl);
    }

    // Circulating Luanda traffic (Hiace candongueiros, taxis, sedans)
    const carDefs = [
      { id: 'candongueiro_hiace', axis: 'x' as const, lane: 8.8, dir: 1 as const, pos: -16, speed: 3.4 },
      { id: 'toyota_corolla', axis: 'x' as const, lane: -8.8, dir: -1 as const, pos: 14, speed: 3.8 },
      { id: 'hyundai_i10', axis: 'z' as const, lane: -7.2, dir: 1 as const, pos: -12, speed: 3.2 },
      { id: 'bmw_serie3', axis: 'z' as const, lane: 7.2, dir: -1 as const, pos: 15, speed: 4.1 },
    ];
    for (const c of carDefs) {
      const vDef = VEHICLES.find((v) => v.id === c.id) ?? VEHICLES[0];
      const mesh = buildVehicleGroup(vDef);
      if (c.axis === 'x') {
        mesh.position.set(c.pos, 0, c.lane);
        mesh.rotation.y = c.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        mesh.position.set(c.lane, 0, c.pos);
        mesh.rotation.y = c.dir > 0 ? 0 : Math.PI;
      }
      this.outdoorGroup.add(mesh);
      this.trafficCars.push({
        mesh,
        axis: c.axis,
        laneCoord: c.lane,
        pos: c.pos,
        dir: c.dir,
        speed: c.speed,
      });
    }

    // Smart NPCs & Gatunos strictly belonging to this municipality
    const localNpcs = this.stateRef.current.npcs.filter(
      (n) => n.municipalityId === municipalityId,
    );
    const listToSpawn = localNpcs.length > 0 ? localNpcs : INITIAL_NPCS.filter((n) => n.municipalityId === 'ingombota');
    listToSpawn.forEach((npc, idx) => {
      const actorMesh = buildCharacterGroup({
        skinTone: npc.skinTone,
        shirtColor: npc.shirtColor,
        hairStyle: npc.hairStyle,
        isGatuno: Boolean(npc.isGatuno),
      });
      const wp = SIDEWALK_WAYPOINTS[idx % SIDEWALK_WAYPOINTS.length];
      const nextWp = SIDEWALK_WAYPOINTS[(idx + 2) % SIDEWALK_WAYPOINTS.length];
      actorMesh.position.set(wp[0], 0, wp[1]);
      this.outdoorGroup.add(actorMesh);
      this.npcActors.push({
        id: npc.id,
        name: npc.name,
        isGatuno: Boolean(npc.isGatuno),
        mesh: actorMesh,
        x: wp[0],
        z: wp[1],
        targetX: nextWp[0],
        targetZ: nextWp[1],
        pauseTimer: 0.4 * idx,
        speed: npc.isGatuno ? 2.6 : 1.9,
      });
    });

    this.syncVehicleFromState(this.stateRef.current);
  }

  private buildCompanyInteriorRoom(companyId: CompanyId) {
    this.clearGroup(this.roomGroup);
    this.npcActors = [];
    this.roomLabelTargets = [];

    const comp = ANGOLAN_COMPANIES.find((c) => c.id === companyId) ?? ANGOLAN_COMPANIES[0];
    this.scene.background = new THREE.Color('#0f172a');

    // Architectural tiled office floor (16 x 12)
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.3, 12),
      new THREE.MeshStandardMaterial({
        color: comp.roomFloorColor,
        map: getTileFloorTexture('#f1f5f9', '#cbd5e1'),
        roughness: 0.42,
      }),
    );
    floor.position.y = -0.15;
    floor.receiveShadow = true;
    this.roomGroup.add(floor);

    // Reception carpet runner
    const runner = new THREE.Mesh(
      new THREE.BoxGeometry(11.5, 0.03, 2.2),
      new THREE.MeshStandardMaterial({ color: comp.brandColor, roughness: 0.9 }),
    );
    runner.position.set(0, 0.02, 1.8);
    this.roomGroup.add(runner);

    // Back & Side Walls + Wood Baseboard Molding
    const wallMat = new THREE.MeshStandardMaterial({ color: comp.roomWallColor, roughness: 0.72 });
    const trimMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.55 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(16, 5.2, 0.4), wallMat);
    backWall.position.set(0, 2.6, -6);
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.2, 12), wallMat);
    leftWall.position.set(-8, 2.6, 0);
    const rightWall = leftWall.clone();
    rightWall.position.x = 8;

    const backBase = new THREE.Mesh(new THREE.BoxGeometry(15.6, 0.22, 0.08), trimMat);
    backBase.position.set(0, 0.11, -5.76);
    const leftBase = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 11.6), trimMat);
    leftBase.position.set(-7.76, 0.11, 0);
    const rightBase = leftBase.clone();
    rightBase.position.x = 7.76;
    this.roomGroup.add(backWall, leftWall, rightWall, backBase, leftBase, rightBase);

    // Branded Company Wall Sign with CanvasTexture
    const signFrame = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.8, 0.12), trimMat);
    signFrame.position.set(0, 3.4, -5.76);
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(6.9, 1.55),
      new THREE.MeshBasicMaterial({ map: getCompanyBannerTexture(comp) }),
    );
    banner.position.set(0, 3.4, -5.68);
    this.roomGroup.add(signFrame, banner);

    // Potted Indoor Plants in corners
    const plantL = buildPottedPlantGroup(1.15);
    plantL.position.set(-6.9, 0, -4.9);
    const plantR = buildPottedPlantGroup(1.15);
    plantR.position.set(6.9, 0, -4.9);
    this.roomGroup.add(plantL, plantR);

    // 3 Executive Workstations (Desks + Monitors + Keyboards + Swivel Chairs)
    const deskPositions: [number, number][] = [
      [-4.2, -1.8],
      [0, -1.8],
      [4.2, -1.8],
    ];
    const deskMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.52 });
    const legMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.6, roughness: 0.35 });
    const monMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      emissive: '#38bdf8',
      emissiveIntensity: 0.4,
    });

    deskPositions.forEach(([dx, dz], idx) => {
      const deskGroup = new THREE.Group();
      deskGroup.position.set(dx, 0, dz);
      deskGroup.userData.interact = idx === 0 ? 'jobs' : 'work';

      const top = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.12, 1.25), deskMat);
      top.position.y = 0.88;
      top.castShadow = true;
      top.userData.interact = deskGroup.userData.interact;

      [-1.05, 1.05].forEach((lx) => {
        [-0.45, 0.45].forEach((lz) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.86, 8), legMat);
          leg.position.set(lx, 0.43, lz);
          deskGroup.add(leg);
        });
      });

      const monStand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 0.2, 10), legMat);
      monStand.position.set(0, 1.02, -0.24);
      const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.56, 0.06), monMat);
      monitor.position.set(0, 1.34, -0.24);
      monitor.userData.interact = deskGroup.userData.interact;

      const keyboard = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.03, 0.2),
        new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.5 }),
      );
      keyboard.position.set(0, 0.95, 0.12);

      const chair = buildOfficeChairGroup(comp.accentColor);
      chair.position.set(0, 0, 1.02);
      chair.traverse((obj) => {
        obj.userData.interact = deskGroup.userData.interact;
      });

      deskGroup.add(top, monStand, monitor, keyboard, chair);
      this.roomGroup.add(deskGroup);
    });

    // Boss / HR NPC behind desk 1
    const bossMesh = buildCharacterGroup({
      skinTone: '#56311f',
      shirtColor: comp.brandColor,
      hairStyle: 'corte_baixo',
    });
    bossMesh.position.set(-4.2, 0, -3.05);
    bossMesh.userData.interact = 'jobs';
    this.roomGroup.add(bossMesh);

    // Coworker NPC at desk 3
    const coworkerMesh = buildCharacterGroup({
      skinTone: '#8f5a3c',
      shirtColor: '#f8fafc',
      hairStyle: 'trancas',
    });
    coworkerMesh.position.set(4.2, 0, -3.05);
    this.roomGroup.add(coworkerMesh);

    // Detailed Paneled Exit Door at front-right
    const exitDoor = buildPaneledDoorGroup('#16a34a');
    exitDoor.position.set(5.4, 0, 5.72);
    this.roomGroup.add(exitDoor);

    this.roomLabelTargets = [
      {
        id: 'room_jobs',
        label: `RH / Vagas ${comp.name}`,
        accentColor: comp.brandColor,
        pos: new THREE.Vector3(-4.2, 2.4, -1.8),
        action: 'jobs',
      },
      {
        id: 'room_work',
        label: 'Posto de Trabalho (Clica p/ Trabalhar)',
        accentColor: '#f59e0b',
        pos: new THREE.Vector3(0, 2.2, -1.8),
        action: 'work',
      },
      {
        id: 'room_exit',
        label: 'Porta de Saída (Rua)',
        accentColor: '#16a34a',
        pos: new THREE.Vector3(5.4, 2.9, 5.7),
        action: 'exit',
      },
    ];
  }

  private buildHomeInteriorRoom(state: GameSnapshot) {
    this.clearGroup(this.roomGroup);
    this.npcActors = [];
    this.roomLabelTargets = [];

    this.scene.background = new THREE.Color('#1c140e');

    // Warm Hardwood Plank Apartment Floor (16 x 12)
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.3, 12),
      new THREE.MeshStandardMaterial({
        map: getWoodPlankTexture(),
        roughness: 0.65,
      }),
    );
    floor.position.y = -0.15;
    floor.receiveShadow = true;
    this.roomGroup.add(floor);

    // Vibrant Angolan Samakaka Woven Rug in living lounge
    const rug = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.03, 3.6),
      new THREE.MeshStandardMaterial({
        map: getSamakakaRugTexture(),
        roughness: 0.92,
      }),
    );
    rug.position.set(-0.5, 0.02, -0.9);
    this.roomGroup.add(rug);

    // Ceramic Mosaic Bathroom Tile Pad (right side)
    const bathFloorPad = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.03, 4.4),
      new THREE.MeshStandardMaterial({
        map: getTileFloorTexture('#e0f2fe', '#94a3b8'),
        roughness: 0.35,
      }),
    );
    bathFloorPad.position.set(5.4, 0.02, 0.6);
    this.roomGroup.add(bathFloorPad);

    // Warm Painted Walls + Hardwood Baseboards (Rodapés)
    const wallMat = new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.78 });
    const trimMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.6 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(16, 5.2, 0.4), wallMat);
    backWall.position.set(0, 2.6, -6);
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.2, 12), wallMat);
    leftWall.position.set(-8, 2.6, 0);
    const rightWall = leftWall.clone();
    rightWall.position.x = 8;

    const backTrim = new THREE.Mesh(new THREE.BoxGeometry(15.6, 0.24, 0.08), trimMat);
    backTrim.position.set(0, 0.12, -5.76);
    const leftTrim = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 11.6), trimMat);
    leftTrim.position.set(-7.76, 0.12, 0);
    const rightTrim = leftTrim.clone();
    rightTrim.position.x = 7.76;
    this.roomGroup.add(backWall, leftWall, rightWall, backTrim, leftTrim, rightTrim);

    // Framed Window overlooking Luanda sky + curtains (back center-left)
    const winFrame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.5, 0.1), trimMat);
    winFrame.position.set(-0.5, 3.25, -5.76);
    const winGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 1.25),
      new THREE.MeshBasicMaterial({ color: '#7dd3fc' }),
    );
    winGlass.position.set(-0.5, 3.25, -5.69);
    const curtainMat = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.88 });
    [-1.75, 0.75].forEach((cx) => {
      const curtain = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.75, 10), curtainMat);
      curtain.position.set(cx, 3.2, -5.66);
      this.roomGroup.add(curtain);
    });
    this.roomGroup.add(winFrame, winGlass);

    // Framed Angolan Art Painting above Bed
    const artFrame = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.3, 0.08), trimMat);
    artFrame.position.set(-5.0, 2.65, -5.76);
    const artCanvas = new THREE.Mesh(
      new THREE.PlaneGeometry(1.68, 1.08),
      new THREE.MeshBasicMaterial({ map: getWallArtTexture() }),
    );
    artCanvas.position.set(-5.0, 2.65, -5.71);
    this.roomGroup.add(artFrame, artCanvas);

    // Detailed Bed + Pillows + Nightstand & Glowing Lamp (left-back)
    const bed = buildDetailedBedGroup();
    bed.position.set(-5.1, 0, -3.7);
    this.roomGroup.add(bed);

    // Detailed Smart TV & Media Console (center-back)
    const tvGroup = buildDetailedTvAndTableGroup();
    tvGroup.position.set(-0.5, 0, -5.1);
    this.roomGroup.add(tvGroup);

    // Plush Teal Sofa + Round Coffee Table facing TV
    const sofa = buildDetailedSofaGroup();
    sofa.position.set(-0.5, 0, 0.15);
    const coffeeTable = buildCoffeeTableGroup();
    coffeeTable.position.set(-0.5, 0, -1.6);
    this.roomGroup.add(sofa, coffeeTable);

    // Potted Tropical Houseplants
    const plantLiving = buildPottedPlantGroup(1.1);
    plantLiving.position.set(1.65, 0, -5.05);
    const plantDoor = buildPottedPlantGroup(0.95);
    plantDoor.position.set(-7.0, 0, 4.6);
    this.roomGroup.add(plantLiving, plantDoor);

    // Detailed Kitchenette: Counter, Stove, Panela de Funge & Refrigerator (right-back)
    const kitchen = buildDetailedKitchenGroup();
    kitchen.position.set(4.1, 0, -4.85);
    this.roomGroup.add(kitchen);

    // Bathroom Vanity Sink + Mirror on Right Wall
    const vanity = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.85, 1.4),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 }),
    );
    vanity.position.set(7.35, 0.42, -1.2);
    const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.15, 1.15), trimMat);
    mirrorFrame.position.set(7.74, 1.65, -1.2);
    const mirrorGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.98, 0.98),
      new THREE.MeshStandardMaterial({ color: '#bae6fd', metalness: 0.9, roughness: 0.08 }),
    );
    mirrorGlass.rotation.y = -Math.PI / 2;
    mirrorGlass.position.set(7.69, 1.65, -1.2);
    this.roomGroup.add(vanity, mirrorFrame, mirrorGlass);

    // 3D Rounded BATHTUB in Bathroom Corner (x=5.0, z=0.8)
    if (state.placedBathtubId) {
      const tubDef = BATHTUBS.find((b) => b.id === state.placedBathtubId) ?? BATHTUBS[0];
      const tubMesh = buildBathtub3DGroup(tubDef);
      tubMesh.position.set(5.0, 0, 0.8);
      this.roomGroup.add(tubMesh);

      this.roomLabelTargets.push({
        id: 'home_bathtub',
        label: `${tubDef.name} (Clica: +${tubDef.energyRestore} Energia)`,
        accentColor: '#0284c7',
        pos: new THREE.Vector3(5.0, 1.75, 0.8),
        action: 'bathtub',
      });
    } else {
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.06, 1.5),
        new THREE.MeshStandardMaterial({ color: '#bae6fd', roughness: 0.5 }),
      );
      pad.position.set(5.0, 0.04, 0.8);
      pad.userData.interact = 'bathtub';
      this.roomGroup.add(pad);

      this.roomLabelTargets.push({
        id: 'home_bathtub',
        label: 'Espaço p/ Banheira (Compra >60k Kz na Loja)',
        accentColor: '#38bdf8',
        pos: new THREE.Vector3(5.0, 1.1, 0.8),
        action: 'bathtub',
      });
    }

    // Detailed Paneled Exit Door + Welcome Mat
    const exitDoor = buildPaneledDoorGroup('#16a34a');
    exitDoor.position.set(-5.2, 0, 5.72);
    this.roomGroup.add(exitDoor);

    this.roomLabelTargets.push(
      {
        id: 'home_bed',
        label: 'Cama (Dormir / Novo Dia)',
        accentColor: '#b45309',
        pos: new THREE.Vector3(-5.8, 1.4, -4.0),
        action: 'sleep',
      },
      {
        id: 'home_cook',
        label: 'Fogão (Cozinhar Funge)',
        accentColor: '#ea580c',
        pos: new THREE.Vector3(4.1, 1.8, -4.85),
        action: 'cook',
      },
      {
        id: 'home_exit',
        label: 'Porta de Saída (Rua)',
        accentColor: '#16a34a',
        pos: new THREE.Vector3(-5.2, 2.9, 5.7),
        action: 'exit',
      },
    );
  }

  private scheduleNextTick() {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(this.tick);
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (gl && typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (!sync) {
        this.timeoutId = window.setTimeout(cb, 80);
        return;
      }
      gl.flush();
      const poll = () => {
        if (this.disposed) return;
        const syncState = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (syncState === gl.UNSIGNALED) {
          this.timeoutId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          this.timeoutId = window.setTimeout(cb, 80);
        }
      };
      this.timeoutId = window.setTimeout(poll, 5);
    } else {
      this.timeoutId = window.setTimeout(cb, 80);
    }
  }

  private tick = () => {
    if (this.disposed) return;
    const now = performance.now();
    const maxDt = this.isSoftwareGl ? 0.35 : 0.1;
    const dt = Math.min(maxDt, Math.max(0.001, (now - this.lastFrameTime) / 1000));
    this.lastFrameTime = now;

    const state = this.stateRef.current;
    this.syncWorldSceneFromState(state);
    this.syncVehicleFromState(state);

    if (this.gatunoCooldown > 0) this.gatunoCooldown = Math.max(0, this.gatunoCooldown - dt);

    if (state.mode === 'playing' && !this.modalOpen) {
      this.updateSimulationStep(dt, now, state);
    } else {
      // Gently rotate camera on title/auth background
      const t = now * 0.00018;
      this.camera.position.set(Math.cos(t) * 34, 27, Math.sin(t) * 34);
      this.camera.lookAt(0, 0.5, 0);
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(() => {
        if (!this.disposed) this.tick();
      });
    } else {
      this.scheduleNextTick();
    }
  };

  private updateSimulationStep(dt: number, now: number, state: GameSnapshot) {
    // Advance in-game clock gently
    this.simTimeMinutes += dt * 2.2;
    if (this.simTimeMinutes >= 1440) {
      this.simTimeMinutes -= 1440;
      this.simDay += 1;
    }

    // Time-of-day lighting
    const hour = this.simTimeMinutes / 60;
    const dayFactor = hour >= 6 && hour <= 18 ? 1 : hour > 18 && hour < 21 ? 0.55 : 0.35;
    this.sunLight.intensity = 1.75 * dayFactor;
    this.hemiLight.intensity = 0.85 * (0.45 + 0.55 * dayFactor);

    // Movement input (WASD or virtual joystick or click-to-move)
    let moveX = this.virtualInput.dx;
    let moveZ = this.virtualInput.dy;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) moveZ -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) moveZ += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) moveX -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) moveX += 1;

    const hasManualInput = Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05;
    if (hasManualInput) {
      this.walkTarget = null;
      this.walkMarker.visible = false;
    }

    let currentAction: CharacterAction = 'idle';

    if (state.inVehicle && state.sceneView === 'outdoor' && this.playerVehicleMesh) {
      // Vehicle driving
      const throttle = (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) -
        (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0);
      const steer = (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0) -
        (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0);

      if (throttle !== 0 && this.simVehicleFuel > 0) {
        this.simVehicleSpeed = THREE.MathUtils.lerp(this.simVehicleSpeed, throttle * 11, dt * 3);
        this.simVehicleFuel = Math.max(0, this.simVehicleFuel - dt * 0.45);
      } else {
        this.simVehicleSpeed = THREE.MathUtils.lerp(this.simVehicleSpeed, 0, dt * 4);
      }

      if (Math.abs(this.simVehicleSpeed) > 0.4) {
        this.playerVehicleMesh.rotation.y += steer * dt * 2.2 * Math.sign(this.simVehicleSpeed);
      }

      const vx = Math.sin(this.playerVehicleMesh.rotation.y) * this.simVehicleSpeed * dt;
      const vz = Math.cos(this.playerVehicleMesh.rotation.y) * this.simVehicleSpeed * dt;
      const nextPos = clampWorldPosition(
        this.playerVehicleMesh.position.x + vx,
        this.playerVehicleMesh.position.z + vz,
      );
      this.playerVehicleMesh.position.set(nextPos.x, 0, nextPos.z);
      this.playerMesh.position.copy(this.playerVehicleMesh.position);
      currentAction = 'drive';
    } else {
      // On-foot movement (isometric aligned)
      let dirX = 0;
      let dirZ = 0;
      let speed = 5.4;

      if (hasManualInput) {
        // Rotate input 45deg to match isometric camera angle (+X, +Z camera look)
        const isoX = moveX + moveZ;
        const isoZ = moveZ - moveX;
        const len = Math.hypot(isoX, isoZ) || 1;
        dirX = isoX / len;
        dirZ = isoZ / len;
        const sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.virtualInput.sprint;
        speed = sprint ? 9.5 : 6.4;
        currentAction = sprint ? 'run' : 'walk';
      } else if (this.walkTarget) {
        const dx = this.walkTarget.x - this.playerMesh.position.x;
        const dz = this.walkTarget.z - this.playerMesh.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist <= 0.55) {
          this.playerMesh.position.set(this.walkTarget.x, 0, this.walkTarget.z);
          const pendingLm = this.walkTarget.pendingLandmarkId;
          const pendingRoom = this.walkTarget.pendingRoomAction;
          this.walkTarget = null;
          this.walkMarker.visible = false;
          if (pendingLm) this.callbacks.onLandmarkActivate(pendingLm);
          if (pendingRoom) this.callbacks.onRoomInteract(pendingRoom);
        } else {
          dirX = dx / dist;
          dirZ = dz / dist;
          speed = 7.6;
          currentAction = 'walk';
        }
      }

      if (dirX !== 0 || dirZ !== 0) {
        const stepDist = this.walkTarget
          ? Math.min(
              Math.hypot(this.walkTarget.x - this.playerMesh.position.x, this.walkTarget.z - this.playerMesh.position.z),
              speed * dt,
            )
          : speed * dt;
        const nx = this.playerMesh.position.x + dirX * stepDist;
        const nz = this.playerMesh.position.z + dirZ * stepDist;
        if (state.sceneView === 'outdoor') {
          const clamped = clampWorldPosition(nx, nz);
          this.playerMesh.position.set(clamped.x, 0, clamped.z);
        } else {
          this.playerMesh.position.set(
            Math.max(-6.8, Math.min(6.8, nx)),
            0,
            Math.max(-4.8, Math.min(5.2, nz)),
          );
        }
        this.playerMesh.rotation.y = Math.atan2(dirX, dirZ);
      }
    }

    if (this.actionTimer > 0) {
      this.actionTimer = Math.max(0, this.actionTimer - dt);
      if (this.forcedAction) currentAction = this.forcedAction;
      if (this.actionTimer === 0) this.forcedAction = null;
    }

    this.animateCharacter(this.playerMesh, currentAction, now * 0.008);

    // Animate walk marker pulse
    if (this.walkMarker.visible) {
      const pulse = 1 + Math.sin(now * 0.008) * 0.14;
      this.walkMarker.scale.set(pulse, pulse, 1);
    }

    // Update circulating traffic cars & Smart NPCs + Gatunos in outdoor mode
    if (state.sceneView === 'outdoor') {
      for (const car of this.trafficCars) {
        car.pos += car.dir * car.speed * dt;
        if (car.pos > 23) car.pos = -23;
        if (car.pos < -23) car.pos = 23;
        if (car.axis === 'x') {
          car.mesh.position.x = car.pos;
        } else {
          car.mesh.position.z = car.pos;
        }
      }

      for (const npc of this.npcActors) {
        if (npc.pauseTimer > 0) {
          npc.pauseTimer -= dt;
          this.animateCharacter(npc.mesh, 'idle', now * 0.005);
          continue;
        }

        // Smart Gatuno slightly tracks nearby player if within 7 units; regular NPC avoids crowding
        const distToPlayer = Math.hypot(
          npc.x - this.playerMesh.position.x,
          npc.z - this.playerMesh.position.z,
        );

        if (npc.isGatuno && distToPlayer < 6.5 && distToPlayer > 1.25 && this.gatunoCooldown <= 0) {
          const dx = this.playerMesh.position.x - npc.x;
          const dz = this.playerMesh.position.z - npc.z;
          const len = Math.hypot(dx, dz) || 1;
          npc.x += (dx / len) * npc.speed * dt;
          npc.z += (dz / len) * npc.speed * dt;
          npc.mesh.rotation.y = Math.atan2(dx, dz);
          npc.mesh.position.set(npc.x, 0, npc.z);
          this.animateCharacter(npc.mesh, 'run', now * 0.01);

          if (distToPlayer < 1.55) {
            this.gatunoCooldown = 28;
            this.callbacks.onGatunoCatch(npc.name);
          }
          continue;
        }

        const dx = npc.targetX - npc.x;
        const dz = npc.targetZ - npc.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.45) {
          const pick = SIDEWALK_WAYPOINTS[Math.floor(Math.random() * SIDEWALK_WAYPOINTS.length)];
          npc.targetX = pick[0];
          npc.targetZ = pick[1];
          npc.pauseTimer = 1.1 + Math.random() * 1.5;
        } else {
          npc.x += (dx / dist) * npc.speed * dt;
          npc.z += (dz / dist) * npc.speed * dt;
          npc.mesh.position.set(npc.x, 0, npc.z);
          npc.mesh.rotation.y = Math.atan2(dx, dz);
          this.animateCharacter(npc.mesh, 'walk', now * 0.007);
        }
      }
    }

    // Smooth Isometric Camera follow (matches photo angle!)
    const targetX = state.sceneView === 'outdoor' ? this.playerMesh.position.x * 0.65 : 0;
    const targetZ = state.sceneView === 'outdoor' ? this.playerMesh.position.z * 0.65 : 0;
    const camOffset = state.sceneView === 'outdoor' ? new THREE.Vector3(24, 24, 24) : new THREE.Vector3(10, 12.5, 13.5);
    const desiredCamPos = new THREE.Vector3(targetX + camOffset.x, camOffset.y, targetZ + camOffset.z);
    this.camera.position.lerp(desiredCamPos, Math.min(1, dt * 6));
    this.camera.lookAt(targetX, 0.7, targetZ);

    // Throttle React HUD + Projected Label sync to ~8 Hz
    this.hudAccumulator += dt;
    if (this.hudAccumulator >= 0.125) {
      this.hudAccumulator = 0;
      this.emitHudSync(state, currentAction);
    }
  }

  private animateCharacter(mesh: THREE.Group, action: CharacterAction, phase: number) {
    const limbs = mesh.userData.limbs as
      | {
          armLeft: THREE.Group;
          armRight: THREE.Group;
          legLeft: THREE.Group;
          legRight: THREE.Group;
          torso: THREE.Mesh;
        }
      | undefined;
    if (!limbs) return;

    if (action === 'walk' || action === 'run') {
      const swing = Math.sin(phase * (action === 'run' ? 1.6 : 1.0)) * (action === 'run' ? 0.75 : 0.48);
      limbs.legLeft.rotation.x = swing;
      limbs.legRight.rotation.x = -swing;
      limbs.armLeft.rotation.x = -swing * 0.8;
      limbs.armRight.rotation.x = swing * 0.8;
      limbs.torso.position.y = 1.14 + Math.abs(Math.cos(phase)) * 0.04;
    } else if (action === 'dance') {
      limbs.armLeft.rotation.x = -1.2 + Math.sin(phase * 1.4) * 0.5;
      limbs.armRight.rotation.x = -1.2 - Math.sin(phase * 1.4) * 0.5;
      limbs.legLeft.rotation.x = Math.sin(phase * 1.4) * 0.25;
      limbs.legRight.rotation.x = -Math.sin(phase * 1.4) * 0.25;
      limbs.torso.position.y = 1.14 + Math.abs(Math.sin(phase * 1.4)) * 0.09;
    } else {
      limbs.legLeft.rotation.x = 0;
      limbs.legRight.rotation.x = 0;
      limbs.armLeft.rotation.x = 0;
      limbs.armRight.rotation.x = 0;
      limbs.torso.position.y = 1.14;
    }
  }

  private emitHudSync(state: GameSnapshot, playerAction: CharacterAction) {
    const px = this.playerMesh.position.x;
    const pz = this.playerMesh.position.z;

    let nearbyLandmarkId: string | null = null;
    let nearbyNpcId: string | null = null;
    let nearbyVehiclePrompt = false;

    if (state.sceneView === 'outdoor') {
      const lm = findNearestLandmark(px, pz, state.currentMunicipalityId);
      nearbyLandmarkId = lm?.id ?? null;

      let bestNpcDist = 3.2;
      for (const npc of this.npcActors) {
        const d = Math.hypot(npc.x - px, npc.z - pz);
        if (d < bestNpcDist) {
          bestNpcDist = d;
          nearbyNpcId = npc.id;
        }
      }

      if (this.playerVehicleMesh && !state.inVehicle) {
        nearbyVehiclePrompt = this.playerMesh.position.distanceTo(this.playerVehicleMesh.position) < 4.5;
      }
    }

    // Project 3D landmark / room badges cleanly to viewport coordinates, avoiding HUD card overlap
    const w = this.container.clientWidth || 1280;
    const h = this.container.clientHeight || 720;
    const projectedLabels: ProjectedLabel[] = [];
    const inHudSafeZone = (sx: number, sy: number) => {
      if (sy < 180 && sx < 355) return true; // Top-left player stats card
      if (sy < 72 && sx >= 355 && sx <= w - 330) return true; // Top-center global broadcast banner
      if (sy < 130 && sx > w - 340) return true; // Top-right controls & meta card
      if (sy > h - 92) return true; // Bottom action dock
      return false;
    };

    if (state.sceneView === 'outdoor') {
      const lms = LANDMARKS.filter((l) => l.municipalityId === state.currentMunicipalityId);
      for (const lm of lms) {
        const vec = new THREE.Vector3(lm.x, lm.height + 1.4, lm.z);
        vec.project(this.camera);
        if (vec.z > 1) continue;
        const sx = (vec.x * 0.5 + 0.5) * w;
        const sy = (-vec.y * 0.5 + 0.5) * h;
        if (sx < 40 || sx > w - 40 || sy < 50 || sy > h - 60) continue;
        if (inHudSafeZone(sx, sy)) continue;
        projectedLabels.push({
          id: lm.id,
          label: lm.shortLabel,
          accentColor: lm.accentColor,
          screenX: Math.round(sx),
          screenY: Math.round(sy),
          category: lm.category,
        });
      }
    } else {
      for (const target of this.roomLabelTargets) {
        const vec = target.pos.clone().project(this.camera);
        if (vec.z > 1) continue;
        const sx = Math.max(95, Math.min(w - 95, (vec.x * 0.5 + 0.5) * w));
        const sy = (-vec.y * 0.5 + 0.5) * h;
        if (inHudSafeZone(sx, sy)) continue;
        projectedLabels.push({
          id: target.id,
          label: target.label,
          accentColor: target.accentColor,
          screenX: Math.round(sx),
          screenY: Math.round(sy),
          category: target.action,
          isRoomItem: true,
        });
      }
    }

    this.callbacks.onHudSync({
      playerX: Number(px.toFixed(2)),
      playerZ: Number(pz.toFixed(2)),
      playerDistrict: getDistrictAt(px, pz, state.currentMunicipalityId),
      nearbyLandmarkId,
      nearbyNpcId,
      nearbyVehiclePrompt,
      vehicleSpeedKmh: Math.round(Math.abs(this.simVehicleSpeed) * 9),
      vehicleFuel: Math.round(this.simVehicleFuel),
      timeMinutes: Math.floor(this.simTimeMinutes),
      day: this.simDay,
      playerAction,
      projectedLabels,
    });
  }

  public dispose() {
    this.disposed = true;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.timeoutId !== null) clearTimeout(this.timeoutId);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.removeEventListener('pointerup', this.handlePointerUp);
    this.envRT?.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
