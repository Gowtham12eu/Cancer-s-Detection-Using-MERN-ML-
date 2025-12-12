// server/server.js - COMPLETE WORKING VERSION
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// ==================== MIDDLEWARE ====================
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==================== MONGODB CONNECTION ====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cancer_detection';

mongoose.set('strictQuery', false);
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err));

// ==================== SCHEMAS ====================

// Breast Cancer Schema
const BreastCancerSchema = new mongoose.Schema({
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, default: '' },
    age: { type: Number, default: null },
    gender: { type: String, default: 'Male' },
    notes: { type: String, default: '' },
    cellFeatures: [{ type: Number, required: true }],
    prediction: { type: String, required: true },
    diagnosis: { type: String, required: true },
    confidence: { type: Number, required: true },
    riskLevel: { type: String, required: true },
    recommendation: { type: String, default: '' },
    highRiskFeatures: [String],
    timestamp: { type: String, default: '' }
}, { timestamps: true, collection: 'breastpredictions' });

// Skin Cancer Schema
const SkinPredictionSchema = new mongoose.Schema({
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, default: '' },
    age: { type: Number, default: null },
    gender: { type: String, default: 'Male' },
    location: { type: String, default: '' },
    notes: { type: String, default: '' },
    imageData: { type: String, required: true },
    prediction: { type: String, required: true },
    confidence: { type: Number, required: true },
    isCancer: { type: Boolean, required: true },
    riskLevel: { type: String, required: true },
    riskColor: { type: String, default: '' },
    recommendation: { type: String, default: '' },
    topPredictions: [{
        class: String,
        probability: Number,
        confidence: Number
    }],
    analysis: {
        certainty: { type: String, default: '' },
        requiresBiopsy: { type: Boolean, default: false },
        followUp: { type: String, default: '' },
        timestamp: { type: String, default: '' }
    },
    additionalInfo: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true, collection: 'skinpredictions' });

const BreastCancerPrediction = mongoose.model('BreastCancerPrediction', BreastCancerSchema);
const SkinPrediction = mongoose.model('SkinPrediction', SkinPredictionSchema);

// ==================== ROUTES ====================

