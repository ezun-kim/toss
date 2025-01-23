export interface SegmentStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
}

export interface Segment {
  id: string;
  text: string;
  style: SegmentStyle;
}

export interface SelectionRange {
  startSegmentId: string;
  startOffset: number;
  endSegmentId: string;
  endOffset: number;
}

export interface Selection {
  start: number;
  end: number;
  text: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
  node: Node;
  offset: number;
}

export interface StyleRange {
  start: number;
  end: number;
  styles: {
    fontWeight?: number;
    italic: boolean;
    strike: boolean;
  };
}

export interface EditorState {
  text: string;
  styles: StyleRange[];
} 