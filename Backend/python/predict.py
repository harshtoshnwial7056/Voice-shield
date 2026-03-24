import sys
import joblib
import numpy as np
import librosa

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "voice_model.pkl")

SAMPLE_RATE = 22050
MFCC_FEATURES = 40

def extract_mfcc(file_path):
    audio, sr = librosa.load(file_path, sr=SAMPLE_RATE, duration=3)
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=MFCC_FEATURES)
    return np.mean(mfcc.T, axis=0)

model = joblib.load(MODEL_PATH)

file_path = sys.argv[1]

features = extract_mfcc(file_path)
features = np.array(features).reshape(1, -1)

prediction = model.predict(features)[0]

if hasattr(model, "predict_proba"):
    confidence = np.max(model.predict_proba(features))
else:
    confidence = 0.85

print(f"{prediction},{round(confidence, 2)}")