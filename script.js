(function () {
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d', { alpha: true });

    let width = 0;
    let height = 0;
    let columns = 0;
    let drops = [];
    let animationFrameId = 0;
    let fontSize = 22; // px, draw ve resize ortak kullanacak

    // Heart rain settings
    const heartSymbol = '❤';

    function resize() {
        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        width = Math.floor(window.innerWidth);
        height = Math.floor(window.innerHeight);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Daha belirgin kalpler için emoji fontlarını kullan
        ctx.font = fontSize + 'px Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, JetBrains Mono, monospace';
        columns = Math.ceil(width / fontSize);
        drops = new Array(columns).fill(0).map(() => Math.floor(Math.random() * -40));
    }

    function draw() {
        // fade the canvas slightly to create trails
        ctx.fillStyle = 'rgba(5, 7, 10, 0.14)';
        ctx.fillRect(0, 0, width, height);

        // daha kırmızı ve daha parlayan kalpler
        ctx.fillStyle = '#ff2244';
        ctx.shadowColor = '#ff8899';
        ctx.shadowBlur = 12;
        for (let i = 0; i < columns; i++) {
            const text = heartSymbol;
            const x = i * fontSize;
            const y = drops[i] * fontSize;
            ctx.fillText(text, x, y);

            // reset drop randomly after it passes bottom
            if (y > height && Math.random() > 0.975) {
                drops[i] = Math.floor(Math.random() * -40);
            }
            // hız: 0.12
            drops[i] += 0.09;
        }
        ctx.shadowBlur = 0;
        animationFrameId = requestAnimationFrame(draw);
    }

    function start() {
        cancelAnimationFrame(animationFrameId);
        draw();
    }

    window.addEventListener('resize', () => {
        resize();
        start();
    });

    // init
    resize();
    start();

    // footer year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();


// Modal logic
(function () {
    const overlay = document.querySelector('[data-modal-overlay]');
    const contentEl = document.querySelector('[data-modal-content]');
    const closeBtn = document.querySelector('[data-modal-close]');

    if (!overlay || !contentEl || !closeBtn) return;

    function openModal(html) {
        contentEl.innerHTML = html;
        overlay.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        overlay.setAttribute('hidden', '');
        contentEl.innerHTML = '';
        document.body.style.overflow = '';
    }

    document.addEventListener('click', function (e) {
        const link = e.target.closest('.post-card__link');
        if (!link) return;
        e.preventDefault();
        const card = link.closest('.post-card');
        const full = card && card.querySelector('.post-card__full');
        if (full) {
            // Eğer todo listesi ise, direkt todo-list içeriğini göster
            const todoList = full.querySelector('.todo-list');
            if (todoList) {
                // Todo listesi için özel içerik oluştur
                const title = card.querySelector('.post-card__title')?.textContent || 'Yapılacaklar Listesi';
                const meta = card.querySelector('.post-card__meta')?.textContent || '';
                
                // Todo-item'ları tek tek kopyala
                const todoItems = todoList.querySelectorAll('.todo-item');
                let todoItemsHTML = '';
                
                todoItems.forEach((item, index) => {
                    const clonedItem = item.cloneNode(true);
                    const checkbox = clonedItem.querySelector('input[type="checkbox"]');
                    const label = clonedItem.querySelector('label');
                    
                    if (checkbox && label) {
                        const newId = `modal-todo-${index + 1}`;
                        checkbox.id = newId;
                        label.setAttribute('for', newId);
                    }
                    
                    todoItemsHTML += clonedItem.outerHTML;
                });
                
                // İçeriği oluştur
                const todoContent = `
                    <h2 style="margin-top: 0; color: var(--text); margin-bottom: 8px; font-weight: 800;">${title}</h2>
                    ${meta ? `<p style="color: var(--muted); margin-bottom: 24px;">${meta}</p>` : ''}
                    <div class="todo-list">${todoItemsHTML}</div>
                `;
                openModal(todoContent);
            } else {
                // Normal içerik için hidden attribute'ları kaldır
                const clonedFull = full.cloneNode(true);
                clonedFull.removeAttribute('hidden');
                clonedFull.querySelectorAll('[hidden]').forEach(el => el.removeAttribute('hidden'));
                openModal(clonedFull.innerHTML);
            }
        }
    });

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
    });
    closeBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeModal();
    });
})();

