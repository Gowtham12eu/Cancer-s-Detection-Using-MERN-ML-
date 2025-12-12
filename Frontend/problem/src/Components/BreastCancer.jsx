import React, { useState } from 'react';
import { Activity, AlertCircle, CheckCircle, User, FileText } from 'lucide-react';
import '../App.css'

function BreastCancer() {
    const [patientData, setPatientData] = useState({
        patientId: '',
        patientName: '',
        age: '',
        gender: 'Male',
        notes: ''
    });

    const [cellFeatures, setCellFeatures] = useState(Array(30).fill(''));
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('predict');

    const featureNames = [
        'Mean Radius', 'Mean Texture', 'Mean Perimeter', 'Mean Area', 'Mean Smoothness',
        'Mean Compactness', 'Mean Concavity', 'Mean Concave Points', 'Mean Symmetry', 'Mean Fractal Dimension',
        'SE Radius', 'SE Texture', 'SE Perimeter', 'SE Area', 'SE Smoothness',
        'SE Compactness', 'SE Concavity', 'SE Concave Points', 'SE Symmetry', 'SE Fractal Dimension',
        'Worst Radius', 'Worst Texture', 'Worst Perimeter', 'Worst Area', 'Worst Smoothness',
        'Worst Compactness', 'Worst Concavity', 'Worst Concave Points', 'Worst Symmetry', 'Worst Fractal Dimension'
    ];

    const handlePatientChange = (e) => {
        setPatientData({
            ...patientData,
            [e.target.name]: e.target.value
        });
    };

    const handleFeatureChange = (index, value) => {
        const newFeatures = [...cellFeatures];
        newFeatures[index] = value;
        setCellFeatures(newFeatures);
    };

    const useSampleData = () => {
        const sample = [17.99, 10.38, 122.8, 1001, 0.1184, 0.2776, 0.3001, 0.1471, 0.2419, 0.07871,
            1.095, 0.9053, 8.589, 153.4, 0.006399, 0.04904, 0.05373, 0.01587, 0.03003, 0.006193,
            25.38, 17.33, 184.6, 2019, 0.1622, 0.6656, 0.7119, 0.2654, 0.4601, 0.1189];

        setCellFeatures(sample.map(v => v.toString()));
        setPatientData({
            patientId: 'P' + Math.floor(Math.random() * 10000),
            patientName: 'Sample Patient',
            age: '45',
            gender: 'Female',
            notes: 'Sample data for testing'
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        // Validation
        if (!patientData.patientId) {
            setError('Patient ID is required');
            setLoading(false);
            return;
        }

        const features = cellFeatures.map(f => parseFloat(f));
        if (features.some(isNaN) || features.length !== 30) {
            setError('All 30 features must be valid numbers');
            setLoading(false);
            return;
        }

        try {
            console.log('Sending request to Flask API...');
            
            // Call Express server which will save to MongoDB
            const response = await fetch('http://localhost:5000/api/breast/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    patientId: patientData.patientId,
                    patientName: patientData.patientName,
                    age: parseInt(patientData.age) || null,
                    gender: patientData.gender,
                    notes: patientData.notes,
                    cellFeatures: features
                })
            });

            // Check if response is actually JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error('Server error. Make sure Express (port 5000) and Flask (port 5001) are both running.');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            if (!data.success) {
                throw new Error(data.message || 'Prediction failed');
            }

            console.log('Prediction successful:', data);
            setResult(data);
            setActiveTab('results');

            // Clear form after success
            setPatientData({
                patientId: '',
                patientName: '',
                age: '',
                gender: 'Male',
                notes: ''
            });
            setCellFeatures(Array(30).fill(''));
            setError('');
        } catch (err) {
            console.error('Error:', err);
            setError(err.message || 'Failed to connect. Make sure Express (port 5000) and Flask (port 5001) are running.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setPatientData({
            patientId: '',
            patientName: '',
            age: '',
            gender: 'Male',
            notes: ''
        });
        setCellFeatures(Array(30).fill(''));
        setResult(null);
        setError('');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF)', padding: '24px' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <Activity size={40} color="#4F46E5" />
                            <div>
                                <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1F2937' }}>Breast Cancer Detection System</h1>
                                <p style={{ color: '#6B7280' }}>AI-Powered Cell Analysis</p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '14px', color: '#6B7280' }}>
                            <p>ML Model v1.0</p>
                            <p style={{ fontSize: '12px' }}>Express: 5000 | Flask: 5001</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB' }}>
                        <button
                            onClick={() => setActiveTab('predict')}
                            style={{
                                flex: 1,
                                padding: '16px 24px',
                                fontWeight: '500',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: activeTab === 'predict' ? '#4F46E5' : '#6B7280',
                                borderBottom: activeTab === 'predict' ? '2px solid #4F46E5' : 'none'
                            }}
                        >
                            New Prediction
                        </button>
                        <button
                            onClick={() => setActiveTab('results')}
                            disabled={!result}
                            style={{
                                flex: 1,
                                padding: '16px 24px',
                                fontWeight: '500',
                                background: 'transparent',
                                border: 'none',
                                cursor: result ? 'pointer' : 'not-allowed',
                                color: activeTab === 'results' ? '#4F46E5' : '#6B7280',
                                borderBottom: activeTab === 'results' ? '2px solid #4F46E5' : 'none',
                                opacity: result ? 1 : 0.5
                            }}
                        >
                            Results
                        </button>
                    </div>

                    {/* Prediction Tab */}
                    {activeTab === 'predict' && (
                        <div style={{ padding: '24px' }}>

                            {/* Patient Info */}
                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <User size={20} />
                                    Patient Information
                                </h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                                    <input
                                        type="text"
                                        name="patientId"
                                        placeholder="Patient ID *"
                                        value={patientData.patientId}
                                        onChange={handlePatientChange}
                                        style={{ padding: '8px 16px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px' }}
                                    />
                                    <input
                                        type="text"
                                        name="patientName"
                                        placeholder="Patient Name"
                                        value={patientData.patientName}
                                        onChange={handlePatientChange}
                                        style={{ padding: '8px 16px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px' }}
                                    />
                                    <input
                                        type="number"
                                        name="age"
                                        placeholder="Age"
                                        value={patientData.age}
                                        onChange={handlePatientChange}
                                        style={{ padding: '8px 16px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px' }}
                                    />
                                    <select
                                        name="gender"
                                        value={patientData.gender}
                                        onChange={handlePatientChange}
                                        style={{ padding: '8px 16px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px' }}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {/* Cell Features */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <FileText size={20} />
                                        Cell Features (30 Required)
                                    </h2>
                                    <button
                                        onClick={useSampleData}
                                        style={{ padding: '8px 16px', background: '#6B7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                        Load Sample Data
                                    </button>
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                    gap: '12px',
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    padding: '16px',
                                    background: '#F9FAFB',
                                    borderRadius: '8px'
                                }}>
                                    {featureNames.map((name, index) => (
                                        <div key={index}>
                                            <label style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px', display: 'block' }}>{name}</label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={cellFeatures[index]}
                                                onChange={(e) => handleFeatureChange(index, e.target.value)}
                                                style={{ width: '100%', padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: '4px', fontSize: '14px' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div style={{ marginBottom: '24px' }}>
                                <textarea
                                    name="notes"
                                    placeholder="Clinical Notes (optional)"
                                    value={patientData.notes}
                                    onChange={handlePatientChange}
                                    rows={3}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px' }}
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div style={{ padding: '16px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '8px', alignItems: 'center', color: '#B91C1C' }}>
                                    <AlertCircle size={20} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Buttons */}
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    style={{
                                        flex: 1,
                                        padding: '12px 24px',
                                        background: loading ? '#9CA3AF' : '#4F46E5',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        cursor: loading ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {loading ? 'Analyzing...' : 'Analyze & Predict'}
                                </button>
                                <button
                                    onClick={resetForm}
                                    style={{
                                        padding: '12px 24px',
                                        background: '#D1D5DB',
                                        color: '#374151',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Results Tab */}
                    {activeTab === 'results' && result && (
                        <div style={{ padding: '24px' }}>

                            {/* Result Card */}
                            <div style={{
                                padding: '24px',
                                borderRadius: '12px',
                                marginBottom: '24px',
                                border: '2px solid',
                                background: result.result.prediction === 'CANCER DETECTED' ? '#FEE2E2' : '#D1FAE5',
                                borderColor: result.result.prediction === 'CANCER DETECTED' ? '#FCA5A5' : '#6EE7B7'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        {result.result.prediction === 'CANCER DETECTED' ? (
                                            <AlertCircle size={48} color="#DC2626" />
                                        ) : (
                                            <CheckCircle size={48} color="#059669" />
                                        )}
                                        <div>
                                            <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>{result.result.prediction}</h2>
                                            <p style={{ color: '#6B7280' }}>Diagnosis: {result.result.diagnosis}</p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4F46E5' }}>{result.result.confidence}%</div>
                                        <div style={{ fontSize: '14px', color: '#6B7280' }}>Confidence</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#6B7280' }}>Patient ID</p>
                                        <p style={{ fontWeight: '500' }}>{result.patient.patientId}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#6B7280' }}>Name</p>
                                        <p style={{ fontWeight: '500' }}>{result.patient.patientName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#6B7280' }}>Age</p>
                                        <p style={{ fontWeight: '500' }}>{result.patient.age || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#6B7280' }}>Gender</p>
                                        <p style={{ fontWeight: '500' }}>{result.patient.gender || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendation */}
                            <div style={{ padding: '16px', background: '#DBEAFE', border: '1px solid #93C5FD', borderRadius: '8px', marginBottom: '24px' }}>
                                <h3 style={{ fontWeight: 'bold', color: '#1E3A8A', marginBottom: '8px' }}>Recommendation:</h3>
                                <p style={{ color: '#1E40AF' }}>{result.result.recommendation}</p>
                            </div>

                            {/* High Risk Features */}
                            {result.result.highRiskFeatures && result.result.highRiskFeatures.length > 0 && (
                                <div style={{ padding: '16px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', marginBottom: '24px' }}>
                                    <h3 style={{ fontWeight: 'bold', color: '#92400E', marginBottom: '8px' }}>High Risk Features:</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {result.result.highRiskFeatures.map((feature, idx) => (
                                            <span key={idx} style={{ padding: '6px 12px', background: '#FDE68A', color: '#92400E', borderRadius: '16px', fontSize: '14px' }}>
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Disclaimer */}
                            <div style={{ padding: '16px', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '8px', marginBottom: '24px' }}>
                                <p style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center' }}>
                                    ⚠️ <strong>Disclaimer:</strong> This is an AI prediction for educational purposes only. Always consult qualified healthcare professionals for medical decisions.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button
                                    onClick={() => setActiveTab('predict')}
                                    style={{
                                        flex: 1,
                                        padding: '12px 24px',
                                        background: '#4F46E5',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                >
                                    New Analysis
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    style={{
                                        padding: '12px 24px',
                                        background: '#D1D5DB',
                                        color: '#374151',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Print Report
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BreastCancer;