'use client';

/**
 * Runtime animasi template — satu-satunya tempat `animations[]` & `behaviours[]`
 * benar-benar dijalankan.
 *
 * Sebelumnya keduanya hanya DISIMPAN (import API + zustand) tapi tidak pernah
 * dieksekusi, jadi script dari template hasil import tidak pernah jalan.
 *
 * Kontrak deklaratif (tanpa boilerplate JS dari pembuat template):
 *   animations[] : { id, type, duration, delay, easing, trigger, target?, keyframes? }
 *     → runtime membuat @keyframes + kelas `.tpl-anim-<id>`, lalu menyalakannya
 *       sesuai `trigger`: onLoad (langsung), onScroll (IntersectionObserver,
 *       sekali menyala lalu berhenti observe), onHover/onClick (listener sekali).
 *       `target` = CSS selector, WAJIB untuk onScroll/onHover/onClick.
 *   behaviours[] : { script, trigger, target? }
 *     → script disanitasi lalu dieksekusi sekali. Jalur kustom; untuk animasi
 *       standar pakai `animations[]` saja.
 *
 * Keamanan: script disanitasi ulang di client dengan denylist yang sama dengan
 * server (`lib/builder/behaviour-script.ts`). Defense in depth, BUKAN sandbox.
 */

import { useEffect, useMemo, useRef } from 'react';
import type { AnimationConfig, BehaviourConfig } from '@/lib/builder/template-types';
import { sanitizeBehaviourScript, sanitizeTemplateCss } from '@/lib/builder/behaviour-script';

const KF_PREFIX = 'tpl-kf-';
const CLS_PREFIX = 'tpl-anim-';
const CLS_ON = 'tpl-anim-on';

/** Id dipakai sebagai nama kelas — bersihkan agar selector tetap valid. */
function clsOf(id: string): string {
  return CLS_PREFIX + String(id).replace(/[^a-zA-Z0-9_-]/g, '');
}

/** Keyframes bawaan per tipe, supaya template tidak wajib menulis CSS sendiri. */
function defaultKeyframes(type: AnimationConfig['type']): string | null {
  switch (type) {
    case 'fade':
      return 'from{opacity:0}to{opacity:1}';
    case 'slide':
      return 'from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}';
    case 'zoom':
      return 'from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}';
    case 'bounce':
      return (
        '0%{opacity:0;transform:scale(.9)}' +
        '60%{opacity:1;transform:scale(1.04)}' +
        '100%{opacity:1;transform:scale(1)}'
      );
    case 'custom':
      // Wajib menyertakan `keyframes` sendiri.
      return null;
    default:
      return null;
  }
}

function buildKeyframes(a: AnimationConfig): string | null {
  const raw = (a.keyframes ?? '').trim();
  if (raw) {
    // Dua bentuk diterima: blok `@keyframes` utuh, atau isi keyframe saja.
    return /@keyframes/i.test(raw) ? raw : `@keyframes ${KF_PREFIX}${clsOf(a.id)} { ${raw} }`;
  }
  const body = defaultKeyframes(a.type);
  return body ? `@keyframes ${KF_PREFIX}${clsOf(a.id)} { ${body} }` : null;
}

function buildCss(animations: AnimationConfig[]): string {
  const rules: string[] = [];
  const reduced: string[] = [];

  for (const a of animations) {
    const kf = buildKeyframes(a);
    if (!kf) continue;
    const name = KF_PREFIX + clsOf(a.id);
    const cls = '.' + clsOf(a.id);
    const duration = Number.isFinite(a.duration) ? a.duration : 600;
    const delay = Number.isFinite(a.delay) ? a.delay : 0;
    const easing = a.easing || 'ease-out';

    rules.push(kf);
    // Sembunyikan dulu, nyalakan saat class penanda ditambahkan.
    rules.push(`${cls}{opacity:0}`);
    rules.push(`${cls}.${CLS_ON}{animation:${name} ${duration}ms ${easing} ${delay}ms both}`);
    reduced.push(`${cls}{opacity:1!important;animation:none!important}`);
  }

  if (rules.length === 0) return '';
  rules.push(`@media (prefers-reduced-motion: reduce){${reduced.join('')}}`);
  return rules.join('\n');
}

export interface BehaviourRuntimeProps {
  animations?: AnimationConfig[] | null;
  behaviours?: BehaviourConfig[] | null;
  /**
   * CSS bebas milik template (`data.customCss` di template ZIP).
   *
   * Ini yang membuat AI bisa keluar dari 47 layout bawaan: glassmorphism,
   * neo-brutalism, neumorphism, claymorphism, bento grid, wave divider,
   * gradient text, dan variasi lain yang butuh `backdrop-filter`,
   * `box-shadow`, `clip-path`, atau `grid-template-areas` — semua hal yang
   * tidak pernah dihasilkan `SectionRenderer`.
   *
   * Sanitasi ulang di sini dengan `sanitizeTemplateCss()` (blokir `</style>`,
   * `@import`, `url()` non-`data:`). Berlaku untuk template bawaan maupun
   * template hasil import.
   */
  customCss?: string | null;
  /** Batasi pencarian selector ke elemen akar ini (kanvas editor). */
  root?: HTMLElement | null;
}

