// ================================================================
//  cookbook_auth.js — Cookbook Paywall & Auth System
// ================================================================

import { auth, db, onAuthStateChanged } from './firebase_config.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── State ──────────────────────────────────────────────────────
const google_provider = new GoogleAuthProvider();
google_provider.setCustomParameters({ prompt: 'select_account' });

let current_user      = null;
let cookbook_unlocked = false;
let preview_used      = false;

// ── Update nav bar helper ─────────────────────────────────────
function update_nav(user) {
  const navEmail   = document.getElementById('nav-user-email');
  const signInBtn  = document.getElementById('sign-in-btn');
  const createBtn  = document.getElementById('create-account-btn');
  const signOutBtn = document.getElementById('sign-out-btn');

  if (user) {
    if (navEmail)   navEmail.textContent      = `Welcome, ${user.displayName || user.email}`;
    if (signInBtn)  signInBtn.style.display   = 'none';
    if (createBtn)  createBtn.style.display   = 'none';
    if (signOutBtn) signOutBtn.style.display  = 'inline-block';
  } else {
    if (navEmail)   navEmail.textContent      = 'Welcome, Guest';
    if (signInBtn)  signInBtn.style.display   = 'inline-block';
    if (createBtn)  createBtn.style.display   = 'inline-block';
    if (signOutBtn) signOutBtn.style.display  = 'none';
  }
}

// ── Check Firestore for paid status ───────────────────────────
async function check_paid_status(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    cookbook_unlocked = snap.exists() ? snap.data().paid === true : false;
  } catch (e) {
    cookbook_unlocked = false;
  }
}

// ── Handle redirect result from Google ────────────────────────
getRedirectResult(auth).then(async (result) => {
  if (result && result.user) {
    const user = result.user;
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        email:   user.email,
        paid:    false,
        created: new Date().toISOString()
      });
    }
    await check_paid_status(user.uid);
    current_user = user;
    update_nav(user);
    // Redirect to index.html after Google login
    if (window.location.pathname.includes('login.html')) {
      window.location.href = 'index.html';
    }
  }
}).catch((e) => console.error('Redirect error:', e.code, e.message));

// ── Auth state listener ────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (user) {
    current_user = user;
    await check_paid_status(user.uid);
    update_nav(user);
  } else {
    current_user      = null;
    cookbook_unlocked = false;
    update_nav(null);
  }
});

// ── Toggle sign in panel ───────────────────────────────────────
window.toggle_sign_in_panel = function() {
  const panel = document.getElementById('sign_in_panel');
  if (!panel) return;
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
};

// ── Wire up buttons after DOM loads ───────────────────────────
document.addEventListener('DOMContentLoaded', function() {

  // Google sign in
  const googleBtn = document.getElementById('google-sign-in-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      try {
        await signInWithRedirect(auth, google_provider);
      } catch (e) {
        show_auth_error(e.message);
      }
    });
  }

  // Email sign in
  const emailSignInBtn = document.getElementById('email-sign-in-btn');
  if (emailSignInBtn) {
    emailSignInBtn.addEventListener('click', async () => {
      const email    = document.getElementById('auth_email').value.trim();
      const password = document.getElementById('auth_password').value;
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (e) {
        show_auth_error('Incorrect email or password.');
      }
    });
  }

  // Create account
  const emailCreateBtn = document.getElementById('email-create-btn');
  if (emailCreateBtn) {
    emailCreateBtn.addEventListener('click', async () => {
      const email    = document.getElementById('auth_email').value.trim();
      const password = document.getElementById('auth_password').value;
      if (password.length < 6) {
        show_auth_error('Password must be at least 6 characters.');
        return;
      }
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          email:   email,
          paid:    false,
          created: new Date().toISOString()
        });
      } catch (e) {
        show_auth_error(e.message || 'Could not create account.');
      }
    });
  }

  // Forgot password recovery
  const recoverBtn = document.getElementById('recover-password-btn');
  if (recoverBtn) {
    recoverBtn.addEventListener('click', () => {
      const emailField = document.getElementById('auth_email');
      const sendBtn    = document.getElementById('send-recovery-btn');
      if (!sendBtn) {
        const btn = document.createElement('button');
        btn.id = 'send-recovery-btn';
        btn.textContent = 'Send Recovery Email';
        btn.style.cssText = 'margin-top:10px;padding:10px;width:100%;background:rgba(200,169,110,0.2);border:1px solid rgba(200,169,110,0.4);border-radius:6px;color:#c8a96e;cursor:pointer;';
        emailField.insertAdjacentElement('afterend', btn);
        btn.addEventListener('click', async () => {
          try {
            await sendPasswordResetEmail(auth, emailField.value.trim());
            alert('Recovery email sent. Check your inbox.');
          } catch (e) {
            show_auth_error(e.message || 'Could not send recovery email.');
          }
        });
      }
    });
  }

  // Sign out
  const signOutBtn = document.getElementById('sign-out-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
      } catch (e) {
        console.error('Sign out failed:', e);
      }
    });
  }

});

