import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import {
  Activity, ArrowRight, BarChart3, BookOpen, Check, CircleHelp,
  Clock3, Code2, Command, Flame, Gauge, Keyboard, LockKeyhole,
  Play, Plus, RotateCcw, Settings2, Sparkles, Target, Trash2,
  Trophy, WandSparkles, X, Zap,
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import LiveStudio, {
  type LiveStudioCadence,
  type LiveStudioTier,
} from './LiveStudio';
import {
  curatedLiveStudioChallengeCatalog,
  decodeLiveStudioShare,
  liveStudioShareUrl,
  projectLiveStudioPreview,
  resolveLiveStudioChallenge,
  selectLiveStudioChallenge,
  type LiveStudioBuild,
} from './liveStudioData';
import { accuracyBucket, trackEvent } from './lib/analytics';

type Tier = 'Small' | 'Medium' | 'Hard' | 'Advanced' | 'Legendary';
type Snippet = { id: string; title: string; language: string; tier: Tier; description: string; code: string; custom?: boolean };
type Run = { id: string; snippetTitle: string; tier: Tier; wpm: number; cpm: number; accuracy: number; seconds: number; points: number; date: string };
export type ThemeName = 'midnight' | 'ember' | 'mint' | 'oceanic' | 'circuit-bloom' | 'matrix-rain' | 'crt-afterglow' | 'violet' | 'cobalt' | 'copper' | 'sage' | 'tidepool-signal' | 'toxic-garden' | 'deep-sea-biolume' | 'mono' | 'solar' | 'berry' | 'lagoon' | 'neon-shrine' | 'vhs-ghost' | 'ultraviolet' | 'oxide' | 'arctic' | 'orchid' | 'fungal-network' | 'solar-cult' | 'aurora' | 'obsidian' | 'prism' | 'eclipse' | 'black-hole-karaoke' | 'glitch-cathedral';
type ThemeTokens = Record<string, string>;
type PaletteAnimation = 'static' | 'drift' | 'pulse' | 'orbit';
export type PaletteDefinition = {
  id: ThemeName;
  name: string;
  tier: Tier;
  level: number;
  animated: boolean;
  animation: PaletteAnimation;
  description: string;
  colors: string[];
  tokens: ThemeTokens;
};
type PaletteTierFilter = Tier | 'All';
type PaletteVariantFilter = 'All' | 'Static' | 'Animated';
type MotionPreference = 'auto' | 'on' | 'off';
type PaletteSeed = Omit<PaletteDefinition, 'tokens' | 'animated' | 'animation'> & {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  card: string;
  muted: string;
  mutedForeground: string;
  glowA: string;
  glowB: string;
};

const paletteSeeds: PaletteSeed[] = [
  { id: 'midnight', name: 'Midnight terminal', tier: 'Small', level: 1, description: 'Cool focus with a warm signal.', colors: ['#10151b', '#7ee7d8', '#f5b96b'], background: '218 26% 8%', foreground: '210 22% 90%', primary: '168 66% 70%', primaryForeground: '218 26% 8%', accent: '36 82% 69%', accentForeground: '218 26% 8%', border: '213 18% 18%', card: '216 23% 11%', muted: '216 18% 14%', mutedForeground: '215 12% 56%', glowA: '168 66% 70%', glowB: '36 82% 69%' },
  { id: 'ember', name: 'Ember shift', tier: 'Small', level: 2, description: 'A little heat for late-night reps.', colors: ['#1d1719', '#f3b0a8', '#f3c876'], background: '12 25% 8%', foreground: '30 34% 92%', primary: '12 78% 72%', primaryForeground: '12 25% 8%', accent: '39 86% 70%', accentForeground: '12 25% 8%', border: '15 20% 22%', card: '14 24% 12%', muted: '15 18% 16%', mutedForeground: '24 13% 58%', glowA: '12 78% 72%', glowB: '39 86% 70%' },
  { id: 'mint', name: 'Quiet mint', tier: 'Small', level: 3, description: 'Low contrast, high stamina.', colors: ['#111c1c', '#9de4c3', '#c4d39a'], background: '165 25% 8%', foreground: '150 28% 91%', primary: '148 56% 72%', primaryForeground: '165 25% 8%', accent: '75 48% 68%', accentForeground: '165 25% 8%', border: '164 18% 20%', card: '164 22% 12%', muted: '164 17% 16%', mutedForeground: '155 13% 57%', glowA: '148 56% 72%', glowB: '75 48% 68%' },
  { id: 'oceanic', name: 'Oceanic buffer', tier: 'Small', level: 4, description: 'Clear blue edges for steady debugging.', colors: ['#101b2b', '#82c9f5', '#8ee6ca'], background: '215 34% 9%', foreground: '207 42% 93%', primary: '199 82% 73%', primaryForeground: '215 34% 9%', accent: '157 62% 73%', accentForeground: '215 34% 9%', border: '214 25% 21%', card: '214 29% 13%', muted: '214 24% 16%', mutedForeground: '211 19% 61%', glowA: '199 82% 73%', glowB: '157 62% 73%' },
  { id: 'circuit-bloom', name: 'Circuit bloom', tier: 'Small', level: 1, description: 'Electric cyan and lilac for a bright first spark.', colors: ['#11172a', '#75e7f2', '#c6a8ff'], background: '225 31% 9%', foreground: '213 41% 94%', primary: '185 79% 72%', primaryForeground: '225 31% 9%', accent: '263 80% 80%', accentForeground: '225 31% 9%', border: '222 25% 23%', card: '223 28% 13%', muted: '223 22% 17%', mutedForeground: '220 17% 61%', glowA: '185 79% 72%', glowB: '263 80% 80%' },
  { id: 'matrix-rain', name: 'Matrix rain', tier: 'Small', level: 1, description: 'Phosphor green and black glass for a quiet terminal descent.', colors: ['#06130d', '#43ff9a', '#b5ffcf'], background: '140 40% 5%', foreground: '140 55% 90%', primary: '145 100% 64%', primaryForeground: '140 40% 5%', accent: '112 100% 70%', accentForeground: '140 40% 5%', border: '145 42% 18%', card: '142 35% 9%', muted: '142 26% 13%', mutedForeground: '140 20% 58%', glowA: '145 100% 64%', glowB: '112 100% 70%' },
  { id: 'crt-afterglow', name: 'CRT afterglow', tier: 'Small', level: 2, description: 'Warm phosphor bloom for code that feels beamed from another decade.', colors: ['#1f160d', '#ffbf69', '#ff725c'], background: '25 34% 7%', foreground: '35 47% 93%', primary: '36 100% 70%', primaryForeground: '25 34% 7%', accent: '8 100% 70%', accentForeground: '25 34% 7%', border: '28 30% 21%', card: '24 30% 11%', muted: '24 23% 15%', mutedForeground: '28 17% 60%', glowA: '36 100% 70%', glowB: '8 100% 70%' },
  { id: 'violet', name: 'Violet compile', tier: 'Medium', level: 1, description: 'A patient purple for longer patterns.', colors: ['#171426', '#c7a7ef', '#f0b5d2'], background: '255 29% 9%', foreground: '267 38% 93%', primary: '266 72% 76%', primaryForeground: '255 29% 9%', accent: '327 68% 78%', accentForeground: '255 29% 9%', border: '258 22% 22%', card: '256 25% 13%', muted: '257 20% 17%', mutedForeground: '261 17% 61%', glowA: '266 72% 76%', glowB: '327 68% 78%' },
  { id: 'cobalt', name: 'Cobalt focus', tier: 'Medium', level: 2, description: 'Sharp contrast for deliberate practice.', colors: ['#0e1728', '#8fb7ff', '#e8c879'], background: '219 35% 8%', foreground: '216 39% 93%', primary: '220 100% 78%', primaryForeground: '219 35% 8%', accent: '43 73% 72%', accentForeground: '219 35% 8%', border: '218 27% 20%', card: '219 30% 12%', muted: '218 23% 16%', mutedForeground: '217 19% 59%', glowA: '220 100% 78%', glowB: '43 73% 72%' },
  { id: 'copper', name: 'Copper wire', tier: 'Medium', level: 3, description: 'Warm metal tones for making progress tangible.', colors: ['#241917', '#f0ad85', '#f3d18a'], background: '13 25% 9%', foreground: '27 39% 92%', primary: '22 78% 73%', primaryForeground: '13 25% 9%', accent: '43 81% 75%', accentForeground: '13 25% 9%', border: '16 22% 23%', card: '15 24% 13%', muted: '16 19% 17%', mutedForeground: '24 16% 60%', glowA: '22 78% 73%', glowB: '43 81% 75%' },
  { id: 'sage', name: 'Sage stack', tier: 'Medium', level: 4, description: 'Soft green layers for readable complexity.', colors: ['#111c1a', '#a6d7b4', '#d6c68c'], background: '156 25% 8%', foreground: '143 28% 92%', primary: '139 47% 73%', primaryForeground: '156 25% 8%', accent: '48 47% 70%', accentForeground: '156 25% 8%', border: '154 18% 21%', card: '155 22% 12%', muted: '154 17% 16%', mutedForeground: '150 13% 58%', glowA: '139 47% 73%', glowB: '48 47% 70%' },
  { id: 'tidepool-signal', name: 'Tidepool signal', tier: 'Medium', level: 1, description: 'Deep teal and coral currents for a calm reset.', colors: ['#102329', '#78e4d0', '#f0a0a3'], background: '191 35% 9%', foreground: '180 36% 93%', primary: '169 67% 72%', primaryForeground: '191 35% 9%', accent: '356 72% 76%', accentForeground: '191 35% 9%', border: '190 24% 22%', card: '190 29% 13%', muted: '190 22% 17%', mutedForeground: '188 15% 59%', glowA: '169 67% 72%', glowB: '356 72% 76%' },
  { id: 'toxic-garden', name: 'Toxic garden', tier: 'Medium', level: 1, description: 'Acid lime and bruised violet for a greenhouse that should not be entered.', colors: ['#141b13', '#b8ff45', '#d88cff'], background: '101 20% 8%', foreground: '91 40% 93%', primary: '84 100% 64%', primaryForeground: '101 20% 8%', accent: '280 78% 78%', accentForeground: '101 20% 8%', border: '100 22% 21%', card: '101 21% 12%', muted: '102 17% 16%', mutedForeground: '99 14% 60%', glowA: '84 100% 64%', glowB: '280 78% 78%' },
  { id: 'deep-sea-biolume', name: 'Deep-sea biolume', tier: 'Medium', level: 2, description: 'Cold cyan and ultraviolet life flickering below the signal line.', colors: ['#071b27', '#55f6d4', '#9c8cff'], background: '198 55% 7%', foreground: '185 50% 94%', primary: '169 91% 71%', primaryForeground: '198 55% 7%', accent: '251 100% 78%', accentForeground: '198 55% 7%', border: '195 40% 20%', card: '198 42% 11%', muted: '197 33% 15%', mutedForeground: '191 24% 61%', glowA: '169 91% 71%', glowB: '251 100% 78%' },
  { id: 'mono', name: 'Mono signal', tier: 'Hard', level: 1, description: 'A restrained grayscale for hard syntax.', colors: ['#121416', '#e5e7eb', '#9ca3af'], background: '220 10% 7%', foreground: '220 16% 92%', primary: '214 18% 82%', primaryForeground: '220 10% 7%', accent: '199 35% 67%', accentForeground: '220 10% 7%', border: '220 10% 19%', card: '220 10% 11%', muted: '220 9% 15%', mutedForeground: '220 8% 57%', glowA: '214 18% 82%', glowB: '199 35% 67%' },
  { id: 'solar', name: 'Solar flare', tier: 'Hard', level: 2, description: 'A bright amber pulse for production patterns.', colors: ['#241b12', '#f6ca76', '#f19b78'], background: '30 28% 8%', foreground: '38 42% 93%', primary: '42 85% 72%', primaryForeground: '30 28% 8%', accent: '15 78% 72%', accentForeground: '30 28% 8%', border: '28 23% 23%', card: '28 25% 13%', muted: '28 20% 17%', mutedForeground: '31 15% 59%', glowA: '42 85% 72%', glowB: '15 78% 72%' },
  { id: 'berry', name: 'Berry branch', tier: 'Hard', level: 3, description: 'Deep berry accents for focused refactors.', colors: ['#25131e', '#ee9fbd', '#c8a2ef'], background: '329 29% 8%', foreground: '330 38% 93%', primary: '335 75% 76%', primaryForeground: '329 29% 8%', accent: '267 65% 78%', accentForeground: '329 29% 8%', border: '329 22% 23%', card: '329 24% 13%', muted: '329 19% 17%', mutedForeground: '329 14% 60%', glowA: '335 75% 76%', glowB: '267 65% 78%' },
  { id: 'lagoon', name: 'Lagoon current', tier: 'Hard', level: 4, description: 'Teal depth for code that has to hold together.', colors: ['#0f2022', '#75e1d4', '#80bdf4'], background: '186 35% 8%', foreground: '183 35% 92%', primary: '174 65% 70%', primaryForeground: '186 35% 8%', accent: '211 82% 75%', accentForeground: '186 35% 8%', border: '185 24% 21%', card: '185 28% 12%', muted: '185 22% 16%', mutedForeground: '184 15% 58%', glowA: '174 65% 70%', glowB: '211 82% 75%' },
  { id: 'neon-shrine', name: 'Neon shrine', tier: 'Hard', level: 1, description: 'Hot pink lanterns and gold dust for a ritual at the edge of the grid.', colors: ['#221022', '#ff63c3', '#ffd166'], background: '303 36% 8%', foreground: '315 53% 94%', primary: '323 100% 72%', primaryForeground: '303 36% 8%', accent: '42 100% 70%', accentForeground: '303 36% 8%', border: '303 28% 23%', card: '301 29% 13%', muted: '302 22% 17%', mutedForeground: '304 15% 61%', glowA: '323 100% 72%', glowB: '42 100% 70%' },
  { id: 'vhs-ghost', name: 'VHS ghost', tier: 'Hard', level: 2, description: 'Blue tracking noise and pink afterimages from a lost midnight broadcast.', colors: ['#111a2c', '#79a7ff', '#ff8cc6'], background: '220 44% 8%', foreground: '222 50% 94%', primary: '216 100% 75%', primaryForeground: '220 44% 8%', accent: '331 100% 78%', accentForeground: '220 44% 8%', border: '220 31% 22%', card: '220 34% 12%', muted: '220 24% 16%', mutedForeground: '220 18% 60%', glowA: '216 100% 75%', glowB: '331 100% 78%' },
  { id: 'ultraviolet', name: 'Ultraviolet lab', tier: 'Advanced', level: 1, description: 'High-energy purple for deep work mode.', colors: ['#17112a', '#d0a4ff', '#70dce8'], background: '267 36% 8%', foreground: '268 44% 94%', primary: '270 100% 82%', primaryForeground: '267 36% 8%', accent: '185 68% 70%', accentForeground: '267 36% 8%', border: '264 27% 23%', card: '264 29% 13%', muted: '264 23% 17%', mutedForeground: '266 18% 62%', glowA: '270 100% 82%', glowB: '185 68% 70%' },
  { id: 'oxide', name: 'Oxide bloom', tier: 'Advanced', level: 2, description: 'Rust and rose for systems under pressure.', colors: ['#241415', '#f09d8f', '#e8c47b'], background: '4 29% 8%', foreground: '14 39% 93%', primary: '7 77% 74%', primaryForeground: '4 29% 8%', accent: '42 76% 71%', accentForeground: '4 29% 8%', border: '5 24% 22%', card: '5 26% 13%', muted: '5 20% 17%', mutedForeground: '10 15% 60%', glowA: '7 77% 74%', glowB: '42 76% 71%' },
  { id: 'arctic', name: 'Arctic relay', tier: 'Advanced', level: 3, description: 'Cold clarity for a clean mental stack.', colors: ['#101d29', '#a4d9f5', '#b4c7f5'], background: '205 31% 8%', foreground: '205 38% 94%', primary: '197 76% 79%', primaryForeground: '205 31% 8%', accent: '226 72% 82%', accentForeground: '205 31% 8%', border: '205 23% 21%', card: '205 27% 12%', muted: '205 21% 16%', mutedForeground: '207 16% 60%', glowA: '197 76% 79%', glowB: '226 72% 82%' },
  { id: 'orchid', name: 'Orchid runtime', tier: 'Advanced', level: 4, description: 'Magenta signal with enough calm to stay precise.', colors: ['#211326', '#f2a8dc', '#a7b5f4'], background: '295 31% 8%', foreground: '295 40% 93%', primary: '316 78% 79%', primaryForeground: '295 31% 8%', accent: '228 77% 80%', accentForeground: '295 31% 8%', border: '295 23% 22%', card: '295 27% 13%', muted: '295 20% 17%', mutedForeground: '295 15% 60%', glowA: '316 78% 79%', glowB: '228 77% 80%' },
  { id: 'fungal-network', name: 'Fungal network', tier: 'Advanced', level: 1, description: 'Moss light and violet spores for a living system under the syntax.', colors: ['#161b18', '#8cf29a', '#c8a2ff'], background: '140 18% 8%', foreground: '130 31% 92%', primary: '130 77% 75%', primaryForeground: '140 18% 8%', accent: '268 80% 80%', accentForeground: '140 18% 8%', border: '140 19% 21%', card: '140 18% 12%', muted: '140 15% 16%', mutedForeground: '135 12% 59%', glowA: '130 77% 75%', glowB: '268 80% 80%' },
  { id: 'solar-cult', name: 'Solar cult', tier: 'Advanced', level: 2, description: 'Ritual gold and warning red for a machine worshipping the sun.', colors: ['#28150d', '#ffcf67', '#e44f67'], background: '20 36% 8%', foreground: '34 50% 93%', primary: '42 100% 70%', primaryForeground: '20 36% 8%', accent: '349 77% 67%', accentForeground: '20 36% 8%', border: '20 28% 23%', card: '20 29% 13%', muted: '20 23% 17%', mutedForeground: '25 16% 60%', glowA: '42 100% 70%', glowB: '349 77% 67%' },
  { id: 'aurora', name: 'Aurora mesh', tier: 'Legendary', level: 1, description: 'Layered light for the long compile.', colors: ['#0c2022', '#7ff0d0', '#c8a5f4'], background: '183 44% 7%', foreground: '177 40% 94%', primary: '166 78% 75%', primaryForeground: '183 44% 7%', accent: '269 72% 79%', accentForeground: '183 44% 7%', border: '182 28% 20%', card: '182 35% 11%', muted: '182 26% 15%', mutedForeground: '181 17% 58%', glowA: '166 78% 75%', glowB: '269 72% 79%' },
  { id: 'obsidian', name: 'Obsidian room', tier: 'Legendary', level: 2, description: 'Near-black contrast for earned mastery.', colors: ['#090b10', '#d8e4f3', '#f1b86d'], background: '222 31% 5%', foreground: '215 39% 94%', primary: '211 64% 84%', primaryForeground: '222 31% 5%', accent: '34 82% 70%', accentForeground: '222 31% 5%', border: '220 18% 16%', card: '220 22% 9%', muted: '220 16% 13%', mutedForeground: '218 13% 55%', glowA: '211 64% 84%', glowB: '34 82% 70%' },
  { id: 'prism', name: 'Prism array', tier: 'Legendary', level: 3, description: 'A full-spectrum signal for the final stretch.', colors: ['#17152a', '#f3a8c8', '#8fe5d1', '#b7a6f4'], background: '246 32% 8%', foreground: '246 38% 94%', primary: '329 77% 80%', primaryForeground: '246 32% 8%', accent: '163 65% 74%', accentForeground: '246 32% 8%', border: '246 24% 22%', card: '246 27% 13%', muted: '246 21% 17%', mutedForeground: '245 15% 61%', glowA: '329 77% 80%', glowB: '163 65% 74%' },
  { id: 'eclipse', name: 'Eclipse core', tier: 'Legendary', level: 4, description: 'Deep space tones for syntax at full speed.', colors: ['#111321', '#9db6ff', '#f0a4a4'], background: '231 34% 7%', foreground: '228 38% 94%', primary: '224 100% 80%', primaryForeground: '231 34% 7%', accent: '0 72% 76%', accentForeground: '231 34% 7%', border: '230 25% 19%', card: '230 29% 11%', muted: '230 22% 15%', mutedForeground: '228 16% 58%', glowA: '224 100% 80%', glowB: '0 72% 76%' },
  { id: 'black-hole-karaoke', name: 'Black-hole karaoke', tier: 'Legendary', level: 1, description: 'Ultraviolet velvet and dying-star gold for singing into the void.', colors: ['#0a0b18', '#a48bff', '#fbf1a9'], background: '244 34% 6%', foreground: '244 44% 94%', primary: '255 100% 80%', primaryForeground: '244 34% 6%', accent: '54 91% 80%', accentForeground: '244 34% 6%', border: '245 27% 19%', card: '244 27% 10%', muted: '244 21% 14%', mutedForeground: '242 14% 58%', glowA: '255 100% 80%', glowB: '54 91% 80%' },
  { id: 'glitch-cathedral', name: 'Glitch cathedral', tier: 'Legendary', level: 2, description: 'Cyan windows and magenta fractures in a sacred error state.', colors: ['#120d22', '#71f1ff', '#ff5db1'], background: '270 38% 8%', foreground: '276 49% 94%', primary: '185 100% 73%', primaryForeground: '270 38% 8%', accent: '331 100% 72%', accentForeground: '270 38% 8%', border: '270 29% 23%', card: '270 31% 12%', muted: '270 23% 16%', mutedForeground: '270 15% 61%', glowA: '185 100% 73%', glowB: '331 100% 72%' },
];

function createThemeTokens(seed: PaletteSeed): ThemeTokens {
  return {
    '--background': seed.background,
    '--foreground': seed.foreground,
    '--border': seed.border,
    '--input': seed.border,
    '--ring': seed.primary,
    '--card': seed.card,
    '--card-foreground': seed.foreground,
    '--card-border': seed.border,
    '--popover': seed.card,
    '--popover-foreground': seed.foreground,
    '--popover-border': seed.border,
    '--primary': seed.primary,
    '--primary-foreground': seed.primaryForeground,
    '--secondary': seed.muted,
    '--secondary-foreground': seed.foreground,
    '--muted': seed.muted,
    '--muted-foreground': seed.mutedForeground,
    '--accent': seed.accent,
    '--accent-foreground': seed.accentForeground,
    '--destructive': '5 72% 67%',
    '--destructive-foreground': seed.background,
    '--palette-glow-a': seed.glowA,
    '--palette-glow-b': seed.glowB,
    '--palette-gradient': `radial-gradient(ellipse 72% 58% at 8% 4%, hsl(${seed.glowA} / .3), transparent 68%), radial-gradient(ellipse 68% 62% at 92% 18%, hsl(${seed.glowB} / .24), transparent 65%)`,
  };
}

const pulsePalettes = new Set<ThemeName>(['ember', 'solar', 'oxide', 'prism', 'circuit-bloom', 'crt-afterglow', 'solar-cult', 'glitch-cathedral']);
const orbitPalettes = new Set<ThemeName>(['oceanic', 'lagoon', 'arctic', 'aurora', 'tidepool-signal', 'deep-sea-biolume']);
const animatedPalettes = new Set<ThemeName>(paletteSeeds.filter(seed => seed.level >= 2 || ['midnight', 'circuit-bloom', 'tidepool-signal', 'matrix-rain'].includes(seed.id)).map(seed => seed.id));
function getPaletteAnimation(id: ThemeName): PaletteAnimation {
  if (!animatedPalettes.has(id)) return 'static';
  if (pulsePalettes.has(id)) return 'pulse';
  if (orbitPalettes.has(id)) return 'orbit';
  return 'drift';
}
export const paletteCatalog: PaletteDefinition[] = paletteSeeds.map(seed => {
  const animation = getPaletteAnimation(seed.id);
  return { ...seed, animated: animation !== 'static', animation, tokens: createThemeTokens(seed) };
});
const themeTokens = Object.fromEntries(paletteCatalog.map(palette => [palette.id, palette.tokens])) as Record<ThemeName, ThemeTokens>;

type PaletteMotif = 'terminal' | 'ember' | 'botanical' | 'wave' | 'circuit' | 'matrix' | 'crt' | 'prism' | 'grid' | 'toxic' | 'deep' | 'shrine' | 'vhs' | 'fungal' | 'solar-cult' | 'black-hole' | 'glitch';
const paletteMotifs: Record<ThemeName, PaletteMotif> = {
  midnight: 'terminal',
  ember: 'ember',
  mint: 'botanical',
  oceanic: 'wave',
  'circuit-bloom': 'circuit',
  'matrix-rain': 'matrix',
  'crt-afterglow': 'crt',
  violet: 'prism',
  cobalt: 'grid',
  copper: 'ember',
  sage: 'botanical',
  'tidepool-signal': 'wave',
  'toxic-garden': 'toxic',
  'deep-sea-biolume': 'deep',
  mono: 'grid',
  solar: 'ember',
  berry: 'prism',
  lagoon: 'wave',
  'neon-shrine': 'shrine',
  'vhs-ghost': 'vhs',
  ultraviolet: 'prism',
  oxide: 'ember',
  arctic: 'wave',
  orchid: 'prism',
  'fungal-network': 'fungal',
  'solar-cult': 'solar-cult',
  aurora: 'wave',
  obsidian: 'grid',
  prism: 'prism',
  eclipse: 'black-hole',
  'black-hole-karaoke': 'black-hole',
  'glitch-cathedral': 'glitch',
};
const matrixGlyphs = ['01', 'ｱ7', '0X', 'ﾊ9', '11', '∆3', 'ﾐ0', '7A', '00', 'K4'];
const deepBubbles = ['12%', '27%', '44%', '63%', '78%'];
const fungalNodes = ['18%', '34%', '51%', '68%', '84%'];
function paletteMotif(palette: PaletteDefinition) {
  const motif = paletteMotifs[palette.id];
  const style = {
    '--motif-a': palette.colors[1],
    '--motif-b': palette.colors[2],
    '--motif-c': palette.colors[palette.colors.length > 3 ? 3 : 0],
  } as CSSProperties;
  return (
    <div className={classNames('palette-motif', `palette-motif-${motif}`)} data-palette-motif={motif} style={style} aria-hidden="true">
      {motif === 'matrix' && <div className="palette-matrix-columns">{matrixGlyphs.map((glyph, index) => <span key={glyph} style={{ '--matrix-delay': `${index * -0.42}s`, '--matrix-x': `${index * 10.5}%` } as CSSProperties}>{glyph}<b>{index % 2 ? 'ﾘ' : '0'}</b><i>{index % 3 ? 'A' : 'ﾈ'}</i></span>)}</div>}
      {motif === 'crt' && <><div className="palette-crt-scanlines" /><div className="palette-crt-glow" /><span className="palette-motif-label">REC / PHOSPHOR</span></>}
      {motif === 'vhs' && <><div className="palette-vhs-bars">{[0, 1, 2, 3].map(index => <span key={index} style={{ '--vhs-y': `${24 + index * 17}%` } as CSSProperties} />)}</div><div className="palette-vhs-tracking" /><span className="palette-motif-label">PLAY ▶ 1987</span></>}
      {motif === 'toxic' && <><div className="palette-toxic-orb" /><div className="palette-toxic-vine palette-toxic-vine-a" /><div className="palette-toxic-vine palette-toxic-vine-b" /><span className="palette-motif-label">DO NOT WATER</span></>}
      {motif === 'deep' && <div className="palette-deep-bubbles">{deepBubbles.map((left, index) => <span key={left} style={{ left, '--bubble-size': `${5 + index * 2}px`, '--bubble-delay': `${index * -1.4}s` } as CSSProperties} />)}</div>}
      {motif === 'shrine' && <><div className="palette-shrine-gate"><i /><i /><b /></div><div className="palette-shrine-lanterns"><span /><span /><span /></div><span className="palette-motif-label">祈 / SIGNAL</span></>}
      {motif === 'fungal' && <><div className="palette-fungal-network">{fungalNodes.map((left, index) => <span key={left} style={{ left, top: `${34 + (index % 2) * 18}%`, '--node-delay': `${index * -0.7}s` } as CSSProperties} />)}</div><div className="palette-fungal-cap" /><span className="palette-motif-label">MYCELIUM / 01</span></>}
      {motif === 'solar-cult' && <><div className="palette-solar-rays" /><div className="palette-solar-disc" /><span className="palette-motif-label">WORSHIP THE LIGHT</span></>}
      {motif === 'black-hole' && <><div className="palette-space-stars" /><div className="palette-black-hole-ring"><i /></div><span className="palette-motif-label">SING INTO VOID</span></>}
      {motif === 'glitch' && <><div className="palette-glitch-arches"><i /><i /><i /></div><div className="palette-glitch-bars"><span /><span /><span /></div><span className="palette-motif-label">ERROR / HALLELUJAH</span></>}
      {motif === 'circuit' && <><div className="palette-circuit-lines"><i /><i /><i /><b /><b /><b /></div><span className="palette-motif-label">NODE / BLOOM</span></>}
      {motif === 'wave' && <><div className="palette-wave-rings"><i /><i /><i /></div><div className="palette-wave-line" /></>}
      {motif === 'prism' && <><div className="palette-prism-shard" /><div className="palette-prism-spectrum" /></>}
      {motif === 'grid' && <><div className="palette-grid-plane" /><div className="palette-grid-crosshair" /></>}
      {motif === 'ember' && <><div className="palette-ember-sparks"><i /><i /><i /><i /></div><div className="palette-ember-core" /></>}
      {motif === 'terminal' && <><div className="palette-terminal-grid" /><span className="palette-motif-label">READY_</span></>}
      </div>
  );
}

const tierMeta: Record<Tier, { tag: string; subtitle: string; color: string; points: number; unlock: number }> = {
  Small: { tag: '01', subtitle: 'Warm-up patterns', color: '#7ee7d8', points: 50, unlock: 0 },
  Medium: { tag: '02', subtitle: 'Everyday fluency', color: '#a3c4f3', points: 90, unlock: 0 },
  Hard: { tag: '03', subtitle: 'Production syntax', color: '#f5b96b', points: 150, unlock: 100 },
  Advanced: { tag: '04', subtitle: 'Deep work mode', color: '#e58d9f', points: 230, unlock: 500 },
  Legendary: { tag: '05', subtitle: 'The long compile', color: '#c7a7ef', points: 400, unlock: 1200 },
};

const seededSnippets: Snippet[] = [
  { id: 'fetch-retry', title: 'Fetch with retry', language: 'TypeScript', tier: 'Medium', description: 'A resilient async request with backoff.', code: `async function fetchWithRetry<T>(url: string, retries = 3): Promise<T> {\n  for (let attempt = 0; attempt < retries; attempt++) {\n    try {\n      const response = await fetch(url);\n      if (!response.ok) throw new Error('HTTP \${response.status}');\n      return response.json() as Promise<T>;\n    } catch (error) {\n      if (attempt === retries - 1) throw error;\n      await new Promise(resolve => setTimeout(resolve, 2 ** attempt * 250));\n    }\n  }\n  throw new Error('Request failed');\n}` },
  { id: 'git-branch', title: 'A clean branch', language: 'Shell', tier: 'Small', description: 'The tiny ritual before a focused change.', code: `git switch main\ngit pull --rebase origin main\ngit switch -c feat/keyboard-shortcuts\ngit status --short` },
  { id: 'array-pipeline', title: 'Array pipeline', language: 'JavaScript', tier: 'Small', description: 'Filter, shape, and sort data in one pass.', code: `const visible = records\n  .filter(record => record.status === 'ready')\n  .map(({ id, title, score }) => ({ id, title, score }))\n  .sort((a, b) => b.score - a.score);` },
  { id: 'sql-window', title: 'Windowed ranking', language: 'SQL', tier: 'Hard', description: 'Rank each player inside their region.', code: `SELECT\n  player_id,\n  region,\n  score,\n  DENSE_RANK() OVER (\n    PARTITION BY region ORDER BY score DESC\n  ) AS regional_rank\nFROM leaderboard\nWHERE submitted_at >= CURRENT_DATE - INTERVAL '30 days';` },
  { id: 'python-context', title: 'Context manager', language: 'Python', tier: 'Hard', description: 'Keep resources tidy even when work fails.', code: `from contextlib import contextmanager\n\n@contextmanager\ndef transaction(connection):\n    try:\n        yield connection.cursor()\n        connection.commit()\n    except Exception:\n        connection.rollback()\n        raise` },
  { id: 'react-hook', title: 'Stable debounced hook', language: 'React', tier: 'Advanced', description: 'A small hook with a carefully managed timer.', code: `function useDebouncedValue<T>(value: T, delay = 240) {\n  const [debounced, setDebounced] = useState(value);\n\n  useEffect(() => {\n    const timer = window.setTimeout(() => setDebounced(value), delay);\n    return () => window.clearTimeout(timer);\n  }, [value, delay]);\n\n  return debounced;\n}` },
  { id: 'parser', title: 'Token parser', language: 'TypeScript', tier: 'Advanced', description: 'Turn a stream into explicit, testable tokens.', code: `const tokens = input.match(/[A-Za-z_][\\\\w]*|\\\\d+|=>|===|./g) ?? [];\n\nreturn tokens.reduce<Token[]>((result, token, index) => {\n  const previous = result.at(-1);\n  if (previous?.type === 'identifier' && token === '(') {\n    result.push({ type: 'call', value: token, index });\n  } else {\n    result.push(classify(token, index));\n  }\n  return result;\n}, []);` },
  { id: 'kubernetes', title: 'Rollout watch', language: 'Shell', tier: 'Legendary', description: 'A calm command sequence for a nervous deploy.', code: `kubectl -n production apply -f deployment.yaml\nkubectl -n production rollout status deployment/api --timeout=120s\nkubectl -n production get pods -l app=api -o wide\nkubectl -n production logs deploy/api --since=5m --tail=80` },
];

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/', label: 'Practice', icon: Keyboard },
  { href: '/studio', label: 'Live Studio', icon: Sparkles },
  { href: '/progress', label: 'Progress', icon: BarChart3 },
  { href: '/snippets', label: 'Snippet library', icon: BookOpen },
  { href: '/themes', label: 'Workspace', icon: WandSparkles },
];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch { return fallback; }
}
function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}
function classNames(...classes: Array<string | false | undefined>) { return classes.filter(Boolean).join(' '); }