// Root route
app.get('/', async (req, res) => {
    try {
        const breastCount = await BreastCancerPrediction.countDocuments();
        const skinCount = await SkinPrediction.countDocuments();
        
        res.json({
            success: true,
            message: 'Cancer Detection API ✅',
            status: 'RUNNING',
            statistics: {
                breastCancer: breastCount,
                skinCancer: skinCount,
                total: breastCount + skinCount
            },
            endpoints: {
                breast: 'POST /api/breast/predict',
                skin: 'POST /api/skin/predict',
                debug: 'GET /api/debug'
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== BREAST CANCER PREDICTION ====================
app.post('/api/breast/predict', async (req, res) => {
    try {
        console.log('\n🔬 BREAST CANCER PREDICTION');
        console.log('Patient ID:', req.body.patientId);

        const { patientId, patientName, age, gender, notes, cellFeatures } = req.body;

        // Validation
        if (!patientId?.trim()) {
            return res.status(400).json({ success: false, message: 'Patient ID required' });
        }

        if (!cellFeatures || cellFeatures.length !== 30) {
            return res.status(400).json({ success: false, message: '30 features required' });
        }

        console.log('⏳ Calling Flask (port 5001)...');

        // Call Flask
        const mlResponse = await axios.post('http://localhost:5001/api/predict', {
            patientId: patientId.trim(),
            patientName: patientName?.trim() || '',
            age: age ? parseInt(age) : null,
            gender: gender || 'Male',
            notes: notes?.trim() || '',
            cellFeatures: cellFeatures
        }, {
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' }
        });

        const mlResult = mlResponse.data;
        console.log('✅ Flask response received');

        // Save to MongoDB
        const patientData = {
            patientId: patientId.trim(),
            patientName: patientName?.trim() || '',
            age: age ? parseInt(age) : null,
            gender: gender || 'Male',
            notes: notes?.trim() || '',
            cellFeatures: cellFeatures,
            prediction: mlResult.result.prediction,
            diagnosis: mlResult.result.diagnosis,
            confidence: mlResult.result.confidence,
            riskLevel: mlResult.result.riskLevel,
            recommendation: mlResult.result.recommendation || '',
            highRiskFeatures: mlResult.result.highRiskFeatures || [],
            timestamp: mlResult.timestamp
        };

        console.log('💾 Saving to MongoDB...');
        const savedPatient = await BreastCancerPrediction.create(patientData);
        console.log('✅ SAVED:', savedPatient.patientId, '| DB ID:', savedPatient._id);

        // Response to frontend
        res.status(200).json({
            success: true,
            message: 'Prediction saved successfully',
            savedToDatabase: true,
            databaseId: savedPatient._id,
            patient: {
                patientId: savedPatient.patientId,
                patientName: savedPatient.patientName,
                age: savedPatient.age,
                gender: savedPatient.gender,
                notes: savedPatient.notes
            },
            result: {
                prediction: savedPatient.prediction,
                diagnosis: savedPatient.diagnosis,
                confidence: savedPatient.confidence,
                riskLevel: savedPatient.riskLevel,
                recommendation: savedPatient.recommendation,
                highRiskFeatures: savedPatient.highRiskFeatures
            },
            timestamp: savedPatient.timestamp,
            testDate: savedPatient.createdAt
        });

        console.log(`✅ Result: ${savedPatient.prediction} (${savedPatient.confidence}%)\n`);

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                message: 'Flask server not running on port 5001'
            });
        }

        if (error.response) {
            return res.status(502).json({
                success: false,
                message: error.response.data?.message || 'Flask error'
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
});

// ==================== SKIN CANCER PREDICTION ====================
app.post('/api/skin/predict', async (req, res) => {
    try {
        console.log('\n🔬 SKIN CANCER PREDICTION');
        console.log('Patient ID:', req.body.patientId);

        const { patientId, patientName, age, gender, location, notes, image } = req.body;

        if (!patientId?.trim()) {
            return res.status(400).json({ success: false, error: 'Patient ID required' });
        }

        if (!image) {
            return res.status(400).json({ success: false, error: 'Image required' });
        }

        console.log('⏳ Calling Flask (port 5002)...');

        const mlResponse = await axios.post('http://localhost:5002/predict', {
            patient_id: patientId.trim(),
            patient_name: patientName?.trim() || '',
            age: age ? parseInt(age) : null,
            gender: gender || 'Male',
            location: location?.trim() || '',
            notes: notes?.trim() || '',
            image: image
        }, {
            timeout: 90000,
            headers: { 'Content-Type': 'application/json' }
        });

        const mlResult = mlResponse.data;
        console.log('✅ Flask response received');

        if (!mlResult.success) {
            throw new Error(mlResult.message || 'ML prediction failed');
        }

        const patientData = {
            patientId: patientId.trim(),
            patientName: patientName?.trim() || '',
            age: age ? parseInt(age) : null,
            gender: gender || 'Male',
            location: location?.trim() || '',
            notes: notes?.trim() || '',
            imageData: image,
            prediction: mlResult.prediction,
            confidence: mlResult.confidence,
            isCancer: mlResult.is_cancer,
            riskLevel: mlResult.risk_level,
            riskColor: mlResult.risk_color || '',
            recommendation: mlResult.recommendation || '',
            topPredictions: mlResult.top_predictions || [],
            analysis: {
                certainty: mlResult.analysis?.certainty || '',
                requiresBiopsy: mlResult.analysis?.requires_biopsy || false,
                followUp: mlResult.analysis?.follow_up || '',
                timestamp: mlResult.analysis?.timestamp || new Date().toISOString()
            },
            additionalInfo: mlResult.additional_info || {}
        };

        console.log('💾 Saving to MongoDB...');
        const savedPatient = await SkinPrediction.create(patientData);
        console.log('✅ SAVED:', savedPatient.patientId, '| DB ID:', savedPatient._id);

        res.status(200).json({
            success: true,
            message: 'Prediction saved successfully',
            savedToDatabase: true,
            databaseId: savedPatient._id,
            patient: {
                patientId: savedPatient.patientId,
                patientName: savedPatient.patientName,
                age: savedPatient.age,
                gender: savedPatient.gender,
                location: savedPatient.location
            },
            result: {
                prediction: savedPatient.prediction,
                confidence: savedPatient.confidence,
                isCancer: savedPatient.isCancer,
                riskLevel: savedPatient.riskLevel,
                riskColor: savedPatient.riskColor,
                recommendation: savedPatient.recommendation,
                topPredictions: savedPatient.topPredictions
            },
            analysis: savedPatient.analysis,
            testDate: savedPatient.createdAt
        });

        console.log(`✅ Result: ${savedPatient.prediction} (${savedPatient.confidence}%)\n`);

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'Flask server not running on port 5002'
            });
        }

        if (error.response) {
            return res.status(502).json({
                success: false,
                error: 'ML Service Error'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
});

// ==================== GET PATIENTS ====================
app.get('/api/breast/patients', async (req, res) => {
    try {
        const patients = await BreastCancerPrediction.find()
            .select('-cellFeatures -__v')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ success: true, count: patients.length, patients });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/skin/patients', async (req, res) => {
    try {
        const patients = await SkinPrediction.find()
            .select('-imageData -__v')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ success: true, count: patients.length, patients });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== DEBUG ====================
app.get('/api/debug', async (req, res) => {
    try {
        const breastCount = await BreastCancerPrediction.countDocuments();
        const skinCount = await SkinPrediction.countDocuments();
        
        const recentBreast = await BreastCancerPrediction.find()
            .select('patientId prediction confidence createdAt')
            .sort({ createdAt: -1 })
            .limit(5);
            
        const recentSkin = await SkinPrediction.find()
            .select('patientId prediction confidence createdAt')
            .sort({ createdAt: -1 })
            .limit(5);
        
        res.json({
            success: true,
            statistics: { breastCancer: breastCount, skinCancer: skinCount },
            recentBreast,
            recentSkin
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 CANCER DETECTION API - RUNNING');
    console.log('='.repeat(70));
    console.log(`✅ Express:    http://localhost:${PORT}`);
    console.log(`✅ MongoDB:    ${MONGODB_URI}`);
    console.log(`✅ Breast ML:  http://localhost:5001`);
    console.log(`✅ Skin ML:    http://localhost:5002`);
    console.log('='.repeat(70));
    console.log('📡 Endpoints:');
    console.log('   POST /api/breast/predict');
    console.log('   POST /api/skin/predict');
    console.log('   GET  /api/debug');
    console.log('='.repeat(70) + '\n');
});

process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down...');
    await mongoose.connection.close();
    process.exit(0);
});