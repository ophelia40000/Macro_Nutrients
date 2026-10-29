// Initialize Lucide Icons
lucide.createIcons();

function getLocalDateStr() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// --- STATE ---
let goals = { calories: 2000, carbs: 250, protein: 150, fat: 70, weight: 70.0, height: 170.0, gender: 'male', neck: 38.0, waist: 80.0, hip: 90.0 };
let burnedCalories = 0;
let entries = [];
let presets = [
    { name: 'Nasi Putih (100g)', calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3 },
    { name: 'Roti Tawar (100g)', calories: 265, protein: 9, carbs: 49, fat: 3.2 },
    { name: 'Mie Instan (Porsi)', calories: 380, protein: 8, carbs: 54, fat: 14 }
];
let progressPhotos = [];
let workouts = [];
let currentLoadedDate = getLocalDateStr();

function checkDayReset() {
    const today = getLocalDateStr();
    if (currentLoadedDate !== today) {
        currentLoadedDate = today;
        entries = [];
        burnedCalories = 0;
        if (USER_ID) saveState();
        return true;
    }
    return false;
}

// --- FIREBASE SETUP ---
const firebaseConfig = {
    apiKey: "AIzaSyD2GwJXg0r2M1C_GJHl4P3NMxyqRbfVTPw",
    authDomain: "macronutrients-8ee33.firebaseapp.com",
    projectId: "macronutrients-8ee33",
    storageBucket: "macronutrients-8ee33.firebasestorage.app",
    messagingSenderId: "450498654474",
    appId: "1:450498654474:web:ff81754fac649127e74af3",
    measurementId: "G-QX18LBRVEK"
};

let firestore, storage, auth;
if (firebaseConfig.apiKey === "ISI_API_KEY_ANDA_DISINI") {
    alert("Mohon masukkan Firebase Config Anda di public/js/app.js (baris ke-18) agar aplikasi dapat terhubung ke database!");
} else {
    firebase.initializeApp(firebaseConfig);
    firestore = firebase.firestore();
    storage = firebase.storage();
    auth = firebase.auth();
}

let USER_ID = null;

// --- INITIALIZE & LOCAL STORAGE ---
// --- FIREBASE STATE SYNC ---
async function loadState() {
    if (!firestore || !USER_ID) {
        updateUI();
        return;
    }

    try {
        const today = getLocalDateStr();
        const docRef = firestore.collection('users').doc(USER_ID);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();

            // ALWAYS load persistent data
            if (data.goals) goals = data.goals;
            if (data.presets) presets = data.presets;
            if (data.workouts) workouts = data.workouts;

            if (data.last_reset_date !== today) {
                entries = [];
                burnedCalories = 0;
                currentLoadedDate = today;
                await docRef.set({
                    last_reset_date: today,
                    entries: [],
                    burnedCalories: 0,
                    email: auth.currentUser ? auth.currentUser.email : "",
                    displayName: auth.currentUser ? auth.currentUser.displayName : ""
                }, { merge: true });
            } else {
                if (data.burnedCalories) burnedCalories = data.burnedCalories;
                if (data.entries) entries = data.entries;
            }
        } else {
            currentLoadedDate = today;
            await docRef.set({
                last_reset_date: today,
                goals: goals,
                burnedCalories: burnedCalories,
                entries: entries,
                presets: presets,
                workouts: workouts,
                email: auth.currentUser ? auth.currentUser.email : "",
                displayName: auth.currentUser ? auth.currentUser.displayName : ""
            });
        }
        updateUI();
    } catch (err) {
        console.error("Error loading state from Firestore:", err);
        alert("Gagal memuat data dari Firebase: " + err.message);
        updateUI();
    }
}

async function saveState() {
    if (!firestore || !USER_ID) return;
    try {
        const docRef = firestore.collection('users').doc(USER_ID);
        await docRef.set({
            last_reset_date: currentLoadedDate,
            goals: goals,
            burnedCalories: burnedCalories,
            entries: entries,
            presets: presets,
            workouts: workouts,
            email: auth.currentUser ? auth.currentUser.email : "",
            displayName: auth.currentUser ? auth.currentUser.displayName : ""
        }, { merge: true });
    } catch (err) {
        console.error("Error saving state to Firestore:", err);
        alert("Gagal menyimpan data ke Firebase: " + err.message);
    }
}

// --- CALCULATION ---
function getTotals() {
    return entries.reduce((acc, item) => {
        acc.calories += item.calories;
        acc.carbs += item.carbs;
        acc.protein += item.protein;
        acc.fat += item.fat;
        return acc;
    }, { calories: 0, carbs: 0, protein: 0, fat: 0 });
}

// --- UI UPDATER ---
function updateUI() {
    checkDayReset();

    const consumed = getTotals();
    const remainingCal = goals.calories - consumed.calories + burnedCalories;
    const remainingCarb = goals.carbs - consumed.carbs;
    const remainingProt = goals.protein - consumed.protein;
    const remainingFat = goals.fat - consumed.fat;

    // 1. DASHBOARD
    const valCalEl = document.getElementById('val-calories');
    const cardCalEl = document.getElementById('card-calories');
    const progCalEl = document.getElementById('prog-calories');

    valCalEl.innerText = Math.abs(remainingCal).toFixed(0);
    if (remainingCal < 0) {
        cardCalEl.classList.add('grad-surplus');
        document.querySelector('#card-calories .card-title').innerText = 'Calories Remaining (Surplus)';
        progCalEl.style.width = '100%';
    } else {
        cardCalEl.classList.remove('grad-surplus');
        document.querySelector('#card-calories .card-title').innerText = 'Calories Remaining';
        progCalEl.style.width = `${Math.min((consumed.calories / goals.calories) * 100, 100)}%`;
    }

    document.getElementById('val-carbs').innerText = Math.abs(remainingCarb).toFixed(0);
    document.getElementById('prog-carbs').style.width = `${Math.min((consumed.carbs / goals.carbs) * 100, 100)}%`;

    document.getElementById('val-protein').innerText = Math.abs(remainingProt).toFixed(0);
    document.getElementById('prog-protein').style.width = `${Math.min((consumed.protein / goals.protein) * 100, 100)}%`;

    document.getElementById('val-fats').innerText = Math.abs(remainingFat).toFixed(0);
    document.getElementById('prog-fats').style.width = `${Math.min((consumed.fat / goals.fat) * 100, 100)}%`;

    document.getElementById('val-burned').innerText = burnedCalories.toFixed(0);
    document.getElementById('prog-burned').style.width = `${Math.min((burnedCalories / 500) * 100, 100)}%`;

    // 2. DIARY MACROS
    const tCalGoal = goals.calories + burnedCalories;
    document.getElementById('diary-cal-text').innerText = `${consumed.calories.toFixed(0)}/${tCalGoal.toFixed(0)} kcal`;
    document.getElementById('diary-cal-prog').style.width = `${Math.min((consumed.calories / tCalGoal) * 100, 100)}%`;

    document.getElementById('diary-prot-text').innerText = `${consumed.protein.toFixed(0)}/${goals.protein.toFixed(0)} g`;
    document.getElementById('diary-prot-prog').style.width = `${Math.min((consumed.protein / goals.protein) * 100, 100)}%`;

    document.getElementById('diary-carb-text').innerText = `${consumed.carbs.toFixed(0)}/${goals.carbs.toFixed(0)} g`;
    document.getElementById('diary-carb-prog').style.width = `${Math.min((consumed.carbs / goals.carbs) * 100, 100)}%`;

    document.getElementById('diary-fat-text').innerText = `${consumed.fat.toFixed(0)}/${goals.fat.toFixed(0)} g`;
    document.getElementById('diary-fat-prog').style.width = `${Math.min((consumed.fat / goals.fat) * 100, 100)}%`;

    renderFoodLog();
    renderPresets();
    populatePresetSelect();
    renderWorkouts();
}