function AppShell({ children, theme, totalPoints, credits, animated, animation, motionReduced }: { children: ReactNode; theme: ThemeName; totalPoints: number; credits: number; animated: boolean; animation: PaletteAnimation; motionReduced: boolean }) {
  const [location] = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  const palette = paletteCatalog.find(item => item.id === theme);
  return (
    <div className={classNames('min-h-[100dvh] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]', animated && 'palette-animated', motionReduced && 'motion-reduced')} data-palette-id={theme} data-palette-tier={palette?.tier.toLowerCase()} data-palette-level={palette?.level} data-palette-animation={animation} data-palette-motif={palette ? paletteMotifs[palette.id] : undefined}>
      {animated && <div className="palette-ambient" aria-hidden="true" data-testid="palette-ambient" />}
      {animated && palette && <div className="palette-ambient-motif" aria-hidden="true" data-testid="palette-ambient-motif" data-palette-motif={paletteMotifs[palette.id]}>{paletteMotif(palette)}</div>}
      <div className="noise" />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-[hsl(var(--border))] bg-[hsl(var(--background)/.88)] px-5 py-6 backdrop-blur-xl md:flex md:flex-col">
        <Brand />
        <div className="mt-12 mb-3 px-3 font-mono text-[10px] font-bold uppercase tracking-[.22em] text-[hsl(var(--muted-foreground))]">Training room</div>
        <nav className="space-y-1" aria-label="Main navigation">
          {navItems.map(item => <NavItem key={item.href} item={item} active={location === item.href} />)}
        </nav>
        <div className="mt-auto space-y-4">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.65)] p-4">
            <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]"><span>Session credits</span><Zap size={14} className="text-[hsl(var(--accent))]" /></div>
            <div className="mt-2 font-mono text-2xl font-bold text-[hsl(var(--foreground))]" data-testid="text-sidebar-credits">{credits.toLocaleString()}</div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-[hsl(var(--muted))]"><div className="h-full w-[68%] rounded-full bg-[hsl(var(--accent))]" /></div>
            <div className="mt-2 text-[11px] text-[hsl(var(--muted-foreground))]">{totalPoints.toLocaleString()} total points</div>
          </div>
          <div className="flex items-center gap-3 px-2">
            <div className="grid size-8 place-items-center rounded-lg bg-[hsl(var(--primary)/.14)] font-mono text-xs font-bold text-[hsl(var(--primary))]">LK</div>
            <div><div className="text-sm font-semibold">Local learner</div><div className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">STREAK IN PROGRESS</div></div>
          </div>
        </div>
      </aside>
      <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.86)] px-5 backdrop-blur-xl md:hidden">
        <Brand compact />
        <button onClick={() => setMobileMenu(value => !value)} className="rounded-lg border border-[hsl(var(--border))] p-2 text-[hsl(var(--muted-foreground))]" data-testid="button-mobile-menu" aria-label="Open navigation"><Command size={18} /></button>
      </header>
      {mobileMenu && <div className="fixed inset-x-0 top-[68px] z-30 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 shadow-xl md:hidden">{navItems.map(item => <NavItem key={item.href} item={item} active={location === item.href} onNavigate={() => setMobileMenu(false)} />)}</div>}
      <main className="relative z-10 mobile-scroll min-h-[100dvh] md:ml-[248px]">
        <div className="mx-auto max-w-[1420px] px-5 py-8 md:px-10 md:py-12">{children}</div>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/.94)] px-2 py-2 backdrop-blur-xl md:hidden" data-testid="mobile-bottom-nav">
        {navItems.map(item => <NavItem key={item.href} item={item} active={location === item.href} compact />)}
      </nav>
       <div className="fixed bottom-4 right-5 z-20 hidden items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/.9)] px-3 py-2 text-[10px] text-[hsl(var(--muted-foreground))] backdrop-blur md:flex"><span className="size-1.5 rounded-full bg-[hsl(var(--primary))]" /> {palette?.name ?? 'Workspace'} <span className="font-mono">⌘ K</span></div>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="flex items-center gap-3" data-testid="link-brand"><div className="relative grid size-9 place-items-center rounded-xl border border-[hsl(var(--primary)/.4)] bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]"><Code2 size={19} /><span className="absolute -right-1 -top-1 size-1.5 rounded-full bg-[hsl(var(--accent))]" /></div><div className={classNames(compact && 'hidden sm:block')}><div className="text-[15px] font-bold tracking-tight">Lokcodingpractice</div><div className="font-mono text-[9px] uppercase tracking-[.2em] text-[hsl(var(--muted-foreground))]">typing trainer</div></div></Link>;
}