// Gallery logic
(function () {
    let galleryData = [];
    let galleryImages = [];

    const galleryPreview = document.querySelector('[data-gallery-preview]');
    const galleryOpenBtn = document.querySelector('[data-gallery-open]');
    const galleryModal = document.querySelector('[data-gallery-modal]');
    const galleryContent = document.querySelector('[data-gallery-content]');
    const galleryCloseBtn = document.querySelector('[data-gallery-close]');
    const photoViewer = document.querySelector('[data-photo-viewer]');
    const photoViewerImage = document.querySelector('[data-photo-viewer-image]');
    const photoViewerClose = document.querySelector('[data-photo-viewer-close]');
    const photoViewerPrev = document.querySelector('[data-photo-viewer-prev]');
    const photoViewerNext = document.querySelector('[data-photo-viewer-next]');

    let currentPhotoIndex = 0;

    // Tarihi Türkçe formata çevir (15 Ocak 2025)
    function formatDate(dateString) {
        const date = new Date(dateString);
        const months = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    }

    // JSON'dan galeri verilerini yükle
    async function loadGallery() {
        // Önce inline data'yı kontrol et (file:// protokolü için)
        if (window.galleryData) {
            const data = window.galleryData;
            if (data.photos && data.photos.length > 0) {
                galleryData = data.photos.sort((a, b) => {
                    return new Date(b.uploadDate) - new Date(a.uploadDate);
                });
                galleryImages = galleryData.map(photo => photo.filename);
                console.log('Galeri yüklendi (inline):', galleryImages.length, 'fotoğraf');
                renderPreview();
                return;
            }
        }
        
        // Eğer inline data yoksa fetch ile dene
        try {
            const response = await fetch('gallery.json');
            if (!response.ok) {
                throw new Error('JSON dosyası yüklenemedi');
            }
            const data = await response.json();
            
            if (!data.photos || data.photos.length === 0) {
                console.warn('Galeride fotoğraf yok');
                return;
            }
            
            // En son yüklenenler en üstte olacak şekilde sırala (tarihe göre azalan)
            galleryData = data.photos.sort((a, b) => {
                return new Date(b.uploadDate) - new Date(a.uploadDate);
            });
            
            galleryImages = galleryData.map(photo => photo.filename);
            console.log('Galeri yüklendi (fetch):', galleryImages.length, 'fotoğraf');
            renderPreview();
        } catch (error) {
            console.error('Galeri yüklenirken hata:', error);
            galleryData = [];
            galleryImages = [];
        }
    }

    // Galeri önizlemesini oluştur (ilk 3 fotoğraf)
    function renderPreview() {
        if (!galleryPreview) {
            console.error('galleryPreview elementi bulunamadı');
            return;
        }
        
        if (galleryImages.length === 0) {
            console.warn('Galeride fotoğraf yok, önizleme oluşturulamıyor');
            return;
        }
        
        // Container'ı görünür yap
        if (galleryPreview.parentElement) {
            galleryPreview.parentElement.style.display = 'flex';
            galleryPreview.parentElement.style.visibility = 'visible';
        }
        galleryPreview.style.display = 'flex';
        galleryPreview.style.visibility = 'visible';
        galleryPreview.style.opacity = '1';
        galleryPreview.style.width = '100%';
        
        galleryPreview.innerHTML = '';
        const previewCount = Math.min(3, galleryImages.length);
        
        console.log('Önizleme oluşturuluyor:', previewCount, 'fotoğraf');
        console.log('Fotoğraf yolları:', galleryImages.slice(0, previewCount));
        
        for (let i = 0; i < previewCount; i++) {
            const img = document.createElement('img');
            const webpSrc = galleryImages[i];
            const jpegSrc = webpSrc.replace(/\.webp$/i, '.jpg');
            
            // Albüm kapağı gibi basit fallback - önce WebP, sonra JPEG
            img.src = webpSrc;
            img.alt = `Fotoğraf ${i + 1}`;
            img.loading = i === 0 ? 'eager' : 'lazy';
            img.fetchPriority = i === 0 ? 'high' : 'auto';
            img.decoding = 'async';
            
            // Basit fallback - albüm kapağı gibi
            img.onerror = function() {
                if (this.src === webpSrc) {
                    console.log('WebP yüklenemedi, JPEG deneniyor:', jpegSrc);
                    this.src = jpegSrc;
                } else {
                    console.error('Fotoğraf yüklenemedi:', webpSrc);
                }
            };
            
            img.onload = function() {
                console.log('✓ Fotoğraf yüklendi:', this.src, 'Boyut:', this.naturalWidth + 'x' + this.naturalHeight);
            };
            
            const container = document.createElement('div');
            container.className = 'gallery-bubble__image';
            container.style.display = 'flex';
            container.style.visibility = 'visible';
            container.style.opacity = '1';
            container.style.flex = '1';
            container.style.minWidth = '0';
            container.style.aspectRatio = '1';
            container.style.borderRadius = '10px';
            container.style.overflow = 'hidden';
            container.style.border = '1px solid rgba(255,34,68,0.3)';
            container.style.cursor = 'pointer';
            container.style.background = 'var(--bg-elev)';
            container.appendChild(img);
            container.addEventListener('click', () => openPhotoViewer(i));
            
            galleryPreview.appendChild(container);
        }
        
        // İlk fotoğrafı preload et (performans için)
        if (galleryImages.length > 0) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = galleryImages[0];
            document.head.appendChild(link);
        }
    }

    // Galeri modal'ını aç
    function openGallery() {
        if (!galleryModal || !galleryContent) return;
        
        galleryContent.innerHTML = '';
        
        galleryData.forEach((photo, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-modal__item';
            
            const img = document.createElement('img');
            const webpSrc = photo.filename;
            img.src = webpSrc;
            img.alt = `Fotoğraf ${index + 1}`;
            img.loading = 'lazy';
            img.decoding = 'async';
            img.fetchPriority = index < 6 ? 'high' : 'auto'; // İlk 6 fotoğraf için yüksek öncelik
            
            // WebP yüklenemezse JPEG fallback
            img.onerror = function() {
                const jpegSrc = webpSrc.replace(/\.webp$/i, '.jpg');
                if (this.src !== jpegSrc) {
                    console.log('WebP yüklenemedi, JPEG deneniyor:', jpegSrc);
                    this.src = jpegSrc;
                } else {
                    console.error('Fotoğraf yüklenemedi (WebP ve JPEG):', webpSrc);
                    item.style.display = 'none';
                }
            };
            
            item.appendChild(img);
            item.addEventListener('click', () => openPhotoViewer(index));
            
            galleryContent.appendChild(item);
        });
        
        galleryModal.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
    }

    // Galeri modal'ını kapat
    function closeGallery() {
        if (!galleryModal) return;
        galleryModal.setAttribute('hidden', '');
        document.body.style.overflow = '';
    }

    // Fotoğraf görüntüleyiciyi aç
    function openPhotoViewer(index) {
        if (!photoViewer || !photoViewerImage || index < 0 || index >= galleryImages.length) return;
        
        currentPhotoIndex = index;
        updatePhotoViewer();
        photoViewer.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
    }

    // Fotoğraf görüntüleyiciyi kapat
    function closePhotoViewer() {
        if (!photoViewer) return;
        photoViewer.setAttribute('hidden', '');
        document.body.style.overflow = '';
    }

    // Fotoğraf görüntüleyiciyi güncelle
    function updatePhotoViewer() {
        if (!photoViewerImage || currentPhotoIndex < 0 || currentPhotoIndex >= galleryImages.length) return;
        
        const photo = galleryData[currentPhotoIndex];
        photoViewerImage.innerHTML = '';
        
        const img = document.createElement('img');
        const webpSrc = photo.filename;
        img.src = webpSrc;
        img.alt = `Fotoğraf ${currentPhotoIndex + 1}`;
        img.loading = 'eager'; // Fotoğraf görüntüleyicide eager loading
        img.fetchPriority = 'high';
        img.decoding = 'async';
        
        // WebP yüklenemezse JPEG fallback
        img.onerror = function() {
            const jpegSrc = webpSrc.replace(/\.webp$/i, '.jpg');
            if (this.src !== jpegSrc) {
                console.log('WebP yüklenemedi, JPEG deneniyor:', jpegSrc);
                this.src = jpegSrc;
            } else {
                console.error('Fotoğraf yüklenemedi (WebP ve JPEG):', webpSrc);
            }
        };
        
        photoViewerImage.appendChild(img);
        
        // Tarih bilgisini ekle
        const dateInfo = document.createElement('div');
        dateInfo.className = 'photo-viewer__date';
        dateInfo.textContent = formatDate(photo.uploadDate);
        photoViewerImage.appendChild(dateInfo);
        
        // Önceki/sonraki butonlarını göster/gizle
        if (photoViewerPrev) {
            photoViewerPrev.style.display = galleryImages.length > 1 ? 'flex' : 'none';
        }
        if (photoViewerNext) {
            photoViewerNext.style.display = galleryImages.length > 1 ? 'flex' : 'none';
        }
    }

    // Önceki fotoğraf
    function prevPhoto() {
        if (galleryImages.length === 0) return;
        currentPhotoIndex = (currentPhotoIndex - 1 + galleryImages.length) % galleryImages.length;
        updatePhotoViewer();
    }

    // Sonraki fotoğraf
    function nextPhoto() {
        if (galleryImages.length === 0) return;
        currentPhotoIndex = (currentPhotoIndex + 1) % galleryImages.length;
        updatePhotoViewer();
    }

    // Event listeners
    if (galleryOpenBtn) {
        galleryOpenBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openGallery();
        });
    }

    if (galleryCloseBtn) {
        galleryCloseBtn.addEventListener('click', closeGallery);
    }

    if (photoViewerClose) {
        photoViewerClose.addEventListener('click', closePhotoViewer);
    }

    if (photoViewerPrev) {
        photoViewerPrev.addEventListener('click', prevPhoto);
    }

    if (photoViewerNext) {
        photoViewerNext.addEventListener('click', nextPhoto);
    }

    // Klavye navigasyonu
    document.addEventListener('keydown', function(e) {
        if (photoViewer && !photoViewer.hasAttribute('hidden')) {
            if (e.key === 'Escape') {
                closePhotoViewer();
            } else if (e.key === 'ArrowLeft') {
                prevPhoto();
            } else if (e.key === 'ArrowRight') {
                nextPhoto();
            }
        } else if (galleryModal && !galleryModal.hasAttribute('hidden')) {
            if (e.key === 'Escape') {
                closeGallery();
            }
        }
    });

    // Galeri modal dışına tıklanınca kapat
    if (galleryModal) {
        galleryModal.addEventListener('click', function(e) {
            if (e.target === galleryModal) {
                closeGallery();
            }
        });
    }

    // Fotoğraf görüntüleyici dışına tıklanınca kapat
    if (photoViewer) {
        photoViewer.addEventListener('click', function(e) {
            if (e.target === photoViewer) {
                closePhotoViewer();
            }
        });
    }

    // İlk yüklemede galeriyi yükle - DOM hazır olduğunda
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadGallery);
    } else {
        // DOM zaten hazırsa hemen yükle
        loadGallery();
    }
})();

