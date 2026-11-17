import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SKIN_TONES } from '../game/angolaData';
import { buildCharacterGroup } from '../game/models3d';
import {
  BeardStyle,
  BodyBuild,
  CharacterAppearance,
  Gender,
  HairStyle,
  OutfitStyle,
} from '../game/types';

interface CharacterCreatorProps {
  initialAppearance: CharacterAppearance;
  onConfirm: (appearance: CharacterAppearance) => void;
  onBack: () => void;
}

type TabId = 'identidade' | 'rosto' | 'cabelo' | 'estilo';

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({
  initialAppearance,
  onConfirm,
  onBack,
}) => {
  const [form, setForm] = useState<CharacterAppearance>(initialAppearance);
  const [tab, setTab] = useState<TabId>('identidade');
  const [previewPose, setPreviewPose] = useState<'idle' | 'dance'>('idle');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let isSoftwareGl = false;
    try {
      const probe = document.createElement('canvas');
      const glProbe = probe.getContext('webgl2') || probe.getContext('webgl');
      if (!glProbe) {
        isSoftwareGl = true;
      } else {
        const ext = glProbe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : glProbe.RENDERER;
        const rendererStr = String(glProbe.getParameter(param) || '');
        glProbe.getExtension('WEBGL_lose_context')?.loseContext();
        isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
      }
    } catch {
      isSoftwareGl = false;
    }

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isSoftwareGl, alpha: true });
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#17120e');

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 40);
    camera.position.set(0, 1.45, 4.1);
    camera.lookAt(0, 1.05, 0);

    const hemi = new THREE.HemisphereLight('#fff7ed', '#334155', 1.15);
    scene.add(hemi);
    const key = new THREE.DirectionalLight('#ffffff', 1.35);
    key.position.set(2.5, 4.5, 3.5);
    scene.add(key);
    const rim = new THREE.DirectionalLight('#f59e0b', 0.65);
    rim.position.set(-2.5, 2.2, -2.5);
    scene.add(rim);

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.05, 0.12, 24),
      new THREE.MeshStandardMaterial({ color: '#292524', roughness: 0.7 }),
    );
    pedestal.position.y = -0.06;
    scene.add(pedestal);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 0.98, 32),
      new THREE.MeshBasicMaterial({ color: '#f59e0b', side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    const character = buildCharacterGroup(form);
    scene.add(character);

    let frameId = 0;
    let timerId = 0;
    let disposed = false;

    const drawFrame = (nowMs: number) => {
      if (disposed) return;
      const t = nowMs * 0.001;
      character.rotation.y = previewPose === 'dance' ? Math.sin(t * 2.5) * 0.6 : 0.35;
      const limbs = character.userData.limbs as
        | { armLeft: THREE.Group; armRight: THREE.Group; legLeft: THREE.Group; legRight: THREE.Group }
        | undefined;
      if (limbs) {
        if (previewPose === 'dance') {
          limbs.armLeft.rotation.x = Math.sin(t * 9) * 0.65 - 0.3;
          limbs.armRight.rotation.x = -Math.sin(t * 9) * 0.65 - 0.3;
          limbs.legLeft.rotation.x = -Math.sin(t * 9) * 0.35;
          limbs.legRight.rotation.x = Math.sin(t * 9) * 0.35;
          character.position.y = Math.abs(Math.sin(t * 9)) * 0.08;
        } else {
          limbs.armLeft.rotation.x = 0;
          limbs.armRight.rotation.x = 0;
          limbs.legLeft.rotation.x = 0;
          limbs.legRight.rotation.x = 0;
          character.position.y = 0;
        }
      }
      renderer.render(scene, camera);
      if (previewPose === 'dance') {
        timerId = window.setTimeout(() => {
          if (!disposed) frameId = requestAnimationFrame(drawFrame);
        }, isSoftwareGl ? 90 : 32);
      }
    };

    const syncSize = () => {
      const cw = Math.max(240, container.clientWidth || 380);
      const ch = Math.max(220, container.clientHeight || 420);
      renderer.setSize(cw, ch, false);
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    syncSize();
    window.addEventListener('resize', syncSize);

    drawFrame(performance.now());

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(timerId);
      window.removeEventListener('resize', syncSize);
      renderer.dispose();
    };
  }, [form, previewPose]);

  const updateField = <K extends keyof CharacterAppearance>(key: K, value: CharacterAppearance[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applyOutfitPreset = (outfit: OutfitStyle) => {
    const map: Record<OutfitStyle, { shirt: string; pants: string; shoe: string }> = {
      urbano_luanda: { shirt: '#f59e0b', pants: '#1e293b', shoe: '#f8fafc' },
      samakaka_tradicional: { shirt: '#991b1b', pants: '#111827', shoe: '#78350f' },
      executivo: { shirt: '#f8fafc', pants: '#0f172a', shoe: '#18181b' },
      desportivo: { shirt: '#16a34a', pants: '#0f172a', shoe: '#ef4444' },
      festa_kuduro: { shirt: '#9333ea', pants: '#18181b', shoe: '#fbbf24' },
    };
    const p = map[outfit];
    setForm((prev) => ({
      ...prev,
      outfit,
      shirtColor: p.shirt,
      pantsColor: p.pants,
      shoeColor: p.shoe,
    }));
  };

  return (
    <div className="fixed inset-0 z-30 bg-[#120e0b]/95 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
      {/* Left: Live 3D Character Preview */}
      <div className="relative w-full md:w-[44%] h-[340px] md:h-full bg-[#1a130e] border-b md:border-b-0 md:border-r border-[#f59e0b]/20 flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <div>
            <h1 className="text-xl font-bold text-[#fbbf24]">Criar Personagem</h1>
            <p className="text-xs text-[#cbd5e1]">Pré-visualização 3D da Banda</p>
          </div>
          <button
            type="button"
            onClick={() => setPreviewPose((p) => (p === 'idle' ? 'dance' : 'idle'))}
            className="px-3 py-1.5 rounded-md bg-[#2a211b] hover:bg-[#3a2d24] text-xs font-semibold text-[#faf6ef] border border-white/15 cursor-pointer"
          >
            {previewPose === 'dance' ? 'Parar Dança' : 'Testar Dança'}
          </button>
        </div>

        <div ref={containerRef} className="flex-1 w-full min-h-[220px] relative">
          <canvas
            ref={canvasRef}
            data-testid="creator-3d-canvas"
            className="w-full h-full block"
          />
        </div>

        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-[#cbd5e1]">
          <span>
            {form.firstName} {form.lastName} · {form.age} anos · {form.gender}
          </span>
          <span className="text-[#fbbf24] font-semibold">Luanda, Angola</span>
        </div>
      </div>

      {/* Right: Customization Form */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#14100d]">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 p-4 border-b border-white/10">
          {(
            [
              ['identidade', 'Identidade'],
              ['rosto', 'Rosto & Corpo'],
              ['cabelo', 'Cabelo & Barba'],
              ['estilo', 'Roupas & Acessórios'],
            ] as [TabId, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                tab === id
                  ? 'bg-[#f59e0b] text-[#120e0b]'
                  : 'bg-[#221b16] text-[#e7dfd3] hover:bg-[#2f251e]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto banda-scroll p-6 space-y-6">
          {tab === 'identidade' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
              <div>
                <label htmlFor="cc-first-name" className="block text-sm font-medium text-[#e7dfd3] mb-1.5">
                  Nome Próprio
                </label>
                <input
                  id="cc-first-name"
                  type="text"
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#1e1813] border border-white/15 text-[#faf6ef] focus:outline-none focus:border-[#f59e0b]"
                />
              </div>

              <div>
                <label htmlFor="cc-last-name" className="block text-sm font-medium text-[#e7dfd3] mb-1.5">
                  Apelido
                </label>
                <input
                  id="cc-last-name"
                  type="text"
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#1e1813] border border-white/15 text-[#faf6ef] focus:outline-none focus:border-[#f59e0b]"
                />
              </div>

              <div>
                <label htmlFor="cc-age" className="block text-sm font-medium text-[#e7dfd3] mb-1.5">
                  Idade ({form.age} anos)
                </label>
                <input
                  id="cc-age"
                  type="range"
                  min={18}
                  max={60}
                  value={form.age}
                  onChange={(e) => updateField('age', Number(e.target.value))}
                  className="w-full accent-[#f59e0b]"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-[#e7dfd3] mb-1.5">Sexo</span>
                <div className="flex gap-2">
                  {(['Masculino', 'Feminino'] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => updateField('gender', g)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border cursor-pointer ${
                        form.gender === g
                          ? 'bg-[#f59e0b] text-[#120e0b] border-[#f59e0b]'
                          : 'bg-[#1e1813] text-[#e7dfd3] border-white/15'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'rosto' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <span className="block text-sm font-medium text-[#e7dfd3] mb-2">Tom de Pele</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {SKIN_TONES.map((tone) => (
                    <button
                      key={tone.color}
                      type="button"
                      onClick={() => updateField('skinTone', tone.color)}
                      aria-label={tone.label}
                      className={`p-2 rounded-lg border text-center cursor-pointer ${
                        form.skinTone === tone.color ? 'border-[#f59e0b] bg-[#2a211b]' : 'border-white/10 bg-[#1e1813]'
                      }`}
                    >
                      <span
                        className="block w-8 h-8 rounded-full mx-auto mb-1 border border-white/20"
                        style={{ backgroundColor: tone.color }}
                      />
                      <span className="text-[11px] text-[#cbd5e1] block truncate">{tone.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="cc-face" className="block text-sm font-medium text-[#e7dfd3] mb-1.5">
                    Formato do Rosto
                  </label>
                  <select
                    id="cc-face"
                    value={form.faceShape}
                    onChange={(e) => updateField('faceShape', e.target.value as CharacterAppearance['faceShape'])}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#1e1813] border border-white/15 text-[#faf6ef]"
                  >
                    <option value="oval">Oval Equilibrado</option>
                    <option value="angular">Angular Definido</option>
                    <option value="redondo">Redondo Suave</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="cc-eyes" className="block text-sm font-medium text-[#e7dfd3] mb-1.5">
                    Cor dos Olhos
                  </label>
                  <select
                    id="cc-eyes"
                    value={form.eyeColor}
                    onChange={(e) => updateField('eyeColor', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#1e1813] border border-white/15 text-[#faf6ef]"
                  >
                    <option value="#23160f">Castanho Escuro</option>
                    <option value="#654321">Mel / Âmbar</option>
                    <option value="#1e3a8a">Azul Profundo</option>
                    <option value="#14532d">Verde Esmeralda</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="cc-height" className="block text-sm font-medium text-[#e7dfd3] mb-1.5">
                    Altura ({Math.round(form.height * 175)} cm)
                  </label>
                  <input
                    id="cc-height"
                    type="range"
                    min={0.92}
                    max={1.08}
                    step={0.02}
                    value={form.height}
                    onChange={(e) => updateField('height', Number(e.target.value))}
                    className="w-full accent-[#f59e0b]"
                  />
                </div>

                <div>
                  <span className="block text-sm font-medium text-[#e7dfd3] mb-1.5">Tipo de Corpo</span>
                  <div className="flex gap-2">
                    {(['esguio', 'atletico', 'robusto'] as BodyBuild[]).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => updateField('bodyBuild', b)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize border cursor-pointer ${
                          form.bodyBuild === b
                            ? 'bg-[#f59e0b] text-[#120e0b] border-[#f59e0b]'
                            : 'bg-[#1e1813] text-[#e7dfd3] border-white/15'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'cabelo' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <span className="block text-sm font-medium text-[#e7dfd3] mb-2">Cabelo & Penteado</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(
                    [
                      ['corte_baixo', 'Corte Baixo / Régua'],
                      ['afro', 'Afro Natural'],
                      ['trancas', 'Tranças Angolanas'],
                      ['dreads', 'Dreadlocks'],
                      ['ondulado', 'Ondulado Médio'],
                      ['coque', 'Coque Alto'],
                    ] as [HairStyle, string][]
                  ).map(([style, label]) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => updateField('hairStyle', style)}
                      className={`py-2.5 px-3 rounded-lg text-sm font-medium border cursor-pointer ${
                        form.hairStyle === style
                          ? 'bg-[#f59e0b] text-[#120e0b] border-[#f59e0b]'
                          : 'bg-[#1e1813] text-[#e7dfd3] border-white/15'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="cc-hair-color" className="block text-sm font-medium text-[#e7dfd3] mb-1.5">
                    Cor do Cabelo
                  </label>
                  <select
                    id="cc-hair-color"
                    value={form.hairColor}
                    onChange={(e) => updateField('hairColor', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#1e1813] border border-white/15 text-[#faf6ef]"
                  >
                    <option value="#151210">Preto Natural</option>
                    <option value="#3f2718">Castanho Escuro</option>
                    <option value="#b45309">Descolorido Dourado</option>
                    <option value="#991b1b">Borgonha</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="cc-beard" className="block text-sm font-medium text-[#e7dfd3] mb-1.5">
                    Estilo de Barba
                  </label>
                  <select
                    id="cc-beard"
                    value={form.beardStyle}
                    onChange={(e) => updateField('beardStyle', e.target.value as BeardStyle)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#1e1813] border border-white/15 text-[#faf6ef]"
                  >
                    <option value="nenhuma">Sem Barba</option>
                    <option value="desenhada">Barba Desenhada</option>
                    <option value="cavanhaque">Cavanhaque</option>
                    <option value="barba_cheia">Barba Cheia</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {tab === 'estilo' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <span className="block text-sm font-medium text-[#e7dfd3] mb-2">Conjunto de Roupa</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(
                    [
                      ['urbano_luanda', 'Urbano Luanda'],
                      ['samakaka_tradicional', 'Samakaka Tradicional'],
                      ['executivo', 'Executivo Baixa'],
                      ['desportivo', 'Desportivo / Pelado'],
                      ['festa_kuduro', 'Noite Kuduro'],
                    ] as [OutfitStyle, string][]
                  ).map(([outfit, label]) => (
                    <button
                      key={outfit}
                      type="button"
                      onClick={() => applyOutfitPreset(outfit)}
                      className={`py-2.5 px-3 rounded-lg text-sm font-medium border cursor-pointer ${
                        form.outfit === outfit
                          ? 'bg-[#f59e0b] text-[#120e0b] border-[#f59e0b]'
                          : 'bg-[#1e1813] text-[#e7dfd3] border-white/15'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="cc-shirt" className="block text-xs font-medium text-[#cbd5e1] mb-1">
                    Cor da Camisa
                  </label>
                  <input
                    id="cc-shirt"
                    type="color"
                    value={form.shirtColor}
                    onChange={(e) => updateField('shirtColor', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer bg-[#1e1813] border border-white/15"
                  />
                </div>
                <div>
                  <label htmlFor="cc-pants" className="block text-xs font-medium text-[#cbd5e1] mb-1">
                    Cor das Calças
                  </label>
                  <input
                    id="cc-pants"
                    type="color"
                    value={form.pantsColor}
                    onChange={(e) => updateField('pantsColor', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer bg-[#1e1813] border border-white/15"
                  />
                </div>
                <div>
                  <label htmlFor="cc-shoes" className="block text-xs font-medium text-[#cbd5e1] mb-1">
                    Sapatos / Ténis
                  </label>
                  <input
                    id="cc-shoes"
                    type="color"
                    value={form.shoeColor}
                    onChange={(e) => updateField('shoeColor', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer bg-[#1e1813] border border-white/15"
                  />
                </div>
              </div>

              <div>
                <span className="block text-sm font-medium text-[#e7dfd3] mb-2">Acessórios</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => updateField('hasWatch', !form.hasWatch)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer ${
                      form.hasWatch ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#fbbf24]' : 'bg-[#1e1813] border-white/15 text-[#cbd5e1]'
                    }`}
                  >
                    Relógio {form.hasWatch ? '✓' : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('hasChain', !form.hasChain)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer ${
                      form.hasChain ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#fbbf24]' : 'bg-[#1e1813] border-white/15 text-[#cbd5e1]'
                    }`}
                  >
                    Corrente {form.hasChain ? '✓' : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('hasCap', !form.hasCap)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer ${
                      form.hasCap ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#fbbf24]' : 'bg-[#1e1813] border-white/15 text-[#cbd5e1]'
                    }`}
                  >
                    Boné {form.hasCap ? '✓' : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('hasGlasses', !form.hasGlasses)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer ${
                      form.hasGlasses ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#fbbf24]' : 'bg-[#1e1813] border-white/15 text-[#cbd5e1]'
                    }`}
                  >
                    Óculos Escuros {form.hasGlasses ? '✓' : ''}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between gap-3 bg-[#120e0b]">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-lg bg-[#221b16] hover:bg-[#2f251e] text-sm font-semibold text-[#e7dfd3] cursor-pointer"
          >
            Voltar
          </button>
          <button
            type="button"
            data-start="true"
            onClick={() => onConfirm(form)}
            className="px-6 py-2.5 rounded-lg bg-[#f59e0b] hover:bg-[#fbbf24] text-[#120e0b] text-sm font-bold cursor-pointer"
          >
            Entrar na Banda
          </button>
        </div>
      </div>
    </div>
  );
};
