'use client';

import { useEffect, useState, useRef, useMemo } from 'react';

interface DomainData {
  id: string;
  name: string;
  slug: string;
  weightPercent: number;
  displayOrder: number;
  score: number;
  questionsAttempted: number;
  questionsCorrect: number;
}

interface PathwayMapProps {
  domains: DomainData[];
  certSlug: string;
  isEnrolled: boolean;
  onDomainSelect: (domain: DomainData) => void;
}

const domainThemes: Record<string, { emoji: string; color: string; bgColor: string; glowColor: string; label: string; icon: string }> = {
  'general-security-concepts': { emoji: '🛡️', color: '#6366f1', bgColor: '#eef2ff', glowColor: 'rgba(99,102,241,0.3)', label: 'Foundations', icon: 'shield' },
  'threats-vulnerabilities-mitigations': { emoji: '⚔️', color: '#ef4444', bgColor: '#fef2f2', glowColor: 'rgba(239,68,68,0.3)', label: 'Threats', icon: 'sword' },
  'security-architecture': { emoji: '🏗️', color: '#f59e0b', bgColor: '#fffbeb', glowColor: 'rgba(245,158,11,0.3)', label: 'Architecture', icon: 'building' },
  'security-operations': { emoji: '🔍', color: '#10b981', bgColor: '#ecfdf5', glowColor: 'rgba(16,185,129,0.3)', label: 'Operations', icon: 'search' },
  'security-program-management': { emoji: '📋', color: '#8b5cf6', bgColor: '#f5f3ff', glowColor: 'rgba(139,92,246,0.3)', label: 'Management', icon: 'clipboard' },
};

const fallbackThemes = [
  { emoji: '📖', color: '#6366f1', bgColor: '#eef2ff', glowColor: 'rgba(99,102,241,0.3)', label: 'Basics', icon: 'book' },
  { emoji: '⚡', color: '#ef4444', bgColor: '#fef2f2', glowColor: 'rgba(239,68,68,0.3)', label: 'Core', icon: 'bolt' },
  { emoji: '🔧', color: '#f59e0b', bgColor: '#fffbeb', glowColor: 'rgba(245,158,11,0.3)', label: 'Applied', icon: 'wrench' },
  { emoji: '🎯', color: '#10b981', bgColor: '#ecfdf5', glowColor: 'rgba(16,185,129,0.3)', label: 'Advanced', icon: 'target' },
  { emoji: '🏆', color: '#8b5cf6', bgColor: '#f5f3ff', glowColor: 'rgba(139,92,246,0.3)', label: 'Mastery', icon: 'trophy' },
];

function getTheme(slug: string, index: number) {
  return domainThemes[slug] || fallbackThemes[index % fallbackThemes.length];
}

function getNodeStatus(domain: DomainData, index: number, domains: DomainData[]): 'locked' | 'current' | 'completed' | 'available' {
  const pct = Math.round(domain.score * 100);
  if (pct >= 80) return 'completed';
  if (domain.questionsAttempted > 0) return 'current';
  if (index === 0) return 'available';
  const prev = domains[index - 1];
  if (prev.questionsAttempted > 0) return 'available';
  return 'locked';
}