function NavItem({ item, active, compact, onNavigate }: { item: { href: string; label: string; icon: LucideIcon }; active: boolean; compact?: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return <Link href={item.href} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={classNames('group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors', active ? 'bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]', compact && 'flex-col gap-1 px-2 py-1 text-[10px]')} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={compact ? 18 : 17} strokeWidth={active ? 2.4 : 1.8} /><span>{item.label}</span>{active && !compact && <span className="ml-auto size-1.5 rounded-full bg-[hsl(var(--primary))]" />}</Link>;
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.24em] text-[hsl(var(--primary))]"><span className="size-1.5 rounded-full bg-[hsl(var(--primary))]" />{eyebrow}</div><h1 className="max-w-3xl text-3xl font-bold tracking-[-.04em] text-[hsl(var(--foreground))] md:text-5xl">{title}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">{description}</p></div>{action}</div>;
}

function Metric({ icon: Icon, label, value, detail, accent = 'primary' }: { icon: LucideIcon; label: string; value: string; detail?: string; accent?: 'primary' | 'accent' | 'destructive' }) {
  return <div className="border-l border-[hsl(var(--border))] pl-4"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))]"><Icon size={13} className={accent === 'accent' ? 'text-[hsl(var(--accent))]' : accent === 'destructive' ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--primary))]'} />{label}</div><div className="mt-1 font-mono text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}>{value}</div>{detail && <div className="mt-0.5 text-[11px] text-[hsl(var(--muted-foreground))]">{detail}</div>}</div>;
}

