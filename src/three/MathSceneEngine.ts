import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type CameraPreset = 'perspective' | 'top' | 'front' | 'iso';

export interface SceneParams {
  preset: string;
  a: number;
  b: number;
  c: number;
  explode: number;
  showGrid: boolean;
  darkMode: boolean;
  accentHex: string;
}

export interface LiveMathReadout {
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  formulaLive: string;
}

export interface ParamMetadata {
  labelA: string;
  minA: number;
  maxA: number;
  stepA: number;
  labelB: string;
  minB: number;
  maxB: number;
  stepB: number;
  labelC: string;
  minC: number;
  maxC: number;
  stepC: number;
}

export function getParamMetadataForPreset(preset: string): ParamMetadata {
  switch (preset) {
    case 'fractions_3d':
      return {
        labelA: 'Parts sélectionnées (a)',
        minA: 1,
        maxA: 12,
        stepA: 1,
        labelB: 'Dénominateur total (b)',
        minB: 2,
        maxB: 12,
        stepB: 1,
        labelC: 'Échelle hauteur',
        minC: 0.6,
        maxC: 2,
        stepC: 0.1,
      };
    case 'volumes_6e':
      return {
        labelA: 'Longueur L (cm)',
        minA: 1,
        maxA: 6,
        stepA: 1,
        labelB: 'Largeur l (cm)',
        minB: 1,
        maxB: 5,
        stepB: 1,
        labelC: 'Hauteur h (cm)',
        minC: 1,
        maxC: 5,
        stepC: 1,
      };
    case 'pythagore_4e':
      return {
        labelA: 'Côté a (cm)',
        minA: 1.5,
        maxA: 4.5,
        stepA: 0.5,
        labelB: 'Côté b (cm)',
        minB: 1.5,
        maxB: 4.5,
        stepB: 0.5,
        labelC: 'Élévation 3D',
        minC: 0,
        maxC: 1.5,
        stepC: 0.1,
      };
    case 'trigonometrie_3e':
      return {
        labelA: 'Angle θ (°)',
        minA: 10,
        maxA: 80,
        stepA: 1,
        labelB: 'Rayon R',
        minB: 2,
        maxB: 5,
        stepB: 0.25,
        labelC: 'Épaisseur',
        minC: 0.5,
        maxC: 1.5,
        stepC: 0.1,
      };
    case 'sphere_3e':
      return {
        labelA: 'Rayon sphère R',
        minA: 1.5,
        maxA: 3.5,
        stepA: 0.1,
        labelB: 'Distance plan d',
        minB: 0,
        maxB: 3.2,
        stepB: 0.1,
        labelC: 'Transparence',
        minC: 0.4,
        maxC: 1,
        stepC: 0.1,
      };
    case 'integrales_term':
      return {
        labelA: 'Subdivisions Riemann (n)',
        minA: 3,
        maxA: 24,
        stepA: 1,
        labelB: 'Amplitude f(x)',
        minB: 0.6,
        maxB: 2.2,
        stepB: 0.1,
        labelC: 'Borne b',
        minC: 2,
        maxC: 4,
        stepC: 0.25,
      };
    case 'prediction_term':
      return {
        labelA: 'Poids pente w',
        minA: 0.5,
        maxA: 4,
        stepA: 0.1,
        labelB: 'Biais b',
        minB: -1.5,
        maxB: 1.5,
        stepB: 0.1,
        labelC: 'Taux α (EWMA)',
        minC: 0.1,
        maxC: 0.9,
        stepC: 0.05,
      };
    default:
      return {
        labelA: 'Paramètre a',
        minA: 0.5,
        maxA: 5,
        stepA: 0.1,
        labelB: 'Paramètre b',
        minB: 0.5,
        maxB: 5,
        stepB: 0.1,
        labelC: 'Paramètre c',
        minC: 0.5,
        maxC: 4,
        stepC: 0.1,
      };
  }
}

