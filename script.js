code start from here
/**
 * SafeHer – Women Safety & Emergency Assistance Web Application
 * Complete Vanilla JavaScript Application Logic
 * Architecture: Modular Service Pattern
 */

// Global App Namespace
const App = {
  currentPage: 'dashboard',
  user: null,
  contacts: [],
  coords: { lat: 28.6139, lng: 77.2090, accuracy: 25 }, // Default sample coords (New Delhi)
  locationWatcherId: null,
  leafletMap: null,
  leafletMarker: null,
  leafletCircle: null,
  currentSOSAbortTimer: null,
  sosAbortSeconds: 3,

  // ------------------------------------------------------------------------
  // 1. Initialization
  // ------------------------------------------------------------------------
  init() {
    console.log("SafeHer Core Engine Initializing...");

    // Initialize Storage & Seed Defaults
    StorageService.init();
    this.user = StorageService.getUser();
    this.contacts = StorageService.getContacts();

    // Initialize UI & Event Handlers
    this.updateUserUI();
    this.setupNavigation();
    this.setupTopActions();
    this.setupSOSWorkflow();
    this.setupContactsManager();
    this.setupLocationService();
    this.setupFakeCall();
    this.setupJourneyTracker();
    this.setupAudioRecorder();
    this.setupNearbyServices();
    this.setupShakeToAlert();
    this.setupCountdownTimer();
    this.setupSafetyTips();
    this.setupAuthManager();
    this.setupStealthCalculator();

    // Start background GPS sync
    LocationService.fetchCurrentPosition();

    // Check URL hash for direct routing
    const initialPage = window.location.hash.replace('#', '') || 'dashboard';
    this.navigateTo(initialPage);

    console.log("SafeHer Engine Ready.");
  },

  // ------------------------------------------------------------------------
  // 2. Navigation & Routing
  // ------------------------------------------------------------------------
  setupNavigation() {
    // Desktop & Tablet Sidebar Links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        this.navigateTo(page);
      });
    });

    // Mobile Bottom Navigation Links
    document.querySelectorAll('.b-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        this.navigateTo(page);
      });
    });

    // Mobile menu toggle
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('sidebar-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
      });
    }

    // Handle browser back/forward buttons
    window.addEventListener('hashchange', () => {
      const page = window.location.hash.replace('#', '') || 'dashboard';
      this.navigateTo(page, false);
    });
  },

  navigateTo(pageId, updateHash = true) {
    if (pageId === 'siren') {
      SirenService.start();
      return;
    }

    const targetSection = document.getElementById(`page-${pageId}`);
    if (!targetSection) {
      pageId = 'dashboard';
    }

    // Switch active page view
    document.querySelectorAll('.page-view').forEach(view => {
      view.classList.remove('active');
    });
    document.getElementById(`page-${pageId}`).classList.add('active');

    // Update Desktop Nav Active State
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-page') === pageId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update Mobile Bottom Nav Active State
    document.querySelectorAll('.b-nav-link').forEach(link => {
      if (link.getAttribute('data-page') === pageId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    this.currentPage = pageId;
    if (updateHash) {
      window.location.hash = pageId;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Page-specific activation hooks
    if (pageId === 'location') {
      LocationService.renderMap();
    } else if (pageId === 'contacts') {
      ContactsManager.renderFullList();
    } else if (pageId === 'sos') {
      this.refreshSOSPreview();
    }
  },

  // ------------------------------------------------------------------------
  // 3. User & Profile UI Synchronizer
  // ------------------------------------------------------------------------
  updateUserUI() {
    if (!this.user) return;

    const firstName = this.user.name.split(' ')[0] || this.user.name;
    const initials = this.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    // Top banner
    const displayName = document.getElementById('user-display-name');
    const avatarInitial = document.getElementById('user-avatar-initial');
    if (displayName) displayName.textContent = this.user.name;
    if (avatarInitial) avatarInitial.textContent = initials;

    // Sidebar
    const sideName = document.getElementById('sidebar-user-name');
    const sideAvatar = document.getElementById('sidebar-user-avatar');
    if (sideName) sideName.textContent = this.user.name;
    if (sideAvatar) sideAvatar.textContent = initials;

    // Dashboard
    const dashName = document.getElementById('dashboard-name');
    if (dashName) dashName.textContent = firstName;

    // Profile Page Fields
    const profNameDisplay = document.getElementById('profile-name-display');
    const profAvatarDisplay = document.getElementById('profile-avatar-display');
    const profFullname = document.getElementById('prof-fullname');
    const profPhone = document.getElementById('prof-phone');
    const profEmail = document.getElementById('prof-email');
    const profBlood = document.getElementById('prof-blood');
    const profAddress = document.getElementById('prof-address');
    const profMedical = document.getElementById('prof-medical');

    if (profNameDisplay) profNameDisplay.textContent = this.user.name;
    if (profAvatarDisplay) profAvatarDisplay.textContent = initials;
    if (profFullname) profFullname.value = this.user.name;
    if (profPhone) profPhone.value = this.user.phone;
    if (profEmail) profEmail.value = this.user.email;
    if (profBlood) profBlood.value = this.user.bloodGroup || 'O+';
    if (profAddress) profAddress.value = this.user.address || '';
    if (profMedical) profMedical.value = this.user.medicalInfo || '';

    // Contacts Count Badge
    const badge = document.getElementById('contacts-count-badge');
    const dashReady = document.getElementById('dash-contacts-ready');
    const count = this.contacts ? this.contacts.length : 0;
    if (badge) badge.textContent = count;
    if (dashReady) dashReady.textContent = `${count} People`;

    ContactsManager.renderDashboardMiniList();
  },

  setupTopActions() {
    // Quick Siren Button
    const sirenBtn = document.getElementById('quick-siren-btn');
    if (sirenBtn) {
      sirenBtn.addEventListener('click', () => {
        SirenService.toggle();
      });
    }

    // Stealth Mode Button
    const stealthBtn = document.getElementById('stealth-mode-btn');
    if (stealthBtn) {
      stealthBtn.addEventListener('click', () => {
        this.toggleStealthMode(true);
      });
    }

    // Auth Pill
    const authPill = document.getElementById('auth-status-pill');
    if (authPill) {
      authPill.addEventListener('click', () => {
        this.navigateTo('profile');
      });
    }

    // Logout Button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm("Do you want to log out of SafeHer?")) {
          AuthService.logout();
        }
      });
    }
  },

  // ------------------------------------------------------------------------
  // 4. Emergency SOS Workflow
  // ------------------------------------------------------------------------
  setupSOSWorkflow() {
    // Main Dashboard SOS Button
    const mainSosBtn = document.getElementById('main-sos-button');
    if (mainSosBtn) {
      mainSosBtn.addEventListener('click', () => {
        this.triggerSOSConfirmation();
      });
    }

    // Emergency Page SOS Button
    const pageSosBtn = document.getElementById('sos-trigger-page-btn');
    if (pageSosBtn) {
      pageSosBtn.addEventListener('click', () => {
        this.triggerSOSConfirmation();
      });
    }

    // SOS Abort Cancel Button
    const abortBtn = document.getElementById('cancel-sos-abort-btn');
    if (abortBtn) {
      abortBtn.addEventListener('click', () => {
        this.cancelSOSAbort();
      });
    }

    // SOS Instant Dispatch Button
    const instantBtn = document.getElementById('instant-sos-dispatch-btn');
    if (instantBtn) {
      instantBtn.addEventListener('click', () => {
        this.executeSOSDispatch();
      });
    }

    // WhatsApp Dispatch
    const waBtn = document.getElementById('send-whatsapp-sos-btn');
    if (waBtn) {
      waBtn.addEventListener('click', () => {
        this.dispatchViaWhatsApp();
      });
    }

    // SMS Dispatch
    const smsBtn = document.getElementById('send-sms-sos-btn');
    if (smsBtn) {
      smsBtn.addEventListener('click', () => {
        this.dispatchViaSMS();
      });
    }

    // Copy SOS Message
    const copyBtn = document.getElementById('copy-sos-text-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const text = document.getElementById('sos-preview-text').value;
        navigator.clipboard.writeText(text).then(() => {
          Toast.show("Distress message copied to clipboard!", "success");
        }).catch(() => {
          Toast.show("Please copy text manually.", "info");
        });
      });
    }
  },

  triggerSOSConfirmation() {
    const modal = document.getElementById('sos-confirm-modal');
    const counterEl = document.getElementById('sos-abort-counter');
    if (!modal) return;

    modal.classList.add('active');
    this.sosAbortSeconds = 3;
    counterEl.textContent = this.sosAbortSeconds;

    // Play warning sound
    SoundEngine.playBeep(600, 0.15);

    if (this.currentSOSAbortTimer) {
      clearInterval(this.currentSOSAbortTimer);
    }

    this.currentSOSAbortTimer = setInterval(() => {
      this.sosAbortSeconds--;
      if (this.sosAbortSeconds > 0) {
        counterEl.textContent = this.sosAbortSeconds;
        SoundEngine.playBeep(700, 0.1);
      } else {
        clearInterval(this.currentSOSAbortTimer);
        this.executeSOSDispatch();
      }
    }, 1000);
  },

  cancelSOSAbort() {
    if (this.currentSOSAbortTimer) {
      clearInterval(this.currentSOSAbortTimer);
      this.currentSOSAbortTimer = null;
    }
    const modal = document.getElementById('sos-confirm-modal');
    if (modal) modal.classList.remove('active');
    Toast.show("Emergency alert cancelled. You are safe.", "info");
  },

  executeSOSDispatch() {
    if (this.currentSOSAbortTimer) {
      clearInterval(this.currentSOSAbortTimer);
      this.currentSOSAbortTimer = null;
    }
    const modal = document.getElementById('sos-confirm-modal');
    if (modal) modal.classList.remove('active');

    // Fetch high-accuracy coordinates
    LocationService.fetchCurrentPosition(() => {
      this.refreshSOSPreview();
      this.navigateTo('sos');
      Toast.show("EMERGENCY ACTIVATED! Please choose WhatsApp or SMS below to send your alert.", "error", 6000);
    });
  },

  generateSOSMessage() {
    const mapsUrl = `https://maps.google.com/?q=${this.coords.lat.toFixed(5)},${this.coords.lng.toFixed(5)}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userName = this.user ? this.user.name : "SafeHer User";
    const phone = this.user ? this.user.phone : "";

    return `EMERGENCY ALERT from ${userName} (${phone}):\nI am in immediate danger and need urgent help!\nMy exact live GPS location (${timeStr}):\n${mapsUrl}\nAccuracy: within ~${this.coords.accuracy} meters.\nPlease send assistance or call the police (112) immediately!`;
  },

  refreshSOSPreview() {
    const previewEl = document.getElementById('sos-preview-text');
    if (previewEl) {
      previewEl.value = this.generateSOSMessage();
    }
  },

  dispatchViaWhatsApp(specificPhone = null) {
    const message = encodeURIComponent(this.generateSOSMessage());
    let url = "";

    if (specificPhone) {
      const cleanPhone = specificPhone.replace(/[^0-9]/g, '');
      url = `https://wa.me/${cleanPhone}?text=${message}`;
    } else if (this.contacts && this.contacts.length > 0) {
      // Send to first contact or open WhatsApp chooser
      const firstWA = this.contacts.find(c => c.whatsapp) || this.contacts[0];
      const cleanPhone = firstWA.phone.replace(/[^0-9]/g, '');
      url = `https://wa.me/${cleanPhone}?text=${message}`;
    } else {
      url = `https://wa.me/?text=${message}`;
    }

    Toast.show("Opening WhatsApp... Tap 'Send' to dispatch your emergency message.", "info", 5000);
    window.open(url, '_blank');
  },

  dispatchViaSMS(specificPhone = null) {
    const rawMsg = this.generateSOSMessage();
    const encodedMsg = encodeURIComponent(rawMsg);
    let targetPhone = "";

    if (specificPhone) {
      targetPhone = specificPhone.replace(/[^0-9]/g, '');
    } else if (this.contacts && this.contacts.length > 0) {
      targetPhone = this.contacts[0].phone.replace(/[^0-9]/g, '');
    }

    // iOS and Android cross-platform sms URI
    const smsUrl = `sms:${targetPhone}?body=${encodedMsg}`;

    Toast.show("Opening SMS messaging app... Press 'Send' to dispatch.", "info", 5000);
    window.location.href = smsUrl;
  },

  // ------------------------------------------------------------------------
  // 5. Trusted Contacts Manager
  // ------------------------------------------------------------------------
  setupContactsManager() {
    const addBtn = document.getElementById('add-contact-btn');
    const modal = document.getElementById('contact-modal');
    const closeBtn = document.getElementById('close-contact-modal-btn');
    const cancelBtn = document.getElementById('cancel-contact-btn');
    const form = document.getElementById('contact-form');

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        ContactsManager.openModal();
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', () => ContactsManager.closeModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => ContactsManager.closeModal());

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        ContactsManager.saveFromForm();
      });
    }
  },

  // ------------------------------------------------------------------------
  // 6. Live Location Service & Leaflet Integration
  // ------------------------------------------------------------------------
  setupLocationService() {
    const refreshDashBtn = document.getElementById('refresh-location-dash-btn');
    const refreshMapBtn = document.getElementById('loc-refresh-btn');
    const shareDashBtn = document.getElementById('dash-share-loc-btn');
    const shareMapBtn = document.getElementById('loc-share-btn');
    const copyUrlBtn = document.getElementById('copy-map-url-btn');

    if (refreshDashBtn) {
      refreshDashBtn.addEventListener('click', () => {
        LocationService.fetchCurrentPosition();
      });
    }

    if (refreshMapBtn) {
      refreshMapBtn.addEventListener('click', () => {
        LocationService.fetchCurrentPosition();
      });
    }

    if (shareDashBtn || shareMapBtn) {
      const shareAction = () => LocationService.shareLocation();
      if (shareDashBtn) shareDashBtn.addEventListener('click', shareAction);
      if (shareMapBtn) shareMapBtn.addEventListener('click', shareAction);
    }

    if (copyUrlBtn) {
      copyUrlBtn.addEventListener('click', () => {
        const urlInput = document.getElementById('shareable-map-url');
        if (urlInput) {
          navigator.clipboard.writeText(urlInput.value).then(() => {
            Toast.show("Location link copied to clipboard!", "success");
          });
        }
      });
    }
  },

  // ------------------------------------------------------------------------
  // 7. Fake Call Simulator
  // ------------------------------------------------------------------------
  setupFakeCall() {
    const callerSelect = document.getElementById('fake-caller-name');
    const customGroup = document.getElementById('custom-caller-group');
    const triggerBtn = document.getElementById('trigger-fakecall-btn');
    const delayPills = document.querySelectorAll('.delay-pill');
    let selectedDelay = 0;

    if (callerSelect) {
      callerSelect.addEventListener('change', () => {
        if (callerSelect.value === 'custom') {
          customGroup.style.display = 'block';
        } else {
          customGroup.style.display = 'none';
        }
      });
    }

    delayPills.forEach(pill => {
      pill.addEventListener('click', () => {
        delayPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        selectedDelay = parseInt(pill.getAttribute('data-delay'), 10);
      });
    });

    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => {
        let callerName = callerSelect.value;
        if (callerName === 'custom') {
          callerName = document.getElementById('custom-caller-input').value.trim() || 'Incoming Caller';
        }
        const callerNumber = document.getElementById('fake-caller-number').value.trim() || '+91 98200 11091';
        const ringtoneEnabled = document.getElementById('fake-audio-ringtone-toggle').checked;

        FakeCallManager.scheduleCall(callerName, callerNumber, selectedDelay, ringtoneEnabled);
      });
    }

    // Incoming Call Modal Actions
    const answerBtn = document.getElementById('answer-call-btn');
    const declineBtn = document.getElementById('decline-call-btn');
    const hangupBtn = document.getElementById('hangup-call-btn');

    if (answerBtn) answerBtn.addEventListener('click', () => FakeCallManager.answerCall());
    if (declineBtn) declineBtn.addEventListener('click', () => FakeCallManager.endCall());
    if (hangupBtn) hangupBtn.addEventListener('click', () => FakeCallManager.endCall());
  },

  // ------------------------------------------------------------------------
  // 8. Safe Journey Tracker
  // ------------------------------------------------------------------------
  setupJourneyTracker() {
    const startBtn = document.getElementById('start-journey-btn');
    const arrivalBtn = document.getElementById('safe-arrival-btn');
    const shareBtn = document.getElementById('share-journey-btn');
    const panicBtn = document.getElementById('journey-panic-btn');

    if (startBtn) {
      startBtn.addEventListener('click', () => JourneyTracker.startJourney());
    }

    if (arrivalBtn) {
      arrivalBtn.addEventListener('click', () => JourneyTracker.endJourneySafe());
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', () => JourneyTracker.shareJourneyUpdate());
    }

    if (panicBtn) {
      panicBtn.addEventListener('click', () => App.triggerSOSConfirmation());
    }
  },

  // ------------------------------------------------------------------------
  // 9. Emergency Audio Recorder
  // ------------------------------------------------------------------------
  setupAudioRecorder() {
    const startBtn = document.getElementById('start-recording-btn');
    const stopBtn = document.getElementById('stop-recording-btn');
    const downloadBtn = document.getElementById('download-audio-btn');
    const discardBtn = document.getElementById('discard-audio-btn');

    if (startBtn) startBtn.addEventListener('click', () => AudioRecorderService.startRecording());
    if (stopBtn) stopBtn.addEventListener('click', () => AudioRecorderService.stopRecording());
    if (downloadBtn) downloadBtn.addEventListener('click', () => AudioRecorderService.downloadRecording());
    if (discardBtn) discardBtn.addEventListener('click', () => AudioRecorderService.discardRecording());
  },

  // ------------------------------------------------------------------------
  // 10. Nearby Emergency Services
  // ------------------------------------------------------------------------
  setupNearbyServices() {
    const filterBtns = document.querySelectorAll('.service-filter-bar .filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const category = btn.getAttribute('data-category');
        NearbyServicesManager.render(category);
      });
    });

    NearbyServicesManager.render('all');
  },

  // ------------------------------------------------------------------------
  // 11. Shake to Alert (Innovative)
  // ------------------------------------------------------------------------
  setupShakeToAlert() {
    const enableBtn = document.getElementById('enable-shake-btn');
    const testBtn = document.getElementById('test-shake-btn');
    const sensitivitySelect = document.getElementById('shake-sensitivity');

    if (enableBtn) {
      enableBtn.addEventListener('click', () => {
        ShakeDetector.requestAndEnable();
      });
    }

    if (testBtn) {
      testBtn.addEventListener('click', () => {
        ShakeDetector.triggerSimulatedShake();
      });
    }

    if (sensitivitySelect) {
      sensitivitySelect.addEventListener('change', () => {
        ShakeDetector.threshold = parseFloat(sensitivitySelect.value);
        Toast.show(`Shake sensitivity threshold set to ${ShakeDetector.threshold}`, "info");
      });
    }
  },

  // ------------------------------------------------------------------------
  // 12. Emergency Countdown Timer (Innovative)
  // ------------------------------------------------------------------------
  setupCountdownTimer() {
    const durationBtns = document.querySelectorAll('.duration-btn');
    let selectedMinutes = 5;

    durationBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        durationBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMinutes = parseInt(btn.getAttribute('data-minutes'), 10);
      });
    });

    const armBtn = document.getElementById('arm-countdown-btn');
    const disarmBtn = document.getElementById('disarm-timer-btn');

    if (armBtn) {
      armBtn.addEventListener('click', () => {
        const pin = document.getElementById('safety-pin-input').value.trim() || '1234';
        CountdownTimer.arm(selectedMinutes, pin);
      });
    }

    if (disarmBtn) {
      disarmBtn.addEventListener('click', () => {
        const enteredPin = document.getElementById('disarm-pin-input').value.trim();
        CountdownTimer.disarm(enteredPin);
      });
    }
  },

  // ------------------------------------------------------------------------
  // 13. Safety Tips & Search
  // ------------------------------------------------------------------------
  setupSafetyTips() {
    const searchInput = document.getElementById('tips-search-input');
    const catBtns = document.querySelectorAll('.tip-cat-btn');

    catBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        catBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.getAttribute('data-tip-cat');
        TipsManager.render(cat, searchInput ? searchInput.value : '');
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const activeCatBtn = document.querySelector('.tip-cat-btn.active');
        const cat = activeCatBtn ? activeCatBtn.getAttribute('data-tip-cat') : 'all';
        TipsManager.render(cat, searchInput.value);
      });
    }

    TipsManager.render('all');
  },

  // ------------------------------------------------------------------------
  // 14. User Profile & Auth
  // ------------------------------------------------------------------------
  setupAuthManager() {
    const profileForm = document.getElementById('profile-edit-form');
    const resetBtn = document.getElementById('reset-demo-data-btn');

    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        AuthService.saveProfileFromForm();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm("Reset all user profile and demo contacts to initial defaults?")) {
          StorageService.seedDefaults(true);
          App.user = StorageService.getUser();
          App.contacts = StorageService.getContacts();
          App.updateUserUI();
          ContactsManager.renderFullList();
          Toast.show("Default presentation demo data restored!", "success");
        }
      });
    }

    // Auth Modal Tabs & Actions
    const loginTabBtn = document.getElementById('tab-login-btn');
    const registerTabBtn = document.getElementById('tab-register-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const closeAuthBtn = document.getElementById('close-auth-modal-btn');
    const fillDemoBtn = document.getElementById('fill-demo-login-btn');

    if (loginTabBtn && registerTabBtn) {
      loginTabBtn.addEventListener('click', () => {
        loginTabBtn.classList.add('active');
        registerTabBtn.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
      });

      registerTabBtn.addEventListener('click', () => {
        registerTabBtn.classList.add('active');
        loginTabBtn.classList.remove('active');
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
      });
    }

    if (closeAuthBtn) {
      closeAuthBtn.addEventListener('click', () => {
        document.getElementById('auth-modal').classList.remove('active');
      });
    }

    if (fillDemoBtn) {
      fillDemoBtn.addEventListener('click', () => {
        document.getElementById('login-email').value = "diya@safeher.demo";
        document.getElementById('login-password').value = "safeher123";
        Toast.show("Demo credentials filled!", "info");
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        AuthService.login(
          document.getElementById('login-email').value,
          document.getElementById('login-password').value
        );
      });
    }

    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        AuthService.register({
          name: document.getElementById('reg-name').value,
          phone: document.getElementById('reg-phone').value,
          email: document.getElementById('reg-email').value
        });
      });
    }
  },

  // ------------------------------------------------------------------------
  // 15. Discreet / Stealth Calculator Disguise
  // ------------------------------------------------------------------------
  setupStealthCalculator() {
    const exitBtn = document.getElementById('exit-stealth-btn');
    const keys = document.querySelectorAll('.calc-key');
    const display = document.getElementById('calc-display');
    let currentCalc = '0';
    let shouldReset = false;

    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        this.toggleStealthMode(false);
      });
    }

    keys.forEach(key => {
      key.addEventListener('click', () => {
        const val = key.textContent.trim();
        if (val === 'C') {
          currentCalc = '0';
        } else if (val === '=') {
          try {
            const sanitized = currentCalc.replace(/×/g, '*').replace(/÷/g, '/');
            currentCalc = String(eval(sanitized) || 0);
          } catch {
            currentCalc = 'Error';
          }
          shouldReset = true;
        } else if (val === '±') {
          currentCalc = String(-parseFloat(currentCalc) || 0);
        } else if (val === '%') {
          currentCalc = String(parseFloat(currentCalc) / 100 || 0);
        } else {
          if (currentCalc === '0' || shouldReset) {
            currentCalc = val;
            shouldReset = false;
          } else {
            currentCalc += val;
          }
        }
        if (display) display.textContent = currentCalc.substring(0, 10);
      });
    });
  },

  toggleStealthMode(show) {
    const overlay = document.getElementById('stealth-calculator-overlay');
    if (overlay) {
      overlay.style.display = show ? 'flex' : 'none';
      if (show) {
        Toast.show("Stealth Mode Active. Tap 'Exit' to restore SafeHer.", "info");
      }
    }
  }
};

