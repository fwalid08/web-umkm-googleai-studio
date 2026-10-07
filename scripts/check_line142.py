with open('/home/fwalid08/Projects/my_projects/web-umkm-googleai-studio/src/lib/builder/templates/retail-marketplace/sections.ts', 'rb') as f:
    data = f.read()
lines = data.split(b'\n')
print('Line 142 (0-indexed 141):')
print(repr(lines[141]))