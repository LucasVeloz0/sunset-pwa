import React from 'react';

const AppContainer = ({ children, isDaytime }) => (
  <div className={`app-container ${isDaytime ? 'day-theme' : 'night-theme'}`}>
    {children}
  </div>
);

export default AppContainer;