// --------------------------------------------------------------------------
// STORAGE SERVICE
// --------------------------------------------------------------------------
const StorageService = {
  KEYS: {
    USER: 'safeher_user_profile',
    CONTACTS: 'safeher_trusted_contacts',
    JOURNEY: 'safeher_active_journey'
  },

  init() {
    if (!localStorage.getItem(this.KEYS.USER)) {
      this.seedDefaults();
    }
  },

  seedDefaults(force = false) {
    if (force || !localStorage.getItem(this.KEYS.USER)) {
      const defaultUser = {
        name: "Diya Sharma",
        phone: "+91 98765 43210",
        email: "diya@safeher.demo",
        bloodGroup: "O+",
        address: "Flat 402, Lotus Apartments, MG Road, New Delhi",
        medicalInfo: "Asthmatic, carries emergency inhaler."
      };
      localStorage.setItem(this.KEYS.USER, JSON.stringify(defaultUser));
    }

    if (force || !localStorage.getItem(this.KEYS.CONTACTS)) {
      const defaultContacts = [
        {
          id: "c1",
          name: "Mom (Sunita)",
          phone: "+91 98200 12345",
          relation: "Parent / Mother",
          whatsapp: true
        },
        {
          id: "c2",
          name: "Papa (Rajesh)",
          phone: "+91 98200 67890",
          relation: "Parent / Father",
          whatsapp: true
        },
        {
          id: "c3",
          name: "Aanya (Best Friend)",
          phone: "+91 98111 22334",
          relation: "Best Friend",
          whatsapp: true
        }
      ];
      localStorage.setItem(this.KEYS.CONTACTS, JSON.stringify(defaultContacts));
    }
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.USER));
    } catch {
      return null;
    }
  },

  saveUser(user) {
    localStorage.setItem(this.KEYS.USER, JSON.stringify(user));
  },

  getContacts() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.CONTACTS)) || [];
    } catch {
      return [];
    }
  },

  saveContacts(contacts) {
    localStorage.setItem(this.KEYS.CONTACTS, JSON.stringify(contacts));
  }
};

