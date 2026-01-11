let readingProgress = [];
let userStats = {};
let allBooks = [];

// Load student data
async function loadStudentData() {
    console.log('📚 Loading student data...');

    // Load all books first (most important)
    await loadBooks();

    // Then load user-specific data
    try {
        // Load reading progress
        const progressResponse = await apiCall('/students/reading_progress.php', 'GET');
        console.log('📥 Progress API response:', progressResponse);

        if (progressResponse && Array.isArray(progressResponse)) {
            readingProgress = progressResponse;
            console.log('✅ Reading progress loaded:', readingProgress.length, 'items');
        } else {
            console.warn('⚠️ Progress response is not an array:', progressResponse);
            readingProgress = [];
        }

        renderReadingProgress();
    } catch (error) {
        console.error('❌ Error loading reading progress:', error);
        console.log('Error details:', error.message);
        readingProgress = [];
        renderReadingProgress();
    }

    try {
        // Load stats
        const statsResponse = await apiCall('/students/stats.php', 'GET');
        userStats = statsResponse || {};
        console.log('✅ Stats loaded:', userStats);
        renderStats();
    } catch (error) {
        console.warn('⚠️ No stats found (this is OK for new users)');
        userStats = {};
        renderStats();
    }
}

// Load all books
async function loadBooks() {
    console.log('📖 Loading all books...');
    try {
        const response = await apiCall('/books/read.php', 'GET');
        console.log('📥 Raw API response:', response);

        if (!response) {
            console.error('❌ No response from API');
            allBooks = [];
            renderRecommendedBooks();
            return;
        }

        if (!Array.isArray(response)) {
            console.error('❌ Response is not an array:', response);
            allBooks = [];
            renderRecommendedBooks();
            return;
        }

        // Filter only active books
        allBooks = response.filter(book => book.status === 'active');
        console.log('✅ Books loaded:', allBooks.length, 'active books out of', response.length, 'total');

        renderRecommendedBooks();
    } catch (error) {
        console.error('❌ Error loading books:', error);
        allBooks = [];
        renderRecommendedBooks();
    }
}

// Render reading stats
function renderStats() {
    console.log('📊 Rendering stats...');
    const statsCards = document.querySelectorAll('.stat-card');

    if (statsCards.length >= 4) {
        // Books Read
        const booksRead = userStats.books_read || 0;
        statsCards[0].querySelector('h3').textContent = booksRead;

        // Reading Time
        const totalMinutes = userStats.total_reading_time || 0;
        const hours = Math.round(totalMinutes / 60);
        statsCards[1].querySelector('h3').textContent = hours + 'h';

        // Streak
        const streak = userStats.current_streak || 0;
        statsCards[2].querySelector('h3').textContent = streak;

        // Badges
        const badges = userStats.badges_earned || 0;
        statsCards[3].querySelector('h3').textContent = badges;

        console.log('✅ Stats rendered:', { booksRead, hours, streak, badges });
    }

    // Update streak counter
    const streakNumber = document.querySelector('.streak-number');
    if (streakNumber) {
        streakNumber.textContent = userStats.current_streak || 0;
    }
}

