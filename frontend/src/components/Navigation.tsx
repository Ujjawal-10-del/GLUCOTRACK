import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  Activity, LayoutDashboard, History, User,
  LogOut, Heart
} from 'lucide-react';
import { Button } from './ui/button';

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
    <aside className="w-[260px] h-screen fixed top-0 left-0 z-50 bg-white border-r border-border-color shadow-sm flex flex-col justify-between p-7">
      {/* ── Top Section: Logo & Nav Links ── */}
      <div>
        {/* Logo */}
        <Link to="/dashboard" className="no-underline flex items-center gap-3 mb-10 pl-2">
          <div className="w-[42px] h-[42px] bg-linear-to-br from-primary to-[#0d655f] rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
            <Heart size={22} className="text-white fill-white" />
          </div>
          <span className="font-bold text-xl text-text-primary tracking-tight">
            Gluco<span className="text-primary">Track</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex flex-col gap-2">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className="no-underline"
            >
              {({ isActive }) => (
                <div className={`flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl font-semibold text-[15px] transition-all duration-250 ${
                  isActive 
                    ? 'text-primary bg-primary-light' 
                    : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary'
                }`}>
                  {React.cloneElement(link.icon, {
                    className: isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-primary'
                  })}
                  {link.label}
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* ── Bottom Section: Profile & Logout ── */}
      <div className="border-t border-border-color pt-5 flex flex-col gap-3">
        {/* User Profile Card */}
        <NavLink
          to="/profile"
          className="no-underline"
        >
          {({ isActive }) => (
            <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-250 cursor-pointer ${
              isActive 
                ? 'bg-primary-light border-primary/20' 
                : 'bg-bg-primary border-border-color hover:border-slate-300'
            }`}>
              <div className="w-[38px] h-[38px] bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user?.full_name ? getInitials(user.full_name) : 'U'}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="m-0 font-semibold text-[14px] text-text-primary truncate">
                  {user?.full_name || 'User'}
                </p>
                <p className="m-0 text-[12px] text-text-secondary truncate">
                  {user?.email || ''}
                </p>
              </div>
              <User size={16} className={isActive ? 'text-primary' : 'text-text-secondary'} />
            </div>
          )}
        </NavLink>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-center gap-2 bg-bg-primary hover:bg-danger/5 hover:text-danger hover:border-danger/20"
        >
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </aside>
  );
};

export default Navigation;
