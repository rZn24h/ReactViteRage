// [UI] Game Logic pentru Hacker Terminal - Circuit Puzzle
import { GridState, GridNode, Coordinate, NodeType } from '../types';
import { GRID_SIZE, CONNECTIONS } from '../constants';

// Helper to get connections for a node type at a specific rotation
export const getActiveConnections = (type: NodeType, rotation: number): boolean[] => {
  const baseConnections = CONNECTIONS[type];
  if (!baseConnections) return [false, false, false, false];

  // Rotate the boolean array 'rotation' times to the right
  // rotation 1 (90deg) -> shift right 1
  const rotated = [...baseConnections];
  for (let i = 0; i < rotation; i++) {
    const last = rotated.pop();
    if (last !== undefined) rotated.unshift(last);
  }
  return rotated;
};

// Helper to check if two nodes are connected
const areConnected = (nodeA: GridNode, nodeB: GridNode, directionFromA: number): boolean => {
  // directionFromA: 0=Top, 1=Right, 2=Bottom, 3=Left (relative to A)
  const connsA = getActiveConnections(nodeA.type, nodeA.rotation);
  const connsB = getActiveConnections(nodeB.type, nodeB.rotation);

  // A must have output in 'directionFromA'
  // B must have input in 'oppositeDirection'
  const directionFromB = (directionFromA + 2) % 4;

  return connsA[directionFromA] && connsB[directionFromB];
};

// Trace the circuit from Start to find all powered nodes
export const traceCircuit = (grid: GridState): GridState => {
  // Deep copy grid to avoid mutation issues during trace
  const newGrid = grid.map(row => row.map(node => ({ ...node, isPowered: false })));
  
  // Find start node
  let startNode: GridNode | null = null;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (newGrid[r][c].type === 'START') {
        startNode = newGrid[r][c];
        break;
      }
    }
  }

  if (!startNode) return newGrid;

  // BFS
  const queue: GridNode[] = [startNode];
  startNode.isPowered = true;
  const visited = new Set<string>();
  visited.add(startNode.id);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const { row, col } = current;

    // Check neighbors: Top, Right, Bottom, Left
    const neighbors = [
      { r: row - 1, c: col, dir: 0 }, // Top
      { r: row, c: col + 1, dir: 1 }, // Right
      { r: row + 1, c: col, dir: 2 }, // Bottom
      { r: row, c: col - 1, dir: 3 }, // Left
    ];

    for (const { r, c, dir } of neighbors) {
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        const neighbor = newGrid[r][c];
        
        // Blockers/Firewalls stop power
        if (neighbor.type === 'BLOCKER' || neighbor.isFirewall) continue;

        if (!visited.has(neighbor.id)) {
          if (areConnected(current, neighbor, dir)) {
            neighbor.isPowered = true;
            visited.add(neighbor.id);
            queue.push(neighbor);
          }
        }
      }
    }
  }

  return newGrid;
};

export const checkWinCondition = (grid: GridState): boolean => {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c].type === 'END' && grid[r][c].isPowered) {
        return true;
      }
    }
  }
  return false;
};

// Helper: Randomized DFS to find a valid path between two points
// Constrained to the "inner" grid (col 1 to GRID_SIZE-2)
const findInnerPath = (start: Coordinate, end: Coordinate): Coordinate[] | null => {
  const visited = new Set<string>();
  const path: Coordinate[] = [];
  
  const dfs = (r: number, c: number): boolean => {
    // Bounds check: Keep within columns [1, GRID_SIZE-2]
    if (r < 0 || r >= GRID_SIZE || c < 1 || c > GRID_SIZE - 2 || visited.has(`${r}-${c}`)) {
      return false;
    }

    visited.add(`${r}-${c}`);
    path.push({ row: r, col: c });

    // Goal Check
    if (r === end.row && c === end.col) {
      return true;
    }

    // Possible Moves: Right, Up, Down, Left
    const moves = [
      { r: 0, c: 1 },  // Right
      { r: -1, c: 0 }, // Up
      { r: 1, c: 0 },  // Down
      { r: 0, c: -1 }  // Left
    ];

    // Completely random shuffle to encourage winding paths
    for (let i = moves.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [moves[i], moves[j]] = [moves[j], moves[i]];
    }
    
    // No heuristic sort - pure random exploration for maximum chaos/winding

    for (const move of moves) {
      if (dfs(r + move.r, c + move.c)) {
        return true;
      }
    }

    // Backtrack
    path.pop();
    // Note: We do NOT remove from visited in this greedy variant. 
    // This is intentional for performance and to force unique paths in retries.
    return false;
  };

  if (dfs(start.row, start.col)) return path;
  return null;
};

