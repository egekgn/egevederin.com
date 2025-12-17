(function () {
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d', { alpha: true });

    let width = 0;
    let height = 0;
    let columns = 0;
    let drops = [];
    let animationFrameId = 0;
    let fontSize = 22; // px, draw ve resize ortak kullanacak
    let lastResizeTime = 0;
    let resizeTimeout = null;

    // Heart rain settings
    const heartSymbol = '❤';

    function resize() {
        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        const newWidth = Math.floor(window.innerWidth);
        const newHeight = Math.floor(window.innerHeight);
        const newColumns = Math.ceil(newWidth / fontSize);
        
        // Eğer sadece küçük bir değişiklik varsa (mobil address bar gibi), drops'u koru
        const widthDiff = Math.abs(newWidth - width);
        const heightDiff = Math.abs(newHeight - height);
        const isSignificantResize = widthDiff > 50 || heightDiff > 50 || columns !== newColumns;
        
        width = newWidth;
        height = newHeight;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Daha belirgin kalpler için emoji fontlarını kullan
        ctx.font = fontSize + 'px Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, JetBrains Mono, monospace';
        
        // Sadece önemli resize'larda drops array'ini yeniden oluştur
        if (isSignificantResize) {
            const oldColumns = columns;
            columns = newColumns;
            
            if (oldColumns === 0) {
                // İlk yükleme
                drops = new Array(columns).fill(0).map(() => Math.floor(Math.random() * -40));
            } else {
                // Mevcut drops'u koru, sadece yeni kolonlar ekle veya fazlalıkları kaldır
                const newDrops = [];
                for (let i = 0; i < columns; i++) {
                    if (i < oldColumns) {
                        // Mevcut drop pozisyonunu koru
                        newDrops[i] = drops[i];
                    } else {
                        // Yeni kolon için rastgele başlangıç pozisyonu
                        newDrops[i] = Math.floor(Math.random() * -40);
                    }
                }
                drops = newDrops;
            }
        } else {
            // Küçük resize'larda sadece columns'u güncelle (drops'u koru)
            columns = newColumns;
            // Eğer columns azaldıysa, fazlalıkları kaldır
            if (drops.length > columns) {
                drops = drops.slice(0, columns);
            }
            // Eğer columns arttıysa, yeni kolonlar ekle
            while (drops.length < columns) {
                drops.push(Math.floor(Math.random() * -40));
            }
        }
    }

    function draw() {
        // fade the canvas slightly to create trails
        ctx.fillStyle = 'rgba(5, 7, 10, 0.14)';
        ctx.fillRect(0, 0, width, height);

        // daha kırmızı ve daha parlayan kalpler
        ctx.fillStyle = '#ff2244';
        ctx.shadowColor = '#ff8899';
        ctx.shadowBlur = 12;
        for (let i = 0; i < columns && i < drops.length; i++) {
            const text = heartSymbol;
            const x = i * fontSize;
            const y = drops[i] * fontSize;
            ctx.fillText(text, x, y);

            // reset drop randomly after it passes bottom
            if (y > height && Math.random() > 0.975) {
                drops[i] = Math.floor(Math.random() * -40);
            }
            // hız: 0.09
            drops[i] += 0.09;
        }
        ctx.shadowBlur = 0;
        animationFrameId = requestAnimationFrame(draw);
    }

    function start() {
        cancelAnimationFrame(animationFrameId);
        draw();
    }

    // Resize event'ini debounce et (mobilde çok sık tetiklenmesini önle)
    window.addEventListener('resize', () => {
        const now = Date.now();
        // Son resize'tan en az 100ms geçmiş olmalı
        if (now - lastResizeTime < 100) {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                resize();
                lastResizeTime = Date.now();
            }, 150);
        } else {
            clearTimeout(resizeTimeout);
            resize();
            lastResizeTime = now;
        }
    });

    // Orientation change için özel handler (mobilde ekran döndürme)
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            resize();
        }, 100);
    });

    // init
    resize();
    start();

    // footer year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();