// --- RENDER LISTS ---
function renderFoodLog() {
    const list = document.getElementById('food-log-list');
    if (entries.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 40px 0;">Add your first meal!</div>';
        return;
    }
    const htmlList = [];
    for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i];
        htmlList.push(`
        <div class="entry-card" 
             onpointerdown="entryPointerDown(event, ${i})" 
             onpointerup="entryPointerUp(event)" 
             onpointercancel="entryPointerUp(event)"
             style="transition: transform 0.2s;"
             title="Long press / Right click to delete">
            <div class="entry-info">
                <span class="entry-name">${entry.name}</span>
                <span class="entry-macros">P: ${entry.protein.toFixed(0)}g | C: ${entry.carbs.toFixed(0)}g | F: ${entry.fat.toFixed(0)}g</span>
            </div>
            <span class="entry-cal">${entry.calories.toFixed(0)} kcal</span>
        </div>`);
    }
    list.innerHTML = htmlList.join('');
}

window.deleteEntry = (index) => {
    entries.splice(index, 1);
    saveState();
    updateUI();
};

let entryLongPressTimer = null;
let entryLongPressIndex = null;
window.entryPointerDown = (e, index) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const card = e.currentTarget;
    card.setPointerCapture(e.pointerId);
    entryLongPressIndex = index;
    card.style.transform = 'scale(0.95)';

    // Prevent default scroll if they hold
    if (e.cancelable && e.pointerType !== 'mouse') e.preventDefault();

    entryLongPressTimer = setTimeout(() => {
        if (entryLongPressIndex === index) {
            deleteEntry(index);
            card.style.transform = '';
            entryLongPressIndex = null;
        }
    }, 600); // 600ms hold to delete
};

window.entryPointerUp = (e) => {
    const card = e.currentTarget;
    card.releasePointerCapture(e.pointerId);
    card.style.transform = '';
    clearTimeout(entryLongPressTimer);
    entryLongPressIndex = null;
};

function renderPresets() {
    const list = document.getElementById('preset-list');
    const q = document.getElementById('input-search-preset').value.toLowerCase();
    const filtered = presets.filter(p => p.name.toLowerCase().includes(q));

    if (filtered.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 40px 0;">No presets found.</div>';
        return;
    }

    list.innerHTML = filtered.map((p) => {
        const originalIndex = presets.indexOf(p);
        return `
        <div class="entry-card" style="padding: 12px;">
            <div class="entry-info">
                <span class="entry-name" style="font-size:14px;">${p.name}</span>
                <span class="entry-macros">Cal: ${p.calories.toFixed(0)} | P: ${p.protein.toFixed(0)} | C: ${p.carbs.toFixed(0)} | F: ${p.fat.toFixed(0)}</span>
            </div>
            <div class="preset-actions">
                <button class="btn-edit" onclick="editPreset(${originalIndex})"><i data-lucide="edit" style="width:18px;"></i></button>
                <button class="btn-delete" onclick="deletePreset(${originalIndex})"><i data-lucide="trash-2" style="width:18px;"></i></button>
            </div>
        </div>
    `}).join('');
    lucide.createIcons();
}

function deletePreset(index) {
    presets.splice(index, 1);
    saveState();
    updateUI();
}

window.editPreset = (index) => {
    document.getElementById('edit-preset-title').innerText = 'Edit Preset';
    document.getElementById('input-preset-index').value = index;
    const p = presets[index];
    document.getElementById('input-preset-name').value = p.name;
    document.getElementById('input-preset-cal').value = p.calories;
    document.getElementById('input-preset-prot').value = p.protein;
    document.getElementById('input-preset-carbs').value = p.carbs;
    document.getElementById('input-preset-fat').value = p.fat;
    document.getElementById('edit-preset-modal').classList.add('active');
};

// --- CAMERA & GALLERY LOGIC ---

// Morphing FAB on Camera Page (Hold to go home, tap to take photo)
const fabCamera = document.getElementById('fab-take-photo');
let cameraPointerTimer = null;
let isCameraFabPressed = false;
let cameraHasLongPressed = false;

function resetCameraFab() {
    isCameraFabPressed = false;
    cameraHasLongPressed = false;
    clearTimeout(cameraPointerTimer);
    fabCamera.style.transform = '';
    fabCamera.style.width = '';
    fabCamera.style.background = 'var(--primary-green)';
    fabCamera.innerHTML = '<i data-lucide="camera" style="color: black;"></i>';
    lucide.createIcons();
}

fabCamera.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    e.preventDefault();
    isCameraFabPressed = true;
    cameraHasLongPressed = false;

    fabCamera.setPointerCapture(e.pointerId);
    fabCamera.style.transform = 'scale(0.95)';

    cameraPointerTimer = setTimeout(() => {
        if (!isCameraFabPressed) return;
        cameraHasLongPressed = true;
        fabCamera.style.width = '120px';
        fabCamera.style.background = 'var(--accent-lime)';
        fabCamera.innerHTML = '<i data-lucide="home" style="color: black;"></i><span style="color: black; margin-left: 8px; font-weight: bold;">Home</span>';
        lucide.createIcons();
    }, 300);
});