export function BehaviourRuntime({ animations, behaviours, customCss, root }: BehaviourRuntimeProps) {
  const anims = useMemo(() => (Array.isArray(animations) ? animations.filter(Boolean) : []), [animations]);
  const behaviourList = useMemo(
    () => (Array.isArray(behaviours) ? behaviours.filter(Boolean) : []),
    [behaviours],
  );

  // CSS kustom template digabung ke blok yang sama dengan @keyframes hasil
  // `animations[]` — satu tag <style>, bukan beberapa.
  // SCOPE: Semua CSS dibatasi ke #tpl-canvas agar tidak bocor ke UI builder (sidebar, topbar, dll).
  const css = useMemo(() => {
    const generated = buildCss(anims);
    const custom = customCss ? sanitizeTemplateCss(customCss) : '';
    const combined = [generated, custom].filter(Boolean).join('\n');
    
    // Scope all CSS to #tpl-canvas to prevent leakage into builder UI (sidebar, topbar, etc.)
    // We scope by prefixing all selectors with #tpl-canvas
    const scopedCss = combined
      .split('\n')
      .map((line) => {
        // Preserve @keyframes, @media, @layer, @supports, @supports, @font-face, @property, @import, @namespace, @page, @font-feature-values
        if (line.trim().startsWith('@')) return line;
        // Scope all selectors to #tpl-canvas
        return line.replace(/^([^{]+)\{/gm, '#tpl-canvas $1{');
      })
      .join('\n');
    
    return scopedCss;
  }, [anims, customCss]);

  // Cegah eksekusi ulang saat React re-render, tapi tetap boleh jalan lagi
  // kalau daftar behaviour benar-benar berganti (mis. user ganti template).
  const ranScript = useRef(false);
  const scriptSignature = useMemo(
    () => behaviourList.map((b) => `${b.id}:${b.name}:${b.trigger}:${b.target ?? ''}`).join('|'),
    [behaviourList],
  );
  const lastSignature = useRef<string>('');

  useEffect(() => {
    if (behaviourList.length === 0) return;
    if (ranScript.current && lastSignature.current === scriptSignature) return;

    ranScript.current = true;
    lastSignature.current = scriptSignature;

    for (const b of behaviourList) {
      const code = sanitizeBehaviourScript(String(b.script ?? '').slice(0, 100_000)).trim();
      if (!code) continue;
      try {
        // Sisipkan lewat DOM (bukan `new Function`) supaya tidak memakai pola
        // yang justru kita larang di dalam script template.
        const el = document.createElement('script');
        el.textContent = code;
        el.dataset.tplBehaviour = b.id;
        document.body.appendChild(el);
      } catch (err) {
        console.error('[behaviour] gagal menjalankan script template:', b.id, err);
      }
    }
  }, [behaviourList, scriptSignature]);

  useEffect(() => {
    if (anims.length === 0) return;
    const scope: ParentNode = root ?? document;
    const cleanups: Array<() => void> = [];
    const mark = (el: Element) => el.classList.add(CLS_ON);

    for (const a of anims) {
      const cls = clsOf(a.id);
      const target = (a.target ?? '').trim();
      // Tanpa selector tidak ada yang bisa disalakan. Sengaja diam-diam: pola
      // animasi sering ditulis sebelum section-nya benar-benar ada.
      if (!target) continue;

      let nodes: Element[] = [];
      try {
        nodes = Array.from(scope.querySelectorAll(target));
      } catch {
        // Selector tidak valid → abaikan, jangan gagalkan seluruh runtime.
        continue;
      }
      if (nodes.length === 0) continue;
      for (const n of nodes) n.classList.add(cls);

      if (a.trigger === 'onLoad') {
        const raf = requestAnimationFrame(() => nodes.forEach(mark));
        cleanups.push(() => cancelAnimationFrame(raf));
      } else if (a.trigger === 'onScroll') {
        if (typeof IntersectionObserver === 'undefined') {
          nodes.forEach(mark);
          continue;
        }
        const io = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              mark(entry.target);
              io.unobserve(entry.target);
            }
          },
          { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
        );
        for (const n of nodes) io.observe(n);
        cleanups.push(() => io.disconnect());
      } else if (a.trigger === 'onHover' || a.trigger === 'onClick') {
        const evt = a.trigger === 'onHover' ? 'mouseenter' : 'click';
        const once = (ev: Event) => mark(ev.currentTarget as Element);
        for (const n of nodes) n.addEventListener(evt, once, { once: true });
        cleanups.push(() => {
          for (const n of nodes) n.removeEventListener(evt, once);
        });
      }
    }

    return () => {
      for (const c of cleanups) c();
    };
  }, [anims, root]);

  if (!css) return null;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