function Practice({ snippets, runs, totalPoints, onFinish, onAddNotice }: { snippets: Snippet[]; runs: Run[]; totalPoints: number; onFinish: (run: Run) => void; onAddNotice: (message: string) => void }) {
  const [tier, setTier] = useState<Tier>('Small');
  const [activeSnippet, setActiveSnippet] = useState<Snippet | null>(null);
  const [selectedSnippetId, setSelectedSnippetId] = useState('');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState<Run | null>(null);
  const [typed, setTyped] = useState('');
  const [errors, setErrors] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const startedAt = useRef<number | null>(null);
  const bestRun = runs.length ? Math.max(...runs.map(run => run.wpm)) : 0;
  const unlocked = (candidate: Tier) => totalPoints >= tierMeta[candidate].unlock;
  const tierSnippets = useMemo(() => snippets.filter(item => item.tier === tier), [snippets, tier]);
  const selectedSnippet = tierSnippets.find(item => item.id === selectedSnippetId) ?? tierSnippets[0];

  useEffect(() => {
    if (!started) return;
    const timer = window.setInterval(() => {
      if (startedAt.current) setElapsed((Date.now() - startedAt.current) / 1000);
    }, 250);
    return () => window.clearInterval(timer);
  }, [started]);

  const begin = (snippet = selectedSnippet) => {
    if (!snippet) { onAddNotice('Add a snippet to this tier before starting.'); return; }
    setActiveSnippet(snippet); setTyped(''); setErrors(0); setElapsed(0); setFinished(null); setStarted(true); startedAt.current = Date.now();
    window.setTimeout(() => inputRef.current?.focus(), 60);
  };
  useEffect(() => {
    const onShortcut = (event: globalThis.KeyboardEvent) => {
      if (event.code === 'Space' && !started && !finished && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        event.preventDefault();
        begin();
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, [started, finished, selectedSnippet]);
  const reset = () => { setStarted(false); setActiveSnippet(null); setTyped(''); setErrors(0); setElapsed(0); startedAt.current = null; };
  const complete = (value: string, errorCount: number) => {
    if (!activeSnippet) return;
    const seconds = Math.max((Date.now() - (startedAt.current ?? Date.now())) / 1000, 1);
    const minutes = seconds / 60;
    const correct = activeSnippet.code.length - errorCount;
    const wpm = Math.max(0, Math.round((correct / 5) / minutes));
    const cpm = Math.max(0, Math.round(correct / minutes));
    const accuracy = Math.max(0, Math.round((activeSnippet.code.length / (activeSnippet.code.length + errorCount)) * 1000) / 10);
    const points = Math.round(tierMeta[activeSnippet.tier].points * (accuracy / 100) + wpm * 1.8);
    const run = { id: crypto.randomUUID(), snippetTitle: activeSnippet.title, tier: activeSnippet.tier, wpm, cpm, accuracy, seconds: Math.round(seconds), points, date: new Date().toISOString() };
    setStarted(false); setFinished(run); onFinish(run); startedAt.current = null;
  };
  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!activeSnippet || !started) return;
    if (event.key === 'Backspace') { event.preventDefault(); setTyped(value => value.slice(0, -1)); return; }
    if (event.key.length !== 1 && event.key !== 'Tab' && event.key !== 'Enter') return;
    event.preventDefault();
    const char = event.key === 'Tab' ? '\t' : event.key === 'Enter' ? '\n' : event.key;
    const position = typed.length;
    if (char !== activeSnippet.code[position]) setErrors(value => value + 1);
    const next = typed + char; setTyped(next);
    if (next.length >= activeSnippet.code.length) complete(next, errors + (char !== activeSnippet.code[position] ? 1 : 0));
  };

  if (finished) return <FinishState run={finished} onAgain={() => begin(activeSnippet ?? tierSnippets[0])} onExit={reset} />;
  if (started && activeSnippet) return <div className="rise">
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--primary))]"><span className="size-1.5 rounded-full bg-[hsl(var(--primary))] blink" /> LIVE RUN <span className="text-[hsl(var(--muted-foreground))]">/ {activeSnippet.language}</span></div><h1 className="mt-2 text-2xl font-bold tracking-tight">{activeSnippet.title}</h1></div><button onClick={reset} className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" data-testid="button-abandon-run"><X size={14} /> End run</button></div>
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4"><Metric icon={Gauge} label="WPM" value={elapsed ? Math.round(((typed.length - errors) / 5) / (elapsed / 60)).toString() : '0'} detail="words / minute" /><Metric icon={Activity} label="CPM" value={elapsed ? Math.round((typed.length - errors) / (elapsed / 60)).toString() : '0'} detail="characters / minute" accent="accent" /><Metric icon={Target} label="Accuracy" value={`${typed.length ? Math.round(((typed.length - errors) / typed.length) * 100) : 100}%`} detail={`${errors} corrections`} accent={errors ? 'destructive' : 'primary'} /><Metric icon={Clock3} label="Time" value={formatTime(elapsed)} detail="keep your rhythm" /></div>
      <div className="glass-line panel-glow overflow-hidden rounded-2xl border" data-testid="code-panel"><div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-3 text-[11px] text-[hsl(var(--muted-foreground))]"><span className="font-mono">snippet.ts</span><span>{Math.min(100, Math.round((typed.length / activeSnippet.code.length) * 100))}% complete</span></div><div className="h-1 bg-[hsl(var(--muted))]"><div className="progress-fill h-full bg-[hsl(var(--primary))]" style={{ width: `${(typed.length / activeSnippet.code.length) * 100}%` }} /></div><div className="relative min-h-[340px] p-5 md:p-10" onClick={() => inputRef.current?.focus()}><input ref={inputRef} autoFocus value="" readOnly onKeyDown={handleKey} aria-label="Type the code snippet" data-testid="input-code-capture" className="absolute left-0 top-0 size-px opacity-0" /><pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-[2] md:text-[15px]">{activeSnippet.code.split('').map((char, index) => { const typedChar = typed[index]; const isCurrent = index === typed.length; const wrong = typedChar && typedChar !== char; return <span key={`${index}-${char}`} className={classNames(typedChar && !wrong ? 'code-correct' : wrong ? 'code-wrong rounded-sm' : 'code-pending', isCurrent && 'border-l-2 border-[hsl(var(--primary))] pl-0.5')}>{char === '\n' ? '↵\n' : char}</span>; })}</pre><div className="pointer-events-none absolute bottom-5 right-5 hidden items-center gap-2 font-mono text-[10px] text-[hsl(var(--muted-foreground))] md:flex"><CircleHelp size={13} /> Type exactly as shown</div></div></div>
    <div className="mt-4 flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]"><span>Tip: accuracy compounds. Slow is smooth.</span><span className="font-mono">{typed.length} / {activeSnippet.code.length} chars</span></div>
  </div>;

  return <div className="rise">
    <PageIntro eyebrow="Daily practice / 01" title={bestRun ? 'Keep the signal clean.' : 'Build your typing muscle.'} description="A short, intentional run through the syntax you use every day. No words per minute theater — just better instincts at the keyboard." action={<div className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.55)] px-3 py-2 text-xs text-[hsl(var(--muted-foreground))]"><Flame size={16} className="text-[hsl(var(--accent))]" /><span><strong className="text-[hsl(var(--foreground))]">{runs.length ? `${Math.min(runs.length + 2, 7)} day` : 'Start a'} streak</strong> <span className="hidden sm:inline">— show up, sharpen up</span></span></div>} />
    <div className="mb-8 flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]"><span className="font-mono text-[hsl(var(--primary))]">SELECT TIER</span><div className="h-px w-10 bg-[hsl(var(--border))]" /><span>Choose the pressure that feels useful today.</span></div>
    <div className="grid gap-3 md:grid-cols-5">{(Object.keys(tierMeta) as Tier[]).map((candidate, index) => { const meta = tierMeta[candidate]; const isUnlocked = unlocked(candidate); return <button key={candidate} disabled={!isUnlocked} onClick={() => setTier(candidate)} className={classNames('group relative overflow-hidden rounded-xl border p-4 text-left transition-all', tier === candidate ? 'border-[hsl(var(--primary)/.7)] bg-[hsl(var(--primary)/.1)]' : isUnlocked ? 'border-[hsl(var(--border))] bg-[hsl(var(--card)/.5)] hover:-translate-y-0.5 hover:border-[hsl(var(--foreground)/.3)]' : 'cursor-not-allowed border-[hsl(var(--border)/.55)] bg-[hsl(var(--card)/.25)] opacity-55')} data-testid={`button-tier-${candidate.toLowerCase()}`}><div className="mb-7 flex items-center justify-between"><span className="font-mono text-[10px]" style={{ color: isUnlocked ? meta.color : undefined }}>{meta.tag}</span>{isUnlocked ? <span className="size-1.5 rounded-full" style={{ backgroundColor: meta.color }} /> : <LockKeyhole size={14} />}</div><div className="font-semibold">{candidate}</div><div className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">{isUnlocked ? meta.subtitle : `Earn ${meta.unlock} pts`}</div>{tier === candidate && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-[hsl(var(--primary))]" />}</button>; })}</div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
      <div className="glass-line panel-glow rounded-2xl border p-6 md:p-8"><div className="flex items-start justify-between gap-5"><div><div className="mb-2 font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Next up / {tier}</div><h2 className="text-2xl font-bold tracking-tight">{selectedSnippet?.title ?? 'No snippets yet'}</h2><p className="mt-2 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">{selectedSnippet?.description ?? 'Add a custom snippet in your library to make this tier yours.'}</p></div><div className="hidden rounded-lg border border-[hsl(var(--border))] px-2 py-1 font-mono text-[10px] text-[hsl(var(--muted-foreground))] sm:block">{selectedSnippet?.language ?? 'CUSTOM'}</div></div>{tierSnippets.length > 1 && <label className="mt-6 block max-w-sm text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Choose a drill<select value={selectedSnippet?.id ?? ''} onChange={event => setSelectedSnippetId(event.target.value)} className="mt-2 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background)/.7)] px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))]" data-testid="select-practice-snippet">{tierSnippets.map(item => <option key={item.id} value={item.id}>{item.title}{item.custom ? ' · local' : ''}</option>)}</select></label>}<div className="mt-8 flex flex-wrap items-center gap-3"><button onClick={() => begin()} className="flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-3 text-sm font-bold text-[hsl(var(--primary-foreground))] transition-transform hover:-translate-y-0.5" data-testid="button-start-run"><Play size={16} fill="currentColor" /> Start a run <span className="ml-2 border-l border-[hsl(var(--primary-foreground)/.25)] pl-3 font-mono text-xs">{tierMeta[tier].points} pts</span></button><Link href="/snippets" className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] px-4 py-3 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" data-testid="link-browse-snippets">Browse library <ArrowRight size={15} /></Link></div></div>
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.45)] p-6"><div className="flex items-center justify-between"><div className="font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Run note</div><Sparkles size={16} className="text-[hsl(var(--accent))]" /></div><p className="mt-8 text-xl leading-8 tracking-tight text-[hsl(var(--foreground)/.85)]">“Fluency is not speed. It is the moment syntax stops being a decision.”</p><div className="mt-8 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><span className="size-1.5 rounded-full bg-[hsl(var(--accent))]" /> {bestRun ? `Personal best: ${bestRun} WPM` : 'Your first best is waiting'}</div></div>
    </div>
    <div className="mt-10 border-t border-[hsl(var(--border))] pt-5 text-xs text-[hsl(var(--muted-foreground))]"><span className="font-mono text-[hsl(var(--primary))]">SPACE</span> starts the selected run <span className="mx-3 text-[hsl(var(--border))]">/</span> Your progress stays in this browser</div>
  </div>;
}

