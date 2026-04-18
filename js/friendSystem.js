import { supabase } from './supabase.js';

/**
 * Friend request statuses stored in the `friend_requests` table:
 *   - pending   : request sent, awaiting response
 *   - accepted  : friendship confirmed
 *
 * Table schema (create in Supabase dashboard):
 *   friend_requests (
 *     id          uuid  primary key default gen_random_uuid(),
 *     sender_id   uuid  references auth.users(id) on delete cascade,
 *     receiver_id uuid  references auth.users(id) on delete cascade,
 *     status      text  default 'pending' check (status in ('pending','accepted')),
 *     created_at  timestamptz default now(),
 *     unique(sender_id, receiver_id)
 *   )
 */

// ─── Queries ───────────────────────────────────────────────

/** Get the current authenticated user id */
async function currentUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
}

/** Send a friend request from the current user to targetId */
export async function sendFriendRequest(targetId) {
    const myId = await currentUserId();
    if (!myId || myId === targetId) return null;

    // Check if a request already exists in either direction
    const existing = await getRelationship(myId, targetId);
    if (existing) return existing;

    const { data, error } = await supabase
        .from('friend_requests')
        .insert({ sender_id: myId, receiver_id: targetId, status: 'pending' })
        .select()
        .single();

    if (error) { console.error('sendFriendRequest error:', error); return null; }
    return data;
}

/** Accept a friend request (only the receiver can accept) */
export async function acceptFriendRequest(requestId) {
    const myId = await currentUserId();
    if (!myId) return null;

    const { data, error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .eq('receiver_id', myId)
        .select()
        .single();

    if (error) { console.error('acceptFriendRequest error:', error); return null; }
    return data;
}

/** Decline / delete a friend request */
export async function declineFriendRequest(requestId) {
    const myId = await currentUserId();
    if (!myId) return null;

    const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId)
        .eq('receiver_id', myId);

    if (error) { console.error('declineFriendRequest error:', error); }
    return !error;
}

/** Cancel an outgoing friend request (only the sender can cancel) */
export async function cancelFriendRequest(targetId) {
    const myId = await currentUserId();
    if (!myId) return false;

    const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('sender_id', myId)
        .eq('receiver_id', targetId)
        .eq('status', 'pending');

    if (error) { console.error('cancelFriendRequest error:', error); }
    return !error;
}

/** Get the relationship row between two users (either direction) */
export async function getRelationship(userA, userB) {
    const { data } = await supabase
        .from('friend_requests')
        .select('*')
        .or(
            `and(sender_id.eq.${userA},receiver_id.eq.${userB}),and(sender_id.eq.${userB},receiver_id.eq.${userA})`
        )
        .limit(1)
        .maybeSingle();
    return data ?? null;
}

