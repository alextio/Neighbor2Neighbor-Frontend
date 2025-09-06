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
    <div className="bottom-navigation">
      <div className="nav-items">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <div className="nav-icon">
                <IconComponent size={24} />
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Circular + button in the middle */}
      <button 
        className="add-button"
        onClick={() => onTabChange('add')}
      >
        <span className="add-icon">+</span>
      </button>
    </div>
  );
};

export default BottomNavigation;
