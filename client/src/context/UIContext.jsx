import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchBarActive, setSearchBarActive] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleCartDrawer = () => setCartDrawerOpen((prev) => !prev);
  const toggleSearchBar = () => setSearchBarActive((prev) => !prev);
  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const closeAllPanels = () => {
    setCartDrawerOpen(false);
    setSearchBarActive(false);
    setMobileMenuOpen(false);
    setIsSidebarOpen(false);
  };

  return (
    <UIContext.Provider
      value={{
        cartDrawerOpen,
        setCartDrawerOpen,
        toggleCartDrawer,
        searchBarActive,
        setSearchBarActive,
        toggleSearchBar,
        mobileMenuOpen,
        setMobileMenuOpen,
        toggleMobileMenu,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        closeAllPanels
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be wrapped within a dedicated UIProvider framework context.');
  return context;
};