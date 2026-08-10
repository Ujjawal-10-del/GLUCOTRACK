import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Download, Eye, X, AlertTriangle, CheckCircle,
  Calendar, Droplets, ShieldAlert, Info, Heart
} from 'lucide-react';

interface HistoryItem {
  id: number;
  prediction: string;
  confidence: number;
  risk_score: number;
  risk_level: string;
  created_at: string;
}

interface PredictionDetail {
  id: number;
  pregnancies: number;
  glucose: number;
  blood_pressure: number;
  skin_thickness: number;
  insulin: number;
  bmi: number;
  dpf: number;
  age: number;
  prediction: string;
  confidence: number;
  risk_score: number;
  risk_level: string;
  risk_factors: string[];
  food_recommendations: string[];
  lifestyle_recommendations: string[];
  created_at: string;
}

const riskDotColor = (level: string): string => {
  const l = level.toLowerCase();
  if (l.includes('very low')) return '#16A34A';
  if (l.includes('low')) return '#34D399';
  if (l.includes('moderate')) return '#F59E0B';
  if (l.includes('high') && !l.includes('very')) return '#F97316';
  if (l.includes('very high')) return '#DC2626';
  return '#94A3B8';
};

const History: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<PredictionDetail | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('/history');
        setHistory(response.data);
      } catch {
        setError('Failed to load prediction history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleView = async (id: number) => {
    try {
      const response = await axios.get(`/history/${id}`);
      setSelectedDetail(response.data);
    } catch {
      alert('Failed to load prediction details');
    }
  };

  const handleDownload = async (id: number) => {
    try {
      const response = await axios.get(`/download/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `GlucoTrack_Report_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert('Failed to download report');
    }
  };

  if (loading) return (
    <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
      <Heart size={40} style={{ color: '#0F766E' }} />
      <p style={{ color: '#64748B', marginTop: '1rem' }}>Loading your history…</p>
    </div>
  );

  if (error) return <div className="container mt-8 text-center" style={{ color: '#DC2626' }}>{error}</div>;

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: '#0F172A' }}>Prediction History</h2>
        <p style={{ marginTop: '0.4rem', marginBottom: 0, color: '#64748B' }}>Review your past health assessments.</p>
      </div>

      {/* Table Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '1.25rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 15px rgba(15, 23, 42, 0.05)',
        overflow: 'hidden'
      }}>
        {history.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {['Date', 'Prediction', 'Confidence', 'Risk Level', 'Actions'].map(col => (
                    <th key={col} style={{
                      padding: '1rem 1.5rem',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      textAlign: col === 'Actions' ? 'right' : 'left'
                    }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: idx < history.length - 1 ? '1px solid #E2E8F0' : 'none',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Date */}
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={15} style={{ color: '#94A3B8' }} />
                        <span style={{ color: '#64748B', fontSize: '0.9rem' }}>
                          {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </td>

                    {/* Prediction badge */}
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.3rem 0.85rem',
                        borderRadius: '999px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        background: item.prediction === 'Diabetic' ? '#FEF2F2' : '#DCFCE7',
                        color: item.prediction === 'Diabetic' ? '#DC2626' : '#16A34A',
                        border: `1px solid ${item.prediction === 'Diabetic' ? '#FECACA' : '#BBF7D0'}`
                      }}>
                        {item.prediction === 'Diabetic'
                          ? <AlertTriangle size={13} />
                          : <CheckCircle size={13} />}
                        {item.prediction}
                      </span>
                    </td>

                    {/* Confidence */}
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div>
                        <span style={{ color: '#0F172A', fontWeight: 600, fontSize: '0.95rem' }}>{item.confidence}%</span>
                        <div style={{ marginTop: '4px', height: '4px', background: '#E2E8F0', borderRadius: '999px', width: '80px' }}>
                          <div style={{
                            height: '100%', width: `${item.confidence}%`,
                            background: 'linear-gradient(90deg, #16A34A, #0F766E)',
                            borderRadius: '999px'
                          }} />
                        </div>
                      </div>
                    </td>

                    {/* Risk Level with dot */}
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '9px', height: '9px', borderRadius: '50%',
                          background: riskDotColor(item.risk_level),
                          flexShrink: 0
                        }} />
                        <span style={{ color: '#64748B', fontSize: '0.9rem' }}>{item.risk_level.trim()}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleView(item.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                            padding: '0.45rem 0.9rem',
                            borderRadius: '999px',
                            fontSize: '0.82rem', fontWeight: 600,
                            border: '1.5px solid #0F766E',
                            color: '#0F766E', background: '#CCFBF1',
                            cursor: 'pointer', transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#99F6E4'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#CCFBF1'; }}
                        >
                          <Eye size={14} /> View
                        </button>
                        <button
                          onClick={() => handleDownload(item.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                            padding: '0.45rem 0.9rem',
                            borderRadius: '999px',
                            fontSize: '0.82rem', fontWeight: 600,
                            border: '1.5px solid #E2E8F0',
                            color: '#64748B', background: '#FFFFFF',
                            cursor: 'pointer', transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF'; }}
                        >
                          <Download size={14} /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <Heart size={48} style={{ color: '#E2E8F0', marginBottom: '1rem' }} />
            <p style={{ color: '#94A3B8', margin: 0 }}>No prediction history found.<br />Make your first assessment!</p>
          </div>
        )}
      </div>

      {/* ─── Detail Modal ─── */}
      {selectedDetail && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.25s ease'
          }}
          onClick={() => setSelectedDetail(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '1.5rem',
              width: '100%', maxWidth: '700px',
              maxHeight: '85vh', overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.15)',
              animation: 'slideUp 0.3s ease'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              position: 'sticky', top: 0, background: '#FFFFFF', borderRadius: '1.5rem 1.5rem 0 0'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0F172A' }}>Prediction Details</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94A3B8' }}>
                  {new Date(selectedDetail.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                style={{
                  background: '#F8FAFC', border: 'none', borderRadius: '50%',
                  width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#64748B'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '2rem' }}>
              {/* Result Banner */}
              <div style={{
                background: selectedDetail.prediction === 'Diabetic'
                  ? 'linear-gradient(135deg, #DC2626, #B91C1C)'
                  : 'linear-gradient(135deg, #16A34A, #15803D)',
                borderRadius: '1rem',
                padding: '1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '1.5rem', color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {selectedDetail.prediction === 'Diabetic'
                    ? <AlertTriangle size={36} />
                    : <CheckCircle size={36} />}
                  <div>
                    <p style={{ margin: 0, opacity: 0.85, fontSize: '0.85rem' }}>Prediction Result</p>
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1.5rem' }}>{selectedDetail.prediction}</h3>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, opacity: 0.85, fontSize: '0.85rem' }}>Confidence</p>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '1.75rem' }}>{selectedDetail.confidence}%</p>
                </div>
              </div>

              {/* Risk Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#F8FAFC', borderRadius: '1rem', padding: '1rem', border: '1px solid #E2E8F0' }}>
                  <p style={{ margin: '0 0 0.25rem', color: '#64748B', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Score</p>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '1.5rem', color: '#0F172A' }}>{selectedDetail.risk_score} <span style={{ fontWeight: 400, fontSize: '1rem', color: '#94A3B8' }}>/ 9</span></p>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '1rem', padding: '1rem', border: '1px solid #E2E8F0' }}>
                  <p style={{ margin: '0 0 0.25rem', color: '#64748B', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Level</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: riskDotColor(selectedDetail.risk_level), flexShrink: 0 }} />
                    <p style={{ margin: 0, fontWeight: 600, color: '#0F172A' }}>{selectedDetail.risk_level.trim()}</p>
                  </div>
                </div>
              </div>

              {/* Input Vitals */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#0F172A', fontSize: '1rem' }}>
                  <Droplets size={18} style={{ color: '#0F766E' }} /> Health Metrics
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                  {[
                    { label: 'Glucose', val: selectedDetail.glucose },
                    { label: 'BMI', val: selectedDetail.bmi },
                    { label: 'Blood Pressure', val: selectedDetail.blood_pressure },
                    { label: 'Insulin', val: selectedDetail.insulin },
                    { label: 'Skin Thickness', val: selectedDetail.skin_thickness },
                    { label: 'Pregnancies', val: selectedDetail.pregnancies },
                    { label: 'Age', val: selectedDetail.age },
                    { label: 'DPF', val: selectedDetail.dpf },
                  ].map(m => (
                    <div key={m.label} style={{ background: '#F8FAFC', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                      <p style={{ margin: '0 0 0.25rem', color: '#64748B', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>{m.label}</p>
                      <p style={{ margin: 0, fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>{m.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Factors */}
              {selectedDetail.risk_factors.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#0F172A', fontSize: '1rem' }}>
                    <ShieldAlert size={18} style={{ color: '#F59E0B' }} /> Risk Factors
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedDetail.risk_factors.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', background: '#FEF3C7', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
                        <AlertTriangle size={15} style={{ color: '#B45309', flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ margin: 0, color: '#78350F', fontSize: '0.9rem' }}>{f}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#0F172A', fontSize: '1rem' }}>
                  <Info size={18} style={{ color: '#16A34A' }} /> Recommendations
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#64748B', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🥗 Food</p>
                    {selectedDetail.food_recommendations.map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <span style={{ color: '#16A34A', flexShrink: 0 }}>•</span>
                        <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>{r}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#64748B', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🏃 Lifestyle</p>
                    {selectedDetail.lifestyle_recommendations.map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <span style={{ color: '#0F766E', flexShrink: 0 }}>•</span>
                        <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>{r}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
                <button
                  onClick={() => setSelectedDetail(null)}
                  style={{
                    padding: '0.65rem 1.5rem', borderRadius: '999px', fontWeight: 600,
                    border: '1.5px solid #E2E8F0', background: '#FFFFFF', color: '#64748B',
                    cursor: 'pointer', fontSize: '0.9rem'
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownload(selectedDetail.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.65rem 1.5rem', borderRadius: '999px', fontWeight: 600,
                    border: 'none', background: '#0F766E', color: 'white',
                    cursor: 'pointer', fontSize: '0.9rem',
                    boxShadow: '0 4px 14px rgba(15, 118, 110, 0.25)'
                  }}
                >
                  <Download size={16} /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default History;