// Notes Section - "Devamını oku" linkini kontrol et
(function() {
    function checkNoteCards() {
        const noteCards = document.querySelectorAll('.note-card');
        
        noteCards.forEach(card => {
            const content = card.querySelector('.note-card__content');
            const excerpt = card.querySelector('.note-card__excerpt');
            const full = card.querySelector('.note-card__full');
            const link = card.querySelector('.note-card__link');
            
            if (!content || !excerpt || !full || !link) {
                // Eğer link yoksa, hiçbir şey yapma
                return;
            }
            
            // Full içeriğin metnini al
            const fullText = full.textContent.trim();
            const excerptText = excerpt.textContent.trim();
            
            // ScrollHeight ile içeriğin kesilip kesilmediğini kontrol et
            const isOverflowing = excerpt.scrollHeight > excerpt.offsetHeight;
            
            // Full içerik excerpt'tan uzunsa veya içerik kesilmişse link göster
            // ÖNEMLİ: Eğer full içerik excerpt'tan farklıysa (ekstra paragraf varsa) link göster
            const fullHasMoreContent = fullText.length > excerptText.length;
            const fullHasMoreParagraphs = full.querySelectorAll('p').length > excerpt.querySelectorAll('p').length;
            
            if (fullHasMoreContent || isOverflowing || fullHasMoreParagraphs) {
                link.style.display = 'inline-block';
                link.style.visibility = 'visible';
                link.style.opacity = '1';
            } else {
                // Sadece içerik gerçekten aynıysa gizle
                // Ama her zaman link'i göster - kullanıcı tıklayabilir
                link.style.display = 'inline-block';
                link.style.visibility = 'visible';
                link.style.opacity = '1';
            }
        });
    }
    
    // İlk yüklemede ve resize'da kontrol et (debounce ile)
    let checkTimeout;
    function debouncedCheck() {
        clearTimeout(checkTimeout);
        checkTimeout = setTimeout(checkNoteCards, 100);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            checkNoteCards();
            window.addEventListener('resize', debouncedCheck);
        });
    } else {
        checkNoteCards();
        window.addEventListener('resize', debouncedCheck);
    }
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
        // Not kartları için de modal aç
        const noteLink = e.target.closest('.note-card__link');
        if (noteLink) {
            e.preventDefault();
            const noteCard = noteLink.closest('.note-card');
            const noteFull = noteCard && noteCard.querySelector('.note-card__full');
            if (noteFull) {
                const title = noteCard.querySelector('.note-card__title')?.textContent || '';
                const clonedFull = noteFull.cloneNode(true);
                clonedFull.removeAttribute('hidden');
                clonedFull.querySelectorAll('[hidden]').forEach(el => el.removeAttribute('hidden'));
                
                const noteContent = `
                    <h2 style="margin-top: 0; color: var(--text); margin-bottom: 24px; font-weight: 800; text-decoration: underline;">${title}</h2>
                    ${clonedFull.innerHTML}
                `;
                openModal(noteContent);
            }
            return;
        }
        
        const link = e.target.closest('.post-card__link');
        if (!link) return;
        e.preventDefault();
        const card = link.closest('.post-card');
        const full = card && card.querySelector('.post-card__full');
        if (full) {
            // Eğer todo listesi ise, section modal aç (yapilacaklar section'ı)
            const todoList = full.querySelector('.todo-list');
            if (todoList) {
                // Section modal'ı direkt aç
                const sectionModal = document.querySelector('[data-section-modal]');
                const sectionModalContent = document.querySelector('[data-section-modal-content]');
                
                if (sectionModal && sectionModalContent) {
                    const yapilacaklarSection = document.getElementById('yapilacaklar');
                    if (yapilacaklarSection) {
                        sectionModalContent.innerHTML = '';
                        const clonedSection = yapilacaklarSection.cloneNode(true);
                        
                        // Modal içindeki "Devamını oku" linkini kaldır veya devre dışı bırak
                        const clonedLink = clonedSection.querySelector('.post-card__link');
                        if (clonedLink) {
                            clonedLink.style.display = 'none';
                        }
                        
                        // post-card__full içeriğini göster
                        const clonedFull = clonedSection.querySelector('.post-card__full');
                        if (clonedFull) {
                            clonedFull.removeAttribute('hidden');
                            clonedFull.style.display = 'block';
                        }
                        
                        sectionModalContent.appendChild(clonedSection);
                        sectionModal.removeAttribute('hidden');
                        sectionModal.style.display = 'block';
                        document.body.style.overflow = 'hidden';
                        sectionModal.scrollTop = 0;
                    }
                } else {
                    // Fallback: Eski modal açma yöntemi
                    const title = card.querySelector('.post-card__title')?.textContent || 'Yapılacaklar Listesi';
                    const meta = card.querySelector('.post-card__meta')?.textContent || '';
                    
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
                    
                    const todoContent = `
                        <h2 style="margin-top: 0; color: var(--text); margin-bottom: 8px; font-weight: 800;">${title}</h2>
                        ${meta ? `<p style="color: var(--muted); margin-bottom: 24px;">${meta}</p>` : ''}
                        <div class="todo-list">${todoItemsHTML}</div>
                    `;
                    openModal(todoContent);
                }
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

    // Galeri verilerini hazırla (HTML'de zaten var, sadece data hazırla)
    function initGallery() {
        // Inline data'dan galeri bilgilerini al
        if (window.galleryData && window.galleryData.photos) {
            galleryData = window.galleryData.photos;
            galleryImages = galleryData.map(photo => photo.filename);
        }
        
        // HTML'deki galeri modal item'larına click event ekle
        if (galleryContent) {
            const galleryItems = galleryContent.querySelectorAll('.gallery-modal__item');
            galleryItems.forEach((item, index) => {
                item.style.cursor = 'pointer';
                item.addEventListener('click', () => openPhotoViewer(index));
            });
        }
        
        // Preview görsellerine click event ekle
        if (galleryPreview) {
            const previewImages = galleryPreview.querySelectorAll('.gallery-bubble__image');
            previewImages.forEach((container, index) => {
                container.style.cursor = 'pointer';
                container.addEventListener('click', () => openPhotoViewer(index));
            });
        }
    }

    // Galeri modal'ını aç (HTML'de zaten var, sadece göster)
    function openGallery() {
        if (!galleryModal) return;
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
        if (!photo) return;
        
        photoViewerImage.innerHTML = '';
        
        // HTML'deki mevcut img elementini al veya yeni oluştur
        const galleryItem = galleryContent.querySelector(`[data-photo-index="${currentPhotoIndex}"]`);
        const existingImg = galleryItem ? galleryItem.querySelector('img') : null;
        
        const img = existingImg ? existingImg.cloneNode(true) : document.createElement('img');
        img.loading = 'eager';
        img.fetchPriority = 'high';
        img.decoding = 'async';
        
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

    // İlk yüklemede galeriyi hazırla - DOM hazır olduğunda
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGallery);
    } else {
        // DOM zaten hazırsa hemen hazırla
        initGallery();
    }
})();

