import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, ShieldCheck, User, AlertTriangle, FileText } from 'lucide-react';

const Verify = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const encodedData = searchParams.get('data');
      if (!encodedData) throw new Error('No data found in scan.');
      
      const decodedPayload = atob(encodedData);
      const parsed = JSON.parse(decodedPayload);
      setData(parsed);
      setError(null);
    } catch (err) {
      console.error('Failed to parse QR data:', err);
      setError('Invalid or corrupted QR Code data.');
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center border border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Scan Failed</h2>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Filter out entries with empty or dash values
  const entries = Object.entries(data).filter(([, v]) => 
    v !== null && v !== undefined && v !== '' && v !== '-'
  );

  // Try to find a "name" field for the header
  const nameKey = Object.keys(data).find(k => 
    k.toLowerCase() === 'name' || 
    k.toLowerCase().includes('student name') || 
    k.toLowerCase().includes('employee name') || 
    k.toLowerCase().includes('full name')
  );
  const nameValue = nameKey ? String(data[nameKey]) : null;

  // Color palette for row icons
  const colors = [
    { bg: 'bg-blue-100', text: 'text-blue-600' },
    { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    { bg: 'bg-purple-100', text: 'text-purple-600' },
    { bg: 'bg-amber-100', text: 'text-amber-600' },
    { bg: 'bg-rose-100', text: 'text-rose-600' },
    { bg: 'bg-cyan-100', text: 'text-cyan-600' },
    { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    { bg: 'bg-teal-100', text: 'text-teal-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {/* Top Branding Header */}
      <div className="w-full max-w-sm flex items-center justify-center mb-6">
        <ShieldCheck className="w-6 h-6 text-blue-600 mr-2" />
        <h1 className="text-gray-800 font-bold uppercase tracking-wider text-sm">Verified ID Record</h1>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm relative">
        {/* Banner */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 h-32 relative">
          <img src="/gotek-logo.png" alt="GOTEK Logo" className="absolute top-4 left-4 h-20 w-auto object-contain z-10" />
        </div>

        {/* Profile Avatar */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2">
          <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-xl">
            <div className="w-full h-full bg-blue-50 rounded-full flex flex-col items-center justify-center border-2 border-dashed border-blue-200 text-blue-400">
              <User className="w-12 h-12 mb-1" />
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                {nameValue ? 'Verified' : 'No Photo'}
              </span>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="px-6 pt-16 pb-8 text-center mt-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{nameValue || 'Scanned Record'}</h2>

          <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-0 shadow-inner border border-gray-100">
            {entries.map(([key, val], idx) => {
              const color = colors[idx % colors.length];
              return (
                <div key={key} className={`flex items-center text-sm py-3 ${idx > 0 ? 'border-t border-gray-100' : ''}`}>
                  <div className={`w-8 h-8 rounded-full ${color.bg} ${color.text} flex items-center justify-center mr-3 shrink-0`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs uppercase font-bold text-gray-400 mr-2">{key}:</span>
                    <span className="font-semibold text-gray-800 break-words">{String(val)}</span>
                  </div>
                </div>
              );
            })}
            {entries.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No data fields found in scan.</p>
            )}
          </div>
        </div>
        
        {/* Footer status */}
        <div className="bg-green-50 px-4 py-3 border-t border-green-100 flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
          <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Valid Profile Scan</span>
        </div>
      </div>
      
      <p className="text-[10px] text-gray-400 mt-6 text-center max-w-xs">
        * Displaying preview data. Full photo will be visible once uploaded to the database.
      </p>
    </div>
  );
};

export default Verify;
