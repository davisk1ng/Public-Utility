// --- Challenge State ---
const DAILY_CHALLENGE_POOL = [
    "Do 10 pushups",
    "Read 5 pages",
    "Drink 2L of water",
    "Take a 20 minute walk",
    "Stretch for 10 minutes",
    "Write 3 things you're grateful for",
    "No sugar for the next 6 hours",
    "Meditate for 10 minutes",
    "Clean your room for 15 minutes",
    "Do 30 squats",
    "Read one chapter of a book",
    "Journal for 10 minutes",
    "Go to bed 30 minutes earlier",
    "Do 20 sit-ups",
    "Practice a skill for 25 minutes",
];
const DAILY_CHALLENGE_COUNT = 6;
const DAILY_CHALLENGE_STORAGE_KEY = "dailyChallengeStateV1";
let availableChallenges = [];
let inProgressChallenges = [];

function getTodayChallengeKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function buildDailyChallengesForDate(dateKey) {
    const dateSeed = Number(dateKey.replace(/-/g, "")) || 0;
    const startIndex = dateSeed % DAILY_CHALLENGE_POOL.length;
    const challenges = [];
    for (let i = 0; i < DAILY_CHALLENGE_COUNT; i += 1) {
        const poolIndex = (startIndex + i) % DAILY_CHALLENGE_POOL.length;
        challenges.push({
            id: `daily-${dateKey}-${poolIndex}`,
            text: DAILY_CHALLENGE_POOL[poolIndex],
            type: "daily",
        });
    }
    return challenges;
}

function persistDailyChallengeState(dateKey) {
    const remainingDailyIds = availableChallenges
        .filter((challenge) => challenge.type === "daily")
        .map((challenge) => challenge.id);
    localStorage.setItem(
        DAILY_CHALLENGE_STORAGE_KEY,
        JSON.stringify({ dateKey, remainingDailyIds })
    );
}

function ensureDailyChallengesForToday() {
    const todayKey = getTodayChallengeKey();
    const allDailyForToday = buildDailyChallengesForDate(todayKey);
    const idsForToday = new Set(allDailyForToday.map((challenge) => challenge.id));

    let stored = null;
    try {
        stored = JSON.parse(localStorage.getItem(DAILY_CHALLENGE_STORAGE_KEY) || "null");
    } catch {
        stored = null;
    }

    const remainingIds = stored?.dateKey === todayKey && Array.isArray(stored.remainingDailyIds)
        ? stored.remainingDailyIds.filter((id) => idsForToday.has(id))
        : allDailyForToday.map((challenge) => challenge.id);
    const remainingIdSet = new Set(remainingIds);

    const nonDailyChallenges = availableChallenges.filter((challenge) => challenge.type !== "daily");
    const remainingDailyChallenges = allDailyForToday.filter((challenge) => remainingIdSet.has(challenge.id));
    availableChallenges = [...nonDailyChallenges, ...remainingDailyChallenges];

    localStorage.setItem(
        DAILY_CHALLENGE_STORAGE_KEY,
        JSON.stringify({ dateKey: todayKey, remainingDailyIds: remainingIds })
    );
}

ensureDailyChallengesForToday();

function renderChallenges() {
                const getOrCreateCarousel = (column) => {
                    let carousel = column.querySelector('.challenge-card-carousel');
                    if (!carousel) {
                        carousel = document.createElement('div');
                        carousel.className = 'challenge-card-carousel';
                        column.appendChild(carousel);
                    }
                    carousel.innerHTML = '';
                    return carousel;
                };
                ensureDailyChallengesForToday();
                // Update total links in the top right to the user's actual link count
                const totalLinksElem = document.querySelector('.challenges-header-links strong');
                const profileTotalLinksElem = document.getElementById('profileTotalLinks');
                let userLinks = 0;
                if (profileTotalLinksElem) {
                    userLinks = parseInt(profileTotalLinksElem.textContent, 10) || 0;
                }
                if (totalLinksElem) {
                    totalLinksElem.textContent = userLinks;
                }
            // Make leaderboard nameplates clickable
            document.querySelectorAll('.leaderboard-card-rank').forEach(el => {
                el.style.cursor = 'pointer';
                el.onclick = function() {
                    // Extract username from the text (format: '1. Username')
                    const text = el.textContent.trim();
                    const username = text.replace(/^\d+\.\s*/, '');
                    // Call a function to show the profile page for this username
                    if (typeof window.showProfileByUsername === 'function') {
                        window.showProfileByUsername(username);
                    } else {
                        // Fallback: store username and show profile screen
                        localStorage.setItem('profileViewUsername', username);
                        // Show profile screen (assumes #profileScreen exists)
                        document.getElementById('profileScreen').classList.remove('hidden');
                        document.getElementById('challengesScreen').classList.add('hidden');
                        // Optionally trigger a profile load if available
                        if (typeof window.updateProfileScreen === 'function') {
                            window.updateProfileScreen();
                        }
                    }
                };
            });
        // In Progress
        const inProgressCol = document.querySelector('.col-in-progress');
        if (inProgressCol) {
                inProgressCol.querySelectorAll('.challenge-card').forEach(e => e.remove());
                const emptyMsgId = 'challenge-empty-msg';
                const oldMsg = inProgressCol.querySelector(`#${emptyMsgId}`);
                if (oldMsg) oldMsg.remove();
                const inProgressCarousel = getOrCreateCarousel(inProgressCol);
                // Add card button logic
                const addBtn = inProgressCol.querySelector('.challenges-add-btn');
                if (addBtn && !addBtn._wired) {
                        addBtn.addEventListener('click', () => {
                                openAddChallengeModal();
                        });
                        addBtn._wired = true;
                }
                if (inProgressChallenges.length === 0) {
                        const msg = document.createElement('div');
                        msg.id = emptyMsgId;
                        msg.style.cssText = 'padding:32px 0;text-align:center;color:#fff;font-size:1.1rem;font-weight:600;';
                        msg.textContent = 'No current challenges. Accept a challenge to progress!';
                        inProgressCol.appendChild(msg);
                } else {
                        inProgressChallenges.forEach(chal => {
                                const slide = document.createElement('div');
                                slide.className = 'challenge-card-slide';
                                const card = document.createElement('div');
                                card.className = 'challenge-card';
                                card.innerHTML = `
                                    <div class="challenge-card-profile">
                                        <img class="challenge-card-avatar" src="${chal.profile?.avatar_url || 'assets/images/App logo.png'}" alt=""/>
                                        <span class="challenge-card-username">${chal.profile?.username || 'Hyperlink'}</span>
                                    </div>
                                    <div class="challenge-card-body"><b style="display:block;text-align:center;max-width:90%;margin:0 auto;">${chal.text.slice(0,40)}</b></div>
                                    <div class="challenge-card-actions">
                                        <button class="challenge-finish-btn" type="button" data-chalid="${chal.id}">Finish</button>
                                        <button class="challenge-giveup-btn" type="button" data-chalid="${chal.id}">Give Up</button>
                                    </div>`;
                                slide.appendChild(card);
                                inProgressCarousel.appendChild(slide);
                        });
                }
        }
// Modal for adding a challenge card
function openAddChallengeModal() {
    const modal = document.getElementById('addChallengeModal');
    const backdrop = document.getElementById('addChallengeModalBackdrop');
    const closeBtn = document.getElementById('addChallengeModalClose');
    const saveBtn = document.getElementById('addChallengeModalSave');
    const input = document.getElementById('addChallengeModalInput');
    const avatar = document.getElementById('addChallengeModalAvatar');
    const username = document.getElementById('addChallengeModalUsername');
    const toggle = document.getElementById('addChallengeModalSwitch');
    const toggleLabel = document.getElementById('addChallengeModalToggleLabel');
    if (!modal || !backdrop) return;
    // Set profile info (replace with real user info if available)
    avatar.src = window.cachedAvatarUrl || 'assets/images/Profile Icon.png';
    username.textContent = window.cachedUsername || 'You';
    input.value = '';
    toggle.checked = false;
    toggleLabel.textContent = 'Do it solo';
    // Show modal
    modal.classList.remove('hidden');
    backdrop.classList.remove('hidden');
    input.focus();
    // Toggle label logic
    toggle.onchange = () => {
        toggleLabel.textContent = toggle.checked ? 'Share with friends' : 'Do it solo';
    };
    // Save handler
    saveBtn.onclick = () => {
        const text = input.value.trim();
        if (!text) {
            input.focus();
            return;
        }
        inProgressChallenges.push({
            id: 'u' + Date.now(),
            text,
            type: toggle.checked ? 'friend' : 'user',
            profile: { username: window.cachedUsername || 'You', avatar_url: window.cachedAvatarUrl || 'assets/images/Profile Icon.png' }
        });
        closeAddChallengeModal();
        renderChallenges();
    };
    // Close logic
    function closeAddChallengeModal() {
        modal.classList.add('hidden');
        backdrop.classList.add('hidden');
    }
    closeBtn.onclick = closeAddChallengeModal;
    backdrop.onclick = closeAddChallengeModal;
    // ESC key closes
    document.onkeydown = function(e) {
        if (!modal.classList.contains('hidden') && (e.key === 'Escape' || e.key === 'Esc')) closeAddChallengeModal();
    };
}
    // Daily
    const dailyCol = document.querySelector('.col-daily');
        if (dailyCol) {
                dailyCol.querySelectorAll('.challenge-card').forEach(e => e.remove());
                dailyCol.querySelectorAll('.challenge-card-actions-row').forEach(e => e.remove());
                const dailyEmptyMsgId = 'daily-challenge-empty-msg';
                const oldDailyMsg = dailyCol.querySelector(`#${dailyEmptyMsgId}`);
                if (oldDailyMsg) oldDailyMsg.remove();
                const dailyCarousel = getOrCreateCarousel(dailyCol);
                const dailyChallenges = availableChallenges.filter(c => c.type === 'daily');
                if (dailyChallenges.length === 0) {
                        const msg = document.createElement('div');
                        msg.id = dailyEmptyMsgId;
                        msg.style.cssText = 'padding:28px 0;text-align:center;color:#222;font-size:1rem;font-weight:700;';
                        msg.textContent = 'Come back tomorrow for more daily challenges!';
                        dailyCol.appendChild(msg);
                } else {
                dailyChallenges.forEach(chal => {
                        const slide = document.createElement('div');
                        slide.className = 'challenge-card-slide';
                        const card = document.createElement('div');
                        card.className = 'challenge-card';
                        card.innerHTML = `
                            <div class="challenge-card-profile">
                                <img class="challenge-card-avatar" src="${chal.profile?.avatar_url || 'assets/images/App logo.png'}" alt=""/>
                                <span class="challenge-card-username">${chal.profile?.username || 'Hyperlink'}</span>
                            </div>
                            <div class="challenge-card-body"><b style="display:block;text-align:center;max-width:90%;margin:0 auto;">${chal.text.slice(0,40)}</b></div>
                        `;
                        dailyCol.appendChild(card);
                        // Actions row below card
                        const actionsRow = document.createElement('div');
                        actionsRow.className = 'challenge-card-actions-row';
                        actionsRow.style.cssText = 'display:flex;gap:0.5em;justify-content:center;margin-bottom:18px;';
                        actionsRow.innerHTML = `
                                <button class="challenge-accept-btn" type="button" data-chalid="${chal.id}">Accept</button>
                                <button class="challenge-deny-btn" type="button" data-chalid="${chal.id}">Deny</button>
                        `;
                        slide.appendChild(card);
                        slide.appendChild(actionsRow);
                        dailyCarousel.appendChild(slide);
                });
                }
        }
        // Friends
        const friendsCol = document.querySelector('.col-friends');
        if (friendsCol) {
            friendsCol.querySelectorAll('.challenge-card').forEach(e => e.remove());
            friendsCol.querySelectorAll('.challenge-card-actions-row').forEach(e => e.remove());
            const friendsCarousel = getOrCreateCarousel(friendsCol);
            // Remove any previous empty message
            const emptyMsgId = 'friends-challenge-empty-msg';
            const oldMsg = friendsCol.querySelector(`#${emptyMsgId}`);
            if (oldMsg) oldMsg.remove();
            const friendChallenges = availableChallenges.filter(c => c.type === 'friend');
            if (friendChallenges.length === 0) {
                const msg = document.createElement('div');
                msg.id = emptyMsgId;
                msg.style.cssText = 'padding:32px 0;text-align:center;color:#fff;font-size:1.1rem;font-weight:600;';
                msg.textContent = 'Wait for your friends to give you a challenge!';
                friendsCol.appendChild(msg);
            } else {
                friendChallenges.forEach(chal => {
                    const slide = document.createElement('div');
                    slide.className = 'challenge-card-slide';
                    const card = document.createElement('div');
                    card.className = 'challenge-card';
                    card.innerHTML = `
                        <div class="challenge-card-profile">
                            <img class="challenge-card-avatar" src="${chal.profile?.avatar_url || 'assets/images/App logo.png'}" alt=""/>
                            <span class="challenge-card-username">${chal.profile?.username || 'Hyperlink'}</span>
                        </div>
                        <div class="challenge-card-body"><b style="display:block;text-align:center;max-width:90%;margin:0 auto;">${chal.text.slice(0,40)}</b></div>
                    `;
                    friendsCol.appendChild(card);
                    // Actions row below card
                    const actionsRow = document.createElement('div');
                    actionsRow.className = 'challenge-card-actions-row';
                    actionsRow.style.cssText = 'display:flex;gap:0.5em;justify-content:center;margin-bottom:18px;';
                    actionsRow.innerHTML = `
                        <button class="challenge-accept-btn" type="button" data-chalid="${chal.id}">Accept</button>
                        <button class="challenge-deny-btn" type="button" data-chalid="${chal.id}">Deny</button>
                    `;
                    slide.appendChild(card);
                    slide.appendChild(actionsRow);
                    friendsCarousel.appendChild(slide);
                });
            }
        }
    // Add Accept listeners
    document.querySelectorAll('.challenge-accept-btn').forEach(btn => {
        btn.onclick = function() {
            const id = btn.getAttribute('data-chalid');
            const idx = availableChallenges.findIndex(c => c.id === id);
            if (idx !== -1) {
                inProgressChallenges.push(availableChallenges[idx]);
                availableChallenges.splice(idx, 1);
                persistDailyChallengeState(getTodayChallengeKey());
                renderChallenges();
            }
        };
    });
    document.querySelectorAll('.challenge-deny-btn').forEach(btn => {
        btn.onclick = function() {
            const id = btn.getAttribute('data-chalid');
            const idx = availableChallenges.findIndex(c => c.id === id);
            if (idx !== -1) {
                availableChallenges.splice(idx, 1);
                persistDailyChallengeState(getTodayChallengeKey());
                renderChallenges();
            }
        };
    });
    document.querySelectorAll('.challenge-finish-btn').forEach(btn => {
        btn.onclick = function() {
            const id = btn.getAttribute('data-chalid');
            const idx = inProgressChallenges.findIndex(c => c.id === id);
            if (idx === -1) {
                return;
            }

            const completed = inProgressChallenges[idx];
            inProgressChallenges.splice(idx, 1);

            // Finishing a challenge turns it into a new chain dog tag.
            addDogTagWithTitle(completed.text);
            renderChallenges();
        };
    });
    document.querySelectorAll('.challenge-giveup-btn').forEach(btn => {
        btn.onclick = function() {
            const id = btn.getAttribute('data-chalid');
            const idx = inProgressChallenges.findIndex(c => c.id === id);
            if (idx !== -1) {
                inProgressChallenges.splice(idx, 1);
                renderChallenges();
            }
        };
    });
}
// threeApp.js - Handles 3D app initialization and splash

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { ChainInteraction } from "./chainInteraction.js";
import { DogTagManager } from "./dogTagManager.js";
import { loadProfiles } from "./profileSearch.js";
import { supabase } from "./supabase.js";
import { setupProfileEdit } from "./profileEdit.js";
import {
    sendFriendRequest, acceptFriendRequest, declineFriendRequest,
    cancelFriendRequest,
    refreshFriendData, getCachedIncoming, getCachedBlockedIds,
    getStatusForProfile, blockUser, unblockUser, getMyBlockedUsersWithNames
} from "./friendSystem.js";

