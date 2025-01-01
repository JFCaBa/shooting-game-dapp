// src/types/navigation.ts
// Navigation types for the application

export type Screen = 'inventory' | 'game' | 'map' | 'achievements' | 'wallet' | 'hallOfFame' |'settings';

export interface NavigationItem {
  id: Screen;
  label: string;
  icon: string;
}

export interface NavigationProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}