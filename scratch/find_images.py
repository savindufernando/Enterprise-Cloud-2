import os

workspace = r"d:\APIIT\Enterprise-Cloud-2"
image_extensions = (".png", ".jpg", ".jpeg", ".gif")

print("Searching for images in workspace...")
found = []
for root, dirs, files in os.walk(workspace):
    # Skip node_modules and .git
    if "node_modules" in root or ".git" in root:
        continue
    for file in files:
        if file.lower().endswith(image_extensions):
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, workspace)
            found.append(rel_path)

print(f"Found {len(found)} images:")
for p in sorted(found):
    if "jaeger" in p.lower() or "trace" in p.lower() or "observability" in p.lower():
        print(f"[MATCH] {p}")
    else:
        print(p)
