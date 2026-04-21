'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authKey, setAuthKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get auth from localStorage
    const storedAuthKey = localStorage.getItem('auth_key');
    const storedUser = localStorage.getItem('user');

    if (storedAuthKey) {
      setAuthKey(storedAuthKey);
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }

    setLoading(false);
  }, []);

  const login = (user: User, authKey: string) => {
    setUser(user);
    setAuthKey(authKey);
    localStorage.setItem('auth_key', authKey);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    setAuthKey(null);
    localStorage.removeItem('auth_key');
    localStorage.removeItem('user');
  };

  return { user, authKey, loading, login, logout };
}