// --------------------------------------------------------------------------
// SOUND SYNTHESIS ENGINE (Web Audio API - 100% Offline / Native)
// --------------------------------------------------------------------------
const SoundEngine = {
  ctx: null,
  ringInterval: null,

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  playBeep(freq = 440, duration = 0.1) {
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context beep error:", e);
    }
  },

  startPhoneRingtone() {
    this.stopPhoneRingtone();
    this.initContext();

    const ringCycle = () => {
      try {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Standard US/UK Dual Tone Multi-Frequency phone ring (440Hz + 480Hz)
        osc1.frequency.value = 440;
        osc2.frequency.value = 480;

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.setValueAtTime(0.2, now + 1.6);
        gain.gain.linearRampToValueAtTime(0.0001, now + 1.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.8);
        osc2.stop(now + 1.8);
      } catch (err) {
        console.warn("Ringtone synth error:", err);
      }
    };

    ringCycle();
    this.ringInterval = setInterval(ringCycle, 3500);
  },

  stopPhoneRingtone() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }
};

// --------------------------------------------------------------------------
// SIREN ALARM & STROBE SERVICE (Web Audio API)
// --------------------------------------------------------------------------
const SirenService = {
  osc: null,
  gain: null,
  modulator: null,
  active: false,

  start() {
    if (this.active) return;
    try {
      SoundEngine.initContext();
      const ctx = SoundEngine.ctx;
      if (!ctx) return;

      this.osc = ctx.createOscillator();
      this.gain = ctx.createGain();
      this.modulator = ctx.createOscillator();

      // Police / Deterrent dual-frequency siren modulation (700Hz to 1300Hz at 2Hz cycle)
      this.osc.type = 'sawtooth';
      this.osc.frequency.setValueAtTime(850, ctx.currentTime);

      const modGain = ctx.createGain();
      modGain.gain.value = 350; // Frequency variation amplitude
      this.modulator.frequency.value = 2.5; // Oscillation rate
      this.modulator.connect(modGain);
      modGain.connect(this.osc.frequency);

      this.gain.gain.setValueAtTime(0.35, ctx.currentTime);
      this.osc.connect(this.gain);
      this.gain.connect(ctx.destination);

      this.osc.start();
      this.modulator.start();

      this.active = true;
      document.getElementById('siren-modal').classList.add('active');
    } catch (e) {
      console.warn("Siren synth error:", e);
    }
  },

  stop() {
    if (!this.active) return;
    try {
      if (this.osc) {
        this.osc.stop();
        this.osc.disconnect();
      }
      if (this.modulator) {
        this.modulator.stop();
        this.modulator.disconnect();
      }
    } catch {}
    this.active = false;
    document.getElementById('siren-modal').classList.remove('active');
  },

  toggle() {
    if (this.active) {
      this.stop();
    } else {
      this.start();
    }
  }
};