// Navigation logic
(function () {
    function initNavigation() {
        // Navigation linklerini bul
        const navLinks = document.querySelectorAll('.nav a');
        const galleryLink = document.querySelector('.nav a[href="#galeri"]');
        const sectionModal = document.querySelector('[data-section-modal]');
        const sectionModalContent = document.querySelector('[data-section-modal-content]');
        const sectionModalClose = document.querySelector('[data-section-modal-close]');
        
        if (!sectionModal || !sectionModalContent) {
            console.error('Section modal elementleri bulunamadı!');
            return;
        }
        
        // Section modal'ı kapat
        function closeSectionModal() {
            sectionModal.setAttribute('hidden', '');
            document.body.style.overflow = '';
        }
        
        // Section modal'ı aç
        function openSectionModal(sectionId) {
            console.log('openSectionModal çağrıldı:', sectionId);
            
            const sectionElement = document.getElementById(sectionId);
            
            if (!sectionElement) {
                console.error('Section elementi bulunamadı:', sectionId);
                return;
            }
            
            console.log('Section elementi bulundu:', sectionElement);
            
            // Modal içeriğini temizle
            sectionModalContent.innerHTML = '';
            
            // Eğer yazılar section ise, özel işlem yap
            if (sectionId === 'yazilar') {
                console.log('Yazılar section işleniyor...');
                
                // Tüm post-card'ları orijinal section'dan al
                const allPostCards = sectionElement.querySelectorAll('.post-card');
                console.log('Bulunan post-card sayısı:', allPostCards.length);
                
                if (allPostCards.length === 0) {
                    console.error('Post-card bulunamadı!');
                    return;
                }
                
                // Yeni bir div oluştur
                const postsGrid = document.createElement('div');
                postsGrid.className = 'posts-modal-grid';
                postsGrid.style.display = 'grid';
                postsGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
                postsGrid.style.gap = '22px';
                postsGrid.style.width = '100%';
                
                // Tüm post-card'ları kopyala ve grid'e ekle
                allPostCards.forEach((card, index) => {
                    const clonedCard = card.cloneNode(true);
                    clonedCard.removeAttribute('style'); // Tüm inline style'ları temizle
                    clonedCard.style.display = 'block'; // Görünür yap
                    clonedCard.style.visibility = 'visible';
                    clonedCard.style.opacity = '1';
                    postsGrid.appendChild(clonedCard);
                    console.log('Post-card', index + 1, 'eklendi');
                });
                
                // Grid'i modal içine ekle
                sectionModalContent.appendChild(postsGrid);
                console.log('Grid modal içine eklendi');
                
                // Modal içindeki "Devamını oku" linklerine event listener ekle
                setTimeout(() => {
                    const modalLinks = sectionModalContent.querySelectorAll('.post-card__link');
                    modalLinks.forEach(link => {
                        link.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            const card = link.closest('.post-card');
                            const full = card && card.querySelector('.post-card__full');
                            const title = card && card.querySelector('.post-card__title')?.textContent || '';
                            const meta = card && card.querySelector('.post-card__meta')?.textContent || '';
                            
                            if (full) {
                                // Modal içeriğini post-card__full ile değiştir
                                const clonedFull = full.cloneNode(true);
                                clonedFull.removeAttribute('hidden');
                                clonedFull.querySelectorAll('[hidden]').forEach(el => el.removeAttribute('hidden'));
                                
                                // Geri butonu ekle
                                const backButton = document.createElement('button');
                                backButton.className = 'section-modal__back';
                                backButton.innerHTML = '← Geri';
                                backButton.addEventListener('click', function() {
                                    // Grid'i tekrar göster
                                    openSectionModal('yazilar');
                                });
                                
                                // İçerik wrapper'ı oluştur
                                const contentWrapper = document.createElement('div');
                                contentWrapper.className = 'section-modal__post-content';
                                
                                // Başlık ve meta ekle
                                if (title) {
                                    const titleEl = document.createElement('h2');
                                    titleEl.className = 'post-card__title';
                                    titleEl.textContent = title;
                                    titleEl.style.marginTop = '0';
                                    titleEl.style.marginBottom = '8px';
                                    contentWrapper.appendChild(titleEl);
                                }
                                
                                if (meta) {
                                    const metaEl = document.createElement('p');
                                    metaEl.className = 'post-card__meta';
                                    metaEl.textContent = meta;
                                    metaEl.style.marginBottom = '24px';
                                    contentWrapper.appendChild(metaEl);
                                }
                                
                                // İçerik ekle
                                contentWrapper.appendChild(clonedFull);
                                
                                // Modal içeriğini değiştir
                                sectionModalContent.innerHTML = '';
                                sectionModalContent.appendChild(backButton);
                                sectionModalContent.appendChild(contentWrapper);
                            }
                        });
                    });
                }, 100);
            } else {
                // Diğer section'lar için normal kopyalama
                const clonedSection = sectionElement.cloneNode(true);
                sectionModalContent.appendChild(clonedSection);
            }
            
            // Modal'ı göster
            sectionModal.removeAttribute('hidden');
            sectionModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            console.log('Modal gösterildi');
            
            // Scroll'u en üste al
            sectionModal.scrollTop = 0;
        }
        
        // Galeri linkine tıklandığında direkt modal'ı aç
        if (galleryLink) {
            galleryLink.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Mevcut galeri açma butonunu tetikle
                const galleryOpenBtn = document.querySelector('[data-gallery-open]');
                if (galleryOpenBtn) {
                    galleryOpenBtn.click();
                }
            });
        }
        
        // Diğer navigation linkleri için section modal aç
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#') && href !== '#galeri') {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const targetId = href.substring(1);
                    console.log('Link tıklandı:', href, 'targetId:', targetId);
                    openSectionModal(targetId);
                });
            }
        });
        
        // Section modal kapat butonu
        if (sectionModalClose) {
            sectionModalClose.addEventListener('click', closeSectionModal);
        }
        
        // Section modal dışına tıklanınca kapat
        sectionModal.addEventListener('click', function(e) {
            if (e.target === sectionModal) {
                closeSectionModal();
            }
        });
        
        // ESC tuşu ile kapat
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !sectionModal.hasAttribute('hidden')) {
                closeSectionModal();
            }
        });
    }
    
    // DOM hazır olduğunda çalıştır
    console.log('Navigation script yüklendi, readyState:', document.readyState);
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOMContentLoaded event tetiklendi');
            initNavigation();
        });
    } else {
        console.log('DOM zaten hazır, initNavigation çağrılıyor');
        initNavigation();
    }
    
    // Ekstra güvence: window load event'inde de çalıştır
    window.addEventListener('load', function() {
        console.log('Window load event tetiklendi');
        if (!document.querySelector('[data-section-modal]')) {
            console.error('Modal elementi hala bulunamadı!');
        }
    });
})();