function FinishState({ run, onAgain, onExit }: { run: Run; onAgain: () => void; onExit: () => void }) {
  return <div className="rise mx-auto max-w-4xl"><div className="mb-10 text-center"><div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl border border-[hsl(var(--accent)/.4)] bg-[hsl(var(--accent)/.12)] text-[hsl(var(--accent))]"><Trophy size={28} /></div><div className="font-mono text-[10px] uppercase tracking-[.25em] text-[hsl(var(--accent))]">Run complete</div><h1 className="mt-3 text-4xl font-bold tracking-[-.05em] md:text-6xl">Good work. Again?</h1><p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">{run.snippetTitle} <span className="mx-2">·</span> {run.tier} tier <span className="mx-2">·</span> {new Date(run.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p></div><div className="grid gap-3 sm:grid-cols-4"><Metric icon={Gauge} label="WPM" value={run.wpm.toString()} /><Metric icon={Activity} label="CPM" value={run.cpm.toString()} accent="accent" /><Metric icon={Target} label="Accuracy" value={`${run.accuracy}%`} /><Metric icon={Zap} label="Earned" value={`+${run.points}`} detail="points" accent="accent" /></div><div className="mt-10 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.55)] p-6 text-center"><div className="font-mono text-xs text-[hsl(var(--muted-foreground))]">CREDITS ADDED TO YOUR ROOM</div><div className="mt-2 text-3xl font-bold text-[hsl(var(--accent))]">+{Math.max(3, Math.round(run.points / 18))} credits</div><div className="mt-8 flex flex-wrap justify-center gap-3"><button onClick={onAgain} className="flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-3 text-sm font-bold text-[hsl(var(--primary-foreground))]" data-testid="button-run-again"><RotateCcw size={16} /> Run it again</button><button onClick={onExit} className="rounded-xl border border-[hsl(var(--border))] px-5 py-3 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" data-testid="button-finish-done">Back to practice</button></div></div></div>;
}

function Progress({ runs, liveBuilds, totalPoints, credits }: { runs: Run[]; liveBuilds: LiveStudioBuild[]; totalPoints: number; credits: number }) {
  const allAttempts = [...runs, ...liveBuilds];
  const average = allAttempts.length ? Math.round(allAttempts.reduce((sum, run) => sum + run.wpm, 0) / allAttempts.length) : 0;
  const accuracy = allAttempts.length ? Math.round(allAttempts.reduce((sum, run) => sum + run.accuracy, 0) / allAttempts.length * 10) / 10 : 0;
  const best = allAttempts.length ? Math.max(...allAttempts.map(run => run.wpm)) : 0;
  const counts = (Object.keys(tierMeta) as Tier[]).map(tier => ({ tier, count: runs.filter(run => run.tier === tier).length + liveBuilds.filter(build => build.tier === tier).length }));
  return <div className="rise"><PageIntro eyebrow="Insights / 02" title="Your signal, over time." description="Progress is the quiet accumulation of clean repetitions. Here is what your last sessions are teaching you." action={<div className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.5)] px-4 py-3"><Trophy size={16} className="text-[hsl(var(--accent))]" /><span className="font-mono text-xs">{totalPoints.toLocaleString()} pts</span></div>} /><div className="grid gap-3 md:grid-cols-4"><Metric icon={Gauge} label="Best WPM" value={best.toString()} detail="all time" /><Metric icon={Activity} label="Average WPM" value={average.toString()} detail="across all runs" accent="accent" /><Metric icon={Target} label="Avg accuracy" value={`${accuracy}%`} detail="keep above 95%" /><Metric icon={Zap} label="Credits" value={credits.toLocaleString()} detail="available to use" accent="accent" /></div><div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_.65fr]"><div className="glass-line rounded-2xl border p-6 md:p-8"><div className="flex items-center justify-between"><div><h2 className="font-semibold">WPM trajectory</h2><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Your last {Math.min(runs.length, 12)} recorded runs</p></div><Activity size={17} className="text-[hsl(var(--primary))]" /></div>{runs.length ? <div className="mt-10 flex h-48 items-end gap-2 border-b border-l border-[hsl(var(--border))] px-3 pb-0">{runs.slice(-12).map((run, index) => <div key={run.id} className="group flex h-full flex-1 flex-col justify-end gap-2"><div className="text-center font-mono text-[9px] text-[hsl(var(--muted-foreground))] opacity-0 transition-opacity group-hover:opacity-100">{run.wpm}</div><div className="w-full rounded-t-md bg-[hsl(var(--primary)/.7)] transition-all group-hover:bg-[hsl(var(--primary))]" style={{ height: `${Math.max(8, Math.min(100, run.wpm / Math.max(best, 1) * 100))}%` }} /><div className="text-center font-mono text-[9px] text-[hsl(var(--muted-foreground))]">{index + 1}</div></div>)}</div> : <EmptyState icon={BarChart3} title="Your chart starts with one run." description="Complete a practice session to see your rhythm take shape." compact />}</div><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.45)] p-6"><h2 className="font-semibold">Tier readiness</h2><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Repetition unlocks range.</p><div className="mt-7 space-y-5">{counts.map(({ tier: item, count }) => <div key={item}><div className="mb-2 flex justify-between text-xs"><span>{item}</span><span className="font-mono text-[hsl(var(--muted-foreground))]">{count} {count === 1 ? 'run' : 'runs'}</span></div><div className="h-1.5 rounded-full bg-[hsl(var(--muted))]"><div className="h-full rounded-full" style={{ width: `${Math.min(100, count * 22)}%`, backgroundColor: tierMeta[item].color }} /></div></div>)}</div></div></div><div className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Recent runs</h2><span className="font-mono text-[10px] uppercase tracking-[.15em] text-[hsl(var(--muted-foreground))]">{runs.length} total</span></div>{runs.length ? <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))]">{runs.slice().reverse().slice(0, 8).map(run => <div key={run.id} className="flex flex-wrap items-center gap-4 border-b border-[hsl(var(--border))] px-5 py-4 last:border-0"><div className="grid size-8 place-items-center rounded-lg bg-[hsl(var(--primary)/.1)] font-mono text-[10px] text-[hsl(var(--primary))]">{run.tier.slice(0, 2).toUpperCase()}</div><div className="min-w-[150px] flex-1"><div className="text-sm font-medium">{run.snippetTitle}</div><div className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">{new Date(run.date).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {formatTime(run.seconds)}</div></div><div className="text-right"><div className="font-mono text-sm">{run.wpm} <span className="text-[10px] text-[hsl(var(--muted-foreground))]">WPM</span></div><div className="text-[11px] text-[hsl(var(--primary))]">{run.accuracy}% accuracy</div></div><div className="font-mono text-xs text-[hsl(var(--accent))]">+{run.points}</div></div>)}</div> : <EmptyState icon={Clock3} title="No sessions recorded." description="A practice run takes less than two minutes. Make one count." />}</div>{liveBuilds.length > 0 && <div className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Live builds</h2><span className="font-mono text-[10px] uppercase tracking-[.15em] text-[hsl(var(--muted-foreground))]">{liveBuilds.length} created</span></div><div className="grid gap-3 md:grid-cols-2">{liveBuilds.slice().reverse().slice(0, 6).map(build => <div key={build.id} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.45)] px-5 py-4" data-testid={`row-live-build-${build.id}`}><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-semibold">{build.title}</div><div className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">{build.cadence} · {build.tier} · {new Date(build.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div></div><span className="font-mono text-xs text-[hsl(var(--accent))]">+{build.points}</span></div><div className="mt-3 flex items-center gap-3 font-mono text-[10px] text-[hsl(var(--muted-foreground))]"><span>{build.wpm} WPM</span><span>{build.accuracy}% accuracy</span><span>{formatTime(build.seconds)}</span></div></div>)}</div></div>}</div>;
}

function Snippets({ snippets, onAdd, onDelete, onAddNotice }: { snippets: Snippet[]; onAdd: (snippet: Snippet) => void; onDelete: (id: string) => void; onAddNotice: (message: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'All' | Tier>('All');
  const [form, setForm] = useState({ title: '', language: 'TypeScript', tier: 'Small' as Tier, description: '', code: '' });
  const filtered = snippets.filter(item => (filter === 'All' || item.tier === filter) && `${item.title} ${item.language} ${item.description}`.toLowerCase().includes(query.toLowerCase()));
  const save = (event: FormEvent) => { event.preventDefault(); if (!form.title.trim() || !form.code.trim()) { onAddNotice('Give your snippet a title and some code first.'); return; } onAdd({ ...form, id: `custom-${Date.now()}`, title: form.title.trim(), description: form.description.trim() || 'A custom drill from your local library.', code: form.code, custom: true }); setForm({ title: '', language: 'TypeScript', tier: 'Small', description: '', code: '' }); setShowForm(false); onAddNotice('Snippet added to your local library.'); };
  return <div className="rise"><PageIntro eyebrow="Library / 03" title="Practice the code you actually write." description="Keep the syntax close to home. Seeded drills are ready now; add your own patterns and they stay right here in this browser." action={<button onClick={() => setShowForm(value => !value)} className="flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-bold text-[hsl(var(--primary-foreground))]" data-testid="button-add-snippet"><Plus size={16} /> Add snippet</button>} />{showForm && <form onSubmit={save} className="mb-8 rounded-2xl border border-[hsl(var(--primary)/.35)] bg-[hsl(var(--primary)/.05)] p-5 md:p-7 rise"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">New local snippet</h2><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Make a drill from your own codebase.</p></div><button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" data-testid="button-close-snippet-form"><X size={16} /></button></div><div className="grid gap-4 md:grid-cols-2"><label className="text-xs text-[hsl(var(--muted-foreground))]">Title<input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="e.g. Parse the response" className="mt-2 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background)/.7)] px-3 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))]" data-testid="input-snippet-title" /></label><label className="text-xs text-[hsl(var(--muted-foreground))]">Language<input value={form.language} onChange={event => setForm({ ...form, language: event.target.value })} placeholder="TypeScript" className="mt-2 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background)/.7)] px-3 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))]" data-testid="input-snippet-language" /></label><label className="text-xs text-[hsl(var(--muted-foreground))]">Tier<select value={form.tier} onChange={event => setForm({ ...form, tier: event.target.value as Tier })} className="mt-2 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background)/.7)] px-3 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))]" data-testid="select-snippet-tier">{(Object.keys(tierMeta) as Tier[]).map(item => <option key={item}>{item}</option>)}</select></label><label className="text-xs text-[hsl(var(--muted-foreground))]">Description<input value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="What does this pattern teach?" className="mt-2 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background)/.7)] px-3 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))]" data-testid="input-snippet-description" /></label></div><label className="mt-4 block text-xs text-[hsl(var(--muted-foreground))]">Code<textarea value={form.code} onChange={event => setForm({ ...form, code: event.target.value })} rows={6} placeholder={'const result = await service.run();\\nreturn result;' } className="mt-2 w-full resize-y rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background)/.7)] px-3 py-3 font-mono text-xs leading-6 text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))]" data-testid="textarea-snippet-code" /></label><button type="submit" className="mt-4 flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-bold text-[hsl(var(--primary-foreground))]" data-testid="button-save-snippet"><Check size={15} /> Save to library</button></form>}<div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div className="relative max-w-sm flex-1"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search patterns, languages..." className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.55)] px-4 py-3 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))]" data-testid="input-search-snippets" /></div><div className="flex items-center gap-1 overflow-auto rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.4)] p-1">{(['All', ...Object.keys(tierMeta)] as Array<'All' | Tier>).map(item => <button key={item} onClick={() => setFilter(item)} className={classNames('whitespace-nowrap rounded-lg px-3 py-2 text-xs', filter === item ? 'bg-[hsl(var(--primary)/.14)] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]')} data-testid={`button-filter-${item.toLowerCase()}`}>{item}</button>)}</div></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(item => <SnippetCard key={item.id} snippet={item} canDelete={!!item.custom} onDelete={onDelete} />)}</div>{!filtered.length && <EmptyState icon={BookOpen} title="No matching snippets." description="Try a different search or add a custom drill to this library." action={<button onClick={() => setShowForm(true)} className="text-sm font-medium text-[hsl(var(--primary))]" data-testid="button-empty-add-snippet">Add your own <ArrowRight size={14} className="ml-1 inline" /></button>} />}</div>;
}

function SnippetCard({ snippet, canDelete, onDelete }: { snippet: Snippet; canDelete: boolean; onDelete: (id: string) => void }) {
  return <article className="group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.48)] p-5 transition-colors hover:border-[hsl(var(--foreground)/.25)]" data-testid={`card-snippet-${snippet.id}`}><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><span className="rounded-md border border-[hsl(var(--border))] px-2 py-1 font-mono text-[10px] text-[hsl(var(--muted-foreground))]">{snippet.language}</span>{snippet.custom && <span className="rounded-md bg-[hsl(var(--accent)/.12)] px-2 py-1 font-mono text-[10px] text-[hsl(var(--accent))]">LOCAL</span>}</div><span className="font-mono text-[10px]" style={{ color: tierMeta[snippet.tier].color }}>{snippet.tier}</span></div><h2 className="mt-5 text-lg font-semibold tracking-tight">{snippet.title}</h2><p className="mt-1 min-h-10 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{snippet.description}</p><pre className="mt-5 max-h-28 overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background)/.65)] p-3 font-mono text-[10px] leading-5 text-[hsl(var(--foreground)/.65)]">{snippet.code}</pre><div className="mt-5 flex items-center justify-between"><span className="text-[11px] text-[hsl(var(--muted-foreground))]">{snippet.code.length} characters</span>{canDelete && <button onClick={() => onDelete(snippet.id)} className="flex items-center gap-1 text-[11px] text-[hsl(var(--destructive))] opacity-70 hover:opacity-100" data-testid={`button-delete-snippet-${snippet.id}`}><Trash2 size={13} /> Delete</button>}</div></article>;
}

