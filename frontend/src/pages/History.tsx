import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Download, Eye, X, AlertTriangle, CheckCircle,
  Calendar, Droplets, ShieldAlert, Info, Heart
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../components/ui/table';

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
  if (l.includes('very low')) return 'bg-success';
  if (l.includes('low')) return 'bg-emerald-400';
  if (l.includes('moderate')) return 'bg-warning';
  if (l.includes('high') && !l.includes('very')) return 'bg-orange-500';
  if (l.includes('very high')) return 'bg-danger';
  return 'bg-text-muted';
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
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Heart size={40} className="text-primary animate-pulse" />
      <p className="text-text-secondary text-sm">Loading your history…</p>
    </div>
  );

  if (error) return <div className="text-center mt-8 text-danger font-semibold">{error}</div>;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">Prediction History</h2>
        <p className="text-text-secondary mt-1">Review your past health assessments.</p>
      </div>

      {/* Table Card */}
      <Card className="overflow-hidden border border-border-color shadow-sm">
        <CardContent className="p-0">
          {history.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px] pl-6">Date</TableHead>
                  <TableHead>Prediction</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    {/* Date */}
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        <Calendar size={15} className="text-text-muted" />
                        <span className="text-text-secondary font-medium">
                          {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </TableCell>

                    {/* Prediction badge */}
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        item.prediction === 'Diabetic'
                          ? 'bg-red-50 text-danger border-red-200/50'
                          : 'bg-green-50 text-success border-green-200/50'
                      }`}>
                        {item.prediction === 'Diabetic'
                          ? <AlertTriangle size={13} />
                          : <CheckCircle size={13} />}
                        {item.prediction}
                      </span>
                    </TableCell>

                    {/* Confidence */}
                    <TableCell>
                      <div className="space-y-1">
                        <span className="text-text-primary font-semibold text-sm">{item.confidence}%</span>
                        <div className="h-1 w-20 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-linear-to-r from-success to-primary rounded-full"
                            style={{ width: `${item.confidence}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    {/* Risk Level */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${riskDotColor(item.risk_level)}`} />
                        <span className="text-text-secondary text-sm font-medium">{item.risk_level.trim()}</span>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          onClick={() => handleView(item.id)}
                          variant="secondary"
                          size="sm"
                          className="rounded-full bg-primary-light hover:bg-[#99F6E4]/40 text-primary border border-primary/10 gap-1.5 font-bold cursor-pointer"
                        >
                          <Eye size={14} /> View
                        </Button>
                        <Button
                          onClick={() => handleDownload(item.id)}
                          variant="outline"
                          size="sm"
                          className="rounded-full gap-1.5 font-bold cursor-pointer"
                        >
                          <Download size={14} /> PDF
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
              <Heart size={48} className="text-slate-200" />
              <p className="text-text-muted text-sm">
                No prediction history found.<br />Make your first assessment!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Detail Modal ─── */}
      {selectedDetail && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setSelectedDetail(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-[700px] max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-border-color flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-text-primary text-lg">Prediction Details</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {new Date(selectedDetail.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="bg-slate-50 hover:bg-slate-100 rounded-full w-9 h-9 flex items-center justify-center cursor-pointer text-text-secondary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Result Banner */}
              <div className={`rounded-2xl p-6 flex items-center justify-between text-white shadow-md ${
                selectedDetail.prediction === 'Diabetic'
                  ? 'bg-linear-to-br from-danger to-[#B91C1C]'
                  : 'bg-linear-to-br from-success to-[#15803D]'
              }`}>
                <div className="flex items-center gap-3">
                  {selectedDetail.prediction === 'Diabetic'
                    ? <AlertTriangle size={36} />
                    : <CheckCircle size={36} />}
                  <div>
                    <p className="text-white/80 text-xs">Prediction Result</p>
                    <h3 className="font-bold text-xl text-white mt-0.5">{selectedDetail.prediction}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-xs">Confidence</p>
                  <p className="font-bold text-2xl mt-0.5">{selectedDetail.confidence}%</p>
                </div>
              </div>

              {/* Risk Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-border-color rounded-xl p-4">
                  <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Risk Score</p>
                  <p className="text-xl font-bold text-text-primary mt-1">
                    {selectedDetail.risk_score} 
                    <span className="text-sm font-normal text-text-muted">/ 9</span>
                  </p>
                </div>
                <div className="bg-slate-50 border border-border-color rounded-xl p-4">
                  <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Risk Level</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${riskDotColor(selectedDetail.risk_level)}`} />
                    <p className="font-bold text-text-primary text-sm">{selectedDetail.risk_level.trim()}</p>
                  </div>
                </div>
              </div>

              {/* Input Vitals */}
              <div>
                <h4 className="flex items-center gap-2 mb-3 text-sm font-bold text-text-primary">
                  <Droplets size={18} className="text-primary" /> Health Metrics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                    <div key={m.label} className="bg-slate-50 border border-border-color rounded-xl p-3 text-center">
                      <p className="text-text-secondary text-[9px] font-bold uppercase tracking-wider">{m.label}</p>
                      <p className="font-bold text-text-primary text-sm mt-1">{m.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Factors */}
              {selectedDetail.risk_factors.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 mb-3 text-sm font-bold text-text-primary">
                    <ShieldAlert size={18} className="text-warning" /> Risk Factors
                  </h4>
                  <div className="space-y-2">
                    {selectedDetail.risk_factors.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5 bg-amber-50 border border-amber-200/50 rounded-xl p-3">
                        <AlertTriangle size={15} className="text-[#B45309] shrink-0 mt-0.5" />
                        <p className="text-[#78350F] text-xs font-medium leading-relaxed">{f}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div>
                <h4 className="flex items-center gap-2 mb-3 text-sm font-bold text-text-primary">
                  <Info size={18} className="text-success" /> Recommendations
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="font-bold text-[10px] text-text-secondary uppercase tracking-wider">🥗 Food</p>
                    <ul className="space-y-1">
                      {selectedDetail.food_recommendations.map((r, i) => (
                        <li key={i} className="text-text-secondary text-xs flex items-start gap-1.5">
                          <span className="text-success">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-[10px] text-text-secondary uppercase tracking-wider">🏃 Lifestyle</p>
                    <ul className="space-y-1">
                      {selectedDetail.lifestyle_recommendations.map((r, i) => (
                        <li key={i} className="text-text-secondary text-xs flex items-start gap-1.5">
                          <span className="text-primary">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-border-color">
                <Button
                  onClick={() => setSelectedDetail(null)}
                  variant="outline"
                  className="rounded-full"
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleDownload(selectedDetail.id)}
                  className="rounded-full gap-2 font-bold shadow-md shadow-primary/20"
                >
                  <Download size={16} /> Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
