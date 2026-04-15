
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { ChainInteraction } from "./chainInteraction.js";
import { DogTagManager } from "./dogTagManager.js";

// --- AUTH LOGIC ---
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

    // Attach event listeners for switching forms
    document.addEventListener("DOMContentLoaded", () => {
        if (showRegister) showRegister.onclick = (e) => { e.preventDefault(); showRegisterForm(); };
        if (showLogin) showLogin.onclick = (e) => { e.preventDefault(); showLoginForm(); };
        showLoginForm(); // Show login by default
    });

function setAuthenticated(username) {
    authContainer.classList.add("hidden");
    mainUiContainer.classList.remove("hidden");
    localStorage.setItem("profileDisplayName", username);
    updateProfileScreen();
}


// --- END AUTH LOGIC ---
