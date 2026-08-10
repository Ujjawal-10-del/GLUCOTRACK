import React, { useState } from 'react';
import axios from 'axios';
import { Activity, AlertTriangle, CheckCircle, Info, AlertCircle, CheckCircle2, Zap, Download } from 'lucide-react';

interface PredictionResult {
  id: number;
  prediction: string;
  confidence: number;
  risk_score: number;
  risk_level: string;
  risk_factors: string[];
  food_recommendations: string[];
  lifestyle_recommendations: string[];
}

type FormField = 'pregnancies' | 'glucose' | 'blood_pressure' | 'skin_thickness' | 'insulin' | 'bmi' | 'dpf' | 'age';

const fieldConfig: { id: FormField; label: string; unit: string; min: number; max: number; step: number; hint: string }[] = [
  { id: 'pregnancies',   label: 'Pregnancies',              unit: 'times',   min: 0,     max: 17,   step: 1,     hint: 'Number of times pregnant (0 – 17)' },
  { id: 'glucose',       label: 'Glucose Level',            unit: 'mg/dL',   min: 0,     max: 199,  step: 1,     hint: 'Plasma glucose concentration (0 – 199)' },
  { id: 'blood_pressure',label: 'Blood Pressure',           unit: 'mm Hg',   min: 0,     max: 122,  step: 1,     hint: 'Diastolic blood pressure (0 – 122)' },
  { id: 'skin_thickness',label: 'Skin Thickness',           unit: 'mm',      min: 0,     max: 99,   step: 1,     hint: 'Triceps skin fold thickness (0 – 99)' },
  { id: 'insulin',       label: 'Insulin',                  unit: 'µU/mL',   min: 0,     max: 846,  step: 1,     hint: '2-Hour serum insulin (0 – 846)' },
  { id: 'bmi',           label: 'BMI',                      unit: 'kg/m²',   min: 0,     max: 67.1, step: 0.1,   hint: 'Body Mass Index (0 – 67.1)' },
  { id: 'dpf',           label: 'Diabetes Pedigree (DPF)',  unit: '',        min: 0.078, max: 2.42, step: 0.001, hint: 'Family history risk score (0.078 – 2.42)' },
  { id: 'age',           label: 'Age',                      unit: 'years',   min: 21,    max: 81,   step: 1,     hint: 'Age in years (21 – 81)' },
];

const validateField = (id: FormField, value: string): string => {
  if (value === '' || value === undefined) return 'This field is required';
  const num = parseFloat(value);
  const cfg = fieldConfig.find(f => f.id === id)!;
  if (isNaN(num)) return 'Enter a valid number';
  if (num < cfg.min) return `Minimum value is ${cfg.min}`;
  if (num > cfg.max) return `Maximum value is ${cfg.max}`;
  return '';
};