// Seeded random for consistent scenery placement
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export function PathwayMap({ domains, certSlug, isEnrolled, onDomainSelect }: PathwayMapProps) {
  const [animatedNodes, setAnimatedNodes] = useState<Set<number>>(new Set());
  const [pathProgress, setPathProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const nodeSpacing = 340;
  const topPadding = 80;
  const bottomPadding = 140;
  const totalHeight = topPadding + domains.length * nodeSpacing + bottomPadding;

  useEffect(() => {
    const timer = setTimeout(() => setPathProgress(1), 100);
    domains.forEach((_, i) => {
      setTimeout(() => {
        setAnimatedNodes(prev => new Set([...prev, i]));
      }, 300 + i * 250);
    });
    return () => clearTimeout(timer);
  }, [domains]);

  // Node positions with wider zigzag
  const nodePositions = domains.map((_, i) => {
    const y = topPadding + 60 + i * nodeSpacing;
    const x = i % 2 === 0 ? 62 : 38;
    return { x: `${x}%`, y, rawX: x };
  });

  // SVG path coordinates (full width SVG)
  const svgWidth = 400;
  function buildPath() {
    if (nodePositions.length < 2) return '';
    const points = nodePositions.map((pos) => ({
      x: (pos.rawX / 100) * svgWidth,
      y: pos.y,
    }));

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpY = (prev.y + curr.y) / 2;
      d += ` C ${prev.x} ${cpY}, ${curr.x} ${cpY}, ${curr.x} ${curr.y}`;
    }
    return d;
  }

  // Generate scenery items procedurally
  const scenery = useMemo(() => {
    const items: { type: string; x: number; y: number; scale: number; flip: boolean }[] = [];
    const rand = seededRandom(42);

    for (let i = 0; i < domains.length; i++) {
      const baseY = topPadding + 60 + i * nodeSpacing;
      const nodeX = i % 2 === 0 ? 62 : 38;
      const farSide = nodeX > 50 ? 'left' : 'right';

      // Big tree on the far side from the node
      items.push({
        type: 'pine-tree',
        x: farSide === 'left' ? 5 + rand() * 18 : 78 + rand() * 18,
        y: baseY - 60 + rand() * 40,
        scale: 0.8 + rand() * 0.5,
        flip: rand() > 0.5,
      });

      // Small decorations near the path
      items.push({
        type: rand() > 0.5 ? 'mushroom' : 'flower-cluster',
        x: farSide === 'left' ? 25 + rand() * 10 : 62 + rand() * 10,
        y: baseY + 30 + rand() * 50,
        scale: 0.6 + rand() * 0.4,
        flip: rand() > 0.5,
      });

      // Rocks or bushes on the node side but far enough away
      items.push({
        type: rand() > 0.4 ? 'round-bush' : 'rock',
        x: nodeX > 50 ? 78 + rand() * 15 : 3 + rand() * 15,
        y: baseY + 80 + rand() * 60,
        scale: 0.5 + rand() * 0.5,
        flip: rand() > 0.5,
      });

      // Grass tufts scattered
      for (let g = 0; g < 3; g++) {
        items.push({
          type: 'grass',
          x: 5 + rand() * 90,
          y: baseY - 40 + rand() * 280,
          scale: 0.4 + rand() * 0.5,
          flip: rand() > 0.5,
        });
      }

      // Occasional special items
      if (rand() > 0.4) {
        items.push({
          type: rand() > 0.5 ? 'butterfly' : 'bird',
          x: 10 + rand() * 80,
          y: baseY - 20 + rand() * 100,
          scale: 0.5 + rand() * 0.3,
          flip: rand() > 0.5,
        });
      }

      // Stars/sparkles near completed nodes
      if (rand() > 0.5) {
        items.push({
          type: 'sparkle',
          x: nodeX + (rand() > 0.5 ? -12 : 12) + rand() * 5,
          y: baseY - 30 + rand() * 20,
          scale: 0.3 + rand() * 0.4,
          flip: false,
        });
      }
    }

    return items;
  }, [domains, topPadding, nodeSpacing]);

  // Group scenery by nearest domain index for staggered animation
  function getSceneryDomainIndex(y: number) {
    let closest = 0;
    let minDist = Infinity;
    domains.forEach((_, i) => {
      const nodeY = topPadding + 60 + i * nodeSpacing;
      const dist = Math.abs(y - nodeY);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    return closest;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ minHeight: totalHeight }}
    >
      {/* Rich layered background */}
      <div className="absolute inset-0">
        {/* Sky gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#e8f4fd] via-[#f0f7ee] to-[#e8f0e4]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        {/* Horizon glow */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#d4e8d0]/60 to-transparent" />
      </div>

      {/* Floating clouds - varied sizes, better positioned */}
      <Cloud x={5} y={20} size={100} delay={0} opacity={0.15} />
      <Cloud x={70} y={60} size={75} delay={3} opacity={0.12} />
      <Cloud x={40} y={350} size={90} delay={1.5} opacity={0.1} />
      <Cloud x={80} y={550} size={65} delay={4} opacity={0.13} />
      <Cloud x={15} y={750} size={80} delay={2} opacity={0.11} />
      {totalHeight > 1200 && <Cloud x={55} y={950} size={70} delay={5} opacity={0.1} />}

      {/* SVG Path */}
      <svg
        className="absolute inset-0 w-full pointer-events-none"
        style={{ height: totalHeight }}
        viewBox={`0 0 ${svgWidth} ${totalHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="pathGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="25%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="75%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <filter id="pathGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Wide dashed guide path */}
        <path
          d={buildPath()}
          fill="none"
          stroke="#c7d2df"
          strokeWidth="8"
          strokeDasharray="16 10"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Animated colored path */}
        <path
          d={buildPath()}
          fill="none"
          stroke="url(#pathGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          filter="url(#pathGlow)"
          style={{
            strokeDasharray: 3000,
            strokeDashoffset: 3000 * (1 - pathProgress),
            transition: 'stroke-dashoffset 2.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>

      {/* Scenery elements */}
      {scenery.map((item, i) => {
        const domainIdx = getSceneryDomainIndex(item.y);
        const visible = animatedNodes.has(domainIdx);
        return (
          <div
            key={`scenery-${i}`}
            className={`absolute pointer-events-none transition-all duration-1000 ${
              visible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              left: `${item.x}%`,
              top: item.y,
              transform: `scale(${visible ? item.scale : 0.3}) ${item.flip ? 'scaleX(-1)' : ''}`,
              transitionDelay: `${0.3 + (i % 5) * 0.15}s`,
            }}
          >
            <ScenerySprite type={item.type} />
          </div>
        );
      })}

      {/* Domain nodes */}
      {domains.map((domain, i) => {
        const pos = nodePositions[i];
        const theme = getTheme(domain.slug, i);
        const status = getNodeStatus(domain, i, domains);
        const isVisible = animatedNodes.has(i);
        const pct = Math.round(domain.score * 100);
        const isRight = pos.rawX > 50;

        return (
          <div
            key={domain.id}
            className="absolute"
            style={{
              left: pos.x,
              top: pos.y,
              transform: 'translate(-50%, -50%)',
              zIndex: 10 + i,
            }}
          >
            {/* Connector dots between nodes */}
            {i < domains.length - 1 && (
              <>
                <SubNode
                  x={isRight ? -30 : 30}
                  y={80}
                  delay={0.4 + i * 0.25}
                  completed={status === 'completed'}
                  visible={isVisible}
                />
                <SubNode
                  x={isRight ? -50 : 50}
                  y={150}
                  delay={0.6 + i * 0.25}
                  completed={status === 'completed'}
                  visible={isVisible}
                />
              </>
            )}

            {/* Main domain node */}
            <button
              onClick={() => onDomainSelect(domain)}
              className={`relative group transition-all duration-500 ${
                isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`}
              style={{ transitionDelay: `${300 + i * 250}ms` }}
              disabled={status === 'locked' && !isEnrolled}
            >
              {/* Pulsing glow ring */}
              {(status === 'current' || status === 'available') && (
                <div
                  className="absolute inset-0 -m-4 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${theme.glowColor} 0%, transparent 70%)`,
                    animation: 'pulseGlow 2s ease-in-out infinite',
                  }}
                />
              )}

              {/* Progress ring */}
              <div className="relative">
                <svg className="w-[88px] h-[88px] -rotate-90 drop-shadow-md" viewBox="0 0 88 88">
                  {/* Background ring */}
                  <circle cx="44" cy="44" r="38" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                  {/* Progress arc */}
                  {pct > 0 && (
                    <circle
                      cx="44" cy="44" r="38"
                      fill="none"
                      stroke={theme.color}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 38}`}
                      strokeDashoffset={`${2 * Math.PI * 38 * (1 - domain.score)}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  )}
                </svg>

                {/* Inner circle */}
                <div
                  className={`absolute inset-0 m-[10px] rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                    status === 'locked'
                      ? 'bg-gray-100 border-[3px] border-gray-200'
                      : status === 'completed'
                      ? 'border-[3px]'
                      : 'border-[3px] group-hover:scale-110 group-active:scale-95'
                  }`}
                  style={{
                    backgroundColor: status === 'locked' ? undefined : theme.bgColor,
                    borderColor: status === 'locked' ? undefined : theme.color,
                  }}
                >
                  {status === 'locked' ? (
                    <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  ) : status === 'completed' ? (
                    <div className="relative">
                      <span className="text-[28px]">{theme.emoji}</span>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-white">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[28px] group-hover:scale-125 transition-transform duration-200">{theme.emoji}</span>
                  )}
                </div>
              </div>

              {/* Label card - below the node */}
              <div
                className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 transition-all duration-600 ${
                  isVisible ? 'opacity-100' : 'opacity-0 translate-y-2'
                }`}
                style={{ transitionDelay: `${500 + i * 250}ms`, width: '150px' }}
              >
                <div className="rounded-xl bg-white/90 backdrop-blur-sm shadow-md border border-gray-100 px-3 py-2 text-center">
                  <p className="text-[13px] font-black tracking-tight leading-tight" style={{ color: status === 'locked' ? '#94a3b8' : theme.color }}>
                    {theme.label}
                  </p>
                  <p className="text-[10px] text-gray-500 font-semibold leading-tight mt-0.5 line-clamp-1">
                    {domain.name}
                  </p>
                  {pct > 0 && (
                    <div className="flex items-center justify-center gap-1.5 mt-1.5">
                      <div className="h-1.5 w-14 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${pct}%`, backgroundColor: theme.color }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold" style={{ color: theme.color }}>{pct}%</span>
                    </div>
                  )}
                  {status === 'locked' && (
                    <p className="text-[9px] text-gray-400 font-medium mt-1">Complete previous</p>
                  )}
                </div>
              </div>

              {/* Stars for completed */}
              {status === 'completed' && isVisible && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex gap-1">
                  {[0, 1, 2].map((s) => (
                    <span
                      key={s}
                      className="text-sm"
                      style={{
                        animation: `floatUp 0.6s ${800 + i * 250 + s * 150}ms cubic-bezier(0.34, 1.56, 0.64, 1) both`,
                      }}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              )}
            </button>
          </div>
        );
      })}

      {/* Finish flag */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-center"
        style={{ top: totalHeight - bottomPadding + 20 }}
      >
        <div className={`transition-all duration-700 ${
          animatedNodes.has(domains.length - 1) ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
          style={{ transitionDelay: `${600 + domains.length * 250}ms` }}
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-xl mx-auto ring-4 ring-white">
              <span className="text-3xl">🎓</span>
            </div>
            <div className="absolute -inset-3 rounded-full border-2 border-dashed border-emerald-300 animate-spin" style={{ animationDuration: '12s' }} />
          </div>
          <p className="text-sm font-black text-emerald-600 mt-3 tracking-tight">Exam Ready!</p>
          <p className="text-[10px] text-gray-400 font-semibold">Complete all domains</p>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function SubNode({ x, y, delay, completed, visible }: { x: number; y: number; delay: number; completed: boolean; visible: boolean }) {
  return (
    <div
      className={`absolute w-3.5 h-3.5 rounded-full border-2 transition-all duration-500 ${
        completed
          ? 'bg-emerald-400 border-emerald-500 shadow-sm'
          : 'bg-white border-gray-200 shadow-sm'
      } ${visible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transitionDelay: `${delay}s`,
      }}
    />
  );
}

