import os
import sys


def main():
    file_path = sys.argv[1] if len(sys.argv) > 1 else None

    if not file_path or not os.path.exists(file_path):
        raise FileNotFoundError("Input audio file not found.")

    model_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pretrained_voice_model")

    if not os.path.exists(model_dir):
        raise RuntimeError(
            "Pretrained model files are missing. Put the exported model inside "
            "Backend/python/pretrained_voice_model before using the pretrained option."
        )

    # Placeholder entry point for a stronger production model.
    # Replace this block with real pretrained inference once the model runtime
    # and weights are available on the machine.
    raise RuntimeError(
        "Pretrained inference is scaffolded but not activated yet. "
        "Install the required runtime and exported weights, then update predict_pretrained.py."
    )


if __name__ == "__main__":
    main()