// Add listener to stop siren button
document.addEventListener('DOMContentLoaded', () => {
  const stopSirenBtn = document.getElementById('stop-siren-btn');
  if (stopSirenBtn) {
    stopSirenBtn.addEventListener('click', () => SirenService.stop());
  }
});

// --------------------------------------------------------------------------
// LOCATION SERVICE & LEAFLET MAP
// --------------------------------------------------------------------------
const LocationService = {
  fetchCurrentPosition(callback = null) {
    const latEls = [document.getElementById('dash-lat'), document.getElementById('map-lat')];
    const lngEls = [document.getElementById('dash-lng'), document.getElementById('map-lng')];
    const accEl = document.getElementById('map-accuracy');
    const timeEl = document.getElementById('map-timestamp');
    const addrEl = document.getElementById('dash-address');

    if (!navigator.geolocation) {
      Toast.show("Geolocation API not supported by this browser. Using estimated coordinates.", "info");
      this.updateUI(App.coords.lat, App.coords.lng, 25);
      if (callback) callback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        App.coords = { lat: latitude, lng: longitude, accuracy: Math.round(accuracy) };
        this.updateUI(latitude, longitude, accuracy);
        if (callback) callback();
        Toast.show("GPS coordinates updated with high precision.", "success");
      },
      (err) => {
        console.warn("GPS Access Error:", err.message);
        Toast.show("Location permission denied or unavailable. Using default safety coordinates.", "info");
        this.updateUI(App.coords.lat, App.coords.lng, 25);
        if (callback) callback();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  },

  updateUI(lat, lng, acc) {
    const dashLat = document.getElementById('dash-lat');
    const dashLng = document.getElementById('dash-lng');
    const mapLat = document.getElementById('map-lat');
    const mapLng = document.getElementById('map-lng');
    const accEl = document.getElementById('map-accuracy');
    const timeEl = document.getElementById('map-timestamp');
    const addrEl = document.getElementById('dash-address');
    const shareableUrl = document.getElementById('shareable-map-url');
    const gmapsLink = document.getElementById('open-gmaps-link');

    const gUrl = `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`;

    if (dashLat) dashLat.textContent = lat.toFixed(5);
    if (dashLng) dashLng.textContent = lng.toFixed(5);
    if (mapLat) mapLat.textContent = lat.toFixed(5);
    if (mapLng) mapLng.textContent = lng.toFixed(5);
    if (accEl) accEl.textContent = `Within ~${Math.round(acc)}m`;
    if (timeEl) timeEl.textContent = new Date().toLocaleTimeString();
    if (shareableUrl) shareableUrl.value = gUrl;
    if (gmapsLink) gmapsLink.href = gUrl;
    if (addrEl) addrEl.innerHTML = `<i class="fa-solid fa-check text-success"></i> Locked: Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}) &bull; Precision ~${Math.round(acc)}m`;

    App.refreshSOSPreview();
    this.updateLeafletMarker();
  },

  renderMap() {
    const mapContainer = document.getElementById('live-leaflet-map');
    if (!mapContainer) return;

    if (!window.L) {
      console.warn("Leaflet library not loaded yet.");
      return;
    }

    if (!App.leafletMap) {
      try {
        App.leafletMap = L.map('live-leaflet-map').setView([App.coords.lat, App.coords.lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(App.leafletMap);

        // Custom pulsing marker
        const markerIcon = L.divIcon({
          className: 'custom-pulsing-marker',
          html: `<div style="width: 22px; height: 22px; background: #f43f5e; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 12px #f43f5e;"></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        App.leafletMarker = L.marker([App.coords.lat, App.coords.lng], { icon: markerIcon }).addTo(App.leafletMap);
        App.leafletMarker.bindPopup("<b>You are here</b><br>SafeHer Live Sentinel").openPopup();

        App.leafletCircle = L.circle([App.coords.lat, App.coords.lng], {
          radius: App.coords.accuracy || 25,
          color: '#f43f5e',
          fillColor: '#f43f5e',
          fillOpacity: 0.15
        }).addTo(App.leafletMap);
      } catch (err) {
        console.error("Leaflet initialization error:", err);
      }
    } else {
      setTimeout(() => {
        App.leafletMap.invalidateSize();
        this.updateLeafletMarker();
      }, 200);
    }
  },

  updateLeafletMarker() {
    if (App.leafletMap && App.leafletMarker) {
      App.leafletMarker.setLatLng([App.coords.lat, App.coords.lng]);
      if (App.leafletCircle) {
        App.leafletCircle.setLatLng([App.coords.lat, App.coords.lng]);
        App.leafletCircle.setRadius(App.coords.accuracy || 25);
      }
      App.leafletMap.panTo([App.coords.lat, App.coords.lng]);
    }
  },

  shareLocation() {
    const gUrl = `https://maps.google.com/?q=${App.coords.lat.toFixed(5)},${App.coords.lng.toFixed(5)}`;
    const shareText = `Here is my current live location via SafeHer: ${gUrl}`;

    if (navigator.share) {
      navigator.share({
        title: 'SafeHer Live Location',
        text: shareText,
        url: gUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        Toast.show("Location link copied to clipboard! Paste into your messaging app.", "success");
      });
    }
  }
};

// --------------------------------------------------------------------------
// CONTACTS MANAGER
// --------------------------------------------------------------------------
const ContactsManager = {
  renderDashboardMiniList() {
    const container = document.getElementById('dash-contacts-mini-list');
    if (!container) return;

    if (!App.contacts || App.contacts.length === 0) {
      container.innerHTML = `<p class="text-muted" style="font-size: 13px;">No emergency contacts added yet.</p>`;
      return;
    }

    container.innerHTML = App.contacts.slice(0, 3).map(contact => `
      <div class="contact-mini-row">
        <div class="contact-mini-meta">
          <div class="contact-avatar-pill">${contact.name.charAt(0).toUpperCase()}</div>
          <div class="contact-mini-info">
            <h4>${contact.name}</h4>
            <span>${contact.relation} &bull; ${contact.phone}</span>
          </div>
        </div>
        <div class="contact-mini-actions">
          <a href="tel:${contact.phone}" class="btn-icon-tiny call" title="Call ${contact.name}">
            <i class="fa-solid fa-phone"></i>
          </a>
          <button class="btn-icon-tiny wa" title="WhatsApp SOS" onclick="App.dispatchViaWhatsApp('${contact.phone}')">
            <i class="fa-brands fa-whatsapp"></i>
          </button>
        </div>
      </div>
    `).join('');
  },

  renderFullList() {
    const container = document.getElementById('contacts-grid-container');
    if (!container) return;

    if (!App.contacts || App.contacts.length === 0) {
      container.innerHTML = `
        <div class="card p-4 text-center" style="grid-column: 1 / -1;">
          <h3>No Guardians Registered</h3>
          <p class="mt-2">Add family members or trusted friends to ensure they receive your SOS distress messages.</p>
          <button class="btn btn-primary mt-3" onclick="ContactsManager.openModal()">
            <i class="fa-solid fa-user-plus"></i> Add First Contact
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = App.contacts.map(c => `
      <div class="contact-card">
        <div class="contact-card-top">
          <div class="contact-large-avatar">${c.name.charAt(0).toUpperCase()}</div>
          <div class="contact-main-meta">
            <h3>${c.name}</h3>
            <span class="relation-tag">${c.relation}</span>
            <div class="contact-phone-num"><i class="fa-solid fa-phone text-muted"></i> ${c.phone}</div>
          </div>
        </div>
        <div class="contact-actions-footer">
          <div class="contact-dispatch-btns">
            <a href="tel:${c.phone}" class="btn btn-secondary btn-sm" title="Call directly">
              <i class="fa-solid fa-phone text-success"></i> Call
            </a>
            <button class="btn btn-whatsapp btn-sm" onclick="App.dispatchViaWhatsApp('${c.phone}')" title="Send WhatsApp SOS">
              <i class="fa-brands fa-whatsapp"></i> SOS
            </button>
            <button class="btn btn-sms btn-sm" onclick="App.dispatchViaSMS('${c.phone}')" title="Send SMS SOS">
              <i class="fa-solid fa-comment-sms"></i> SMS
            </button>
          </div>
          <div>
            <button class="icon-btn-ghost" onclick="ContactsManager.edit('${c.id}')" title="Edit Contact">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="icon-btn-ghost" onclick="ContactsManager.delete('${c.id}')" title="Delete Contact">
              <i class="fa-solid fa-trash-can text-danger"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  openModal(contact = null) {
    const modal = document.getElementById('contact-modal');
    const title = document.getElementById('contact-modal-title');
    const editId = document.getElementById('contact-edit-id');
    const nameIn = document.getElementById('contact-name');
    const phoneIn = document.getElementById('contact-phone');
    const relIn = document.getElementById('contact-relation');
    const waIn = document.getElementById('contact-whatsapp');

    if (contact) {
      title.textContent = "Edit Emergency Contact";
      editId.value = contact.id;
      nameIn.value = contact.name;
      phoneIn.value = contact.phone;
      relIn.value = contact.relation;
      waIn.checked = !!contact.whatsapp;
    } else {
      title.textContent = "Add Emergency Contact";
      editId.value = "";
      nameIn.value = "";
      phoneIn.value = "";
      relIn.value = "Parent / Mother";
      waIn.checked = true;
    }

    modal.classList.add('active');
  },

  closeModal() {
    const modal = document.getElementById('contact-modal');
    if (modal) modal.classList.remove('active');
  },

  saveFromForm() {
    const editId = document.getElementById('contact-edit-id').value;
    const name = document.getElementById('contact-name').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const relation = document.getElementById('contact-relation').value;
    const whatsapp = document.getElementById('contact-whatsapp').checked;

    if (!name || !phone) {
      Toast.show("Please enter both contact name and phone number.", "error");
      return;
    }

    if (editId) {
      // Update existing
      const idx = App.contacts.findIndex(c => c.id === editId);
      if (idx !== -1) {
        App.contacts[idx] = { id: editId, name, phone, relation, whatsapp };
        Toast.show("Guardian details updated successfully.", "success");
      }
    } else {
      // Add new
      const newContact = {
        id: "c_" + Date.now(),
        name,
        phone,
        relation,
        whatsapp
      };
      App.contacts.push(newContact);
      Toast.show("New emergency contact added.", "success");
    }

    StorageService.saveContacts(App.contacts);
    App.updateUserUI();
    this.renderFullList();
    this.closeModal();
  },

  edit(id) {
    const c = App.contacts.find(item => item.id === id);
    if (c) this.openModal(c);
  },

  delete(id) {
    const c = App.contacts.find(item => item.id === id);
    if (!c) return;
    if (confirm(`Remove ${c.name} from trusted emergency guardians?`)) {
      App.contacts = App.contacts.filter(item => item.id !== id);
      StorageService.saveContacts(App.contacts);
      App.updateUserUI();
      this.renderFullList();
      Toast.show("Contact deleted.", "info");
    }
  }
};

// --------------------------------------------------------------------------
// FAKE CALL MANAGER
// --------------------------------------------------------------------------
const FakeCallManager = {
  callTimer: null,
  inCallInterval: null,
  inCallSeconds: 0,
  pendingTimeout: null,

  scheduleCall(callerName, callerNumber, delaySeconds, playRingtone) {
    if (this.pendingTimeout) clearTimeout(this.pendingTimeout);

    if (delaySeconds === 0) {
      this.triggerIncomingCall(callerName, callerNumber, playRingtone);
    } else {
      Toast.show(`Fake Call scheduled in ${delaySeconds} seconds. Lock or hold your phone naturally.`, "info", 4000);
      this.pendingTimeout = setTimeout(() => {
        this.triggerIncomingCall(callerName, callerNumber, playRingtone);
      }, delaySeconds * 1000);
    }
  },

  triggerIncomingCall(callerName, callerNumber, playRingtone) {
    const screen = document.getElementById('fake-call-screen');
    const title = document.getElementById('incoming-caller-title');
    const subtitle = document.getElementById('incoming-call-subtitle');
    const stateText = document.getElementById('incoming-call-state-text');
    const incomingBtns = document.getElementById('call-incoming-buttons');
    const inCallDeck = document.getElementById('in-call-active-deck');

    if (!screen) return;

    title.textContent = callerName;
    subtitle.textContent = callerNumber;
    stateText.textContent = "Incoming Voice Call...";
    incomingBtns.style.display = 'flex';
    inCallDeck.style.display = 'none';

    screen.classList.add('active');

    if (playRingtone) {
      SoundEngine.startPhoneRingtone();
    }
  },

  answerCall() {
    SoundEngine.stopPhoneRingtone();

    const incomingBtns = document.getElementById('call-incoming-buttons');
    const inCallDeck = document.getElementById('in-call-active-deck');
    const stateText = document.getElementById('incoming-call-state-text');
    const timerText = document.getElementById('in-call-timer-text');

    incomingBtns.style.display = 'none';
    inCallDeck.style.display = 'flex';
    stateText.textContent = "Call Connected &bull; Audio Active";

    this.inCallSeconds = 0;
    timerText.textContent = "00:00";

    if (this.inCallInterval) clearInterval(this.inCallInterval);
    this.inCallInterval = setInterval(() => {
      this.inCallSeconds++;
      const mins = String(Math.floor(this.inCallSeconds / 60)).padStart(2, '0');
      const secs = String(this.inCallSeconds % 60).padStart(2, '0');
      timerText.textContent = `${mins}:${secs}`;
    }, 1000);
  },

  endCall() {
    SoundEngine.stopPhoneRingtone();
    if (this.inCallInterval) {
      clearInterval(this.inCallInterval);
      this.inCallInterval = null;
    }
    const screen = document.getElementById('fake-call-screen');
    if (screen) screen.classList.remove('active');
    Toast.show("Fake call terminated.", "info");
  }
};

// --------------------------------------------------------------------------
// SAFE JOURNEY TRACKER
// --------------------------------------------------------------------------
const JourneyTracker = {
  active: false,
  startTime: null,
  timerInterval: null,
  data: {},

  startJourney() {
    const origin = document.getElementById('journey-origin').value.trim() || 'Current Location';
    const dest = document.getElementById('journey-destination').value.trim();
    const mode = document.getElementById('journey-mode').value.trim() || 'In Transit';
    const duration = document.getElementById('journey-duration').value;

    if (!dest) {
      Toast.show("Please enter your journey destination.", "error");
      return;
    }

    this.active = true;
    this.startTime = Date.now();
    this.data = { origin, dest, mode, duration };

    document.getElementById('journey-setup-view').style.display = 'none';
    document.getElementById('journey-active-view').style.display = 'block';

    document.getElementById('active-origin-text').textContent = origin;
    document.getElementById('active-dest-text').textContent = dest;
    document.getElementById('active-vehicle-text').textContent = mode;

    this.startClock();
    Toast.show("Safe Journey active. Guardians can now be updated with 1 tap.", "success");
  },

  startClock() {
    const clockEl = document.getElementById('journey-elapsed-clock');
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      const elapsedMs = Date.now() - this.startTime;
      const totalSecs = Math.floor(elapsedMs / 1000);
      const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
      const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
      const secs = String(totalSecs % 60).padStart(2, '0');
      clockEl.textContent = `${hrs}:${mins}:${secs}`;
    }, 1000);
  },

  endJourneySafe() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.active = false;

    document.getElementById('journey-setup-view').style.display = 'block';
    document.getElementById('journey-active-view').style.display = 'none';

    Toast.show("Awesome! Journey completed safely.", "success");

    // Optional quick notification to contacts
    if (confirm("Would you like to notify your trusted contacts that you arrived safely via WhatsApp?")) {
      const gUrl = `https://maps.google.com/?q=${App.coords.lat.toFixed(5)},${App.coords.lng.toFixed(5)}`;
      const msg = encodeURIComponent(`Hi! Just letting you know that I have arrived safely at ${this.data.dest || 'my destination'}. Thank you! My location: ${gUrl}`);
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    }
  },

  shareJourneyUpdate() {
    const gUrl = `https://maps.google.com/?q=${App.coords.lat.toFixed(5)},${App.coords.lng.toFixed(5)}`;
    const msg = encodeURIComponent(`JOURNEY UPDATE from SafeHer:\nI am travelling from ${this.data.origin} to ${this.data.dest} via ${this.data.mode}.\nCurrent GPS: ${gUrl}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }
};

// --------------------------------------------------------------------------
// EMERGENCY AUDIO RECORDER SERVICE (MediaRecorder API)
// --------------------------------------------------------------------------
const AudioRecorderService = {
  mediaRecorder: null,
  audioChunks: [],
  audioBlob: null,
  timerInterval: null,
  recordSeconds: 0,

  async startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      Toast.show("Audio recording not supported in this browser environment.", "error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(this.audioBlob);
        const player = document.getElementById('audio-player-element');
        const playbackDeck = document.getElementById('audio-playback-deck');

        if (player) player.src = audioUrl;
        if (playbackDeck) playbackDeck.style.display = 'block';

        // Stop all tracks to release mic hardware
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();

      // UI state
      document.querySelector('.recording-deck-card').classList.add('recording-active');
      document.getElementById('start-recording-btn').style.display = 'none';
      document.getElementById('stop-recording-btn').style.display = 'inline-flex';
      document.getElementById('recorder-status-text').textContent = "Microphone ACTIVE - Capturing ambient audio evidence...";

      this.recordSeconds = 0;
      const timerEl = document.getElementById('recording-duration-timer');
      timerEl.textContent = "00:00";

      this.timerInterval = setInterval(() => {
        this.recordSeconds++;
        const mins = String(Math.floor(this.recordSeconds / 60)).padStart(2, '0');
        const secs = String(this.recordSeconds % 60).padStart(2, '0');
        timerEl.textContent = `${mins}:${secs}`;
      }, 1000);

      Toast.show("Audio evidence recording started.", "info");
    } catch (err) {
      console.warn("Microphone access error:", err);
      Toast.show("Microphone permission denied. Please allow microphone access in your browser settings.", "error");
    }
  },

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.timerInterval) clearInterval(this.timerInterval);

    document.querySelector('.recording-deck-card').classList.remove('recording-active');
    document.getElementById('start-recording-btn').style.display = 'inline-flex';
    document.getElementById('stop-recording-btn').style.display = 'none';
    document.getElementById('recorder-status-text').textContent = "Recording saved to local memory. You can play or download it below.";
    Toast.show("Audio recording captured successfully.", "success");
  },

  downloadRecording() {
    if (!this.audioBlob) return;
    const url = URL.createObjectURL(this.audioBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `SafeHer_Evidence_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
    Toast.show("Evidence audio downloaded to your device.", "success");
  },

  discardRecording() {
    this.audioBlob = null;
    const playbackDeck = document.getElementById('audio-playback-deck');
    const timerEl = document.getElementById('recording-duration-timer');
    if (playbackDeck) playbackDeck.style.display = 'none';
    if (timerEl) timerEl.textContent = "00:00";
    document.getElementById('recorder-status-text').textContent = "Ready to record with microphone permission.";
    Toast.show("Recording discarded.", "info");
  }
};

// --------------------------------------------------------------------------
// NEARBY EMERGENCY SERVICES
// --------------------------------------------------------------------------
const NearbyServicesManager = {
  data: [
    {
      name: "Central Police Division HQ",
      category: "police",
      distance: "0.8 km",
      address: "Sector 4, Main Marg, Near City Center",
      phone: "100",
      query: "police+station"
    },
    {
      name: "Women Safety & Cyber Crime Desk",
      category: "women",
      distance: "1.2 km",
      address: "Police Complex, Block B, Help Desk 1091",
      phone: "1091",
      query: "women+police+station"
    },
    {
      name: "City Apex Trauma Center & Hospital",
      category: "hospital",
      distance: "1.5 km",
      address: "Institutional Area, 24/7 Emergency Wing",
      phone: "102",
      query: "hospital"
    },
    {
      name: "Apollo 24/7 Emergency Pharmacy",
      category: "pharmacy",
      distance: "0.4 km",
      address: "Shop 12, Market Square, Open All Night",
      phone: "+91 98100 55443",
      query: "pharmacy"
    },
    {
      name: "Government District Civil Hospital",
      category: "hospital",
      distance: "2.1 km",
      address: "Civil Lines, Emergency Casualty Dept",
      phone: "108",
      query: "civil+hospital"
    },
    {
      name: "Metro Station Police Post",
      category: "police",
      distance: "0.5 km",
      address: "Gate No. 2, Metro Interchange",
      phone: "112",
      query: "metro+police"
    }
  ],

  render(category = 'all') {
    const container = document.getElementById('services-grid-container');
    if (!container) return;

    const filtered = category === 'all'
      ? this.data
      : this.data.filter(s => s.category === category);

    container.innerHTML = filtered.map(item => {
      let iconClass = "icon-police";
      let icon = "fa-building-shield";
      let catLabel = "Police Station";

      if (item.category === 'hospital') {
        iconClass = "icon-hospital";
        icon = "fa-hospital";
        catLabel = "Hospital / Trauma";
      } else if (item.category === 'women') {
        iconClass = "icon-women";
        icon = "fa-shield-cat";
        catLabel = "Women Help Desk";
      } else if (item.category === 'pharmacy') {
        iconClass = "icon-pharmacy";
        icon = "fa-prescription-bottle-medical";
        catLabel = "24/7 Pharmacy";
      }

      // Dynamic OpenStreetMap / Google Maps link centered on user's real coordinates
      const mapLink = `https://www.google.com/maps/search/${item.query}/@${App.coords.lat},${App.coords.lng},14z`;

      return `
        <div class="service-card">
          <div>
            <div class="service-card-header">
              <div class="service-badge-icon ${iconClass}">
                <i class="fa-solid ${icon}"></i>
              </div>
              <div class="service-meta">
                <h4>${item.name}</h4>
                <span class="service-tag">${catLabel} &bull; ~${item.distance}</span>
              </div>
            </div>
            <p class="service-address">${item.address}</p>
          </div>
          <div class="service-actions">
            <a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
              <i class="fa-solid fa-diamond-turn-right"></i> Navigate (Map)
            </a>
            <a href="tel:${item.phone}" class="btn btn-secondary btn-sm">
              <i class="fa-solid fa-phone"></i> ${item.phone}
            </a>
          </div>
        </div>
      `;
    }).join('');
  }
};

// --------------------------------------------------------------------------
// SHAKE TO ALERT (Innovative Feature)
// --------------------------------------------------------------------------
const ShakeDetector = {
  active: false,
  threshold: 20,
  lastX: 0,
  lastY: 0,
  lastZ: 0,
  lastUpdate: 0,

  async requestAndEnable() {
    const badge = document.getElementById('motion-sensor-badge');
    const enableBtn = document.getElementById('enable-shake-btn');

    // iOS 13+ requires explicit user gesture permission
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const response = await DeviceMotionEvent.requestPermission();
        if (response === 'granted') {
          this.startListening();
        } else {
          Toast.show("Motion sensor permission was denied by device.", "error");
        }
      } catch (err) {
        console.warn("DeviceMotionEvent permission error:", err);
        this.startListening();
      }
    } else if ('ondevicemotion' in window) {
      this.startListening();
    } else {
      Toast.show("Motion sensors are not available on this device/browser. You can still test with the 'Test Shake Alert' button below.", "info", 5000);
      badge.textContent = "Simulated (Desktop)";
      badge.className = "badge badge-purple";
    }
  },

  startListening() {
    window.addEventListener('devicemotion', (e) => this.handleMotion(e), false);
    this.active = true;
    const badge = document.getElementById('motion-sensor-badge');
    const enableBtn = document.getElementById('enable-shake-btn');

    if (badge) {
      badge.textContent = "Listening (Active)";
      badge.className = "badge badge-success";
    }
    if (enableBtn) {
      enableBtn.innerHTML = `<i class="fa-solid fa-check"></i> Shake Detection Armed`;
      enableBtn.classList.replace('btn-primary', 'btn-success');
    }
    Toast.show("Shake Sentinel armed! Vigorous shaking will trigger Emergency SOS.", "success");
  },

  handleMotion(e) {
    const current = e.accelerationIncludingGravity || e.acceleration;
    if (!current) return;

    const curTime = Date.now();
    if ((curTime - this.lastUpdate) > 100) {
      const diffTime = curTime - this.lastUpdate;
      this.lastUpdate = curTime;

      const x = current.x || 0;
      const y = current.y || 0;
      const z = current.z || 0;

      // Update Visual Meter Bars for project presentation
      const meterX = document.getElementById('meter-x');
      const meterY = document.getElementById('meter-y');
      const meterZ = document.getElementById('meter-z');
      const valX = document.getElementById('val-x');
      const valY = document.getElementById('val-y');
      const valZ = document.getElementById('val-z');

      if (meterX) meterX.style.width = `${Math.min(100, Math.abs(x) * 5)}%`;
      if (meterY) meterY.style.width = `${Math.min(100, Math.abs(y) * 5)}%`;
      if (meterZ) meterZ.style.width = `${Math.min(100, Math.abs(z) * 5)}%`;
      if (valX) valX.textContent = x.toFixed(1);
      if (valY) valY.textContent = y.toFixed(1);
      if (valZ) valZ.textContent = z.toFixed(1);

      const delta = Math.abs(x + y + z - this.lastX - this.lastY - this.lastZ) / diffTime * 10000;

      if (delta > (this.threshold * 50)) {
        this.triggerAlert();
      }

      this.lastX = x;
      this.lastY = y;
      this.lastZ = z;
    }
  },

  triggerAlert() {
    if (!this.active) return;
    this.active = false; // Prevent multiple rapid triggers
    Toast.show("SHAKE DETECTED! Triggering Emergency SOS...", "error");
    SoundEngine.playBeep(900, 0.4);
    App.triggerSOSConfirmation();
    setTimeout(() => { this.active = true; }, 5000);
  },

  triggerSimulatedShake() {
    Toast.show("Simulating phone shake gesture...", "info");
    const valZ = document.getElementById('val-z');
    const meterZ = document.getElementById('meter-z');
    if (valZ) valZ.textContent = "38.5";
    if (meterZ) meterZ.style.width = "100%";

    setTimeout(() => {
      this.triggerAlert();
    }, 600);
  }
};

// --------------------------------------------------------------------------
// EMERGENCY COUNTDOWN TIMER (Innovative Feature)
// --------------------------------------------------------------------------
const CountdownTimer = {
  interval: null,
  totalSeconds: 300,
  remainingSeconds: 300,
  pin: '1234',

  arm(minutes, pin) {
    this.totalSeconds = minutes * 60;
    this.remainingSeconds = this.totalSeconds;
    this.pin = pin || '1234';

    document.getElementById('countdown-setup-state').style.display = 'none';
    document.getElementById('countdown-active-state').style.display = 'block';

    const circle = document.getElementById('countdown-svg-circle');
    const totalCircumference = 2 * Math.PI * 90; // r = 90
    circle.style.strokeDasharray = `${totalCircumference} ${totalCircumference}`;
    circle.style.strokeDashoffset = 0;

    this.updateDisplay();

    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => {
      this.remainingSeconds--;
      this.updateDisplay();

      // Final 10 seconds audio warning beeps
      if (this.remainingSeconds <= 10 && this.remainingSeconds > 0) {
        SoundEngine.playBeep(800, 0.15);
      }

      if (this.remainingSeconds <= 0) {
        clearInterval(this.interval);
        this.handleTimeout();
      }
    }, 1000);

    Toast.show(`Safety Watch active for ${minutes} min(s). Remember PIN: ${this.pin}`, "info");
  },

  updateDisplay() {
    const digits = document.getElementById('countdown-remaining-digits');
    const circle = document.getElementById('countdown-svg-circle');
    const mins = String(Math.floor(this.remainingSeconds / 60)).padStart(2, '0');
    const secs = String(this.remainingSeconds % 60).padStart(2, '0');

    if (digits) digits.textContent = `${mins}:${secs}`;

    if (circle) {
      const totalCircumference = 2 * Math.PI * 90;
      const fraction = this.remainingSeconds / this.totalSeconds;
      const offset = totalCircumference - (fraction * totalCircumference);
      circle.style.strokeDashoffset = offset;
    }
  },

  disarm(enteredPin) {
    if (enteredPin === this.pin) {
      if (this.interval) clearInterval(this.interval);
      document.getElementById('countdown-setup-state').style.display = 'block';
      document.getElementById('countdown-active-state').style.display = 'none';
      document.getElementById('disarm-pin-input').value = '';
      Toast.show("Safety Timer disarmed. Glad you are safe!", "success");
    } else {
      Toast.show("Incorrect Safety PIN! Please try again.", "error");
    }
  },

  handleTimeout() {
    document.getElementById('countdown-setup-state').style.display = 'block';
    document.getElementById('countdown-active-state').style.display = 'none';

    Toast.show("SAFETY TIMER EXPIRED WITHOUT CONFIRMATION! Activating SOS...", "error", 8000);
    SirenService.start();
    App.triggerSOSConfirmation();
  }
};

// --------------------------------------------------------------------------
// SAFETY TIPS & LEGAL RIGHTS
// --------------------------------------------------------------------------
const TipsManager = {
  tips: [
    {
      category: "travel",
      title: "Solo Cab & Auto Precautions",
      tag: "Commute",
      desc: "Before entering any cab or auto, ensure the child-lock mechanism is disengaged. Take a photo of the vehicle number plate and make a quick fake or real call stating the plate number out loud."
    },
    {
      category: "travel",
      title: "Night Metro / Train Travel",
      tag: "Commute",
      desc: "Always board coaches closest to the train operator or guard cabins. In metro networks, use designated women coaches and stand near the emergency talk-back intercom."
    },
    {
      category: "personal",
      title: "Perimeter Awareness & Situational Eye Contact",
      tag: "Personal",
      desc: "Walk with confidence, chin up. If you sense someone following, make brief assertive eye contact to indicate you have noted their presence and will not be an easy ambush target."
    },
    {
      category: "personal",
      title: "Everyday Self-Defense Improvisations",
      tag: "Personal",
      desc: "Household keys held firmly between knuckles, deodorant/perfume sprays aimed at eyes, or heavy water bottles can instantly buy you crucial seconds to escape to safety."
    },
    {
      category: "online",
      title: "Social Media Live Location Expiry",
      tag: "Online",
      desc: "Never post real-time restaurant check-ins or live stories while still physically present at the venue. Delay uploads until after you have safely departed."
    },
    {
      category: "online",
      title: "Cyber Stalking & Image Safety",
      tag: "Online",
      desc: "Immediately take timestamped screenshots with full URLs when facing online harassment. File complaints directly at cybercrime.gov.in or women helpline 1930."
    },
    {
      category: "legal",
      title: "Right to Zero FIR (Indian Penal Code)",
      tag: "Legal Rights",
      desc: "A woman can register a 'Zero FIR' at ANY police station irrespective of territorial jurisdiction if an emergency crime has occurred. Police cannot refuse to file it."
    },
    {
      category: "legal",
      title: "Arrest Rules for Women",
      tag: "Legal Rights",
      desc: "Section 46(4) of the CrPC mandates that no woman can be arrested after sunset and before sunrise, except in extraordinary circumstances under special Magistrate permission."
    }
  ],

  render(category = 'all', searchQuery = '') {
    const container = document.getElementById('tips-cards-container');
    if (!container) return;

    let filtered = category === 'all'
      ? this.tips
      : this.tips.filter(t => t.category === category);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        t.tag.toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `<p class="text-muted p-4">No safety tips matching your search.</p>`;
      return;
    }

    container.innerHTML = filtered.map(t => {
      let tagClass = "tag-personal";
      if (t.category === 'travel') tagClass = "tag-travel";
      if (t.category === 'online') tagClass = "tag-online";
      if (t.category === 'legal') tagClass = "tag-legal";

      return `
        <div class="safety-tip-card">
          <span class="tip-tag-badge ${tagClass}">${t.tag}</span>
          <h3>${t.title}</h3>
          <p>${t.desc}</p>
        </div>
      `;
    }).join('');
  }
};

// --------------------------------------------------------------------------
// AUTH SERVICE (Demo LocalStorage Authentication)
// --------------------------------------------------------------------------
const AuthService = {
  login(email, password) {
    if (email && password) {
      Toast.show(`Welcome back, ${App.user.name}!`, "success");
      document.getElementById('auth-modal').classList.remove('active');
    } else {
      Toast.show("Please enter both email and password.", "error");
    }
  },

  register(data) {
    if (!data.name || !data.email) {
      Toast.show("Please complete all required fields.", "error");
      return;
    }

    const newUser = {
      name: data.name,
      phone: data.phone || '+91 ...',
      email: data.email,
      bloodGroup: 'O+',
      address: '',
      medicalInfo: ''
    };

    StorageService.saveUser(newUser);
    App.user = newUser;
    App.updateUserUI();
    document.getElementById('auth-modal').classList.remove('active');
    Toast.show(`Account registered! Welcome to SafeHer, ${data.name}.`, "success");
  },

  saveProfileFromForm() {
    const updated = {
      name: document.getElementById('prof-fullname').value.trim(),
      phone: document.getElementById('prof-phone').value.trim(),
      email: document.getElementById('prof-email').value.trim(),
      bloodGroup: document.getElementById('prof-blood').value,
      address: document.getElementById('prof-address').value.trim(),
      medicalInfo: document.getElementById('prof-medical').value.trim()
    };

    StorageService.saveUser(updated);
    App.user = updated;
    App.updateUserUI();
    Toast.show("Profile & safety dossier updated successfully.", "success");
  },

  logout() {
    Toast.show("You have been safely logged out. Showing guest demo mode.", "info");
    document.getElementById('auth-modal').classList.add('active');
  }
};

// --------------------------------------------------------------------------
// TOAST NOTIFICATION UTILITY
// --------------------------------------------------------------------------
const Toast = {
  show(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = "fa-circle-info";
    if (type === 'success') icon = "fa-circle-check";
    if (type === 'error') icon = "fa-triangle-exclamation";

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => {
        if (container.contains(toast)) container.removeChild(toast);
      }, 300);
    }, duration);
  }
};

// --------------------------------------------------------------------------
// DOM CONTENT LOADED ENTRY POINT
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
