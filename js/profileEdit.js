import { supabase } from './supabase.js';

export function setupProfileEdit({ onSaved }) {
    const profileScreen   = document.getElementById('profileScreen');
    const editBtn         = document.getElementById('profileEditBtn');
    const saveBtn         = document.getElementById('profileSaveBtn');
    const saveMsg         = document.getElementById('profileSaveMsg');
    const nameHeading     = document.getElementById('profileNameHeading');
    const avatarCard      = document.querySelector('.profile-avatar-card');
    const avatarImg       = document.querySelector('.profile-hero-avatar');
    const fileInput       = document.getElementById('avatarFileInput');

    if (!editBtn || !saveBtn || !nameHeading || !avatarImg || !fileInput) return;

    let pendingAvatarFile = null;

    // --- Enter / exit edit mode ---
    function enterEditMode() {
        profileScreen.classList.add('edit-mode');
        nameHeading.contentEditable = 'true';
        nameHeading.focus();
        // Move caret to end
        const range = document.createRange();
        range.selectNodeContents(nameHeading);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        saveBtn.classList.remove('hidden');
        saveMsg.textContent = '';
        pendingAvatarFile = null;
    }

    function exitEditMode() {
        profileScreen.classList.remove('edit-mode');
        nameHeading.contentEditable = 'false';
        saveBtn.classList.add('hidden');
        saveMsg.textContent = '';
        pendingAvatarFile = null;
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

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        pendingAvatarFile = file;
        // Preview immediately
        const reader = new FileReader();
        reader.onload = (e) => { avatarImg.src = e.target.result; };
        reader.readAsDataURL(file);
        fileInput.value = '';
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

        const newUsername = nameHeading.textContent.trim();
        if (!newUsername) {
            saveMsg.style.color = '#b00';
            saveMsg.textContent = 'Username cannot be empty.';
            saveBtn.disabled = false;
            return;
        }

        let avatarUrl = null;

        // Resize avatar to base64
        if (pendingAvatarFile) {
            try {
                avatarUrl = await resizeImageToBase64(pendingAvatarFile, 400);
            } catch (e) {
                saveMsg.style.color = '#b00';
                saveMsg.textContent = 'Avatar processing failed: ' + e.message;
                saveBtn.disabled = false;
                return;
            }
        }

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

/** Resize an image File to fit within maxSize×maxSize and return a base64 JPEG data URL. */
function resizeImageToBase64(file, maxSize = 400) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Could not load image')); };
        img.src = objectUrl;
    });
}
