# cancer_detection_ml.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import pickle
import warnings
warnings.filterwarnings('ignore')

print("="*60)
print("CANCER DETECTION - ML MODEL TRAINING")
print("="*60)

from sklearn.datasets import load_breast_cancer

data = load_breast_cancer()
X = pd.DataFrame(data.data, columns=data.feature_names)
y = pd.Series(data.target)

print(f"\n✓ Dataset Loaded!")
print(f"  - Total Patients: {len(X)}")
print(f"  - Features: {X.shape[1]}")
print(f"  - Cancer: {sum(y == 0)}")
print(f"  - No Cancer: {sum(y == 1)}")

print(f"\n✓ 30 Cell Features:")
print("-" * 60)
for i, feature in enumerate(data.feature_names, 1):
    print(f"  {i:2d}. {feature}")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"\n✓ Training: {len(X_train)}, Testing: {len(X_test)}")

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print(f"✓ Features normalized")

print(f"\n⏳ Training model...")

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    max_depth=10,
    min_samples_split=5
)

model.fit(X_train_scaled, y_train)
print(f"✓ Training complete!")

y_pred = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)

print(f"\n{'='*60}")
print(f"RESULTS")
print(f"{'='*60}")
print(f"\n✓ Accuracy: {accuracy * 100:.2f}%")

cm = confusion_matrix(y_test, y_pred)
print(f"\n✓ Confusion Matrix:")
print(f"                 Predicted")
print(f"                Cancer  No Cancer")
print(f"Actual Cancer      {cm[0][0]:3d}      {cm[0][1]:3d}")
print(f"       No Cancer   {cm[1][0]:3d}      {cm[1][1]:3d}")

print(f"\n✓ Top 10 Important Features:")
feature_importance = pd.DataFrame({
    'feature': data.feature_names,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

for i, row in feature_importance.head(10).iterrows():
    print(f"  {row['feature']:30s}: {row['importance']*100:5.2f}%")

print(f"\n⏳ Saving files...")
pickle.dump(model, open('cancer_model.pkl', 'wb'))
pickle.dump(scaler, open('scaler.pkl', 'wb'))
pickle.dump(data.feature_names, open('feature_names.pkl', 'wb'))

print(f"✓ cancer_model.pkl - saved")
print(f"✓ scaler.pkl - saved")
print(f"✓ feature_names.pkl - saved")

print(f"\n{'='*60}")
print(f"TRAINING COMPLETE!")
print(f"{'='*60}\n")