// Render reading progress
function renderReadingProgress() {
    console.log('📖 Rendering reading progress...');

    // Find all cards and locate the "Continue Reading" one
    const allCards = document.querySelectorAll('.card');
    let targetCard = null;

    allCards.forEach(card => {
        const header = card.querySelector('.card-header h3');
        if (header && header.textContent.trim() === 'Continue Reading') {
            targetCard = card;
        }
    });

    if (!targetCard) {
        console.warn('⚠️ Continue Reading card not found');
        return;
    }

    // Keep the header
    const header = targetCard.querySelector('.card-header');

    // Clear existing content except header
    targetCard.innerHTML = '';
    targetCard.appendChild(header);

    if (readingProgress.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.padding = '2rem';
        emptyMessage.style.color = '#666';
        emptyMessage.textContent = 'No books in progress. Start reading to track your progress!';
        targetCard.appendChild(emptyMessage);
        console.log('ℹ️ No reading progress to show');
        return;
    }

    const bookIcons = ['📘', '📗', '📙', '📕', '📔'];

    readingProgress.slice(0, 3).forEach((item, index) => {
        const progressPercent = item.progress_percentage || 0;

        const progressDiv = document.createElement('div');
        progressDiv.className = 'reading-item';
        progressDiv.style.cursor = 'pointer';
        progressDiv.style.transition = 'all 0.3s';

        progressDiv.innerHTML = `
            <div class="book-cover">${bookIcons[index % bookIcons.length]}</div>
            <div class="reading-info">
                <h4>${item.title || 'Unknown Title'}</h4>
                <p>by ${item.author || 'Unknown Author'}</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <div class="progress-text">Chapter ${item.current_chapter || 1} of ${item.total_chapters || 12} • ${progressPercent}% Complete</div>
            </div>
        `;

        // Add hover effect
        progressDiv.addEventListener('mouseenter', function () {
            this.style.backgroundColor = '#f8f9ff';
            this.style.transform = 'translateX(5px)';
        });

        progressDiv.addEventListener('mouseleave', function () {
            this.style.backgroundColor = 'transparent';
            this.style.transform = 'translateX(0)';
        });

        // Add click event to continue reading
        progressDiv.addEventListener('click', () => {
            console.log('📖 Continuing book:', item.title, '(ID:', item.book_id, ')');
            window.location.href = `ReadingPage.html?id=${item.book_id}`;
        });

        targetCard.appendChild(progressDiv);
    });

    console.log('✅ Rendered', Math.min(readingProgress.length, 3), 'reading progress items (clickable)');
}

// Render recommended books
function renderRecommendedBooks() {
    console.log('📚 Rendering recommended books...');
    const booksGrid = document.querySelector('.books-grid');

    if (!booksGrid) {
        console.error('❌ Books grid element not found!');
        return;
    }

    // Clear loading message
    booksGrid.innerHTML = '';

    if (!allBooks || allBooks.length === 0) {
        booksGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📚</div>
                <p style="color: #666; font-size: 1.1rem;">No books available yet.</p>
                <p style="color: #999; margin-top: 0.5rem;">Check back soon or contact your administrator!</p>
            </div>
        `;
        console.log('ℹ️ No books to display');
        return;
    }

    const bookIcons = ['📕', '📘', '📗', '📙', '📔', '📖', '📓', '📒'];

    // Show up to 8 books
    const booksToShow = allBooks.slice(0, 8);

    booksToShow.forEach((book, index) => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        bookCard.style.cursor = 'pointer';
        bookCard.innerHTML = `
            <div class="book-cover">${bookIcons[index % bookIcons.length]}</div>
            <h4 title="${book.title}">${book.title}</h4>
            <p title="${book.author}">${book.author}</p>
        `;

        // Add click event to open reading page
        bookCard.addEventListener('click', () => {
            openBook(book);
        });

        booksGrid.appendChild(bookCard);
    });

    console.log('✅ Rendered', booksToShow.length, 'recommended books');
}

// Open book for reading
function openBook(book) {
    console.log('📖 Opening book:', book.title);
    // Redirect to reading page with book ID
    window.location.href = `ReadingPage.html?id=${book.id}`;
}

// Logout function
async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            await apiCall('/auth/logout.php', 'GET');
            window.location.href = 'Login_page.html';
        } catch (error) {
            window.location.href = 'Login_page.html';
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Student dashboard DOM loaded');
    console.log('🔍 Checking for books grid element...');

    const booksGrid = document.querySelector('.books-grid');
    if (booksGrid) {
        console.log('✅ Books grid found!');
    } else {
        console.error('❌ Books grid NOT found! Check HTML structure.');
    }

    // Load all data
    loadStudentData();

    // Add active state to nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    console.log('✅ Student dashboard initialized');
});