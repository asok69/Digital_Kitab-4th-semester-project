// All books loaded from DB
let allBooks = [];
let currentModalBook = null;
let searchTimeout = null;

const bookIcons = ['📘', '📗', '📙', '📕', '📔', '📖', '📓', '📒'];
const colorClasses = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5', 'color-6', 'color-7', 'color-8'];

// ── On Page Load ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    loadAllBooks();

    // Close modal when clicking outside
    document.getElementById('bookModal').addEventListener('click', function (e) {
        if (e.target === this) closeModal();
    });

    // Close modal on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeModal();
    });
});

// ── Load All Books from DB ──────────────────────────────────────
async function loadAllBooks() {
    showLoading(true);

    try {
        const response = await apiCall('/books/read.php', 'GET');

        if (!response || !Array.isArray(response)) {
            allBooks = [];
        } else {
            // Only show active books to students
            allBooks = response.filter(book => book.status === 'active');
        }

        renderBooks(allBooks);
    } catch (error) {
        console.error('❌ Error loading books:', error);
        allBooks = [];
        renderBooks([]);
    } finally {
        showLoading(false);
    }
}

// ── Handle Search Input (debounced — no page reload) ───────────
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearBtn');

    // Show/hide clear button
    clearBtn.style.display = searchInput.value.length > 0 ? 'flex' : 'none';

    // Debounce: wait 300ms after user stops typing
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        applyFilters();
    }, 300);
}

// ── Apply Search + Category Filter ─────────────────────────────
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const category = document.getElementById('categoryFilter').value;

    const filtered = allBooks.filter(book => {
        const matchesSearch = !searchTerm ||
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            (book.isbn && book.isbn.toLowerCase().includes(searchTerm));

        const matchesCategory = !category || book.category === category;

        return matchesSearch && matchesCategory;
    });

    renderBooks(filtered);
}

// ── Render Books Grid ───────────────────────────────────────────
function renderBooks(books) {
    const grid = document.getElementById('booksGrid');
    const emptyState = document.getElementById('emptyState');
    const resultsCount = document.getElementById('resultsCount');

    // Update count
    resultsCount.textContent = `${books.length} book${books.length !== 1 ? 's' : ''}`;

    // Empty state
    if (books.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    grid.innerHTML = '';

    books.forEach((book, index) => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.style.animationDelay = `${(index % 12) * 0.05}s`;

        const icon = bookIcons[index % bookIcons.length];
        const colorClass = colorClasses[index % colorClasses.length];

        card.innerHTML = `
            <div class="book-cover-area ${colorClass}">${icon}</div>
            <div class="book-card-body">
                <span class="book-card-category">${book.category}</span>
                <h4 title="${book.title}">${book.title}</h4>
                <p class="author" title="${book.author}">${book.author}</p>
            </div>
        `;

        card.addEventListener('click', () => openModal(book, icon, colorClass));
        grid.appendChild(card);
    });
}

// ── Clear Search ────────────────────────────────────────────────
function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('clearBtn').style.display = 'none';
    renderBooks(allBooks);
}

// ── Open Book Detail Modal ──────────────────────────────────────
function openModal(book, icon, colorClass) {
    currentModalBook = book;

    // Set modal cover color + icon
    const cover = document.getElementById('modalCover');
    cover.textContent = icon;
    cover.className = `modal-book-cover ${colorClass}`;

    document.getElementById('modalCategory').textContent = book.category;
    document.getElementById('modalTitle').textContent = book.title;
    document.getElementById('modalAuthor').textContent = `by ${book.author}`;
    document.getElementById('modalISBN').textContent = `ISBN: ${book.isbn || 'N/A'}`;
    document.getElementById('modalDesc').textContent = book.description || 'No description available for this book.';

    document.getElementById('bookModal').classList.add('show');
}

// ── Close Modal ─────────────────────────────────────────────────
function closeModal() {
    document.getElementById('bookModal').classList.remove('show');
    currentModalBook = null;
}

// ── Read Book (navigate to reading page) ────────────────────────
function readBook() {
    if (currentModalBook) {
        window.location.href = `ReadingPage.html?id=${currentModalBook.id}`;
    }
}

// ── Toggle Loading Spinner ──────────────────────────────────────
function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none';
    document.getElementById('booksGrid').style.display = show ? 'none' : 'grid';
}

// ── Logout ──────────────────────────────────────────────────────
async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            await apiCall('/auth/logout.php', 'GET');
        } catch (_) { }
        window.location.href = 'Login_page.html';
    }
}