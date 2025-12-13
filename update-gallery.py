#!/usr/bin/env python3
"""
Galeri Güncelleme Scripti
Bu script gallery.json dosyasını okuyup index.html'i otomatik günceller.
Kullanım: python3 update-gallery.py
"""

import json
import re
import os

def update_index_html():
    # gallery.json dosyasını oku
    try:
        with open('gallery.json', 'r', encoding='utf-8') as f:
            gallery_data = json.load(f)
    except FileNotFoundError:
        print("❌ gallery.json dosyası bulunamadı!")
        return False
    except json.JSONDecodeError:
        print("❌ gallery.json dosyası geçersiz JSON formatında!")
        return False
    
    # index.html dosyasını oku
    try:
        with open('index.html', 'r', encoding='utf-8') as f:
            html_content = f.read()
    except FileNotFoundError:
        print("❌ index.html dosyası bulunamadı!")
        return False
    
    # window.galleryData kısmını bul ve değiştir
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
        # Eski bloğu değiştir
        html_content = re.sub(pattern, new_script, html_content, flags=re.DOTALL)
        print("✅ window.galleryData bloğu güncellendi!")
    else:
        # Eski blok bulunamadı, </body> etiketinden önce ekle
        html_content = html_content.replace('    <script src="script.js"></script>', 
                                           new_script + '\n    <script src="script.js"></script>')
        print("✅ window.galleryData bloğu eklendi!")
    
    # index.html'i kaydet
    try:
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(html_content)
        print("✅ index.html dosyası güncellendi!")
        print(f"📸 Toplam {len(gallery_data.get('photos', []))} fotoğraf eklendi!")
        return True
    except Exception as e:
        print(f"❌ index.html kaydedilirken hata: {e}")
        return False

if __name__ == '__main__':
    print("🚀 Galeri güncelleme başlatılıyor...")
    print("-" * 50)
    
    if update_index_html():
        print("-" * 50)
        print("✅ Tamamlandı! Sayfayı yenileyin ve fotoğrafları görün!")
    else:
        print("-" * 50)
        print("❌ Güncelleme başarısız!")