const Predict: React.FC = () => {
  const [formData, setFormData] = useState<Record<FormField, string>>({
    pregnancies: '', glucose: '', blood_pressure: '', skin_thickness: '',
    insulin: '', bmi: '', dpf: '', age: ''
  });
  const [touched, setTouched] = useState<Record<FormField, boolean>>({
    pregnancies: false, glucose: false, blood_pressure: false, skin_thickness: false,
    insulin: false, bmi: false, dpf: false, age: false
  });
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [result, setResult] = useState<PredictionResult | null>(null);

  const fieldErrors: Record<FormField, string> = {} as any;
  fieldConfig.forEach(f => { fieldErrors[f.id] = validateField(f.id, formData[f.id]); });
  const isValid = Object.values(fieldErrors).every(e => e === '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.id as FormField;
    setFormData(prev => ({ ...prev, [id]: e.target.value }));
    setTouched(prev => ({ ...prev, [id]: true }));
  };

  const handleBlur = (id: FormField) => setTouched(prev => ({ ...prev, [id]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = {} as Record<FormField, boolean>;
    fieldConfig.forEach(f => { allTouched[f.id] = true; });
    setTouched(allTouched);
    if (!isValid) return;

    setLoading(true);
    setServerError('');
    setResult(null);
    try {
      const response = await axios.post('/predict', formData);
      setResult(response.data);
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Failed to generate prediction');
    } finally {
      setLoading(false);
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
    } catch { }
  };

  // ── Result View ──
  if (result) {
    const isDiabetic = result.prediction === 'Diabetic';
    return (
      <div className="container animate-fade-in" style={{ paddingBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, color: '#0F172A' }}>Your Result</h2>
          <button onClick={() => setResult(null)} style={{ padding: '0.6rem 1.25rem', borderRadius: '999px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#64748B', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
            ← New Assessment
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1.5rem' }}>
          <div>
            <div style={{
              background: isDiabetic ? 'linear-gradient(135deg, #DC2626, #B91C1C)' : 'linear-gradient(135deg, #16A34A, #15803D)',
              borderRadius: '1.25rem', padding: '2rem', color: 'white', marginBottom: '1.25rem',
              boxShadow: isDiabetic ? '0 8px 30px rgba(220, 38, 38, 0.25)' : '0 8px 30px rgba(22, 163, 74, 0.25)'
            }}>
              {isDiabetic ? <AlertTriangle size={48} style={{ marginBottom: '0.75rem' }} /> : <CheckCircle size={48} style={{ marginBottom: '0.75rem' }} />}
              <h2 style={{ color: 'white', margin: '0 0 0.25rem' }}>{result.prediction}</h2>
              <p style={{ opacity: 0.85, margin: 0 }}>Confidence: <strong>{result.confidence}%</strong></p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#FFFFFF', borderRadius: '1rem', padding: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
                <p style={{ margin: '0 0 0.25rem', color: '#64748B', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Risk Score</p>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '1.5rem', color: '#0F172A' }}>{result.risk_score}<span style={{ fontWeight: 400, fontSize: '0.9rem', color: '#94A3B8' }}>/9</span></p>
              </div>
              <div style={{ background: '#FFFFFF', borderRadius: '1rem', padding: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
                <p style={{ margin: '0 0 0.25rem', color: '#64748B', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Risk Level</p>
                <p style={{ margin: 0, fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>{result.risk_level.trim()}</p>
              </div>
            </div>
            <button onClick={() => handleDownload(result.id)} style={{ width: '100%', padding: '0.85rem', borderRadius: '999px', border: 'none', background: '#0F766E', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(15, 118, 110, 0.25)' }}>
              <Download size={18} /> Download PDF Report
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#FFFFFF', borderRadius: '1.25rem', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1rem', color: '#0F172A' }}><AlertTriangle size={18} style={{ color: '#F59E0B' }} /> Risk Factors</h4>
              {result.risk_factors.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', background: '#FEF3C7', borderRadius: '0.75rem', padding: '0.6rem 0.85rem', marginBottom: '0.5rem' }}>
                  <AlertCircle size={14} style={{ color: '#B45309', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ margin: 0, color: '#78350F', fontSize: '0.875rem' }}>{f}</p>
                </div>
              ))}
            </div>
            <div style={{ background: '#FFFFFF', borderRadius: '1.25rem', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1rem', color: '#0F172A' }}><Info size={18} style={{ color: '#0F766E' }} /> Recommendations</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>🥗 Food</p>
                  {result.food_recommendations.map((r, i) => <p key={i} style={{ margin: '0 0 0.35rem', color: '#64748B', fontSize: '0.85rem' }}>• {r}</p>)}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>🏃 Lifestyle</p>
                  {result.lifestyle_recommendations.map((r, i) => <p key={i} style={{ margin: '0 0 0.35rem', color: '#64748B', fontSize: '0.85rem' }}>• {r}</p>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form View ──
  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: '#0F172A' }}>Health Assessment</h2>
        <p style={{ margin: '0.4rem 0 0', color: '#64748B' }}>Enter your health metrics below. Each field will validate in real-time.</p>
      </div>

      {serverError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.5rem' }}>
          <AlertCircle size={16} style={{ color: '#DC2626' }} />
          <p style={{ margin: 0, color: '#DC2626', fontSize: '0.9rem' }}>{serverError}</p>
        </div>
      )}

      <div style={{ background: '#FFFFFF', borderRadius: '1.5rem', padding: '2rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(15,23,42,0.05)' }}>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {fieldConfig.map(field => {
              const hasError = touched[field.id] && fieldErrors[field.id];
              const isFieldValid = touched[field.id] && !fieldErrors[field.id];
              return (
                <div key={field.id}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>{field.label}</span>
                    {field.unit && <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{field.unit}</span>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id={field.id}
                      type="number"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      placeholder={field.hint}
                      value={formData[field.id]}
                      onChange={handleChange}
                      onBlur={() => handleBlur(field.id)}
                      style={{
                        width: '100%',
                        padding: '0.8rem 2.5rem 0.8rem 1rem',
                        background: '#FFFFFF',
                        border: `1.5px solid ${hasError ? '#DC2626' : isFieldValid ? '#16A34A' : '#E2E8F0'}`,
                        borderRadius: '0.875rem',
                        color: '#0F172A',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                      }}
                    />
                    {isFieldValid && <CheckCircle2 size={16} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#16A34A' }} />}
                    {hasError && <AlertCircle size={16} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#DC2626' }} />}
                  </div>
                  {hasError && (
                    <p style={{ margin: '0.35rem 0 0 0.2rem', fontSize: '0.78rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <AlertCircle size={12} /> {fieldErrors[field.id]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.85rem 2rem', borderRadius: '999px', border: 'none',
                background: loading ? '#E2E8F0' : '#0F766E',
                color: loading ? '#94A3B8' : 'white',
                fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: !loading ? '0 4px 14px rgba(15, 118, 110, 0.25)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Zap size={18} />
              {loading ? 'Analyzing…' : 'Generate Prediction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Predict;
