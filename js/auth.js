// auth.js - Handles authentication logic
import { supabase } from './supabase.js';

export function setupAuth({ onAuthenticated }) {
    const authContainer = document.getElementById("authContainer");
    const mainUiContainer = document.getElementById("mainUiContainer");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const showRegister = document.getElementById("showRegister");
    const showLogin = document.getElementById("showLogin");
    const loginError = document.getElementById("loginError");
    const registerError = document.getElementById("registerError");

    function showLoginForm() {
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
        loginError.textContent = "";
        registerError.textContent = "";
    }

    function showRegisterForm() {
        loginForm.classList.add("hidden");
        registerForm.classList.remove("hidden");
        loginError.textContent = "";
        registerError.textContent = "";
    }

    if (showRegister) showRegister.onclick = (e) => { e.preventDefault(); showRegisterForm(); };
    if (showLogin) showLogin.onclick = (e) => { e.preventDefault(); showLoginForm(); };
    showLoginForm();

    // Check for an existing session so the user doesn't have to log in every time
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
            const username = session.user.user_metadata?.username || session.user.email;
            setAuthenticated(username);
        }
    });

    const bypassBtn = document.getElementById("bypassLoginBtn");
    if (bypassBtn) bypassBtn.onclick = () => setAuthenticated("Dev");

    function setAuthenticated(username) {
        authContainer.classList.add("hidden");
        mainUiContainer.classList.remove("hidden");
        localStorage.setItem("profileDisplayName", username);
        setupAccountButtons();
        if (typeof onAuthenticated === 'function') onAuthenticated(username);
    }

    function setupAccountButtons() {
        const changePasswordBtn = document.getElementById("changePasswordBtn");
        const changePasswordInline = document.getElementById("changePasswordInline");
        const confirmPasswordBtn = document.getElementById("confirmPasswordBtn");
        const newPasswordInput = document.getElementById("newPasswordInput");
        const changePasswordMsg = document.getElementById("changePasswordMsg");
        const logoutBtn = document.getElementById("logoutBtn");
        const deleteAccountBtn = document.getElementById("deleteAccountBtn");

        if (changePasswordBtn) {
            changePasswordBtn.onclick = () => {
                changePasswordInline.classList.toggle("hidden");
                changePasswordMsg.textContent = "";
                newPasswordInput.value = "";
            };
        }

        if (confirmPasswordBtn) {
            confirmPasswordBtn.onclick = async () => {
                const newPassword = newPasswordInput.value;
                if (!newPassword || newPassword.length < 6) {
                    changePasswordMsg.style.color = "#b00";
                    changePasswordMsg.textContent = "Password must be at least 6 characters.";
                    return;
                }
                const { error } = await supabase.auth.updateUser({ password: newPassword });
                if (error) {
                    changePasswordMsg.style.color = "#b00";
                    changePasswordMsg.textContent = error.message;
                } else {
                    changePasswordMsg.style.color = "#0a0";
                    changePasswordMsg.textContent = "Password updated.";
                    newPasswordInput.value = "";
                    setTimeout(() => changePasswordInline.classList.add("hidden"), 1500);
                }
            };
        }

        if (logoutBtn) {
            logoutBtn.onclick = async () => {
                await supabase.auth.signOut();
                localStorage.removeItem("profileDisplayName");
                location.reload();
            };
        }

        if (deleteAccountBtn) {
            deleteAccountBtn.onclick = async () => {
                const confirmed = confirm("Are you sure you want to delete your account? This cannot be undone.");
                if (!confirmed) return;
                const { error } = await supabase.rpc("delete_user");
                if (error) {
                    alert("Could not delete account: " + error.message);
                } else {
                    await supabase.auth.signOut();
                    localStorage.removeItem("profileDisplayName");
                    location.reload();
                }
            };
        }
    }

    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            loginError.textContent = "";
            const email = document.getElementById("loginEmail").value.trim();
            const password = document.getElementById("loginPassword").value;

            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                loginError.textContent = error.message;
            } else {
                const username = data.user.user_metadata?.username || data.user.email;
                setAuthenticated(username);
            }
        };
    }

    if (registerForm) {
        registerForm.onsubmit = async (e) => {
            e.preventDefault();
            registerError.textContent = "";
            const username = document.getElementById("registerUsername").value.trim();
            const email = document.getElementById("registerEmail").value.trim();
            const password = document.getElementById("registerPassword").value;

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { username } }
            });

            if (error) {
                registerError.textContent = error.message;
            } else if (data.user && !data.session) {
                // Email confirmation is enabled — prompt user to check inbox
                registerError.style.color = '#0a0';
                registerError.textContent = 'Check your email to confirm your account.';
            } else {
                setAuthenticated(username);
            }
        };
    }
}
