let currentBook = null;
let currentChapter = 1;
let totalChapters = 12;
let fontSize = 16;
let bookmarks = [];
let startTime = Date.now();
let timerInterval = null;

// Sample book content (in a real app, this would come from a database)
const sampleChapters = {
    1: {
        title: "Chapter 1: The Beginning",
        content: `<p>In the heart of a bustling city, where skyscrapers touched the clouds and millions of souls crossed paths every day, there lived a young programmer named Alex. This is the story of how a simple digital library project would change everything.</p>
        <p>Alex had always been fascinated by the power of technology to transform lives. Growing up in a small town with limited access to books, they understood the struggle of students who yearned for knowledge but couldn't afford expensive textbooks or access to well-stocked libraries.</p>
        <p>One rainy evening, while working late at the office, an idea struck. What if there was a platform that made reading accessible to everyone? A digital library that not only provided books but tracked reading progress, motivated students, and made learning engaging?</p>
        <p>That night, DigitalKitab was born—not just as a project, but as a mission to democratize knowledge and make learning accessible to all.</p>`
    },
    2: {
        title: "Chapter 2: The Journey Begins",
        content: `<p>The next morning, Alex woke up with renewed energy and purpose. The vision was clear, but the path ahead was daunting. Creating a comprehensive digital library system would require careful planning, dedication, and countless hours of work.</p>
        <p>First came the research phase. Alex spent weeks studying existing library management systems, reading platforms, and educational technology. Each system had its strengths, but none quite captured the vision of making reading truly engaging and accessible.</p>
        <p>The design phase began with simple sketches on paper. What should the interface look like? How could it be intuitive enough for students of all ages? These questions drove the design process, leading to a clean, modern interface that prioritized user experience above all else.</p>
        <p>As the design took shape, Alex realized this was more than just a technical challenge—it was an opportunity to create something meaningful that could impact thousands of lives.</p>`
    },
    3: {
        title: "Chapter 3: Building the Foundation",
        content: `<p>With the design finalized, the real work began. Alex dove into coding, starting with the database architecture. Every table, every relationship, every field was carefully planned to ensure the system would be robust, scalable, and efficient.</p>
        <p>The authentication system came next—students and administrators needed secure access, but it had to be simple enough that anyone could use it. Hours were spent perfecting the login flow, adding role-based access, and ensuring data security.</p>
        <p>Then came the book management system. Administrators needed powerful tools to add, edit, and organize books. The CRUD operations were implemented with care, each feature tested thoroughly to ensure reliability.</p>
        <p>Day by day, line by line, DigitalKitab began to take form. What started as an idea was becoming a reality.</p>`
    }
};

// Get book ID from URL
function getBookIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Load book details
async function loadBook() {
    const bookId = getBookIdFromURL();

    if (!bookId) {
        alert('No book selected!');
        window.location.href = 'UserDashboard.html';
        return;
    }

    console.log('📖 Loading book ID:', bookId);

    try {
        const response = await apiCall(`/books/read.php?id=${bookId}`, 'GET');
        currentBook = response;
        console.log('✅ Book loaded:', currentBook);

        renderBookInfo();
        loadChaptersList();
        loadChapter(1);
        startReadingTimer();
        loadBookmarks();

        // Load saved progress after everything is ready
        setTimeout(() => {
            loadSavedProgress();
        }, 500);
    } catch (error) {
        console.error('❌ Error loading book:', error);
        alert('Error loading book. Redirecting to dashboard...');
        window.location.href = 'UserDashboard.html';
    }
}

// Render book information
function renderBookInfo() {
    document.getElementById('bookTitle').textContent = currentBook.title;
    document.getElementById('bookTitleNav').textContent = currentBook.title;
    document.getElementById('bookAuthor').textContent = `by ${currentBook.author}`;
    document.getElementById('bookMeta').textContent = `${currentBook.category} • ISBN: ${currentBook.isbn}`;
    document.title = `${currentBook.title} - DigitalKitab`;
}

