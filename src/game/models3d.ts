import * as THREE from 'three';
import {
  AngolanCompanyDef,
  BathtubDef,
  CharacterAppearance,
  LandmarkDef,
  VehicleDef,
} from './types';

const textureCache = new Map<string, THREE.CanvasTexture>();

function makeCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
  cacheKey?: string,
  repeat?: [number, number],
): THREE.CanvasTexture {
  if (cacheKey && textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  if (cacheKey) textureCache.set(cacheKey, tex);
  return tex;
}

function createRoundedRectShape(w: number, d: number, r: number): THREE.Shape {
  const hw = w / 2;
  const hd = d / 2;
  const cr = Math.min(r, hw * 0.9, hd * 0.9);
  const s = new THREE.Shape();
  s.moveTo(-hw + cr, -hd);
  s.lineTo(hw - cr, -hd);
  s.quadraticCurveTo(hw, -hd, hw, -hd + cr);
  s.lineTo(hw, hd - cr);
  s.quadraticCurveTo(hw, hd, hw - cr, hd);
  s.lineTo(-hw + cr, hd);
  s.quadraticCurveTo(-hw, hd, -hw, hd - cr);
  s.lineTo(-hw, -hd + cr);
  s.quadraticCurveTo(-hw, -hd, -hw + cr, -hd);
  return s;
}

export function getWoodPlankTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(
    256,
    256,
    (ctx) => {
      ctx.fillStyle = '#c89b68';
      ctx.fillRect(0, 0, 256, 256);
      const planks = 6;
      const ph = 256 / planks;
      for (let i = 0; i < planks; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#cfa472' : '#be8e58';
        ctx.fillRect(0, i * ph, 256, ph - 2);
        // Subtle wood grain lines
        ctx.strokeStyle = 'rgba(92, 56, 24, 0.16)';
        ctx.lineWidth = 1.5;
        for (let g = 0; g < 3; g++) {
          ctx.beginPath();
          const gy = i * ph + 8 + g * 11;
          ctx.moveTo(0, gy);
          ctx.bezierCurveTo(85, gy + (g % 2 ? 3 : -3), 170, gy - (g % 2 ? 2 : -2), 256, gy);
          ctx.stroke();
        }
        // Plank seam & staggered vertical joint
        ctx.fillStyle = '#7c5329';
        ctx.fillRect(0, (i + 1) * ph - 2, 256, 2);
        const jx = ((i * 97 + 40) % 210) + 20;
        ctx.fillRect(jx, i * ph, 2, ph);
      }
    },
    'home_wood_floor',
    [3, 3],
  );
}

export function getTileFloorTexture(baseHex = '#e2e8f0', groutHex = '#cbd5e1'): THREE.CanvasTexture {
  return makeCanvasTexture(
    128,
    128,
    (ctx) => {
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = groutHex;
      ctx.lineWidth = 3;
      ctx.strokeRect(1.5, 1.5, 61, 61);
      ctx.strokeRect(65.5, 1.5, 61, 61);
      ctx.strokeRect(1.5, 65.5, 61, 61);
      ctx.strokeRect(65.5, 65.5, 61, 61);
    },
    `tile_${baseHex}_${groutHex}`,
    [4, 4],
  );
}

export function getSamakakaRugTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(
    256,
    192,
    (ctx) => {
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(0, 0, 256, 192);
      // Outer woven cream/gold border
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 14;
      ctx.strokeRect(10, 10, 236, 172);
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 4;
      ctx.strokeRect(19, 19, 218, 154);

      // Angolan Samakaka geometric diamonds & triangles
      const cols = 6;
      const rows = 4;
      const cw = 204 / cols;
      const ch = 140 / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = 26 + c * cw;
          const y = 26 + r * ch;
          ctx.fillStyle = (r + c) % 2 === 0 ? '#b91c1c' : '#d97706';
          ctx.beginPath();
          ctx.moveTo(x + cw / 2, y + 2);
          ctx.lineTo(x + cw - 2, y + ch / 2);
          ctx.lineTo(x + cw / 2, y + ch - 2);
          ctx.lineTo(x + 2, y + ch / 2);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#18181b';
          ctx.beginPath();
          ctx.arc(x + cw / 2, y + ch / 2, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    'samakaka_rug',
  );
}

export function getTvScreenTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(
    256,
    144,
    (ctx) => {
      const grad = ctx.createLinearGradient(0, 0, 0, 144);
      grad.addColorStop(0, '#0c4a6e');
      grad.addColorStop(0.55, '#f97316');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 144);
      // Sun over Marginal
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(175, 68, 22, 0, Math.PI * 2);
      ctx.fill();
      // City skyline silhouettes
      ctx.fillStyle = '#0f172a';
      [18, 44, 72, 102, 130, 198, 222].forEach((bx, idx) => {
        const bh = 28 + (idx % 3) * 18;
        ctx.fillRect(bx, 118 - bh, 20, bh);
      });
      // Lower banner
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 118, 256, 26);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('BANDA TV · LUANDA AO VIVO', 14, 136);
    },
    'home_tv_screen',
  );
}

export function getWallArtTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(
    192,
    128,
    (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, 128);
      g.addColorStop(0, '#f59e0b');
      g.addColorStop(0.65, '#dc2626');
      g.addColorStop(1, '#451a03');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 192, 128);
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(96, 52, 24, 0, Math.PI * 2);
      ctx.fill();
      // Baobab silhouette
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(88, 62, 16, 48);
      ctx.beginPath();
      ctx.arc(96, 58, 28, Math.PI, 0);
      ctx.fill();
    },
    'home_wall_art',
  );
}

export function getCompanyBannerTexture(comp: AngolanCompanyDef): THREE.CanvasTexture {
  return makeCanvasTexture(
    512,
    128,
    (ctx) => {
      ctx.fillStyle = comp.brandColor;
      ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, 496, 112);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(comp.name.toUpperCase(), 256, 54);
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.fillText(comp.sector.toUpperCase(), 256, 94);
    },
    `company_banner_${comp.id}`,
  );
}

