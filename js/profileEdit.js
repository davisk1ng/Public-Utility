import { supabase } from './supabase.js';

// ── Avatar Crop Helper ──
function openCropModal(file) {
    return new Promise((resolve, reject) => {
        const modal      = document.getElementById('avatarCropModal');
        const canvas     = document.getElementById('cropCanvas');
        const zoomSlider = document.getElementById('cropZoomSlider');
        const confirmBtn = document.getElementById('cropConfirmBtn');
        const cancelBtn  = document.getElementById('cropCancelBtn');
        const backdrop   = modal.querySelector('.crop-modal-backdrop');
        const viewport   = modal.querySelector('.crop-viewport');
        const ctx        = canvas.getContext('2d');

        const SIZE = viewport.clientWidth || 300;
        canvas.width = SIZE;
        canvas.height = SIZE;

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        let zoom = 1;
        let offsetX = 0;
        let offsetY = 0;
        let dragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let startOffX = 0;
        let startOffY = 0;

        function draw() {
            ctx.clearRect(0, 0, SIZE, SIZE);
            const scale = Math.min(SIZE / img.width, SIZE / img.height) * zoom;
            const w = img.width * scale;
            const h = img.height * scale;
            const x = (SIZE - w) / 2 + offsetX;
            const y = (SIZE - h) / 2 + offsetY;
            ctx.drawImage(img, x, y, w, h);
        }

        function clampOffset() {
            const scale = Math.min(SIZE / img.width, SIZE / img.height) * zoom;
            const w = img.width * scale;
            const h = img.height * scale;
            const maxX = Math.max(0, (w - SIZE) / 2);
            const maxY = Math.max(0, (h - SIZE) / 2);
            offsetX = Math.max(-maxX, Math.min(maxX, offsetX));
            offsetY = Math.max(-maxY, Math.min(maxY, offsetY));
        }

        function onPointerDown(e) {
            dragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            startOffX = offsetX;
            startOffY = offsetY;
            viewport.setPointerCapture(e.pointerId);
        }
        function onPointerMove(e) {
            if (!dragging) return;
            offsetX = startOffX + (e.clientX - dragStartX);
            offsetY = startOffY + (e.clientY - dragStartY);
            clampOffset();
            draw();
        }
        function onPointerUp() { dragging = false; }

        function onZoom() {
            zoom = parseFloat(zoomSlider.value);
            clampOffset();
            draw();
        }

        function cleanup() {
            URL.revokeObjectURL(objectUrl);
            viewport.removeEventListener('pointerdown', onPointerDown);
            viewport.removeEventListener('pointermove', onPointerMove);
            viewport.removeEventListener('pointerup', onPointerUp);
            zoomSlider.removeEventListener('input', onZoom);
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            backdrop.removeEventListener('click', onCancel);
            modal.classList.add('hidden');
        }

        function onConfirm() {
            // Crop a rounded-square region matching avatar shape
            const outSize = 400;
            const out = document.createElement('canvas');
            out.width = outSize;
            out.height = outSize;
            const octx = out.getContext('2d');

            // Clip to a rounded rectangle matching avatar border-radius (24px scaled)
            const r = outSize * (24 / SIZE);
            octx.beginPath();
            octx.roundRect(0, 0, outSize, outSize, r);
            octx.closePath();
            octx.clip();

            // Draw the same view scaled up to outSize
            const ratio = outSize / SIZE;
            const scale = Math.min(SIZE / img.width, SIZE / img.height) * zoom;
            const w = img.width * scale * ratio;
            const h = img.height * scale * ratio;
            const x = (outSize - w) / 2 + offsetX * ratio;
            const y = (outSize - h) / 2 + offsetY * ratio;
            octx.drawImage(img, x, y, w, h);

            const dataUrl = out.toDataURL('image/png', 1);
            cleanup();
            resolve(dataUrl);
        }

        function onCancel() {
            cleanup();
            resolve(null);
        }

        img.onload = () => {
            zoom = 1;
            offsetX = 0;
            offsetY = 0;
            zoomSlider.value = '1';
            draw();
            modal.classList.remove('hidden');

            viewport.addEventListener('pointerdown', onPointerDown);
            viewport.addEventListener('pointermove', onPointerMove);
            viewport.addEventListener('pointerup', onPointerUp);
            zoomSlider.addEventListener('input', onZoom);
            confirmBtn.addEventListener('click', onConfirm);
            cancelBtn.addEventListener('click', onCancel);
            backdrop.addEventListener('click', onCancel);
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Could not load image'));
        };
        img.src = objectUrl;
    });
}

