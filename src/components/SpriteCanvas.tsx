import { useMemo } from 'react';
import type { ClassId, AlignmentAxis, MoralityAxis } from '@/lib/types';
import { generateSpriteGrid, spriteGridToDataURL } from '@/lib/sprite';

interface SpriteCanvasProps {
  classId: ClassId;
  lawChaos: AlignmentAxis;
  goodEvil: MoralityAxis;
  seed: string;
  scale?: number;
}

export function SpriteCanvas({ classId, lawChaos, goodEvil, seed, scale = 10 }: SpriteCanvasProps) {
  const dataUrl = useMemo(() => {
    const grid = generateSpriteGrid(classId, lawChaos, goodEvil, seed);
    return spriteGridToDataURL(grid, scale);
  }, [classId, lawChaos, goodEvil, seed, scale]);

  return (
    <div
      className="pixelated inline-block"
      style={{ imageRendering: 'pixelated' }}
    >
      <img
        src={dataUrl}
        alt={`${classId} sprite`}
        className="pixelated"
        style={{ imageRendering: 'pixelated', width: 32 * scale, height: 32 * scale, maxWidth: '100%' }}
      />
    </div>
  );
}