// Music Player
(function () {
    const audio = document.getElementById('audio-player');
    const playBtn = document.getElementById('play-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const restartBtn = document.getElementById('restart-btn');
    const progressTrack = document.getElementById('progress-track');
    const progressFill = document.getElementById('progress-fill');
    const progressHandle = document.getElementById('progress-handle');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');
    const playIcon = playBtn.querySelector('.play-icon');
    const pauseIcon = playBtn.querySelector('.pause-icon');
    
    let isDragging = false;
    let isRepeating = false;
    
    // Zamanı mm:ss formatına çevir
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${String(secs).padStart(2, '0')}`;
    }
    
    // Progress bar'ı güncelle
    function updateProgress() {
        if (!audio.duration || isDragging) return;
        
        const percent = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = percent + '%';
        progressHandle.style.left = percent + '%';
        currentTimeEl.textContent = formatTime(audio.currentTime);
    }
    
    // Toplam süreyi göster
    audio.addEventListener('loadedmetadata', function() {
        if (audio.duration && isFinite(audio.duration)) {
            totalTimeEl.textContent = formatTime(audio.duration);
        } else {
            totalTimeEl.textContent = '0:00';
        }
    });
    
    // Audio yükleme hatalarını yakala
    audio.addEventListener('error', function(e) {
        console.error('Audio loading error:', e);
        console.error('Audio error details:', audio.error);
        if (audio.error) {
            console.error('Error code:', audio.error.code);
            console.error('Error message:', audio.error.message);
        }
    });
    
    // Progress güncellemesi
    audio.addEventListener('timeupdate', updateProgress);
    
    // Şarkı bittiğinde - loop özelliği zaten audio.loop ile yönetiliyor
    audio.addEventListener('ended', function() {
        if (!audio.loop) {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    });
    
    // Play/Pause butonu
    playBtn.addEventListener('click', function() {
        if (audio.paused) {
            // Streaming için: Dosya yüklenirken çalmaya başla
            // readyState 2 = HAVE_CURRENT_DATA (yeterli veri var, çalabilir)
            if (audio.readyState >= 2) {
                // Yeterli veri var, direkt çal
                audio.play().catch(err => {
                    console.error('Play error:', err);
                });
            } else {
                // Henüz yeterli veri yok, yükle ve çal
                audio.load();
                // Canplay event'i: Yeterli veri yüklendi, çalabilir
                audio.addEventListener('canplay', function playWhenReady() {
                    audio.removeEventListener('canplay', playWhenReady);
                    audio.play().catch(err => {
                        console.error('Play error:', err);
                    });
                }, { once: true });
            }
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            audio.pause();
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    });
    
    // Repeat butonu - SADECE tekrar modunu aç/kapat, BAŞA SARMAZ!
    repeatBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        isRepeating = !isRepeating;
        repeatBtn.classList.toggle('active', isRepeating);
        audio.loop = isRepeating; // Audio element'in loop özelliğini ayarla
        // DİKKAT: currentTime değiştirmiyoruz, sadece loop açıp kapatıyoruz
    });
    
    // Başa sar butonu - şarkıyı başa al
    if (restartBtn) {
        restartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Audio element'in hazır olduğundan emin ol
            if (audio.readyState >= 2) {
                audio.currentTime = 0;
                updateProgress();
                // Eğer şarkı çalıyorsa, başa döndükten sonra devam etsin
                if (!audio.paused) {
                    audio.play().catch(err => {
                        console.error('Play error:', err);
                    });
                }
            } else {
                // Audio henüz yüklenmemişse, yüklemeyi bekle
                audio.addEventListener('loadedmetadata', function() {
                    audio.currentTime = 0;
                    updateProgress();
                }, { once: true });
                audio.load();
            }
        });
    } else {
        console.error('Restart button not found!');
    }
    
    // Progress bar tıklama
    progressTrack.addEventListener('click', function(e) {
        if (isDragging) return;
        const rect = progressTrack.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audio.currentTime = percent * audio.duration;
        updateProgress();
    });
    
    // Progress bar sürükleme
    progressHandle.addEventListener('mousedown', function(e) {
        isDragging = true;
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        const rect = progressTrack.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        audio.currentTime = percent * audio.duration;
        updateProgress();
    });
    
    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
    
    // Touch desteği (mobil)
    let touchStartX = 0;
    progressTrack.addEventListener('touchstart', function(e) {
        isDragging = true;
        touchStartX = e.touches[0].clientX;
        e.preventDefault();
    });
    
    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        const rect = progressTrack.getBoundingClientRect();
        const touchX = e.touches[0].clientX;
        const percent = Math.max(0, Math.min(1, (touchX - rect.left) / rect.width));
        audio.currentTime = percent * audio.duration;
        updateProgress();
        e.preventDefault();
    });
    
    document.addEventListener('touchend', function() {
        isDragging = false;
    });
    
    // Playlist'e ekle butonu ve dropdown
    const addBtn = document.getElementById('add-btn');
    const addDropdown = document.getElementById('add-dropdown');
    const songTitle = document.getElementById('song-title').textContent;
    
    // Dropdown'ı aç/kapat
    if (addBtn && addDropdown) {
        addBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isHidden = addDropdown.hasAttribute('hidden');
            if (isHidden) {
                addDropdown.removeAttribute('hidden');
            } else {
                addDropdown.setAttribute('hidden', '');
            }
        });
        
        // Dışarı tıklanınca kapat
        document.addEventListener('click', function(e) {
            if (!addDropdown.contains(e.target) && e.target !== addBtn) {
                addDropdown.setAttribute('hidden', '');
            }
        });
        
        // Spotify linki
        const spotifyLink = addDropdown.querySelector('[data-platform="spotify"]');
        if (spotifyLink) {
            spotifyLink.addEventListener('click', function(e) {
                e.preventDefault();
                const searchQuery = encodeURIComponent(songTitle);
                const spotifyURI = `spotify:search:${searchQuery}`;
                const spotifyWebURL = `https://open.spotify.com/search/${searchQuery}`;
                
                // Önce URI'yi dene (uygulama varsa açılır)
                window.location.href = spotifyURI;
                
                // Eğer uygulama yoksa web sayfasını aç
                setTimeout(() => {
                    window.open(spotifyWebURL, '_blank');
                }, 500);
                
                addDropdown.setAttribute('hidden', '');
            });
        }
        
        // Apple Music linki
        const appleLink = addDropdown.querySelector('[data-platform="apple"]');
        if (appleLink) {
            appleLink.addEventListener('click', function(e) {
                e.preventDefault();
                // "Kimse Bilmez" şarkısı için doğrudan sayfa linki
                const appleMusicURL = 'https://music.apple.com/tr/song/kimse-bilmez/1225998206';
                window.open(appleMusicURL, '_blank');
                addDropdown.setAttribute('hidden', '');
            });
        }
    }
})();

