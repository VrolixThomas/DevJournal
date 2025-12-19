import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

function Dashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome to DevJournal</h1>
        <div className="user-info">
          <span className="user-email">{user?.email}</span>
          <button onClick={signOut} className="sign-out-button">
            Sign Out
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Your Development Journal</h2>
          <p>Start documenting your development journey here.</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
