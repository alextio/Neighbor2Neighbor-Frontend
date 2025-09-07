import React from 'react';
import { Home, Users, Bell, User } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', icon: Home },
    { id: 'groups', icon: Users },
    { id: 'notifications', icon: Bell },
    { id: 'profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-0 z-[1000] shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between max-w-full mx-auto p-0 relative">
        {/* Left column - first 2 tabs */}
        <div className="flex items-center">
          {tabs.slice(0, 2).map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                className={`flex flex-col items-center justify-center bg-none border-none px-4 py-3 cursor-pointer transition-all duration-200 ease-in-out rounded-xl min-w-[50px] hover:bg-gray-100 ${
                  activeTab === tab.id ? 'text-[#8e7cc3]' : ''
                }`}
                onClick={() => onTabChange(tab.id)}
              >
                <div className={`flex items-center justify-center transition-all duration-200 ease-in-out text-gray-500 ${
                  activeTab === tab.id ? 'text-[#8e7cc3] scale-110' : ''
                }`}>
                  <IconComponent size={24} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Right column - last 2 tabs */}
        <div className="flex items-center">
          {tabs.slice(2, 4).map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                className={`flex flex-col items-center justify-center bg-none border-none px-4 py-3 cursor-pointer transition-all duration-200 ease-in-out rounded-xl min-w-[50px] hover:bg-gray-100 ${
                  activeTab === tab.id ? 'text-[#8e7cc3]' : ''
                }`}
                onClick={() => onTabChange(tab.id)}
              >
                <div className={`flex items-center justify-center transition-all duration-200 ease-in-out text-gray-500 ${
                  activeTab === tab.id ? 'text-[#8e7cc3] scale-110' : ''
                }`}>
                  <IconComponent size={24} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Circular + button in the middle */}
      <button 
        className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-[#8e7cc3] border-none rounded-full cursor-pointer shadow-[0_4px_12px_rgba(142,124,195,0.4)] transition-all duration-300 ease-in-out flex items-center justify-center z-[1001] hover:scale-105 hover:bg-[#7a6bb3] hover:shadow-[0_6px_16px_rgba(142,124,195,0.4)] active:scale-95"
        onClick={() => onTabChange('add')}
      >
        <span className="text-white text-2xl font-bold leading-none">+</span>
      </button>
    </div>
  );
};

export default BottomNavigation;
