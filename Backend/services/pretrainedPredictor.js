const fs = require("fs");
const path = require("path");
const wavefile = require("wavefile");

let classifierPromise;

const getClassifier = async () => {
  if (!classifierPromise) {
    classifierPromise = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");

      env.cacheDir = path.resolve(process.cwd(), ".cache");

      return pipeline("audio-classification", "as1605/Deepfake-audio-detection-V2");
    })();
  }

  return classifierPromise;
};

const loadAudioAsFloat32 = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const wav = new wavefile.WaveFile(buffer);

  wav.toBitDepth("32f");
  wav.toSampleRate(16000);

  let audioData = wav.getSamples();

  if (Array.isArray(audioData)) {
    if (audioData.length > 1) {
      const scalingFactor = Math.sqrt(2);

      for (let index = 0; index < audioData[0].length; index += 1) {
        audioData[0][index] =
          (scalingFactor * (audioData[0][index] + audioData[1][index])) / 2;
      }
    }

    audioData = audioData[0];
  }

  return audioData;
};

const mapPrediction = (label) => {
  const normalized = String(label || "").trim().toLowerCase();

  if (normalized === "real") {
    return {
      predictionCode: "0",
      prediction: "Human voice",
    };
  }

  if (normalized === "fake") {
    return {
      predictionCode: "1",
      prediction: "AI voice",
    };
  }

  return {
    predictionCode: normalized,
    prediction: String(label || "Unknown"),
  };
};

const runPretrainedPrediction = async (filePath) => {
  const classifier = await getClassifier();
  const audioData = loadAudioAsFloat32(filePath);
  const predictions = await classifier(audioData, { top_k: 2 });
  const bestPrediction = predictions[0];

  return {
    ...mapPrediction(bestPrediction?.label),
    confidence: String(bestPrediction?.score ?? ""),
    rawPredictions: predictions,
  };
};

module.exports = {
  runPretrainedPrediction,
};
