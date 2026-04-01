// ================================================================
//  cookbook_auth.js — Cookbook Paywall & Auth System
// ================================================================

import { auth, db, onAuthStateChanged } from './firebase_config.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── State ──────────────────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let currentUser       = null;
let cookbook_unlocked = false;
let preview_used      = false;

// ── Update nav bar ─────────────────────────────────────────────
export function updateNavBar(user) {
  const navEmail   = document.getElementById('nav-user-email');
  const signOutBtn = document.getElementById('sign-out-btn');
  if (!navEmail || !signOutBtn) return;
  if (user) {
    navEmail.textContent     = `Welcome, ${user.displayName || user.email}`;
    signOutBtn.style.display = 'inline-block';
  } else {
    navEmail.textContent     = 'Welcome, Guest';
    signOutBtn.style.display = 'none';
  }
}

// ── Show post login options ────────────────────────────────────
export function showPostLoginOptions(user) {
  const postLogin = document.getElementById('post-login-options');
  const msg       = document.getElementById('login-message');
  if (!postLogin || !msg) return;
  if (user) {
    msg.textContent         = `You are signed in as ${user.displayName || user.email}.`;
    postLogin.style.display = 'block';
  } else {
    postLogin.style.display = 'none';
  }
}

// ── Check Firestore for paid status ───────────────────────────
async function check_paid_status(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      cookbook_unlocked = snap.data().paid === true;
    } else {
      cookbook_unlocked = false;
    }
  } catch (e) {
    cookbook_unlocked = false;
  }
}

// ── Handle Google redirect result ─────────────────────────────
// This MUST run before onAuthStateChanged
getRedirectResult(auth)
  .then(async (result) => {
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
      currentUser = user;
      await check_paid_status(user.uid);
      updateNavBar(user);
      showPostLoginOptions(user);
      // Redirect to index after successful Google sign in
      window.location.href = 'index.html';
    }
  })
  .catch((e) => {
    console.error('Redirect error:', e.code, e.message);
    const el = document.getElementById('auth_error');
    if (el) { el.textContent = e.message; el.style.display = 'block'; }
  });

// ── Auth state listener ────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  updateNavBar(user);
  if (user) {
    await check_paid_status(user.uid);
    showPostLoginOptions(user);
  }
});

// ── Auth functions ─────────────────────────────────────────────
export async function googleSignIn() {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (e) {
    console.error(e);
    const el = document.getElementById('auth_error');
    if (el) { el.textContent = e.message; el.style.display = 'block'; }
  }
}

export async function emailSignIn(email, password, showError) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = 'index.html';
  } catch (e) {
    if (showError) showError('Incorrect email or password.');
  }
}

export async function createAccount(email, password, showError) {
  if (password.length < 6) {
    if (showError) showError('Password must be at least 6 characters.');
    return;
  }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), {
      email:   email,
      paid:    false,
      created: new Date().toISOString()
    });
    window.location.href = 'index.html';
  } catch (e) {
    if (showError) showError(e.message || 'Could not create account.');
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
    window.location.href = 'login.html';
  } catch (e) {
    console.error(e);
  }
}

export async function sendRecoveryEmail(email, showError) {
  if (!email) {
    if (showError) showError('Enter a valid email.');
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    alert('Password recovery email sent. Check your inbox.');
  } catch (e) {
    if (showError) showError(e.message);
  }
}

// ── Wire up all buttons on page load ──────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  function showError(msg) {
    const el = document.getElementById('auth_error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }

  const googleBtn = document.getElementById('google-sign-in-btn');
  if (googleBtn) googleBtn.addEventListener('click', () => googleSignIn());

  const emailSignInBtn = document.getElementById('email-sign-in-btn');
  if (emailSignInBtn) emailSignInBtn.addEventListener('click', () => {
    const email    = document.getElementById('auth_email').value.trim();
    const password = document.getElementById('auth_password').value;
    emailSignIn(email, password, showError);
  });

  const emailCreateBtn = document.getElementById('email-create-btn');
  if (emailCreateBtn) emailCreateBtn.addEventListener('click', () => {
    const email    = document.getElementById('auth_email').value.trim();
    const password = document.getElementById('auth_password').value;
    createAccount(email, password, showError);
  });

  const recoverBtn = document.getElementById('password-recover-btn');
  if (recoverBtn) recoverBtn.addEventListener('click', () => {
    const email = document.getElementById('recover_email').value.trim();
    sendRecoveryEmail(email, showError);
  });

  const signOutBtn = document.getElementById('sign-out-btn');
  if (signOutBtn) signOutBtn.addEventListener('click', () => signOutUser());

});

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
