import React, { useState } from 'react';
import { Camera, AlertCircle, CheckCircle, User, Upload, ImageIcon } from 'lucide-react';

function SkinCancer() {
    const [patientData, setPatientData] = useState({
        patientId: '',
        patientName: '',
        age: '',
        gender: 'Male',
        location: '',
        notes: ''
    });

    const [imageData, setImageData] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('predict');

    const handlePatientChange = (e) => {
        setPatientData({
            ...patientData,
            [e.target.name]: e.target.value
        });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please upload a valid image file (JPG, PNG)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64String = event.target.result;
            setImageData(base64String);
            setImagePreview(base64String);
            setError('');
        };
        reader.onerror = () => setError('Failed to read image file');
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        if (!patientData.patientId.trim()) {
            setError('Patient ID is required');
            setLoading(false);
            return;
        }

        if (!imageData) {
            setError('Please upload a skin lesion image');
            setLoading(false);
            return;
        }

        try {
            console.log('📤 Sending request to backend...');
            
            const response = await fetch('http://localhost:5000/api/skin/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    patientId: patientData.patientId.trim(),
                    patientName: patientData.patientName.trim(),
                    age: parseInt(patientData.age) || null,
                    gender: patientData.gender,
                    location: patientData.location.trim(),
                    notes: patientData.notes.trim(),
                    image: imageData,
                    saveImage: true
                })
            });

            const data = await response.json();
            
            console.log('📥 BACKEND RESPONSE:', JSON.stringify(data, null, 2));

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Prediction failed');
            }

            if (!data.success) {
                throw new Error(data.message || data.error || 'Prediction returned success: false');
            }

            // Store the complete response
            setResult(data);
            setActiveTab('results');

            // Clear form
            setPatientData({
                patientId: '',
                patientName: '',
                age: '',
                gender: 'Male',
                location: '',
                notes: ''
            });
            setImageData(null);
            setImagePreview(null);
            setError('');

            console.log('✅ Prediction successful!');

        } catch (err) {
            console.error('❌ Submit error:', err);
            setError(err.message || 'Failed to connect to backend. Ensure it\'s running on port 5000');
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
            location: '',
            notes: ''
        });
        setImageData(null);
        setImagePreview(null);
        setResult(null);
        setError('');
        setActiveTab('predict');
    };

    // FIXED: Helper functions with proper field access
    const getPatientInfo = (field) => {
        if (!result) return 'N/A';
        // Try multiple possible locations
        return result.patient?.[field] || 
               result[field] || 
               'N/A';
    };

    const getResultInfo = (field) => {
        if (!result) return 'N/A';
        // Try multiple possible locations
        return result.result?.[field] || 
               result[field] || 
               'N/A';
    };

    const getRiskLevel = () => {
        const level = getResultInfo('riskLevel');
        return typeof level === 'string' ? level.toUpperCase() : 'LOW';
    };

    const getConfidence = () => {
        const conf = getResultInfo('confidence');
        return typeof conf === 'number' ? conf : 0;
    };

    const getPrediction = () => {
        return getResultInfo('prediction') || 'Unknown';
    };

    const getRecommendation = () => {
        return getResultInfo('recommendation') || 'Consult a dermatologist for evaluation.';
    };

    const getTopPredictions = () => {
        const top = result?.result?.topPredictions || 
                   result?.topPredictions || 
                   [];
        return Array.isArray(top) ? top : [];
    };

    const getAnalysis = () => {
        return result?.result?.analysis || 
               result?.analysis || 
               {};
    };

    const getIsCancer = () => {
        return result?.result?.isCancer || 
               result?.isCancer || 
               false;
    };

    const getRiskColor = (riskLevel) => {
        const level = riskLevel?.toUpperCase();
        switch (level) {
            case 'HIGH': return '#DC2626';
            case 'MEDIUM': return '#F59E0B';
            case 'LOW': return '#059669';
            default: return '#6B7280';
        }
    };

    return (
        <>
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FED7AA 100%)',
                padding: '24px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

                    {/* HEADER */}
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        padding: '32px',
                        marginBottom: '32px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    background: 'linear-gradient(135deg, #EA580C, #F97316)',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Camera size={32} color="white" />
                                </div>
                                <div>
                                    <h1 style={{
                                        fontSize: '32px',
                                        fontWeight: '800',
                                        color: '#1F2937',
                                        margin: '0 0 4px 0'
                                    }}>
                                        Skin Cancer Detection System
                                    </h1>
                                    <p style={{ color: '#6B7280', fontSize: '16px', margin: 0 }}>
                                        AI-Powered Skin Lesion Analysis using CNN
                                    </p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '18px', fontWeight: '600', color: '#EA580C', margin: 0 }}>
                                    Skin Cancer Detection
                                </p>
                                <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                                    8 Condition Types
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* MAIN CONTAINER */}
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        overflow: 'hidden'
                    }}>

                        {/* TABS */}
                        <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB' }}>
                            <button
                                onClick={() => setActiveTab('predict')}
                                style={{
                                    flex: 1,
                                    padding: '20px 32px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: activeTab === 'predict' ? '#EA580C' : '#6B7280',
                                    borderBottom: activeTab === 'predict' ? '3px solid #EA580C' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                New Diagnosis
                            </button>
                            <button
                                onClick={() => setActiveTab('results')}
                                disabled={!result}
                                style={{
                                    flex: 1,
                                    padding: '20px 32px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: result ? 'pointer' : 'not-allowed',
                                    color: activeTab === 'results' ? '#EA580C' : '#6B7280',
                                    borderBottom: activeTab === 'results' ? '3px solid #EA580C' : 'none',
                                    opacity: result ? 1 : 0.5,
                                    transition: 'all 0.2s'
                                }}
                            >
                                Results
                            </button>
                        </div>

                        {/* PREDICT TAB */}
                        {activeTab === 'predict' && (
                            <div style={{ padding: '40px' }}>
                                
                                {/* PATIENT INFO */}
                                <div style={{ marginBottom: '40px' }}>
                                    <h2 style={{
                                        fontSize: '24px',
                                        fontWeight: '700',
                                        marginBottom: '24px',
                                        display: 'flex',
                                        gap: '12px',
                                        alignItems: 'center',
                                        color: '#1F2937'
                                    }}>
                                        <User size={24} />
                                        Patient Information
                                    </h2>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                        gap: '20px'
                                    }}>
                                        <input
                                            type="text"
                                            name="patientId"
                                            placeholder="Patient ID * (Required)"
                                            value={patientData.patientId}
                                            onChange={handlePatientChange}
                                            style={{
                                                padding: '16px 20px',
                                                border: '2px solid #E5E7EB',
                                                borderRadius: '12px',
                                                fontSize: '16px',
                                                transition: 'border-color 0.2s'
                                            }}
                                        />
                                        <input
                                            type="text"
                                            name="patientName"
                                            placeholder="Patient Name"
                                            value={patientData.patientName}
                                            onChange={handlePatientChange}
                                            style={{
                                                padding: '16px 20px',
                                                border: '2px solid #E5E7EB',
                                                borderRadius: '12px',
                                                fontSize: '16px',
                                                transition: 'border-color 0.2s'
                                            }}
                                        />
                                        <input
                                            type="number"
                                            name="age"
                                            placeholder="Age"
                                            value={patientData.age}
                                            onChange={handlePatientChange}
                                            min="0"
                                            max="120"
                                            style={{
                                                padding: '16px 20px',
                                                border: '2px solid #E5E7EB',
                                                borderRadius: '12px',
                                                fontSize: '16px',
                                                transition: 'border-color 0.2s'
                                            }}
                                        />
                                        <select
                                            name="gender"
                                            value={patientData.gender}
                                            onChange={handlePatientChange}
                                            style={{
                                                padding: '16px 20px',
                                                border: '2px solid #E5E7EB',
                                                borderRadius: '12px',
                                                fontSize: '16px',
                                                background: 'white',
                                                transition: 'border-color 0.2s'
                                            }}
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <input
                                            type="text"
                                            name="location"
                                            placeholder="Lesion Location (e.g., arm, face, back)"
                                            value={patientData.location}
                                            onChange={handlePatientChange}
                                            style={{
                                                padding: '16px 20px',
                                                border: '2px solid #E5E7EB',
                                                borderRadius: '12px',
                                                fontSize: '16px',
                                                transition: 'border-color 0.2s'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* IMAGE UPLOAD */}
                                <div style={{ marginBottom: '40px' }}>
                                    <h2 style={{
                                        fontSize: '24px',
                                        fontWeight: '700',
                                        marginBottom: '24px',
                                        display: 'flex',
                                        gap: '12px',
                                        alignItems: 'center',
                                        color: '#1F2937'
                                    }}>
                                        <ImageIcon size={24} />
                                        Skin Lesion Image *
                                    </h2>
                                    <div style={{
                                        border: '3px dashed #D1D5DB',
                                        borderRadius: '16px',
                                        padding: '48px',
                                        textAlign: 'center',
                                        background: '#F9FAFB',
                                        transition: 'all 0.3s'
                                    }}>
                                        {imagePreview ? (
                                            <div>
                                                <img
                                                    src={imagePreview}
                                                    alt="Skin lesion preview"
                                                    style={{
                                                        maxWidth: '400px',
                                                        maxHeight: '400px',
                                                        borderRadius: '12px',
                                                        marginBottom: '24px',
                                                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        setImageData(null);
                                                        setImagePreview(null);
                                                    }}
                                                    style={{
                                                        padding: '12px 24px',
                                                        background: '#EF4444',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    Remove Image
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <Upload size={64} color="#9CA3AF" style={{ margin: '0 auto 24px', display: 'block' }} />
                                                <p style={{ fontSize: '18px', color: '#6B7280', marginBottom: '8px' }}>
                                                    Upload a clear image of the skin lesion
                                                </p>
                                                <p style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '24px' }}>
                                                    JPG, PNG (Maximum 5MB)
                                                </p>
                                                <label style={{
                                                    padding: '16px 32px',
                                                    background: 'linear-gradient(135deg, #EA580C, #F97316)',
                                                    color: 'white',
                                                    borderRadius: '12px',
                                                    cursor: 'pointer',
                                                    display: 'inline-block',
                                                    fontWeight: '600',
                                                    fontSize: '16px',
                                                    transition: 'all 0.2s',
                                                    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)'
                                                }}>
                                                    Choose Image
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        style={{ display: 'none' }}
                                                    />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* NOTES */}
                                <div style={{ marginBottom: '40px' }}>
                                    <textarea
                                        name="notes"
                                        placeholder="Additional notes or symptoms (optional)"
                                        value={patientData.notes}
                                        onChange={handlePatientChange}
                                        rows={4}
                                        style={{
                                            width: '100%',
                                            padding: '16px 20px',
                                            border: '2px solid #E5E7EB',
                                            borderRadius: '12px',
                                            fontSize: '16px',
                                            fontFamily: 'inherit',
                                            resize: 'vertical',
                                            transition: 'border-color 0.2s'
                                        }}
                                    />
                                </div>

                                {/* ERROR MESSAGE */}
                                {error && (
                                    <div style={{
                                        padding: '20px',
                                        background: '#FEE2E2',
                                        border: '1px solid #FCA5A5',
                                        borderRadius: '12px',
                                        marginBottom: '32px',
                                        display: 'flex',
                                        gap: '12px',
                                        alignItems: 'flex-start',
                                        color: '#B91C1C'
                                    }}>
                                        <AlertCircle size={24} />
                                        <div>
                                            <strong>Error:</strong> {error}
                                        </div>
                                    </div>
                                )}

                                {/* ACTION BUTTONS */}
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading || !patientData.patientId || !imageData}
                                        style={{
                                            flex: 1,
                                            padding: '20px 32px',
                                            background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #EA580C, #F97316)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '12px',
                                            fontSize: '18px',
                                            fontWeight: '700',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            boxShadow: '0 8px 20px rgba(234, 88, 12, 0.3)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {loading ? (
                                            <>
                                                <span style={{ marginRight: '12px' }}>🔄</span>
                                                Analyzing Image...
                                            </>
                                        ) : (
                                            <>
                                                <span style={{ marginRight: '12px' }}>🔬</span>
                                                Analyze Skin Lesion
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={resetForm}
                                        style={{
                                            padding: '20px 32px',
                                            background: '#F3F4F6',
                                            color: '#374151',
                                            border: '2px solid #E5E7EB',
                                            borderRadius: '12px',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Reset Form
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* RESULTS TAB */}
                        {activeTab === 'results' && result && (
                            <div style={{ padding: '40px' }}>
                                
                                {/* MAIN RESULT CARD */}
                                <div style={{
                                    padding: '32px',
                                    borderRadius: '20px',
                                    marginBottom: '32px',
                                    border: `4px solid ${getRiskColor(getRiskLevel())}`,
                                    background: getRiskLevel() === 'HIGH' ? '#FEF2F2' : 
                                               getRiskLevel() === 'MEDIUM' ? '#FEF3C7' : '#D1FAE5'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '24px',
                                        gap: '24px'
                                    }}>
                                        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                                            {getIsCancer() ? (
                                                <AlertCircle size={56} color={getRiskColor(getRiskLevel())} />
                                            ) : (
                                                <CheckCircle size={56} color={getRiskColor(getRiskLevel())} />
                                            )}
                                            <div>
                                                <h2 style={{
                                                    fontSize: '36px',
                                                    fontWeight: '800',
                                                    color: getRiskColor(getRiskLevel()),
                                                    margin: '0 0 12px 0'
                                                }}>
                                                    {getPrediction()}
                                                </h2>
                                                <div style={{
                                                    display: 'inline-block',
                                                    padding: '8px 20px',
                                                    background: getRiskColor(getRiskLevel()),
                                                    color: 'white',
                                                    borderRadius: '24px',
                                                    fontSize: '16px',
                                                    fontWeight: '700'
                                                }}>
                                                    {getRiskLevel()} RISK
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{
                                                fontSize: '48px',
                                                fontWeight: '800',
                                                color: getRiskColor(getRiskLevel()),
                                                lineHeight: '1'
                                            }}>
                                                {getConfidence()}%
                                            </div>
                                            <div style={{ fontSize: '16px', color: '#6B7280', fontWeight: '500' }}>
                                                Confidence
                                            </div>
                                        </div>
                                    </div>

                                    {/* PATIENT INFO GRID */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                                        gap: '20px',
                                        paddingTop: '24px',
                                        borderTop: '2px solid #E5E7EB'
                                    }}>
                                        <div>
                                            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 6px 0', fontWeight: '500' }}>
                                                Patient ID
                                            </p>
                                            <p style={{ fontWeight: '700', fontSize: '18px', margin: 0 }}>
                                                {getPatientInfo('patientId')}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 6px 0', fontWeight: '500' }}>
                                                Name
                                            </p>
                                            <p style={{ fontWeight: '600', fontSize: '16px', margin: 0 }}>
                                                {getPatientInfo('patientName') || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 6px 0', fontWeight: '500' }}>
                                                Age
                                            </p>
                                            <p style={{ fontWeight: '600', fontSize: '16px', margin: 0 }}>
                                                {getPatientInfo('age') || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 6px 0', fontWeight: '500' }}>
                                                Gender
                                            </p>
                                            <p style={{ fontWeight: '600', fontSize: '16px', margin: 0 }}>
                                                {getPatientInfo('gender')}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 6px 0', fontWeight: '500' }}>
                                                Location
                                            </p>
                                            <p style={{ fontWeight: '600', fontSize: '16px', margin: 0 }}>
                                                {getPatientInfo('location') || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* RECOMMENDATION */}
                                <div style={{
                                    padding: '28px',
                                    background: getRiskLevel() === 'HIGH' ? '#FEF2F2' : 
                                               getRiskLevel() === 'MEDIUM' ? '#FEF3C7' : '#D1FAE5',
                                    border: `2px solid ${getRiskColor(getRiskLevel())}`,
                                    borderRadius: '16px',
                                    marginBottom: '32px'
                                }}>
                                    <h3 style={{
                                        fontWeight: '700',
                                        color: getRiskColor(getRiskLevel()),
                                        marginBottom: '16px',
                                        fontSize: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        Medical Recommendation:
                                    </h3>
                                    <p style={{
                                        color: '#1F2937',
                                        fontSize: '16px',
                                        lineHeight: '1.7',
                                        margin: 0
                                    }}>
                                        {getRecommendation()}
                                    </p>
                                </div>

                                {/* TOP PREDICTIONS */}
                                <div style={{ marginBottom: '32px' }}>
                                    <h3 style={{
                                        fontWeight: '700',
                                        fontSize: '22px',
                                        marginBottom: '24px',
                                        color: '#1F2937'
                                    }}>
                                        Top 3 Possible Conditions:
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {getTopPredictions().slice(0, 3).map((pred, idx) => (
                                            <div key={idx} style={{
                                                padding: '24px',
                                                background: idx === 0 ? '#FEF3C7' : '#F9FAFB',
                                                border: idx === 0 ? '3px solid #EA580C' : '2px solid #E5E7EB',
                                                borderRadius: '16px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                                    <span style={{
                                                        width: '48px',
                                                        height: '48px',
                                                        background: idx === 0 ? '#EA580C' : '#D1D5DB',
                                                        color: idx === 0 ? 'white' : '#6B7280',
                                                        borderRadius: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '18px',
                                                        fontWeight: '700'
                                                    }}>
                                                        #{idx + 1}
                                                    </span>
                                                    <span style={{
                                                        fontWeight: '700',
                                                        fontSize: '20px',
                                                        color: '#1F2937'
                                                    }}>
                                                        {pred?.class || 'N/A'}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    fontSize: '24px',
                                                    fontWeight: '800',
                                                    color: idx === 0 ? '#EA580C' : '#6B7280'
                                                }}>
                                                    {(pred?.confidence || 0).toFixed(1)}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ANALYSIS DETAILS */}
                                <div style={{
                                    padding: '28px',
                                    background: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '16px',
                                    marginBottom: '32px'
                                }}>
                                    <h3 style={{
                                        fontWeight: '700',
                                        marginBottom: '20px',
                                        color: '#1F2937',
                                        fontSize: '20px'
                                    }}>
                                        Analysis Details:
                                    </h3>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                        gap: '20px'
                                    }}>
                                        <div>
                                            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 8px 0' }}>
                                                Certainty Level
                                            </p>
                                            <p style={{ fontWeight: '700', fontSize: '18px', margin: 0 }}>
                                                {getAnalysis().certainty || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 8px 0' }}>
                                                Biopsy Required
                                            </p>
                                            <p style={{ fontWeight: '700', fontSize: '18px', margin: 0 }}>
                                                {getAnalysis().requiresBiopsy ? 'Yes' : 'No'}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 8px 0' }}>
                                                Follow-up
                                            </p>
                                            <p style={{ fontWeight: '700', fontSize: '18px', margin: 0 }}>
                                                {getAnalysis().followUp || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* DISCLAIMER */}
                                <div style={{
                                    padding: '24px',
                                    background: '#FEF3C7',
                                    border: '2px solid #FCD34D',
                                    borderRadius: '16px',
                                    marginBottom: '40px',
                                    textAlign: 'center'
                                }}>
                                    <p style={{
                                        fontSize: '15px',
                                        color: '#92400E',
                                        lineHeight: '1.6',
                                        margin: 0,
                                        fontWeight: '500'
                                    }}>
                                        ⚠️ <strong>Important Disclaimer:</strong> This AI-powered analysis is for 
                                        <strong>educational and screening purposes only</strong>. It should <strong>NOT</strong> 
                                        replace professional medical diagnosis. Always consult a qualified dermatologist 
                                        for accurate diagnosis and treatment.
                                    </p>
                                </div>

                                {/* ACTION BUTTONS */}
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <button
                                        onClick={() => setActiveTab('predict')}
                                        style={{
                                            flex: 1,
                                            padding: '20px 32px',
                                            background: 'linear-gradient(135deg, #EA580C, #F97316)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '12px',
                                            fontSize: '18px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            boxShadow: '0 8px 20px rgba(234, 88, 12, 0.3)'
                                        }}
                                    >
                                        🔬 New Analysis
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        style={{
                                            flex: 1,
                                            padding: '20px 32px',
                                            background: '#F3F4F6',
                                            color: '#374151',
                                            border: '2px solid #E5E7EB',
                                            borderRadius: '12px',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🖨️ Print Report
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default SkinCancer;