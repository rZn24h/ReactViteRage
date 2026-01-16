// [UI] Constants pentru Hacker Terminal System
export const GRID_SIZE = 8;
export const TIME_LIMIT_SECONDS = 60;

// Colors matching the cyberpunk palette
export const COLORS = {
  background: 'rgba(5, 10, 7, 0.9)',
  neonGreen: '#009e48',
  neonRed: '#ff3b3b',
  dimGray: '#333333',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
};

// Node connection definitions (True if connection exists at that side: Top, Right, Bottom, Left)
// Order: [Top, Right, Bottom, Left] at Rotation 0
export const CONNECTIONS: Record<string, boolean[]> = {
  'STRAIGHT': [false, true, false, true], // Horizontal by default
  'CORNER':   [false, true, true, false], // Bottom-Right (L shape)
  'T_SHAPE':  [false, true, true, true],  // T pointing Down
  'CROSS':    [true, true, true, true],
  'START':    [false, true, false, false], // Output right
  'END':      [false, false, false, true], // Input left
  'BLOCKER':  [false, false, false, false],
  'EMPTY':    [false, false, false, false],
};