export function buildCharacterGroup(
  appearance: Partial<CharacterAppearance> & {
    skinTone: string;
    shirtColor: string;
    pantsColor?: string;
    shoeColor?: string;
    hairStyle?: string;
    hairColor?: string;
    hasCap?: boolean;
    capColor?: string;
    isGatuno?: boolean;
  },
): THREE.Group {
  const root = new THREE.Group();

  const buildFactor =
    appearance.bodyBuild === 'robusto' ? 1.12 : appearance.bodyBuild === 'atletico' ? 0.98 : 0.86;

  const skinMat = new THREE.MeshStandardMaterial({
    color: appearance.skinTone || '#6f422b',
    roughness: 0.64,
  });
  const shirtMat = new THREE.MeshStandardMaterial({
    color: appearance.isGatuno ? '#111827' : appearance.shirtColor || '#f59e0b',
    roughness: 0.62,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: appearance.isGatuno ? '#090d16' : appearance.pantsColor || '#1e293b',
    roughness: 0.75,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: appearance.shoeColor || '#f8fafc',
    roughness: 0.48,
  });
  const soleMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.7 });
  const hairMat = new THREE.MeshStandardMaterial({
    color: appearance.hairColor || '#151210',
    roughness: 0.82,
  });

  // Soft contact shadow disc on ground
  const contactShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 16),
    new THREE.MeshBasicMaterial({
      color: '#000000',
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    }),
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.015;
  root.add(contactShadow);

  // Slim rounded torso (kept centered at y=1.14 so walk/dance animations keep exact height)
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.15 * buildFactor, 0.32, 6, 14),
    shirtMat,
  );
  torso.scale.set(1.04, 1.0, 0.74);
  torso.position.y = 1.14;
  torso.castShadow = true;
  root.add(torso);

  // Smooth belt & rounded pelvis/hips so legs connect seamlessly with zero air gap
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.146 * buildFactor, 0.146 * buildFactor, 0.075, 14),
    new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.45, metalness: 0.2 }),
  );
  belt.scale.set(1.04, 1, 0.76);
  belt.position.y = 0.89;
  root.add(belt);

  const pelvis = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.135 * buildFactor, 0.06, 5, 12),
    pantsMat,
  );
  pelvis.rotation.z = Math.PI / 2;
  pelvis.scale.set(0.85, 1, 0.82);
  pelvis.position.y = 0.81;
  root.add(pelvis);

  // Shirt neckline collar
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.082, 0.02, 8, 14),
    shirtMat,
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.43;
  root.add(collar);

  // Smooth slender neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.066, 0.14, 12), skinMat);
  neck.position.y = 1.49;
  root.add(neck);

  // Chain draped neatly against chest
  if (appearance.hasChain && !appearance.isGatuno) {
    const chain = new THREE.Mesh(
      new THREE.TorusGeometry(0.095 * buildFactor, 0.014, 8, 18),
      new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.85, roughness: 0.2 }),
    );
    chain.rotation.x = Math.PI * 0.48;
    chain.position.set(0, 1.39, 0.04);
    root.add(chain);
  }

  // Head Group (smooth rounded oval sphere)
  const head = new THREE.Group();
  head.position.y = 1.69;

  const headWidth =
    appearance.faceShape === 'redondo' ? 1.0 : appearance.faceShape === 'angular' ? 0.9 : 0.94;
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.172, 16, 14), skinMat);
  cranium.scale.set(headWidth, 1.08, 0.96);
  cranium.castShadow = true;
  head.add(cranium);

  // Rounded ears
  const earGeo = new THREE.SphereGeometry(0.036, 8, 8);
  const earL = new THREE.Mesh(earGeo, skinMat);
  earL.scale.set(0.55, 1.1, 0.85);
  earL.position.set(-0.165 * headWidth, -0.01, 0);
  const earR = earL.clone();
  earR.position.x = 0.165 * headWidth;
  head.add(earL, earR);

  // Small rounded nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), skinMat);
  nose.position.set(0, -0.015, 0.164);
  head.add(nose);

  // Expressive rounded eyes
  const eyeColor = appearance.eyeColor || '#1e130c';
  const scleraMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: eyeColor, roughness: 0.2 });
  [-0.062, 0.062].forEach((ex) => {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), scleraMat);
    sclera.scale.set(1.1, 0.85, 0.55);
    sclera.position.set(ex, 0.025, 0.152);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), pupilMat);
    pupil.position.set(ex, 0.025, 0.162);
    head.add(sclera, pupil);
  });

  // Subtle smile arc
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.032, 0.008, 6, 10, Math.PI * 0.75),
    new THREE.MeshStandardMaterial({ color: '#3b1c14', roughness: 0.7 }),
  );
  mouth.rotation.z = Math.PI * 1.12;
  mouth.position.set(0, -0.062, 0.15);
  head.add(mouth);

  // Optional Sunglasses
  if (appearance.hasGlasses && !appearance.isGatuno) {
    const lensMat = new THREE.MeshStandardMaterial({
      color: '#090d16',
      roughness: 0.12,
      metalness: 0.65,
    });
    const lensL = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.018, 12), lensMat);
    lensL.rotation.x = Math.PI / 2;
    lensL.position.set(-0.064, 0.028, 0.172);
    const lensR = lensL.clone();
    lensR.position.x = 0.064;
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.012), lensMat);
    bridge.position.set(0, 0.032, 0.172);
    head.add(lensL, lensR, bridge);
  }

  // Optional Beard contoured around lower chin
  if (appearance.beardStyle && appearance.beardStyle !== 'nenhuma' && !appearance.isGatuno) {
    if (appearance.beardStyle === 'barba_cheia') {
      const beard = new THREE.Mesh(
        new THREE.SphereGeometry(0.162, 14, 10, 0, Math.PI * 2, Math.PI * 0.52, Math.PI * 0.45),
        hairMat,
      );
      beard.scale.set(headWidth * 1.02, 1.06, 0.99);
      head.add(beard);
    } else if (appearance.beardStyle === 'cavanhaque') {
      const goatee = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), hairMat);
      goatee.scale.set(0.95, 1.15, 0.65);
      goatee.position.set(0, -0.105, 0.125);
      head.add(goatee);
    } else {
      const chinLine = new THREE.Mesh(
        new THREE.TorusGeometry(0.115, 0.016, 6, 14, Math.PI * 0.9),
        hairMat,
      );
      chinLine.rotation.x = Math.PI * 0.45;
      chinLine.rotation.z = Math.PI * 0.05;
      chinLine.position.set(0, -0.095, 0.05);
      head.add(chinLine);
    }
  }

  // Hair / Cap / Gatuno Beanie
  if (appearance.isGatuno) {
    const beanie = new THREE.Mesh(
      new THREE.SphereGeometry(0.182, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56),
      new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.88 }),
    );
    beanie.position.y = 0.02;
    const mask = new THREE.Mesh(
      new THREE.CylinderGeometry(0.168, 0.158, 0.11, 14, 1, true),
      new THREE.MeshStandardMaterial({ color: '#030712', roughness: 0.9, side: THREE.DoubleSide }),
    );
    mask.position.y = -0.065;
    head.add(beanie, mask);
  } else {
    const style = appearance.hairStyle || 'corte_baixo';
    if (style === 'afro') {
      const afro = new THREE.Mesh(new THREE.SphereGeometry(0.228, 16, 14), hairMat);
      afro.position.set(0, 0.075, -0.02);
      head.add(afro);
    } else if (style === 'coque') {
      const baseHair = new THREE.Mesh(
        new THREE.SphereGeometry(0.178, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
        hairMat,
      );
      baseHair.position.y = 0.025;
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), hairMat);
      bun.position.set(0, 0.22, -0.04);
      head.add(baseHair, bun);
    } else if (style === 'trancas' || style === 'dreads') {
      const crownHair = new THREE.Mesh(
        new THREE.SphereGeometry(0.178, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
        hairMat,
      );
      crownHair.position.y = 0.025;
      head.add(crownHair);
      for (let i = 0; i < 7; i++) {
        const ang = Math.PI * 0.75 + (i / 6) * Math.PI * 1.5;
        const strand = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.18, 4, 8), hairMat);
        strand.position.set(Math.sin(ang) * 0.165, -0.04, Math.cos(ang) * 0.155);
        strand.rotation.z = -Math.sin(ang) * 0.18;
        head.add(strand);
      }
    } else if (style === 'ondulado') {
      const crownHair = new THREE.Mesh(new THREE.SphereGeometry(0.186, 14, 12), hairMat);
      crownHair.scale.set(1.04, 0.85, 1.05);
      crownHair.position.set(0, 0.07, -0.015);
      head.add(crownHair);
    } else {
      // Corte baixo / régua
      const capHair = new THREE.Mesh(
        new THREE.SphereGeometry(0.176, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.48),
        hairMat,
      );
      capHair.position.y = 0.022;
      head.add(capHair);
    }

    if (appearance.hasCap) {
      const capMat = new THREE.MeshStandardMaterial({
        color: appearance.capColor || '#dc2626',
        roughness: 0.55,
      });
      const capDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.188, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
        capMat,
      );
      capDome.position.set(0, 0.04, 0);
      const visor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.185, 0.024, 14, 1, false, -Math.PI * 0.42, Math.PI * 0.84),
        capMat,
      );
      visor.position.set(0, 0.045, 0.085);
      visor.rotation.x = 0.12;
      head.add(capDome, visor);
    }
  }

  root.add(head);

  // Slim Rounded Left & Right Arms (tucked cleanly into shoulder sockets)
  const shoulderX = 0.182 * buildFactor;
  const armLeft = new THREE.Group();
  armLeft.position.set(-shoulderX, 1.32, 0);
  const shoulderCapL = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 8), shirtMat);
  const sleeveL = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.24, 4, 10), shirtMat);
  sleeveL.position.y = -0.14;
  sleeveL.castShadow = true;
  const forearmL = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.16, 4, 10), skinMat);
  forearmL.position.y = -0.33;
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.046, 10, 8), skinMat);
  handL.position.y = -0.45;
  armLeft.add(shoulderCapL, sleeveL, forearmL, handL);

  if (appearance.hasWatch && !appearance.isGatuno) {
    const watch = new THREE.Mesh(
      new THREE.TorusGeometry(0.046, 0.011, 6, 12),
      new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.85, roughness: 0.2 }),
    );
    watch.rotation.x = Math.PI / 2;
    watch.position.y = -0.39;
    armLeft.add(watch);
  }

  const armRight = new THREE.Group();
  armRight.position.set(shoulderX, 1.32, 0);
  armRight.add(shoulderCapL.clone(), sleeveL.clone(), forearmL.clone(), handL.clone());

  // Slim Rounded Left & Right Legs + Sneakers (connected cleanly into pelvis)
  const hipX = 0.084 * buildFactor;
  const legLeft = new THREE.Group();
  legLeft.position.set(-hipX, 0.82, 0);
  const legLeftMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.064, 0.48, 4, 10), pantsMat);
  legLeftMesh.position.y = -0.28;
  legLeftMesh.castShadow = true;

  const shoeL = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.11, 4, 10), shoeMat);
  shoeL.rotation.x = Math.PI / 2;
  shoeL.scale.set(1, 1, 0.78);
  shoeL.position.set(0, -0.66, 0.035);
  const soleL = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.115, 4, 10), soleMat);
  soleL.rotation.x = Math.PI / 2;
  soleL.scale.set(1.02, 1.02, 0.35);
  soleL.position.set(0, -0.695, 0.035);
  legLeft.add(legLeftMesh, shoeL, soleL);

  const legRight = new THREE.Group();
  legRight.position.set(hipX, 0.82, 0);
  legRight.add(legLeftMesh.clone(), shoeL.clone(), soleL.clone());

  root.add(armLeft, armRight, legLeft, legRight);
  root.userData.limbs = { armLeft, armRight, legLeft, legRight, torso, head };

  const scale = appearance.height ?? 1.0;
  root.scale.set(scale, scale, scale);
  return root;
}

