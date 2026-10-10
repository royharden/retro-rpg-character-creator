import type { ClassId, AlignmentAxis, MoralityAxis } from './types';
import { SeededRNG } from './rng';

const PALETTE: Record<string, string> = {
  skin1: '#f4c496',
  skin2: '#d4a76a',
  skin3: '#c08552',
  skin4: '#8d5524',
  hair1: '#3b2817',
  hair2: '#6b4226',
  hair3: '#a0522d',
  hair4: '#d4a017',
  hair5: '#8b4513',
  hair6: '#c0c0c0',
  capeRed: '#dc2626',
  capeBlue: '#252b5c',
  capeGreen: '#16a34a',
  capeTeal: '#14b8a6',
  capeGold: '#fbbf24',
  capePurple: '#6b21a8',
  armor: '#64748b',
  armorDark: '#334155',
  robe: '#1a1f4a',
  robeDark: '#0a0e27',
  leather: '#78350f',
  leatherDark: '#451a03',
  staff: '#92400e',
  staffOrb: '#14b8a6',
  sword: '#e2e8f0',
  swordGuard: '#fbbf24',
  bow: '#92400e',
  lute: '#78350f',
  book: '#16a34a',
  shield: '#dc2626',
  bg: '#0a0e27',
  bgDark: '#050818',
  outline: '#000000',
  white: '#fef3c7',
};

function getAlignmentColors(lawChaos: AlignmentAxis, goodEvil: MoralityAxis): { primary: string; secondary: string } {
  if (goodEvil === 'evil') {
    return { primary: PALETTE.capeRed, secondary: PALETTE.armorDark };
  }
  if (goodEvil === 'good') {
    return { primary: PALETTE.capeGold, secondary: PALETTE.capeTeal };
  }
  if (lawChaos === 'chaotic') {
    return { primary: PALETTE.capeGreen, secondary: PALETTE.leather };
  }
  if (lawChaos === 'lawful') {
    return { primary: PALETTE.capeBlue, secondary: PALETTE.armor };
  }
  return { primary: PALETTE.capeTeal, secondary: PALETTE.robe };
}

function pickSkin(rng: SeededRNG): string {
  return rng.pick([PALETTE.skin1, PALETTE.skin2, PALETTE.skin3, PALETTE.skin4]);
}

function pickHair(rng: SeededRNG): string {
  return rng.pick([PALETTE.hair1, PALETTE.hair2, PALETTE.hair3, PALETTE.hair4, PALETTE.hair5, PALETTE.hair6]);
}

function pickCape(rng: SeededRNG, primary: string): string {
  return rng.pick([primary, primary, PALETTE.capeBlue, PALETTE.capePurple]);
}

const SIZE = 32;

function makeGrid(): string[][] {
  const grid: string[][] = [];
  for (let y = 0; y < SIZE; y++) {
    grid.push(new Array(SIZE).fill(null as unknown as string));
  }
  return grid;
}

function rect(grid: string[][], x: number, y: number, w: number, h: number, color: string) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const px = x + dx;
      const py = y + dy;
      if (px >= 0 && px < SIZE && py >= 0 && py < SIZE) {
        grid[py][px] = color;
      }
    }
  }
}

function px(grid: string[][], x: number, y: number, color: string) {
  if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) {
    grid[y][x] = color;
  }
}

function drawBaseBody(
  grid: string[][],
  skin: string,
  hair: string,
  cape: string,
  bodyColor: string,
) {
  // Head
  rect(grid, 12, 4, 8, 7, skin);
  // Hair
  rect(grid, 11, 3, 10, 3, hair);
  rect(grid, 11, 6, 1, 2, hair);
  rect(grid, 21, 6, 1, 2, hair);
  // Eyes
  px(grid, 14, 7, PALETTE.outline);
  px(grid, 17, 7, PALETTE.outline);
  // Mouth
  px(grid, 15, 9, PALETTE.outline);
  px(grid, 16, 9, PALETTE.outline);
  // Cape (behind body, visible at sides)
  rect(grid, 10, 12, 12, 12, cape);
  // Body/torso
  rect(grid, 12, 12, 8, 9, bodyColor);
  // Belt
  rect(grid, 12, 18, 8, 1, PALETTE.leatherDark);
  px(grid, 15, 18, '#fbbf24');
  // Legs
  rect(grid, 12, 21, 3, 6, PALETTE.leatherDark);
  rect(grid, 17, 21, 3, 6, PALETTE.leatherDark);
  // Boots
  rect(grid, 12, 27, 3, 2, PALETTE.outline);
  rect(grid, 17, 27, 3, 2, PALETTE.outline);
  // Arms
  rect(grid, 10, 13, 2, 6, bodyColor);
  rect(grid, 20, 13, 2, 6, bodyColor);
  // Hands
  rect(grid, 10, 19, 2, 2, skin);
  rect(grid, 20, 19, 2, 2, skin);
}

