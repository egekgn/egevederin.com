#!/usr/bin/env python3
"""
MP3 dosyasını optimize eder (pydub kullanarak)
Bitrate'i düşürür, dosya boyutunu küçültür
"""

import os
import sys
from pathlib import Path

def optimize_mp3_pydub(input_path, output_path=None, bitrate='128k'):
    """
    Pydub kullanarak MP3'ü optimize eder.
    """
    try:
        from pydub import AudioSegment
        
        print(f"MP3 dosyası yükleniyor: {input_path}")
        audio = AudioSegment.from_mp3(input_path)
        
        original_size = os.path.getsize(input_path)
        print(f"Orijinal boyut: {original_size / 1024 / 1024:.2f} MB")
        print(f"Orijinal bitrate: {audio.frame_rate} Hz, {audio.channels} kanal")
        
        if output_path is None:
            output_path = input_path.replace('.mp3', '-optimized.mp3')
        
        print(f"\nOptimize ediliyor (bitrate: {bitrate})...")
        audio.export(
            output_path,
            format='mp3',
            bitrate=bitrate,
            parameters=['-q:a', '2']  # Yüksek kalite (0-9 arası, 2 = yüksek kalite)
        )
        
        new_size = os.path.getsize(output_path)
        reduction = ((original_size - new_size) / original_size) * 100
        
        print(f"\n✓ Tamamlandı!")
        print(f"Yeni boyut: {new_size / 1024 / 1024:.2f} MB")
        print(f"Küçülme: {reduction:.1f}%")
        print(f"\nÇıktı dosyası: {output_path}")
        print("\nTest ettikten sonra eski dosyayı silebilirsiniz:")
        print(f"  mv {output_path} {input_path}")
        
        return True
        
    except ImportError:
        print("Hata: pydub kütüphanesi yüklü değil!")
        print("\nYüklemek için:")
        print("  pip3 install pydub")
        print("\nAyrıca FFmpeg gerekli:")
        print("  brew install ffmpeg")
        return False
    except Exception as e:
        print(f"Hata: {e}")
        return False

def main():
    input_file = 'mehmet-gureli-kimse-bilmez.mp3'
    
    if not os.path.exists(input_file):
        print(f"Hata: {input_file} bulunamadı!")
        return
    
    # Bitrate seçenekleri: 96k, 128k, 160k, 192k
    # 128k web için ideal (kalite/küçüklük dengesi)
    optimize_mp3_pydub(input_file, bitrate='128k')

if __name__ == '__main__':
    main()