function Themes({ theme, setTheme, totalPoints, motionPreference, setMotionPreference, systemReducedMotion }: { theme: ThemeName; setTheme: (theme: ThemeName) => void; totalPoints: number; motionPreference: MotionPreference; setMotionPreference: (preference: MotionPreference) => void; systemReducedMotion: boolean }) {
  const [tierFilter, setTierFilter] = useState<PaletteTierFilter>(() => {
    const saved = readStorage<string>('codesprint_palette_tier', 'All');
    return saved === 'All' || Object.prototype.hasOwnProperty.call(tierMeta, saved) ? saved as PaletteTierFilter : 'All';
  });
  const [levelFilter, setLevelFilter] = useState<number | 'All'>(() => {
    const saved = readStorage<number | string>('codesprint_palette_level', 'All');
    return saved === 'All' || (typeof saved === 'number' && Number.isInteger(saved) && saved >= 1 && saved <= 4) ? saved : 'All';
  });
  const [variantFilter, setVariantFilter] = useState<PaletteVariantFilter>(() => {
    const saved = readStorage<string>('codesprint_palette_filter', 'All');
    return saved === 'Static' || saved === 'Animated' || saved === 'All' ? saved : 'All';
  });
  const selectedPalette = paletteCatalog.find(item => item.id === theme) ?? paletteCatalog[0];
  const unlockedTiers = (Object.keys(tierMeta) as Tier[]).filter(candidate => totalPoints >= tierMeta[candidate].unlock);
  const isUnlocked = (palette: PaletteDefinition) => totalPoints >= tierMeta[palette.tier].unlock;
  const filteredPalettes = paletteCatalog.filter(palette => (
    (tierFilter === 'All' || palette.tier === tierFilter)
    && (levelFilter === 'All' || palette.level === levelFilter)
    && (variantFilter === 'All' || (variantFilter === 'Animated' ? palette.animated : !palette.animated))
  ));

  useEffect(() => {
    if (tierFilter !== 'All' && !unlockedTiers.includes(tierFilter)) setTierFilter('All');
  }, [tierFilter, totalPoints]);
  useEffect(() => { window.localStorage.setItem('codesprint_palette_tier', JSON.stringify(tierFilter)); }, [tierFilter]);
  useEffect(() => { window.localStorage.setItem('codesprint_palette_level', JSON.stringify(levelFilter)); }, [levelFilter]);
  useEffect(() => { window.localStorage.setItem('codesprint_palette_filter', JSON.stringify(variantFilter)); }, [variantFilter]);

  return <div className="rise">
    <PageIntro eyebrow="Workspace / 04" title="Tune the room around you." description="Choose a palette from the practice tiers, preview its editor surface, and keep motion at a level that helps you focus." />
    <section className="mb-7 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.38)] p-4 md:p-5" data-testid="palette-browser">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--primary))]"><WandSparkles size={13} /> Palette progression</div>
          <p className="mt-2 max-w-xl text-xs leading-5 text-[hsl(var(--muted-foreground))]">Four progression levels shape each tier, with strange new worlds woven through the collection. Earn practice points to unlock the deeper rooms.</p>
        </div>
        <div className="rounded-lg border border-[hsl(var(--primary)/.22)] bg-[hsl(var(--primary)/.06)] px-3 py-2 font-mono text-[10px] text-[hsl(var(--primary))]" data-testid="text-palette-count">{filteredPalettes.length} / {paletteCatalog.length} palettes</div>
      </div>
      <div className="mt-5 overflow-x-auto pb-1" role="tablist" aria-label="Palette tiers">
        <div className="flex min-w-max gap-2">
          <button type="button" role="tab" aria-selected={tierFilter === 'All'} onClick={() => setTierFilter('All')} className={classNames('rounded-xl border px-3.5 py-3 text-left transition-colors', tierFilter === 'All' ? 'border-[hsl(var(--primary)/.6)] bg-[hsl(var(--primary)/.1)]' : 'border-[hsl(var(--border))] bg-[hsl(var(--background)/.3)]')} data-testid="button-palette-tier-all"><span className="block font-mono text-[9px] text-[hsl(var(--muted-foreground))]">ALL</span><span className="mt-1 block text-xs font-semibold">All tiers</span></button>
          {(Object.keys(tierMeta) as Tier[]).map((candidate) => {
            const unlocked = unlockedTiers.includes(candidate);
            return <button key={candidate} type="button" role="tab" disabled={!unlocked} aria-selected={tierFilter === candidate} aria-label={unlocked ? `${candidate} palette tier` : `${candidate} palette tier locked`} onClick={() => setTierFilter(candidate)} className={classNames('rounded-xl border px-3.5 py-3 text-left transition-colors', tierFilter === candidate ? 'border-[hsl(var(--primary)/.6)] bg-[hsl(var(--primary)/.1)]' : unlocked ? 'border-[hsl(var(--border))] bg-[hsl(var(--background)/.3)] hover:border-[hsl(var(--foreground)/.3)]' : 'cursor-not-allowed border-[hsl(var(--border)/.5)] bg-[hsl(var(--background)/.2)] opacity-50')} data-testid={`button-palette-tier-${candidate.toLowerCase()}`}><span className="flex items-center gap-2 font-mono text-[9px]" style={{ color: unlocked ? tierMeta[candidate].color : undefined }}>{tierMeta[candidate].tag} {unlocked ? 'OPEN' : <LockKeyhole size={10} />}</span><span className="mt-1 block text-xs font-semibold">{candidate}</span><span className="mt-1 block text-[9px] text-[hsl(var(--muted-foreground))]">{unlocked ? tierMeta[candidate].subtitle : `Earn ${tierMeta[candidate].unlock} pts`}</span></button>;
          })}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 border-t border-[hsl(var(--border))] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto" role="group" aria-label="Filter palettes by level">
          <span className="mr-2 shrink-0 font-mono text-[9px] uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))]">Level</span>
          {(['All', 1, 2, 3, 4] as Array<number | 'All'>).map(level => <button key={level} type="button" aria-pressed={levelFilter === level} onClick={() => setLevelFilter(level)} className={classNames('rounded-lg px-2.5 py-1.5 text-[10px]', levelFilter === level ? 'bg-[hsl(var(--primary)/.14)] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]')} data-testid={`button-palette-level-${level === 'All' ? 'all' : level}`}>{level === 'All' ? 'All' : `0${level}`}</button>)}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] p-1" role="group" aria-label="Filter palettes by motion">
          {(['All', 'Static', 'Animated'] as PaletteVariantFilter[]).map(filter => <button key={filter} type="button" aria-pressed={variantFilter === filter} onClick={() => setVariantFilter(filter)} className={classNames('rounded-md px-2.5 py-1.5 text-[10px]', variantFilter === filter ? 'bg-[hsl(var(--primary)/.14)] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]')} data-testid={`button-palette-filter-${filter.toLowerCase()}`}>{filter}</button>)}
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredPalettes.map(palette => {
          const unlocked = isUnlocked(palette);
          const selected = theme === palette.id;
           return <button key={palette.id} type="button" disabled={!unlocked} aria-pressed={selected} aria-label={`${palette.name}, ${palette.tier} tier, level ${palette.level}${palette.animated ? ', animated' : ', static'}`} onClick={() => { if (unlocked) setTheme(palette.id); }} className={classNames('palette-card group relative overflow-hidden rounded-2xl border p-4 text-left transition-all', `palette-card-tier-${palette.tier.toLowerCase()}`, selected ? 'is-selected border-[hsl(var(--primary)/.75)] bg-[hsl(var(--primary)/.09)] shadow-[0_0_0_1px_hsl(var(--primary)/.14)]' : unlocked ? 'border-[hsl(var(--border))] bg-[hsl(var(--background)/.3)] hover:-translate-y-0.5 hover:border-[hsl(var(--foreground)/.3)]' : 'is-locked cursor-not-allowed border-[hsl(var(--border)/.5)] bg-[hsl(var(--background)/.2)] opacity-55')} data-testid={`button-theme-${palette.id}`} data-palette-id={palette.id} data-palette-tier={palette.tier.toLowerCase()} data-palette-level={palette.level} data-palette-animated={palette.animated ? 'true' : 'false'}>
               <div className={classNames('palette-preview relative mb-4 overflow-hidden rounded-xl border border-white/10 p-3', palette.animated && 'palette-preview-animated', palette.animated && `palette-preview-${palette.animation}`)} data-palette-animation={palette.animation} data-palette-motif={paletteMotifs[palette.id]} style={{ background: `linear-gradient(135deg, ${palette.colors[0]}, ${palette.colors[0]} 45%, ${palette.colors[1]})` }}>
               {paletteMotif(palette)}
                <div className="palette-preview-index font-mono" aria-hidden="true">0{palette.level}</div>
                <div className="palette-preview-state font-mono" aria-hidden="true"><span className={classNames('palette-state-dot', palette.animated ? 'is-animated' : 'is-static')} />{palette.animated ? 'LIVE' : 'STILL'}</div>
               <div className="relative z-10 flex items-center gap-1.5 border-b border-white/15 pb-2"><span className="size-1.5 rounded-full bg-white/50" /><span className="size-1.5 rounded-full bg-white/35" /><span className="size-1.5 rounded-full bg-white/25" /><span className="ml-2 font-mono text-[8px] text-white/60">{palette.name.toLowerCase().replaceAll(' ', '-')}.ts</span></div>
               <div className="relative z-10 mt-3 space-y-1 font-mono text-[9px]"><div className="text-white/60">01 <span style={{ color: palette.colors[1] }}>const</span> signal = <span style={{ color: palette.colors[2] }}>focus</span>();</div><div className="text-white/60">02 <span style={{ color: palette.colors[1] }}>await</span> signal.<span style={{ color: palette.colors[2] }}>repeat</span>();</div></div>
            </div>
             <div className="palette-card-heading flex items-start justify-between gap-3"><div><div className="font-semibold">{palette.name}</div><div className="mt-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.1em] text-[hsl(var(--muted-foreground))]"><span>{palette.tier}</span><span className="text-[hsl(var(--border))]">/</span><span>Level {palette.level}</span><span className="text-[hsl(var(--border))]">/</span><span>{palette.animated ? 'Animated' : 'Static'}</span></div></div>{selected ? <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" aria-label="Selected palette"><Check size={14} /></span> : !unlocked ? <LockKeyhole size={15} className="shrink-0 text-[hsl(var(--muted-foreground))]" /> : null}</div>
             <div className="palette-level-track" aria-label={`${palette.level} of 4 progression detail`}><span className="font-mono text-[8px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Depth</span>{[1, 2, 3, 4].map(step => <span key={step} className={classNames('palette-level-segment', step <= palette.level && 'is-filled')} />)}<span className="ml-auto font-mono text-[8px] text-[hsl(var(--muted-foreground))]">{tierMeta[palette.tier].tag} / {tierMeta[palette.tier].subtitle}</span></div>
            <p className="mt-3 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{unlocked ? palette.description : `Unlocks at ${tierMeta[palette.tier].unlock} points.`}</p>
          </button>;
        })}
      </div>
      {!filteredPalettes.length && <div className="mt-5 rounded-xl border border-dashed border-[hsl(var(--border))] px-4 py-7 text-center text-xs text-[hsl(var(--muted-foreground))]">No palettes match these filters.</div>}
      <div className="mt-4 text-xs text-[hsl(var(--muted-foreground))]" role="status" aria-live="polite" data-testid="palette-selection-status">{selectedPalette.name} is selected{selectedPalette.animated ? ' · animated variant' : ' · static variant'}.</div>
    </section>
    <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.45)] p-6">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]"><Settings2 size={14} className="text-[hsl(var(--primary))]" /> Preferences</div>
        <div className="mt-7 space-y-5">
          <Preference label="Show key hints" detail="Keep small reminders beneath practice" enabled />
          <Preference label="Sound feedback" detail="Subtle tones for clean streaks" enabled={false} />
           <div className="border-t border-[hsl(var(--border))] pt-5"><div className="text-sm">Palette motion</div><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Low-amplitude theme signals carry from the visualizer into the room. Code text and layout stay still.</p><div className="mt-3 flex gap-1 rounded-lg border border-[hsl(var(--border))] p-1" role="radiogroup" aria-label="Palette motion preference">{(['auto', 'on', 'off'] as MotionPreference[]).map(option => <button key={option} type="button" role="radio" aria-checked={motionPreference === option} onClick={() => setMotionPreference(option)} className={classNames('flex-1 rounded-md px-2 py-2 text-[10px] capitalize', motionPreference === option ? 'bg-[hsl(var(--primary)/.14)] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]')} data-testid={`button-motion-${option}`}>{option}</button>)}</div><div className="mt-2 text-[10px] text-[hsl(var(--muted-foreground))]" data-testid="text-motion-status">{systemReducedMotion ? 'System reduced motion is active; palette motion stays off.' : motionPreference === 'auto' ? 'Following your system motion setting.' : motionPreference === 'on' ? 'Motion is enabled for animated palettes.' : 'Motion is disabled.'}</div></div>
          <Preference label="Focus mode" detail="Hide stats while you type" enabled={false} />
        </div>
      </div>
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.45)] p-6">
         <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]"><span>Preview / editor surface</span><span className="palette-editor-live-label" data-testid="text-editor-motion-label">{selectedPalette.animated ? 'Visualizer live' : 'Visualizer still'}</span></div>
          <div className={classNames('palette-editor-surface mt-5 overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]', `palette-editor-surface-tier-${selectedPalette.tier.toLowerCase()}`)} data-palette-tier={selectedPalette.tier.toLowerCase()} data-palette-level={selectedPalette.level}>
            <div className={classNames('palette-editor-motif relative h-24 overflow-hidden border-b border-[hsl(var(--border))]', selectedPalette.animated && 'palette-preview-animated', selectedPalette.animated && `palette-preview-${selectedPalette.animation}`)} data-palette-motif={paletteMotifs[selectedPalette.id]} data-palette-animation={selectedPalette.animation}>
             {paletteMotif(selectedPalette)}
              <div className="palette-editor-motif-caption"><span>LIVE VISUALIZER</span><span>{selectedPalette.animated ? selectedPalette.animation : 'quiet signal'}</span></div>
           </div>
          <div className="flex items-center gap-1 border-b border-[hsl(var(--border))] px-4 py-3"><span className="size-2 rounded-full bg-[hsl(var(--destructive)/.75)]" /><span className="size-2 rounded-full bg-[hsl(var(--accent)/.75)]" /><span className="size-2 rounded-full bg-[hsl(var(--primary)/.75)]" /><span className="ml-3 font-mono text-[10px] text-[hsl(var(--muted-foreground))]">{selectedPalette.name.toLowerCase().replaceAll(' ', '-')}.ts</span></div>
          <pre className="p-5 font-mono text-xs leading-7"><span className="text-[hsl(var(--muted-foreground))]">01 </span><span className="text-[hsl(var(--primary))]">const</span> <span className="text-[hsl(var(--accent))]">practice</span> = <span className="text-[hsl(var(--foreground)/.7)]">focus</span>();{'\n'}<span className="text-[hsl(var(--muted-foreground))]">02 </span><span className="text-[hsl(var(--primary))]">await</span> practice.<span className="text-[hsl(var(--accent))]">repeat</span>();<span className="blink ml-1 inline-block h-4 border-l-2 border-[hsl(var(--primary))] align-middle" /></pre>
        </div>
      </div>
    </div>
  </div>;
}

