import React, { useState } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle, Info, AlertCircle, CheckCircle2, Zap, Download } from 'lucide-react';
import { predictSchema, getZodFieldErrors } from '../utils/schemas';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

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

const fieldConfig: { id: FormField; label: string; unit: string; min: number; max: number; step: number; displayRange: string; hint: string }[] = [
  { id: 'pregnancies', label: 'Pregnancies', unit: 'times', min: 0, max: 17, step: 1, displayRange: '0 – 17 times', hint: 'Number of times pregnant (0 – 17)' },
  { id: 'glucose', label: 'Glucose Level', unit: 'mg/dL', min: 0, max: 398, step: 1, displayRange: '0 – 199 mg/dL', hint: 'Plasma glucose concentration (0 – 199)' },
  { id: 'blood_pressure', label: 'Blood Pressure', unit: 'mm Hg', min: 0, max: 244, step: 1, displayRange: '0 – 122 mm Hg', hint: 'Diastolic blood pressure (0 – 122)' },
  { id: 'skin_thickness', label: 'Skin Thickness', unit: 'mm', min: 0, max: 198, step: 1, displayRange: '0 – 99 mm', hint: 'Triceps skin fold thickness (0 – 99)' },
  { id: 'insulin', label: 'Insulin', unit: 'µU/mL', min: 0, max: 1692, step: 1, displayRange: '0 – 846 µU/mL', hint: '2-Hour serum insulin (0 – 846)' },
  { id: 'bmi', label: 'BMI', unit: 'kg/m²', min: 0, max: 134.2, step: 0.1, displayRange: '0 – 67.1 kg/m²', hint: 'Body Mass Index (0 – 67.1)' },
  { id: 'dpf', label: 'Diabetes Pedigree (DPF)', unit: '', min: 0.078, max: 4.84, step: 0.001, displayRange: '0.078 – 2.42', hint: 'Family history risk score (0.078 – 2.42)' },
  { id: 'age', label: 'Age', unit: 'years', min: 21, max: 162, step: 1, displayRange: '21 – 105 years', hint: 'Age in years (21 – 105)' },
];

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

  // ── Zod Schema Live Validation ──
  const validationResult = predictSchema.safeParse(formData);
  const fieldErrors = !validationResult.success ? getZodFieldErrors(validationResult.error) : {};
  const isValid = validationResult.success;

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

  const getBorderClass = (id: FormField) => {
    if (touched[id]) {
      return fieldErrors[id] ? 'border-danger focus-visible:ring-danger/20' : 'border-success focus-visible:ring-success/20';
    }
    return 'border-border-color';
  };

  // ── Result View ──
  if (result) {
    const isDiabetic = result.prediction === 'Diabetic';
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Your Result</h2>
          <Button onClick={() => setResult(null)} variant="outline" className="rounded-full">
            ← New Assessment
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className={`rounded-2xl p-8 text-white shadow-lg flex flex-col items-center text-center ${isDiabetic
              ? 'bg-linear-to-br from-danger to-[#B91C1C] shadow-danger/20'
              : 'bg-linear-to-br from-success to-[#15803D] shadow-success/20'
              }`}>
              {isDiabetic
                ? <AlertTriangle size={48} className="mb-4" />
                : <CheckCircle size={48} className="mb-4" />
              }
              <h2 className="text-3xl font-bold text-white">{result.prediction}</h2>
              <p className="text-white/85 text-sm mt-1.5">
                Confidence: <strong className="text-white">{result.confidence}%</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 text-center">
                <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Risk Score</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {result.risk_score}
                  <span className="text-sm font-normal text-text-muted">/9</span>
                </p>
              </Card>
              <Card className="p-4 text-center flex flex-col justify-center">
                <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Risk Level</p>
                <p className="text-base font-bold text-text-primary mt-1 truncate">
                  {result.risk_level.trim()}
                </p>
              </Card>
            </div>

            <Button onClick={() => handleDownload(result.id)} size="lg" className="w-full rounded-full gap-2 font-bold shadow-md shadow-primary/20">
              <Download size={18} /> Download PDF Report
            </Button>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <Card className="p-6">
              <h4 className="flex items-center gap-2 mb-4 font-semibold text-text-primary">
                <AlertTriangle size={18} className="text-warning" /> Risk Factors
              </h4>
              <div className="space-y-2">
                {result.risk_factors.map((f, i) => (
                  <div key={i} className="flex gap-2.5 bg-amber-50 border border-amber-200/50 rounded-xl p-3">
                    <AlertCircle size={14} className="text-[#B45309] shrink-0 mt-0.5" />
                    <p className="text-[#78350F] text-xs font-medium leading-relaxed">{f}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="flex items-center gap-2 mb-4 font-semibold text-text-primary">
                <Info size={18} className="text-primary" /> Recommendations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="font-bold text-xs text-text-secondary uppercase tracking-wider">🥗 Food</p>
                  <ul className="space-y-1">
                    {result.food_recommendations.map((r, i) => (
                      <li key={i} className="text-text-secondary text-sm flex items-start gap-1.5">
                        <span className="text-primary">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-xs text-text-secondary uppercase tracking-wider">🏃 Lifestyle</p>
                  <ul className="space-y-1">
                    {result.lifestyle_recommendations.map((r, i) => (
                      <li key={i} className="text-text-secondary text-sm flex items-start gap-1.5">
                        <span className="text-primary">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ── Form View ──
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">Health Assessment</h2>
        <p className="text-text-secondary mt-1">Enter your health metrics below. </p>
      </div>

      {serverError && (
        <Alert variant="destructive">
          <AlertCircle size={16} />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Card className="p-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fieldConfig.map(field => {
              const hasError = touched[field.id] && fieldErrors[field.id];
              const isFieldValid = touched[field.id] && !fieldErrors[field.id];
              return (
                <div key={field.id} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    {field.unit && <span className="text-[11px] text-text-secondary font-medium">{field.unit}</span>}
                  </div>
                  <div className="relative">
                    <Input
                      id={field.id}
                      type="number"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      placeholder={`Range: ${field.displayRange}`}
                      value={formData[field.id]}
                      onChange={handleChange}
                      onBlur={() => handleBlur(field.id)}
                      className={`pr-10 ${getBorderClass(field.id)}`}
                    />
                    {isFieldValid && <CheckCircle2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-success" />}
                    {hasError && <AlertCircle size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-danger" />}
                  </div>
                  {hasError && (
                    <p className="mt-1 text-xs text-danger flex items-center gap-1.5 pl-1">
                      <AlertCircle size={12} /> {fieldErrors[field.id]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={loading || !isValid}
              className="px-8 h-11 rounded-full font-bold shadow-md shadow-primary/20 disabled:shadow-none cursor-pointer"
            >
              <Zap size={18} className="fill-current" />
              {loading ? 'Analyzing…' : 'Generate Prediction'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Predict;