// ── Auth error helper ──────────────────────────────────────────
function show_auth_error(msg) {
  const err_el = document.getElementById('auth_error');
  if (err_el) {
    err_el.textContent   = msg;
    err_el.style.display = 'block';
  }
}

// ── Recipe paywall check ───────────────────────────────────────
window.check_and_open_recipe = function(recipe, icon, cat_name) {
  if (cookbook_unlocked) {
    open_recipe_modal(recipe, icon, cat_name);
    return;
  }
  if (!preview_used) {
    preview_used = true;
    open_recipe_modal(recipe, icon, cat_name);
    setTimeout(show_preview_banner, 600);
    return;
  }
  show_paywall_modal();
};

// ── Preview banner ─────────────────────────────────────────────
function show_preview_banner() {
  const body = document.getElementById('recipe_modal_body');
  if (!body) return;
  const banner = document.createElement('div');
  banner.style.cssText = 'margin-top:20px;padding:14px;background:rgba(200,169,110,0.08);border:1px solid rgba(200,169,110,0.25);border-radius:10px;text-align:center;';
  banner.innerHTML = `
    <p style="font-family:'Space Mono',monospace;font-size:10px;color:#c8a96e;letter-spacing:1.5px;margin:0 0 10px 0;">THIS WAS YOUR FREE PREVIEW</p>
    <p style="font-family:'Crimson Pro',serif;font-size:14px;color:#e8dcc8;margin:0 0 12px 0;">Unlock the full cookbook to access all recipes.</p>
    <button onclick="close_recipe_modal();show_paywall_modal();"
      style="padding:10px 20px;background:rgba(200,169,110,0.2);border:1px solid rgba(200,169,110,0.4);border-radius:8px;color:#c8a96e;font-family:'Space Mono',monospace;font-size:10px;cursor:pointer;">
      Unlock Cookbook
    </button>
  `;
  body.appendChild(banner);
}

// ── Paywall modal ──────────────────────────────────────────────
window.show_paywall_modal = function() {
  let modal = document.getElementById('paywall_modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'paywall_modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(2,8,16,0.95);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';
    modal.innerHTML = `
      <div style="background:rgba(4,10,30,0.98);border:1px solid rgba(200,169,110,0.3);border-radius:14px;padding:28px;width:100%;max-width:360px;box-sizing:border-box;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">📖</div>
        <h2 style="font-family:'Playfair Display',serif;color:#c8a96e;font-size:22px;margin:0 0 10px 0;">Unlock the Full Cookbook</h2>
        <p style="font-family:'Crimson Pro',serif;font-size:15px;color:#e8dcc8;line-height:1.7;margin:0 0 24px 0;">
          You have used your free preview. Subscribe to access all recipes, categories, and future additions.
        </p>
        <button onclick="close_paywall_modal()"
          style="width:100%;padding:13px;background:transparent;border:1px solid rgba(200,169,110,0.2);border-radius:8px;color:rgba(200,169,110,0.5);font-family:'Space Mono',monospace;font-size:10px;cursor:pointer;margin-top:10px;">
          Maybe Later
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
};

window.close_paywall_modal = function() {
  const modal = document.getElementById('paywall_modal');
  if (modal) modal.style.display = 'none';
};