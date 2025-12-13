#!/usr/bin/env python3
"""
JPEG/JPG dosyalarını WebP formatına dönüştürür.
Görüntü kalitesi korunur, dosya boyutu küçülür.
"""

import os
import sys
from pathlib import Path
from PIL import Image

def convert_to_webp(input_path, output_path=None, quality=85):
    """
    JPEG dosyasını WebP'ye dönüştürür.
    
    Args:
        input_path: Giriş dosya yolu
        output_path: Çıkış dosya yolu (None ise otomatik belirlenir)
        quality: WebP kalite ayarı (0-100, varsayılan 85)
    
    Returns:
        (başarılı, orijinal_boyut, yeni_boyut, küçülme_yüzdesi)
    """
    try:
        # Dosyayı aç
        img = Image.open(input_path)
        
        # RGBA moduna çevir (transparency desteği için)
        if img.mode in ('RGBA', 'LA'):
            # Zaten alpha channel var
            pass
        elif img.mode == 'P' and 'transparency' in img.info:
            # Palette modunda transparency var
            img = img.convert('RGBA')
        else:
            # RGB'ye çevir
            img = img.convert('RGB')
        
        # Çıkış dosya yolunu belirle
        if output_path is None:
            base_name = Path(input_path).stem
            output_path = Path(input_path).parent / f"{base_name}.webp"
        
        # Orijinal dosya boyutu
        original_size = os.path.getsize(input_path)
        
        # WebP olarak kaydet
        img.save(output_path, 'WEBP', quality=quality, method=6)
        
        # Yeni dosya boyutu
        new_size = os.path.getsize(output_path)
        
        # Küçülme yüzdesi
        reduction = ((original_size - new_size) / original_size) * 100
        
        return True, original_size, new_size, reduction
        
    except Exception as e:
        print(f"Hata ({input_path}): {e}", file=sys.stderr)
        return False, 0, 0, 0

def format_size(size_bytes):
    """Dosya boyutunu okunabilir formata çevirir."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"

def main():
    # Dönüştürülecek dosya uzantıları
    extensions = ['.jpg', '.jpeg', '.JPG', '.JPEG']
    
    # Tüm JPEG dosyalarını bul
    current_dir = Path('.')
    jpeg_files = []
    
    # Gallery klasörü
    gallery_dir = current_dir / 'gallery'
    if gallery_dir.exists():
        for ext in extensions:
            jpeg_files.extend(gallery_dir.glob(f'*{ext}'))
    
    # Ana dizindeki JPEG dosyaları (mehmet.jpg gibi)
    for ext in extensions:
        jpeg_files.extend(current_dir.glob(f'*{ext}'))
    
    if not jpeg_files:
        print("JPEG dosyası bulunamadı!")
        return
    
    print(f"Toplam {len(jpeg_files)} JPEG dosyası bulundu.\n")
    print("Dönüştürme başlıyor...\n")
    
    total_original = 0
    total_new = 0
    successful = 0
    failed = 0
    
    for jpeg_file in jpeg_files:
        print(f"İşleniyor: {jpeg_file.name}...", end=' ')
        
        success, orig_size, new_size, reduction = convert_to_webp(jpeg_file)
        
        if success:
            total_original += orig_size
            total_new += new_size
            successful += 1
            
            print(f"✓ Tamamlandı")
            print(f"  Orijinal: {format_size(orig_size)} → WebP: {format_size(new_size)}")
            print(f"  Küçülme: {reduction:.1f}%")
            
            # Eski dosyayı sil (isteğe bağlı - yorum satırını kaldırarak aktif edebilirsiniz)
            # os.remove(jpeg_file)
            # print(f"  Eski dosya silindi: {jpeg_file.name}")
        else:
            failed += 1
            print(f"✗ Başarısız")
        
        print()
    
    # Özet
    print("=" * 50)
    print("ÖZET:")
    print(f"Başarılı: {successful}")
    print(f"Başarısız: {failed}")
    print(f"Toplam orijinal boyut: {format_size(total_original)}")
    print(f"Toplam yeni boyut: {format_size(total_new)}")
    if total_original > 0:
        total_reduction = ((total_original - total_new) / total_original) * 100
        print(f"Toplam küçülme: {total_reduction:.1f}%")
    print("=" * 50)
    
    print("\nNot: Eski JPEG dosyaları korundu.")
    print("WebP dosyalarının çalıştığını test ettikten sonra")
    print("eski JPEG dosyalarını silebilirsiniz.")

if __name__ == '__main__':
    main()

