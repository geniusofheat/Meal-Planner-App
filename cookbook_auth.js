// ================================================================
//  cookbook_auth.js — Cookbook Paywall & Auth System
//  Add this script to cookbook_menu.html
// ================================================================

import { auth, db, onAuthStateChanged } from './firebase_config.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── State ──────────────────────────────────────────────────────
let current_user     = null;
let cookbook_unlocked = false;
let preview_used     = false;

// ── Jetson changed this section to operate nav buttons ───────────────────────────
// ── On page load — check auth state ───────────────────────────
onAuthStateChanged(auth, async (user) => {
  const navEmail   = document.getElementById('nav-user-email');
  const signInBtn  = document.getElementById('sign-in-btn');
  const createBtn  = document.getElementById('create-account-btn');
  const signOutBtn = document.getElementById('sign-out-btn');

  if (user) {
    current_user = user;
    await check_paid_status(user.uid);

    // Update nav for signed-in state
    if (navEmail) navEmail.textContent = `Welcome, ${user.email}`;
    if (signInBtn) signInBtn.style.display = 'none';
    if (createBtn) createBtn.style.display = 'none';
    if (signOutBtn) signOutBtn.style.display = 'inline-block';
  } else {
    current_user = null;
    cookbook_unlocked = false;

    // Update nav for signed-out state
    if (navEmail) navEmail.textContent = '';
    if (signInBtn) signInBtn.style.display = 'inline-block';
    if (createBtn) createBtn.style.display = 'inline-block';
    if (signOutBtn) signOutBtn.style.display = 'none';
  }
});
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

// ── Show / hide auth wall ──────────────────────────────────────
function show_auth_wall() {
  let wall = document.getElementById('auth_wall');
  if (!wall) {
    wall = document.createElement('div');
    wall.id = 'auth_wall';
    wall.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(2,8,16,0.97);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';
    wall.innerHTML = `
      <div style="background:rgba(4,10,30,0.98);border:1px solid rgba(200,169,110,0.3);border-radius:14px;padding:28px;width:100%;max-width:360px;box-sizing:border-box;">
        <h2 style="font-family:'Playfair Display',serif;color:#c8a96e;font-size:22px;margin:0 0 6px 0;text-align:center;">Cookbook</h2>
        <div style="display:flex;align-items:center;gap:8px;margin:14px 0;">
  <div style="flex:1;height:1px;background:rgba(200,169,110,0.2);"></div>
  <span style="font-family:'Space Mono',monospace;font-size:9px;color:rgba(200,169,110,0.4);">OR</span>
  <div style="flex:1;height:1px;background:rgba(200,169,110,0.2);"></div>
</div>
<button onclick="handle_google_sign_in()"
  style="width:100%;padding:13px;background:transparent;border:1px solid rgba(200,169,110,0.3);border-radius:8px;color:#e8dcc8;font-family:'Space Mono',monospace;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
  🔵 Sign In with Google
</button>
        <p style="font-family:'Space Mono',monospace;font-size:10px;color:rgba(200,169,110,0.6);letter-spacing:2px;text-align:center;margin:0 0 24px 0;">SIGN IN TO CONTINUE</p>

        <div id="auth_error" style="display:none;background:rgba(255,80,80,0.1);border:1px solid rgba(255,80,80,0.3);border-radius:8px;padding:10px;margin-bottom:16px;font-family:'Space Mono',monospace;font-size:10px;color:#ff8080;text-align:center;"></div>

        <input id="auth_email" type="email" placeholder="Email address"
          style="width:100%;padding:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(200,169,110,0.2);border-radius:8px;color:#e8dcc8;font-family:'Space Mono',monospace;font-size:11px;box-sizing:border-box;margin-bottom:10px;outline:none;" />

        <input id="auth_password" type="password" placeholder="Password"
          style="width:100%;padding:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(200,169,110,0.2);border-radius:8px;color:#e8dcc8;font-family:'Space Mono',monospace;font-size:11px;box-sizing:border-box;margin-bottom:18px;outline:none;" />

        <button onclick="handle_sign_in()"
          style="width:100%;padding:13px;background:rgba(200,169,110,0.15);border:1px solid rgba(200,169,110,0.4);border-radius:8px;color:#c8a96e;font-family:'Space Mono',monospace;font-size:11px;cursor:pointer;margin-bottom:10px;">
          Sign In
        </button>

        <button onclick="handle_sign_up()"
          style="width:100%;padding:13px;background:transparent;border:1px solid rgba(200,169,110,0.2);border-radius:8px;color:rgba(200,169,110,0.5);font-family:'Space Mono',monospace;font-size:11px;cursor:pointer;">
          Create Account
        </button>

        <p style="font-family:'Space Mono',monospace;font-size:9px;color:rgba(150,150,150,0.4);text-align:center;margin:16px 0 0 0;">
          Free account required to browse the cookbook.
        </p>
      </div>
    `;
    document.body.appendChild(wall);
  }
  wall.style.display = 'flex';
}

function hide_auth_wall() {
  const wall = document.getElementById('auth_wall');
  if (wall) wall.style.display = 'none';
}

// ── Sign in ────────────────────────────────────────────────────
window.handle_sign_in = async function() {
  const email    = document.getElementById('auth_email').value.trim();
  const password = document.getElementById('auth_password').value;
  const err_el   = document.getElementById('auth_error');
  err_el.style.display = 'none';
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    err_el.textContent  = 'Incorrect email or password.';
    err_el.style.display = 'block';
  }
};

// ── Sign up ────────────────────────────────────────────────────
window.handle_sign_up = async function() {
  const email    = document.getElementById('auth_email').value.trim();
  const password = document.getElementById('auth_password').value;
  const err_el   = document.getElementById('auth_error');
  err_el.style.display = 'none';
  if (password.length < 6) {
    err_el.textContent  = 'Password must be at least 6 characters.';
    err_el.style.display = 'block';
    return;
  }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), { email: email, paid: false, created: new Date().toISOString() });
  } catch (e) {
    err_el.textContent  = e.message || 'Could not create account.';
    err_el.style.display = 'block';
  }
};

// ── Recipe paywall check ───────────────────────────────────────
// Call this INSTEAD of open_recipe_modal when a recipe title is tapped
window.check_and_open_recipe = function(recipe, icon, cat_name) {
  if (cookbook_unlocked) {
    open_recipe_modal(recipe, icon, cat_name);
    return;
  }

  if (!preview_used) {
    preview_used = true;
    open_recipe_modal(recipe, icon, cat_name);
    // Show a subtle banner inside the modal after a short delay
    setTimeout(show_preview_banner, 600);
    return;
  }

  show_paywall_modal();
};

// ── Preview banner (shown after first free recipe) ─────────────
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

// ── Paywall modal ────────────────────
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

// ──  This part added by jetson
// ── Sign Out & Nav Buttons ───────
document.getElementById('sign-out-btn').addEventListener('click', async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.error("Sign out failed:", e);
  }
});

// Hook nav buttons to existing auth wall
document.getElementById('sign-in-btn').addEventListener('click', () => {
  show_auth_wall();
});
document.getElementById('create-account-btn').addEventListener('click', () => {
  show_auth_wall();
});
// ── End Sign Out & Nav Buttons