export function buildPalmTreeGroup(height = 4.4): THREE.Group {
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#7c4a26', roughness: 0.88 });
  const leafMat = new THREE.MeshStandardMaterial({
    color: '#15803d',
    roughness: 0.7,
    side: THREE.DoubleSide,
  });

  // Curved organic palm trunk
  const segCount = 5;
  const segH = height / segCount;
  let curX = 0;
  for (let i = 0; i < segCount; i++) {
    const rBot = 0.21 - i * 0.025;
    const rTop = 0.185 - i * 0.024;
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, segH + 0.06, 10), trunkMat);
    curX += i * 0.07;
    seg.position.set(curX, segH * (i + 0.5), 0);
    seg.rotation.z = -0.07 * i;
    seg.castShadow = true;
    group.add(seg);
  }

  // Crown + coconuts + arched curved fronds
  const crown = new THREE.Group();
  crown.position.set(curX + 0.08, height, 0);

  const cocoMat = new THREE.MeshStandardMaterial({ color: '#5c3317', roughness: 0.85 });
  for (let c = 0; c < 3; c++) {
    const a = (c / 3) * Math.PI * 2;
    const coco = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), cocoMat);
    coco.position.set(Math.cos(a) * 0.16, -0.14, Math.sin(a) * 0.16);
    crown.add(coco);
  }

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const frondPivot = new THREE.Group();
    frondPivot.rotation.y = angle;
    const innerLeaf = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.72, 3, 6), leafMat);
    innerLeaf.scale.set(1.2, 1, 0.22);
    innerLeaf.rotation.x = Math.PI * 0.42;
    innerLeaf.position.set(0, 0.08, 0.42);
    const outerLeaf = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.65, 3, 6), leafMat);
    outerLeaf.scale.set(1.1, 1, 0.2);
    outerLeaf.rotation.x = Math.PI * 0.62;
    outerLeaf.position.set(0, -0.16, 1.05);
    frondPivot.add(innerLeaf, outerLeaf);
    crown.add(frondPivot);
  }
  group.add(crown);
  return group;
}