// Gizli Buton ve Kartpostal
(function() {
    const hiddenPostcard = document.getElementById('hidden-postcard');
    const hiddenButton = document.getElementById('hidden-button');
    const postcardClose = document.getElementById('postcard-close');
    
    if (hiddenPostcard && hiddenButton && postcardClose) {
        // Gizli butona tıklayınca kartpostalı aç
        hiddenButton.addEventListener('click', function() {
            hiddenPostcard.classList.add('open');
        });
        
        // Kapat butonuna tıklayınca kapat
        postcardClose.addEventListener('click', function(e) {
            e.stopPropagation();
            hiddenPostcard.classList.remove('open');
        });
        
        // Çizgi dışına tıklayınca kapat
        document.addEventListener('click', function(e) {
            if (!hiddenPostcard.contains(e.target) && hiddenPostcard.classList.contains('open')) {
                hiddenPostcard.classList.remove('open');
            }
        });
    }
})();

// Sayfa yüklendiğinde her zaman en üste scroll et
(function() {
    // Hash'i temizle ve en üste scroll et
    if (window.location.hash) {
        // Hash'i temizle ama sayfayı yeniden yükleme
        history.replaceState(null, null, ' ');
    }
    
    // Sayfa yüklendiğinde en üste scroll et
    window.addEventListener('load', function() {
        window.scrollTo(0, 0);
    });
    
    // DOMContentLoaded'da da en üste scroll et (daha hızlı)
    document.addEventListener('DOMContentLoaded', function() {
        window.scrollTo(0, 0);
    });
    
    // Hash değişikliklerini engelle
    window.addEventListener('hashchange', function(e) {
        e.preventDefault();
        window.scrollTo(0, 0);
        // Hash'i temizle
        if (window.location.hash) {
            history.replaceState(null, null, window.location.pathname);
        }
    });
})();