function drawFighter(grid: string[][], rng: SeededRNG) {
  // Armor
  const skin = pickSkin(rng);
  const hair = pickHair(rng);
  const { primary } = getAlignmentColors('neutral', 'neutral');
  const cape = pickCape(rng, primary);
  drawBaseBody(grid, skin, hair, cape, PALETTE.armor);
  // Armor details
  rect(grid, 12, 13, 8, 1, PALETTE.armorDark);
  rect(grid, 12, 16, 8, 1, PALETTE.armorDark);
  // Sword (right side)
  rect(grid, 23, 10, 1, 14, PALETTE.sword);
  rect(grid, 22, 10, 3, 1, PALETTE.swordGuard);
  rect(grid, 23, 24, 1, 2, PALETTE.leather);
  // Shield (left side)
  rect(grid, 7, 15, 3, 6, PALETTE.shield);
  rect(grid, 8, 16, 1, 4, PALETTE.swordGuard);
}

function drawWizard(grid: string[][], rng: SeededRNG) {
  const skin = pickSkin(rng);
  const hair = pickHair(rng);
  const { primary, secondary } = getAlignmentColors('neutral', 'neutral');
  const cape = pickCape(rng, primary);
  drawBaseBody(grid, skin, hair, cape, secondary);
  // Robe overlay
  rect(grid, 11, 12, 10, 12, PALETTE.robe);
  rect(grid, 11, 12, 10, 1, PALETTE.robeDark);
  rect(grid, 13, 20, 6, 4, PALETTE.robeDark);
  // Hat (pointy)
  rect(grid, 11, 0, 10, 3, PALETTE.robe);
  rect(grid, 12, 0, 8, 1, PALETTE.robeDark);
  rect(grid, 13, 0, 6, 1, PALETTE.robeDark);
  px(grid, 14, 0, PALETTE.robeDark);
  px(grid, 18, 0, PALETTE.robeDark);
  // Staff
  rect(grid, 24, 8, 1, 20, PALETTE.staff);
  rect(grid, 23, 6, 3, 3, PALETTE.staffOrb);
  px(grid, 24, 7, PALETTE.white);
}

function drawRogue(grid: string[][], rng: SeededRNG) {
  const skin = pickSkin(rng);
  const hair = pickHair(rng);
  const { primary } = getAlignmentColors('chaotic', 'neutral');
  const cape = pickCape(rng, primary);
  drawBaseBody(grid, skin, hair, cape, PALETTE.leather);
  // Hood
  rect(grid, 10, 3, 12, 2, PALETTE.leatherDark);
  rect(grid, 10, 5, 1, 3, PALETTE.leatherDark);
  rect(grid, 22, 5, 1, 3, PALETTE.leatherDark);
  // Dagger
  rect(grid, 23, 16, 1, 5, PALETTE.sword);
  rect(grid, 22, 21, 3, 1, PALETTE.swordGuard);
  // Lockpicks
  px(grid, 7, 18, PALETTE.sword);
  px(grid, 7, 19, PALETTE.sword);
  px(grid, 8, 18, PALETTE.sword);
}

function drawCleric(grid: string[][], rng: SeededRNG) {
  const skin = pickSkin(rng);
  const hair = pickHair(rng);
  const { primary } = getAlignmentColors('lawful', 'good');
  const cape = pickCape(rng, primary);
  drawBaseBody(grid, skin, hair, cape, PALETTE.white);
  // Holy symbol
  rect(grid, 15, 14, 2, 5, '#fbbf24');
  rect(grid, 14, 16, 4, 1, '#fbbf24');
  // Mace
  rect(grid, 24, 10, 1, 16, PALETTE.staff);
  rect(grid, 23, 8, 3, 3, PALETTE.armor);
  px(grid, 24, 9, PALETTE.swordGuard);
}

function drawRanger(grid: string[][], rng: SeededRNG) {
  const skin = pickSkin(rng);
  const hair = pickHair(rng);
  const { primary } = getAlignmentColors('chaotic', 'neutral');
  const cape = pickCape(rng, primary);
  drawBaseBody(grid, skin, hair, cape, PALETTE.leather);
  // Hood
  rect(grid, 10, 3, 12, 2, '#15803d');
  rect(grid, 10, 5, 1, 2, '#15803d');
  rect(grid, 22, 5, 1, 2, '#15803d');
  // Bow
  px(grid, 6, 10, PALETTE.bow);
  px(grid, 6, 11, PALETTE.bow);
  px(grid, 6, 12, PALETTE.bow);
  px(grid, 6, 13, PALETTE.bow);
  px(grid, 6, 14, PALETTE.bow);
  px(grid, 6, 15, PALETTE.bow);
  px(grid, 7, 9, PALETTE.bow);
  px(grid, 7, 16, PALETTE.bow);
  rect(grid, 7, 10, 1, 7, PALETTE.sword);
  // Arrow
  rect(grid, 23, 14, 2, 1, PALETTE.sword);
}

