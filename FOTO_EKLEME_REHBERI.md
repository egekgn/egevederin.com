# 📸 Fotoğraf Ekleme Rehberi

Bu rehber, yeni fotoğrafları galeriye nasıl ekleyeceğinizi gösterir.

## 🚀 Otomatik Yöntem (Önerilen)

### Adım 1: Fotoğrafları Hazırla
1. Eklemek istediğiniz fotoğrafları bir klasöre koyun
2. Fotoğraflar `.jpg`, `.jpeg`, `.png`, `.webp` formatında olabilir

### Adım 2: Script'i Çalıştır
Terminal'de şu komutu çalıştırın:

```bash
python3 add-photos-from-folder.py [fotoğraf-klasörü-yolu]
```

**Örnek:**
```bash
# Desktop'taki "Yeni Fotoğraflar" klasöründen ekle
python3 add-photos-from-folder.py ~/Desktop/Yeni\ Fotoğraflar

# Veya klasör belirtmezseniz, varsayılan olarak "~/Desktop/Exported Photos" kullanılır
python3 add-photos-from-folder.py
```

### Adım 3: Script Ne Yapar?
✅ Fotoğrafları `gallery/` klasörüne kopyalar  
✅ `gallery.json` dosyasını günceller  
✅ `index.html` dosyasındaki galeri bölümlerini otomatik günceller:
   - Gallery preview (ilk 3 fotoğraf)
   - Gallery modal (tüm fotoğraflar)
   - window.galleryData script bloğu

### Adım 4: Sayfayı Yenile
Tarayıcıda sayfayı yenileyin (F5 veya Cmd+R), yeni fotoğraflar görünecektir!

---

## ✏️ Manuel Yöntem

Eğer script kullanmak istemiyorsanız, manuel olarak da ekleyebilirsiniz:

### Adım 1: Fotoğrafı Kopyala
1. Fotoğrafı `gallery/` klasörüne kopyalayın
2. İsimlendirme: `YENI_FOTO.webp` (veya `.jpg`, `.jpeg`)

### Adım 2: gallery.json'u Güncelle
`gallery.json` dosyasını açın ve yeni fotoğrafı ekleyin:

```json
{
  "photos": [
    {
      "id": 11,
      "filename": "gallery/YENI_FOTO.webp",
      "uploadDate": "2025-12-13"
    },
    // ... diğer fotoğraflar
  ]
}
```

**Önemli:** En yüksek ID'den bir fazla ID kullanın ve tarihi bugünün tarihi yapın.

### Adım 3: index.html'i Güncelle

#### 3a. Gallery Preview (İlk 3 fotoğraf)
`index.html` dosyasında şu bölümü bulun (satır ~165):

```html
<div class="gallery-bubble__image-container" data-gallery-preview>
    <div class="gallery-bubble__image">
        <img src="gallery/IMG_8884.webp" ...>
    </div>
    <!-- ... -->
</div>
```

Yeni fotoğrafı eklemek için en üste yeni bir `<div class="gallery-bubble__image">` ekleyin. Eğer 3'ten fazla fotoğraf varsa, en eski olanı kaldırın.

#### 3b. Gallery Modal (Tüm Fotoğraflar)
`index.html` dosyasında şu bölümü bulun (satır ~282):

```html
<div class="gallery-modal__content" data-gallery-content>
    <div class="gallery-modal__item" data-photo-index="0">
        <img src="gallery/IMG_8884.webp" ...>
    </div>
    <!-- ... -->
</div>
```

En üste yeni bir item ekleyin:

```html
<div class="gallery-modal__item" data-photo-index="0">
    <img src="gallery/YENI_FOTO.webp" alt="Fotoğraf 1" loading="eager" fetchpriority="high" decoding="async" onerror="this.onerror=null; this.src='gallery/YENI_FOTO.jpeg';">
</div>
```

**Önemli:** 
- `data-photo-index` değerlerini 0'dan başlayarak sırayla güncelleyin
- İlk 3 fotoğraf için `loading="eager"` ve `fetchpriority="high"` kullanın
- Diğerleri için `loading="lazy"` kullanın

#### 3c. window.galleryData Script Bloğu
`index.html` dosyasında şu bölümü bulun (satır ~326):

```html
<script>
    window.galleryData = {
        "photos": [
            {"id": 10, "filename": "gallery/IMG_8884.webp", "uploadDate": "2025-12-12"},
            // ...
        ]
    };
</script>
```

Yeni fotoğrafı en üste ekleyin:

```html
{"id": 11, "filename": "gallery/YENI_FOTO.webp", "uploadDate": "2025-12-13"},
```

---

## 💡 İpuçları

1. **WebP Formatı:** Fotoğrafları WebP formatına çevirmek için `convert-to-webp.py` script'ini kullanabilirsiniz
2. **Fallback:** Her fotoğraf için fallback (yedek) format ekleyin (ör: `.webp` için `.jpeg`)
3. **Sıralama:** En yeni fotoğraflar her zaman en üstte görünür
4. **Preview:** Sadece ilk 3 fotoğraf ana sayfada preview olarak gösterilir

---

## ❓ Sorun Giderme

**Fotoğraf görünmüyor:**
- Dosya yolunu kontrol edin (`gallery/` klasöründe olmalı)
- Fallback formatını kontrol edin
- Tarayıcı konsolunda hata var mı bakın (F12)

**Script çalışmıyor:**
- Python 3 yüklü mü kontrol edin: `python3 --version`
- Dosya izinlerini kontrol edin
- Klasör yolunu doğru yazdığınızdan emin olun

**HTML güncellenmedi:**
- Script'in başarıyla tamamlandığını kontrol edin
- `index.html` dosyasının yazılabilir olduğundan emin olun

---

## 📝 Özet

**En Kolay Yol:**
```bash
python3 add-photos-from-folder.py ~/Desktop/Fotoğraflar
```

Bu kadar! Script her şeyi otomatik yapar. 🎉