// Mobile Navigation (Hamburger Menu)
(function() {
    const navToggle = document.getElementById('nav-toggle');
    const mainNav = document.getElementById('main-nav');
    const navOverlay = document.createElement('div');
    navOverlay.className = 'nav-overlay';
    // Overlay'i menüden ÖNCE DOM'a ekle (z-index hiyerarşisi için önemli)
    // Menü DOM'da overlay'den SONRA olmalı ki z-index ile üstte görünsün
    if (mainNav && mainNav.parentNode) {
        mainNav.parentNode.insertBefore(navOverlay, mainNav);
    } else {
        document.body.insertBefore(navOverlay, document.body.firstChild);
    }
    
    function toggleNav() {
        if (navToggle && mainNav) {
            const isOpening = !mainNav.classList.contains('active');
            navToggle.classList.toggle('active');
            mainNav.classList.toggle('active');
            navOverlay.classList.toggle('active');
            document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
            // Menü açıkken body'ye class ekle (ana içeriği tıklanamaz yapmak için)
            if (isOpening) {
                document.body.classList.add('menu-open');
            } else {
                document.body.classList.remove('menu-open');
            }
        }
    }
    
    function closeNav() {
        if (navToggle && mainNav) {
            navToggle.classList.remove('active');
            mainNav.classList.remove('active');
            navOverlay.classList.remove('active');
            document.body.style.overflow = '';
            document.body.classList.remove('menu-open');
        }
    }
    
    if (navToggle) {
        // Click event
        navToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleNav();
        });
        
        // Touch event for mobile
        navToggle.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleNav();
        }, { passive: false });
    }
    
    // Overlay'e tıklanınca menüyü kapat
    navOverlay.addEventListener('click', closeNav);
    
    // Menü linklerine tıklanınca menüyü kapat
    if (mainNav) {
        mainNav.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                e.stopPropagation(); // Event propagation'ı durdur - overlay'e gitmemeli
                closeNav();
                // Link'in doğal davranışı (scroll) çalışacak
            }
        });
    }
    
    // ESC tuşu ile menüyü kapat
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mainNav && mainNav.classList.contains('active')) {
            closeNav();
        }
    });
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
            document.body.style.overflow = ''; // Body overflow'u eski haline getir
        }
        
        // Section modal'ı aç
        function openSectionModal(sectionId) {
            console.log('openSectionModal çağrıldı:', sectionId);
            
            // Body overflow'u kapat - tam ekran modal için
            document.body.style.overflow = 'hidden';
            
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
        };
        
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

