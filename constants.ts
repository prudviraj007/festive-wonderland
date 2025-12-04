import { ShapeType } from './types';

export const THEMES = {
  [ShapeType.TREE]: {
    primary: '#1B5E20', // Deep Green
    secondary: '#FFD700', // Gold
    accent: '#C62828', // Holiday Red
    particles: ['#1B5E20', '#2E7D32', '#43A047', '#FFD700', '#C62828']
  },
  [ShapeType.COKE]: {
    primary: '#F40009', // Coke Red
    secondary: '#FFFFFF', // White
    accent: '#111111', // Black/Glass
    particles: ['#F40009', '#D32F2F', '#B71C1C', '#FFFFFF', '#000000']
  },
  [ShapeType.SNOW]: {
    primary: '#E1F5FE', // Light Blue
    secondary: '#FFFFFF', // White
    accent: '#81D4FA', // Cyan
    particles: ['#E1F5FE', '#B3E5FC', '#FFFFFF', '#81D4FA', '#E0F7FA']
  }
};

export const ORNAMENT_COUNTS = {
  BALLS: 400,
  GIFTS: 150,
  LIGHTS: 600,
  CASCADE: 300,
  GEMS: 200,
  BELLS: 150
};