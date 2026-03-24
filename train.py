import os
import sys
import librosa
import joblib
import numpy as np
import pandas as pd
from tqdm import tqdm
from datetime import datetime

from sklearn.model_selection import train_test_split
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.metrics import confusion_matrix
from sklearn.metrics import accuracy_score


# ======================================================
# CONFIGURATION
# ======================================================
# ======================================================
# CONFIGURATION
# ======================================================

DATASET_PATH = "sampel data set"

HUMAN_FOLDER = "human.wav"
AI_FOLDER = "AI.wav"

MODEL_OUTPUT = "model/voice_model.pkl"

SAMPLE_RATE = 22050
AUDIO_DURATION = 3
MFCC_FEATURES = 40

TEST_SPLIT = 0.2
RANDOM_STATE = 42


# ======================================================
# LOGGING
# ======================================================

def log(message):

    now = datetime.now().strftime("%H:%M:%S")

    print(f"[{now}] {message}")


# ======================================================
# FILE VALIDATION
# ======================================================

def validate_audio_file(path):

    if not os.path.exists(path):
        return False

    if not path.endswith(".wav"):
        return False

    return True


# ======================================================
# FEATURE EXTRACTION
# ======================================================

def extract_mfcc(file_path):

    try:

        audio, sr = librosa.load(
            file_path,
            sr=SAMPLE_RATE,
            duration=AUDIO_DURATION
        )

        mfcc = librosa.feature.mfcc(
            y=audio,
            sr=sr,
            n_mfcc=MFCC_FEATURES
        )

        mfcc_mean = np.mean(mfcc.T, axis=0)

        return mfcc_mean

    except Exception as e:

        log(f"Error processing {file_path}")

        return None


# ======================================================
# DATASET LOADER
# ======================================================

def load_audio_folder(folder_path, label):

    features = []
    labels = []

    files = os.listdir(folder_path)

    log(f"Loading {len(files)} files from {folder_path}")

    for file in tqdm(files):

        path = os.path.join(folder_path, file)

        if not validate_audio_file(path):
            continue

        feature = extract_mfcc(path)

        if feature is None:
            continue

        features.append(feature)
        labels.append(label)

    return features, labels


# ======================================================
# DATASET STATISTICS
# ======================================================

def dataset_statistics(labels):

    total = len(labels)

    human = labels.count(0)
    ai = labels.count(1)

    log("Dataset Statistics")

    print("Total samples:", total)
    print("Human voices:", human)
    print("AI voices:", ai)

    human_ratio = human / total
    ai_ratio = ai / total

    print("Human ratio:", human_ratio)
    print("AI ratio:", ai_ratio)


# ======================================================
# DATASET LOADING
# ======================================================

def load_dataset():

    human_path = os.path.join(DATASET_PATH, HUMAN_FOLDER)
    ai_path = os.path.join(DATASET_PATH, AI_FOLDER)

    human_features, human_labels = load_audio_folder(
        human_path,
        0
    )

    ai_features, ai_labels = load_audio_folder(
        ai_path,
        1
    )

    features = human_features + ai_features
    labels = human_labels + ai_labels

    dataset_statistics(labels)

    X = np.array(features)
    y = np.array(labels)

    return X, y


# ======================================================
# MODEL BUILDER
# ======================================================

def build_model():

    log("Initializing RandomForest model")

    model = RandomForestClassifier(

        n_estimators=200,

        max_depth=None,

        random_state=RANDOM_STATE,

        n_jobs=-1

    )

    return model


# ======================================================
# CROSS VALIDATION
# ======================================================

def run_cross_validation(model, X, y):

    log("Running cross validation")

    scores = cross_val_score(

        model,

        X,

        y,

        cv=5

    )

    print("Cross validation scores:", scores)

    print("Average CV accuracy:", scores.mean())


# ======================================================
# TRAINING
# ======================================================

def train_model(model, X_train, y_train):

    log("Training model")

    model.fit(

        X_train,

        y_train

    )

    log("Training completed")

    return model


# ======================================================
# EVALUATION
# ======================================================

def evaluate_model(model, X_test, y_test):

    log("Evaluating model")

    predictions = model.predict(

        X_test

    )

    accuracy = accuracy_score(

        y_test,

        predictions

    )

    print("Accuracy:", accuracy)

    print("\nClassification Report\n")

    print(

        classification_report(

            y_test,

            predictions

        )

    )

    print("\nConfusion Matrix\n")

    print(

        confusion_matrix(

            y_test,

            predictions

        )

    )


# ======================================================
# SAVE MODEL
# ======================================================

def save_model(model):

    if not os.path.exists("model"):

        os.makedirs("model")

    joblib.dump(

        model,

        MODEL_OUTPUT

    )

    log(f"Model saved to {MODEL_OUTPUT}")


# ======================================================
# MAIN PIPELINE
# ======================================================

def main():

    log("VoiceShield Training Pipeline Started")

    X, y = load_dataset()

    log("Splitting dataset")

    X_train, X_test, y_train, y_test = train_test_split(

        X,

        y,

        test_size=TEST_SPLIT,

        random_state=RANDOM_STATE

    )

    model = build_model()

    run_cross_validation(

        model,

        X_train,

        y_train

    )

    model = train_model(

        model,

        X_train,

        y_train

    )

    evaluate_model(

        model,

        X_test,

        y_test

    )

    save_model(

        model

    )

    log("Training pipeline finished successfully")


# ======================================================
# ENTRY POINT
# ======================================================

if __name__ == "__main__":

    main()