// Music Player - SIFIRDAN YENİDEN KURULDU
(function () {
    // TEK audio instance - ilk click'te oluşturulacak
    let audio = null;
    const audioSrc = 'mehmet-gureli-kimse-bilmez.mp3';
    
    let isDragging = false;
    let isRepeating = false;
    
    // Audio instance'ı oluştur (ilk click'te)
    function initAudio() {
        if (!audio) {
            audio = new Audio(audioSrc);
            audio.preload = 'metadata';
            audio.crossOrigin = 'anonymous';
            
            // Audio event listener'ları
            audio.addEventListener('loadedmetadata', function() {
                const duration = audio.duration && isFinite(audio.duration) ? formatTime(audio.duration) : '0:00';
                document.querySelectorAll('#total-time').forEach(el => {
                    el.textContent = duration;
                });
            });
            
            audio.addEventListener('timeupdate', updateProgress);
            
            audio.addEventListener('play', function() {
                updatePlayButtonIcons(true);
            });
            
            audio.addEventListener('pause', function() {
                updatePlayButtonIcons(false);
            });
            
            audio.addEventListener('ended', function() {
                if (!audio.loop) {
                    updatePlayButtonIcons(false);
                }
            });
            
            audio.addEventListener('error', function(e) {
                console.error('Audio error:', e);
                if (audio.error) {
                    console.error('Error code:', audio.error.code);
                    console.error('Error message:', audio.error.message);
                }
            });
        }
        return audio;
    }
    
    // Zamanı mm:ss formatına çevir
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${String(secs).padStart(2, '0')}`;
    }
    
    // Progress bar'ı güncelle
    function updateProgress() {
        if (!audio || !audio.duration || isDragging) return;
        
        const percent = (audio.currentTime / audio.duration) * 100;
        document.querySelectorAll('#progress-fill').forEach(fill => {
            fill.style.width = percent + '%';
        });
        document.querySelectorAll('#progress-handle').forEach(handle => {
            handle.style.left = percent + '%';
        });
        document.querySelectorAll('#current-time').forEach(el => {
            el.textContent = formatTime(audio.currentTime);
        });
    }
    
    // Play button icon'larını güncelle
    function updatePlayButtonIcons(playing) {
        document.querySelectorAll('#play-btn .play-icon').forEach(icon => {
            icon.style.display = playing ? 'none' : 'block';
        });
        document.querySelectorAll('#play-btn .pause-icon').forEach(icon => {
            icon.style.display = playing ? 'block' : 'none';
        });
    }
    
    // PLAY/PAUSE - Event delegation
    function handlePlayClick(e) {
        const clickedBtn = e.target.closest('#play-btn');
        if (!clickedBtn) return;
        
        if (e.type === 'touchend') {
            e.preventDefault();
        }
        e.stopPropagation();
        
        // Audio instance'ı oluştur (ilk click'te)
        const audioInstance = initAudio();
        
        // Toggle: audio.paused üzerinden kontrol et
        if (audioInstance.paused) {
            // PLAY
            try {
                audioInstance.play().then(() => {
                    console.log('Audio playing');
                }).catch(err => {
                    console.error('Play error:', err);
                });
            } catch (err) {
                console.error('Play error:', err);
            }
        } else {
            // PAUSE
            audioInstance.pause();
        }
    }
    
    // REPEAT - Event delegation
    function handleRepeatClick(e) {
        const clickedBtn = e.target.closest('#repeat-btn');
        if (!clickedBtn) return;
        
        if (e.type === 'touchend') {
            e.preventDefault();
        }
        e.stopPropagation();
        
        if (!audio) initAudio();
        
        isRepeating = !isRepeating;
        audio.loop = isRepeating;
        
        document.querySelectorAll('#repeat-btn').forEach(btn => {
            btn.classList.toggle('active', isRepeating);
        });
    }
    
    // RESTART - Event delegation
    function handleRestartClick(e) {
        const clickedBtn = e.target.closest('#restart-btn');
        if (!clickedBtn) return;
        
        if (e.type === 'touchend') {
            e.preventDefault();
        }
        e.stopPropagation();
        
        if (!audio) initAudio();
        
        const wasPlaying = !audio.paused;
        audio.currentTime = 0;
        updateProgress();
        
        if (wasPlaying) {
            try {
                audio.play().catch(err => {
                    console.error('Play error after restart:', err);
                });
            } catch (err) {
                console.error('Play error after restart:', err);
            }
        }
    }
    
    // PROGRESS CLICK - Event delegation
    function handleProgressClick(e) {
        const clickedTrack = e.target.closest('#progress-track');
        if (!clickedTrack || isDragging) return;
        
        if (e.type === 'touchend') {
            e.preventDefault();
        }
        e.stopPropagation();
        
        if (!audio) initAudio();
        
        const rect = clickedTrack.getBoundingClientRect();
        const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : 
                       (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : 
                       e.clientX;
        const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        audio.currentTime = percent * audio.duration;
        updateProgress();
    }
    
    // PROGRESS DRAG - Event delegation
    function handleProgressDragStart(e) {
        const clickedHandle = e.target.closest('#progress-handle');
        if (!clickedHandle) return;
        
        isDragging = true;
        e.preventDefault();
    }
    
    function handleProgressDrag(e) {
        if (!isDragging || !audio) return;
        
        const allTracks = document.querySelectorAll('#progress-track');
        if (allTracks.length > 0) {
            const firstTrack = allTracks[0];
            const rect = firstTrack.getBoundingClientRect();
            const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
            const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            audio.currentTime = percent * audio.duration;
            updateProgress();
        }
    }
    
    function handleProgressDragEnd() {
        isDragging = false;
    }
    
    // ADD BUTTON - Event delegation - SIFIRDAN YENİDEN İNŞA EDİLDİ
    
    // Portal dropdown için body'de container oluştur
    let portalContainer = null;
    function getPortalContainer() {
        // Eğer zaten DOM'da varsa onu kullan
        if (!portalContainer) {
            const existing = document.getElementById('dropdown-portal-container');
            if (existing) {
                portalContainer = existing;
            } else {
                portalContainer = document.createElement('div');
                portalContainer.id = 'dropdown-portal-container';
                portalContainer.style.position = 'fixed';
                portalContainer.style.top = '0';
                portalContainer.style.left = '0';
                portalContainer.style.width = '0';
                portalContainer.style.height = '0';
                portalContainer.style.pointerEvents = 'none';
                portalContainer.style.zIndex = '99999999';
                document.body.appendChild(portalContainer);
            }
        }
        return portalContainer;
    }
    
    // Orijinal dropdown'ların referanslarını sakla (geri koymak için)
    const originalDropdowns = new Map();
    
    function closeAllDropdowns() {
        // Tüm dropdown'ları kapat
        document.querySelectorAll('#add-dropdown').forEach(dropdown => {
            dropdown.setAttribute('hidden', '');
            
            // Eğer portal'da ise, orijinal yerine geri koy
            if (originalDropdowns.has(dropdown)) {
                const originalParent = originalDropdowns.get(dropdown);
                if (dropdown.parentNode !== originalParent) {
                    originalParent.appendChild(dropdown);
                }
                originalDropdowns.delete(dropdown);
            }
            
            // Inline style'ları temizle
            dropdown.style.position = '';
            dropdown.style.top = '';
            dropdown.style.right = '';
            dropdown.style.bottom = '';
            dropdown.style.left = '';
            dropdown.style.maxWidth = '';
            dropdown.style.minWidth = '';
            dropdown.style.width = '';
            dropdown.style.height = '';
            dropdown.style.overflow = '';
            dropdown.style.maxHeight = '';
            dropdown.style.zIndex = '';
            dropdown.style.transform = '';
            dropdown.style.opacity = '';
            dropdown.style.pointerEvents = '';
        });
        
        // Portal container'ı temizle ve pointer-events'i kapat
        if (portalContainer) {
            portalContainer.innerHTML = '';
            portalContainer.style.pointerEvents = 'none';
        }
    }
    
    function handleAddButtonClick(e) {
        const clickedBtn = e.target.closest('#add-btn');
        if (!clickedBtn) return;
        
        if (e.type === 'touchend') {
            e.preventDefault();
        }
        e.stopPropagation();
        
        const musicPlayer = clickedBtn.closest('.music-player');
        if (!musicPlayer) return;
        
        const addDropdown = musicPlayer.querySelector('#add-dropdown');
        if (!addDropdown) return;
        
        const isHidden = addDropdown.hasAttribute('hidden');
        const isInSectionModal = musicPlayer.closest('.section-modal') !== null;
        const isMobile = window.innerWidth <= 768;
        
        if (isHidden) {
            // Önce tüm dropdown'ları kapat
            closeAllDropdowns();
            
            // Mobilde ve anasayfada (section-modal dışında) ise portal kullan
            if (isMobile && !isInSectionModal) {
                // Orijinal parent'ı sakla
                originalDropdowns.set(addDropdown, addDropdown.parentNode);
                
                // Portal container'a taşı
                const portal = getPortalContainer();
                portal.appendChild(addDropdown);
                
                // Buton pozisyonunu al
                const btnRect = clickedBtn.getBoundingClientRect();
                
                // Dropdown'u butonun altına konumlandır (fixed positioning)
                addDropdown.style.position = 'fixed';
                addDropdown.style.top = (btnRect.bottom + 10) + 'px';
                addDropdown.style.right = (window.innerWidth - btnRect.right) + 'px';
                addDropdown.style.left = 'auto';
                addDropdown.style.bottom = 'auto';
                addDropdown.style.zIndex = '99999999';
                addDropdown.style.pointerEvents = 'all';
                addDropdown.style.transform = 'translateY(0)'; // Animasyon için
                addDropdown.style.opacity = '1'; // Görünür yap
                
                // Portal container'ı aktif et
                portal.style.pointerEvents = 'all';
            }
            
            // Dropdown'u göster
            addDropdown.removeAttribute('hidden');
        } else {
            // Dropdown zaten açık, kapat
            closeAllDropdowns();
        }
    }
    
    // SPOTIFY LINK - Event delegation
    function handleSpotifyClick(e) {
        const spotifyLink = e.target.closest('[data-platform="spotify"]');
        if (!spotifyLink) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const musicPlayer = spotifyLink.closest('.music-player');
        const songTitleEl = musicPlayer ? musicPlayer.querySelector('#song-title') : null;
        const title = songTitleEl ? songTitleEl.textContent : 'Kimse Bilmez';
        
        const searchQuery = encodeURIComponent(title);
        const spotifyURI = `spotify:search:${searchQuery}`;
        const spotifyWebURL = `https://open.spotify.com/search/${searchQuery}`;
        
        window.location.href = spotifyURI;
        setTimeout(() => {
            window.open(spotifyWebURL, '_blank');
        }, 500);
        
        // Dropdown'u kapat (overlay ve body scroll'u da temizle)
        closeAllDropdowns();
    }
    
    // APPLE MUSIC LINK - Event delegation
    function handleAppleClick(e) {
        const appleLink = e.target.closest('[data-platform="apple"]');
        if (!appleLink) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const appleMusicURL = 'https://music.apple.com/tr/song/kimse-bilmez/1225998206';
        window.open(appleMusicURL, '_blank');
        
        // Dropdown'u kapat (overlay ve body scroll'u da temizle)
        closeAllDropdowns();
    }
    
    // Event delegation - Tüm butonlar için
    document.addEventListener('click', handlePlayClick, true);
    document.addEventListener('touchend', handlePlayClick, { passive: false, capture: true });
    
    document.addEventListener('click', handleRepeatClick, true);
    document.addEventListener('touchend', handleRepeatClick, { passive: false, capture: true });
    
    document.addEventListener('click', handleRestartClick, true);
    document.addEventListener('touchend', handleRestartClick, { passive: false, capture: true });
    
    document.addEventListener('click', handleProgressClick, true);
    document.addEventListener('touchend', handleProgressClick, { passive: false, capture: true });
    
    document.addEventListener('mousedown', handleProgressDragStart, true);
    document.addEventListener('touchstart', handleProgressDragStart, { passive: false, capture: true });
    document.addEventListener('mousemove', handleProgressDrag, true);
    document.addEventListener('touchmove', handleProgressDrag, { passive: false, capture: true });
    document.addEventListener('mouseup', handleProgressDragEnd, true);
    document.addEventListener('touchend', handleProgressDragEnd, true);
    
    document.addEventListener('click', handleAddButtonClick, true);
    document.addEventListener('touchend', handleAddButtonClick, { passive: false, capture: true });
    
    document.addEventListener('click', handleSpotifyClick, true);
    document.addEventListener('touchend', handleSpotifyClick, { passive: false, capture: true });
    
    document.addEventListener('click', handleAppleClick, true);
    document.addEventListener('touchend', handleAppleClick, { passive: false, capture: true });
    
    // Dışarı tıklanınca dropdown'ları kapat
    document.addEventListener('click', function(e) {
        const clickedAddBtn = e.target.closest('#add-btn');
        const clickedDropdown = e.target.closest('#add-dropdown');
        const clickedPortal = e.target.closest('#dropdown-portal-container');
        
        // Eğer buton, dropdown veya portal'a tıklanmadıysa kapat
        if (!clickedAddBtn && !clickedDropdown && !clickedPortal) {
            closeAllDropdowns();
        }
    });
    
    // Touch event için de aynı
    document.addEventListener('touchend', function(e) {
        const clickedAddBtn = e.target.closest('#add-btn');
        const clickedDropdown = e.target.closest('#add-dropdown');
        const clickedPortal = e.target.closest('#dropdown-portal-container');
        
        if (!clickedAddBtn && !clickedDropdown && !clickedPortal) {
            closeAllDropdowns();
        }
    }, { passive: true });
    
    // ESC tuşu ile dropdown'u kapat
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openDropdown = document.querySelector('#add-dropdown:not([hidden])');
            if (openDropdown) {
                closeAllDropdowns();
            }
        }
    });
    
    // Resize ve scroll'da portal dropdown pozisyonunu güncelle
    function updatePortalDropdownPosition() {
        const portal = getPortalContainer();
        const dropdown = portal.querySelector('#add-dropdown:not([hidden])');
        if (!dropdown) return;
        
        // Orijinal butonu bul
        const musicPlayer = document.querySelector('.music-player-section .music-player');
        if (!musicPlayer) return;
        
        const addBtn = musicPlayer.querySelector('#add-btn');
        if (!addBtn) return;
        
        const btnRect = addBtn.getBoundingClientRect();
        
        // Dropdown pozisyonunu güncelle
        dropdown.style.top = (btnRect.bottom + 10) + 'px';
        dropdown.style.right = (window.innerWidth - btnRect.right) + 'px';
    }
    
    // Resize ve scroll event'lerinde pozisyonu güncelle
    let updateTimeout;
    function debouncedUpdate() {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(updatePortalDropdownPosition, 10);
    }
    
    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('scroll', debouncedUpdate, true);
})();

