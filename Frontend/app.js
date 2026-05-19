const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BACKEND_BASE_URL = isLocalhost 
    ? 'http://localhost:3000/api' 
    : 'https://complaints-registration-platform-full-2ydu.onrender.com/api';

// State Management
const state = {
    user: null, // { name, email, role }
    currentPage: 'login',
    registrationData: { name: '', email: '', otp: '', password: '' },
    currentComplaint: { text: '', aiQuestion: '', aiAnswer: '' }
};

// Elements
const app = document.getElementById('app');
const navbar = document.getElementById('navbar');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');

// --- Navigation & Routing ---

const navigateTo = (page) => {
    state.currentPage = page;
    render();
};

const render = () => {
    // Show/Hide Navbar based on auth
    if (state.user) {
        navbar.classList.remove('hidden');
        userDisplay.textContent = `${state.user.name} (${state.user.role})`;
    } else {
        navbar.classList.add('hidden');
    }

    // Render page content
    switch (state.currentPage) {
        case 'register': renderRegister(); break;
        case 'login': renderLogin(); break;
        case 'submit-complaint': renderSubmitComplaint(); break;
        case 'my-complaints': renderMyComplaints(); break;
        case 'admin-dashboard': renderAdminDashboard(); break;
        default: renderLogin();
    }
};

// --- API Helpers ---

