// [UI] Types pentru Hacker Terminal System
export type NodeType = 'STRAIGHT' | 'CORNER' | 'T_SHAPE' | 'CROSS' | 'START' | 'END' | 'BLOCKER' | 'EMPTY';

export interface GridNode {
  id: string;
  row: number;
  col: number;
  type: NodeType;
  rotation: number; // 0, 1, 2, 3 (multipled by 90deg)
  isPowered: boolean;
  isLocked: boolean; // If true, user cannot rotate
  isFirewall?: boolean; // Bad block styling
}

export type GridState = GridNode[][];

export type GameStatus = 'IDLE' | 'PLAYING' | 'WON' | 'LOST';

export interface Coordinate {
  row: number;
  col: number;
}
