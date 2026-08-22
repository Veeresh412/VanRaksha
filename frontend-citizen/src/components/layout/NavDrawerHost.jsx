import { useAppShell } from '../../hooks/useAppShell';
import NavDrawer from './NavDrawer';

export default function NavDrawerHost() {
  const { isMenuOpen, closeMenu, openInfoSheet, handleLogout } = useAppShell();

  return (
    <NavDrawer
      open={isMenuOpen}
      onClose={closeMenu}
      onOpenInfo={openInfoSheet}
      onLogout={handleLogout}
    />
  );
}