function Preference({ label, detail, enabled }: { label: string; detail: string; enabled: boolean }) {
  const [active, setActive] = useState(enabled);
  return <button onClick={() => setActive(value => !value)} className="flex w-full items-center justify-between gap-4 text-left" data-testid={`button-preference-${label.toLowerCase().replaceAll(' ', '-')}`}><span><span className="block text-sm">{label}</span><span className="mt-1 block text-xs text-[hsl(var(--muted-foreground))]">{detail}</span></span><span className={classNames('relative h-5 w-9 rounded-full transition-colors', active ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))]')}><span className={classNames('absolute top-1 size-3 rounded-full transition-transform', active ? 'translate-x-5 bg-[hsl(var(--primary-foreground))]' : 'translate-x-1 bg-[hsl(var(--muted-foreground))]')} /></span></button>;
}

function EmptyState({ icon: Icon, title, description, action, compact }: { icon: LucideIcon; title: string; description: string; action?: ReactNode; compact?: boolean }) {
  return <div className={classNames('flex flex-col items-center justify-center text-center', compact ? 'h-40' : 'min-h-64 rounded-2xl border border-dashed border-[hsl(var(--border))]')}><div className="mb-4 grid size-11 place-items-center rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"><Icon size={19} /></div><h2 className="font-semibold">{title}</h2><p className="mt-2 max-w-sm text-xs leading-5 text-[hsl(var(--muted-foreground))]">{description}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

function NotFound() {
  return <EmptyState icon={CircleHelp} title="That room does not exist." description="Return to practice and start a useful run." action={<Link href="/" className="text-sm text-[hsl(var(--primary))]" data-testid="link-not-found-home">Go to practice <ArrowRight size={14} className="ml-1 inline" /></Link>} />;
}

function LiveStudioPage({ totalPoints, initialBuild, onFinish, onAddNotice }: { totalPoints: number; initialBuild?: Partial<LiveStudioBuild> | null; onFinish: (build: LiveStudioBuild) => void; onAddNotice: (message: string) => void }) {
  const initialTier = curatedLiveStudioChallengeCatalog.some(challenge => challenge.tier === initialBuild?.tier) ? initialBuild?.tier as LiveStudioTier : 'Small';
  const initialCadence = initialBuild?.cadence === 'Weekly' || initialBuild?.cadence === 'Monthly' ? initialBuild.cadence : 'Daily';
  const today = useMemo(() => new Date(), []);
  const initialDailyDay = initialBuild?.cadence === 'Daily' && initialBuild.date ? new Date(initialBuild.date).getDate() : today.getDate();
  const initialChallenge = initialBuild?.challengeId ? curatedLiveStudioChallengeCatalog.find(challenge => challenge.id === initialBuild.challengeId && challenge.tier === initialTier) : undefined;
  const [cadence, setCadence] = useState<LiveStudioCadence>(initialCadence);
  const [tier, setTier] = useState<LiveStudioTier>(initialTier);
  const [dailyDay, setDailyDay] = useState(initialDailyDay);
  const [challengeId, setChallengeId] = useState(initialChallenge?.id ?? '');
  const dailyDate = useMemo(() => new Date(today.getFullYear(), today.getMonth(), dailyDay, 12), [dailyDay, today]);
  const scheduledDate = cadence === 'Daily' ? dailyDate : today;
  const generatedChallenge = useMemo(() => selectLiveStudioChallenge(cadence, tier, scheduledDate), [cadence, scheduledDate, tier]);
  const [rotatedChallenge, setRotatedChallenge] = useState(generatedChallenge);
  const [generationState, setGenerationState] = useState<'loading' | 'generated' | 'curated-fallback' | 'curated'>('curated');
  const [generationMessage, setGenerationMessage] = useState(initialChallenge ? 'Shared result preserved.' : 'Curated library target ready. No AI required.');
  const activeRotatedChallenge = rotatedChallenge.tier === tier ? rotatedChallenge : generatedChallenge;
  const activeChallenge = curatedLiveStudioChallengeCatalog.find(challenge => challenge.id === challengeId && challenge.tier === tier) ?? activeRotatedChallenge;
  const [typed, setTyped] = useState(initialBuild && initialChallenge ? initialChallenge.code : '');
  const [errors, setErrors] = useState(0);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState<LiveStudioBuild | null>(initialBuild && initialChallenge ? {
    id: initialBuild.id ?? `shared-${initialBuild.challengeId}`,
    challengeId: initialBuild.challengeId ?? initialChallenge.id,
    title: initialBuild.title ?? initialChallenge.title,
    tier: initialTier,
    cadence: initialCadence,
    wpm: initialBuild.wpm ?? 0,
    cpm: initialBuild.cpm ?? 0,
    accuracy: initialBuild.accuracy ?? 100,
    seconds: initialBuild.seconds ?? 0,
    points: initialBuild.points ?? 0,
    date: initialBuild.date ?? new Date().toISOString(),
    preview: initialBuild.preview ?? projectLiveStudioPreview(initialChallenge, initialChallenge.code),
  } : null);
  const startedAt = useRef<number | null>(null);
  const startedRef = useRef(false);
  const preserveSharedChallengeRef = useRef(Boolean(initialChallenge));
  const [shareStatus, setShareStatus] = useState('');

  useEffect(() => {
    if (preserveSharedChallengeRef.current) return;
    let cancelled = false;
    const fallback = selectLiveStudioChallenge(cadence, tier, scheduledDate);
    setRotatedChallenge(fallback);
    setChallengeId('');
    setGenerationState('curated');
    setGenerationMessage('Curated library target ready. Optional rotation checks run in the background.');
    void resolveLiveStudioChallenge(cadence, tier, scheduledDate).then(selection => {
      if (cancelled || startedRef.current) return;
      setRotatedChallenge(selection.challenge);
      setGenerationState(selection.source === 'generated' ? 'generated' : 'curated-fallback');
      setGenerationMessage(selection.source === 'generated' ? 'Safe contract accepted.' : selection.message ?? 'Using a curated target.');
      if (selection.source === 'curated-fallback') onAddNotice(selection.message ?? 'Generated target unavailable. Using the curated catalog.');
    });
    return () => { cancelled = true; };
  }, [cadence, dailyDay, scheduledDate, tier, onAddNotice]);

  useEffect(() => {
    if (!started) return;
    const timer = window.setInterval(() => {
      if (startedAt.current) setElapsed((Date.now() - startedAt.current) / 1000);
    }, 250);
    return () => window.clearInterval(timer);
  }, [started]);

  const resetSession = () => {
    setTyped('');
    setErrors(0);
    setElapsed(0);
    setStarted(false);
    setFinished(null);
    setShareStatus('');
    startedAt.current = null;
    startedRef.current = false;
  };

  const startSession = () => {
    resetSession();
    setStarted(true);
    startedRef.current = true;
    startedAt.current = Date.now();
    trackEvent('live_studio_session_started', {
      cadence,
      tier,
      language: activeChallenge.language,
      visualizer: activeChallenge.visualizer ?? 'terminal',
    });
  };

  const handleTyped = (value: string) => {
    if (!started || finished) return;
    const next = value.slice(0, activeChallenge.code.length);
    if (next.length < typed.length) {
      setTyped(next);
      return;
    }
    let newErrors = 0;
    for (let index = typed.length; index < next.length; index += 1) {
      if (next[index] !== activeChallenge.code[index]) newErrors += 1;
    }
    if (newErrors) setErrors(previous => previous + newErrors);
    setTyped(next);
  };

  const completeSession = () => {
    if (typed !== activeChallenge.code || finished) return;
    const seconds = Math.max((Date.now() - (startedAt.current ?? Date.now())) / 1000, 1);
    const minutes = seconds / 60;
    const correct = Math.max(0, activeChallenge.code.length - errors);
    const wpm = Math.max(0, Math.round((correct / 5) / minutes));
    const cpm = Math.max(0, Math.round(correct / minutes));
    const accuracy = Math.max(0, Math.round((activeChallenge.code.length / (activeChallenge.code.length + errors)) * 1000) / 10);
    const points = Math.round(tierMeta[tier].points * (accuracy / 100) + wpm * 1.8);
    const build: LiveStudioBuild = {
      id: crypto.randomUUID(),
      challengeId: activeChallenge.id,
      title: activeChallenge.title,
      tier,
      cadence,
      wpm,
      cpm,
      accuracy,
      seconds: Math.round(seconds),
      points,
      date: new Date().toISOString(),
      preview: projectLiveStudioPreview(activeChallenge, activeChallenge.code),
    };
    setStarted(false);
    startedRef.current = false;
    setFinished(build);
    setElapsed(build.seconds);
    startedAt.current = null;
    trackEvent('live_studio_result_created', {
      cadence: build.cadence,
      tier: build.tier,
      language: activeChallenge.language,
      visualizer: activeChallenge.visualizer ?? 'terminal',
      accuracy_bucket: accuracyBucket(build.accuracy),
    });
    onFinish(build);
  };

  const chooseCadence = (nextCadence: LiveStudioCadence) => {
    preserveSharedChallengeRef.current = false;
    setCadence(nextCadence);
    setChallengeId('');
    resetSession();
  };
  const chooseDailyDay = (nextDay: number) => {
    if (nextDay < 1 || nextDay > 31 || nextDay === dailyDay) return;
    preserveSharedChallengeRef.current = false;
    setDailyDay(nextDay);
    setChallengeId('');
    resetSession();
  };
  const chooseTier = (nextTier: LiveStudioTier) => {
    preserveSharedChallengeRef.current = false;
    setTier(nextTier);
    setChallengeId('');
    resetSession();
  };
  const chooseChallenge = (nextChallengeId: string) => {
    preserveSharedChallengeRef.current = false;
    setChallengeId(nextChallengeId);
    const selected = curatedLiveStudioChallengeCatalog.find(challenge => challenge.id === nextChallengeId && challenge.tier === tier);
    if (selected) {
      setRotatedChallenge(selected);
      setGenerationState('curated');
      setGenerationMessage('Curated catalog target selected.');
    }
    resetSession();
  };
  const chooseLibraryChallenge = (nextChallengeId: string, nextTier: LiveStudioTier) => {
    const selected = curatedLiveStudioChallengeCatalog.find(challenge => challenge.id === nextChallengeId && challenge.tier === nextTier);
    if (!selected) return;
    preserveSharedChallengeRef.current = true;
    setTier(nextTier);
    setChallengeId(nextChallengeId);
    setRotatedChallenge(selected);
    setGenerationState('curated');
    setGenerationMessage('Curated catalog target selected. No generator required.');
    resetSession();
  };

  const liveWpm = elapsed ? Math.max(0, Math.round(((typed.length - errors) / 5) / (elapsed / 60))) : 0;
  const liveAccuracy = typed.length ? Math.max(0, Math.round(((typed.length - errors) / typed.length) * 100)) : 100;
  const preview = finished?.preview ?? projectLiveStudioPreview(activeChallenge, typed);
  const shareUrl = finished ? liveStudioShareUrl(finished, window.location.href) : '';
  const shareText = finished ? `I built "${finished.title}" in Lokcodingpractice — ${finished.wpm} WPM at ${finished.accuracy}% accuracy.` : '';
  const trackShareAction = (action: 'native' | 'clipboard' | 'copy_link' | 'x' | 'linkedin', outcome: 'success' | 'cancelled' | 'unavailable' | 'initiated') => {
    if (!finished) return;
    trackEvent('live_studio_share_action', {
      action,
      outcome,
      cadence: finished.cadence,
      tier: finished.tier,
      language: activeChallenge.language,
      visualizer: activeChallenge.visualizer ?? 'terminal',
      accuracy_bucket: accuracyBucket(finished.accuracy),
    });
  };

  const copyShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus('Share link copied.');
      trackShareAction('copy_link', 'success');
    } catch {
      const input = document.createElement('textarea');
      input.value = shareUrl;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      const copied = document.execCommand('copy');
      input.remove();
      setShareStatus(copied ? 'Share link copied.' : 'Copy was blocked. Use the social links below.');
      trackShareAction('copy_link', copied ? 'success' : 'unavailable');
    }
  };

  const shareResult = async () => {
    if (!finished) return;
    const hasNativeShare = typeof navigator.share === 'function';
    try {
      if (hasNativeShare) {
        await navigator.share({ title: finished.title, text: shareText, url: shareUrl });
        setShareStatus('Share sheet opened.');
        trackShareAction('native', 'success');
      } else {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        setShareStatus('Share text and link copied.');
        trackShareAction('clipboard', 'success');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        trackShareAction('native', 'cancelled');
        return;
      }
      setShareStatus('Share sheet unavailable. Use Copy link or a social link.');
      trackShareAction(hasNativeShare ? 'native' : 'clipboard', 'unavailable');
    }
  };

  const unlockedTiers = (Object.keys(tierMeta) as LiveStudioTier[]).filter(candidate => totalPoints >= tierMeta[candidate].unlock);
  if (finished && !unlockedTiers.includes(finished.tier)) unlockedTiers.push(finished.tier);
  return <LiveStudio
    challenges={[rotatedChallenge, ...curatedLiveStudioChallengeCatalog.filter(challenge => challenge.tier === tier && challenge.id !== rotatedChallenge.id)]}
    curatedChallenges={curatedLiveStudioChallengeCatalog}
    cadence={cadence}
    tier={tier}
    dailyDay={dailyDay}
    challengeId={activeChallenge.id}
    typedValue={finished ? activeChallenge.code : typed}
    safePreview={preview}
    result={finished ? { id: finished.id, challengeId: finished.challengeId, title: finished.title, tier: finished.tier, cadence: finished.cadence, wpm: finished.wpm, accuracy: finished.accuracy, elapsedSeconds: finished.seconds, points: finished.points, completedAt: finished.date } : null}
    isRunning={started}
    elapsedSeconds={finished?.seconds ?? elapsed}
    wpm={finished?.wpm ?? liveWpm}
    accuracy={finished?.accuracy ?? liveAccuracy}
    errorCount={errors}
    unlockedTiers={unlockedTiers}
    onCadenceChange={chooseCadence}
    onDailyDayChange={chooseDailyDay}
    onTierChange={chooseTier}
    onChallengeChange={chooseChallenge}
    onLibrarySelect={chooseLibraryChallenge}
    onTypedChange={handleTyped}
    onReset={resetSession}
    onComplete={completeSession}
    onShare={shareResult}
    onCopyShare={copyShare}
    onExternalShare={action => trackShareAction(action, 'initiated')}
    onStart={startSession}
    shareUrl={shareUrl}
    shareText={shareText}
    shareStatus={shareStatus}
    generationState={generationState}
    generationMessage={generationMessage}
  />;
}

