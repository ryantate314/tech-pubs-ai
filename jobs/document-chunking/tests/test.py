import sys
from pathlib import Path

# Add parent directory to path so we can import main
sys.path.insert(0, str(Path(__file__).parent.parent))

import main

def test_large_file(path):
  print("running test on " + path)
  analysis = main.analyze_pdf(path)
  chunks = main.extract_text_chunks_by_chapter(path, analysis)
  for index, chunk in enumerate(chunks):
    print(f"Chunk {index}")
    print(chunk)



if __name__ == "__main__":
  if len(sys.argv) < 2:
    print("Usage: uv run test.py {filename}")
    exit(1)

  test_large_file(sys.argv[1])