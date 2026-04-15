import { supabase } from './supabase.js';

function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
}

function buildCard(profile, isYou) {
    const name = profile.username ?? 'Unknown';
    const avatarSrc = profile.avatar_url || 'assets/images/Profile Icon.png';

    const card = document.createElement('article');
    card.className = 'friend-card' + (isYou ? ' is-you' : '');
    card.setAttribute('data-name', name);
    card.setAttribute('data-chain-count', profile.chain_count ?? 0);
    card.setAttribute('data-joined-at', profile.joined_at ?? '');
    card.setAttribute('data-is-you', isYou ? 'true' : 'false');
    card.innerHTML = `
        <div class="friend-avatar"><img src="${avatarSrc}" alt=""></div>
        <div class="friend-name">
            <span class="friend-name-text">${name}${
                isYou ? ' <span class="friend-you-badge">You</span>' : ''
            }</span>
        </div>
    `;
    return card;
}

export async function loadProfiles() {
    const grid = document.getElementById('friendsGrid');
    if (!grid) return;

    const [{ data: { user } }, { data, error }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('profiles')
            .select('id, username, chain_count, joined_at, avatar_url')
            .order('username', { ascending: true })
    ]);

    if (error || !data) return;

    grid.innerHTML = '';

    const currentId = user?.id ?? null;
    const mine = data.find(p => p.id === currentId);
    const others = data.filter(p => p.id !== currentId);

    const ordered = mine ? [mine, ...others] : others;

    ordered.forEach(profile => {
        grid.appendChild(buildCard(profile, profile.id === currentId));
    });
}
