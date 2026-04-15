// main.js - Entry point
import { setupAuth } from './auth.js';

// This function will be called after successful authentication
function onAuthenticated(username) {
    // Import and initialize the 3D app only after login
    import('./threeApp.js').then(mod => {
        if (mod && typeof mod.initialize3DApp === 'function') {
            mod.initialize3DApp();
        }
    });
}

// Set up authentication logic
setupAuth({ onAuthenticated });
