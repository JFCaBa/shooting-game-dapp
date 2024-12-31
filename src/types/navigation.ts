// src/types/navigation.ts
// Navigation types for the application

export type Screen = 'game' | 'map' | 'achievements' | 'wallet' | 'settings';

export interface NavigationItem {
  id: Screen;
  label: string;
  icon: string;
}

export interface NavigationProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}