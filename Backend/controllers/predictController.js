const cloudinary = require("../Config/cloudinary");
const Result = require("../models/Result");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { runPretrainedPrediction } = require("../services/pretrainedPredictor");

const MODEL_CONFIG = {
  custom: {
    label: "Custom model",
    script: "../python/predict.py",
  },
  pretrained: {
    label: "Pretrained model",
  },
};

const formatPredictionLabel = (value) => {
  const normalized = String(value).trim().toLowerCase();

  if (normalized === "0") {
    return "Human voice";
  }

  if (normalized === "1") {
    return "AI voice";
  }

  return String(value).trim();
};

const getModelConfig = (requestedModelType) => {
  const normalized = String(requestedModelType || "pretrained").trim().toLowerCase();
  return {
    modelType: MODEL_CONFIG[normalized] ? normalized : "pretrained",
    config: MODEL_CONFIG[normalized] || MODEL_CONFIG.pretrained,
  };
};

const resolvePythonCommand = () => {
  if (process.env.PYTHON_COMMAND) {
    return process.env.PYTHON_COMMAND;
  }

  return process.platform === "win32" ? "py" : "python3";
};
const removeFileIfExists = (filePath) => {
  if (!filePath || !fs.existsSync(filePath)) {
    return;
  }

  fs.unlinkSync(filePath);
};

exports.predictVoice = async (req, res) => {
  let newPath;

  try {
    // ✅ Check file
    if (!req.file) {
      return res.status(400).json({ message: "No audio uploaded" });
    }

    const { modelType, config: modelConfig } = getModelConfig(req.body.modelType);
    const localPath = req.file.path;

    // ✅ Rename file to .wav (IMPORTANT FIX)
    newPath = localPath + ".wav";
    fs.renameSync(localPath, newPath);

    // ✅ Upload to Cloudinary
    const uploadRes = await cloudinary.uploader.upload(newPath, {
      resource_type: "auto",
      folder: "voiceshield",
    });

    const audioUrl = uploadRes.secure_url;

    console.log("Model Type:", modelConfig.label);
    const finalizeResponse = async ({ predictionCode, prediction, confidence }) => {
      const predictionLabel = formatPredictionLabel(prediction ?? predictionCode);

      const savedResult = await Result.create({
        userId: req.user.id,
        audioUrl,
        prediction: predictionLabel,
        confidence,
        modelType,
        modelLabel: modelConfig.label,
        originalFilename: req.file.originalname,
      });

      res.json({
        _id: savedResult._id,
        prediction: predictionLabel,
        predictionCode,
        confidence,
        audioUrl,
        modelType: savedResult.modelType,
        modelLabel: savedResult.modelLabel,
        originalFilename: savedResult.originalFilename,
        createdAt: savedResult.createdAt,
      });
    };

    if (modelType === "pretrained") {
      const pretrainedResult = await runPretrainedPrediction(newPath);
      await finalizeResponse(pretrainedResult);
      removeFileIfExists(newPath);
      return;
    }

    const pythonPath = path.resolve(__dirname, modelConfig.script);

    console.log("Python Path:", pythonPath);
    console.log("Audio Path:", newPath);

    exec(`"${resolvePythonCommand()}" "${pythonPath}" "${newPath}"`, async (err, stdout, stderr) => {
      if (err) {
        console.error("Python Error:", err);
        console.error("STDERR:", stderr);
        removeFileIfExists(newPath);
        return res.status(500).json({ error: "Prediction failed" });
      }

      try {
        console.log("Python Output:", stdout);

        const [predictionCode, confidence] = stdout.trim().split(",");
        await finalizeResponse({
          predictionCode,
          confidence,
        });
      } catch (error) {
        console.error("Finalize Response Error:", error);
        return res.status(500).json({ error: error.message || "Prediction failed" });
      } finally {
        removeFileIfExists(newPath);
      }
    });

  } catch (error) {
    console.error("Server Error:", error);
    removeFileIfExists(newPath);
    res.status(500).json({ error: error.message });
  }
};

exports.getPredictionHistory = async (req, res) => {
  try {
    const results = await Result.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(results);
  } catch (error) {
    console.error("History Error:", error);
    res.status(500).json({ error: "Unable to load prediction history." });
  }
};
