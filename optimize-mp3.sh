#!/bin/bash
# MP3 dosyasını optimize eder (bitrate düşürür, dosya boyutunu küçültür)

INPUT_FILE="mehmet-gureli-kimse-bilmez.mp3"
OUTPUT_FILE="mehmet-gureli-kimse-bilmez-optimized.mp3"

echo "MP3 dosyası optimize ediliyor..."
echo "Orijinal dosya: $INPUT_FILE"

# FFmpeg ile optimize et (128 kbps - web için ideal)
if command -v ffmpeg &> /dev/null; then
    echo "FFmpeg bulundu, optimize ediliyor..."
    ffmpeg -i "$INPUT_FILE" \
        -codec:a libmp3lame \
        -b:a 128k \
        -ar 44100 \
        -ac 2 \
        -y \
        "$OUTPUT_FILE"
    
    if [ $? -eq 0 ]; then
        ORIGINAL_SIZE=$(stat -f%z "$INPUT_FILE" 2>/dev/null || stat -c%s "$INPUT_FILE" 2>/dev/null)
        NEW_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null)
        
        echo ""
        echo "✓ Optimize edildi!"
        echo "Orijinal boyut: $(numfmt --to=iec-i --suffix=B $ORIGINAL_SIZE 2>/dev/null || echo "$ORIGINAL_SIZE bytes")"
        echo "Yeni boyut: $(numfmt --to=iec-i --suffix=B $NEW_SIZE 2>/dev/null || echo "$NEW_SIZE bytes")"
        
        REDUCTION=$((100 - (NEW_SIZE * 100 / ORIGINAL_SIZE)))
        echo "Küçülme: %$REDUCTION"
        echo ""
        echo "Test ettikten sonra eski dosyayı silebilirsiniz:"
        echo "  mv $OUTPUT_FILE $INPUT_FILE"
    else
        echo "Hata: FFmpeg ile optimize edilemedi"
        exit 1
    fi
else
    echo "Hata: FFmpeg bulunamadı!"
    echo ""
    echo "FFmpeg'i yüklemek için:"
    echo "  brew install ffmpeg"
    echo ""
    echo "Veya Homebrew yoksa:"
    echo "  https://ffmpeg.org/download.html"
    exit 1
fi