let scene, camera, renderer;
let chainLinks = [];
let linkModel = null;
let linkSpacing = 0.5;
let linkHalfHeight = 0.5;
let selectedTagId = null;
let isRestoring = false;

// Store user info for challenge modal
window.cachedUsername = null;
window.cachedAvatarUrl = null;
let zoomMinZ = 4;
let zoomMaxZ = 4;
let cameraMinY = -1;
let cameraMaxY = 1;
let dogTagManager = null;
let chainInteraction = null;
let cachedJoinedAt = null;

export function initialize3DApp() {
    // Cache the user's real join date directly from the auth session

    supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user?.created_at) return;
        cachedJoinedAt = user.created_at;
        // Load avatar and username from the server
        const { data, error } = await supabase
            .from('profiles')
            .select('avatar_url, username')
            .eq('id', user.id)
            .single();
        if (data) {
            window.cachedAvatarUrl = data.avatar_url || 'assets/images/Profile Icon.png';
            window.cachedUsername = data.username || 'You';
            cachedAvatarUrl = data.avatar_url;
            document.querySelectorAll('.profile-hero-avatar').forEach(img => {
                img.src = window.cachedAvatarUrl;
            });
        }
        updateProfileScreen();
    }).catch(() => {});

    setupProfileEdit({
        onSaved: ({ username, avatarUrl }) => {
            if (avatarUrl) cachedAvatarUrl = avatarUrl;
            updateProfileScreen();
            loadProfiles();
        }
    });
    // --- 3D APP LOGIC MOVED FROM script.js ---
    let heroPreviewRenderer = null;
    let heroPreviewScene = null;
    let heroPreviewCamera = null;
    let heroPreviewRoot = null;
    let heroPreviewBackLabel = null;
    let heroPreviewFrontLabels = [];
    let heroFlipAngle = 0;
    let heroFlipTarget = 0;
    let heroFlipRafId = null;
    let heroPreviewIsQuarterTurn = false;
    const heroPreviewBasePosition = new THREE.Vector3();
    const heroPreviewCameraRight = new THREE.Vector3();
    
    // Post-flip horizontal correction controls:
    // Positive moves right, negative moves left.
    const heroFlipXOffsetFrontFacing = -0.2;
    const heroFlipXOffsetQuarterTurn = .38;
    
    const tagTextLodDistance = 3.2;
    const scrollSensitivity = 0.01;
    const chainModelUrl = `assets/models/Chain.glb?cacheBust=${Date.now()}`;
    const dogTagModelUrl = `assets/models/DogTag.glb?cacheBust=${Date.now()}`;
    const fontUrl = "https://unpkg.com/three@0.152.2/examples/fonts/droid/droid_sans_mono_regular.typeface.json";
    
    const tmpWorld = new THREE.Vector3();
    
    const canvas = document.getElementById("chainCanvas");
    const statusMessage = document.getElementById("statusMessage");
    const zoomSlider = document.getElementById("zoomSlider");
    const splashScreen = document.getElementById("splashScreen");
    const removeTagBtn = document.getElementById("removeTagBtn");
    const titleInput = document.getElementById("titleInput");
    const titleCharCount = document.getElementById("titleCharCount");
    const hideUiBtn = document.getElementById("hideUiBtn");
    const menuToggleBtn = document.getElementById("menuToggleBtn");
    const menuPanel = document.getElementById("menuPanel");
    const settingsBtn = document.getElementById("settingsBtn");
    const profileBtn = document.getElementById("profileBtn");
    const milestonesBtn = document.getElementById("milestonesBtn");
    const profileScreen = document.getElementById("profileScreen");
    const challengesScreen = document.getElementById("challengesScreen");
    const challengesPanelShell = document.querySelector(".challenges-panel-shell");
    const friendsSearchInput = document.getElementById("friendsSearchInput");
    const friendsGrid = document.getElementById("friendsGrid");
    const friendsEmptyState = document.getElementById("friendsEmptyState");
    const profileHeroToggle = document.getElementById("profileHeroToggle");
    const profileNameHeading = document.getElementById("profileNameHeading");
    const profileChainLength = document.getElementById("profileChainLength");
    const profileTotalLinks = document.getElementById("profileTotalLinks");
    const profileJoinDate = document.getElementById("profileJoinDate");
    const recentLinksList = document.getElementById("recentLinksList");
    const notificationBellBtn = document.getElementById("notificationBellBtn");
    const notificationBellIcon = document.getElementById("notificationBellIcon");
    const notificationBadge = document.getElementById("notificationBadge");
    const notificationDropdown = document.getElementById("notificationDropdown");
    const notificationList = document.getElementById("notificationList");
    const profileActions = document.getElementById("profileActions");
    const addFriendBtn = document.getElementById("addFriendBtn");
    const blockUserBtn = document.getElementById("blockUserBtn");
    const friendStatusTag = document.getElementById("friendStatusTag");

    let challengeNudgeTimeoutId = null;
    let challengeLastScrollTop = 0;
    let challengeWasScrollingDown = false;

    function triggerChallengeRowNudge() {
        if (!challengesScreen || challengesScreen.classList.contains("hidden") || window.innerWidth > 600) {
            return;
        }

        const carousels = challengesScreen.querySelectorAll(".challenge-card-carousel");
        carousels.forEach((row) => {
            row.classList.remove("nudge-once");
            // Restart animation cleanly for repeated nudges.
            void row.offsetWidth;
            row.classList.add("nudge-once");
        });
    }

    function onChallengesPanelScroll() {
        if (!challengesPanelShell) {
            return;
        }

        const currentTop = challengesPanelShell.scrollTop;
        challengeWasScrollingDown = currentTop > challengeLastScrollTop;
        challengeLastScrollTop = currentTop;

        if (challengeNudgeTimeoutId) {
            window.clearTimeout(challengeNudgeTimeoutId);
        }

        challengeNudgeTimeoutId = window.setTimeout(() => {
            if (challengeWasScrollingDown) {
                triggerChallengeRowNudge();
            }
            challengeWasScrollingDown = false;
        }, 180);
    }

    if (challengesPanelShell) {
        challengesPanelShell.addEventListener("scroll", onChallengesPanelScroll, { passive: true });
    }
    
    // Cached avatar URL for the current logged-in user
    let cachedAvatarUrl = null;

    // Ensure all avatar squares use the profile icon image (fallback only)
    function syncProfileAvatarIcons() {
        const profileIconImagePath = "assets/images/Profile Icon.png";
        // Top profile avatar — only reset to placeholder if no real avatar is cached
        const profileHeroAvatar = document.querySelector(".profile-hero-avatar");
        if (profileHeroAvatar) {
            profileHeroAvatar.src = cachedAvatarUrl || profileIconImagePath;
            if (!profileHeroAvatar.alt) profileHeroAvatar.alt = "Profile avatar";
        }
    }
    
    let isUiHidden = false;
    let isMenuOpen = true;
    let shouldRenderScene = true;
    
    let isTouchScrolling = false;
    let activeTouchScrollId = null;
    let lastTouchClientY = 0;
    
    window.addEventListener("error", (event) => {
        const message = event.error?.message || event.message || "Unknown runtime error";
        console.error("Runtime error", event.error || event);
        setStatus(`Runtime error: ${message}`);
    });
    
    window.addEventListener("unhandledrejection", (event) => {
        console.error("Unhandled promise rejection", event.reason);
        setStatus(`Unhandled error: ${event.reason?.message || event.reason || "Unknown promise rejection"}`);
    });
    
    init();
    loadAssets();
    
    restoreUiVisibilityPreference();
    applyMenuState();
    updateProfileScreen();
    
    function hideSplashScreen() {
        if (!splashScreen || splashScreen.classList.contains("hidden") || splashScreen.classList.contains("is-hiding")) {
            return;
        }
    
        splashScreen.classList.add("is-hiding");
        window.setTimeout(() => {
            splashScreen.classList.add("hidden");
        }, 700);
    }
    
    function applyMenuState() {
        if (!menuToggleBtn || !menuPanel) {
            return;
        }
    
        menuToggleBtn.classList.toggle("is-open", isMenuOpen);
        menuPanel.classList.toggle("is-open", isMenuOpen);
        menuToggleBtn.setAttribute("aria-expanded", isMenuOpen ? "true" : "false");
        menuToggleBtn.setAttribute("aria-label", isMenuOpen ? "Close menu" : "Open menu");
    }
    
    function toggleMenu(forceState) {
        isMenuOpen = typeof forceState === "boolean" ? forceState : !isMenuOpen;
        applyMenuState();
    }
    
    if (menuToggleBtn) {
        menuToggleBtn.addEventListener("click", () => {
            if (isProfileScreenOpen()) {
                closeProfileScreen();
                toggleMenu(false);
                return;
            }
    
            toggleMenu();
        });
    }
    
    function init() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xe7e7e7);
    
        camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 0, 4);
    
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        // Pass false so Three.js does not override the canvas CSS (inset:0) with pixel values.
        const initW = canvas.clientWidth || window.innerWidth;
        const initH = canvas.clientHeight || window.innerHeight;
        renderer.setSize(initW, initH, false);
    
        const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
        keyLight.position.set(4, 6, 8);
        scene.add(keyLight);
    
        const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
        fillLight.position.set(-4, 2, 3);
        scene.add(fillLight);
    
        const ambient = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambient);
    
        chainInteraction = new ChainInteraction({
            canvas,
            camera,
            getChainLinks: () => chainLinks,
            getLinkSpacing: () => linkSpacing,
        });
        chainInteraction.attach();
    
        dogTagManager = new DogTagManager({
            scene,
            renderer,
            getChainLinks: () => chainLinks,
            getLinkHalfHeight: () => linkHalfHeight,
        });
    
        window.addEventListener("resize", onWindowResize);
        window.addEventListener("wheel", onMouseWheel, { passive: false });
        canvas.addEventListener("click", onCanvasClick);
        canvas.addEventListener("pointerdown", onCanvasPointerDown, { passive: true });
        window.addEventListener("pointermove", onCanvasPointerMove, { passive: false });
        window.addEventListener("pointerup", onCanvasPointerUp, { passive: true });
        window.addEventListener("pointercancel", onCanvasPointerUp, { passive: true });
    
        syncAppHeight();
        window.addEventListener("orientationchange", syncAppHeight);
    
        animate();
    }
    
    function syncAppHeight() {
        // Use innerHeight (stable layout height) not visualViewport.height which
        // shrinks when the Safari toolbar appears, causing the canvas to fall short.
        const appHeight = window.innerHeight;
        document.documentElement.style.setProperty("--app-height", `${appHeight}px`);
    }
    
    async function loadAssets() {
        setStatus("Loading models...");
    
        try {
            const [chain, dogTag] = await Promise.all([
                loadModel(chainModelUrl),
                loadModel(dogTagModelUrl),
            ]);
    
            let font = null;
            try {
                font = await loadFont(fontUrl);
            } catch (fontError) {
                console.warn("Text font failed to load; using canvas-only labels", fontError);
            }
    
            linkModel = chain;
    
            normalizeModel(linkModel, 1.5);
            configureLinkLayout(linkModel);
            normalizeModelToHeight(dogTag, linkHalfHeight * 2);
            dogTagManager.configureDogTagModel(dogTag);
            dogTagManager.setAssets({ dogTagModel: dogTag, textFont: font });
            fitCameraToObject(linkModel);
    
            setStatus(font ? "Chain and dog tag models loaded." : "Chain and dog tag models loaded (font unavailable, using canvas text).");
    
            if (!(await restoreChain())) {
                addLink();
            }
    
            hideSplashScreen();
        } catch (error) {
            console.error("Failed to load assets", error);
            const details = error?.message || error?.toString?.() || "Unknown asset error";
            setStatus(`Failed to load 3D assets: ${details}`);
            hideSplashScreen();
        }
    }
    
    function loadModel(url) {
        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
        loader.setDRACOLoader(dracoLoader);
    
        return new Promise((resolve, reject) => {
            loader.load(
                url,
                (gltf) => {
                    dracoLoader.dispose();
                    resolve(gltf.scene);
                },
                undefined,
                (error) => {
                    dracoLoader.dispose();
                    reject(error);
                }
            );
        });
    }
    
    function loadFont(url) {
        const loader = new FontLoader();
        return new Promise((resolve, reject) => {
            loader.load(url, (font) => resolve(font), undefined, (error) => reject(error));
        });
    }
    
    function normalizeModel(model, targetSize) {
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
    
        if (maxDimension > 0 && targetSize > 0) {
            const scale = targetSize / maxDimension;
            model.scale.setScalar(scale);
        }
    
        box.setFromObject(model);
        box.getCenter(center);
        model.position.sub(center);
    }
    
    function normalizeModelToHeight(model, targetHeight) {
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
    
        if (size.y <= 0 || targetHeight <= 0) {
            normalizeModel(model, Math.max(targetHeight, 0.1));
            return;
        }
    
        const scale = targetHeight / size.y;
        model.scale.setScalar(scale);
    
        const center = new THREE.Vector3();
        box.setFromObject(model);
        box.getCenter(center);
        model.position.sub(center);
    }
    
    function configureLinkLayout(model) {
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        const verticalSize = size.y > 0 ? size.y : maxDimension;
    
        linkSpacing = Math.max(0.15, verticalSize * 0.58);
        linkHalfHeight = Math.max(0.08, verticalSize * 0.5);
    }
    
    function fitCameraToObject(object) {
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        const fitHeightDistance = maxDimension / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
        const fitWidthDistance = fitHeightDistance / camera.aspect;
        const distance = Math.max(fitHeightDistance, fitWidthDistance) * 2.6;
    
        camera.position.set(0, 0, distance || 4);
        camera.lookAt(0, 0, 0);
        camera.near = 0.01;
        camera.far = Math.max(100, distance * 10);
        camera.updateProjectionMatrix();
    
        zoomMinZ = camera.position.z;
        updateZoomLimits();
        updateCameraVerticalLimits();
    }
    
    function updateZoomLimits() {
        if (chainLinks.length <= 1) {
            zoomMaxZ = zoomMinZ;
            syncZoomSlider();
            return;
        }
    
        const chainHeight = (chainLinks.length - 1) * linkSpacing + linkHalfHeight * 2;
        const fitAll = (chainHeight / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        zoomMaxZ = Math.max(fitAll * 1.2, zoomMinZ);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, zoomMinZ, zoomMaxZ);
        syncZoomSlider();
    }
    
    function updateCameraVerticalLimits() {
        if (chainLinks.length === 0) {
            cameraMinY = -linkHalfHeight;
            cameraMaxY = linkHalfHeight;
        } else {
            let topY = -Infinity;
            let bottomY = Infinity;
    
            for (const link of chainLinks) {
                topY = Math.max(topY, link.position.y + linkHalfHeight);
                bottomY = Math.min(bottomY, link.position.y - linkHalfHeight);
            }
    
            const padding = Math.max(0.08, linkHalfHeight * 0.4);
            cameraMaxY = topY + padding;
            cameraMinY = bottomY - padding;
        }
    
        camera.position.y = THREE.MathUtils.clamp(camera.position.y, cameraMinY, cameraMaxY);
        camera.lookAt(0, camera.position.y, 0);
    }
    
    function onMouseWheel(event) {
        if (chainLinks.length === 0) {
            return;
        }
    
        event.preventDefault();
    
        if (event.ctrlKey) {
            const zoomSpeed = 0.1;
            camera.position.z += event.deltaY * scrollSensitivity * camera.position.z * zoomSpeed * 60;
            camera.position.z = THREE.MathUtils.clamp(camera.position.z, zoomMinZ, zoomMaxZ);
            syncZoomSlider();
        } else {
            const scrollStep = Math.max(0.05, linkSpacing * 0.35);
            camera.position.y -= event.deltaY * scrollSensitivity * scrollStep;
            camera.position.y = THREE.MathUtils.clamp(camera.position.y, cameraMinY, cameraMaxY);
            camera.lookAt(0, camera.position.y, 0);
        }
    }
    
    function addLink() {
        if (!linkModel) {
            setStatus("Chain model is not ready yet.");
            return;
        }
    
        const newLink = linkModel.clone(true);
    
        if (chainLinks.length === 0) {
            newLink.position.set(0, 0, 0);
            chainLinks.push(newLink);
        } else {
            const topLink = chainLinks[0];
            newLink.position.copy(topLink.position);
            newLink.position.y += linkSpacing;
            chainLinks.unshift(newLink);
    
            dogTagManager.shiftIndices(1);
        }
    
        scene.add(newLink);
        chainInteraction.rebuildFromLinks();
        chainInteraction.applyToLinks();
        updateZoomLimits();
        updateCameraVerticalLimits();
        setStatus(`Chain links: ${chainLinks.length}`);
    
        if (!isRestoring) {
            saveChain();
        }
    }
    
    function addDogTagWithTitle(title) {
        if (!dogTagManager.hasAssets()) {
            setStatus("Dog tag assets are still loading.");
            return;
        }
    
        addLink();
    
        dogTagManager.prependTag(title, 0);
        updateDogTagViewMode();
    
        if (!isRestoring) {
            saveChain();
        }
    }
    
    function removeLink() {
        if (chainLinks.length === 0) {
            return;
        }
    
        const firstLink = chainLinks.shift();
        scene.remove(firstLink);
    
        const removedTags = dogTagManager.removeAtIndex(0);
        for (const removedTag of removedTags) {
            if (selectedTagId === removedTag.id) {
                selectedTagId = null;
                closeHeroCard();
            }
        }
    
        chainInteraction.rebuildFromLinks();
        chainInteraction.applyToLinks();
        updateZoomLimits();
        updateCameraVerticalLimits();
        setStatus(`Chain links: ${chainLinks.length}`);
    
        if (!isRestoring) {
            saveChain();
        }
    }
    
    function setStatus(message) {
        if (message.startsWith("Chain links: ")) {
            const number = message.replace("Chain links: ", "");
            statusMessage.innerHTML = `<span style="font-size: 14px;">Chain links: </span><span style="font-size: 24px;">${number}</span>`;
            statusMessage.style.display = "flex";
            statusMessage.style.alignItems = "center";
            statusMessage.style.gap = "4px";
        } else {
            statusMessage.textContent = message;
            statusMessage.style.display = "block";
        }
    }
    
    function onWindowResize() {
        syncAppHeight();
        // Use the canvas's actual displayed dimensions (accounts for full-screen CSS inset:0
        // including areas behind notches/dynamic islands on mobile).
        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        resizeHeroPreview();
    }
    
    function onCanvasPointerDown(event) {
        if (event.pointerType !== "touch") {
            return;
        }
    
        isTouchScrolling = true;
        activeTouchScrollId = event.pointerId;
        lastTouchClientY = event.clientY;
    }
    
    function onCanvasPointerMove(event) {
        if (!isTouchScrolling || event.pointerType !== "touch" || event.pointerId !== activeTouchScrollId) {
            return;
        }
    
        // Link dragging takes priority over camera scroll dragging.
        if (chainInteraction?.isDragging?.()) {
            lastTouchClientY = event.clientY;
            return;
        }
    
        const deltaY = event.clientY - lastTouchClientY;
        lastTouchClientY = event.clientY;
    
        const scrollStep = Math.max(0.05, linkSpacing * 0.35);
        camera.position.y += deltaY * scrollSensitivity * scrollStep * 1.6;
        camera.position.y = THREE.MathUtils.clamp(camera.position.y, cameraMinY, cameraMaxY);
        camera.lookAt(0, camera.position.y, 0);
    
        if (event.cancelable) {
            event.preventDefault();
        }
    }
    
    function onCanvasPointerUp(event) {
        if (event.pointerType !== "touch" || event.pointerId !== activeTouchScrollId) {
            return;
        }
    
        isTouchScrolling = false;
        activeTouchScrollId = null;
    }
    
    function syncZoomSlider() {
        if (!zoomSlider) {
            return;
        }
    
        if (zoomMaxZ <= zoomMinZ) {
            zoomSlider.value = "0";
            return;
        }
    
        const ratio = (camera.position.z - zoomMinZ) / (zoomMaxZ - zoomMinZ);
        const clampedRatio = THREE.MathUtils.clamp(ratio, 0, 1);
        zoomSlider.value = String(Math.round(clampedRatio * 100));
    }
    
    function applyZoomFromSlider() {
        if (!zoomSlider || zoomMaxZ <= zoomMinZ) {
            return;
        }
    
        const ratio = Number(zoomSlider.value) / 100;
        camera.position.z = THREE.MathUtils.lerp(zoomMinZ, zoomMaxZ, ratio);
        updateDogTagViewMode();
    }
    
    if (zoomSlider) {
        zoomSlider.addEventListener("input", applyZoomFromSlider);
    }
    
    document.getElementById("addEcho").onclick = openEchoModal;
    
    function openEchoModal() {
        closeProfileScreen();
        closeChallengesScreen();
        setActiveMenuButton(null);
        toggleMenu(false);
        const modal = document.getElementById("echoModal");
        if (modal) {
            modal.classList.remove("hidden");
        }
    }
    
    function closeEchoModal() {
        const modal = document.getElementById("echoModal");
        if (modal) {
            modal.classList.add("hidden");
        }
    }
    
    function isProfileScreenOpen() {
        return !!profileScreen && !profileScreen.classList.contains("hidden");
    }
    
    function setActiveMenuButton(activeButton = null) {
        [profileBtn, milestonesBtn, settingsBtn].forEach((button) => {
            if (!button) {
                return;
            }
    
            button.classList.toggle("is-active", button === activeButton);
        });
    }
    
    function ensureProfileJoinedDate() {
        const storageKey = "profileJoinedDate";
        let joinedDate = localStorage.getItem(storageKey);
    
        if (!joinedDate) {
            joinedDate = new Date().toISOString();
            localStorage.setItem(storageKey, joinedDate);
        }
    
        return joinedDate;
    }
    
    function formatProfileDate(value) {
        const date = value ? new Date(value) : new Date();
    
        if (Number.isNaN(date.getTime())) {
            return "04-11-2026";
        }
    
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const year = String(date.getFullYear());
        return `${month}-${day}-${year}`;
    }
    
    function renderRecentLinks(titles) {
        if (!recentLinksList) {
            return;
        }
    
        recentLinksList.innerHTML = "";
    
        if (titles.length === 0) {
            const empty = document.createElement("div");
            empty.className = "recent-link-empty";
            empty.textContent = "No links yet";
            recentLinksList.appendChild(empty);
            return;
        }

        titles.forEach((title) => {
            const pill = document.createElement("div");
            pill.className = "recent-link-pill";
            pill.textContent = title;
            recentLinksList.appendChild(pill);
        });
    }

    // ─── Notification bell helpers ──────────────────────────
    let currentViewingUserId = null; // track which profile card is being viewed

    async function updateNotificationBell() {
        const incoming = getCachedIncoming();
        const count = incoming.length;
        if (notificationBellIcon) {
            notificationBellIcon.src = count > 0
                ? 'assets/images/notification-on.png'
                : 'assets/images/notification-off.png';
        }
        if (notificationBadge) {
            notificationBadge.textContent = count > 0 ? String(count) : '';
            notificationBadge.classList.toggle('hidden', count === 0);
        }
    }

    function renderNotificationDropdown() {
        if (!notificationList) return;
        const incoming = getCachedIncoming();

        if (incoming.length === 0) {
            notificationList.innerHTML = '<p class="notif-empty">No notifications</p>';
            return;
        }

        notificationList.innerHTML = '';
        incoming.forEach(req => {
            const profile = req.profiles;
            const username = profile?.username || 'Someone';
            const avatar = profile?.avatar_url || 'assets/images/Profile Icon.png';

            const item = document.createElement('div');
            item.className = 'notif-item';
            item.innerHTML = `
                <img class="notif-item-avatar" src="${avatar}" alt="">
                <span class="notif-item-info"><b>${username}</b> sent you a friend request</span>
                <div class="notif-item-actions">
                    <button class="notif-accept-btn" data-req-id="${req.id}">Accept</button>
                    <button class="notif-decline-btn" data-req-id="${req.id}">Decline</button>
                </div>
            `;
            notificationList.appendChild(item);
        });

        // Wire accept/decline buttons
        notificationList.querySelectorAll('.notif-accept-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                await acceptFriendRequest(btn.dataset.reqId);
                await refreshFriendData();
                updateNotificationBell();
                renderNotificationDropdown();
                loadProfiles().then(filterFriendsGrid);
                // Refresh current viewed profile's friend status
                if (currentViewingUserId) updateFriendStatusUI(currentViewingUserId);
            });
        });
        notificationList.querySelectorAll('.notif-decline-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                await declineFriendRequest(btn.dataset.reqId);
                await refreshFriendData();
                updateNotificationBell();
                renderNotificationDropdown();
            });
        });
    }

    // Toggle notification dropdown
    if (notificationBellBtn) {
        notificationBellBtn.addEventListener('click', () => {
            const isOpen = !notificationDropdown.classList.contains('hidden');
            notificationDropdown.classList.toggle('hidden', isOpen);
            if (!isOpen) renderNotificationDropdown();
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (notificationDropdown && !notificationDropdown.classList.contains('hidden')) {
            if (!notificationDropdown.contains(e.target) && e.target !== notificationBellBtn && !notificationBellBtn?.contains(e.target)) {
                notificationDropdown.classList.add('hidden');
            }
        }
    });

    // ─── Add friend button / status tag helpers ─────────────
    async function getCurrentUserId() {
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id ?? null;
    }

    async function updateFriendStatusUI(targetUserId) {
        const myId = await getCurrentUserId();
        if (!myId) return;
        const status = getStatusForProfile(targetUserId, myId);

        // Hide add friend button and status tag first; reset block button
        if (addFriendBtn) addFriendBtn.style.display = 'none';
        if (blockUserBtn) blockUserBtn.classList.remove('is-active');
        if (friendStatusTag) {
            friendStatusTag.classList.add('hidden');
            friendStatusTag.className = 'friend-status-tag hidden';
            friendStatusTag.innerHTML = '';
        }

        if (status === 'self') {
            if (profileActions) profileActions.classList.add('hidden');
            return;
        }

        // Always show actions row (block is always visible)
        if (profileActions) profileActions.classList.remove('hidden');

        if (status === 'blocked') {
            // Show block button as active
            if (blockUserBtn) blockUserBtn.classList.add('is-active');
            return;
        }

        if (status === 'none') {
            // Show add friend button
            if (addFriendBtn) addFriendBtn.style.display = 'flex';
        } else if (status === 'pending-sent') {
            // Show pending tag (like the "You" badge style)
            if (friendStatusTag) {
                friendStatusTag.classList.remove('hidden');
                friendStatusTag.classList.add('tag-pending');
                friendStatusTag.textContent = 'Pending';
                friendStatusTag.style.cursor = 'pointer';
            }
        } else if (status === 'pending-received') {
            // They sent us a request — show pending
            if (friendStatusTag) {
                friendStatusTag.classList.remove('hidden');
                friendStatusTag.classList.add('tag-pending');
                friendStatusTag.textContent = 'Pending';
                friendStatusTag.style.cursor = '';
            }
        } else if (status === 'friend') {
            // Show friend added icon
            if (friendStatusTag) {
                friendStatusTag.classList.remove('hidden');
                friendStatusTag.classList.add('tag-friend');
                friendStatusTag.innerHTML = '<img src="assets/images/Added Friend icon.png" alt="Friend">';
            }
        }
    }

    // Add friend button click
    if (addFriendBtn) {
        addFriendBtn.addEventListener('click', async () => {
            if (!currentViewingUserId) return;
            addFriendBtn.style.pointerEvents = 'none';
            await sendFriendRequest(currentViewingUserId);
            await refreshFriendData();
            updateFriendStatusUI(currentViewingUserId);
            updateNotificationBell();
            addFriendBtn.style.pointerEvents = '';
        });
    }

    // Cancel pending friend request by clicking the "Pending" tag
    if (friendStatusTag) {
        friendStatusTag.addEventListener('click', async () => {
            if (!currentViewingUserId) return;
            const myId = await getCurrentUserId();
            if (!myId) return;
            const status = getStatusForProfile(currentViewingUserId, myId);
            if (status !== 'pending-sent') return;
            friendStatusTag.style.pointerEvents = 'none';
            await cancelFriendRequest(currentViewingUserId);
            await refreshFriendData();
            updateFriendStatusUI(currentViewingUserId);
            updateNotificationBell();
            friendStatusTag.style.pointerEvents = '';
        });
    }

    // Cancel pending friend request by clicking the "Pending" tag
    if (friendStatusTag) {
        friendStatusTag.addEventListener('click', async () => {
            if (!currentViewingUserId) return;
            const myId = await getCurrentUserId();
            if (!myId) return;
            const status = getStatusForProfile(currentViewingUserId, myId);
            if (status !== 'pending-sent') return;
            friendStatusTag.style.pointerEvents = 'none';
            await cancelFriendRequest(currentViewingUserId);
            await refreshFriendData();
            updateFriendStatusUI(currentViewingUserId);
            updateNotificationBell();
            friendStatusTag.style.pointerEvents = '';
        });
    }

    // Block / unblock button
    if (blockUserBtn) {
        blockUserBtn.addEventListener('click', async () => {
            if (!currentViewingUserId) return;
            blockUserBtn.style.pointerEvents = 'none';

            const isCurrentlyBlocked = getCachedBlockedIds().includes(currentViewingUserId);
            if (isCurrentlyBlocked) {
                await unblockUser(currentViewingUserId);
            } else {
                await blockUser(currentViewingUserId);
            }

            await refreshFriendData();
            updateFriendStatusUI(currentViewingUserId);
            updateNotificationBell();
            // Reload profiles to hide/show the blocked user
            loadProfiles().then(filterFriendsGrid);
            blockUserBtn.style.pointerEvents = '';
        });
    }

    function updateProfileScreen() {
        if (!profileScreen) {
            return;
        }
    
        syncProfileAvatarIcons();
    
        // Set the name text without destroying the edit button child
        const displayName = localStorage.getItem("profileDisplayName") || "Your Name";
        const editBtnEl = profileNameHeading.querySelector('.profile-edit-gear');
        profileNameHeading.textContent = displayName;
        if (editBtnEl) profileNameHeading.appendChild(editBtnEl);
    
        const savedTags = dogTagManager?.serialize?.() || [];
        // Use chainLinks.length for total links (matches the actual chain)
        const totalLinks = chainLinks.length;
        const chainLengthInches = totalLinks * 1.5;
        const recentTitles = savedTags.length > 0
            ? savedTags.slice(0, 2).map((entry) => entry.title)
            : ["Finished a workout", "Went on a walk"];
    
        if (profileChainLength) {
            profileChainLength.textContent = `${chainLengthInches.toFixed(1)} in.`;
        }
    
        if (profileTotalLinks) {
            profileTotalLinks.textContent = String(totalLinks);
        }
    
        if (profileJoinDate) {
            profileJoinDate.textContent = formatProfileDate(cachedJoinedAt || ensureProfileJoinedDate());
        }
    
        renderRecentLinks(recentTitles);
    }
    
    // Helper to show profile info (self or friend)
    function showProfileInfo(card) {
        const heroCard = document.querySelector('.profile-hero-card');
        if (!heroCard) return;

        const isYou = !card || card.getAttribute('data-is-you') === 'true';

        heroCard.style.transition = 'transform 0.22s cubic-bezier(.7,0,.3,1)';
        heroCard.style.transform = 'translateX(120%)';

        setTimeout(() => {
            heroCard.style.transition = 'none';
            heroCard.style.transform = 'translateX(120%)';

            if (isYou || !card) {
                currentViewingUserId = null;
                updateProfileScreen();
                profileScreen?.classList.remove('is-viewing-other');
                // Reset friend UI
                if (profileActions) profileActions.classList.add('hidden');
                if (friendStatusTag) { friendStatusTag.classList.add('hidden'); friendStatusTag.innerHTML = ''; }
            } else {
                const userId = card.getAttribute('data-user-id') || '';
                currentViewingUserId = userId || null;
                const name = card.getAttribute('data-name') || 'Unknown';
                const chainCount = parseInt(card.getAttribute('data-chain-count') || '0', 10);
                const joinedAt = card.getAttribute('data-joined-at') || '';
                const chainLength = (chainCount * 1.5).toFixed(1);
                const friendAvatar = card.querySelector('.friend-avatar img')?.src;

                if (profileNameHeading) {
                    const editBtn = profileNameHeading.querySelector('.profile-edit-gear');
                    profileNameHeading.textContent = name;
                    if (editBtn) profileNameHeading.appendChild(editBtn);
                }
                if (profileChainLength) profileChainLength.textContent = `${chainLength} in.`;
                if (profileTotalLinks) profileTotalLinks.textContent = String(chainCount);
                if (profileJoinDate) profileJoinDate.textContent = formatProfileDate(joinedAt);

                // Parse and display friend's dog tags as recent links
                // Hide dog tags if the user is blocked (either direction)
                const blockedIds = getCachedBlockedIds();
                const isBlockedUser = blockedIds.includes(userId);
                let friendTags = [];
                if (!isBlockedUser) {
                    try {
                        friendTags = JSON.parse(card.getAttribute('data-dog-tags') || '[]');
                    } catch { friendTags = []; }
                }
                const friendTitles = Array.isArray(friendTags)
                    ? friendTags.slice(0, 2).map(t => t.title || 'Untitled')
                    : [];
                renderRecentLinks(isBlockedUser ? [] : friendTitles);

                // Show friend's avatar in the hero panel
                const profileHeroAvatar = document.querySelector('.profile-hero-avatar');
                if (profileHeroAvatar) profileHeroAvatar.src = friendAvatar || 'assets/images/Profile Icon.png';
                profileScreen?.classList.add('is-viewing-other');

                // Show profile actions synchronously so layout is stable before the slide-in animation.
                // updateFriendStatusUI is async and fine-tunes button states after.
                if (profileActions) profileActions.classList.remove('hidden');

                // Update friend status UI for this profile
                if (currentViewingUserId) updateFriendStatusUI(currentViewingUserId);
            }

            void heroCard.offsetWidth;
            heroCard.style.transition = 'transform 0.22s cubic-bezier(.7,0,.3,1)';
            heroCard.style.transform = 'translateX(0)';
        }, 220);
    }
    
    function filterFriendsGrid() {
        if (!friendsGrid) {
            return;
        }
    
        const query = friendsSearchInput ? friendsSearchInput.value.trim().toLowerCase() : "";
        let visibleCount = 0;
    
        friendsGrid.querySelectorAll(".friend-card").forEach((card) => {
            const name = (card.getAttribute("data-name") || card.textContent || "").toLowerCase();
            const isVisible = !query || name.includes(query);
            card.classList.toggle("is-filtered-out", !isVisible);
    
            if (isVisible) {
                visibleCount += 1;
            }
        });
    
        if (friendsEmptyState) {
            friendsEmptyState.classList.toggle("hidden", visibleCount > 0);
        }
    }
    
    function openProfileScreen() {
        if (!profileScreen) {
            return;
        }
    
        closeSettings();
        closeEchoModal();
        closeChallengesScreen();
        currentViewingUserId = null;
        updateProfileScreen();
        profileScreen.classList.remove("hidden");
        profileScreen.classList.remove("is-viewing-other");
        document.body.classList.add("profile-open");
        // Show fixed notification bell
        if (notificationBellBtn) notificationBellBtn.style.display = 'flex';
        shouldRenderScene = false;
        toggleMenu(true);
        setActiveMenuButton(profileBtn);

        // Reset friend UI
        if (profileActions) profileActions.classList.add('hidden');
        if (friendStatusTag) { friendStatusTag.classList.add('hidden'); friendStatusTag.innerHTML = ''; }
        // Close notification dropdown
        if (notificationDropdown) notificationDropdown.classList.add('hidden');

        // Refresh friend data then update bell and load profiles
        refreshFriendData().then(() => {
            updateNotificationBell();
        });

        loadProfiles().then(() => {
            filterFriendsGrid();
            // Auto-highlight the You card since that's whose data is showing
            const youCard = friendsGrid?.querySelector('.friend-card.is-you');
            if (youCard) {
                friendsGrid.querySelectorAll('.friend-card').forEach(c => c.classList.remove('is-featured'));
                youCard.classList.add('is-featured');
            }
        });
        filterFriendsGrid();
    }
    
    function closeProfileScreen() {
        if (!profileScreen) {
            return;
        }
    
        profileScreen.classList.add("hidden");
        document.body.classList.remove("profile-open");
        // Hide fixed notification UI
        if (notificationBellBtn) notificationBellBtn.style.display = 'none';
        if (notificationDropdown) notificationDropdown.classList.add('hidden');
        shouldRenderScene = true;
        updateCameraVerticalLimits();
        updateDogTagViewMode();
        renderer.render(scene, camera);
        setActiveMenuButton(null);
    }
    
    function openChallengesScreen() {
        if (!challengesScreen) return;
        closeProfileScreen();
        closeSettings();
        closeEchoModal();
        challengesScreen.classList.remove("hidden");
        document.body.classList.add("challenges-open");
        shouldRenderScene = false;
        toggleMenu(true);
        setActiveMenuButton(milestonesBtn);
        populateLeaderboard();
        renderChallenges();
    }
    
    async function populateLeaderboard() {
        const container = document.querySelector('.leaderboard-cards');
        if (!container) return;
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, chain_count')
            .order('chain_count', { ascending: false })
            .limit(3);
        if (error || !data) return;
        // Get previous leaderboard order from window
        const prevOrder = window.lastLeaderboardOrder || [];
        const newOrder = data.map(p => p?.id || null);
        // Compute rank changes
        let rankChange = [0, 0, 0]; // 1=up, -1=down, 0=same/new
        if (prevOrder.length === 3) {
            for (let i = 0; i < 3; ++i) {
                const id = newOrder[i];
                if (!id) continue;
                const prevIdx = prevOrder.indexOf(id);
                if (prevIdx === -1) continue; // new to leaderboard
                if (prevIdx > i) rankChange[i] = 1; // moved up
                else if (prevIdx < i) rankChange[i] = -1; // moved down
            }
        }
        // Save new order for next time
        window.lastLeaderboardOrder = newOrder;
        // Update cards
        const cards = container.querySelectorAll('.leaderboard-card');
        cards.forEach((card, i) => {
            const profile = data[i];
            const rankEl = card.querySelector('.leaderboard-card-rank');
            const linksEl = card.querySelector('.leaderboard-card-links');
            const arrowUp = card.querySelector('.leaderboard-rank-arrow.up');
            const arrowDown = card.querySelector('.leaderboard-rank-arrow.down');
            // Hide both arrows by default
            if (arrowUp) arrowUp.style.display = 'none';
            if (arrowDown) arrowDown.style.display = 'none';
            if (profile) {
                if (rankEl) rankEl.textContent = `${i + 1}. ${profile.username ?? 'Unknown'}`;
                if (linksEl) linksEl.textContent = `${profile.chain_count ?? 0} Links`;
                if (rankChange[i] === 1 && arrowUp) arrowUp.style.display = '';
                if (rankChange[i] === -1 && arrowDown) arrowDown.style.display = '';
            } else {
                if (rankEl) rankEl.textContent = `${i + 1}. —`;
                if (linksEl) linksEl.textContent = '0 Links';
            }
        });
    }
    
    function closeChallengesScreen() {
        if (!challengesScreen) return;
        challengesScreen.classList.add("hidden");
        document.body.classList.remove("challenges-open");
        shouldRenderScene = true;
        updateCameraVerticalLimits();
        updateDogTagViewMode();
        renderer.render(scene, camera);
        setActiveMenuButton(null);
    }
    
    function isChallengesScreenOpen() {
        return !!challengesScreen && !challengesScreen.classList.contains("hidden");
    }

    if (friendsSearchInput) {
        friendsSearchInput.addEventListener("input", filterFriendsGrid);
    }
    
    function setProfileHeroCollapsed(collapsed) {
        if (!profileScreen) {
            return;
        }
    
        profileScreen.classList.toggle("hero-collapsed", collapsed);
    
        if (profileHeroToggle) {
            profileHeroToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
            profileHeroToggle.setAttribute("aria-label", collapsed ? "Expand profile summary" : "Collapse profile summary");
        }
    }
    
    if (profileHeroToggle) {
        setProfileHeroCollapsed(false);
        profileHeroToggle.addEventListener("click", () => {
            setProfileHeroCollapsed(!profileScreen.classList.contains("hero-collapsed"));
        });
    }
    
    if (friendsGrid) {
        friendsGrid.addEventListener("click", (event) => {
            const selectedCard = event.target.closest(".friend-card");
            if (!selectedCard) return;

            // Block navigation while in edit mode — shake avatar and nameplate instead
            if (profileScreen && profileScreen.classList.contains('edit-mode')) {
                const avatar = selectedCard.querySelector('.friend-avatar');
                const name = selectedCard.querySelector('.friend-name');
                [avatar, name].forEach(el => {
                    if (!el) return;
                    el.classList.remove('is-shaking');
                    void el.offsetWidth; // reflow to restart animation
                    el.classList.add('is-shaking');
                    el.addEventListener('animationend', () => el.classList.remove('is-shaking'), { once: true });
                });
                return;
            }

            // Highlight only the clicked card
            friendsGrid.querySelectorAll(".friend-card").forEach(card => card.classList.toggle("is-featured", card === selectedCard));

            // Show friend info with animation
            showProfileInfo(selectedCard);
        });
    }
    
    function syncTitleCharCount() {
        if (!titleInput || !titleCharCount) {
            return;
        }
        titleCharCount.textContent = `${titleInput.value.length}/40`;
    }
    
    if (titleInput) {
        titleInput.addEventListener("input", syncTitleCharCount);
        syncTitleCharCount();
    }
    
    document.getElementById("confirmEcho").onclick = () => {
        const title = titleInput ? titleInput.value : "";
    
        if (title.trim()) {
            addDogTagWithTitle(title);
            if (titleInput) {
                titleInput.value = "";
            }
            syncTitleCharCount();
            closeEchoModal();
        }
    };
    
    document.getElementById("cancelEcho").onclick = closeEchoModal;
    
    if (profileBtn) {
        profileBtn.onclick = () => {
            if (isProfileScreenOpen()) {
                closeProfileScreen();
                toggleMenu(false);
                return;
            }
    
            openProfileScreen();
        };
    }
    
    if (milestonesBtn) {
        milestonesBtn.onclick = () => {
            if (isChallengesScreenOpen()) {
                closeChallengesScreen();
                toggleMenu(false);
                return;
            }
            openChallengesScreen();
        };
    }
    
    if (removeTagBtn) {
        removeTagBtn.onclick = () => {
            if (selectedTagId === null) {
                return;
            }
    
            const removed = dogTagManager.removeTagById(selectedTagId);
            if (!removed) {
                return;
            }
    
            const removedLink = chainLinks.splice(removed.index, 1)[0];
            if (removedLink) {
                scene.remove(removedLink);
            }
    
            chainInteraction.rebuildFromLinks();
            chainInteraction.applyToLinks();
            // Re-attach after link rotations are re-derived for the new indices.
            dogTagManager.refreshAttachments();
            updateZoomLimits();
            updateCameraVerticalLimits();
            setStatus(`Chain links: ${chainLinks.length}`);
    
            selectedTagId = null;
            closeHeroCard();
            updateDogTagViewMode();
            saveChain();
        };
    }
    
    function onCanvasClick(event) {
        const tag = dogTagManager.pickTagFromEvent(event, canvas, camera);
        if (!tag) {
            selectedTagId = null;
            closeHeroCard();
            updateDogTagViewMode();
            return;
        }
    
        selectedTagId = tag.id;
        openHeroCard(tag.id);
        focusCameraOnTag(tag);
        positionRemoveBtnBelowTag(tag);
        updateDogTagViewMode();
    }
    
    function focusCameraOnTag(tag) {
        tag.root.getWorldPosition(tmpWorld);
    
        camera.position.y = THREE.MathUtils.clamp(tmpWorld.y, cameraMinY, cameraMaxY);
        camera.position.z = Math.max(zoomMinZ, zoomMinZ * 1.08);
        camera.lookAt(0, camera.position.y, 0);
        syncZoomSlider();
    }
    
    function positionRemoveBtnBelowTag(tag) {
        if (!removeTagBtn || window.innerWidth > 600) return;
    
        // Project the bottom-centre of the tag bounding box to screen Y
        const box = new THREE.Box3().setFromObject(tag.root);
        const bottomCentre = new THREE.Vector3(
            (box.min.x + box.max.x) * 0.5,
            box.min.y,
            (box.min.z + box.max.z) * 0.5
        );
        bottomCentre.project(camera);
    
        const screenY = (-bottomCentre.y * 0.5 + 0.5) * canvas.clientHeight;
        removeTagBtn.style.top = `${Math.round(screenY + 80)}px`;
        removeTagBtn.style.left = '50%';
        removeTagBtn.style.bottom = 'auto';
        removeTagBtn.style.right = 'auto';
        removeTagBtn.style.transform = 'translateX(-50%)';
    }
    
    function openHeroCard(tagId) {
        const tag = dogTagManager.getTagById(tagId);
        if (!tag) {
            return;
        }
    
        document.getElementById("heroPreviewOverlay").classList.remove("hidden");
        document.getElementById("heroPreviewStage").classList.remove("hidden");
    
        initHeroPreview(tag);
    }
    
    function closeHeroCard() {
        document.getElementById("heroPreviewOverlay").classList.add("hidden");
        document.getElementById("heroPreviewStage").classList.add("hidden");
        disposeHeroPreviewRenderer();
    }
    
    function initHeroPreview(tag) {
        const canvasEl = document.getElementById("heroPreviewCanvas");
        if (!canvasEl) {
            return;
        }
    
        disposeHeroPreviewRenderer();
    
        heroPreviewRenderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true });
        heroPreviewRenderer.setClearColor(0x000000, 0);
        heroPreviewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
        heroPreviewScene = new THREE.Scene();
        heroPreviewCamera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
    
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
        keyLight.position.set(2.2, 2.6, 3.1);
        heroPreviewScene.add(keyLight);
    
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
        fillLight.position.set(-2, 1.2, 1.4);
        heroPreviewScene.add(fillLight);
    
        const ambient = new THREE.AmbientLight(0xffffff, 0.9);
        heroPreviewScene.add(ambient);
    
        heroPreviewRoot = tag.root.clone(true);
        heroPreviewRoot.position.set(0, 0, 0);
        heroPreviewRoot.rotation.set(0, 0, 0);
        heroPreviewRoot.scale.setScalar(1);
        const previewCanvasLabel = heroPreviewRoot.children[1];
        const previewTextLabel = heroPreviewRoot.children[2];
    
        if (previewCanvasLabel) {
            previewCanvasLabel.visible = false;
        }
    
        if (previewTextLabel) {
            previewTextLabel.visible = true;
        }
    
        heroPreviewScene.add(heroPreviewRoot);
    
        // Track the active front label for visibility toggling during flip
        heroPreviewFrontLabels = [];
        if (previewTextLabel) {
            heroPreviewFrontLabels.push(previewTextLabel);
        }
    
        // Create back-face date label (hidden until flipped)
        heroPreviewBackLabel = dogTagManager.createHeroBackDateMesh(tag.createdAt, previewTextLabel, tag.isQuarterTurn);
        heroPreviewBackLabel.visible = false;
        heroPreviewRoot.add(heroPreviewBackLabel);
    
        // Center the preview around its visual bounds so flip rotation stays in place.
        recenterObjectToBounds(heroPreviewRoot);
        heroPreviewIsQuarterTurn = !!tag.isQuarterTurn;
        heroPreviewBasePosition.copy(heroPreviewRoot.position);
    
        // Reset flip state
        heroFlipAngle = 0;
        heroFlipTarget = 0;
    
        fitHeroPreviewCamera();
        startHeroRenderLoop();
    
        canvasEl.addEventListener("click", onHeroPreviewCanvasClick);
    }
    
    function recenterObjectToBounds(object3d) {
        if (!object3d) {
            return;
        }
    
        const box = new THREE.Box3().setFromObject(object3d);
        if (box.isEmpty()) {
            return;
        }
    
        const center = box.getCenter(new THREE.Vector3());
        object3d.position.sub(center);
    }
    
    function onHeroPreviewCanvasClick(event) {
        if (!heroPreviewRenderer || !heroPreviewCamera || !heroPreviewRoot) {
            return;
        }
    
        const canvasEl = heroPreviewRenderer.domElement;
        const rect = canvasEl.getBoundingClientRect();
        const pointer = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
    
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(pointer, heroPreviewCamera);
        const hits = raycaster.intersectObjects([heroPreviewRoot], true);
    
        if (hits.length === 0) {
            selectedTagId = null;
            closeHeroCard();
            updateDogTagViewMode();
        } else {
            // Flip the tag to reveal the opposite face
            heroFlipTarget = heroFlipTarget === 0 ? Math.PI : 0;
        }
    }
    
    function fitHeroPreviewCamera() {
        if (!heroPreviewRenderer || !heroPreviewCamera || !heroPreviewRoot) {
            return;
        }
    
        const canvasEl = heroPreviewRenderer.domElement;
        const width = Math.max(1, canvasEl.clientWidth);
        const height = Math.max(1, canvasEl.clientHeight);
        heroPreviewRenderer.setSize(width, height, false);
    
        heroPreviewCamera.aspect = width / height;
        heroPreviewCamera.updateProjectionMatrix();
    
        const box = new THREE.Box3().setFromObject(heroPreviewRoot);
        const center = box.getCenter(new THREE.Vector3());
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        const radius = Math.max(sphere.radius, 0.1);
        const fovRad = THREE.MathUtils.degToRad(heroPreviewCamera.fov);
        const fitByHeight = radius / Math.sin(fovRad / 2);
        // Use a wider padding in mobile portrait (narrow screen) so the full tag remains legible.
        const isPortraitMobile = heroPreviewCamera.aspect < 1 && width < 600;
        const portraitPadding = heroPreviewCamera.aspect < 1 ? (isPortraitMobile ? 1.65 : 1.32) : 1.16;
        const distance = fitByHeight * portraitPadding;
    
        // Keep camera aligned with the label face normal so the tag does not appear side-on.
        const textCandidate = heroPreviewRoot.children[2];
        const focusObject = textCandidate?.geometry ? textCandidate : heroPreviewRoot.children[1] || heroPreviewRoot;
        const frontNormal = new THREE.Vector3(0, 0, 1)
            .applyQuaternion(focusObject.getWorldQuaternion(new THREE.Quaternion()))
            .normalize();
    
        heroPreviewCamera.position.copy(center).addScaledVector(frontNormal, distance);
        heroPreviewCamera.lookAt(center);
        heroPreviewCamera.updateProjectionMatrix();
    }
    
    function renderHeroPreview() {
        if (!heroPreviewRenderer || !heroPreviewScene || !heroPreviewCamera) {
            return;
        }
    
        heroPreviewRenderer.render(heroPreviewScene, heroPreviewCamera);
    }
    
    function resizeHeroPreview() {
        fitHeroPreviewCamera();
        renderHeroPreview();
    }
    
    function disposeHeroPreviewRenderer() {
        if (heroFlipRafId !== null) {
            cancelAnimationFrame(heroFlipRafId);
            heroFlipRafId = null;
        }
    
        const canvasEl = document.getElementById("heroPreviewCanvas");
        if (canvasEl) {
            canvasEl.removeEventListener("click", onHeroPreviewCanvasClick);
        }
    
        if (heroPreviewScene && heroPreviewRoot) {
            heroPreviewScene.remove(heroPreviewRoot);
        }
    
        if (heroPreviewRenderer) {
            heroPreviewRenderer.dispose();
        }
    
        heroPreviewRenderer = null;
        heroPreviewScene = null;
        heroPreviewCamera = null;
        heroPreviewRoot = null;
        heroPreviewBackLabel = null;
        heroPreviewFrontLabels = [];
        heroFlipAngle = 0;
        heroFlipTarget = 0;
        heroPreviewIsQuarterTurn = false;
    }
    
    function startHeroRenderLoop() {
        if (heroFlipRafId !== null) {
            cancelAnimationFrame(heroFlipRafId);
        }
        heroFlipRafId = requestAnimationFrame(heroRenderLoop);
    }
    
    function heroRenderLoop() {
        if (!heroPreviewRenderer || !heroPreviewScene || !heroPreviewCamera) {
            heroFlipRafId = null;
            return;
        }
    
        const diff = heroFlipTarget - heroFlipAngle;
        if (Math.abs(diff) > 0.001) {
            heroFlipAngle += diff * 0.18;
        } else {
            heroFlipAngle = heroFlipTarget;
        }
    
        if (heroPreviewRoot) {
            const flipProgress = THREE.MathUtils.clamp(heroFlipAngle / Math.PI, 0, 1);
            const flipXOffset = heroPreviewIsQuarterTurn ? heroFlipXOffsetQuarterTurn : heroFlipXOffsetFrontFacing;
            heroPreviewCamera.updateMatrixWorld();
            heroPreviewCameraRight.setFromMatrixColumn(heroPreviewCamera.matrixWorld, 0).normalize();
            heroPreviewRoot.position.copy(heroPreviewBasePosition).addScaledVector(heroPreviewCameraRight, flipXOffset * flipProgress);
            heroPreviewRoot.rotation.y = heroFlipAngle;
            const isFlipped = heroFlipAngle > Math.PI / 2;
            for (const fl of heroPreviewFrontLabels) {
                fl.visible = !isFlipped;
            }
            if (heroPreviewBackLabel) {
                heroPreviewBackLabel.visible = isFlipped;
            }
        }
    
        heroPreviewRenderer.render(heroPreviewScene, heroPreviewCamera);
        heroFlipRafId = requestAnimationFrame(heroRenderLoop);
    }
    
    function updateDogTagViewMode() {
        dogTagManager.updateViewMode({
            selectedTagId,
            lodDistance: tagTextLodDistance,
            camera,
        });
    
        if (removeTagBtn) {
            const hasSelectedTag = selectedTagId !== null && !!dogTagManager.getTagById(selectedTagId);
            removeTagBtn.classList.toggle("hidden", !hasSelectedTag);
            if (!hasSelectedTag && window.innerWidth <= 600) {
                removeTagBtn.style.top = '';
                removeTagBtn.style.left = '';
                removeTagBtn.style.bottom = '';
                removeTagBtn.style.right = '';
                removeTagBtn.style.transform = '';
            }
        }
    }
    
    const setupHeroCardListeners = () => {
        const closeBtn = document.getElementById("closeHeroPreview");
        const overlay = document.getElementById("heroPreviewOverlay");
    
        if (closeBtn) {
            closeBtn.onclick = () => {
                selectedTagId = null;
                closeHeroCard();
                updateDogTagViewMode();
            };
        }
    
        if (overlay) {
            overlay.onclick = () => {
                selectedTagId = null;
                closeHeroCard();
                updateDogTagViewMode();
            };
        }
    };
    
    setupHeroCardListeners();
    setTimeout(setupHeroCardListeners, 100);
    
    if (settingsBtn) {
        settingsBtn.onclick = () => {
            const isOpen = !document.getElementById("settingsScreen").classList.contains("hidden");
            closeProfileScreen();
    
            if (isOpen) {
                closeSettings();
            } else {
                toggleMenu(false);
                setActiveMenuButton(settingsBtn);
                document.getElementById("settingsOverlay").classList.remove("hidden");
                document.getElementById("settingsScreen").classList.remove("hidden");
            }
        };
    }
    
    document.getElementById("settingsOverlay").addEventListener("click", closeSettings);
    const settingsBackBtn = document.getElementById("settingsBackBtn");
    if (settingsBackBtn) settingsBackBtn.onclick = closeSettings;
    
    function closeSettings() {
        document.getElementById("settingsOverlay").classList.add("hidden");
        document.getElementById("settingsScreen").classList.add("hidden");
        closeBlockedUsersPanel();
        setActiveMenuButton(isProfileScreenOpen() ? profileBtn : null);
    }

    // ─── Blocked Users Panel ───────────────────────────────
    const blockedUsersBtn = document.getElementById("blockedUsersBtn");
    const blockedUsersPanel = document.getElementById("blockedUsersPanel");
    const blockedUsersOverlay = document.getElementById("blockedUsersOverlay");
    const blockedUsersBackBtn = document.getElementById("blockedUsersBackBtn");
    const blockedUsersList = document.getElementById("blockedUsersList");
    const blockedUsersEmpty = document.getElementById("blockedUsersEmpty");

    async function openBlockedUsersPanel() {
        blockedUsersPanel.classList.remove("hidden");
        blockedUsersOverlay.classList.remove("hidden");
        blockedUsersList.innerHTML = "";
        blockedUsersEmpty.textContent = "Loading…";

        const users = await getMyBlockedUsersWithNames();

        if (users.length === 0) {
            blockedUsersEmpty.textContent = "No blocked users.";
            blockedUsersEmpty.classList.remove("hidden");
        } else {
            blockedUsersEmpty.classList.add("hidden");
            users.forEach(u => {
                const li = document.createElement("li");
                const nameSpan = document.createElement("span");
                nameSpan.className = "blocked-username";
                nameSpan.textContent = u.username || "Unknown";
                const btn = document.createElement("button");
                btn.className = "unblock-btn";
                btn.textContent = "Unblock";
                btn.onclick = async () => {
                    btn.disabled = true;
                    btn.textContent = "…";
                    await unblockUser(u.id);
                    await refreshFriendData();
                    li.remove();
                    if (!blockedUsersList.children.length) {
                        blockedUsersEmpty.textContent = "No blocked users.";
                        blockedUsersEmpty.classList.remove("hidden");
                    }
                };
                li.append(nameSpan, btn);
                blockedUsersList.appendChild(li);
            });
        }
    }

    function closeBlockedUsersPanel() {
        blockedUsersPanel.classList.add("hidden");
        blockedUsersOverlay.classList.add("hidden");
    }

    if (blockedUsersBtn) blockedUsersBtn.onclick = openBlockedUsersPanel;
    if (blockedUsersBackBtn) blockedUsersBackBtn.onclick = closeBlockedUsersPanel;
    if (blockedUsersOverlay) blockedUsersOverlay.addEventListener("click", closeBlockedUsersPanel);
    
    function applyUiVisibilityState() {
        toggleMenu(false);
        document.body.classList.toggle("ui-hidden", isUiHidden);
    
        if (hideUiBtn) {
            hideUiBtn.textContent = `Hide UI: ${isUiHidden ? "On" : "Off"}`;
            hideUiBtn.setAttribute("aria-pressed", isUiHidden ? "true" : "false");
        }
    }
    
    function restoreUiVisibilityPreference() {
        const stored = localStorage.getItem("hideUiEnabled");
        isUiHidden = stored === "1";
        applyUiVisibilityState();
    }
    
    document.getElementById("resetChainBtn").onclick = () => {
        for (const link of chainLinks) {
            scene.remove(link);
        }
    
        dogTagManager.clearAll();
    
        chainLinks.length = 0;
        selectedTagId = null;
        closeHeroCard();
    
        chainInteraction.rebuildFromLinks();
        updateZoomLimits();
        updateCameraVerticalLimits();
        addLink();
        closeSettings();
    };
    
    if (hideUiBtn) {
        hideUiBtn.onclick = () => {
            isUiHidden = !isUiHidden;
            localStorage.setItem("hideUiEnabled", isUiHidden ? "1" : "0");
            applyUiVisibilityState();
        };
    }
    
    function saveChain() {
        const data = {
            linkCount: chainLinks.length,
            dogTags: dogTagManager.serialize(),
        };
    
        localStorage.setItem("chainState", JSON.stringify(data));
        ensureProfileJoinedDate();
        updateProfileScreen();
        syncChainCount();
    }

    async function syncChainCount() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const serializedTags = dogTagManager?.serialize?.() || [];
        await supabase
            .from('profiles')
            .update({ chain_count: chainLinks.length, dog_tags: serializedTags })
            .eq('id', user.id);
    }

    async function restoreChain() {
        let data = null;

        // Try fetching chain state from the server so the chain is
        // consistent across every device the user logs in on.
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('chain_count, dog_tags')
                    .eq('id', user.id)
                    .single();
                if (profile && typeof profile.chain_count === 'number' && profile.chain_count >= 1) {
                    data = {
                        linkCount: profile.chain_count,
                        dogTags: Array.isArray(profile.dog_tags) ? profile.dog_tags : [],
                    };
                }
            }
        } catch {
            // Server fetch failed – fall through to localStorage.
        }

        // Fall back to localStorage when the server has no data yet.
        if (!data) {
            const raw = localStorage.getItem("chainState");
            if (!raw) return false;
            try {
                data = JSON.parse(raw);
            } catch {
                return false;
            }
            if (!data || typeof data.linkCount !== "number" || data.linkCount < 1) {
                return false;
            }
        }
    
        isRestoring = true;
    
        for (let i = 0; i < data.linkCount; i += 1) {
            addLink();
        }
    
        const restoredTags = [];
    
        if (Array.isArray(data.dogTags)) {
            for (const t of data.dogTags) {
                if (typeof t?.title === "string" && Number.isInteger(t?.index)) {
                    restoredTags.push({ title: dogTagManager.normalizeTitle(t.title), index: t.index, createdAt: t.createdAt || null });
                }
            }
        } else if (Array.isArray(data.echoes)) {
            // Backward compatibility with legacy echo state.
            for (const e of data.echoes) {
                if (typeof e?.title === "string" && Number.isInteger(e?.index)) {
                    restoredTags.push({ title: dogTagManager.normalizeTitle(e.title), index: e.index, createdAt: e.createdAt || null });
                }
            }
        }
    
        for (const entry of restoredTags) {
            if (entry.index < 0 || entry.index >= chainLinks.length) {
                continue;
            }
            dogTagManager.addTagAtIndex(entry.title, entry.index, entry.createdAt || null);
        }
    
        isRestoring = false;
        updateDogTagViewMode();
        saveChain();
        return true;
    }
    
    function animate() {
        requestAnimationFrame(animate);
        if (!shouldRenderScene) {
            return;
        }
        chainInteraction.update();
        updateCameraVerticalLimits();
        updateDogTagViewMode();
        renderer.render(scene, camera);
    }
}