export function setupProfileEdit({ onSaved }) {
    const profileScreen   = document.getElementById('profileScreen');
    const saveBtn         = document.getElementById('profileSaveBtn');
    const saveMsg         = document.getElementById('profileSaveMsg');
    const nameHeading     = document.getElementById('profileNameHeading');
    const avatarCard      = document.querySelector('.profile-avatar-card');
    const avatarImg       = document.querySelector('.profile-hero-avatar');
    const fileInput       = document.getElementById('avatarFileInput');

    if (!saveBtn || !nameHeading || !avatarImg || !fileInput) return;

    let editBtn = document.getElementById('profileEditBtn');
    if (!editBtn) {
        editBtn = document.createElement('button');
        editBtn.id = 'profileEditBtn';
        editBtn.className = 'profile-edit-gear';
        editBtn.setAttribute('aria-label', 'Edit profile');
        editBtn.setAttribute('title', 'Edit profile');
        editBtn.innerHTML = '<img src="assets/images/Edit icon.png" alt="">';
        nameHeading.appendChild(editBtn);
    }

    let pendingAvatarDataUrl = null;

    // --- Enter / exit edit mode ---
    function getNameText() {
        // Get only the direct text content, ignoring child elements like the edit button
        let text = '';
        for (const node of nameHeading.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) text += node.textContent;
        }
        return text.trim();
    }

    function enterEditMode() {
        profileScreen.classList.add('edit-mode');
        nameHeading.contentEditable = 'true';
        // Hide the edit button during editing to avoid cursor issues
        const editGear = nameHeading.querySelector('.profile-edit-gear');
        if (editGear) editGear.style.display = 'none';
        nameHeading.focus();
        // Move caret to end of text
        const range = document.createRange();
        const textNode = Array.from(nameHeading.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
        if (textNode) {
            range.setStart(textNode, textNode.textContent.length);
            range.collapse(true);
        } else {
            range.selectNodeContents(nameHeading);
            range.collapse(false);
        }
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        saveBtn.classList.remove('hidden');
        saveMsg.textContent = '';
        pendingAvatarDataUrl = null;
    }

    function exitEditMode() {
        profileScreen.classList.remove('edit-mode');
        nameHeading.contentEditable = 'false';
        // Restore the edit button
        const editGear = nameHeading.querySelector('.profile-edit-gear');
        if (editGear) editGear.style.display = '';
        saveBtn.classList.add('hidden');
        saveMsg.textContent = '';
        pendingAvatarDataUrl = null;
    }

    editBtn.addEventListener('click', () => {
        if (profileScreen.classList.contains('edit-mode')) {
            exitEditMode();
        } else {
            enterEditMode();
        }
    });

    // Prevent newlines in the editable heading
    nameHeading.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') e.preventDefault();
    });

    // --- Avatar click triggers file picker ---
    avatarCard.addEventListener('click', () => {
        if (!profileScreen.classList.contains('edit-mode')) return;
        fileInput.click();
    });

    fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) return;
        fileInput.value = '';
        try {
            const croppedDataUrl = await openCropModal(file);
            if (croppedDataUrl) {
                pendingAvatarDataUrl = croppedDataUrl;
                avatarImg.src = croppedDataUrl;
            }
        } catch (err) {
            console.error('Crop failed', err);
        }
    });

    // --- Save ---
    saveBtn.addEventListener('click', async () => {
        saveBtn.disabled = true;
        saveMsg.style.color = '#555';
        saveMsg.textContent = 'Saving…';

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!user || userError) {
            saveMsg.style.color = '#b00';
            saveMsg.textContent = 'Not logged in.';
            saveBtn.disabled = false;
            return;
        }

        const newUsername = getNameText();
        if (!newUsername) {
            saveMsg.style.color = '#b00';
            saveMsg.textContent = 'Username cannot be empty.';
            saveBtn.disabled = false;
            return;
        }

        const avatarUrl = pendingAvatarDataUrl || null;

        // Update profiles row on the server
        const updates = { username: newUsername };
        if (avatarUrl) updates.avatar_url = avatarUrl;

        const { error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (updateError) {
            saveMsg.style.color = '#b00';
            saveMsg.textContent = 'Save failed: ' + updateError.message;
            saveBtn.disabled = false;
            return;
        }

        // Persist username locally so it's consistent with rest of app
        localStorage.setItem('profileDisplayName', newUsername);

        // Update all hero avatar images and the matching friend card
        if (avatarUrl) {
            document.querySelectorAll('.profile-hero-avatar').forEach(img => {
                img.src = avatarUrl;
            });
            // Update the current user's card in the friends/search grid
            const myCard = document.querySelector('.friend-card[data-is-you="true"] .friend-avatar img');
            if (myCard) myCard.src = avatarUrl;
        }

        saveMsg.style.color = '#0a0';
        saveMsg.textContent = 'Saved!';
        saveBtn.disabled = false;

        exitEditMode();

        if (typeof onSaved === 'function') onSaved({ username: newUsername, avatarUrl });
    });
}
