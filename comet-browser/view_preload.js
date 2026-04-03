const { contextBridge, ipcRenderer } = require('electron');

// Standard spoofing for Google Workspace and frame-sensitive sites
window.addEventListener('DOMContentLoaded', () => {
    try {
        // Deep spoofing for sandbox detection bypass
        const bypassDetection = () => {
            const secretSelf = window;

            try {
                Object.defineProperty(window, 'top', { get: () => secretSelf, configurable: true });
                Object.defineProperty(window, 'parent', { get: () => secretSelf, configurable: true });
                Object.defineProperty(window, 'opener', { get: () => null, configurable: true });
            } catch (e) {
                // Silently ignore if the site has already locked these properties
            }

            // Spoof document.referrer if needed
            Object.defineProperty(document, 'referrer', { get: () => '', configurable: false });
        };

        bypassDetection();

        // Password Auto-Fill & Auto-Save Detection
        const handlePasswordManager = () => {
            const domain = window.location.hostname.replace('www.', '');
            
            // 1. Auto-Fill Search
            ipcRenderer.invoke('get-passwords-for-site', domain).then(entries => {
                if (entries && entries.length > 0) {
                    const loginEntry = entries.find(e => e.type === 'login' || !e.type) || entries[0];
                    if (loginEntry.password) {
                        const userFields = document.querySelectorAll('input[type="text"], input[type="email"], input[name*="user"], input[name*="login"]');
                        const passFields = document.querySelectorAll('input[type="password"]');

                        if (passFields.length > 0) {
                            passFields.forEach(pf => { pf.value = loginEntry.password; });
                            if (userFields.length > 0) {
                                userFields.forEach(uf => { if (!uf.value) uf.value = loginEntry.username || ''; });
                            }
                        }
                    }
                }
            });

            // 2. Capture Auto-Save (Logins and General Forms)
            document.addEventListener('submit', (e) => {
                const form = e.target;
                if (!form || !(form instanceof HTMLFormElement)) return;

                const passField = form.querySelector('input[type="password"]');
                const userField = form.querySelector('input[type="text"], input[type="email"], input[name*="user"]');
                
                if (passField && passField.value) {
                    const username = userField ? userField.value : '';
                    const password = passField.value;
                    ipcRenderer.send('propose-password-save', { domain, username, password, type: 'login' });
                    return;
                }

                const inputs = Array.from(form.querySelectorAll('input[type="text"], input[type="email"], textarea, select'));
                const filledInputs = inputs.filter(input => input.value && input.value.trim().length > 2);

                if (filledInputs.length >= 3) {
                    const formData = filledInputs.map(input => ({
                        label: input.placeholder || input.name || input.id || 'Field',
                        value: input.value,
                        name: input.name
                    }));

                    ipcRenderer.send('propose-form-collection-save', { 
                        domain, 
                        title: document.title || domain, 
                        data: formData,
                        type: 'form' 
                    });
                }
            });
        };

        handlePasswordManager();
    } catch (e) {
        console.warn("View Preload tweak failed:", e);
    }
});
