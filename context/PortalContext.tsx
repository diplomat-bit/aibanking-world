
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useFirebase } from './FirebaseContext';

interface IPortalContext {
  isFirebaseLinked: boolean;
  isGoogleLinked: boolean;
  isCitiLinked: boolean;
  isAuth0Linked: boolean;
  isAgeVerified: boolean;
  isTermsAccepted: boolean;
  
  setGoogleLinked: (val: boolean) => void;
  setCitiLinked: (val: boolean) => void;
  setAgeVerified: (val: boolean) => void;
  setTermsAccepted: (val: boolean) => void;
  
  // Master check: is the user "in" the OS?
  isPortalAuthorized: boolean;
}

const PortalContext = createContext<IPortalContext | undefined>(undefined);

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: firebaseUser } = useFirebase();
  const { isAuthenticated: isAuth0Authenticated } = useAuth0();
  
  const [isGoogleLinked, setGoogleLinked] = useState(false);
  const [isCitiLinked, setCitiLinked] = useState(false);
  const [isAgeVerified, setAgeVerified] = useState(false);
  const [isTermsAccepted, setTermsAccepted] = useState(false);

  const isFirebaseLinked = !!firebaseUser;
  const isAuth0Linked = isAuth0Authenticated;

  // The user is authorized if ALL of the links are established AND they verified age/terms
  const isPortalAuthorized = isFirebaseLinked && isGoogleLinked && isCitiLinked && isAuth0Linked && isAgeVerified && isTermsAccepted;

  return (
    <PortalContext.Provider value={{
      isFirebaseLinked,
      isGoogleLinked,
      isCitiLinked,
      isAuth0Linked,
      isAgeVerified,
      isTermsAccepted,
      setGoogleLinked,
      setCitiLinked,
      setAgeVerified,
      setTermsAccepted,
      isPortalAuthorized
    }}>
      {children}
    </PortalContext.Provider>
  );
};

export const usePortal = () => {
  const context = useContext(PortalContext);
  if (!context) throw new Error('usePortal must be used within a PortalProvider');
  return context;
};