export function buildStreetLightGroup(): THREE.Group {
  const g = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.65, roughness: 0.35 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.3, 10), poleMat);
  base.position.y = 0.15;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 2.65, 10), poleMat);
  pole.position.y = 1.38;
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.46, 4, 8), poleMat);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(0.24, 2.68, 0);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 10, 8),
    new THREE.MeshStandardMaterial({
      color: '#fef08a',
      emissive: '#f59e0b',
      emissiveIntensity: 0.85,
      roughness: 0.25,
    }),
  );
  bulb.scale.set(1.3, 0.6, 1.0);
  bulb.position.set(0.48, 2.63, 0);
  g.add(base, pole, arm, bulb);
  return g;
}

export function buildBillboardGroup(): THREE.Group {
  const g = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: '#1f2937', metalness: 0.55, roughness: 0.45 });
  const leftPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 2.1, 10), postMat);
  leftPost.position.set(-1.1, 1.05, 0);
  const rightPost = leftPost.clone();
  rightPost.position.x = 1.1;

  const signTex = makeCanvasTexture(
    512,
    256,
    (ctx) => {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(0, 0, 512, 256);
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 18;
      ctx.strokeRect(9, 9, 494, 238);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(26, 26, 460, 48);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ANGOLA · LUANDA 3D', 256, 60);
      ctx.fillStyle = '#111827';
      ctx.font = '900 56px sans-serif';
      ctx.fillText('VIDA NA BANDA', 256, 165);
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('TRABALHO · CASAS · CONDOMÍNIOS', 256, 216);
    },
    'billboard_banda',
  );

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 1.65, 0.16),
    [
      postMat,
      postMat,
      postMat,
      postMat,
      new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.45 }),
      new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.45 }),
    ],
  );
  board.position.set(0, 2.25, 0);
  board.castShadow = true;
  g.add(leftPost, rightPost, board);
  return g;
}

export function buildVehicleGroup(def: VehicleDef, colorOverride?: string): THREE.Group {
  const g = new THREE.Group();
  const bodyColor = colorOverride || def.defaultColor;
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: bodyColor,
    roughness: 0.32,
    metalness: 0.35,
    clearcoat: 0.65,
    clearcoatRoughness: 0.18,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    roughness: 0.12,
    metalness: 0.78,
  });
  const wheelMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.85 });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.8, roughness: 0.22 });

  if (def.isMoto) {
    const frame = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.95, 4, 10), bodyMat);
    frame.rotation.x = Math.PI / 2;
    frame.position.y = 0.5;
    const seat = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.42, 4, 8), wheelMat);
    seat.rotation.x = Math.PI / 2;
    seat.position.set(0, 0.72, -0.1);
    const w1 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.14, 14), wheelMat);
    w1.rotation.z = Math.PI / 2;
    w1.position.set(0, 0.28, 0.48);
    const w2 = w1.clone();
    w2.position.z = -0.48;
    g.add(frame, seat, w1, w2);
    return g;
  }

  const isVan = def.isCandongueiro || def.isBus || def.id === 'toyota_hiace_vip';
  const len = def.isBus ? 3.8 : isVan ? 2.85 : 2.45;
  const wid = isVan ? 1.24 : 1.18;

  // Sleek beveled side-profile ExtrudeGeometry extruded along X then centered
  const profile = new THREE.Shape();
  const hl = len / 2;
  if (isVan) {
    profile.moveTo(-hl, 0.26);
    profile.lineTo(hl - 0.08, 0.26);
    profile.quadraticCurveTo(hl + 0.04, 0.35, hl, 0.65);
    profile.lineTo(hl - 0.16, 1.38);
    profile.quadraticCurveTo(hl - 0.24, 1.48, hl - 0.42, 1.48);
    profile.lineTo(-hl + 0.2, 1.48);
    profile.quadraticCurveTo(-hl, 1.48, -hl, 1.25);
    profile.closePath();
  } else {
    profile.moveTo(-hl, 0.24);
    profile.lineTo(hl - 0.06, 0.24);
    profile.quadraticCurveTo(hl + 0.05, 0.32, hl - 0.02, 0.56);
    profile.lineTo(hl * 0.44, 0.68);
    profile.lineTo(hl * 0.18, 1.12);
    profile.lineTo(-hl * 0.48, 1.12);
    profile.lineTo(-hl * 0.78, 0.72);
    profile.lineTo(-hl, 0.64);
    profile.closePath();
  }

  const chassisGeo = new THREE.ExtrudeGeometry(profile, {
    depth: wid - 0.14,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.05,
    bevelSegments: 2,
  });
  chassisGeo.center();
  // Rotate so Z is vehicle forward (+Z) and X is width
  chassisGeo.rotateY(-Math.PI / 2);

  const chassis = new THREE.Mesh(chassisGeo, bodyMat);
  chassis.position.y = isVan ? 0.88 : 0.7;
  chassis.castShadow = true;
  g.add(chassis);

  // Candongueiro iconic white upper roof band
  if (def.isCandongueiro) {
    const whiteTop = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.42, len * 0.55, 4, 8),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 }),
    );
    whiteTop.rotation.x = Math.PI / 2;
    whiteTop.scale.set(1.25, 1, 0.52);
    whiteTop.position.set(0, 1.32, -0.05);
    g.add(whiteTop);
  }

  // Tinted panoramic windows band
  const winBox = new THREE.Mesh(
    new THREE.BoxGeometry(wid * 0.94, isVan ? 0.38 : 0.32, isVan ? len * 0.78 : len * 0.46),
    glassMat,
  );
  winBox.position.set(0, isVan ? 1.1 : 0.9, isVan ? 0.04 : -0.1);
  g.add(winBox);

  // 4 Rounded Wheels with silver hubcaps
  const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.17, 14);
  const hubGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.19, 10);
  const wPositions: [number, number][] = [
    [-wid / 2 - 0.02, len * 0.3],
    [wid / 2 + 0.02, len * 0.3],
    [-wid / 2 - 0.02, -len * 0.3],
    [wid / 2 + 0.02, -len * 0.3],
  ];
  for (const [wx, wz] of wPositions) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.24, wz);
    const hub = new THREE.Mesh(hubGeo, rimMat);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(wx, 0.24, wz);
    g.add(w, hub);
  }

  // Rounded Headlights & Red Taillights
  const hlMat = new THREE.MeshStandardMaterial({
    color: '#fef08a',
    emissive: '#facc15',
    emissiveIntensity: 0.35,
  });
  const tlMat = new THREE.MeshStandardMaterial({
    color: '#ef4444',
    emissive: '#dc2626',
    emissiveIntensity: 0.3,
  });
  const hlL = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), hlMat);
  hlL.scale.set(1.2, 0.75, 0.5);
  hlL.position.set(-wid * 0.32, 0.46, len / 2 + 0.02);
  const hlR = hlL.clone();
  hlR.position.x = wid * 0.32;

  const tlL = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), tlMat);
  tlL.scale.set(1.2, 0.7, 0.5);
  tlL.position.set(-wid * 0.32, 0.46, -len / 2 - 0.02);
  const tlR = tlL.clone();
  tlR.position.x = wid * 0.32;

  g.add(hlL, hlR, tlL, tlR);
  g.userData.headlights = [hlL, hlR];

  return g;
}