fabCamera.addEventListener('pointerup', (e) => {
    if (!isCameraFabPressed) return;
    fabCamera.releasePointerCapture(e.pointerId);

    if (cameraHasLongPressed) {
        switchView('view-dashboard');
    } else {
        document.getElementById('input-camera-file').click();
    }
    resetCameraFab();
});

fabCamera.addEventListener('pointercancel', (e) => {
    if (!isCameraFabPressed) return;
    fabCamera.releasePointerCapture(e.pointerId);

    if (cameraHasLongPressed) {
        switchView('view-dashboard');
    }
    resetCameraFab();
});

fabCamera.addEventListener('touchstart', (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });
fabCamera.addEventListener('touchmove', (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });

document.getElementById('input-camera-file').addEventListener('change', (e) => {
    if (!USER_ID) {
        alert('Anda harus login terlebih dahulu.');
        return;
    }
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            } else {
                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
            }
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG with 0.6 quality (60%)
            const base64Data = canvas.toDataURL('image/jpeg', 0.6);

            if (storage && firestore) {
                // Convert base64 to Blob
                fetch(base64Data)
                    .then(res => res.blob())
                    .then(blob => {
                        const photoId = Date.now().toString();
                        const storageRef = storage.ref(`progress_photos/${USER_ID}/${photoId}.jpg`);
                        const uploadTask = storageRef.put(blob);

                        document.getElementById('camera-empty-state').innerHTML = `<p style="text-align:center;">Mengunggah gambar ke Firebase...</p>`;
                        document.getElementById('camera-empty-state').style.display = 'flex';
                        document.getElementById('camera-gallery-list').innerHTML = '';

                        uploadTask.on('state_changed',
                            null,
                            (error) => {
                                console.error("Upload error", error);
                                alert("Gagal mengunggah foto: " + error.message);
                            },
                            () => {
                                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                                    const newPhoto = {
                                        id: parseInt(photoId),
                                        imagePath: downloadURL,
                                        date: new Date().toISOString(),
                                        weight: goals.weight || 70.0
                                    };

                                    firestore.collection('users').doc(USER_ID)
                                        .collection('progressPhotos').doc(photoId)
                                        .set(newPhoto).then(() => {
                                            loadAndRenderPhotos();
                                        });
                                });
                            }
                        );
                    });
            } else {
                alert("Firebase belum dikonfigurasi.");
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
});

function loadAndRenderPhotos() {
    if (!firestore || !USER_ID) return;

    firestore.collection('users').doc(USER_ID).collection('progressPhotos')
        .orderBy('id', 'desc')
        .get()
        .then((snapshot) => {
            progressPhotos = [];
            snapshot.forEach(doc => progressPhotos.push(doc.data()));
            renderPhotosList(progressPhotos);
        }).catch(err => console.error(err));
}