export function computeReadout(params: SceneParams): LiveMathReadout {
  const { preset, a, b, c } = params;
  switch (preset) {
    case 'fractions_3d': {
      const denom = Math.max(2, Math.round(b));
      const num = Math.min(denom, Math.max(1, Math.round(a)));
      const dec = (num / denom).toFixed(3);
      const pct = Math.round((num / denom) * 100);
      return {
        primaryLabel: 'Fraction active',
        primaryValue: `${num} / ${denom}`,
        secondaryLabel: 'Équivalent décimal',
        secondaryValue: `${dec} (${pct}%)`,
        formulaLive: `${num}/${denom} = ${dec}`,
      };
    }
    case 'volumes_6e': {
      const L = Math.round(a);
      const l = Math.round(b);
      const h = Math.round(c);
      const vol = L * l * h;
      return {
        primaryLabel: 'Volume V',
        primaryValue: `${vol} cm³`,
        secondaryLabel: 'Base × Hauteur',
        secondaryValue: `${L * l} cm² × ${h} cm`,
        formulaLive: `V = ${L} × ${l} × ${h} = ${vol}`,
      };
    }
    case 'pythagore_4e': {
      const hyp = Math.sqrt(a * a + b * b);
      return {
        primaryLabel: 'Hypoténuse c',
        primaryValue: `${hyp.toFixed(2)} cm`,
        secondaryLabel: 'Aires a² + b²',
        secondaryValue: `${(a * a).toFixed(1)} + ${(b * b).toFixed(1)} = ${(hyp * hyp).toFixed(1)}`,
        formulaLive: `${a.toFixed(1)}² + ${b.toFixed(1)}² = ${hyp.toFixed(2)}²`,
      };
    }
    case 'trigonometrie_3e': {
      const rad = THREE.MathUtils.degToRad(a);
      const cosV = Math.cos(rad);
      const sinV = Math.sin(rad);
      return {
        primaryLabel: 'cos(θ) / sin(θ)',
        primaryValue: `${cosV.toFixed(3)} / ${sinV.toFixed(3)}`,
        secondaryLabel: 'Identité cos² + sin²',
        secondaryValue: `${(cosV * cosV + sinV * sinV).toFixed(3)}`,
        formulaLive: `R·cos(${Math.round(a)}°) = ${(b * cosV).toFixed(2)}`,
      };
    }
    case 'sphere_3e': {
      const d = Math.min(a - 0.05, b);
      const rSec = Math.sqrt(Math.max(0, a * a - d * d));
      const vol = (4 / 3) * Math.PI * Math.pow(a, 3);
      return {
        primaryLabel: 'Rayon section r',
        primaryValue: `${rSec.toFixed(2)} cm`,
        secondaryLabel: 'Volume boule',
        secondaryValue: `${vol.toFixed(1)} cm³`,
        formulaLive: `r = √(${a.toFixed(1)}² - ${d.toFixed(1)}²) = ${rSec.toFixed(2)}`,
      };
    }
    case 'integrales_term': {
      const n = Math.max(3, Math.round(a));
      const upper = Math.max(1, c);
      const dx = upper / n;
      let riemann = 0;
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) * dx;
        riemann += b * (0.3 * x * x + 0.4) * dx;
      }
      const exact = b * (0.1 * Math.pow(upper, 3) + 0.4 * upper);
      return {
        primaryLabel: `Somme Riemann (n=${n})`,
        primaryValue: `${riemann.toFixed(3)} u.a.`,
        secondaryLabel: 'Intégrale exacte',
        secondaryValue: `${exact.toFixed(3)} u.a.`,
        formulaLive: `Δx = ${dx.toFixed(2)} · Erreur = ${Math.abs(exact - riemann).toFixed(3)}`,
      };
    }
    case 'prediction_term': {
      const sig = 1 / (1 + Math.exp(-(a * 0.8 + b)));
      return {
        primaryLabel: 'Prédiction σ(z)',
        primaryValue: `${Math.round(sig * 100)} %`,
        secondaryLabel: 'Taux d’oubli / EWMA α',
        secondaryValue: `${c.toFixed(2)}`,
        formulaLive: `σ(${(a * 0.8 + b).toFixed(2)}) = ${sig.toFixed(3)}`,
      };
    }
    default:
      return {
        primaryLabel: 'Paramètres actifs',
        primaryValue: `a=${a.toFixed(1)} · b=${b.toFixed(1)}`,
        secondaryLabel: 'Profondeur / c',
        secondaryValue: `${c.toFixed(1)}`,
        formulaLive: `f(${a.toFixed(1)}, ${b.toFixed(1)})`,
      };
  }
}

