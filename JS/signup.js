let currentSignupRole = 'student';

// Select role for signup
function selectSignupRole(role) {
    currentSignupRole = role;
    const studentBtn = document.getElementById('studentSignupBtn');
    const adminBtn = document.getElementById('adminSignupBtn');

    if (role === 'student') {
        studentBtn.classList.add('active');
        adminBtn.classList.remove('active');
    } else {
        adminBtn.classList.add('active');
        studentBtn.classList.remove('active');
    }

    // Clear messages
    document.getElementById('errorMessage').classList.remove('show');
    document.getElementById('successMessage').classList.remove('show');
}

// Handle signup form submission
async function handleSignup(event) {
    event.preventDefault();

    console.log('🚀 Signup form submitted!');

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;

    console.log('📝 Form data:', {
        fullName,
        email,
        password: password ? '***' : 'empty',
        confirmPassword: confirmPassword ? '***' : 'empty',
        agreeTerms,
        role: currentSignupRole
    });

    // Hide previous messages
    document.getElementById('errorMessage').classList.remove('show');
    document.getElementById('successMessage').classList.remove('show');

    // Validation
    if (!agreeTerms) {
        showError('Please agree to the Terms & Conditions');
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match!');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }

    if (fullName.length < 3) {
        showError('Full name must be at least 3 characters long');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        return;
    }

    // Show loading state
    const signupBtn = document.querySelector('.signup-btn');
    const originalText = signupBtn.textContent;
    signupBtn.textContent = 'Creating Account...';
    signupBtn.disabled = true;

    const requestData = {
        name: fullName,
        email: email,
        password: password,
        role: currentSignupRole
    };

    console.log('📤 Sending to API:', {
        name: requestData.name,
        email: requestData.email,
        password: '***',
        role: requestData.role
    });

    try {
        const response = await apiCall('/auth/register.php', 'POST', requestData);

        console.log('✅ API Response:', response);

        if (response.success) {
            showSuccess('Account created successfully! Redirecting to login...');

            // Clear form
            document.getElementById('signupForm').reset();

            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = 'Login_page.html';
            }, 2000);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('❌ Signup error:', error);
        showError(error.message || 'Unable to create account. Please try again.');

        signupBtn.textContent = originalText;
        signupBtn.disabled = false;
    }
}

// Show error message
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.classList.add('show');

    // Scroll to top to show error
    document.querySelector('.signup-right').scrollTop = 0;
}

// Show success message
function showSuccess(message) {
    const successMessage = document.getElementById('successMessage');
    successMessage.textContent = message;
    successMessage.classList.add('show');

    // Scroll to top to show success
    document.querySelector('.signup-right').scrollTop = 0;
}

// Clear error/success messages when user starts typing
document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ signup.js loaded successfully!');

    const inputs = document.querySelectorAll('input');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    inputs.forEach(input => {
        input.addEventListener('input', () => {
            errorMessage.classList.remove('show');
            successMessage.classList.remove('show');
        });
    });

    // Real-time password match validation
    const password = document.getElementById('signupPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    confirmPassword.addEventListener('input', () => {
        if (confirmPassword.value && password.value !== confirmPassword.value) {
            confirmPassword.style.borderColor = '#e74c3c';
        } else {
            confirmPassword.style.borderColor = '#e0e0e0';
        }
    });

    password.addEventListener('input', () => {
        if (confirmPassword.value && password.value !== confirmPassword.value) {
            confirmPassword.style.borderColor = '#e74c3c';
        } else {
            confirmPassword.style.borderColor = '#e0e0e0';
        }
    });
});

// Toggle password visibility for signup page
function toggleSignupPassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(inputId + '-toggle-icon');

    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '👁️‍🗨️'; // Eye with line through it
    } else {
        input.type = 'password';
        icon.textContent = '👁️'; // Normal eye
    }
}