function renderPhotosList(photos) {
    const emptyState = document.getElementById('camera-empty-state');
    const galleryList = document.getElementById('camera-gallery-list');
    galleryList.innerHTML = '';

    if (photos.length === 0) {
        emptyState.innerHTML = `
            <i data-lucide="image" style="width: 64px; height: 64px; margin-bottom: 16px;"></i>
            <p style="text-align: center; font-size: 16px;">No progress photos yet.<br>Tap the camera to start!</p>
        `;
        emptyState.style.display = 'flex';
        lucide.createIcons();
        return;
    }
    emptyState.style.display = 'none';

    const grouped = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    photos.forEach(p => {
        const d = new Date(p.date);
        const key = `${monthNames[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(p);
    });

    for (const [dateStr, groupPhotos] of Object.entries(grouped)) {
        const header = document.createElement('div');
        header.className = 'gallery-date-header';
        header.innerHTML = `
            <div class="icon-bg"><i data-lucide="calendar" style="width:14px;height:14px;color:var(--accent-lime);"></i></div>
            <span>${dateStr.toUpperCase()}</span>
            <span class="weight-text">${groupPhotos[0].weight} kg</span>
        `;
        galleryList.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'gallery-grid';
        groupPhotos.forEach(photo => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `<img src="${photo.imagePath}">`;
            item.onclick = () => openFullscreen(photo);
            grid.appendChild(item);
        });
        galleryList.appendChild(grid);
    }
    lucide.createIcons();
}

let currentFullscreenPhotoId = null;

function openFullscreen(photo) {
    currentFullscreenPhotoId = photo.id;
    document.getElementById('fullscreen-image').src = photo.imagePath;
    document.getElementById('fullscreen-date').innerText = new Date(photo.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('fullscreen-weight').innerText = `${photo.weight} kg`;
    document.getElementById('fullscreen-modal').classList.add('active');
}

document.getElementById('btn-close-fullscreen').addEventListener('click', () => {
    document.getElementById('fullscreen-modal').classList.remove('active');
});

document.getElementById('btn-delete-photo').addEventListener('click', () => {
    if (confirm('Delete Photo? This action cannot be undone.')) {
        if (currentFullscreenPhotoId && firestore && USER_ID) {
            const pId = currentFullscreenPhotoId.toString();
            firestore.collection('users').doc(USER_ID).collection('progressPhotos').doc(pId).delete().then(() => {
                document.getElementById('fullscreen-modal').classList.remove('active');
                loadAndRenderPhotos();
            });
            if (storage) {
                storage.ref(`progress_photos/${USER_ID}/${pId}.jpg`).delete().catch(e => console.log('Storage delete error:', e));
            }
        }
    }
});

// App init
lucide.createIcons();

if (auth) {
    auth.onAuthStateChanged(user => {
        if (user) {
            USER_ID = user.uid;

            // Extract initial from displayName or email
            const nameStr = user.displayName || user.email || "?";
            const initial = nameStr.charAt(0).toUpperCase();

            const profileBtn = document.getElementById('btn-profile');
            if (profileBtn) {
                profileBtn.innerHTML = `<span style="font-weight: 700; font-size: 18px; color: var(--accent-lime);">${initial}</span>`;
            }

            switchView('view-dashboard');
            const loginModal = document.getElementById('login-modal');
            if (loginModal && loginModal.classList.contains('active')) {
                closeModal(loginModal);
            }
            loadState();
            loadAndRenderPhotos();
        } else {
            USER_ID = null;
            openModal(document.getElementById('login-modal'));
        }
    });
} else {
    switchView('view-dashboard');
    loadState();
    loadAndRenderPhotos();
}

document.getElementById('btn-google-login')?.addEventListener('click', () => {
    if (!auth) return;
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => {
        console.error("Login failed", err);
        alert("Gagal login: " + err.message);
    });
});

let profileLongPressTimer = null;
const profileBtn = document.getElementById('btn-profile');
if (profileBtn) {
    profileBtn.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        profileBtn.setPointerCapture(e.pointerId);
        
        if (e.cancelable && e.pointerType !== 'mouse') e.preventDefault();
        
        profileLongPressTimer = setTimeout(() => {
            profileLongPressTimer = null;
            if (confirm('Apakah Anda yakin ingin logout?')) {
                if (auth) auth.signOut();
            }
        }, 600);
    });

    profileBtn.addEventListener('pointerup', (e) => {
        if (profileBtn.hasPointerCapture(e.pointerId)) {
            profileBtn.releasePointerCapture(e.pointerId);
        }
        if (profileLongPressTimer) {
            // Short press
            clearTimeout(profileLongPressTimer);
            profileLongPressTimer = null;
            
            const heightInput = document.getElementById('input-profile-height');
            if (heightInput) heightInput.value = goals.height || 170.0;
            const weightInput = document.getElementById('input-profile-weight');
            if (weightInput) weightInput.value = goals.weight || 70.0;
            const neckInput = document.getElementById('input-profile-neck');
            if (neckInput) neckInput.value = goals.neck || 38.0;
            const waistInput = document.getElementById('input-profile-waist');
            if (waistInput) waistInput.value = goals.waist || 80.0;
            const hipInput = document.getElementById('input-profile-hip');
            if (hipInput) hipInput.value = goals.hip || 90.0;
            
            updateGenderUI(goals.gender || 'male');
            calculateBodyFat();
            
            const viewProfile = document.getElementById('view-profile');
            if (viewProfile) {
                switchView('view-profile');
            } else {
                alert("Versi baru tersedia! Harap muat ulang (refresh) halaman atau tutup aplikasi dan buka kembali.");
            }
        }
    });

    profileBtn.addEventListener('pointercancel', (e) => {
        if (profileLongPressTimer) {
            clearTimeout(profileLongPressTimer);
            profileLongPressTimer = null;
        }
    });
}

document.addEventListener('input', (e) => {
    if (['input-profile-height', 'input-profile-waist', 'input-profile-neck', 'input-profile-hip'].includes(e.target.id)) {
        calculateBodyFat();
    }
});

function updateGenderUI(gender) {
    goals.gender = gender;
    const btnMale = document.getElementById('btn-gender-male');
    const btnFemale = document.getElementById('btn-gender-female');
    const hipContainer = document.getElementById('hip-container');
    
    if (!btnMale) return;

    if (gender === 'male') {
        btnMale.style.border = '1px solid var(--accent-lime)';
        btnMale.style.background = 'rgba(187, 242, 70, 0.1)';
        btnMale.style.color = 'var(--accent-lime)';
        
        btnFemale.style.border = '1px solid rgba(255,255,255,0.1)';
        btnFemale.style.background = 'rgba(0,0,0,0.2)';
        btnFemale.style.color = 'var(--text-dim)';
        
        hipContainer.style.display = 'none';
    } else {
        btnFemale.style.border = '1px solid var(--accent-lime)';
        btnFemale.style.background = 'rgba(187, 242, 70, 0.1)';
        btnFemale.style.color = 'var(--accent-lime)';
        
        btnMale.style.border = '1px solid rgba(255,255,255,0.1)';
        btnMale.style.background = 'rgba(0,0,0,0.2)';
        btnMale.style.color = 'var(--text-dim)';
        
        hipContainer.style.display = 'block';
    }
    calculateBodyFat();
}

function calculateBodyFat() {
    const height = parseFloat(document.getElementById('input-profile-height')?.value) || 0;
    const neck = parseFloat(document.getElementById('input-profile-neck')?.value) || 0;
    const waist = parseFloat(document.getElementById('input-profile-waist')?.value) || 0;
    const hip = parseFloat(document.getElementById('input-profile-hip')?.value) || 0;
    const gender = goals.gender || 'male';
    const display = document.getElementById('display-body-fat');
    
    if (!display) return;

    if (height <= 0 || neck <= 0 || waist <= 0) {
        display.innerText = '--%';
        return;
    }

    let bf = 0;
    if (gender === 'male') {
        if (waist <= neck) return display.innerText = '--%';
        bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
    } else {
        if (waist + hip <= neck) return display.innerText = '--%';
        bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
    }

    if (bf < 2 || bf > 60 || isNaN(bf)) {
        display.innerText = '--%';
    } else {
        display.innerText = bf.toFixed(1) + '%';
    }
}

document.addEventListener('click', (e) => {
    if (e.target.id === 'btn-gender-male') updateGenderUI('male');
    if (e.target.id === 'btn-gender-female') updateGenderUI('female');

    if (e.target.closest('#btn-back-profile')) {
        switchView('view-dashboard');
    }
    
    if (e.target.id === 'btn-save-profile') {
        goals.height = parseFloat(document.getElementById('input-profile-height').value) || goals.height;
        goals.weight = parseFloat(document.getElementById('input-profile-weight').value) || goals.weight;
        goals.neck = parseFloat(document.getElementById('input-profile-neck').value) || goals.neck;
        goals.waist = parseFloat(document.getElementById('input-profile-waist').value) || goals.waist;
        goals.hip = parseFloat(document.getElementById('input-profile-hip').value) || goals.hip;
        saveState();
        switchView('view-dashboard');
    }
});

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    window.scrollTo(0, 0);
}

// Click cards to go to diary
['card-calories', 'card-carbs', 'card-protein', 'card-fats'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
        switchView('view-diary');
    });
});
document.getElementById('btn-back-dashboard').addEventListener('click', () => switchView('view-dashboard'));

const addEntryModal = document.getElementById('add-entry-modal');
const presetsModal = document.getElementById('presets-modal');
const editPresetModal = document.getElementById('edit-preset-modal');
const adjustModal = document.getElementById('adjust-modal');
const burnModal = document.getElementById('burn-modal');

// Lock / unlock body scroll when modal opens/closes
function openModal(el) {
    el.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeModal(el) {
    el.classList.remove('active');
    // Only unlock if no other modal is open
    const anyOpen = document.querySelector('.bottom-sheet-overlay.active, .dialog-overlay.active');
    if (!anyOpen) document.body.style.overflow = '';
}

// --- FAB GESTURE WITH POINTER EVENTS (RADIAL MENU) ---
const fabAdjust = document.getElementById('fab-adjust');
const radialMenu = document.getElementById('radial-menu');
const radialCamera = document.getElementById('radial-camera');
const radialExercise = document.getElementById('radial-exercise');

let fabPointerTimer = null;
let isFabPressed = false;
let hasLongPressed = false;
let hoveredAction = null;

function resetFab() {
    isFabPressed = false;
    hasLongPressed = false;
    hoveredAction = null;
    clearTimeout(fabPointerTimer);
    fabAdjust.style.transform = '';
    if (radialMenu) radialMenu.classList.remove('active');
    if (radialCamera) radialCamera.classList.remove('hovered');
    if (radialExercise) radialExercise.classList.remove('hovered');
}

fabAdjust.addEventListener('pointerdown', (e) => {
    // Left click or touch only
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    e.preventDefault();
    isFabPressed = true;
    hasLongPressed = false;
    hoveredAction = null;

    // Capture pointer so all subsequent events go to this button, even if pointer leaves it
    fabAdjust.setPointerCapture(e.pointerId);

    fabAdjust.style.transform = 'scale(0.95)';

    fabPointerTimer = setTimeout(() => {
        if (!isFabPressed) return;
        hasLongPressed = true;
        if (radialMenu) radialMenu.classList.add('active');
    }, 300);
});

fabAdjust.addEventListener('pointermove', (e) => {
    if (!hasLongPressed || !radialCamera || !radialExercise) return;

    const x = e.clientX;
    const y = e.clientY;

    const camRect = radialCamera.getBoundingClientRect();
    const exRect = radialExercise.getBoundingClientRect();

    // Expand hit box slightly for easier touch targeting
    const isOverCamera = (
        x >= camRect.left - 20 && x <= camRect.right + 20 &&
        y >= camRect.top - 20 && y <= camRect.bottom + 20
    );

    const isOverExercise = (
        x >= exRect.left - 20 && x <= exRect.right + 20 &&
        y >= exRect.top - 20 && y <= exRect.bottom + 20
    );

    if (isOverCamera) {
        hoveredAction = 'camera';
        radialCamera.classList.add('hovered');
        radialExercise.classList.remove('hovered');
    } else if (isOverExercise) {
        hoveredAction = 'exercise';
        radialExercise.classList.add('hovered');
        radialCamera.classList.remove('hovered');
    } else {
        hoveredAction = null;
        radialCamera.classList.remove('hovered');
        radialExercise.classList.remove('hovered');
    }
});

fabAdjust.addEventListener('pointerup', (e) => {
    if (!isFabPressed) return;
    fabAdjust.releasePointerCapture(e.pointerId);

    if (hasLongPressed) {
        if (hoveredAction === 'camera') {
            switchView('view-camera');
        } else if (hoveredAction === 'exercise') {
            switchView('view-exercise');
        }
    } else {
        document.getElementById('input-goal-cal').value = goals.calories;
        document.getElementById('input-goal-carbs').value = goals.carbs;
        document.getElementById('input-goal-prot').value = goals.protein;
        document.getElementById('input-goal-fat').value = goals.fat;
        openModal(adjustModal);
    }
    resetFab();
});

fabAdjust.addEventListener('pointercancel', (e) => {
    if (!isFabPressed) return;
    fabAdjust.releasePointerCapture(e.pointerId);

    if (hasLongPressed) {
        if (hoveredAction === 'camera') switchView('view-camera');
        else if (hoveredAction === 'exercise') switchView('view-exercise');
    }
    resetFab();
});

// Also prevent default touch behavior to be absolutely safe
fabAdjust.addEventListener('touchstart', (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });
fabAdjust.addEventListener('touchmove', (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });


document.getElementById('card-burned').addEventListener('click', () => {
    document.getElementById('input-burn').value = burnedCalories > 0 ? burnedCalories : '';
    openModal(burnModal);
});

document.getElementById('btn-manage-presets').addEventListener('click', () => {
    openModal(presetsModal);
});

document.getElementById('btn-new-preset').addEventListener('click', () => {
    document.getElementById('edit-preset-title').innerText = 'New Preset';
    document.getElementById('input-preset-index').value = '';
    document.getElementById('input-preset-name').value = '';
    document.getElementById('input-preset-cal').value = '';
    document.getElementById('input-preset-prot').value = '';
    document.getElementById('input-preset-carbs').value = '';
    document.getElementById('input-preset-fat').value = '';
    openModal(editPresetModal);
});

document.getElementById('fab-add-entry').addEventListener('click', () => {
    document.getElementById('input-entry-weight').value = '';
    openModal(addEntryModal);
    updatePreview();
});

// Close modals when clicking overlay
document.querySelectorAll('.bottom-sheet-overlay, .dialog-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            if (overlay.id === 'login-modal') return; // Cannot dismiss login
            closeModal(overlay);
        }
    });
});

document.getElementById('btn-cancel-entry').addEventListener('click', () => {
    closeModal(document.getElementById('add-entry-modal'));
});

// --- SAVE ACTIONS ---
document.getElementById('btn-save-goals').addEventListener('click', () => {
    goals.calories = parseFloat(document.getElementById('input-goal-cal').value) || goals.calories;
    goals.carbs = parseFloat(document.getElementById('input-goal-carbs').value) || goals.carbs;
    goals.protein = parseFloat(document.getElementById('input-goal-prot').value) || goals.protein;
    goals.fat = parseFloat(document.getElementById('input-goal-fat').value) || goals.fat;
    saveState();
    updateUI();
    closeModal(adjustModal);
});

document.getElementById('btn-save-burn').addEventListener('click', () => {
    burnedCalories = parseFloat(document.getElementById('input-burn').value) || 0;
    saveState();
    updateUI();
    burnModal.classList.remove('active');
});

document.getElementById('btn-save-preset').addEventListener('click', () => {
    const idxStr = document.getElementById('input-preset-index').value;
    const np = {
        name: document.getElementById('input-preset-name').value || 'Untitled',
        calories: parseFloat(document.getElementById('input-preset-cal').value) || 0,
        protein: parseFloat(document.getElementById('input-preset-prot').value) || 0,
        carbs: parseFloat(document.getElementById('input-preset-carbs').value) || 0,
        fat: parseFloat(document.getElementById('input-preset-fat').value) || 0
    };

    if (idxStr === '') presets.push(np);
    else presets[parseInt(idxStr)] = np;

    saveState();
    updateUI();
    editPresetModal.classList.remove('active');
});

// --- ADD ENTRY LOGIC ---
const tabPreset = document.getElementById('tab-preset');
const tabManual = document.getElementById('tab-manual');
const formPreset = document.getElementById('form-preset');
const formManual = document.getElementById('form-manual');
let isManual = false;

tabPreset.addEventListener('click', () => {
    isManual = false;
    tabPreset.classList.add('active');
    tabManual.classList.remove('active');
    formPreset.style.display = 'block';
    formManual.style.display = 'none';
});

tabManual.addEventListener('click', () => {
    isManual = true;
    tabManual.classList.add('active');
    tabPreset.classList.remove('active');
    formManual.style.display = 'block';
    formPreset.style.display = 'none';
});

let selectedPresetIndex = null;

function populatePresetSelect() {
    document.getElementById('input-preset-search').value = '';
    selectedPresetIndex = null;
}

function renderAutocomplete(query) {
    const list = document.getElementById('autocomplete-list');
    list.innerHTML = '';
    const q = query.toLowerCase();
    let hasMatch = false;
    presets.forEach((p, i) => {
        if (p.name.toLowerCase().includes(q)) {
            hasMatch = true;
            const div = document.createElement('div');
            div.innerText = p.name;
            div.onclick = () => {
                document.getElementById('input-preset-search').value = p.name;
                selectedPresetIndex = i;
                list.style.display = 'none';
                updatePreview();
            };
            list.appendChild(div);
        }
    });
    list.style.display = hasMatch ? 'block' : 'none';
}

document.getElementById('input-preset-search').addEventListener('input', (e) => {
    renderAutocomplete(e.target.value);
});
document.getElementById('input-preset-search').addEventListener('focus', (e) => {
    renderAutocomplete(e.target.value);
});
document.addEventListener('click', (e) => {
    if (e.target.id !== 'input-preset-search') {
        const list = document.getElementById('autocomplete-list');
        if (list) list.style.display = 'none';
    }
});

function updatePreview() {
    const idx = selectedPresetIndex;
    const w = parseFloat(document.getElementById('input-entry-weight').value) || 0;

    if (idx === null || !presets[idx]) {
        document.getElementById('preview-cal').innerText = `0.0 kcal`;
        document.getElementById('preview-macros').innerText = `P: 0.0g | C: 0.0g | F: 0.0g`;
        return;
    }

    const p = presets[idx];
    const factor = w / 100;

    document.getElementById('preview-cal').innerText = `${(p.calories * factor).toFixed(1)} kcal`;
    document.getElementById('preview-macros').innerText = `P: ${(p.protein * factor).toFixed(1)}g | C: ${(p.carbs * factor).toFixed(1)}g | F: ${(p.fat * factor).toFixed(1)}g`;
}

document.getElementById('input-entry-weight').addEventListener('input', updatePreview);

document.getElementById('btn-save-entry').addEventListener('click', () => {
    let entry;
    if (isManual) {
        entry = {
            name: document.getElementById('input-entry-name').value || 'Untitled',
            calories: parseFloat(document.getElementById('input-entry-cal').value) || 0,
            protein: parseFloat(document.getElementById('input-entry-prot').value) || 0,
            carbs: parseFloat(document.getElementById('input-entry-carbs').value) || 0,
            fat: parseFloat(document.getElementById('input-entry-fat').value) || 0
        };
    } else {
        const idx = selectedPresetIndex;
        const w = parseFloat(document.getElementById('input-entry-weight').value) || 0;

        if (idx === null || !presets[idx]) {
            alert('Please select a food preset first!');
            return;
        }

        const p = presets[idx];
        const factor = w / 100;
        entry = {
            name: `${p.name} (${w}g)`,
            calories: p.calories * factor,
            protein: p.protein * factor,
            carbs: p.carbs * factor,
            fat: p.fat * factor
        };
    }

    entries.push(entry);
    saveState();
    updateUI();
    addEntryModal.classList.remove('active');
});

// Initialize app

// --- BOTTOM SHEET SWIPE TO CLOSE ---
document.querySelectorAll('.bottom-sheet').forEach(sheet => {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    function onTouchStart(e) {
        startY = e.touches[0].clientY;
        currentY = 0;
        isDragging = true;
        sheet.style.transition = 'none';
    }

    function onTouchMove(e) {
        if (!isDragging) return;
        const dy = e.touches[0].clientY - startY;
        currentY = dy;
        if (dy > 0) {
            e.preventDefault();
            sheet.style.transform = `translateY(${dy}px)`;
        }
    }

    function onTouchEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        sheet.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
        if (currentY > 60) {
            sheet.style.transform = 'translateY(100%)';
            setTimeout(() => {
                const overlay = sheet.closest('.bottom-sheet-overlay');
                if (overlay) closeModal(overlay);
                sheet.style.transform = '';
            }, 350);
        } else {
            sheet.style.transform = '';
        }
        startY = 0;
        currentY = 0;
    }

    // Attach to drag-handle AND the sheet itself (but not input/button elements)
    const handle = sheet.querySelector('.drag-handle');
    if (handle) {
        handle.addEventListener('touchstart', onTouchStart, { passive: true });
        handle.addEventListener('touchmove', onTouchMove, { passive: false });
        handle.addEventListener('touchend', onTouchEnd);
    }

    // Also allow swiping from the sheet header area
    sheet.addEventListener('touchstart', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
        if (e.target.closest('.preset-list')) return;
        const rect = sheet.getBoundingClientRect();
        const touchY = e.touches[0].clientY;
        // Only trigger swipe if touching the top 80px of the sheet (header area)
        if (touchY - rect.top < 80) {
            onTouchStart(e);
        }
    }, { passive: true });

    sheet.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        onTouchMove(e);
    }, { passive: false });

    sheet.addEventListener('touchend', onTouchEnd);
});

// Morphing FAB on Exercise Page (Hold to go home, tap to add workout)
const fabWorkout = document.getElementById('fab-add-workout');
let workoutPointerTimer = null;
let isWorkoutFabPressed = false;
let workoutHasLongPressed = false;

function resetWorkoutFab() {
    isWorkoutFabPressed = false;
    workoutHasLongPressed = false;
    clearTimeout(workoutPointerTimer);
    if (fabWorkout) {
        fabWorkout.style.transform = '';
        fabWorkout.style.width = '';
        fabWorkout.style.background = '';
        fabWorkout.innerHTML = '<i data-lucide="plus"></i><span>Add Workout</span>';
        lucide.createIcons();
    }
}

function populateWorkoutDatalists() {
    const regionSet = new Set();
    workouts.forEach(ex => {
        if (ex.region && ex.region !== 'Uncategorized') regionSet.add(ex.region);
    });

    const regionList = document.getElementById('region-options');
    if (regionList) {
        regionList.innerHTML = '';
        regionSet.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r;
            regionList.appendChild(opt);
        });
    }
}

if (fabWorkout) {
    fabWorkout.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;

        e.preventDefault();
        isWorkoutFabPressed = true;
        workoutHasLongPressed = false;

        fabWorkout.setPointerCapture(e.pointerId);
        fabWorkout.style.transform = 'scale(0.95)';

        workoutPointerTimer = setTimeout(() => {
            if (!isWorkoutFabPressed) return;
            workoutHasLongPressed = true;
            fabWorkout.style.width = '120px';
            fabWorkout.style.background = 'var(--accent-lime)';
            fabWorkout.innerHTML = '<i data-lucide="home" style="color: black;"></i><span style="color: black; margin-left: 8px; font-weight: bold;">Home</span>';
            lucide.createIcons();
        }, 300);
    });

    fabWorkout.addEventListener('pointerup', (e) => {
        if (!isWorkoutFabPressed) return;
        fabWorkout.releasePointerCapture(e.pointerId);

        if (workoutHasLongPressed) {
            switchView('view-dashboard');
        } else {
            document.getElementById('input-workout-name').value = '';
            document.getElementById('input-workout-region').value = lastUsedRegion;

            const title = document.getElementById('modal-workout-title');
            if (title) title.innerText = 'New Exercise';
            const subtitle = document.getElementById('modal-workout-subtitle');
            if (subtitle) subtitle.innerText = 'Create a new exercise category.';

            const groupRegion = document.getElementById('group-workout-region');
            if (groupRegion) groupRegion.style.display = 'flex';
            const groupName = document.getElementById('group-workout-name');
            if (groupName) groupName.style.display = 'flex';

            document.getElementById('input-workout-name').disabled = false;
            document.getElementById('input-workout-region').disabled = false;
            document.getElementById('input-workout-name').style.opacity = '1';
            document.getElementById('input-workout-region').style.opacity = '1';
            populateWorkoutDatalists();
            const modal = document.getElementById('add-workout-modal');
            if (modal) openModal(modal);
        }
        resetWorkoutFab();
    });

    fabWorkout.addEventListener('pointercancel', (e) => {
        if (!isWorkoutFabPressed) return;
        fabWorkout.releasePointerCapture(e.pointerId);

        if (workoutHasLongPressed) {
            switchView('view-dashboard');
        }
        resetWorkoutFab();
    });
}


// --- EXERCISE TRACKER LOGIC ---
let lastUsedRegion = '';

document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-back-dashboard-ex')) {
        switchView('view-dashboard');
    }

    if (e.target.closest('#btn-save-workout')) {
        const name = document.getElementById('input-workout-name').value.trim();
        const region = document.getElementById('input-workout-region')?.value.trim() || 'Uncategorized';
        if (!name) return alert('Please enter a valid exercise name.');

        let ex = workouts.find(w => w.name.toLowerCase() === name.toLowerCase());
        if (!ex) {
            ex = { id: 'ex_' + Date.now(), name: name, history: [], region: region };
            workouts.push(ex);
        } else {
            ex.region = region;
        }

        lastUsedRegion = region;

        saveState();
        updateUI();
        const modal = document.getElementById('add-workout-modal');
        if (modal) closeModal(modal);

        // Open Sets Tracker immediately
        setTimeout(() => {
            openExerciseSetsModal(ex.id);
        }, 300);
    }
});

function renderWorkouts() {
    const list = document.getElementById('workout-list');
    const emptyState = document.getElementById('workout-empty-state');
    if (!list || !emptyState) return; // not loaded yet

    // Clear list but keep empty state
    Array.from(list.children).forEach(c => {
        if (c.id !== 'workout-empty-state') c.remove();
    });

    if (workouts.length === 0) {
        emptyState.style.display = 'flex';
        return;
    }
    emptyState.style.display = 'none';

    // Group workouts by region
    const grouped = {};
    workouts.forEach(ex => {
        const reg = ex.region || 'Uncategorized';
        if (!grouped[reg]) grouped[reg] = [];
        grouped[reg].push(ex);
    });

    for (const [regionName, exList] of Object.entries(grouped)) {
        const header = document.createElement('div');
        header.className = 'gallery-date-header';
        header.style.marginTop = '16px';
        header.innerHTML = `
            <div class="icon-bg"><i data-lucide="folder" style="width:14px;height:14px;color:var(--accent-lime);"></i></div>
            <span>${regionName.toUpperCase()}</span>
        `;
        list.appendChild(header);

        // Sort workouts in this group by most recently updated
        exList.sort((a, b) => {
            const dateA = a.history.length ? a.history[a.history.length - 1].date : '';
            const dateB = b.history.length ? b.history[b.history.length - 1].date : '';
            return dateB.localeCompare(dateA);
        });

        exList.forEach(ex => {
            const lastEntry = ex.history[ex.history.length - 1];
            let timeStr = 'No records';
            let historyText = `<div class="food-cal">No records</div>`;
            let diffStr = '';

            if (lastEntry) {
                const d1 = new Date(lastEntry.date);
                const d2 = new Date();
                const daysDiff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
                timeStr = daysDiff === 0 ? 'Today' : `${daysDiff} days ago`;

                if (lastEntry.weight !== undefined && !lastEntry.sets) {
                    lastEntry.sets = [{ weight: lastEntry.weight, reps: 0 }];
                }
                const sets = lastEntry.sets || [];
                const totalSets = sets.length;
                let maxWeight = 0;
                let totalReps = 0;
                sets.forEach(s => {
                    if (s.weight > maxWeight) maxWeight = s.weight;
                    totalReps += (s.reps || 0);
                });

                historyText = `<div class="food-cal" style="font-size: 16px;">${totalSets} Sets | Max: ${maxWeight}kg</div>
                               <div style="color: var(--text-dim); font-size: 13px;">${totalReps} Total Reps</div>`;

                if (ex.history.length > 1) {
                    const prevEntry = ex.history[ex.history.length - 2];
                    if (prevEntry.weight !== undefined && !prevEntry.sets) {
                        prevEntry.sets = [{ weight: prevEntry.weight, reps: 0 }];
                    }
                    const prevSets = prevEntry.sets || [];
                    let prevMaxWeight = 0;
                    prevSets.forEach(s => {
                        if (s.weight > prevMaxWeight) prevMaxWeight = s.weight;
                    });

                    const diff = maxWeight - prevMaxWeight;
                    if (diff > 0) {
                        diffStr = `<div class="food-macros" style="color: var(--primary-green);">+${diff}kg from last</div>`;
                    } else if (diff < 0) {
                        diffStr = `<div class="food-macros" style="color: #ff5252;">${diff}kg from last</div>`;
                    }
                }
            }

            const card = document.createElement('div');
            card.className = 'food-card';
            card.style.position = 'relative'; // ensure ripples etc work
            card.innerHTML = `
                <div>
                    <div class="food-name">${ex.name}</div>
                    <div class="food-macros">Since ${timeStr}</div>
                </div>
                <div style="text-align:right;">
                    ${historyText}
                    ${diffStr}
                </div>
            `;

            card.style.cursor = 'pointer';

            let pressTimer;
            let isLongPress = false;
            let startY = 0;

            card.addEventListener('pointerdown', (e) => {
                if (e.pointerType === 'mouse' && e.button !== 0) return;
                isLongPress = false;
                startY = e.clientY;
                pressTimer = setTimeout(() => {
                    isLongPress = true;
                    if (confirm('Hapus latihan "' + ex.name + '"?')) {
                        workouts = workouts.filter(w => w.id !== ex.id);
                        saveState();
                        updateUI();
                    }
                }, 600);
            });

            card.addEventListener('pointermove', (e) => {
                if (Math.abs(e.clientY - startY) > 10) {
                    clearTimeout(pressTimer);
                    isLongPress = true; // prevent tap if scrolled
                }
            });

            card.addEventListener('pointerup', (e) => {
                clearTimeout(pressTimer);
                if (isLongPress) return;

                openExerciseSetsModal(ex.id);
            });

            card.addEventListener('pointercancel', () => clearTimeout(pressTimer));

            list.appendChild(card);
        });
    }

    lucide.createIcons();
}

// --- SETS MODAL LOGIC ---
let currentExerciseIdForSets = null;
let currentSetsData = [];

function openExerciseSetsModal(exId) {
    const ex = workouts.find(w => w.id === exId);
    if (!ex) return;

    currentExerciseIdForSets = exId;

    const title = document.getElementById('modal-sets-title');
    if (title) title.innerText = ex.name;

    const today = getLocalDateStr();
    const todayEntry = ex.history.find(h => h.date === today);

    // Convert old format to new format
    ex.history.forEach(h => {
        if (h.weight !== undefined && !h.sets) {
            h.sets = [{ weight: h.weight, reps: 0 }];
            delete h.weight;
        }
    });

    if (todayEntry && todayEntry.sets) {
        currentSetsData = JSON.parse(JSON.stringify(todayEntry.sets));
    } else {
        const lastEntry = ex.history[ex.history.length - 1];
        if (lastEntry && lastEntry.sets && lastEntry.sets.length > 0) {
            // Prepopulate with exact same sets and reps from last time
            currentSetsData = lastEntry.sets.map(s => ({ weight: s.weight, reps: s.reps }));
        } else {
            currentSetsData = [{ weight: '', reps: '' }];
        }
    }

    // Set global weight
    const globalWeightInput = document.getElementById('global-set-weight');
    if (globalWeightInput) {
        if (currentSetsData.length > 0 && currentSetsData[0].weight) {
            globalWeightInput.value = currentSetsData[0].weight;
        } else {
            globalWeightInput.value = '';
        }
    }

    renderExerciseSetsUI();
    const modal = document.getElementById('exercise-sets-modal');
    if (modal) openModal(modal);
}

function renderExerciseSetsUI() {
    const container = document.getElementById('sets-container');
        if (!container) return;

        if (currentSetsData.length === 0) {
            currentSetsData.push({ weight: '', reps: '' });
        }

        let html = '';
        currentSetsData.forEach((s, i) => {
            html += `
        <div class="set-row" style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
            <div style="width: 50px; font-weight: bold; color: var(--text-main); font-size: 15px;">Set ${i + 1}</div>
            <div class="input-group" style="margin-bottom: 0; flex: 1; padding: 0; background: #2A2A2A;">
                <input type="number" class="set-input-reps" data-index="${i}" value="${s.reps}" placeholder="0" style="padding: 12px; text-align: center; font-size: 18px; font-weight: 700;">
            </div>
            <button class="btn-delete-set" data-index="${i}" style="background: none; border: none; color: #ff5252; width: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 10px;">
                <i data-lucide="x" style="width: 22px; height: 22px;"></i>
            </button>
        </div>`;
        });

        container.innerHTML = html;
        lucide.createIcons();
    }

    document.addEventListener('click', (e) => {
        if (e.target.closest('#btn-add-set')) {
            const lastSet = currentSetsData[currentSetsData.length - 1] || { weight: '', reps: '' };
            currentSetsData.push({ weight: lastSet.weight, reps: lastSet.reps });
            renderExerciseSetsUI();
        }
        if (e.target.closest('.btn-delete-set')) {
            const btn = e.target.closest('.btn-delete-set');
            const index = parseInt(btn.getAttribute('data-index'));
            currentSetsData.splice(index, 1);
            renderExerciseSetsUI();
        }
        if (e.target.closest('#btn-save-sets')) {
            const globalWeight = parseFloat(document.getElementById('global-set-weight')?.value) || 0;
            const repsInputs = document.querySelectorAll('.set-input-reps');

            currentSetsData = [];
            for (let i = 0; i < repsInputs.length; i++) {
                const r = parseInt(repsInputs[i].value);
                // Include set if it has reps (or weight)
                if (!isNaN(r) || globalWeight > 0) {
                    currentSetsData.push({ weight: globalWeight, reps: isNaN(r) ? 0 : r });
                }
            }

            const ex = workouts.find(w => w.id === currentExerciseIdForSets);
            if (ex && currentSetsData.length > 0) {
                const today = getLocalDateStr();
                let todayEntry = ex.history.find(h => h.date === today);
                if (todayEntry) {
                    todayEntry.sets = currentSetsData;
                } else {
                    ex.history.push({ date: today, sets: currentSetsData });
                }
                saveState();
                updateUI();
            }

            const modal = document.getElementById('exercise-sets-modal');
            if (modal) closeModal(modal);
        }
    });

    document.addEventListener('input', (e) => {
        if (e.target.id === 'global-set-weight') {
            const w = parseFloat(e.target.value) || '';
            currentSetsData.forEach(s => s.weight = w);
        }
        if (e.target.classList.contains('set-input-reps')) {
            const index = parseInt(e.target.getAttribute('data-index'));
            currentSetsData[index].reps = parseInt(e.target.value) || '';
        }
    });