// Pre-allocated math helpers outside render loop (zero GC)
const _camTargetPos = new THREE.Vector3(6.5, 5.2, 7.5);
const _camTargetLook = new THREE.Vector3(0, 1.0, 0);

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createCoordinateGridTexture(dark: boolean, maxAniso: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = dark ? '#0f172a' : '#f1f5f9';
  ctx.fillRect(0, 0, size, size);

  // Subgrid
  ctx.strokeStyle = dark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(100, 116, 139, 0.15)';
  ctx.lineWidth = 1;
  const step = size / 8;
  for (let i = 0; i <= 8; i++) {
    const p = i * step;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  // Major border
  ctx.strokeStyle = dark ? 'rgba(148, 163, 184, 0.30)' : 'rgba(71, 85, 105, 0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.anisotropy = maxAniso;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.48
  );
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.42)');
  grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.16)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createVectorArrowGroup(
  from: THREE.Vector3,
  to: THREE.Vector3,
  color: number,
  radius = 0.06
): THREE.Group {
  const group = new THREE.Group();
  const dir = to.clone().sub(from);
  const len = Math.max(0.15, dir.length());
  const headLen = Math.min(0.35, len * 0.28);
  const shaftLen = Math.max(0.05, len - headLen);

  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.3,
    metalness: 0.45,
  });

  const shaftGeo = new THREE.CylinderGeometry(radius, radius, shaftLen, 16);
  const shaft = new THREE.Mesh(shaftGeo, mat);
  shaft.position.y = shaftLen / 2;
  shaft.castShadow = true;

  const headGeo = new THREE.ConeGeometry(radius * 2.3, headLen, 18);
  const head = new THREE.Mesh(headGeo, mat);
  head.position.y = shaftLen + headLen / 2;
  head.castShadow = true;

  group.add(shaft, head);
  group.position.copy(from);
  const up = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());
  group.quaternion.copy(quat);
  return group;
}