// Gizli Buton ve Kartpostal
(function() {
    // DOM hazır olduğunda çalıştır
    function initHiddenPostcard() {
        const hiddenPostcard = document.getElementById('hidden-postcard');
        const hiddenButton = document.getElementById('hidden-button');
        const postcardClose = document.getElementById('postcard-close');
        const siteHeader = document.querySelector('.site-header');
        const brandLogo = document.querySelector('.brand__logo');
        
        if (!hiddenPostcard || !hiddenButton || !postcardClose) {
            return;
        }
        
        // Header yüksekliğini ve buton genişliğini ayarla
        function updatePostcardDimensions() {
            if (siteHeader) {
                // Header'ın gerçek yüksekliğini al (padding + border + içerik)
                const headerHeight = siteHeader.offsetHeight;
                hiddenPostcard.style.height = headerHeight + 'px';
            }
            
            // ">" işaretine kadar genişlik hesapla
            if (brandLogo) {
                const brandRect = brandLogo.getBoundingClientRect();
                const buttonWidth = brandRect.left + brandRect.width;
                // Tıklanabilir alanı ">" işaretine kadar genişlet
                hiddenButton.style.paddingRight = (buttonWidth + 5) + 'px';
                hiddenButton.style.marginRight = '-' + (buttonWidth + 5) + 'px';
            }
        }
        
        // İlk yüklemede ve resize'da güncelle (debounce ile)
        updatePostcardDimensions();
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                updatePostcardDimensions();
            }, 100);
        });
        
        // Gizli postcard'ın görünürlüğünü kontrol et
        function updatePostcardVisibility() {
            // Eğer section modal açıksa veya normal modal açıksa gizle
            const sectionModal = document.querySelector('[data-section-modal]');
            const modalOverlay = document.querySelector('[data-modal-overlay]');
            const galleryModal = document.querySelector('[data-gallery-modal]');
            const photoViewer = document.querySelector('[data-photo-viewer]');
            
            const isModalOpen = (sectionModal && !sectionModal.hasAttribute('hidden')) ||
                               (modalOverlay && !modalOverlay.hasAttribute('hidden')) ||
                               (galleryModal && !galleryModal.hasAttribute('hidden')) ||
                               (photoViewer && !photoViewer.hasAttribute('hidden'));
            
            if (isModalOpen) {
                hiddenPostcard.style.display = 'none';
            } else {
                hiddenPostcard.style.display = 'flex';
            }
        }
        
        // İlk yüklemede kontrol et
        updatePostcardVisibility();
        
        // Modal açılıp kapandığında kontrol et
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'hidden') {
                    updatePostcardVisibility();
                }
            });
        });
        
        // Tüm modal'ları izle
        const sectionModal = document.querySelector('[data-section-modal]');
        const modalOverlay = document.querySelector('[data-modal-overlay]');
        const galleryModal = document.querySelector('[data-gallery-modal]');
        const photoViewer = document.querySelector('[data-photo-viewer]');
        
        if (sectionModal) observer.observe(sectionModal, { attributes: true, attributeFilter: ['hidden'] });
        if (modalOverlay) observer.observe(modalOverlay, { attributes: true, attributeFilter: ['hidden'] });
        if (galleryModal) observer.observe(galleryModal, { attributes: true, attributeFilter: ['hidden'] });
        if (photoViewer) observer.observe(photoViewer, { attributes: true, attributeFilter: ['hidden'] });
        
        // Kartpostalı açma fonksiyonu
        function openPostcard(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            hiddenPostcard.classList.add('open');
        }
        
        // Gizli butona tıklayınca/touch ile kartpostalı aç (mobil desteği)
        hiddenButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            openPostcard(e);
        }, { capture: true });
        
        // Mobil için touch event'leri - daha agresif yaklaşım
        let touchStartTime = 0;
        let touchStartY = 0;
        let touchStartX = 0;
        
        hiddenButton.addEventListener('touchstart', function(e) {
            touchStartTime = Date.now();
            if (e.touches && e.touches[0]) {
                touchStartY = e.touches[0].clientY;
                touchStartX = e.touches[0].clientX;
            }
            e.stopPropagation();
        }, { passive: true, capture: true });
        
        hiddenButton.addEventListener('touchend', function(e) {
            const touchDuration = Date.now() - touchStartTime;
            let touchMoved = false;
            
            if (e.changedTouches && e.changedTouches[0]) {
                const touchEndY = e.changedTouches[0].clientY;
                const touchEndX = e.changedTouches[0].clientX;
                const deltaY = Math.abs(touchEndY - touchStartY);
                const deltaX = Math.abs(touchEndX - touchStartX);
                // 10px'den fazla hareket varsa scroll olarak kabul et
                touchMoved = (deltaY > 10 || deltaX > 10);
            }
            
            // Çok kısa dokunma (tap) ise ve scroll değilse aç
            if (touchDuration < 300 && !touchMoved) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                openPostcard(e);
            }
        }, { passive: false, capture: true });
        
        // Kapat butonuna tıklayınca kapat
        postcardClose.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            hiddenPostcard.classList.remove('open');
        });
        
        postcardClose.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            hiddenPostcard.classList.remove('open');
        }, { passive: false });
        
        // Çizgi dışına tıklayınca kapat
        document.addEventListener('click', function(e) {
            if (!hiddenPostcard.contains(e.target) && hiddenPostcard.classList.contains('open')) {
                hiddenPostcard.classList.remove('open');
            }
        });
        
        // Mobil için touch event ile dışarı tıklama
        document.addEventListener('touchend', function(e) {
            if (!hiddenPostcard.contains(e.target) && hiddenPostcard.classList.contains('open')) {
                hiddenPostcard.classList.remove('open');
            }
        });
        
    }
    
    // DOM hazır olduğunda çalıştır
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHiddenPostcard);
    } else {
        initHiddenPostcard();
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

// Posts Slider (Yazılar Slider) - Mobilde carousel/swipe desteği ile
(function() {
    const postsContainer = document.querySelector('.posts-container');
    const postCards = document.querySelectorAll('.post-card[data-post-index]');
    const nextButton = document.getElementById('posts-next-btn');
    const prevButton = document.getElementById('posts-prev-btn');
    
    // Mobil butonlar
    const nextButtonMobile = document.getElementById('posts-next-btn-mobile');
    const prevButtonMobile = document.getElementById('posts-prev-btn-mobile');
    const dotsContainer = document.getElementById('posts-nav-dots');
    const navMobile = document.getElementById('posts-nav-mobile');
    
    if (!postsContainer || !postCards.length || !nextButton || !prevButton) return;
    
    let currentIndex = 0;
    const isMobile = () => window.innerWidth <= 768;
    const visibleCount = () => isMobile() ? 1 : 3;
    
    // Mobilde swipe için değişkenler
    let touchStartX = 0;
    let touchEndX = 0;
    let isDragging = false;
    
    // Mobilde dots oluştur
    function createDots() {
        if (!dotsContainer || !isMobile()) return;
        
        dotsContainer.innerHTML = '';
        const totalPages = postCards.length;
        
        for (let i = 0; i < totalPages; i++) {
            const dot = document.createElement('div');
            dot.className = 'posts-nav-mobile__dot';
            if (i === currentIndex) {
                dot.classList.add('active');
            }
            dot.addEventListener('click', function() {
                goToIndex(i);
            });
            dotsContainer.appendChild(dot);
        }
    }
    
    // Belirli bir index'e git
    function goToIndex(index) {
        if (index < 0 || index >= postCards.length) return;
        
        currentIndex = index;
        updateVisiblePosts();
    }
    
    // Görünümü güncelle
    function updateVisiblePosts() {
        const mobile = isMobile();
        const count = visibleCount();
        
        if (mobile) {
            // Mobilde: Kartları yan yana göster, scroll ile geçiş
            postCards.forEach((card, index) => {
                const cardIndex = parseInt(card.getAttribute('data-post-index'));
                card.style.display = 'block';
            });
            
            // Container'ı scroll et - doğru kartı göster (ortalanmış)
            if (postsContainer && currentIndex < postCards.length) {
                const targetCard = postCards[currentIndex];
                if (targetCard) {
                    // Scroll pozisyonunu hesapla - kartı ortala
                    const containerWidth = postsContainer.offsetWidth;
                    const cardWidth = targetCard.offsetWidth;
                    const cardLeft = targetCard.offsetLeft;
                    const scrollLeft = cardLeft - (containerWidth - cardWidth) / 2;
                    postsContainer.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
                }
            }
        } else {
            // Desktop'ta: Eski mantık
            postCards.forEach((card, index) => {
                const cardIndex = parseInt(card.getAttribute('data-post-index'));
                
                if (cardIndex >= currentIndex && cardIndex < currentIndex + count) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }
        
        // Buton görünürlüğünü ayarla
        const totalPosts = postCards.length;
        const maxIndex = mobile ? totalPosts - 1 : totalPosts - count;
        
        // Desktop butonları
        if (currentIndex === 0) {
            prevButton.style.display = 'none';
        } else {
            prevButton.style.display = 'flex';
        }
        
        if (currentIndex >= maxIndex) {
            nextButton.style.display = 'none';
        } else {
            nextButton.style.display = 'flex';
        }
        
        // Mobil butonları
        if (prevButtonMobile && nextButtonMobile) {
            prevButtonMobile.disabled = currentIndex === 0;
            nextButtonMobile.disabled = currentIndex >= maxIndex;
        }
        
        // Dots güncelle
        if (dotsContainer && isMobile()) {
            const dots = dotsContainer.querySelectorAll('.posts-nav-mobile__dot');
            dots.forEach((dot, index) => {
                if (index === currentIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }
    }
    
    // Navigate fonksiyonu
    function goNext() {
        const mobile = isMobile();
        const maxIndex = mobile ? postCards.length - 1 : postCards.length - visibleCount();
        
        if (currentIndex < maxIndex) {
            currentIndex++;
            updateVisiblePosts();
        }
    }
    
    function goPrev() {
        if (currentIndex > 0) {
            currentIndex--;
            updateVisiblePosts();
        }
    }
    
    // Mobilde swipe desteği
    function handleTouchStart(e) {
        if (!isMobile()) return;
        touchStartX = e.touches[0].clientX;
        isDragging = true;
    }
    
    function handleTouchMove(e) {
        if (!isMobile() || !isDragging) return;
        // Scroll'u engelleme - sadece swipe için
    }
    
    function handleTouchEnd(e) {
        if (!isMobile() || !isDragging) return;
        isDragging = false;
        
        touchEndX = e.changedTouches[0].clientX;
        const swipeDistance = touchStartX - touchEndX;
        const minSwipeDistance = 50; // Minimum kaydırma mesafesi
        
        if (Math.abs(swipeDistance) > minSwipeDistance) {
            if (swipeDistance > 0) {
                // Sola kaydırma - sonraki
                goNext();
            } else {
                // Sağa kaydırma - önceki
                goPrev();
            }
        }
    }
    
    // Scroll event'i - hangi kart görünüyorsa onu aktif yap (ortalanmış kontrol)
    let scrollTimeout;
    function handleScroll() {
        if (!isMobile()) return;
        
        // Debounce scroll event
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const containerRect = postsContainer.getBoundingClientRect();
            const containerCenter = containerRect.left + containerRect.width / 2;
            let closestIndex = 0;
            let closestDistance = Infinity;
            
            postCards.forEach((card, index) => {
                const cardRect = card.getBoundingClientRect();
                const cardCenter = cardRect.left + cardRect.width / 2;
                const distance = Math.abs(cardCenter - containerCenter);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = index;
                }
            });
            
            // Sadece index değiştiyse güncelle (sonsuz döngüyü önlemek için)
            if (closestIndex !== currentIndex) {
                currentIndex = closestIndex;
                // updateVisiblePosts() çağrılmayacak - sadece dots güncellenecek
                if (dotsContainer) {
                    const dots = dotsContainer.querySelectorAll('.posts-nav-mobile__dot');
                    dots.forEach((dot, index) => {
                        if (index === currentIndex) {
                            dot.classList.add('active');
                        } else {
                            dot.classList.remove('active');
                        }
                    });
                }
                
                // Buton durumlarını güncelle
                const maxIndex = postCards.length - 1;
                if (prevButtonMobile && nextButtonMobile) {
                    prevButtonMobile.disabled = currentIndex === 0;
                    nextButtonMobile.disabled = currentIndex >= maxIndex;
                }
            }
        }, 150);
    }
    
    // Desktop butonları
    nextButton.addEventListener('click', goNext);
    prevButton.addEventListener('click', goPrev);
    
    // Mobil butonları
    if (nextButtonMobile) {
        nextButtonMobile.addEventListener('click', goNext);
    }
    if (prevButtonMobile) {
        prevButtonMobile.addEventListener('click', goPrev);
    }
    
    // Mobilde swipe event'leri - her zaman ekle, içeride kontrol edilecek
    if (postsContainer) {
        postsContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
        postsContainer.addEventListener('touchmove', handleTouchMove, { passive: true });
        postsContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
        postsContainer.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    // Window resize için dots'ları yeniden oluştur
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            createDots();
            updateVisiblePosts();
            
            // Mobilde resize sonrası scroll pozisyonunu düzelt (ortalanmış)
            if (isMobile() && postsContainer && currentIndex < postCards.length) {
                const targetCard = postCards[currentIndex];
                if (targetCard) {
                    // Kartı ortala
                    const containerWidth = postsContainer.offsetWidth;
                    const cardWidth = targetCard.offsetWidth;
                    const cardLeft = targetCard.offsetLeft;
                    const scrollLeft = cardLeft - (containerWidth - cardWidth) / 2;
                    postsContainer.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'auto' });
                }
            }
        }, 250);
    });
    
    // İlk durumu ayarla
    createDots();
    updateVisiblePosts();
    
    // İlk yüklemede mobilde doğru pozisyona scroll et (ortalanmış)
    if (isMobile() && postsContainer) {
        setTimeout(() => {
            if (currentIndex < postCards.length) {
                const targetCard = postCards[currentIndex];
                if (targetCard) {
                    // Kartı ortala
                    const containerWidth = postsContainer.offsetWidth;
                    const cardWidth = targetCard.offsetWidth;
                    const cardLeft = targetCard.offsetLeft;
                    const scrollLeft = cardLeft - (containerWidth - cardWidth) / 2;
                    postsContainer.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'auto' });
                }
            }
        }, 150);
    }
})();