// Level Generator
export const generateLevel = (): GridState => {
  // 1. Initialize empty grid
  const grid: GridNode[][] = Array(GRID_SIZE).fill(null).map((_, r) =>
    Array(GRID_SIZE).fill(null).map((_, c) => ({
      id: `${r}-${c}`,
      row: r,
      col: c,
      type: 'EMPTY',
      rotation: 0,
      isPowered: false,
      isLocked: false,
    }))
  );

  // 2. Determine Start and End positions
  const startRow = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
  const endRow = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

  // 3. Generate Inner Path
  const startInner = { row: startRow, col: 1 };
  const endInner = { row: endRow, col: GRID_SIZE - 2 };
  
  let bestPath: Coordinate[] | null = null;
  
  // Try multiple times to find the longest (most complex) path
  // Since DFS is randomized, running it multiple times gives different results
  for (let i = 0; i < 100; i++) {
     const p = findInnerPath(startInner, endInner);
     if (p) {
        if (!bestPath || p.length > bestPath.length) {
            bestPath = p;
        }
        // If we found a very complex path (e.g. > 25 steps), we can stop early
        if (bestPath.length > 25) break; 
     }
  }

  // Fallback (Manhattan) if DFS fails completely (unlikely)
  let innerPath = bestPath;
  if (!innerPath) {
    innerPath = [];
    let currR = startRow;
    let currC = 1;
    // Go right to end column - 2
    while(currC <= GRID_SIZE - 2) {
        innerPath.push({row: currR, col: currC});
        if(currC === GRID_SIZE - 2) break;
        currC++;
    }
    // Go vertically to endRow
    while(currR !== endRow) {
        currR += (currR < endRow) ? 1 : -1;
        innerPath.push({row: currR, col: GRID_SIZE - 2});
    }
  }

  // 4. Construct Full Path
  const fullPath = [
    { row: startRow, col: 0 },
    ...innerPath,
    { row: endRow, col: GRID_SIZE - 1 }
  ];

  // 5. Place Start and End Nodes specifically
  grid[startRow][0] = { ...grid[startRow][0], type: 'START', rotation: 0, isLocked: true, isPowered: true };
  grid[endRow][GRID_SIZE - 1] = { ...grid[endRow][GRID_SIZE - 1], type: 'END', rotation: 0, isLocked: true };

  // 6. Fill the path with correct pipes based on neighbors
  for (let i = 0; i < fullPath.length; i++) {
    const { row, col } = fullPath[i];
    if (grid[row][col].type === 'START' || grid[row][col].type === 'END') continue;

    const prev = fullPath[i-1];
    const next = fullPath[i+1];
    
    // Determine entry and exit directions relative to current node
    const dirs = [];
    if (prev) {
        if (prev.row < row) dirs.push(0);      // Neighbor is Top
        else if (prev.row > row) dirs.push(2); // Neighbor is Bottom
        else if (prev.col < col) dirs.push(3); // Neighbor is Left
        else if (prev.col > col) dirs.push(1); // Neighbor is Right
    }
    if (next) {
        if (next.row < row) dirs.push(0);
        else if (next.row > row) dirs.push(2);
        else if (next.col < col) dirs.push(3);
        else if (next.col > col) dirs.push(1);
    }

    dirs.sort();
    const sig = dirs.join('');
    
    // Map neighbors to pipe type and rotation
    let type: NodeType = 'STRAIGHT';
    let rot = 0;

    if (sig === '13') { type = 'STRAIGHT'; rot = 0; }      // Left + Right
    else if (sig === '02') { type = 'STRAIGHT'; rot = 1; } // Top + Bottom
    else if (sig === '12') { type = 'CORNER'; rot = 0; }   // Right + Bottom
    else if (sig === '23') { type = 'CORNER'; rot = 1; }   // Bottom + Left
    else if (sig === '03') { type = 'CORNER'; rot = 2; }   // Left + Top
    else if (sig === '01') { type = 'CORNER'; rot = 3; }   // Top + Right
    else { type = 'STRAIGHT'; rot = 0; }

    grid[row][col].type = type;
    grid[row][col].rotation = rot;
  }

  // 7. Fill empty spots with random garbage and scramble rotations
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c].type === 'EMPTY') {
        const rand = Math.random();
        // Lowered blocker chance to make the board look more "full" of pipes
        if (rand > 0.90) {
           grid[r][c].type = 'BLOCKER';
           grid[r][c].isFirewall = true;
        } else {
           const types: NodeType[] = ['STRAIGHT', 'CORNER', 'T_SHAPE', 'CROSS'];
           grid[r][c].type = types[Math.floor(Math.random() * types.length)];
           grid[r][c].rotation = Math.floor(Math.random() * 4);
        }
      } else if (!grid[r][c].isLocked) {
        // Scramble rotation of path nodes to make it a puzzle
        grid[r][c].rotation = Math.floor(Math.random() * 4);
      }
    }
  }

  return grid;
};
