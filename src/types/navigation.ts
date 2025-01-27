// src/types/navigation.ts
export type Screen =
  | 'inventory'
  | 'game'
  | 'map'
  | 'achievements'
  | 'wallet'
  | 'hallOfFame'
  | 'settings'
  | 'create-user';

export interface NavigationItem {
  id: Screen;
  label: string;
  icon: string;
}

export interface NavigationProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}