const apiCall = async (endpoint, method = 'GET', body = null) => {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    };
    if (body) options.body = JSON.stringify(body);

    try {
        console.log(`Calling API: ${method} ${BACKEND_BASE_URL}${endpoint}`);
        const response = await fetch(`${BACKEND_BASE_URL}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            console.error('API Error Response:', data);
            throw new Error(data.message || 'Something went wrong');
        }

        return data;
    } catch (err) {
        console.error('Fetch Error:', err);
        // Provide a more helpful message for 'Failed to fetch'
        if (err.message === 'Failed to fetch') {
            throw new Error('Could not connect to the server. Please ensure the backend is running at ' + BACKEND_BASE_URL);
        }
        throw err;
    }
};

// --- Page Renderers ---

const renderRegister = () => {
    app.innerHTML = `
        <div class="container">
            <h1>Create Account</h1>
            <p class="subtitle">Join SafeVoice to securely register your concerns.</p>
            <form id="register-form">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="reg-name" placeholder="John Doe" required>
                </div>
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" id="reg-email" placeholder="john@example.com" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="reg-pw" placeholder="••••••••" required>
                </div>
                <div class="form-group">
                    <label>Confirm Password</label>
                    <input type="password" id="reg-pw-confirm" placeholder="••••••••" required>
                </div>
                <div id="error-box" class="error-message"></div>
                <button type="submit" id="reg-btn">Complete Registration</button>
                <button type="button" class="secondary-btn" onclick="navigateTo('login')">Already have an account? Login</button>
            </form>
        </div>
    `;

    document.getElementById('register-form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('reg-btn');
        const errorBox = document.getElementById('error-box');

        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const pw = document.getElementById('reg-pw').value;
        const confirm = document.getElementById('reg-pw-confirm').value;

        if (pw !== confirm) {
            errorBox.textContent = "Passwords do not match";
            errorBox.style.display = 'block';
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<div class="spinner"></div> Registering...';

        try {
            await apiCall('/auth/register', 'POST', { name, email, password: pw });
            alert('Registration successful! Please login.');
            navigateTo('login');
        } catch (err) {
            errorBox.textContent = err.message;
            errorBox.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Complete Registration';
        }
    };
};

const renderLogin = () => {
    app.innerHTML = `
        <div class="container">
            <h1>Welcome Back</h1>
            <p class="subtitle">Login to manage your complaints.</p>
            <form id="login-form">
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" id="login-email" placeholder="john@example.com" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="login-pw" placeholder="••••••••" required>
                </div>
                <div id="error-box" class="error-message"></div>
                <button type="submit" id="login-btn">Login</button>
                <button type="button" class="secondary-btn" onclick="navigateTo('register')">New here? Create account</button>
            </form>
        </div>
    `;

    document.getElementById('login-form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('login-btn');
        const errorBox = document.getElementById('error-box');
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner"></div> Logging in...';

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-pw').value;

        try {
            const user = await apiCall('/auth/login', 'POST', { email, password });
            state.user = user;
            if (user.role === 'admin') {
                navigateTo('admin-dashboard');
            } else {
                navigateTo('my-complaints');
            }
        } catch (err) {
            errorBox.textContent = err.message;
            errorBox.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Login';
        }
    };
};

const renderSubmitComplaint = () => {
    app.innerHTML = `
        <div class="container wide">
            <h1>Submit New Complaint</h1>
            <p class="subtitle">Please provide your details and describe your concern.</p>
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" id="comp-name" placeholder="John Doe" required>
            </div>
            <div class="form-group">
                <label>City</label>
                <input type="text" id="comp-city" placeholder="New York" required>
            </div>
            <div class="form-group">
                <label>Mobile Number</label>
                <input type="text" id="comp-mobile" placeholder="+1 234 567 890" required>
            </div>
            <div class="form-group">
                <label>Your Complaint</label>
                <textarea id="complaint-text" rows="5" placeholder="Tell us what happened..." required></textarea>
            </div>
            <div id="error-box" class="error-message"></div>
            <button id="final-submit-btn">Submit Complaint</button>
            <button class="secondary-btn" onclick="navigateTo('login')">Back to Login</button>
        </div>
    `;

    const submitBtn = document.getElementById('final-submit-btn');
    const errorBox = document.getElementById('error-box');

    submitBtn.onclick = async () => {
        const name = document.getElementById('comp-name').value;
        const city = document.getElementById('comp-city').value;
        const mobile = document.getElementById('comp-mobile').value;
        const complaint = document.getElementById('complaint-text').value;

        if (!name || !city || !mobile || !complaint) {
            errorBox.textContent = "All fields are required";
            errorBox.style.display = 'block';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner"></div> Submitting...';

        try {
            await apiCall('/complaints', 'POST', {
                name,
                city,
                mobile,
                complaint
            });
            alert('Complaint submitted successfully!');
            // Redirect to a success state or back to login
            navigateTo('login');
        } catch (err) {
            errorBox.textContent = err.message;
            errorBox.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Complaint';
        }
    };
};

const renderMyComplaints = () => {
    app.innerHTML = `
        <div class="container wide">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h1>My Complaints</h1>
                <button style="width: auto;" onclick="navigateTo('submit-complaint')">+ New Complaint</button>
            </div>
            <div id="complaints-list">
                <div class="spinner" style="margin: 2rem auto;"></div>
            </div>
        </div>
    `;

    loadComplaints();
};

const loadComplaints = async () => {
    const list = document.getElementById('complaints-list');
    try {
        const complaints = await apiCall('/complaints/my');
        if (complaints.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--text-muted);">You haven\'t submitted any complaints yet.</p>';
            return;
        }

        list.innerHTML = complaints.map(c => `
            <div class="complaint-card">
                <div class="complaint-header">
                    <span class="user-info">ID: #${c.id}</span>
                    <span class="complaint-date">${new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="complaint-body">
                    <div>
                        <div class="label-small">Original Complaint</div>
                        <p class="text-content">${c.complaint}</p>
                    </div>
                    ${c.aiQuestion ? `
                    <div class="ai-section">
                        <div class="label-small">AI Follow-up</div>
                        <p class="text-content"><strong>Q:</strong> ${c.aiQuestion}</p>
                        <p class="text-content"><strong>A:</strong> ${c.userAnswer}</p>
                    </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = `<p class="error-message" style="display: block;">Error: ${err.message}</p>`;
    }
};

const renderAdminDashboard = () => {
    app.innerHTML = `
        <div class="container wide">
            <h1>Admin Dashboard</h1>
            <p class="subtitle">All complaints submitted across the platform.</p>
            <div id="admin-complaints-list">
                <div class="spinner" style="margin: 2rem auto;"></div>
            </div>
        </div>
    `;

    loadAllComplaints();
};

const loadAllComplaints = async () => {
    const list = document.getElementById('admin-complaints-list');
    try {
        const complaints = await apiCall('/complaints/all');
        if (complaints.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No complaints found.</p>';
            return;
        }

        list.innerHTML = complaints.map(c => `
            <div class="complaint-card">
                <div class="complaint-header">
                    <span class="user-info">${c.name} (${c.city} - ${c.mobile})</span>
                    <span class="complaint-date">${new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="complaint-body">
                    <div>
                        <div class="label-small">Complaint</div>
                        <p class="text-content">${c.complaint}</p>
                    </div>
                    ${c.aiQuestion ? `
                    <div class="ai-section">
                        <div class="label-small">AI Interaction</div>
                        <p class="text-content"><strong>Q:</strong> ${c.aiQuestion}</p>
                        <p class="text-content"><strong>A:</strong> ${c.userAnswer}</p>
                    </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = `<p class="error-message" style="display: block;">Error: ${err.message}</p>`;
    }
};

// --- Initialization ---

logoutBtn.onclick = async () => {
    await apiCall('/auth/logout', 'POST');
    state.user = null;
    navigateTo('login');
};

const checkSession = async () => {
    try {
        const user = await apiCall('/auth/me');
        state.user = user;
        if (user.role === 'admin') {
            navigateTo('admin-dashboard');
        } else {
            navigateTo('my-complaints');
        }
    } catch (err) {
        navigateTo('login');
    }
};

// Start
checkSession();
