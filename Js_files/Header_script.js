// Header_script.js

document.addEventListener('DOMContentLoaded', () => {
    function applyNavbarState() {
        const cachedAuthState = localStorage.getItem('gac_logged_in');
        const isLoggedIn = (cachedAuthState === 'true');

        document.querySelectorAll('.auth-guest').forEach(el => {
            el.style.setProperty('display', isLoggedIn ? 'none' : 'inline-block', 'important');
        });

        document.querySelectorAll('.auth-logged').forEach(el => {
            el.style.setProperty('display', isLoggedIn ? 'inline-block' : 'none', 'important');
        });
    }

    function setupMobileMenu() {
        const menuBtn = document.getElementById('gacMenuBtn');
        const navMenu = document.getElementById('gacNavMenu');

        if (!menuBtn || !navMenu) return;

        menuBtn.onclick = () => {
            const isOpen = navMenu.classList.toggle('active');
            menuBtn.setAttribute('aria-expanded', String(isOpen));
        };

        document.querySelectorAll('.gac-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuBtn.setAttribute('aria-expanded', 'false');
            });
        });
    }

    function initializeHeaderUi() {
        applyNavbarState();
        setupMobileMenu();

        if (!window.__gacHeaderObserver && document.body) {
            window.__gacHeaderObserver = new MutationObserver(() => {
                applyNavbarState();
            });
            window.__gacHeaderObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        if (!window.__gacAuthHooked && window.supabaseClient) {
            window.__gacAuthHooked = true;

            window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
                if (session && session.user) {
                    localStorage.setItem('gac_logged_in', 'true');
                } else {
                    localStorage.removeItem('gac_logged_in');
                }
                applyNavbarState();
            }).catch(err => console.error('Session verification failed:', err));

            window.supabaseClient.auth.onAuthStateChange((event, session) => {
                if (session && session.user) {
                    localStorage.setItem('gac_logged_in', 'true');
                } else {
                    localStorage.removeItem('gac_logged_in');
                }
                applyNavbarState();
            });
        }

        const logoutBtn = document.getElementById('gacLogoutBtn');
        if (logoutBtn && !logoutBtn.dataset.gacBound) {
            logoutBtn.dataset.gacBound = 'true';
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    if (window.__gacHeaderObserver) {
                        window.__gacHeaderObserver.disconnect();
                    }

                    localStorage.removeItem('gac_logged_in');

                    if (window.supabaseClient) {
                        await window.supabaseClient.auth.signOut();
                    }

                    alert('Logged out successfully!');
                    window.location.replace('../index.html');
                } catch (error) {
                    console.error('Logout Error:', error.message);
                    alert('Logout Failed: ' + error.message);
                }
            });
        }
    }

    initializeHeaderUi();
    window.initializeHeaderUi = initializeHeaderUi;
});