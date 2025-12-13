#!/usr/bin/env python3
"""
Gallery klasöründeki tüm fotoğrafları otomatik olarak galeriye ekler.
Kullanım: python3 auto-add-gallery-photos.py
"""

import json
import os
from pathlib import Path
from datetime import datetime

def auto_add_photos():
    """Gallery klasöründeki tüm fotoğrafları kontrol edip ekler"""
    
    # gallery.json dosyasını oku
    gallery_json_path = 'gallery.json'
    if os.path.exists(gallery_json_path):
        with open(gallery_json_path, 'r', encoding='utf-8') as f:
            gallery_data = json.load(f)
        photos = gallery_data.get('photos', [])
    else:
        photos = []
    
    # Mevcut fotoğraf dosya adlarını al
    existing_filenames = {p['filename'] for p in photos}
    
    # Mevcut en yüksek ID'yi bul
    max_id = max([p['id'] for p in photos], default=0)
    
    # Fotoğraf uzantıları
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.JPG', '.JPEG', '.PNG'}
    
    # Gallery klasörünü kontrol et
    gallery_folder = Path('gallery')
    if not gallery_folder.exists():
        print("❌ gallery klasörü bulunamadı!")
        return False
    
    new_photos = []
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Gallery klasöründeki tüm fotoğrafları kontrol et
    for file_path in gallery_folder.iterdir():
        if file_path.is_file() and file_path.suffix.lower() in image_extensions:
            filename = f"gallery/{file_path.name}"
            
            # Eğer bu fotoğraf zaten eklenmemişse, ekle
            if filename not in existing_filenames:
                max_id += 1
                new_photo = {
                    "id": max_id,
                    "filename": filename,
                    "uploadDate": today
                }
                photos.append(new_photo)
                new_photos.append(file_path.name)
                print(f"✅ {file_path.name} eklendi")
    
    if not new_photos:
        print("ℹ️  Yeni fotoğraf bulunamadı. Tüm fotoğraflar zaten eklenmiş.")
        return True
    
    # En son eklenenler en üstte olacak şekilde sırala
    photos.sort(key=lambda x: (x['uploadDate'], x['id']), reverse=True)
    
    # gallery.json'u kaydet
    gallery_data = {"photos": photos}
    with open(gallery_json_path, 'w', encoding='utf-8') as f:
        json.dump(gallery_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Toplam {len(new_photos)} yeni fotoğraf eklendi!")
    print(f"📸 Galeride toplam {len(photos)} fotoğraf var")
    
    # index.html'i güncelle
    print("\n🔄 index.html güncelleniyor...")
    update_index_html(gallery_data)
    
    return True

def update_index_html(gallery_data):
    """index.html dosyasını günceller"""
    import re
    
    try:
        with open('index.html', 'r', encoding='utf-8') as f:
            html_content = f.read()
    except FileNotFoundError:
        print("❌ index.html dosyası bulunamadı!")
        return False
    
    # JSON'u formatla
    json_string = json.dumps(gallery_data, indent=12, ensure_ascii=False)
    json_string = json_string.replace('\n', '\n        ')
    
    # Yeni script içeriği
    new_script = f"""    <script>
        // Gallery JSON data - inline olarak ekleniyor (file:// protokolü için)
        window.galleryData = {json_string};
    </script>"""
    
    # Eski script bloğunu bul ve değiştir
    pattern = r'    <script>\s*// Gallery JSON data.*?</script>'
    
    if re.search(pattern, html_content, re.DOTALL):
        html_content = re.sub(pattern, new_script, html_content, flags=re.DOTALL)
        print("✅ window.galleryData bloğu güncellendi!")
    else:
        html_content = html_content.replace('    <script src="script.js"></script>', 
                                           new_script + '\n    <script src="script.js"></script>')
        print("✅ window.galleryData bloğu eklendi!")
    
    # index.html'i kaydet
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print("✅ index.html güncellendi!")
    return True

if __name__ == '__main__':
    print("🚀 Gallery klasörü taranıyor...")
    print("-" * 50)
    
    if auto_add_photos():
        print("-" * 50)
        print("✅ Tamamlandı! Sayfayı yenileyin ve fotoğrafları görün!")
    else:
        print("-" * 50)
        print("❌ İşlem başarısız!")

