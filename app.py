# app.py - Breast Cancer Detection Backend
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import sys
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

app = Flask(__name__)
CORS(app)

print("="*60, flush=True)
print("Loading model files...", flush=True)
print("="*60, flush=True)

try:
    model = pickle.load(open('cancer_model.pkl', 'rb'))
    scaler = pickle.load(open('scaler.pkl', 'rb'))
    feature_names = pickle.load(open('feature_names.pkl', 'rb'))
    print("✓ Model loaded successfully!", flush=True)
except Exception as e:
    print(f"ERROR loading model: {e}", flush=True)
    sys.exit(1)

@app.route('/')
def home():
    return jsonify({
        'message': 'Breast Cancer Detection API',
        'status': 'Running',
        'version': '1.0',
        'port': 5001
    })

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        print("\n" + "="*60, flush=True)
        print("NEW PREDICTION REQUEST", flush=True)
        print("="*60, flush=True)
        
        data = request.get_json()
        
        # Extract data
        patient_id = data.get('patientId', 'Unknown')
        patient_name = data.get('patientName', '')
        age = data.get('age')
        gender = data.get('gender', '')
        notes = data.get('notes', '')
        cell_features = data.get('cellFeatures', [])
        
        print(f"Patient ID: {patient_id}", flush=True)
        print(f"Features count: {len(cell_features)}", flush=True)
        
        # Validate features
        if len(cell_features) != 30:
            return jsonify({
                'success': False,
                'message': f'Expected 30 features, got {len(cell_features)}'
            }), 400
        
        # Convert to numpy array
        features_array = np.array(cell_features).reshape(1, -1)
        
        # Scale features
        features_scaled = scaler.transform(features_array)
        
        # Make prediction
        prediction = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0]
        
        # 0 = Malignant (Cancer), 1 = Benign (No Cancer)
        is_cancer = (prediction == 0)
        confidence = float(probabilities[0] if is_cancer else probabilities[1])
        
        # Identify high-risk features
        high_risk_features = []
        thresholds = {
            0: 14.0,   # mean radius
            20: 16.0,  # worst radius
            23: 880.0, # worst area
            26: 0.25   # worst concavity
        }
        
        for idx, threshold in thresholds.items():
            if cell_features[idx] > threshold:
                high_risk_features.append(feature_names[idx])
        
        # Prepare response
        result = {
            'prediction': 'CANCER DETECTED' if is_cancer else 'NO CANCER DETECTED',
            'diagnosis': 'Malignant' if is_cancer else 'Benign',
            'confidence': round(confidence * 100, 2),
            'riskLevel': 'High' if is_cancer else 'Low',
            'highRiskFeatures': high_risk_features,
            'recommendation': (
                '⚠️ URGENT: Immediate consultation with oncologist recommended. Further diagnostic tests required.'
                if is_cancer else
                '✓ Results appear normal. Continue regular screening as recommended by healthcare provider.'
            )
        }
        
        response = {
            'patient': {
                'patientId': patient_id,
                'patientName': patient_name,
                'age': age,
                'gender': gender,
                'notes': notes
            },
            'result': result,
            'timestamp': datetime.now().isoformat()
        }
        
        print(f"Prediction: {result['prediction']}", flush=True)
        print(f"Confidence: {result['confidence']}%", flush=True)
        print("="*60 + "\n", flush=True)
        
        return jsonify(response), 200
        
    except ValueError as ve:
        print(f"Validation Error: {ve}", flush=True)
        return jsonify({
            'success': False,
            'message': 'Invalid input data. Please check all fields.'
        }), 400
        
    except Exception as e:
        print(f"ERROR: {e}", flush=True)
        return jsonify({
            'success': False,
            'message': f'Prediction failed: {str(e)}'
        }), 500

if __name__ == '__main__':
    print("\n" + "="*60, flush=True)
    print("BREAST CANCER DETECTION API", flush=True)
    print("="*60, flush=True)
    print("✓ Server: http://localhost:5001", flush=True)
    print("✓ Endpoint: POST /api/predict", flush=True)
    print("="*60 + "\n", flush=True)
    
    app.run(debug=True, port=5001, host='0.0.0.0', use_reloader=False)