// Load chapters list in sidebar
function loadChaptersList() {
    const chaptersList = document.getElementById('chaptersList');
    chaptersList.innerHTML = '';

    for (let i = 1; i <= totalChapters; i++) {
        const chapterItem = document.createElement('div');
        chapterItem.className = 'chapter-item';
        if (i === currentChapter) {
            chapterItem.classList.add('active');
        }
        if (i < currentChapter) {
            chapterItem.classList.add('completed');
        }
        chapterItem.textContent = `Chapter ${i}`;
        chapterItem.onclick = () => loadChapter(i);
        chaptersList.appendChild(chapterItem);
    }
}

// Load specific chapter
function loadChapter(chapterNum) {
    if (chapterNum < 1 || chapterNum > totalChapters) return;

    currentChapter = chapterNum;

    // Get chapter content (sample or from database)
    const chapter = sampleChapters[chapterNum] || {
        title: `Chapter ${chapterNum}`,
        content: `<p>This is sample content for Chapter ${chapterNum}. In a real application, this content would be loaded from your database.</p>
        <p>You can add the actual book content here, or create a system where books are stored as PDF/ePub files and rendered in this reading interface.</p>
        <p>The reading page includes features like:</p>
        <p>• Progress tracking</p>
        <p>• Bookmarking</p>
        <p>• Font size adjustment</p>
        <p>• Theme switching (Light/Dark/Sepia)</p>
        <p>• Reading timer</p>
        <p>Keep reading to explore all these features!</p>`
    };

    document.getElementById('chapterTitle').textContent = chapter.title;
    document.getElementById('chapterContent').innerHTML = chapter.content;
    document.getElementById('pageInfo').textContent = `Chapter ${currentChapter} of ${totalChapters}`;

    // Update progress
    const progress = Math.round((currentChapter / totalChapters) * 100);
    document.getElementById('headerProgress').style.width = progress + '%';
    document.getElementById('headerProgressText').textContent = `${progress}% Complete`;

    // Update navigation buttons
    document.getElementById('prevBtn').disabled = currentChapter === 1;
    document.getElementById('nextBtn').disabled = currentChapter === totalChapters;

    // Update chapters list
    loadChaptersList();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Save progress
    saveProgress();
}

// Navigation functions
function nextChapter() {
    if (currentChapter < totalChapters) {
        loadChapter(currentChapter + 1);
    }
}

function previousChapter() {
    if (currentChapter > 1) {
        loadChapter(currentChapter - 1);
    }
}

// Toggle sidebar
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
}

// Font size controls
function increaseFontSize() {
    if (fontSize < 24) {
        fontSize += 2;
        document.querySelector('.reading-content').style.fontSize = fontSize + 'px';
        document.getElementById('fontSizeDisplay').textContent = fontSize + 'px';
    }
}

function decreaseFontSize() {
    if (fontSize > 12) {
        fontSize -= 2;
        document.querySelector('.reading-content').style.fontSize = fontSize + 'px';
        document.getElementById('fontSizeDisplay').textContent = fontSize + 'px';
    }
}

// Theme controls
function toggleTheme() {
    const currentTheme = document.body.className || 'light-theme';
    if (currentTheme === 'light-theme') {
        setTheme('dark');
    } else if (currentTheme === 'dark-theme') {
        setTheme('sepia');
    } else {
        setTheme('light');
    }
}

