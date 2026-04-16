import { supabase } from './supabase.js';
import { refreshFriendData, getCachedFriendIds, getStatusForProfile } from './friendSystem.js';

function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
}

function buildCard(profile, isYou, isFriend) {
    const name = profile.username ?? 'Unknown';
    const avatarSrc = profile.avatar_url || 'assets/images/Profile Icon.png';

    const card = document.createElement('article');
    card.className = 'friend-card' + (isYou ? ' is-you' : '');
    card.setAttribute('data-name', name);
    card.setAttribute('data-user-id', profile.id ?? '');
    card.setAttribute('data-chain-count', profile.chain_count ?? 0);
    card.setAttribute('data-joined-at', profile.joined_at ?? '');
    card.setAttribute('data-is-you', isYou ? 'true' : 'false');
    card.setAttribute('data-is-friend', isFriend ? 'true' : 'false');
    card.setAttribute('data-dog-tags', JSON.stringify(profile.dog_tags ?? []));

    const badges = [];
    if (isYou) badges.push('<span class="friend-you-badge">You</span>');
    if (isFriend) badges.push('<span class="friend-friend-badge">Friend</span>');

    card.innerHTML = `
        <div class="friend-avatar"><img src="${avatarSrc}" alt=""></div>
        <div class="friend-name">
            <span class="friend-name-text">${name}${badges.length ? ' ' + badges.join(' ') : ''}</span>
        </div>
    `;
    return card;
}

export async function loadProfiles() {
    const grid = document.getElementById('friendsGrid');
    if (!grid) return;

    // Refresh friend data first so we know who is a friend
    await refreshFriendData();
    const friendIds = getCachedFriendIds();

    const [{ data: { user } }, { data, error }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('profiles')
            .select('id, username, chain_count, joined_at, avatar_url, dog_tags')
            .order('username', { ascending: true })
    ]);

    if (error || !data) return;

    grid.innerHTML = '';

    const currentId = user?.id ?? null;
    const mine = data.find(p => p.id === currentId);
    const others = data.filter(p => p.id !== currentId);

    // Sort: friends first, then others
    const friends = others.filter(p => friendIds.includes(p.id));
    const nonFriends = others.filter(p => !friendIds.includes(p.id));
    const ordered = [...(mine ? [mine] : []), ...friends, ...nonFriends];

    ordered.forEach(profile => {
        const isYou = profile.id === currentId;
        const isFriend = friendIds.includes(profile.id);
        grid.appendChild(buildCard(profile, isYou, isFriend));
    });
}
