import { useContext } from 'react';
import { AppShellContext } from '../context/appShellContext';

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error('useAppShell must be used within AppShellProvider');
  }
  return context;
}
