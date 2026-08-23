import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications } from '../services/reportService';
import { useAuth } from '../hooks/useAuth';
import { AppShellContext } from './appShellContext';

import InfoSheet from '../components/layout/InfoSheet';
import NotificationPanel from '../components/notifications/NotificationPanel';

export default function AppShellProvider({ children }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [infoSheetSlug, setInfoSheetSlug] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const refreshNotifications = useCallback(async () => {
    const next = await getNotifications();
    setNotifications((prev) => {
      const readMap = Object.fromEntries(prev.map((item) => [item.id, item.read]));
      return next.map((item) => ({
        ...item,
        read: readMap[item.id] ?? item.read,
      }));
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    getNotifications().then((items) => {
      if (cancelled) return;
      setNotifications(items);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!drawerOpen && !notificationOpen && !infoSheetSlug) return undefined;

    const handleEscape = (event) => {
      if (event.key !== 'Escape') return;
      setDrawerOpen(false);
      setNotificationOpen(false);
      setInfoSheetSlug(null);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [drawerOpen, notificationOpen, infoSheetSlug]);

  const toggleMenu = useCallback(() => {
    setNotificationOpen(false);
    setInfoSheetSlug(null);
    setDrawerOpen((open) => !open);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const openNotifications = useCallback(() => {
    setDrawerOpen(false);
    setInfoSheetSlug(null);
    setNotificationOpen(true);
    refreshNotifications();
  }, [refreshNotifications]);

  const closeNotifications = useCallback(() => {
    setNotificationOpen(false);
  }, []);

  const openInfoSheet = useCallback((slug) => {
    setInfoSheetSlug(slug);
    setDrawerOpen(false);
  }, []);

  const closeInfoSheet = useCallback(() => {
    setInfoSheetSlug(null);
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  const handleNotificationClick = useCallback(
    (notification) => {
      markNotificationRead(notification.id);
      closeNotifications();

      if (notification.reportId) {
        navigate(`/reports/${notification.reportId}`);
      }
    },
    [closeNotifications, markNotificationRead, navigate]
  );

  const handleLogout = useCallback(async () => {
    closeDrawer();
    closeNotifications();
    await logout();
    navigate('/login');
  }, [closeDrawer, closeNotifications, logout, navigate]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const value = useMemo(
    () => ({
      isMenuOpen: drawerOpen,
      toggleMenu,
      closeMenu: closeDrawer,
      openInfoSheet,
      handleLogout,
      openNotifications,
      unreadCount,
    }),
    [
      drawerOpen,
      toggleMenu,
      closeDrawer,
      openInfoSheet,
      handleLogout,
      openNotifications,
      unreadCount,
    ]
  );

  return (
    <AppShellContext.Provider value={value}>
      {children}
      <NotificationPanel
        open={notificationOpen}
        onClose={closeNotifications}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllRead={markAllNotificationsRead}
      />
      <InfoSheet slug={infoSheetSlug} onClose={closeInfoSheet} />
    </AppShellContext.Provider>
  );
}
