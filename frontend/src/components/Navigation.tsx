import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  Activity, LayoutDashboard, History, User,
  LogOut, Heart
} from 'lucide-react';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/predict', label: 'Predict', icon: <Activity size={20} /> },
    { to: '/history', label: 'History', icon: <History size={20} /> },
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 100,
      background: '#FFFFFF',
      borderRight: '1px solid #E2E8F0',
      boxShadow: '4px 0 20px rgba(15, 23, 42, 0.03)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '1.75rem 1.25rem',
    }}>
      {/* ── Top Section: Logo & Nav Links ── */}
      <div>
        {/* Logo */}
        <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', paddingLeft: '0.5rem' }}>
          <div style={{
            width: '42px', height: '42px',
            background: 'linear-gradient(135deg, #0F766E, #0d655f)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(15, 118, 110, 0.25)'
          }}>
            <Heart size={22} color="white" fill="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.3rem', color: '#0F172A', letterSpacing: '-0.03em' }}>
            Gluco<span style={{ color: '#0F766E' }}>Track</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              style={{ textDecoration: 'none' }}
            >
              {({ isActive }) => (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.85rem',
                  padding: '0.85rem 1.15rem',
                  borderRadius: '1rem',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.98rem',
                  color: isActive ? '#0F766E' : '#64748B',
                  background: isActive ? '#CCFBF1' : 'transparent',
                  transition: 'all 0.2s ease',
                }}>
                  {React.cloneElement(link.icon, {
                    style: { color: isActive ? '#0F766E' : '#94A3B8' }
                  })}
                  {link.label}
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* ── Bottom Section: Profile & Logout ── */}
      <div style={{
        borderTop: '1px solid #E2E8F0',
        paddingTop: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {/* User Card */}
        <NavLink
          to="/profile"
          style={{ textDecoration: 'none' }}
        >
          {({ isActive }) => (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              borderRadius: '1rem',
              background: isActive ? '#CCFBF1' : '#F8FAFC',
              border: '1px solid #E2E8F0',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                background: '#0F766E',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.85rem',
                flexShrink: 0
              }}>
                {user?.full_name ? getInitials(user.full_name) : 'U'}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <p style={{
                  margin: 0,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: '#0F172A',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user?.full_name || 'User'}
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  color: '#64748B',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user?.email || ''}
                </p>
              </div>
              <User size={16} style={{ color: isActive ? '#0F766E' : '#64748B', flexShrink: 0 }} />
            </div>
          )}
        </NavLink>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            width: '100%',
            padding: '0.75rem',
            borderRadius: '1rem',
            border: '1px solid #E2E8F0',
            background: '#F8FAFC',
            color: '#64748B',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#FEF2F2';
            e.currentTarget.style.borderColor = '#FECACA';
            e.currentTarget.style.color = '#DC2626';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#F8FAFC';
            e.currentTarget.style.borderColor = '#E2E8F0';
            e.currentTarget.style.color = '#64748B';
          }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Navigation;
