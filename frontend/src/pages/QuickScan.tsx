import React, { useState, useRef, useEffect } from 'react';

const QuickScan: React.FC = () => {
  const [barcode, setBarcode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus the input when component mounts
    inputRef.current?.focus();
  }, []);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode) {
      alert('Scanned: ' + barcode);
      setBarcode('');
      inputRef.current?.focus();
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Quick Scan</h1>
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <p className="mb-4 text-gray-500">
          USB barcode scanners work via keyboard emulation. Simply focus the input below and scan!
        </p>

        <form onSubmit={handleScan}>
          <div className="mb-4">
            <label className="label">Scan or Enter Barcode</label>
            <input
              ref={inputRef}
              type="text"
              className="input"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan barcode here..."
              autoFocus
              style={{ fontSize: '1.25rem', padding: '1rem' }}
            />
          </div>

          <div className="alert alert-info">
            <strong>📱 Tip:</strong> USB barcode scanners automatically enter the scanned code and press Enter.
            Keep this field focused for seamless scanning.
          </div>
        </form>

        {barcode && (
          <div className="mt-4">
            <div className="card-header">Product Info</div>
            <p className="text-gray-500">Product details will appear here after scan</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickScan;