function RouterApp() {
  const [theme, setTheme] = useState<ThemeName>(() => {
    const saved = readStorage<string>('codesprint_theme', 'midnight');
    return Object.prototype.hasOwnProperty.call(themeTokens, saved) ? saved as ThemeName : 'midnight';
  });
  const [motionPreference, setMotionPreference] = useState<MotionPreference>(() => {
    const saved = readStorage<string>('codesprint_motion', 'auto');
    return saved === 'on' || saved === 'off' || saved === 'auto' ? saved : 'auto';
  });
  const [customSnippets, setCustomSnippets] = useState<Snippet[]>(() => readStorage<Snippet[]>('codesprint_custom_snippets', []));
  const [runs, setRuns] = useState<Run[]>(() => readStorage<Run[]>('codesprint_runs', []));
  const [liveBuilds, setLiveBuilds] = useState<LiveStudioBuild[]>(() => readStorage<LiveStudioBuild[]>('codesprint_live_builds', []));
  const [sharedLiveBuild] = useState<Partial<LiveStudioBuild> | null>(() => decodeLiveStudioShare(new URLSearchParams(window.location.search).get('share')));
  const [systemReducedMotion, setSystemReducedMotion] = useState(() => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [notice, setNotice] = useState('');
  const allSnippets = useMemo(() => [...seededSnippets, ...customSnippets], [customSnippets]);
  const totalPoints = runs.reduce((sum, run) => sum + run.points, 0) + liveBuilds.reduce((sum, build) => sum + build.points, 0);
  const credits = runs.reduce((sum, run) => sum + Math.max(3, Math.round(run.points / 18)), 0) + liveBuilds.reduce((sum, build) => sum + Math.max(3, Math.round(build.points / 18)), 0);
  const selectedPalette = paletteCatalog.find(item => item.id === theme) ?? paletteCatalog[0];
  const paletteUnlocked = totalPoints >= tierMeta[selectedPalette.tier].unlock;
  const motionReduced = systemReducedMotion || motionPreference === 'off';
  const animated = selectedPalette.animated && !motionReduced;
  useEffect(() => {
    window.localStorage.setItem('codesprint_theme', JSON.stringify(theme));
    const root = document.documentElement;
    root.classList.add('dark');
    for (const [property, value] of Object.entries(themeTokens[theme])) {
      root.style.setProperty(property, value);
    }
  }, [theme]);
  useEffect(() => {
    if (!paletteUnlocked) {
      const fallback = paletteCatalog.find(item => totalPoints >= tierMeta[item.tier].unlock);
      if (fallback) setTheme(fallback.id);
    }
  }, [paletteUnlocked, theme, totalPoints]);
  useEffect(() => {
    window.localStorage.setItem('codesprint_motion', JSON.stringify(motionPreference));
    document.documentElement.classList.toggle('motion-reduced', motionReduced);
    return () => document.documentElement.classList.remove('motion-reduced');
  }, [motionPreference, motionReduced]);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event: MediaQueryListEvent) => setSystemReducedMotion(event.matches);
    query.addEventListener?.('change', onChange);
    return () => query.removeEventListener?.('change', onChange);
  }, []);
  useEffect(() => { window.localStorage.setItem('codesprint_custom_snippets', JSON.stringify(customSnippets)); }, [customSnippets]);
  useEffect(() => { window.localStorage.setItem('codesprint_runs', JSON.stringify(runs)); }, [runs]);
  useEffect(() => { window.localStorage.setItem('codesprint_live_builds', JSON.stringify(liveBuilds)); }, [liveBuilds]);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 3000); return () => window.clearTimeout(timer); }, [notice]);
  const finish = (run: Run) => { setRuns(previous => [...previous, run]); setNotice(`Run saved. +${run.points} points added.`); };
  const finishLiveBuild = (build: LiveStudioBuild) => { setLiveBuilds(previous => [...previous, build]); setNotice(`Live result created. +${build.points} points added.`); };
  const addSnippet = (snippet: Snippet) => setCustomSnippets(previous => [...previous, snippet]);
  const deleteSnippet = (id: string) => { if (window.confirm('Delete this local snippet?')) setCustomSnippets(previous => previous.filter(item => item.id !== id)); };
  return <AppShell theme={theme} totalPoints={totalPoints} credits={credits} animated={animated} animation={selectedPalette.animation} motionReduced={motionReduced}><Switch><Route path="/">{() => <Practice snippets={allSnippets} runs={runs} totalPoints={totalPoints} onFinish={finish} onAddNotice={setNotice} />}</Route><Route path="/studio">{() => <LiveStudioPage totalPoints={totalPoints} initialBuild={sharedLiveBuild} onFinish={finishLiveBuild} onAddNotice={setNotice} />}</Route><Route path="/progress">{() => <Progress runs={runs} liveBuilds={liveBuilds} totalPoints={totalPoints} credits={credits} />}</Route><Route path="/snippets">{() => <Snippets snippets={allSnippets} onAdd={addSnippet} onDelete={deleteSnippet} onAddNotice={setNotice} />}</Route><Route path="/themes">{() => <Themes theme={theme} setTheme={setTheme} totalPoints={totalPoints} motionPreference={motionPreference} setMotionPreference={setMotionPreference} systemReducedMotion={systemReducedMotion} />}</Route><Route>{() => <NotFound />}</Route></Switch>{notice && <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-[hsl(var(--primary)/.35)] bg-[hsl(var(--card))] px-4 py-3 text-xs text-[hsl(var(--foreground))] shadow-2xl md:bottom-7" role="status" data-testid="status-notice"><Check size={15} className="text-[hsl(var(--primary))]" />{notice}</div>}</AppShell>;
}

export default function App() {
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RouterApp /></WouterRouter>;
}
