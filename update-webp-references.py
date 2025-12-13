#!/usr/bin/env python3
"""
HTML ve JSON dosyalarındaki JPEG referanslarını WebP'ye günceller.
"""

import json
import re
from pathlib import Path

def update_json_file(json_path):
    """JSON dosyasındaki JPEG referanslarını WebP'ye günceller."""
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    updated = False
    if 'photos' in data:
        for photo in data['photos']:
            if 'filename' in photo:
                old_filename = photo['filename']
                # JPEG uzantılarını WebP'ye çevir
                new_filename = re.sub(
                    r'\.(jpg|jpeg|JPG|JPEG)$',
                    '.webp',
                    old_filename,
                    flags=re.IGNORECASE
                )
                if new_filename != old_filename:
                    photo['filename'] = new_filename
                    updated = True
                    print(f"  {old_filename} → {new_filename}")
    
    if updated:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    return False

def update_html_file(html_path):
    """HTML dosyasındaki JPEG referanslarını WebP'ye günceller."""
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # JPEG uzantılarını WebP'ye çevir (src, href, filename gibi attribute'larda)
    patterns = [
        (r'(src=["\'])([^"\']*\.)(jpg|jpeg|JPG|JPEG)(["\'])', r'\1\2webp\4'),
        (r'(href=["\'])([^"\']*\.)(jpg|jpeg|JPG|JPEG)(["\'])', r'\1\2webp\4'),
        (r'("filename":\s*")([^"]*\.)(jpg|jpeg|JPG|JPEG)(")', r'\1\2webp\4'),
    ]
    
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)
    
    if content != original_content:
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    print("JPEG referanslarını WebP'ye güncelleniyor...\n")
    
    # JSON dosyasını güncelle
    json_path = Path('gallery.json')
    if json_path.exists():
        print(f"Güncelleniyor: {json_path}")
        if update_json_file(json_path):
            print("✓ gallery.json güncellendi\n")
        else:
            print("  Değişiklik yapılmadı\n")
    
    # HTML dosyasını güncelle
    html_path = Path('index.html')
    if html_path.exists():
        print(f"Güncelleniyor: {html_path}")
        if update_html_file(html_path):
            print("✓ index.html güncellendi\n")
        else:
            print("  Değişiklik yapılmadı\n")
    
    print("Tamamlandı!")

if __name__ == '__main__':
    main()