// Posts Slider (Yazılar Slider)
(function() {
    const postsContainer = document.querySelector('.posts-container');
    const postCards = document.querySelectorAll('.post-card[data-post-index]');
    const nextButton = document.getElementById('posts-next-btn');
    const prevButton = document.getElementById('posts-prev-btn');
    
    if (!postsContainer || !postCards.length || !nextButton || !prevButton) return;
    
    let currentIndex = 0; // İlk 3 gönderi görünüyor (0, 1, 2)
    const visibleCount = 3; // Her seferinde 3 gönderi göster
    
    // İlk durumu ayarla: İlk 3 gönderi görünür
    function updateVisiblePosts() {
        postCards.forEach((card, index) => {
            const cardIndex = parseInt(card.getAttribute('data-post-index'));
            
            // İlk 3 gönderi görünür (0, 1, 2)
            if (cardIndex >= currentIndex && cardIndex < currentIndex + visibleCount) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
        
        // Buton görünürlüğünü ayarla
        const totalPosts = postCards.length;
        
        // Geri butonu: İlk gönderilerdeyse gizle
        if (currentIndex === 0) {
            prevButton.style.display = 'none';
        } else {
            prevButton.style.display = 'flex';
        }
        
        // İleri butonu: Son gönderilere ulaştıysak gizle
        if (currentIndex + visibleCount >= totalPosts) {
            nextButton.style.display = 'none';
        } else {
            nextButton.style.display = 'flex';
        }
    }
    
    // İleri butonuna tıklama
    nextButton.addEventListener('click', function() {
        const totalPosts = postCards.length;
        
        // Bir sonraki set'e geç (ilk gönderi kaybolur, sonraki 3 gösterilir)
        if (currentIndex + visibleCount < totalPosts) {
            currentIndex++;
            updateVisiblePosts();
        }
    });
    
    // Geri butonuna tıklama
    prevButton.addEventListener('click', function() {
        // Bir önceki set'e dön (son gönderi kaybolur, önceki 3 gösterilir)
        if (currentIndex > 0) {
            currentIndex--;
            updateVisiblePosts();
        }
    });
    
    // İlk durumu ayarla
    updateVisiblePosts();
})();


