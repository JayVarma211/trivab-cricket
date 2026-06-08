import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange } from '../firebase/auth';
import { getDocument } from '../firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const profile = await getDocument('users', firebaseUser.uid);
          setUserProfile(profile);
          setRole(profile?.role || 'player');
        } catch {
          setRole('player');
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const updateUserProfile = (profile) => {
    setUserProfile(profile);
    if (profile?.role) {
      setRole(profile.role);
    } else if (profile === null) {
      setRole(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, role, loading, setUserProfile: updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