function drawBard(grid: string[][], rng: SeededRNG) {
  const skin = pickSkin(rng);
  const hair = pickHair(rng);
  const { primary } = getAlignmentColors('neutral', 'neutral');
  const cape = pickCape(rng, primary);
  drawBaseBody(grid, skin, hair, cape, '#7c2d6f');
  // Feathered hat
  rect(grid, 11, 3, 10, 2, '#7c2d6f');
  px(grid, 10, 3, PALETTE.capeRed);
  px(grid, 10, 2, PALETTE.capeRed);
  // Lute
  rect(grid, 22, 16, 3, 5, PALETTE.lute);
  rect(grid, 23, 14, 1, 3, PALETTE.lute);
  px(grid, 23, 17, PALETTE.outline);
  px(grid, 23, 18, PALETTE.outline);
}

function drawPaladin(grid: string[][], rng: SeededRNG) {
  const skin = pickSkin(rng);
  const hair = pickHair(rng);
  const { primary } = getAlignmentColors('lawful', 'good');
  const cape = pickCape(rng, primary);
  drawBaseBody(grid, skin, hair, cape, PALETTE.armor);
  // Armor details
  rect(grid, 12, 13, 8, 1, PALETTE.swordGuard);
  rect(grid, 12, 17, 8, 1, PALETTE.armorDark);
  // Holy symbol on chest
  rect(grid, 15, 14, 2, 3, PALETTE.swordGuard);
  rect(grid, 14, 15, 4, 1, PALETTE.swordGuard);
  // Sword (bigger, glowing)
  rect(grid, 23, 8, 1, 18, PALETTE.sword);
  rect(grid, 22, 8, 3, 1, PALETTE.swordGuard);
  rect(grid, 23, 6, 1, 2, PALETTE.staffOrb);
  // Shield
  rect(grid, 7, 15, 3, 6, PALETTE.swordGuard);
  px(grid, 8, 17, PALETTE.armorDark);
  px(grid, 8, 18, PALETTE.armorDark);
}

function drawWarlock(grid: string[][], rng: SeededRNG) {
  const skin = pickSkin(rng);
  const hair = pickHair(rng);
  const { primary, secondary } = getAlignmentColors('neutral', 'evil');
  const cape = pickCape(rng, primary);
  drawBaseBody(grid, skin, hair, cape, PALETTE.robe);
  // Dark robe overlay
  rect(grid, 11, 12, 10, 12, PALETTE.robeDark);
  rect(grid, 13, 20, 6, 4, PALETTE.bgDark);
  // Eldritch glow
  rect(grid, 14, 14, 4, 3, PALETTE.staffOrb);
  px(grid, 15, 15, PALETTE.white);
  px(grid, 16, 15, PALETTE.white);
  // Pact symbol
  rect(grid, 15, 14, 2, 1, PALETTE.capePurple);
  // Tome
  rect(grid, 23, 14, 3, 4, PALETTE.book);
  px(grid, 24, 15, PALETTE.white);
  px(grid, 24, 16, PALETTE.white);
}

const CLASS_DRAWERS: Record<Exclude<ClassId, 'uncertain'>, (grid: string[][], rng: SeededRNG) => void> = {
  fighter: drawFighter,
  wizard: drawWizard,
  rogue: drawRogue,
  cleric: drawCleric,
  ranger: drawRanger,
  bard: drawBard,
  paladin: drawPaladin,
  warlock: drawWarlock,
};

export function generateSpriteGrid(
  classId: ClassId,
  lawChaos: AlignmentAxis,
  goodEvil: MoralityAxis,
  seed: string,
): string[][] {
  const grid = makeGrid();
  // Background
  rect(grid, 0, 0, SIZE, SIZE, PALETTE.bg);

  const rng = new SeededRNG(seed + '_sprite');

  // Apply alignment palette to background
  const { primary, secondary } = getAlignmentColors(lawChaos, goodEvil);
  // Ground
  rect(grid, 0, 29, SIZE, 3, secondary);
  rect(grid, 0, 28, SIZE, 1, primary);

  const resolvedClass = classId === 'uncertain' ? 'fighter' : classId;
  const drawer = CLASS_DRAWERS[resolvedClass as Exclude<ClassId, 'uncertain'>];
  if (drawer) {
    drawer(grid, rng);
  }

  return grid;
}

export function spriteGridToDataURL(grid: string[][], scale = 8): string {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE * scale;
  canvas.height = SIZE * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const color = grid[y][x];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  return canvas.toDataURL('image/png');
}
