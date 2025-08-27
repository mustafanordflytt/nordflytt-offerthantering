"use client";

import { useState } from 'react';

export default function TestCreditPage() {
  const [personalNumber, setPersonalNumber] = useState('');
  const [showBankID, setShowBankID] = useState(false);
  const [creditResult, setCreditResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Test personal numbers
  const testNumbers = {
    approved: '198502021234',
    rejected: '199001011234',
    rejected2: '197512121234'
  };

  const handleCreditCheck = async () => {
    setLoading(true);
    setShowBankID(true);
    
    // Simulate BankID authentication
    setTimeout(() => {
      // Simulate credit check result based on personal number
      const pn = personalNumber.replace(/\D/g, '');
      
      if (pn === testNumbers.approved.replace(/\D/g, '')) {
        setCreditResult({
          approved: true,
          message: 'Kreditkontrollen godkänd! Du kan betala med faktura.'
        });
      } else {
        setCreditResult({
          approved: false,
          message: 'Kreditkontrollen nekad. Du behöver betala med Swish.',
          swishNumber: '1236721476',
          amount: 15000
        });
      }
      
      setShowBankID(false);
      setLoading(false);
    }, 3000);
  };

  const formatPersonalNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 8) {
      return `${cleaned.slice(0, 8)}-${cleaned.slice(8, 12)}`;
    }
    return cleaned;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Test av Kreditkontroll & Swish
        </h1>

        {!creditResult && !showBankID && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Ange personnummer</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personnummer
                </label>
                <input
                  type="text"
                  value={personalNumber}
                  onChange={(e) => setPersonalNumber(formatPersonalNumber(e.target.value))}
                  placeholder="ÅÅMMDD-XXXX"
                  maxLength={13}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">Test-personnummer:</p>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Godkänd: 19850202-1234</li>
                  <li>• Avvisad: 19900101-1234</li>
                  <li>• Avvisad: 19751212-1234</li>
                </ul>
              </div>

              <button
                onClick={handleCreditCheck}
                disabled={personalNumber.replace(/\D/g, '').length < 10}
                className="w-full bg-[#002A5C] text-white py-2 px-4 rounded-md hover:bg-[#001a42] disabled:opacity-50"
              >
                Starta kreditkontroll
              </button>
            </div>
          </div>
        )}

        {showBankID && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#002A5C] mx-auto mb-4"></div>
              <h2 className="text-lg font-semibold mb-2">Öppna BankID</h2>
              <p className="text-gray-600">Legitimera dig med mobilt BankID...</p>
              <p className="text-sm text-gray-500 mt-2">Simulerar autentisering (3 sekunder)</p>
            </div>
          </div>
        )}

        {creditResult && (
          <div className="bg-white rounded-lg shadow p-6">
            {creditResult.approved ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-green-900 mb-2">Godkänd!</h2>
                <p className="text-gray-600">{creditResult.message}</p>
                <button
                  onClick={() => window.location.href = '/form'}
                  className="mt-6 bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700"
                >
                  Fortsätt med bokning
                </button>
              </div>
            ) : (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-red-900 mb-2">Kreditkontroll ej godkänd</h2>
                  <p className="text-gray-600">{creditResult.message}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Betala med Swish</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Swish-nummer:</p>
                      <p className="text-2xl font-bold">{creditResult.swishNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Belopp att betala:</p>
                      <p className="text-2xl font-bold">{creditResult.amount} kr</p>
                    </div>
                  </div>
                  <button
                    className="w-full mt-6 bg-[#002A5C] text-white py-2 px-4 rounded-md hover:bg-[#001a42]"
                  >
                    Öppna Swish
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setCreditResult(null);
                setPersonalNumber('');
              }}
              className="w-full mt-4 text-gray-600 hover:text-gray-800 text-sm"
            >
              Testa igen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}