// Effets de mission : tweens, particules d'XP, zoom, rebond, surbrillance. Aucune allocation pendant le jeu.
import * as THREE from 'three';
import type { FxContext } from '../three/MathSceneEngine.ts';

export const ease = {
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  outBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
};

interface Tween { t: number; dur: number; ease: (t: number) => number; update: (k: number) => void; done?: () => void }
interface Orb { alive: boolean; p: THREE.Vector3; v: THREE.Vector3; life: number }

const ORB_LIFE_S = 0.9;
const GRAVITY = 4.5;

export class MissionFx {
  private tweens = new Set<Tween>();
  private unsub: () => void;
  private orbs: THREE.InstancedMesh;
  private orbState: Orb[];
  private dummy = new THREE.Object3D();
  private highlighted = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  private bounceBase = new Map<THREE.Object3D, THREE.Vector3>();

  constructor(private ctx: FxContext, private reduced: boolean, accentHex: string) {
    const count = ctx.isSoftwareGl ? 16 : 64;
    this.orbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: accentHex }), count);
    this.orbs.frustumCulled = false;
    this.orbState = Array.from({ length: count }, () => ({ alive: false, p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0 }));
    this.dummy.scale.setScalar(0);
    this.dummy.updateMatrix();
    for (let i = 0; i < count; i++) this.orbs.setMatrixAt(i, this.dummy.matrix);
    ctx.scene.add(this.orbs);
    this.unsub = ctx.onFrame((dt) => this.update(dt));
  }

  tween(dur: number, update: (k: number) => void, easeFn: (t: number) => number = ease.outCubic, done?: () => void) {
    this.tweens.add({ t: 0, dur, ease: easeFn, update, done });
  }

  burst(origin: { x: number; y: number; z: number }) {
    if (this.reduced) return;
    for (const o of this.orbState) {
      o.alive = true;
      o.life = ORB_LIFE_S;
      o.p.set(origin.x, origin.y, origin.z);
      o.v.set((Math.random() - 0.5) * 3, 2 + Math.random() * 2.5, (Math.random() - 0.5) * 3);
    }
  }

  punchZoom() {
    if (this.reduced) return;
    const cam = this.ctx.camera;
    this.tween(0.5, (k) => {
      cam.zoom = 1 + Math.sin(k * Math.PI) * 0.07;
      cam.updateProjectionMatrix();
    }, ease.inOutSine);
  }

  bounce(tag: string) {
    const obj = this.ctx.findByTag(tag) ?? this.ctx.modelGroup;
    let base = this.bounceBase.get(obj);
    if (!base) {
      base = obj.scale.clone();
      this.bounceBase.set(obj, base);
    }
    const b = base;
    this.tween(0.6, (k) => obj.scale.copy(b).multiplyScalar(1 + Math.sin(k * Math.PI) * 0.18), ease.outCubic, () => {
      obj.scale.copy(b);
      this.bounceBase.delete(obj);
    });
  }

  highlight(tag: string, hex: string) {
    const obj = this.ctx.findByTag(tag);
    if (!(obj instanceof THREE.Mesh) || this.highlighted.has(obj) || Array.isArray(obj.material)) return;
    if (!('emissive' in obj.material)) return;
    this.highlighted.set(obj, obj.material);
    const m = (obj.material as THREE.MeshStandardMaterial).clone();
    m.emissive = new THREE.Color(hex);
    m.emissiveIntensity = 0.7;
    obj.material = m; // clone : les matériaux du moteur sont partagés entre objets
  }

  clearHighlights() {
    for (const [mesh, original] of this.highlighted) {
      (mesh.material as THREE.Material).dispose();
      mesh.material = original;
    }
    this.highlighted.clear();
  }

  aliveOrbs(): number {
    return this.orbState.filter((o) => o.alive).length;
  }

  private update(dt: number) {
    for (const tw of this.tweens) {
      tw.t = Math.min(1, tw.t + dt / tw.dur);
      tw.update(tw.ease(tw.t));
      if (tw.t >= 1) {
        this.tweens.delete(tw);
        tw.done?.();
      }
    }
    let dirty = false;
    for (let i = 0; i < this.orbState.length; i++) {
      const o = this.orbState[i];
      if (!o.alive) continue;
      dirty = true;
      o.v.y -= GRAVITY * dt;
      o.p.addScaledVector(o.v, dt);
      o.life -= dt;
      if (o.life <= 0) o.alive = false;
      this.dummy.position.copy(o.p);
      this.dummy.scale.setScalar(o.alive ? o.life / ORB_LIFE_S : 0);
      this.dummy.updateMatrix();
      this.orbs.setMatrixAt(i, this.dummy.matrix);
    }
    if (dirty) this.orbs.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.unsub();
    for (const [obj, base] of this.bounceBase) obj.scale.copy(base);
    this.bounceBase.clear();
    this.tweens.clear();
    this.clearHighlights();
    this.ctx.scene.remove(this.orbs);
    this.orbs.dispose();
    this.orbs.geometry.dispose();
    (this.orbs.material as THREE.Material).dispose();
    this.ctx.camera.zoom = 1;
    this.ctx.camera.updateProjectionMatrix();
  }
}