/** Get all accepted friend ids for the current user */
export async function getFriendIds() {
    const myId = await currentUserId();
    if (!myId) return [];

    const { data, error } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`);

    if (error || !data) return [];
    return data.map(row => row.sender_id === myId ? row.receiver_id : row.sender_id);
}

/** Get all pending incoming friend requests for the current user */
export async function getIncomingRequests() {
    const myId = await currentUserId();
    if (!myId) return [];

    const { data, error } = await supabase
        .from('friend_requests')
        .select('id, sender_id, created_at, profiles!friend_requests_sender_id_fkey(username, avatar_url)')
        .eq('receiver_id', myId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        // If the join fails (FK not set up), fall back to a simpler query
        const { data: fallback } = await supabase
            .from('friend_requests')
            .select('id, sender_id, created_at')
            .eq('receiver_id', myId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        return fallback ?? [];
    }
    return data ?? [];
}

/** Get outgoing pending requests from the current user */
export async function getOutgoingPending() {
    const myId = await currentUserId();
    if (!myId) return [];

    const { data } = await supabase
        .from('friend_requests')
        .select('id, receiver_id')
        .eq('sender_id', myId)
        .eq('status', 'pending');

    return data ?? [];
}

// ─── Block helpers ─────────────────────────────────────────

/**
 * Block a user. Inserts a row into the `blocks` table.
 * Table schema (create in Supabase dashboard):
 *   blocks (
 *     id          uuid  primary key default gen_random_uuid(),
 *     blocker_id  uuid  references auth.users(id) on delete cascade,
 *     blocked_id  uuid  references auth.users(id) on delete cascade,
 *     created_at  timestamptz default now(),
 *     unique(blocker_id, blocked_id)
 *   )
 */
export async function blockUser(targetId) {
    const myId = await currentUserId();
    if (!myId || myId === targetId) return null;

    const { data, error } = await supabase
        .from('blocks')
        .insert({ blocker_id: myId, blocked_id: targetId })
        .select()
        .single();

    if (error) { console.error('blockUser error:', error); return null; }

    // Also remove any existing friendship / friend request between the two users
    await supabase
        .from('friend_requests')
        .delete()
        .or(
            `and(sender_id.eq.${myId},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${myId})`
        );

    return data;
}

/** Unblock a user (only the blocker can unblock) */
export async function unblockUser(targetId) {
    const myId = await currentUserId();
    if (!myId) return false;

    const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', myId)
        .eq('blocked_id', targetId);

    if (error) { console.error('unblockUser error:', error); return false; }
    return true;
}

/**
 * Get all user IDs that should be hidden from the current user.
 * Returns IDs of users I blocked AND users who blocked me (bidirectional).
 */
export async function getBlockedUserIds() {
    const myId = await currentUserId();
    if (!myId) return [];

    const { data, error } = await supabase
        .from('blocks')
        .select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${myId},blocked_id.eq.${myId}`);

    if (error || !data) return [];
    return data.map(row => row.blocker_id === myId ? row.blocked_id : row.blocker_id);
}

/** Check if a block exists between the current user and target (either direction) */
export async function isBlocked(targetId) {
    const myId = await currentUserId();
    if (!myId) return false;

    const { data } = await supabase
        .from('blocks')
        .select('id')
        .or(
            `and(blocker_id.eq.${myId},blocked_id.eq.${targetId}),and(blocker_id.eq.${targetId},blocked_id.eq.${myId})`
        )
        .limit(1)
        .maybeSingle();

    return !!data;
}

/**
 * Get the list of users blocked BY the current user, with usernames.
 * Returns [{ id, username }] for each user the current user has blocked.
 */
export async function getMyBlockedUsersWithNames() {
    const myId = await currentUserId();
    if (!myId) return [];

    const { data, error } = await supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', myId);

    if (error || !data || data.length === 0) return [];

    const ids = data.map(r => r.blocked_id);
    const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', ids);

    if (pErr || !profiles) return [];
    return profiles;
}

// ─── Notification badge helpers ────────────────────────────

let cachedIncoming = [];
let cachedOutgoing = [];
let cachedFriendIds = [];
let cachedBlockedIds = [];

export async function refreshFriendData() {
    const [incoming, outgoing, friends, blocked] = await Promise.all([
        getIncomingRequests(),
        getOutgoingPending(),
        getFriendIds(),
        getBlockedUserIds()
    ]);
    cachedIncoming = incoming;
    cachedOutgoing = outgoing;
    cachedFriendIds = friends;
    cachedBlockedIds = blocked;
    return { incoming, outgoing, friends, blocked };
}

export function getCachedIncoming() { return cachedIncoming; }
export function getCachedOutgoing() { return cachedOutgoing; }
export function getCachedFriendIds() { return cachedFriendIds; }
export function getCachedBlockedIds() { return cachedBlockedIds; }

/**
 * Determine the relationship status between current user and a profile id.
 * Returns: 'self' | 'friend' | 'pending-sent' | 'pending-received' | 'none'
 */
export function getStatusForProfile(profileId, myId) {
    if (profileId === myId) return 'self';
    if (cachedBlockedIds.includes(profileId)) return 'blocked';
    if (cachedFriendIds.includes(profileId)) return 'friend';
    if (cachedOutgoing.some(r => r.receiver_id === profileId)) return 'pending-sent';
    const inc = cachedIncoming.find(r => r.sender_id === profileId);
    if (inc) return 'pending-received';
    return 'none';
}
