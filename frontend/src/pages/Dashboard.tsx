import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ShieldAlert, CheckCircle, TrendingUp,
  ArrowRight, Heart, Zap, BarChart2
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

interface DashboardData {
  total_predictions: number;
  diabetic_count: number;
  non_diabetic_count: number;
  average_risk_score: number;
  risk_distribution: { name: string; value: number }[];
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        boxShadow: '0 8px 25px rgba(15, 23, 42, 0.08)',
        fontSize: '0.9rem'
      }}>
        <p style={{ color: '#64748B', marginBottom: '0.25rem', fontWeight: 500 }}>{label || payload[0].name}</p>
        <p style={{ color: '#0F172A', fontWeight: 700, margin: 0 }}>{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/dashboard');
        setData(response.data);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return (
    <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <Heart size={40} style={{ color: '#0F766E', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <p style={{ color: '#64748B', margin: 0 }}>Loading your health dashboard…</p>
      </div>
    </div>
  );

  if (error) return <div className="container mt-8 text-center" style={{ color: '#DC2626' }}>{error}</div>;
  if (!data) return null;

  // Specified colors: Healthy = #16A34A, Diabetic/High Risk = #DC2626
  const pieColors = ['#DC2626', '#16A34A'];
  const riskColors = ['#16A34A', '#34D399', '#F59E0B', '#F97316', '#DC2626'];

  const pieData = [
    { name: 'Diabetic', value: data.diabetic_count },
    { name: 'Non-Diabetic', value: data.non_diabetic_count }
  ];

  const riskPercent = data.total_predictions > 0
    ? Math.round((data.average_risk_score / 9) * 100)
    : 0;

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '3rem' }}>

      {/* ── Hero Greeting Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
        borderRadius: '1.5rem',
        padding: '2.5rem 2.5rem',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 8px 30px rgba(15, 118, 110, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', right: '-40px', top: '-40px',
          width: '200px', height: '200px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.08)'
        }} />
        <div style={{
          position: 'absolute', right: '80px', bottom: '-60px',
          width: '150px', height: '150px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.05)'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '0.25rem', fontSize: '1rem', fontWeight: 500 }}>
            {getGreeting()},
          </p>
          <h2 style={{ color: 'white', margin: 0, fontSize: '2.25rem' }}>{user?.full_name} 👋</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '0.5rem', marginBottom: 0 }}>
            Here is your health status and prediction overview.
          </p>
        </div>
        <button
          onClick={() => navigate('/predict')}
          style={{
            background: '#FFFFFF',
            color: '#0F766E',
            border: 'none',
            padding: '0.85rem 1.75rem',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            position: 'relative', zIndex: 1,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            flexShrink: 0
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
        >
          <Zap size={18} /> New Prediction <ArrowRight size={16} />
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Card 1 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: '#CCFBF1',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Activity size={22} style={{ color: '#0F766E' }} />
            </div>
            <span style={{
              background: '#CCFBF1',
              color: '#0F766E', fontSize: '0.75rem', fontWeight: 600,
              padding: '0.25rem 0.6rem', borderRadius: '999px'
            }}>Total</span>
          </div>
          <div>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem', fontWeight: 500 }}>Total Predictions</p>
            <h2 style={{ margin: '0.25rem 0 0', fontSize: '2.5rem', color: '#0F172A', lineHeight: 1 }}>
              {data.total_predictions}
            </h2>
          </div>
        </div>

        {/* Card 2 - Healthy */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: '#DCFCE7',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CheckCircle size={22} style={{ color: '#16A34A' }} />
            </div>
            <span style={{
              background: '#DCFCE7',
              color: '#16A34A', fontSize: '0.75rem', fontWeight: 600,
              padding: '0.25rem 0.6rem', borderRadius: '999px'
            }}>Healthy</span>
          </div>
          <div>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem', fontWeight: 500 }}>Non-Diabetic Results</p>
            <h2 style={{ margin: '0.25rem 0 0', fontSize: '2.5rem', color: '#16A34A', lineHeight: 1 }}>
              {data.non_diabetic_count}
            </h2>
          </div>
        </div>

        {/* Card 3 – Risk Score */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: '#FEF3C7',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ShieldAlert size={22} style={{ color: '#F59E0B' }} />
            </div>
            <span style={{
              background: '#FEF3C7',
              color: '#B45309', fontSize: '0.75rem', fontWeight: 600,
              padding: '0.25rem 0.6rem', borderRadius: '999px'
            }}>Avg</span>
          </div>
          <div>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem', fontWeight: 500 }}>Average Risk Score</p>
            <h2 style={{ margin: '0.25rem 0 0.75rem', fontSize: '2.5rem', color: '#0F172A', lineHeight: 1 }}>
              {data.average_risk_score} <span style={{ fontSize: '1rem', color: '#94A3B8', fontWeight: 400 }}>/ 9</span>
            </h2>
            {/* Progress bar */}
            <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${riskPercent}%`,
                background: 'linear-gradient(90deg, #16A34A, #F59E0B, #DC2626)',
                borderRadius: '999px',
                transition: 'width 1s ease'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.25rem' }}>

        {/* Donut Chart – Prediction Split */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <TrendingUp size={20} style={{ color: '#0F766E' }} />
            <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0F172A' }}>Prediction Overview</h4>
          </div>
          <div style={{ height: '270px' }}>
            {data.total_predictions > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={65} outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={pieColors[index]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={10}
                    formatter={(value) => (
                      <span style={{ color: '#64748B', fontSize: '0.875rem' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem' }}>
                <Heart size={40} style={{ color: '#E2E8F0' }} />
                <p style={{ color: '#94A3B8', margin: 0, textAlign: 'center', fontSize: '0.9rem' }}>No predictions yet.<br />Make your first assessment!</p>
              </div>
            )}
          </div>
        </div>

        {/* Bar Chart – Risk Level Distribution */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <BarChart2 size={20} style={{ color: '#0F766E' }} />
            <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0F172A' }}>Risk Level Distribution</h4>
          </div>
          <div style={{ height: '270px' }}>
            {data.total_predictions > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.risk_distribution}
                  margin={{ top: 5, right: 10, left: -20, bottom: 55 }}
                  barCategoryGap="35%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(15, 118, 110, 0.05)' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {data.risk_distribution.map((_, index) => (
                      <Cell key={index} fill={riskColors[index % riskColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem' }}>
                <BarChart2 size={40} style={{ color: '#E2E8F0' }} />
                <p style={{ color: '#94A3B8', margin: 0, fontSize: '0.9rem' }}>No data available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
