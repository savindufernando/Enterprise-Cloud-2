"""AeroLink Enterprise Platform - Ultimate Packaging Script.

This script recursively builds a clean, highly optimized ZIP archive of the
AeroLink platform for university Blackboard submission. It strictly filters
out heavyweight local dependencies, test caches, coverage data, and python
byte-code folders while preserving the complete source, config, and premium HTML docs.
"""

import os
import zipfile
import sys

# Define absolute exclude patterns (directory names and extensions)
EXCLUDE_DIRS = {
    ".git",
    ".github",
    ".pytest_cache",
    "node_modules",
    "__pycache__",
    "htmlcov",
    ".claude",
    ".gemini"
}

EXCLUDE_FILES = {
    ".coverage",
    ".DS_Store",
    "COMP60010_AeroLink_Submission.zip"
}

EXCLUDE_EXTENSIONS = {
    ".pyc",
    ".pyo",
    ".pyd",
    ".log"
}

def build_zip(source_dir, output_zip_path):
    print("======================================================================")
    print("       AEROLINK ENTERPRISE SOURCE PACKAGER & ZIP BUILDER")
    print("======================================================================")
    print(f"Source Directory: {os.path.abspath(source_dir)}")
    print(f"Output ZIP Path:  {os.path.abspath(output_zip_path)}")
    print("----------------------------------------------------------------------")
    print("Scanning and filtering files...")

    total_files_packed = 0
    total_bytes_packed = 0

    with zipfile.ZipFile(output_zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for root, dirs, files in os.walk(source_dir):
            # Prune excluded directories in-place so os.walk doesn't traverse them
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]

            for file in files:
                # Filter file names and extensions
                if file in EXCLUDE_FILES or file.startswith("."):
                    continue
                
                _, ext = os.path.splitext(file)
                if ext.lower() in EXCLUDE_EXTENSIONS:
                    continue

                full_path = os.path.join(root, file)
                # Compute relative path for ZIP entry
                rel_path = os.path.relpath(full_path, source_dir)

                # Skip output zip if it lies in walk path
                if os.path.abspath(full_path) == os.path.abspath(output_zip_path):
                    continue

                file_size = os.path.getsize(full_path)
                zip_file.write(full_path, rel_path)
                
                total_files_packed += 1
                total_bytes_packed += file_size

    print("----------------------------------------------------------------------")
    print("SUCCESS: Packaging process completed successfully!")
    print(f"Packed Files Count:  {total_files_packed}")
    print(f"Uncompressed Volume: {total_bytes_packed / (1024*1024):.2f} MB")
    print(f"Compressed Archive:  {os.path.getsize(output_zip_path) / (1024*1024):.2f} MB")
    print("======================================================================")

if __name__ == "__main__":
    src = "."
    out = "COMP60010_AeroLink_Submission.zip"
    build_zip(src, out)
