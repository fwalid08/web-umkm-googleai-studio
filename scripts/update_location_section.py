import sys

path = "/home/fwalid08/Projects/my_projects/web-umkm-googleai-studio/src/lib/builder/templates/retail-marketplace/sections.ts"

with open(path, "r") as f:
    content = f.read()

old = '''  if (spec.special === "location") return layout === 1
    ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:20px;align-items:center;"><div style="${ACCENT}font-size:1.1rem;color:var(--color-primary);">${"{{title"}}<h2 style="${HEADING}font-size:1.9rem;color:var(--color-text);margin:10px 0;">Datang dan lihat langsung</h2></div><div style="background:var(--color-surface);padding:20px;border-radius:12px;${BODY}color:var(--color-text);">{{address}}<br /><strong>{{hours}}</strong><p style="color:var(--color-text-muted);">{{note}}</p></div></div>`
    : `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:18px;"><span style="color:var(--color-primary);">LOCAL STORE</span><div style="flex:1;min-width:220px;"><h2 style="${HEADING}font-size:1.8rem;color:var(--color-text);margin:0 0 8px 0;">{{title}}</h2><p style="${BODY}color:var(--color-text-muted);">{{address}} · {{hours}}</p><p style="${BODY}color:var(--color-text-muted);">{{note}}</p></div>${""}</div>`;'''

new = '''  if (spec.special === "location") {
    if (layout === 0) {
      return `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:18px;"><span style="color:var(--color-primary);${BODY}font-weight:800;">LOCAL STORE</span><div style="flex:1;min-width:220px;"><h2 style="${HEADING}font-size:1.8rem;color:var(--color-text);margin:0 0 8px 0;">{{title}}</h2><p style="${BODY}color:var(--color-text-muted);">{{address}} · {{hours}}</p><p style="${BODY}color:var(--color-text-muted);">{{note}}</p></div></div>`;
    }
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:20px;align-items:center;"><div style="${ACCENT}font-size:1.1rem;color:var(--color-primary);"><h2 style="${HEADING}font-size:1.9rem;color:var(--color-text);margin:10px 0;">Datang dan lihat langsung</h2></div><div style="background:var(--color-surface);padding:20px;border-radius:12px;${BODY}color:var(--color-text);">{{address}}<br /><strong>{{hours}}</strong><p style="color:var(--color-text-muted);">{{note}}</p></div></div>`;
  }'''

if old in content:
    content = content.replace(old, new)
    with open(path, "w") as f:
        f.write(content)
    print("Done!")
else:
    print("Not found")
    # Print lines around location
    lines = content.split("\n")
    for i, line in enumerate(lines):
        if "location" in line:
            print(f"Line {i+1}: {line}")