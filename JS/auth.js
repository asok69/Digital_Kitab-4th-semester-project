let currentRole = 'student';

function selectRole(role) {
    currentRole = role;
    const studentBtn = document.getElementById('studentBtn');
    const adminBtn = document.getElementById('adminBtn');

    if (role === 'student') {
        studentBtn.classList.add('active');
        adminBtn.classList.remove('active');
    } else {
        adminBtn.classList.add('active');
        studentBtn.classList.remove('active');
    }

    document.getElementById('errorMessage').classList.remove('show');
}

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    // Show loading state
    const loginBtn = document.querySelector('.login-btn');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = 'Logging in...';
    loginBtn.disabled = true;

    try {
        const response = await apiCall('/auth/login.php', 'POST', {
            email: email,
            password: password,
            role: currentRole
        });

        if (response.success) {
            // Store user info if "Remember Me" is checked
            if (remember) {
                localStorage.setItem('userEmail', email);
                localStorage.setItem('userRole', currentRole);
            }

            // Redirect based on role
            if (currentRole === 'student') {
                window.location.href = 'UserDashboard.html';
            } else {
                window.location.href = 'AdminDashboard.html';
            }
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = error.message || 'Invalid credentials. Please try again.';
        errorMessage.classList.add('show');

        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    }
}

// Toggle password visibility for login page
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(inputId + '-toggle-icon');

    if (!input || !icon) {
        console.error('Password input or icon not found:', inputId);
        return;
    }

    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '👁️‍🗨️'; // Eye with speech bubble (hidden state)
    } else {
        input.type = 'password';
        icon.textContent = '👁️'; // Normal eye (visible state)
    }
}

// Clear error message when user starts typing
document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ auth.js loaded');

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');

    if (emailInput && passwordInput) {
        emailInput.addEventListener('input', () => errorMessage.classList.remove('show'));
        passwordInput.addEventListener('input', () => errorMessage.classList.remove('show'));
    }

    // Pre-fill email if remembered
    const savedEmail = localStorage.getItem('userEmail');
    const savedRole = localStorage.getItem('userRole');
    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
        if (savedRole) {
            selectRole(savedRole);
        }
    }

    // Verify password toggle button exists
    const toggleBtn = document.querySelector('.toggle-password');
    if (toggleBtn) {
        console.log('✅ Password toggle button found');
    } else {
        console.warn('⚠️ Password toggle button not found');
    }
});