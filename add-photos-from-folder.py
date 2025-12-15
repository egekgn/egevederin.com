#!/usr/bin/env python3
"""
Photos Library'den export edilen fotoğrafları otomatik olarak galeriye ekler.
Kullanım: python3 add-photos-from-folder.py [fotoğraf-klasörü-yolu]
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime

def add_photos_from_folder(folder_path):
    """Belirtilen klasördeki tüm fotoğrafları galeriye ekler"""
    
    # gallery.json dosyasını oku
    gallery_json_path = 'gallery.json'
    if os.path.exists(gallery_json_path):
        with open(gallery_json_path, 'r', encoding='utf-8') as f:
            gallery_data = json.load(f)
        photos = gallery_data.get('photos', [])
    else:
        photos = []
    
    # Mevcut en yüksek ID'yi bul
    max_id = max([p['id'] for p in photos], default=0)
    
    # Fotoğraf uzantıları
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'}
    
    # Klasördeki tüm fotoğrafları bul
    folder = Path(folder_path)
    if not folder.exists():
        print(f"❌ Klasör bulunamadı: {folder_path}")
        return False
    
    new_photos = []
    today = datetime.now().strftime('%Y-%m-%d')
    
    for file_path in folder.iterdir():
        if file_path.is_file() and file_path.suffix.lower() in image_extensions:
            # Dosyayı gallery klasörüne kopyala
            gallery_folder = Path('gallery')
            gallery_folder.mkdir(exist_ok=True)
            
            destination = gallery_folder / file_path.name
            
            # Eğer dosya zaten varsa, yeni isim ver
            counter = 1
            original_name = destination.stem
            original_ext = destination.suffix
            while destination.exists():
                destination = gallery_folder / f"{original_name}_{counter}{original_ext}"
                counter += 1
            
            # Dosyayı kopyala
            import shutil
            shutil.copy2(file_path, destination)
            
            # Yeni fotoğraf bilgisini ekle
            max_id += 1
            new_photo = {
                "id": max_id,
                "filename": f"gallery/{destination.name}",
                "uploadDate": today
            }
            photos.append(new_photo)
            new_photos.append(destination.name)
            print(f"✅ {destination.name} eklendi")
    
    if not new_photos:
        print("❌ Klasörde fotoğraf bulunamadı!")
        return False
    
    # En son eklenenler en üstte olacak şekilde sırala
    photos.sort(key=lambda x: x['uploadDate'], reverse=True)
    
    # gallery.json'u kaydet
    gallery_data = {"photos": photos}
    with open(gallery_json_path, 'w', encoding='utf-8') as f:
        json.dump(gallery_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Toplam {len(new_photos)} fotoğraf eklendi!")
    print(f"📸 Galeride toplam {len(photos)} fotoğraf var")
    
    # index.html'i güncelle
    print("\n🔄 index.html güncelleniyor...")
    update_index_html(gallery_data)
    
    return True

def get_fallback_path(webp_path):
    """WebP dosyası için fallback path oluştur"""
    base = webp_path.replace('.webp', '').replace('.WEBP', '')
    # Olası fallback uzantıları
    fallbacks = ['.jpeg', '.jpg', '.JPG', '.JPEG']
    return base + fallbacks[0]  # Varsayılan olarak .jpeg

def update_index_html(gallery_data):
    """index.html dosyasını günceller - hem gallery modal hem de preview"""
    import re
    
    try:
        with open('index.html', 'r', encoding='utf-8') as f:
            html_content = f.read()
    except FileNotFoundError:
        print("❌ index.html dosyası bulunamadı!")
        return False
    
    photos = gallery_data.get('photos', [])
    if not photos:
        print("⚠️  Galeride fotoğraf yok, HTML güncellenmedi")
        return False
    
    # 1. Gallery Preview bölümünü güncelle (ilk 3 fotoğraf)
    preview_start = html_content.find('<div class="gallery-bubble__image-container" data-gallery-preview>')
    preview_end = html_content.find('</div>', preview_start) + 6
    
    if preview_start != -1:
        preview_html = '<div class="gallery-bubble__image-container" data-gallery-preview>\n'
        for i, photo in enumerate(photos[:3]):  # İlk 3 fotoğraf
            filename = photo['filename']
            fallback = get_fallback_path(filename)
            preview_html += f'                            <div class="gallery-bubble__image">\n'
            preview_html += f'                                <img src="{filename}" alt="Fotoğraf {i+1}" loading="eager" fetchpriority="high" decoding="async" onerror="this.onerror=null; this.src=\'{fallback}\';">\n'
            preview_html += f'                            </div>\n'
        preview_html += '                        </div>'
        html_content = html_content[:preview_start] + preview_html + html_content[preview_end:]
        print("✅ Gallery preview güncellendi!")
    
    # 2. Gallery Modal içeriğini güncelle (tüm fotoğraflar)
    modal_start = html_content.find('<div class="gallery-modal__content" data-gallery-content>')
    modal_end = html_content.find('</div>', modal_start + 50) + 6
    
    if modal_start != -1:
        modal_html = '<div class="gallery-modal__content" data-gallery-content>\n'
        for i, photo in enumerate(photos):
            filename = photo['filename']
            fallback = get_fallback_path(filename)
            # İlk 3 fotoğraf için eager, diğerleri için lazy
            loading = 'eager' if i < 3 else 'lazy'
            priority = 'high' if i < 3 else 'auto'
            modal_html += f'            <div class="gallery-modal__item" data-photo-index="{i}">\n'
            modal_html += f'                <img src="{filename}" alt="Fotoğraf {i+1}" loading="{loading}" fetchpriority="{priority}" decoding="async" onerror="this.onerror=null; this.src=\'{fallback}\';">\n'
            modal_html += f'            </div>\n'
        modal_html += '        </div>'
        html_content = html_content[:modal_start] + modal_html + html_content[modal_end:]
        print("✅ Gallery modal güncellendi!")
    
    # 3. window.galleryData script bloğunu güncelle
    json_string = json.dumps(gallery_data, indent=12, ensure_ascii=False)
    json_string = json_string.replace('\n', '\n        ')
    
    new_script = f"""    <script>
        // Gallery data - sadece tarih ve index bilgisi için
        window.galleryData = {json_string};
    </script>"""
    
    pattern = r'    <script>\s*// Gallery data.*?</script>'
    if re.search(pattern, html_content, re.DOTALL):
        html_content = re.sub(pattern, new_script, html_content, flags=re.DOTALL)
        print("✅ window.galleryData bloğu güncellendi!")
    else:
        # Eski pattern'i de dene
        old_pattern = r'    <script>\s*// Gallery JSON data.*?</script>'
        if re.search(old_pattern, html_content, re.DOTALL):
            html_content = re.sub(old_pattern, new_script, html_content, flags=re.DOTALL)
            print("✅ window.galleryData bloğu güncellendi!")
        else:
            html_content = html_content.replace('    <script src="script.js"></script>', 
                                               new_script + '\n    <script src="script.js"></script>')
            print("✅ window.galleryData bloğu eklendi!")
    
    # index.html'i kaydet
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print("✅ index.html tamamen güncellendi!")
    return True

if __name__ == '__main__':
    print("🚀 Fotoğraf ekleme başlatılıyor...")
    print("-" * 50)
    
    if len(sys.argv) > 1:
        folder_path = sys.argv[1]
    else:
        # Varsayılan: Desktop'ta "Exported Photos" klasörü
        folder_path = os.path.expanduser('~/Desktop/Exported Photos')
        print(f"📁 Klasör belirtilmedi, varsayılan kullanılıyor: {folder_path}")
        print("💡 Kullanım: python3 add-photos-from-folder.py [klasör-yolu]")
        print()
    
    if add_photos_from_folder(folder_path):
        print("-" * 50)
        print("✅ Tamamlandı! Sayfayı yenileyin ve fotoğrafları görün!")
    else:
        print("-" * 50)
        print("❌ İşlem başarısız!")

