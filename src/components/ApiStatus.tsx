import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

const ApiStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [pinsCount, setPinsCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const checkApi = async () => {
      try {
        setDebugInfo('Testing health endpoint...');
        // Test health endpoint
        const health = await api.healthCheck();
        console.log('Health check response:', health);
        
        setDebugInfo('Testing pins endpoint...');
        // Test pins endpoint
        const pins = await api.getPins();
        console.log('Pins response:', pins);
        setPinsCount(pins.length);
        setStatus('connected');
        setDebugInfo(`Success! Found ${pins.length} pins`);
      } catch (error) {
        console.error('API connection failed:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        setStatus('error');
        setDebugInfo(`Error: ${errorMessage}`);
      }
    };

    checkApi();
  }, [errorMessage]);

  const getStatusColor = () => {
    switch (status) {
      case 'checking': return 'text-yellow-500';
      case 'connected': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'checking': return 'Checking API...';
      case 'connected': return `API Connected (${pinsCount} pins)`;
      case 'error': return `API Error: ${errorMessage}`;
      default: return 'Unknown Status';
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-white p-3 rounded-lg shadow-lg border max-w-sm">
      <div className={`text-sm font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {debugInfo}
      </div>
      <div className="text-xs text-gray-400 mt-1">
        API URL: {import.meta.env.VITE_API_URL || 'http://localhost:8000'}
      </div>
    </div>
  );
};

export default ApiStatus;
