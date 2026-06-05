import os
import sys

# Ensure UTF-8 output or fallback
evidences_dir = r"d:\APIIT\Enterprise-Cloud-2\Evidences"
image_extensions = (".png", ".jpg", ".jpeg")

print("Grouped list of actual screenshots in Evidences/ folder:")
for root, dirs, files in os.walk(evidences_dir):
    images = [f for f in files if f.lower().endswith(image_extensions)]
    if images:
        rel_dir = os.path.relpath(root, evidences_dir)
        print(f"\nDirectory: Evidences\\{rel_dir}")
        for img in sorted(images):
            print(f"  +- {img}")
