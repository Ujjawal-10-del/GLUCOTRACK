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
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

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
      <div className="bg-white border border-border-color rounded-xl p-3 shadow-lg text-sm">
        <p className="text-text-secondary mb-1 font-medium">{label || payload[0].name}</p>
        <p className="text-text-primary font-bold">{payload[0].value}</p>
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
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Heart size={40} className="text-primary animate-pulse" />
      <p className="text-text-secondary text-sm">Loading your health dashboard…</p>
    </div>
  );

  if (error) return <div className="text-center mt-8 text-danger font-semibold">{error}</div>;
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
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-8 animate-fade-in">

      {/* ── Hero Greeting Banner ── */}
      <div className="relative overflow-hidden bg-linear-to-br from-primary to-[#115E59] rounded-2xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-lg shadow-primary/20">
        <div className="absolute right-[-40px] top-[-40px] w-[200px] h-[200px] rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-[80px] bottom-[-60px] w-[150px] h-[150px] rounded-full bg-white/5 pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <p className="text-white/80 text-sm font-medium">{getGreeting()},</p>
          <h2 className="text-3xl font-bold text-white">{user?.full_name} 👋</h2>
          <p className="text-white/75 text-sm">
            Here is your health status and prediction overview.
          </p>
        </div>
        
        <Button
          onClick={() => navigate('/predict')}
          variant="secondary"
          size="lg"
          className="relative z-10 bg-white hover:bg-slate-50 text-primary font-bold shadow-md shrink-0 flex items-center gap-2 rounded-full cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Zap size={18} className="fill-primary" /> New Prediction <ArrowRight size={16} />
        </Button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <Card className="flex flex-col justify-between p-6">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
              <Activity size={22} className="text-primary" />
            </div>
            <span className="bg-primary-light text-primary text-[11px] font-bold px-2.5 py-1 rounded-full">
              Total
            </span>
          </div>
          <div className="mt-4">
            <p className="text-text-secondary text-sm font-medium">Total Predictions</p>
            <h2 className="text-4xl font-bold text-text-primary mt-1">
              {data.total_predictions}
            </h2>
          </div>
        </Card>

        {/* Card 2 - Healthy */}
        <Card className="flex flex-col justify-between p-6">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <CheckCircle size={22} className="text-success" />
            </div>
            <span className="bg-green-50 text-success text-[11px] font-bold px-2.5 py-1 rounded-full">
              Healthy
            </span>
          </div>
          <div className="mt-4">
            <p className="text-text-secondary text-sm font-medium">Non-Diabetic Results</p>
            <h2 className="text-4xl font-bold text-success mt-1">
              {data.non_diabetic_count}
            </h2>
          </div>
        </Card>

        {/* Card 3 – Risk Score */}
        <Card className="flex flex-col justify-between p-6">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <ShieldAlert size={22} className="text-warning" />
            </div>
            <span className="bg-amber-50 text-[#B45309] text-[11px] font-bold px-2.5 py-1 rounded-full">
              Avg Risk
            </span>
          </div>
          <div className="mt-4">
            <p className="text-text-secondary text-sm font-medium">Average Risk Score</p>
            <h2 className="text-4xl font-bold text-text-primary mt-1 flex items-baseline gap-1">
              {data.average_risk_score} 
              <span className="text-sm text-text-muted font-normal">/ 9</span>
            </h2>
            {/* Progress bar */}
            <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full rounded-full bg-linear-to-r from-success via-warning to-danger transition-all duration-1000"
                style={{ width: `${riskPercent}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Donut Chart – Prediction Split */}
        <Card className="lg:col-span-2 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-primary" />
            <h4 className="font-semibold text-text-primary">Prediction Overview</h4>
          </div>
          <div className="h-[270px] w-full relative">
            {data.total_predictions > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={65} outerRadius={95}
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
                      <span className="text-text-secondary text-xs font-medium ml-1">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Heart size={40} className="text-slate-200" />
                <p className="text-text-muted text-center text-sm">
                  No predictions yet.<br />Make your first assessment!
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Bar Chart – Risk Level Distribution */}
        <Card className="lg:col-span-3 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 size={20} className="text-primary" />
            <h4 className="font-semibold text-text-primary">Risk Level Distribution</h4>
          </div>
          <div className="h-[270px] w-full relative">
            {data.total_predictions > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.risk_distribution}
                  margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                  barCategoryGap="35%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(15, 118, 110, 0.03)' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {data.risk_distribution.map((_, index) => (
                      <Cell key={index} fill={riskColors[index % riskColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <BarChart2 size={40} className="text-slate-200" />
                <p className="text-text-muted text-sm">No data available yet.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
};

export default Dashboard;