export function buildCityLandmarkGroup(lm: LandmarkDef): THREE.Group {
  const group = new THREE.Group();
  group.position.set(lm.x, 0, lm.z);
  group.userData.landmarkId = lm.id;

  if (lm.category === 'Cultura & Lazer' && lm.height < 1) {
    const sandShape = createRoundedRectShape(lm.width, lm.depth, 0.9);
    const sandGeo = new THREE.ExtrudeGeometry(sandShape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.04, bevelSegments: 2 });
    sandGeo.rotateX(-Math.PI / 2);
    const sandPad = new THREE.Mesh(
      sandGeo,
      new THREE.MeshStandardMaterial({ color: '#fde68a', roughness: 0.92 }),
    );
    group.add(sandPad);

    const umbrellaColors = ['#06b6d4', '#ec4899', '#f59e0b'];
    const uOffsets: [number, number][] = [
      [-1.1, -0.9],
      [1.0, 0.6],
      [-0.4, 1.3],
    ];
    uOffsets.forEach(([ux, uz], idx) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 1.5, 8),
        new THREE.MeshStandardMaterial({ color: '#e2e8f0' }),
      );
      pole.position.set(ux, 0.75, uz);
      const canopy = new THREE.Mesh(
        new THREE.ConeGeometry(0.85, 0.42, 12),
        new THREE.MeshStandardMaterial({ color: umbrellaColors[idx % umbrellaColors.length], roughness: 0.55 }),
      );
      canopy.position.set(ux, 1.55, uz);
      group.add(pole, canopy);
    });
    return group;
  }

  if (lm.category === 'Transporte') {
    const baseShape = createRoundedRectShape(lm.width, lm.depth, 0.45);
    const baseGeo = new THREE.ExtrudeGeometry(baseShape, { depth: 0.14, bevelEnabled: false });
    baseGeo.rotateX(-Math.PI / 2);
    const base = new THREE.Mesh(
      baseGeo,
      new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.8 }),
    );
    const roofShape = createRoundedRectShape(lm.width * 0.95, lm.depth * 0.92, 0.35);
    const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 0.16, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
    roofGeo.rotateX(-Math.PI / 2);
    const roof = new THREE.Mesh(
      roofGeo,
      new THREE.MeshStandardMaterial({ color: lm.buildingColor, roughness: 0.45 }),
    );
    roof.position.y = 1.9;
    roof.castShadow = true;
    group.add(base, roof);

    const postMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.55 });
    for (const px of [-lm.width * 0.42, lm.width * 0.42]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.85, 8), postMat);
      p.position.set(px, 0.95, -lm.depth * 0.35);
      group.add(p);
    }
    const bench = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.18, lm.width * 0.46, 4, 8),
      new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.72 }),
    );
    bench.rotation.z = Math.PI / 2;
    bench.position.set(0, 0.28, -0.3);
    group.add(bench);
    return group;
  }

  // Rounded-corner architectural building
  const wallMat = new THREE.MeshStandardMaterial({ color: lm.buildingColor, roughness: 0.62 });
  const roofMat = new THREE.MeshStandardMaterial({ color: lm.roofColor, roughness: 0.5 });
  const winMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.18,
    metalness: 0.6,
  });

  const plinthShape = createRoundedRectShape(lm.width + 0.5, lm.depth + 0.5, 0.32);
  const plinthGeo = new THREE.ExtrudeGeometry(plinthShape, { depth: 0.18, bevelEnabled: false });
  plinthGeo.rotateX(-Math.PI / 2);
  const plinth = new THREE.Mesh(
    plinthGeo,
    new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.85 }),
  );
  group.add(plinth);

  const bodyShape = createRoundedRectShape(lm.width, lm.depth, 0.24);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: lm.height,
    bevelEnabled: true,
    bevelSize: 0.05,
    bevelThickness: 0.04,
    bevelSegments: 2,
  });
  bodyGeo.rotateX(-Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, wallMat);
  body.position.y = 0.18;
  body.castShadow = true;
  body.receiveShadow = true;
  body.userData.landmarkId = lm.id;
  group.add(body);

  // Beveled roof cornice
  const trimShape = createRoundedRectShape(lm.width + 0.28, lm.depth + 0.28, 0.28);
  const trimGeo = new THREE.ExtrudeGeometry(trimShape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelSize: 0.05,
    bevelThickness: 0.05,
    bevelSegments: 2,
  });
  trimGeo.rotateX(-Math.PI / 2);
  const trim = new THREE.Mesh(trimGeo, roofMat);
  trim.position.y = 0.18 + lm.height;
  group.add(trim);

  // Entrance awning + glowing doorway + flanking decorative planters
  const awningShape = createRoundedRectShape(lm.width * 0.46, 0.88, 0.2);
  const awningGeo = new THREE.ExtrudeGeometry(awningShape, { depth: 0.14, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
  awningGeo.rotateX(-Math.PI / 2);
  const awning = new THREE.Mesh(
    awningGeo,
    new THREE.MeshStandardMaterial({ color: lm.accentColor, roughness: 0.45 }),
  );
  awning.position.set(0, 1.4, lm.depth / 2 + 0.36);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 1.32, 0.12),
    new THREE.MeshStandardMaterial({
      color: '#0f172a',
      emissive: lm.accentColor,
      emissiveIntensity: 0.25,
      roughness: 0.25,
    }),
  );
  door.position.set(0, 0.8, lm.depth / 2 + 0.04);
  door.userData.landmarkId = lm.id;
  group.add(awning, door);

  // Potted entrance greenery
  [-0.85, 0.85].forEach((px) => {
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.12, 0.24, 8),
      new THREE.MeshStandardMaterial({ color: '#9a3412', roughness: 0.8 }),
    );
    pot.position.set(px, 0.3, lm.depth / 2 + 0.24);
    const bush = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.8 }),
    );
    bush.position.set(px, 0.5, lm.depth / 2 + 0.24);
    group.add(pot, bush);
  });

  // Crisp grid of windows on front & sides
  const floors = Math.max(1, Math.round(lm.height / 1.55));
  const cols = Math.max(2, Math.floor(lm.width / 1.45));
  for (let f = 0; f < floors; f++) {
    const wy = 0.95 + f * 1.35;
    if (wy > lm.height - 0.3) continue;
    for (let c = 0; c < cols; c++) {
      const wx = -lm.width * 0.34 + (c / Math.max(1, cols - 1)) * (lm.width * 0.68);
      if (f === 0 && Math.abs(wx) < 0.85) continue;
      const winF = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.56, 0.08), winMat);
      winF.position.set(wx, wy, lm.depth / 2 + 0.03);
      const winB = winF.clone();
      winB.position.z = -lm.depth / 2 - 0.03;
      group.add(winF, winB);
    }
    const sideWinL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.56, 0.68), winMat);
    sideWinL.position.set(-lm.width / 2 - 0.03, wy, 0);
    const sideWinR = sideWinL.clone();
    sideWinR.position.x = lm.width / 2 + 0.03;
    group.add(sideWinL, sideWinR);
  }

  return group;
}

