'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const SettingsContext = createContext({
  settings: { cafeName: 'كافيه أرتيزان', primaryColor: '#c8956c' },
  updateSettings: async () => {},
  loading: true
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({ cafeName: 'كافيه أرتيزان', primaryColor: '#c8956c' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
    
    // Listen for live setting updates from other admin panels
    const { connectSocket } = require('../lib/socket');
    const socket = connectSocket();
    socket.on('settings:update', (newSettings) => {
      setSettings(newSettings);
    });

    return () => {
      socket.off('settings:update');
    };
  }, []);

  useEffect(() => {
    // Apply primary color to root CSS variables
    if (settings.primaryColor) {
      document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
    }
  }, [settings.primaryColor]);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success && res.data.data) {
        setSettings(res.data.data);
      }
    } catch (e) {
      console.error('Failed to fetch settings', e);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const res = await api.put('/settings', newSettings);
      if (res.data.success) {
        setSettings(res.data.data);
        return true;
      }
    } catch (e) {
      console.error('Failed to update settings', e);
      return false;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
