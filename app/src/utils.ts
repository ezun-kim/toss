import { Segment, SelectionRange } from './types';

export function splitSegmentsForRange(segments: Segment[], range: SelectionRange): Segment[] {
  const { startSegmentId, startOffset, endSegmentId, endOffset } = range;

  return segments.map(seg => {
    if (seg.id !== startSegmentId) {
      return seg;
    }

    const minOffset = Math.min(startOffset, endOffset);
    const maxOffset = Math.max(startOffset, endOffset);

    const leftText = seg.text.slice(0, minOffset);
    const midText = seg.text.slice(minOffset, maxOffset + 1);
    const rightText = seg.text.slice(maxOffset + 1);

    const leftSeg: Segment | null = leftText
      ? { ...seg, id: crypto.randomUUID(), text: leftText }
      : null;
    const midSeg: Segment | null = midText
      ? { ...seg, id: crypto.randomUUID(), text: midText }
      : null;
    const rightSeg: Segment | null = rightText
      ? { ...seg, id: crypto.randomUUID(), text: rightText }
      : null;

    return [leftSeg, midSeg, rightSeg].filter(s => s !== null) as Segment[];
  }).flat();
}

export function applyStyleToRange(
  segments: Segment[],
  range: SelectionRange,
  styleKey: keyof Segment['style']
): Segment[] {
  return segments.map(seg => {
    if (seg.id === range.startSegmentId || seg.id === range.endSegmentId) {
      return {
        ...seg,
        style: {
          ...seg.style,
          [styleKey]: !seg.style[styleKey]
        }
      };
    }
    return seg;
  });
}

export function isCharSelected(
  range: SelectionRange | null,
  segmentId: string,
  charIndex: number
): boolean {
  if (!range) return false;

  const { startSegmentId, startOffset, endSegmentId, endOffset } = range;

  if (startSegmentId === segmentId && endSegmentId === segmentId) {
    const minI = Math.min(startOffset, endOffset);
    const maxI = Math.max(startOffset, endOffset);
    return charIndex >= minI && charIndex <= maxI;
  }

  return false;
} 