export function buildBathtub3DGroup(tub: BathtubDef): THREE.Group {
  const g = new THREE.Group();
  g.userData.interact = 'bathtub';

  const outerMat = new THREE.MeshPhysicalMaterial({
    color: tub.primaryColor,
    roughness: 0.18,
    metalness: 0.1,
    clearcoat: 0.8,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: tub.trimColor,
    roughness: 0.22,
    metalness: 0.78,
  });
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: tub.hasJets ? '#38bdf8' : '#7dd3fc',
    roughness: 0.08,
    metalness: 0.18,
    clearcoat: 0.9,
    emissive: tub.hasJets ? '#0284c7' : '#0369a1',
    emissiveIntensity: tub.hasJets ? 0.32 : 0.12,
  });

  const tubW = tub.id === 'jacuzzi_ilha' ? 2.65 : 2.15;
  const tubD = tub.id === 'jacuzzi_ilha' ? 1.95 : 1.28;
  const rOuter = tubD * 0.48;

  // Rounded stadium / oval shell
  const shellGeo = new THREE.ExtrudeGeometry(createRoundedRectShape(tubW, tubD, rOuter), {
    depth: 0.58,
    bevelEnabled: true,
    bevelSize: 0.05,
    bevelThickness: 0.05,
    bevelSegments: 3,
  });
  shellGeo.rotateX(-Math.PI / 2);
  const shell = new THREE.Mesh(shellGeo, outerMat);
  shell.position.y = 0.04;
  shell.castShadow = true;
  shell.userData.interact = 'bathtub';
  g.add(shell);

  // Glossy metallic/ceramic rounded rim
  const rimGeo = new THREE.ExtrudeGeometry(
    createRoundedRectShape(tubW + 0.12, tubD + 0.12, rOuter + 0.05),
    {
      depth: 0.06,
      bevelEnabled: true,
      bevelSize: 0.03,
      bevelThickness: 0.03,
      bevelSegments: 2,
    },
  );
  rimGeo.rotateX(-Math.PI / 2);
  const rim = new THREE.Mesh(rimGeo, trimMat);
  rim.position.y = 0.62;
  rim.userData.interact = 'bathtub';
  g.add(rim);

  // Curved inner water surface
  const waterGeo = new THREE.ExtrudeGeometry(
    createRoundedRectShape(tubW - 0.28, tubD - 0.28, Math.max(0.2, rOuter - 0.14)),
    { depth: 0.05, bevelEnabled: false },
  );
  waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.y = 0.66;
  water.userData.interact = 'bathtub';
  g.add(water);

  // Curved gooseneck faucet + mixer knobs
  const spoutCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-tubW * 0.42, 0.66, 0),
    new THREE.Vector3(-tubW * 0.42, 0.98, 0),
    new THREE.Vector3(-tubW * 0.34, 1.08, 0),
    new THREE.Vector3(-tubW * 0.27, 0.96, 0),
  ]);
  const faucet = new THREE.Mesh(new THREE.TubeGeometry(spoutCurve, 14, 0.038, 8, false), trimMat);
  faucet.userData.interact = 'bathtub';
  g.add(faucet);

  [-0.14, 0.14].forEach((kz) => {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.08, 10), trimMat);
    knob.position.set(-tubW * 0.42, 0.72, kz);
    knob.userData.interact = 'bathtub';
    g.add(knob);
  });

  // Soft white cotton bathmat beside the tub
  const matShape = createRoundedRectShape(1.5, 0.72, 0.18);
  const matGeo = new THREE.ExtrudeGeometry(matShape, { depth: 0.03, bevelEnabled: false });
  matGeo.rotateX(-Math.PI / 2);
  const bathMat = new THREE.Mesh(
    matGeo,
    new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.95 }),
  );
  bathMat.position.set(0, 0.02, tubD / 2 + 0.5);
  g.add(bathMat);

  // Bubbles
  if (tub.hasBubbles) {
    const bubbleMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.12,
      emissive: '#bae6fd',
      emissiveIntensity: 0.3,
    });
    const bubbles: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.11 + (i % 3) * 0.04, 10, 8), bubbleMat);
      b.position.set(-0.58 + i * 0.19, 0.74 + (i % 2) * 0.05, ((i % 3) - 1) * 0.22);
      b.userData.interact = 'bathtub';
      bubbles.push(b);
      g.add(b);
    }
    g.userData.bubbles = bubbles;
  }

  return g;
}