export class MathSceneEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private isSoftwareGl: boolean;
  private clock: THREE.Clock;
  private frameId = 0;
  private disposed = false;

  private modelGroup: THREE.Group;
  private animatedSubparts: Array<{ obj: THREE.Object3D; baseY: number; phase: number }> = [];
  private floorMesh: THREE.Mesh;
  private plinthGroup: THREE.Group;
  private contactShadow: THREE.Mesh;
  private axesGroup: THREE.Group;
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private pmremEnvTex: THREE.Texture;

  private params: SceneParams;
  private cameraTransitionActive = false;
  private onContextLostCb?: (lost: boolean) => void;

  constructor(
    container: HTMLElement,
    initialParams: SceneParams,
    onContextLost?: (lost: boolean) => void
  ) {
    this.container = container;
    this.params = { ...initialParams };
    this.onContextLostCb = onContextLost;
    this.isSoftwareGl = detectSoftwareWebGL();
    this.clock = new THREE.Clock();

    const width = Math.max(320, container.clientWidth);
    const height = Math.max(240, container.clientHeight);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);

    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored);

    this.scene = new THREE.Scene();
    const bgHex = this.params.darkMode ? 0x0b1120 : 0xf1f5f9;
    this.scene.background = new THREE.Color(bgHex);
    this.scene.fog = new THREE.FogExp2(bgHex, 0.024);

    // Mandatory studio reflection environment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremEnvTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.pmremEnvTex;
    pmremGenerator.dispose();

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
    this.camera.position.set(6.5, 5.2, 7.5);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1.0, 0);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 24;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04;
    this.controls.addEventListener('start', () => {
      this.cameraTransitionActive = false;
    });

    // Three-point studio lighting
    this.hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x334155, 0.7);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff7ed, 1.9);
    this.keyLight.position.set(7, 11, 6);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.left = -8;
    this.keyLight.shadow.camera.right = 8;
    this.keyLight.shadow.camera.top = 8;
    this.keyLight.shadow.camera.bottom = -8;
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 30;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.75);
    rimLight.position.set(-6, 5, -7);
    this.scene.add(rimLight);

    // Floor & Grounding Plinth
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const gridTex = createCoordinateGridTexture(this.params.darkMode, maxAniso);
    const floorMat = new THREE.MeshStandardMaterial({
      map: gridTex,
      roughness: 0.85,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    this.floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.y = -0.02;
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    this.plinthGroup = this.buildStudioPlinth();
    this.scene.add(this.plinthGroup);

    this.contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(7.2, 7.2),
      new THREE.MeshBasicMaterial({
        map: createContactShadowTexture(),
        transparent: true,
        depthWrite: false,
        opacity: 0.5,
      })
    );
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.y = 0.065;
    this.scene.add(this.contactShadow);

    this.axesGroup = this.buildAxesHelper();
    this.axesGroup.visible = this.params.showGrid;
    this.scene.add(this.axesGroup);

    this.modelGroup = new THREE.Group();
    this.modelGroup.position.y = 0.08;
    this.scene.add(this.modelGroup);

    this.rebuildModel();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.startLoop();
  }

  private buildStudioPlinth(): THREE.Group {
    const g = new THREE.Group();
    const baseMat = new THREE.MeshStandardMaterial({
      color: this.params.darkMode ? 0x1e293b : 0xe2e8f0,
      roughness: 0.65,
      metalness: 0.15,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.25,
      metalness: 0.85,
    });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.0, 0.08, 48), baseMat);
    disc.position.y = 0.02;
    disc.receiveShadow = true;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.82, 0.025, 12, 64), trimMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.06;
    g.add(disc, ring);
    return g;
  }

  private buildAxesHelper(): THREE.Group {
    const g = new THREE.Group();
    const len = 3.5;
    g.add(
      createVectorArrowGroup(new THREE.Vector3(0, 0.08, 0), new THREE.Vector3(len, 0.08, 0), 0xef4444, 0.02),
      createVectorArrowGroup(new THREE.Vector3(0, 0.08, 0), new THREE.Vector3(0, len, 0), 0x10b981, 0.02),
      createVectorArrowGroup(new THREE.Vector3(0, 0.08, 0), new THREE.Vector3(0, 0.08, len), 0x3b82f6, 0.02)
    );
    return g;
  }

  private clearModelGroup() {
    this.animatedSubparts = [];
    this.modelGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });
    while (this.modelGroup.children.length > 0) {
      this.modelGroup.remove(this.modelGroup.children[0]);
    }
  }

  public updateParams(next: Partial<SceneParams>) {
    const prevTheme = this.params.darkMode;
    const prevPreset = this.params.preset;
    const prevA = this.params.a;
    const prevB = this.params.b;
    const prevC = this.params.c;
    const prevExplode = this.params.explode;
    const prevAccent = this.params.accentHex;

    this.params = { ...this.params, ...next };
    this.axesGroup.visible = this.params.showGrid;

    if (prevTheme !== this.params.darkMode) {
      const bgHex = this.params.darkMode ? 0x0b1120 : 0xf1f5f9;
      this.scene.background = new THREE.Color(bgHex);
      this.scene.fog = new THREE.FogExp2(bgHex, 0.024);
      const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
      const mat = this.floorMesh.material as THREE.MeshStandardMaterial;
      mat.map?.dispose();
      mat.map = createCoordinateGridTexture(this.params.darkMode, maxAniso);
      mat.needsUpdate = true;

      // Update plinth color
      const disc = this.plinthGroup.children[0] as THREE.Mesh;
      (disc.material as THREE.MeshStandardMaterial).color.setHex(
        this.params.darkMode ? 0x1e293b : 0xe2e8f0
      );
    }

    if (
      prevPreset !== this.params.preset ||
      prevA !== this.params.a ||
      prevB !== this.params.b ||
      prevC !== this.params.c ||
      prevExplode !== this.params.explode ||
      prevAccent !== this.params.accentHex
    ) {
      this.rebuildModel();
    }
  }

  public setCameraPreset(preset: CameraPreset) {
    this.cameraTransitionActive = true;
    switch (preset) {
      case 'top':
        _camTargetPos.set(0.01, 10.5, 0.01);
        _camTargetLook.set(0, 0.5, 0);
        break;
      case 'front':
        _camTargetPos.set(0, 2.6, 9.5);
        _camTargetLook.set(0, 1.2, 0);
        break;
      case 'iso':
        _camTargetPos.set(7.5, 7.5, 7.5);
        _camTargetLook.set(0, 1.0, 0);
        break;
      case 'perspective':
      default:
        _camTargetPos.set(6.5, 5.2, 7.5);
        _camTargetLook.set(0, 1.0, 0);
        break;
    }
  }

  public resize() {
    if (this.disposed) return;
    const width = Math.max(320, this.container.clientWidth);
    const height = Math.max(240, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private rebuildModel() {
    this.clearModelGroup();

    const accent = new THREE.Color(this.params.accentHex || '#4f46e5');
    const accentMat = new THREE.MeshPhysicalMaterial({
      color: accent,
      roughness: 0.2,
      metalness: 0.35,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
    });
    const brushedMetalMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.32,
      metalness: 0.85,
    });
    const darkSlateMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.65,
      metalness: 0.2,
    });
    const warmBrassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.22,
      metalness: 0.9,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      roughness: 0.08,
      metalness: 0.05,
      transmission: this.isSoftwareGl ? 0 : 0.78,
      transparent: true,
      opacity: this.isSoftwareGl ? 0.38 : 1,
      ior: 1.5,
      thickness: 0.8,
      depthWrite: false,
    });

    const { preset, a, b, c, explode } = this.params;

    switch (preset) {
      case 'fractions_3d': {
        const denom = Math.max(2, Math.min(12, Math.round(b)));
        const num = Math.max(1, Math.min(denom, Math.round(a)));
        const totalWidth = 4.8;
        const sliceW = totalWidth / denom;
        const gap = 0.03 + explode * 0.22;
        const startX = -((denom - 1) * (sliceW + gap)) / 2;

        // Brass frame rail underneath
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(totalWidth + denom * gap + 0.4, 0.12, 1.5),
          darkSlateMat
        );
        rail.position.y = 0.06;
        rail.receiveShadow = true;
        this.modelGroup.add(rail);

        for (let i = 0; i < denom; i++) {
          const active = i < num;
          const h = active ? 1.5 * c : 1.15 * c;
          const slice = new THREE.Mesh(
            new THREE.BoxGeometry(sliceW * 0.92, h, 1.2),
            active ? accentMat : brushedMetalMat
          );
          slice.position.set(startX + i * (sliceW + gap), 0.12 + h / 2, 0);
          slice.castShadow = true;
          slice.receiveShadow = true;
          this.modelGroup.add(slice);
          if (active) {
            this.animatedSubparts.push({ obj: slice, baseY: slice.position.y, phase: i * 0.45 });
          }
        }
        break;
      }

      case 'volumes_6e': {
        const L = Math.max(1, Math.min(6, Math.round(a)));
        const l = Math.max(1, Math.min(5, Math.round(b)));
        const h = Math.max(1, Math.min(5, Math.round(c)));
        const count = L * l * h;
        const cubeSize = 0.58;
        const step = cubeSize + explode * 0.25 + 0.03;

        const geo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const inst = new THREE.InstancedMesh(geo, accentMat, count);
        inst.castShadow = true;
        inst.receiveShadow = true;

        const mat4 = new THREE.Matrix4();
        const color = new THREE.Color();
        let idx = 0;
        for (let y = 0; y < h; y++) {
          for (let z = 0; z < l; z++) {
            for (let x = 0; x < L; x++) {
              const px = (x - (L - 1) / 2) * step;
              const py = cubeSize / 2 + y * step;
              const pz = (z - (l - 1) / 2) * step;
              mat4.makeTranslation(px, py, pz);
              inst.setMatrixAt(idx, mat4);
              color.copy(accent).offsetHSL(y * 0.03, 0, (y - 1) * 0.06);
              inst.setColorAt(idx, color);
              idx++;
            }
          }
        }
        inst.instanceMatrix.needsUpdate = true;
        if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
        inst.computeBoundingSphere();
        this.modelGroup.add(inst);

        // Caliper brass frame showing outer bounds
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(L * step + 0.2, 0.08, l * step + 0.2),
          warmBrassMat
        );
        frame.position.y = 0.04;
        this.modelGroup.add(frame);
        break;
      }

      case 'pythagore_4e': {
        const sa = Math.max(1.0, Math.min(3.0, a * 0.65));
        const sb = Math.max(1.0, Math.min(3.0, b * 0.65));
        const sc = Math.sqrt(sa * sa + sb * sb);
        const thickness = 0.28;
        const elev = 0.15 + c * 0.45 + explode * 0.4;

        // Right triangle prism
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(sa, 0);
        shape.lineTo(0, sb);
        shape.closePath();

        const triGeo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 });
        const triMesh = new THREE.Mesh(triGeo, darkSlateMat);
        triMesh.rotation.x = -Math.PI / 2;
        triMesh.position.set(-sa / 2, elev, sb / 2);
        triMesh.castShadow = true;
        this.modelGroup.add(triMesh);

        // Square on side a
        const sqA = new THREE.Mesh(new THREE.BoxGeometry(sa, thickness, sa), accentMat);
        sqA.position.set(0, elev + thickness / 2, sb / 2 + sa / 2 + 0.05 + explode * 0.3);
        sqA.castShadow = true;
        this.modelGroup.add(sqA);

        // Square on side b
        const sqB = new THREE.Mesh(new THREE.BoxGeometry(sb, thickness, sb), warmBrassMat);
        sqB.position.set(-sa / 2 - sb / 2 - 0.05 - explode * 0.3, elev + thickness / 2, 0);
        sqB.castShadow = true;
        this.modelGroup.add(sqB);

        // Square on hypotenuse c
        const angle = Math.atan2(sb, sa);
        const sqC = new THREE.Mesh(new THREE.BoxGeometry(sc, thickness, sc), brushedMetalMat);
        const midX = 0;
        const midZ = 0;
        const nx = Math.sin(angle);
        const nz = -Math.cos(angle);
        const offset = sc / 2 + 0.06 + explode * 0.35;
        sqC.position.set(midX + nx * offset, elev + thickness / 2, midZ + nz * offset);
        sqC.rotation.y = angle;
        sqC.castShadow = true;
        this.modelGroup.add(sqC);
        break;
      }

      case 'trigonometrie_3e': {
        const radius = Math.max(1.5, Math.min(3.2, b * 0.72));
        const rad = THREE.MathUtils.degToRad(a);

        // Unit Circle Torus
        const torus = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.05, 16, 72), brushedMetalMat);
        torus.position.y = radius + 0.25;
        torus.castShadow = true;
        this.modelGroup.add(torus);

        // Origin & rotating radius arm
        const cy = radius + 0.25;
        const px = Math.cos(rad) * radius;
        const py = cy + Math.sin(rad) * radius;

        const arm = createVectorArrowGroup(
          new THREE.Vector3(0, cy, 0),
          new THREE.Vector3(px, py, 0),
          accent.getHex(),
          0.055
        );
        this.modelGroup.add(arm);

        // Cos horizontal bar
        const cosLen = Math.max(0.05, Math.abs(px));
        const cosBar = new THREE.Mesh(new THREE.BoxGeometry(cosLen, 0.09, 0.14), warmBrassMat);
        cosBar.position.set(px / 2, cy, 0);
        this.modelGroup.add(cosBar);

        // Sin vertical bar
        const sinLen = Math.max(0.05, Math.abs(py - cy));
        const sinBar = new THREE.Mesh(new THREE.BoxGeometry(0.09, sinLen, 0.14), accentMat);
        sinBar.position.set(px, cy + sinLen / 2, 0);
        this.modelGroup.add(sinBar);

        // Point sphere
        const marker = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 24), warmBrassMat);
        marker.position.set(px, py, 0);
        this.animatedSubparts.push({ obj: marker, baseY: py, phase: 0 });
        this.modelGroup.add(marker);
        break;
      }

      case 'sphere_3e': {
        const R = Math.max(1.2, Math.min(2.6, a * 0.75));
        const d = Math.min(R - 0.12, b * 0.75);
        const rSec = Math.sqrt(Math.max(0.02, R * R - d * d));
        const cy = R + 0.2;

        // Outer glass sphere
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(R, 36, 36), glassMat);
        sphere.position.y = cy;
        sphere.renderOrder = 3;
        this.modelGroup.add(sphere);

        // Center core
        const centerDot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), warmBrassMat);
        centerDot.position.y = cy;
        this.modelGroup.add(centerDot);

        // Secant plane disc
        const planeY = cy + d;
        const secantPlane = new THREE.Mesh(
          new THREE.BoxGeometry(R * 2.5, 0.03, R * 2.5),
          new THREE.MeshStandardMaterial({
            color: 0x64748b,
            transparent: true,
            opacity: 0.35,
            roughness: 0.4,
          })
        );
        secantPlane.position.y = planeY;
        this.modelGroup.add(secantPlane);

        // Intersection ring of radius rSec
        const ring = new THREE.Mesh(new THREE.TorusGeometry(rSec, 0.05, 16, 64), accentMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = planeY + 0.02;
        this.modelGroup.add(ring);

        // Right triangle inside: d vertical, r horizontal, R hypotenuse
        const dRod = createVectorArrowGroup(
          new THREE.Vector3(0, cy, 0),
          new THREE.Vector3(0, planeY, 0),
          0xf59e0b,
          0.03
        );
        const rRod = createVectorArrowGroup(
          new THREE.Vector3(0, planeY, 0),
          new THREE.Vector3(rSec, planeY, 0),
          accent.getHex(),
          0.03
        );
        const hypRod = createVectorArrowGroup(
          new THREE.Vector3(0, cy, 0),
          new THREE.Vector3(rSec, planeY, 0),
          0x94a3b8,
          0.025
        );
        this.modelGroup.add(dRod, rRod, hypRod);
        break;
      }

      case 'integrales_term': {
        const n = Math.max(3, Math.min(24, Math.round(a)));
        const upper = Math.max(2, Math.min(4, c));
        const widthTotal = 5.2;
        const dx = widthTotal / n;
        const startX = -widthTotal / 2;

        // Smooth analytical curve tube
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 48; i++) {
          const t = i / 48;
          const xWorld = startX + t * widthTotal;
          const xMath = t * upper;
          const yMath = b * (0.28 * xMath * xMath + 0.35);
          pts.push(new THREE.Vector3(xWorld, yMath + 0.1, 0));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.06, 12, false), warmBrassMat);
        tube.castShadow = true;
        this.modelGroup.add(tube);

        // Riemann prism bars
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n;
          const xWorld = startX + t * widthTotal;
          const xMath = t * upper;
          const hVal = Math.max(0.15, b * (0.28 * xMath * xMath + 0.35));
          const bar = new THREE.Mesh(
            new THREE.BoxGeometry(dx * 0.88, hVal, 1.1),
            i % 2 === 0 ? accentMat : brushedMetalMat
          );
          bar.position.set(xWorld, 0.1 + hVal / 2, explode * (i % 2 === 0 ? 0.25 : -0.25));
          bar.castShadow = true;
          bar.receiveShadow = true;
          this.modelGroup.add(bar);
        }
        break;
      }

      case 'prediction_term': {
        // 3D Sigmoid & Loss Optimization Landscape + Gradient Descent Nodes
        const segs = 28;
        const size = 4.8;
        const planeGeo = new THREE.PlaneGeometry(size, size, segs, segs);
        planeGeo.rotateX(-Math.PI / 2);
        const posAttr = planeGeo.attributes.position;
        const colors: number[] = [];
        const cLow = new THREE.Color(0x0ea5e9);
        const cHigh = accent.clone();
        const tmpColor = new THREE.Color();

        for (let i = 0; i < posAttr.count; i++) {
          const x = posAttr.getX(i);
          const z = posAttr.getZ(i);
          const logit = a * (x * 0.65) + b + 0.35 * Math.sin(z * 1.1);
          const sig = 1 / (1 + Math.exp(-logit));
          const y = 0.25 + sig * 2.4;
          posAttr.setY(i, y);
          tmpColor.copy(cLow).lerp(cHigh, sig);
          colors.push(tmpColor.r, tmpColor.g, tmpColor.b);
        }
        planeGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        planeGeo.computeVertexNormals();

        const surfaceMat = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.35,
          metalness: 0.25,
          side: THREE.DoubleSide,
        });
        const surface = new THREE.Mesh(planeGeo, surfaceMat);
        surface.castShadow = true;
        surface.receiveShadow = true;
        this.modelGroup.add(surface);

        // Gradient trajectory spheres along sigmoid slice z=0
        for (let k = -2; k <= 2; k++) {
          const x = k * 0.85;
          const logit = a * (x * 0.65) + b;
          const sig = 1 / (1 + Math.exp(-logit));
          const y = 0.25 + sig * 2.4 + 0.14 + explode * 0.4;
          const node = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 20), warmBrassMat);
          node.position.set(x, y, 0);
          node.castShadow = true;
          this.animatedSubparts.push({ obj: node, baseY: y, phase: k * 0.5 });
          this.modelGroup.add(node);
        }
        break;
      }

      case 'vecteurs_2nde':
      case 'produit_scalaire_1ere': {
        const u = new THREE.Vector3(a * 0.9, c * 0.8, 0.6);
        const angleRad = preset === 'produit_scalaire_1ere' ? THREE.MathUtils.degToRad(a * 12) : 0.9;
        const v = new THREE.Vector3(
          Math.cos(angleRad) * b * 0.9,
          0.6,
          Math.sin(angleRad) * b * 0.9
        );
        const sum = u.clone().add(v);
        const origin = new THREE.Vector3(0, 0.2, 0);

        this.modelGroup.add(createVectorArrowGroup(origin, origin.clone().add(u), accent.getHex(), 0.065));
        this.modelGroup.add(createVectorArrowGroup(origin, origin.clone().add(v), 0xf59e0b, 0.065));
        this.modelGroup.add(createVectorArrowGroup(origin, origin.clone().add(sum), 0x10b981, 0.075));

        const pivot = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 20), brushedMetalMat);
        pivot.position.copy(origin);
        this.modelGroup.add(pivot);
        break;
      }

      case 'pyramide_4e':
      case 'prisme_5e': {
        const radius = Math.max(0.8, Math.min(2.0, a * 0.7));
        const height = Math.max(1.4, Math.min(3.6, b * 0.95));
        const isPyramid = preset === 'pyramide_4e';

        // Outer translucent bounding prism/cylinder
        const outerGeo = isPyramid
          ? new THREE.BoxGeometry(radius * 2, height, radius * 2)
          : new THREE.CylinderGeometry(radius, radius, height, 32);
        const outer = new THREE.Mesh(outerGeo, glassMat);
        outer.position.y = height / 2 + 0.1 + explode * 0.6;
        outer.renderOrder = 2;
        this.modelGroup.add(outer);

        // Inner solid core
        const innerGeo = isPyramid
          ? new THREE.ConeGeometry(radius * 1.38, height, 4)
          : new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, height * 0.96, 32);
        const inner = new THREE.Mesh(innerGeo, accentMat);
        inner.position.y = height / 2 + 0.1;
        if (isPyramid) inner.rotation.y = Math.PI / 4;
        inner.castShadow = true;
        this.modelGroup.add(inner);

        // Height axis rod
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, height + 0.3, 12), warmBrassMat);
        rod.position.y = height / 2 + 0.1;
        this.modelGroup.add(rod);
        break;
      }

      default: {
        // Polyvalent 3D parametric mathematical surface & geometric orbital rig
        const segs = 24;
        const surfGeo = new THREE.PlaneGeometry(4.4, 4.4, segs, segs);
        surfGeo.rotateX(-Math.PI / 2);
        const pos = surfGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const z = pos.getZ(i);
          const val =
            0.35 * a * Math.cos(x * 0.9) * Math.cos(z * 0.9) +
            0.12 * b * (x * x - z * z) * 0.25 +
            1.2;
          pos.setY(i, Math.max(0.2, val));
        }
        surfGeo.computeVertexNormals();
        const surf = new THREE.Mesh(surfGeo, accentMat);
        surf.castShadow = true;
        surf.receiveShadow = true;
        this.modelGroup.add(surf);

        const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), warmBrassMat);
        core.position.set(0, 2.35 + explode * 0.5, 0);
        core.castShadow = true;
        this.animatedSubparts.push({ obj: core, baseY: core.position.y, phase: 0 });
        this.modelGroup.add(core);
        break;
      }
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private startLoop() {
    const tick = () => {
      if (this.disposed) return;
      const delta = Math.min(this.clock.getDelta(), 0.1);
      const elapsed = this.clock.getElapsedTime();

      if (this.cameraTransitionActive) {
        this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _camTargetPos.x, 5.5, delta);
        this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _camTargetPos.y, 5.5, delta);
        this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _camTargetPos.z, 5.5, delta);
        this.controls.target.x = THREE.MathUtils.damp(this.controls.target.x, _camTargetLook.x, 5.5, delta);
        this.controls.target.y = THREE.MathUtils.damp(this.controls.target.y, _camTargetLook.y, 5.5, delta);
        this.controls.target.z = THREE.MathUtils.damp(this.controls.target.z, _camTargetLook.z, 5.5, delta);
        if (this.camera.position.distanceTo(_camTargetPos) < 0.04) {
          this.cameraTransitionActive = false;
        }
      }

      for (let i = 0; i < this.animatedSubparts.length; i++) {
        const item = this.animatedSubparts[i];
        item.obj.position.y = item.baseY + Math.sin(elapsed * 1.8 + item.phase) * 0.06;
      }

      this.controls.update();
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.frameId = window.setTimeout(tick, 16);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.onContextLostCb?.(true);
  };

  private handleContextRestored = () => {
    this.onContextLostCb?.(false);
    this.startLoop();
  };

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);
    this.clearModelGroup();
    this.pmremEnvTex.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