function setTheme(theme) {
    document.body.className = theme + '-theme';
    localStorage.setItem('readingTheme', theme);

    // Update active theme button
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Bookmarks
function addBookmark() {
    const bookmark = {
        chapter: currentChapter,
        chapterTitle: `Chapter ${currentChapter}`,
        date: new Date().toLocaleString(),
        timestamp: Date.now()
    };

    bookmarks.push(bookmark);
    localStorage.setItem('bookmarks_' + currentBook.id, JSON.stringify(bookmarks));

    alert('🔖 Bookmark added!');
    loadBookmarks();
}

function loadBookmarks() {
    const saved = localStorage.getItem('bookmarks_' + currentBook.id);
    if (saved) {
        bookmarks = JSON.parse(saved);
    }
    renderBookmarks();
}

function renderBookmarks() {
    const bookmarksList = document.getElementById('bookmarksList');

    if (bookmarks.length === 0) {
        bookmarksList.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No bookmarks yet. Click the bookmark button while reading to save your place!</p>';
        return;
    }

    bookmarksList.innerHTML = '';
    bookmarks.reverse().forEach((bookmark, index) => {
        const item = document.createElement('div');
        item.className = 'bookmark-item';
        item.innerHTML = `
            <div class="bookmark-chapter">${bookmark.chapterTitle}</div>
            <div class="bookmark-date">${bookmark.date}</div>
        `;
        item.onclick = () => {
            loadChapter(bookmark.chapter);
            toggleBookmarks();
        };
        bookmarksList.appendChild(item);
    });
}

function toggleBookmarks() {
    document.getElementById('bookmarksModal').classList.toggle('show');
}

function toggleSettings() {
    document.getElementById('settingsModal').classList.toggle('show');
}

// Reading timer
function startReadingTimer() {
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('timerDisplay').textContent =
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

// Save reading progress
async function saveProgress() {
    const autoSave = document.getElementById('autoSaveProgress').checked;
    if (!autoSave || !currentBook) return;

    console.log('💾 Saving progress to database:', {
        bookId: currentBook.id,
        chapter: currentChapter,
        totalChapters: totalChapters,
        progress: Math.round((currentChapter / totalChapters) * 100)
    });

    try {
        const response = await apiCall('/students/save_progress.php', 'POST', {
            book_id: currentBook.id,
            current_chapter: currentChapter,
            total_chapters: totalChapters
        });

        console.log('✅ Progress saved to database:', response);

        // Also save to localStorage as backup
        localStorage.setItem('progress_' + currentBook.id, JSON.stringify({
            chapter: currentChapter,
            lastRead: new Date().toISOString()
        }));
    } catch (error) {
        console.error('❌ Error saving progress:', error);
        // Fallback to localStorage only
        localStorage.setItem('progress_' + currentBook.id, JSON.stringify({
            chapter: currentChapter,
            lastRead: new Date().toISOString()
        }));
    }
}

// Load saved progress
async function loadSavedProgress() {
    if (!currentBook) return;

    console.log('🔍 Looking for saved progress...');

    try {
        // Try to get progress from database
        const response = await apiCall('/students/reading_progress.php', 'GET');

        if (Array.isArray(response)) {
            const bookProgress = response.find(p => p.book_id == currentBook.id);

            if (bookProgress) {
                console.log('✅ Found saved progress:', bookProgress);
                const savedChapter = parseInt(bookProgress.current_chapter) || 1;

                if (savedChapter > 1 && confirm(`Continue from Chapter ${savedChapter}?`)) {
                    loadChapter(savedChapter);
                    return;
                }
            }
        }
    } catch (error) {
        console.warn('⚠️ Could not load progress from database:', error);
    }

    // Fallback to localStorage
    const saved = localStorage.getItem('progress_' + currentBook.id);
    if (saved) {
        const progress = JSON.parse(saved);
        if (progress.chapter > 1 && confirm(`Continue from Chapter ${progress.chapter}?`)) {
            loadChapter(progress.chapter);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Reading page loaded');

    // Load saved theme
    const savedTheme = localStorage.getItem('readingTheme') || 'light';
    document.body.className = savedTheme + '-theme';

    loadBook();

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') previousChapter();
        if (e.key === 'ArrowRight') nextChapter();
    });
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    clearInterval(timerInterval);
    saveProgress();

    // Save reading time
    const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
    if (elapsedMinutes > 0) {
        // Use sendBeacon for reliable sending during unload
        const data = JSON.stringify({ minutes: elapsedMinutes });
        const url = API_BASE_URL + '/students/update_reading_time.php';

        // Try using fetch with keepalive
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: data,
            keepalive: true
        }).catch(err => console.log('Could not save reading time'));
    }
});