function Cloud({ x, y, size, delay, opacity }: { x: number; y: number; size: number; delay: number; opacity: number }) {
  return (
    <div
      className="absolute pointer-events-none animate-gentle-float"
      style={{
        left: `${x}%`,
        top: y,
        width: size,
        height: size * 0.5,
        animationDelay: `${delay}s`,
        opacity,
      }}
    >
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <ellipse cx="60" cy="40" rx="40" ry="15" fill="#c4d5e8" />
        <ellipse cx="40" cy="30" rx="25" ry="18" fill="#d0dff0" />
        <ellipse cx="75" cy="25" rx="30" ry="20" fill="#d0dff0" />
        <ellipse cx="55" cy="32" rx="30" ry="16" fill="#dbe8f4" />
      </svg>
    </div>
  );
}

function ScenerySprite({ type }: { type: string }) {
  switch (type) {
    case 'pine-tree':
      return (
        <svg width="48" height="72" viewBox="0 0 48 72" className="opacity-50">
          <rect x="21" y="50" width="6" height="22" rx="2" fill="#8B6941" />
          <polygon points="24,4 42,32 6,32" fill="#2D8A4E" />
          <polygon points="24,14 38,38 10,38" fill="#34A853" />
          <polygon points="24,24 36,46 12,46" fill="#3DBE62" />
          <circle cx="18" cy="28" r="1.5" fill="#fff" opacity="0.15" />
          <circle cx="30" cy="36" r="1" fill="#fff" opacity="0.12" />
        </svg>
      );
    case 'round-bush':
      return (
        <svg width="44" height="32" viewBox="0 0 44 32" className="opacity-40">
          <ellipse cx="22" cy="22" rx="20" ry="12" fill="#3DBE62" />
          <ellipse cx="14" cy="18" rx="12" ry="10" fill="#34A853" />
          <ellipse cx="30" cy="18" rx="12" ry="10" fill="#2D8A4E" />
          <ellipse cx="22" cy="15" rx="10" ry="9" fill="#4ACA6E" />
          <circle cx="16" cy="14" r="2" fill="#fff" opacity="0.1" />
        </svg>
      );
    case 'rock':
      return (
        <svg width="36" height="24" viewBox="0 0 36 24" className="opacity-35">
          <ellipse cx="18" cy="18" rx="16" ry="8" fill="#9CA3AF" />
          <ellipse cx="14" cy="15" rx="10" ry="7" fill="#B0B8C4" />
          <ellipse cx="24" cy="16" rx="8" ry="6" fill="#A0A8B4" />
          <circle cx="12" cy="13" r="1.5" fill="#fff" opacity="0.15" />
        </svg>
      );
    case 'mushroom':
      return (
        <svg width="24" height="28" viewBox="0 0 24 28" className="opacity-45">
          <rect x="10" y="16" width="4" height="12" rx="1.5" fill="#E8DDD0" />
          <ellipse cx="12" cy="14" rx="11" ry="8" fill="#E84855" />
          <ellipse cx="12" cy="14" rx="11" ry="8" fill="url(#mushCap)" />
          <circle cx="8" cy="11" r="2" fill="#fff" opacity="0.6" />
          <circle cx="15" cy="10" r="1.5" fill="#fff" opacity="0.5" />
          <circle cx="11" cy="16" r="1" fill="#fff" opacity="0.3" />
          <defs>
            <radialGradient id="mushCap">
              <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#E84855" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      );
    case 'flower-cluster':
      return (
        <svg width="28" height="32" viewBox="0 0 28 32" className="opacity-45">
          <line x1="8" y1="18" x2="8" y2="32" stroke="#34A853" strokeWidth="1.5" />
          <line x1="18" y1="14" x2="18" y2="32" stroke="#2D8A4E" strokeWidth="1.5" />
          <line x1="13" y1="20" x2="13" y2="32" stroke="#34A853" strokeWidth="1.5" />
          <circle cx="8" cy="15" r="4" fill="#F59E0B" />
          <circle cx="8" cy="15" r="2" fill="#FBBF24" />
          <circle cx="18" cy="11" r="5" fill="#EC4899" />
          <circle cx="18" cy="11" r="2.5" fill="#F9A8D4" />
          <circle cx="13" cy="18" r="3.5" fill="#8B5CF6" />
          <circle cx="13" cy="18" r="1.5" fill="#C4B5FD" />
        </svg>
      );
    case 'grass':
      return (
        <svg width="20" height="14" viewBox="0 0 20 14" className="opacity-25">
          <path d="M3 14 Q4 4 6 2" stroke="#34A853" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M8 14 Q9 6 10 1" stroke="#3DBE62" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M13 14 Q14 5 16 3" stroke="#2D8A4E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'butterfly':
      return (
        <svg width="20" height="16" viewBox="0 0 20 16" className="opacity-35" style={{ animation: 'gentleFloat 3s ease-in-out infinite' }}>
          <ellipse cx="7" cy="6" rx="5" ry="4" fill="#C084FC" />
          <ellipse cx="13" cy="6" rx="5" ry="4" fill="#E879F9" />
          <ellipse cx="7" cy="11" rx="3.5" ry="3" fill="#D8B4FE" />
          <ellipse cx="13" cy="11" rx="3.5" ry="3" fill="#F0ABFC" />
          <line x1="10" y1="3" x2="10" y2="14" stroke="#7C3AED" strokeWidth="1" />
        </svg>
      );
    case 'bird':
      return (
        <svg width="18" height="10" viewBox="0 0 18 10" className="opacity-30" style={{ animation: 'gentleFloat 4s ease-in-out infinite' }}>
          <path d="M1 8 Q5 2 9 5" stroke="#64748B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M9 5 Q13 2 17 8" stroke="#64748B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className="opacity-30" style={{ animation: 'pulseGlow 2s ease-in-out infinite' }}>
          <path d="M8 0 L9 6 L16 8 L9 10 L8 16 L7 10 L0 8 L7 6 Z" fill="#FBBF24" />
        </svg>
      );
    default:
      return null;
  }
}
