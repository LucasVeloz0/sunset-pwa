import React from 'react';

const ErrorBanner = ({ messages }) => (
  <div className="error-container">
    {messages.map((message, index) => (
      <div key={index} className="error-banner">
        {message}
      </div>
    ))}
  </div>
);

export default ErrorBanner;