import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange } from '../firebase/auth';
import { getDocument, subscribeDocument } from '../firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => {
    let unsubUserDoc = null;
    const unsub = onAuthChange(async (firebaseUser) => {
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          unsubUserDoc = subscribeDocument('users', firebaseUser.uid, (profile) => {
            if (profile) {
              setUserProfile(profile);
              setRole(profile.role || 'player');
            } else {
              setRole('player');
            }
            setLoading(false);
          });
        } catch (err) {
          console.warn('Real-time subscription to user doc fallback to getDocument:', err);
          try {
            const profile = await getDocument('users', firebaseUser.uid);
            setUserProfile(profile);
            setRole(profile?.role || 'player');
          } catch {
            setRole('player');
          }
          setLoading(false);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setRole(null);
        setAdminMode(false);
        setLoading(false);
      }
    });

    return () => {
      if (unsubUserDoc) unsubUserDoc();
      unsub();
    };
  }, []);

  const updateUserProfile = (profile) => {
    setUserProfile(profile);
    if (profile?.role) {
      setRole(profile.role);
    } else if (profile === null) {
      setRole(null);
    }
  };

  const setAdminAuth = (profile) => {
    setUserProfile(profile);
    setRole('admin');
    setAdminMode(true);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, role, loading, setUserProfile: updateUserProfile, adminMode, setAdminAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
