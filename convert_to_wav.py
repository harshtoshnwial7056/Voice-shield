import os
import librosa
import soundfile as sf
from tqdm import tqdm

INPUT_FOLDER = "audios"
OUTPUT_FOLDER = "audio_wav"

# create output folder if not exists
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

supported_formats = (".mp3", ".wav", ".m4a", ".flac", ".ogg")

files = os.listdir(INPUT_FOLDER)

print("Total files found:", len(files))

for file in tqdm(files):

    if file.lower().endswith(supported_formats):

        input_path = os.path.join(INPUT_FOLDER, file)

        filename = os.path.splitext(file)[0] + ".wav"

        output_path = os.path.join(OUTPUT_FOLDER, filename)

        try:
            audio, sr = librosa.load(input_path, sr=16000, mono=True)

            sf.write(output_path, audio, 16000)

        except Exception as e:
            print("Error processing:", file)

print("Conversion completed successfully!")