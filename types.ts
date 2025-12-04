// Define the Three.js elements used in JSX
// This ensures that TypeScript recognizes these elements as valid JSX intrinsics
interface ThreeElementsImpl {
  ambientLight: any;
  pointLight: any;
  spotLight: any;
  group: any;
  mesh: any;
  points: any;
  instancedMesh: any;
  bufferGeometry: any;
  bufferAttribute: any;
  shaderMaterial: any;
  meshStandardMaterial: any;
  meshBasicMaterial: any;
  meshPhysicalMaterial: any;
  pointsMaterial: any;
  cylinderGeometry: any;
  dodecahedronGeometry: any;
  torusGeometry: any;
  sphereGeometry: any;
  boxGeometry: any;
  octahedronGeometry: any;
  gridHelper: any;
  primitive: any;
}

// Extend global JSX.IntrinsicElements to include React Three Fiber elements
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElementsImpl {}
  }
}

// Also extend React.JSX.IntrinsicElements for newer React versions (18+)
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElementsImpl {}
  }
}

export type Mode = 'CHAOS' | 'FORMED' | 'PINCHED';

export enum ShapeType {
  TREE = 'TREE',
  COKE = 'COKE',
  SNOW = 'SNOW'
}

export interface HandData {
  present: boolean;
  gesture: 'NONE' | 'OPEN' | 'PINCH' | 'FIST';
  position: { x: number; y: number; z: number }; // Normalized -1 to 1
  landmarks?: any[]; // Raw landmarks for skeleton
}

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
}

export interface AppState {
  mode: Mode;
  shape: ShapeType;
  handData: HandData;
  debug: boolean;
  setMode: (m: Mode) => void;
  setShape: (s: ShapeType) => void;
  setHandData: (h: HandData) => void;
  toggleDebug: () => void;
}