export function buildDetailedBedGroup(): THREE.Group {
  const g = new THREE.Group();
  g.userData.interact = 'sleep';

  const woodMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.62 });
  const sheetMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.82 });
  const duvetMat = new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.86 });
  const pillowMat = new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.85 });

  // Rounded base frame
  const frameGeo = new THREE.ExtrudeGeometry(createRoundedRectShape(2.65, 3.25, 0.18), {
    depth: 0.34,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 2,
  });
  frameGeo.rotateX(-Math.PI / 2);
  const frame = new THREE.Mesh(frameGeo, woodMat);
  frame.position.y = 0.08;
  frame.castShadow = true;
  frame.userData.interact = 'sleep';
  g.add(frame);

  // 4 Cylindrical legs
  [
    [-1.15, -1.45],
    [1.15, -1.45],
    [-1.15, 1.45],
    [1.15, 1.45],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.18, 10), woodMat);
    leg.position.set(lx, 0.09, lz);
    g.add(leg);
  });

  // Curved Headboard
  const headGeo = new THREE.ExtrudeGeometry(createRoundedRectShape(2.7, 0.16, 0.08), {
    depth: 1.05,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 2,
  });
  headGeo.rotateX(-Math.PI / 2);
  const headboard = new THREE.Mesh(headGeo, woodMat);
  headboard.position.set(0, 0.25, -1.52);
  headboard.userData.interact = 'sleep';
  g.add(headboard);

  // Plump rounded mattress
  const matGeo = new THREE.ExtrudeGeometry(createRoundedRectShape(2.38, 2.95, 0.2), {
    depth: 0.24,
    bevelEnabled: true,
    bevelSize: 0.05,
    bevelThickness: 0.05,
    bevelSegments: 3,
  });
  matGeo.rotateX(-Math.PI / 2);
  const mattress = new THREE.Mesh(matGeo, sheetMat);
  mattress.position.y = 0.42;
  mattress.userData.interact = 'sleep';
  g.add(mattress);

  // Warm Samakaka-red folded comforter blanket over bottom 2/3
  const duvetGeo = new THREE.ExtrudeGeometry(createRoundedRectShape(2.44, 1.95, 0.18), {
    depth: 0.12,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 2,
  });
  duvetGeo.rotateX(-Math.PI / 2);
  const duvet = new THREE.Mesh(duvetGeo, duvetMat);
  duvet.position.set(0, 0.62, 0.48);
  duvet.userData.interact = 'sleep';
  g.add(duvet);

  // Two plump rounded pillows
  [-0.56, 0.56].forEach((px) => {
    const pillow = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.42, 6, 10), pillowMat);
    pillow.rotation.z = Math.PI / 2;
    pillow.scale.set(0.65, 1, 1.15);
    pillow.position.set(px, 0.72, -1.04);
    pillow.userData.interact = 'sleep';
    g.add(pillow);
  });

  // Nightstand & glowing warm lamp beside bed
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.36, 0.58, 12), woodMat);
  stand.position.set(1.85, 0.29, -1.15);
  const lampBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 0.22, 10),
    new THREE.MeshStandardMaterial({ color: '#d97706', metalness: 0.6, roughness: 0.3 }),
  );
  lampBase.position.set(1.85, 0.69, -1.15);
  const lampShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.24, 0.28, 14),
    new THREE.MeshStandardMaterial({
      color: '#fef3c7',
      emissive: '#f59e0b',
      emissiveIntensity: 0.55,
      roughness: 0.5,
    }),
  );
  lampShade.position.set(1.85, 0.92, -1.15);
  g.add(stand, lampBase, lampShade);

  return g;
}

export function buildDetailedSofaGroup(): THREE.Group {
  const g = new THREE.Group();
  const fabricMat = new THREE.MeshStandardMaterial({ color: '#0f766e', roughness: 0.88 });
  const cushionMat = new THREE.MeshStandardMaterial({ color: '#14b8a6', roughness: 0.85 });
  const pillowAccentMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.85 });
  const legMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.55 });

  // Sofa seat base
  const baseGeo = new THREE.ExtrudeGeometry(createRoundedRectShape(3.2, 1.2, 0.22), {
    depth: 0.36,
    bevelEnabled: true,
    bevelSize: 0.05,
    bevelThickness: 0.05,
    bevelSegments: 2,
  });
  baseGeo.rotateX(-Math.PI / 2);
  const base = new THREE.Mesh(baseGeo, fabricMat);
  base.position.y = 0.14;
  base.castShadow = true;
  g.add(base);

  // Plush seat cushions
  [-0.72, 0.72].forEach((cx) => {
    const seat = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.75, 5, 10), cushionMat);
    seat.rotation.z = Math.PI / 2;
    seat.scale.set(0.45, 1, 1.35);
    seat.position.set(cx, 0.52, 0.05);
    g.add(seat);
  });

  // Backrest & rounded armrests
  const back = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 2.7, 5, 10), fabricMat);
  back.rotation.z = Math.PI / 2;
  back.scale.set(1.3, 1, 0.65);
  back.position.set(0, 0.78, 0.44);
  g.add(back);

  [-1.48, 1.48].forEach((ax) => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.72, 5, 10), fabricMat);
    arm.rotation.x = Math.PI / 2;
    arm.scale.set(0.85, 1, 1.15);
    arm.position.set(ax, 0.58, 0);
    g.add(arm);
  });

  // Throw pillows
  [-1.08, 1.08].forEach((px, i) => {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), pillowAccentMat);
    p.scale.set(0.95, 0.9, 0.55);
    p.position.set(px, 0.72, 0.18);
    p.rotation.y = i === 0 ? 0.35 : -0.35;
    g.add(p);
  });

  // 4 Tapered wood legs
  [
    [-1.35, -0.45],
    [1.35, -0.45],
    [-1.35, 0.45],
    [1.35, 0.45],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.035, 0.16, 8), legMat);
    leg.position.set(lx, 0.08, lz);
    g.add(leg);
  });

  return g;
}

export function buildDetailedTvAndTableGroup(): THREE.Group {
  const g = new THREE.Group();
  g.userData.interact = 'tv';

  const woodMat = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.55 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.35, metalness: 0.5 });

  // Rounded media console cabinet
  const cabGeo = new THREE.ExtrudeGeometry(createRoundedRectShape(2.8, 0.8, 0.14), {
    depth: 0.52,
    bevelEnabled: true,
    bevelSize: 0.03,
    bevelThickness: 0.03,
    bevelSegments: 2,
  });
  cabGeo.rotateX(-Math.PI / 2);
  const cab = new THREE.Mesh(cabGeo, woodMat);
  cab.position.y = 0.14;
  cab.userData.interact = 'tv';
  g.add(cab);

  // Brass drawer handles
  [-0.65, 0.65].forEach((hx) => {
    const handle = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.025, 0.25, 4, 8),
      new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.8, roughness: 0.25 }),
    );
    handle.rotation.z = Math.PI / 2;
    handle.position.set(hx, 0.42, 0.42);
    g.add(handle);
  });

  // TV Stand stem + Slim Widescreen TV
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.18, 0.28, 10), darkMetal);
  stem.position.set(0, 0.78, -0.05);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.32, 0.09), darkMetal);
  bezel.position.set(0, 1.54, -0.05);
  bezel.userData.interact = 'tv';
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.18),
    new THREE.MeshBasicMaterial({ map: getTvScreenTexture() }),
  );
  screen.position.set(0, 1.54, 0.002);
  screen.userData.interact = 'tv';

  g.add(stem, bezel, screen);
  return g;
}

