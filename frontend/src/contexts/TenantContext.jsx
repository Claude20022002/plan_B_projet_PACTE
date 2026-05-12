import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api';

const TenantContext = createContext(null);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant doit être utilisé dans un TenantProvider');
  }
  return context;
};

export function TenantProvider({ children }) {
  const [institutions, setInstitutions] = useState([]);
  const [currentTenant, setCurrentTenant] = useState(null);

  const hydrateFromAuthPayload = (payload) => {
    const nextInstitutions = payload?.institutions || [];
    const savedSlug = localStorage.getItem('currentTenantSlug');
    const selected =
      nextInstitutions.find((institution) => institution.slug === savedSlug) ||
      payload?.currentInstitution ||
      nextInstitutions[0] ||
      null;

    setInstitutions(nextInstitutions);
    setCurrentTenant(selected);
    if (selected?.slug) {
      localStorage.setItem('currentTenantSlug', selected.slug);
      window.dispatchEvent(new CustomEvent('tenant:changed', { detail: selected }));
    }
  };

  const switchTenant = (tenant) => {
    setCurrentTenant(tenant);
    if (tenant?.slug) {
      localStorage.setItem('currentTenantSlug', tenant.slug);
      window.dispatchEvent(new CustomEvent('tenant:changed', { detail: tenant }));
    }
  };

  const refreshTenants = async () => {
    const data = await authAPI.getMe();
    hydrateFromAuthPayload(data);
    return data;
  };

  useEffect(() => {
    const hydrate = (event) => hydrateFromAuthPayload(event.detail);
    const clear = () => {
      setInstitutions([]);
      setCurrentTenant(null);
      localStorage.removeItem('currentTenantSlug');
    };
    window.addEventListener('auth:payload', hydrate);
    window.addEventListener('auth:logout', clear);
    return () => {
      window.removeEventListener('auth:payload', hydrate);
      window.removeEventListener('auth:logout', clear);
    };
  }, []);

  return (
    <TenantContext.Provider value={{ institutions, currentTenant, switchTenant, hydrateFromAuthPayload, refreshTenants }}>
      {children}
    </TenantContext.Provider>
  );
}