export function buildDetailedKitchenGroup(): THREE.Group {
  const g = new THREE.Group();
  g.userData.interact = 'cook';

  const cabinetMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.45 });
  const counterMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.35, metalness: 0.2 });
  const steelMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.78, roughness: 0.24 });
  const fridgeMat = new THREE.MeshPhysicalMaterial({ color: '#cbd5e1', metalness: 0.45, roughness: 0.25, clearcoat: 0.5 });

  // Counter & Stove Base
  const baseGeo = new THREE.ExtrudeGeometry(createRoundedRectShape(2.4, 1.1, 0.12), {
    depth: 0.88,
    bevelEnabled: true,
    bevelSize: 0.02,
    bevelThickness: 0.02,
    bevelSegments: 2,
  });
  baseGeo.rotateX(-Math.PI / 2);
  const base = new THREE.Mesh(baseGeo, cabinetMat);
  base.userData.interact = 'cook';
  g.add(base);

  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(2.46, 0.08, 1.16), counterMat);
  counterTop.position.y = 0.92;
  counterTop.userData.interact = 'cook';
  g.add(counterTop);

  // 4 Stove Burners + Metallic Pot ("Panela de Funge")
  [
    [-0.45, -0.2],
    [0.25, -0.2],
    [-0.45, 0.22],
    [0.25, 0.22],
  ].forEach(([bx, bz]) => {
    const burner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.16, 0.03, 12),
      new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.4 }),
    );
    burner.position.set(bx, 0.97, bz);
    g.add(burner);
  });

  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.22, 14), steelMat);
  pot.position.set(-0.45, 1.09, 0.22);
  pot.userData.interact = 'cook';
  const potLid = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.4), steelMat);
  potLid.position.set(-0.45, 1.16, 0.22);
  g.add(pot, potLid);

  // Rounded Refrigerator next to counter
  const fridgeGeo = new THREE.ExtrudeGeometry(createRoundedRectShape(1.05, 1.02, 0.18), {
    depth: 2.25,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 2,
  });
  fridgeGeo.rotateX(-Math.PI / 2);
  const fridge = new THREE.Mesh(fridgeGeo, fridgeMat);
  fridge.position.set(1.85, 0, -0.05);
  fridge.userData.interact = 'cook';
  const handleTop = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.42, 4, 8), steelMat);
  handleTop.position.set(1.5, 1.65, 0.51);
  const handleBot = handleTop.clone();
  handleBot.position.y = 0.78;
  g.add(fridge, handleTop, handleBot);

  return g;
}

export function buildCoffeeTableGroup(): THREE.Group {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.55 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.07, 18), woodMat);
  top.scale.set(1.35, 1, 0.85);
  top.position.y = 0.4;
  top.castShadow = true;
  g.add(top);

  [-0.55, 0.55].forEach((lx) => {
    [-0.28, 0.28].forEach((lz) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.4, 8), woodMat);
      leg.position.set(lx, 0.2, lz);
      g.add(leg);
    });
  });

  // Ceramic mug & coaster
  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.07, 0.14, 10),
    new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.3 }),
  );
  mug.position.set(0.25, 0.5, 0.05);
  const book = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.045, 0.24),
    new THREE.MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.7 }),
  );
  book.position.set(-0.26, 0.46, -0.08);
  book.rotation.y = 0.28;
  g.add(mug, book);

  return g;
}

export function buildPottedPlantGroup(scale = 1): THREE.Group {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.19, 0.42, 12),
    new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.75 }),
  );
  pot.position.y = 0.21;
  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.04, 12),
    new THREE.MeshStandardMaterial({ color: '#3f2718', roughness: 0.95 }),
  );
  soil.position.y = 0.41;
  g.add(pot, soil);

  const leafMat = new THREE.MeshStandardMaterial({
    color: '#16a34a',
    roughness: 0.6,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.34, 4, 8), leafMat);
    leaf.scale.set(1.2, 1, 0.28);
    leaf.position.set(Math.cos(a) * 0.18, 0.64 + (i % 2) * 0.08, Math.sin(a) * 0.18);
    leaf.rotation.z = -Math.cos(a) * 0.52;
    leaf.rotation.x = Math.sin(a) * 0.52;
    g.add(leaf);
  }
  g.scale.setScalar(scale);
  return g;
}

export function buildPaneledDoorGroup(accentHex = '#16a34a'): THREE.Group {
  const g = new THREE.Group();
  g.userData.interact = 'exit';

  const frameMat = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.65 });
  const doorMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    roughness: 0.48,
    emissive: accentHex,
    emissiveIntensity: 0.12,
  });
  const brassMat = new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.85, roughness: 0.2 });

  // Outer door frame pillars & lintel
  const leftJamb = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.75, 0.36), frameMat);
  leftJamb.position.set(-1.05, 1.38, 0);
  const rightJamb = leftJamb.clone();
  rightJamb.position.x = 1.05;
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.16, 0.36), frameMat);
  lintel.position.set(0, 2.68, 0);

  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.94, 2.58, 0.18), doorMat);
  panel.position.y = 1.3;
  panel.userData.interact = 'exit';

  // Brass handle
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), brassMat);
  handle.position.set(0.68, 1.22, -0.13);
  const handleOut = handle.clone();
  handleOut.position.z = 0.13;

  // Coir welcome mat
  const welcomeMat = new THREE.Mesh(
    new THREE.BoxGeometry(1.75, 0.03, 0.9),
    new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.95 }),
  );
  welcomeMat.position.set(0, 0.02, -0.65);

  g.add(leftJamb, rightJamb, lintel, panel, handle, handleOut, welcomeMat);
  return g;
}

export function buildOfficeChairGroup(accentColor: string): THREE.Group {
  const g = new THREE.Group();
  const darkMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.5, roughness: 0.4 });
  const cushionMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.7 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.06, 12), darkMat);
  base.position.y = 0.03;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.36, 8), darkMat);
  stem.position.y = 0.22;
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.3, 0.1, 14), cushionMat);
  seat.position.y = 0.42;
  const backrest = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.34, 5, 10), cushionMat);
  backrest.scale.set(1.2, 1, 0.38);
  backrest.position.set(0, 0.72, 0.26);

  g.add(base, stem, seat, backrest);
  return g;
}
