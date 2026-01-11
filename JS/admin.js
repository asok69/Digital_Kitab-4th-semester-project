let books = [];
let activities = [];
let currentEditId = null;
const bookIcons = ['📘', '📗', '📙', '📕', '📔', '📖'];

// Load books from database
async function loadBooks() {
    console.log('📚 Loading books...');
    try {
        const response = await apiCall('/books/read.php', 'GET');
        console.log('✅ Books loaded:', response);
        books = response;
        renderBooks();
        updateStats();
    } catch (error) {
        console.error('❌ Error loading books:', error);
        showToast('Error loading books', 'error');
    }
}

// Render books in table
function renderBooks(booksToRender = books) {
    const tbody = document.getElementById('booksTable');

    if (!tbody) {
        console.error('❌ booksTable element not found!');
        return;
    }

    tbody.innerHTML = '';

    if (booksToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No books found. Add your first book!</td></tr>';
        return;
    }

    booksToRender.forEach((book, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="book-info">
                    <div class="book-thumbnail">${bookIcons[index % bookIcons.length]}</div>
                    <div class="book-details">
                        <h4>${book.title}</h4>
                        <p>${book.author}</p>
                    </div>
                </div>
            </td>
            <td>${book.category}</td>
            <td>${book.isbn}</td>
            <td><span class="status-badge status-${book.status}">${book.status.charAt(0).toUpperCase() + book.status.slice(1)}</span></td>
            <td>${book.borrowed_count || 0} times</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-view" onclick="viewBook(${book.id})" title="View">👁️</button>
                    <button class="btn-icon btn-edit" onclick="editBook(${book.id})" title="Edit">✏️</button>
                    <button class="btn-icon btn-delete" onclick="deleteBook(${book.id})" title="Delete">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update statistics
function updateStats() {
    const totalBooksElement = document.getElementById('totalBooks');
    if (totalBooksElement) {
        totalBooksElement.textContent = books.length;
    }
}

// Filter books
function filterBooks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    const filtered = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            book.isbn.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || book.category === categoryFilter;
        const matchesStatus = !statusFilter || book.status === statusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    renderBooks(filtered);
}

// Open modal for adding book
function openAddBookModal() {
    console.log('➕ Opening add book modal');
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Add New Book';
    document.getElementById('bookForm').reset();
    document.getElementById('bookModal').classList.add('show');
}

// Edit book
async function editBook(id) {
    console.log('✏️ Editing book:', id);
    try {
        const response = await apiCall(`/books/read.php?id=${id}`, 'GET');
        currentEditId = id;

        document.getElementById('modalTitle').textContent = 'Edit Book';
        document.getElementById('bookTitle').value = response.title;
        document.getElementById('bookAuthor').value = response.author;
        document.getElementById('bookISBN').value = response.isbn;
        document.getElementById('bookCategory').value = response.category;
        document.getElementById('bookDescription').value = response.description || '';
        document.getElementById('bookStatus').value = response.status;

        document.getElementById('bookModal').classList.add('show');
    } catch (error) {
        console.error('❌ Error loading book:', error);
        showToast('Error loading book details', 'error');
    }
}

// View book details
async function viewBook(id) {
    console.log('👁️ Viewing book:', id);
    try {
        const response = await apiCall(`/books/read.php?id=${id}`, 'GET');
        alert(
            `Title: ${response.title}\n` +
            `Author: ${response.author}\n` +
            `ISBN: ${response.isbn}\n` +
            `Category: ${response.category}\n` +
            `Status: ${response.status}\n` +
            `Borrowed: ${response.borrowed_count || 0} times\n` +
            `Description: ${response.description || 'N/A'}`
        );
    } catch (error) {
        console.error('❌ Error:', error);
        showToast('Error loading book details', 'error');
    }
}

// Delete book
async function deleteBook(id) {
    if (!confirm('Are you sure you want to delete this book?')) {
        return;
    }

    console.log('🗑️ Deleting book:', id);
    try {
        await apiCall('/books/delete.php', 'DELETE', { id: id });
        showToast('Book deleted successfully', 'success');
        await loadBooks();
    } catch (error) {
        console.error('❌ Error:', error);
        showToast('Error deleting book', 'error');
    }
}

// Handle form submission
async function handleSubmit(event) {
    event.preventDefault();

    const bookData = {
        title: document.getElementById('bookTitle').value.trim(),
        author: document.getElementById('bookAuthor').value.trim(),
        isbn: document.getElementById('bookISBN').value.trim(),
        category: document.getElementById('bookCategory').value,
        description: document.getElementById('bookDescription').value.trim(),
        status: document.getElementById('bookStatus').value
    };

    console.log('💾 Saving book:', bookData);

    try {
        if (currentEditId) {
            // Update existing book
            bookData.id = currentEditId;
            console.log('📝 Updating book ID:', currentEditId);
            await apiCall('/books/update.php', 'PUT', bookData);
            showToast('Book updated successfully', 'success');
        } else {
            // Create new book
            console.log('➕ Creating new book');
            await apiCall('/books/create.php', 'POST', bookData);
            showToast('Book added successfully', 'success');
        }

        closeModal();
        await loadBooks();
    } catch (error) {
        console.error('❌ Error:', error);
        showToast(error.message || 'Error saving book', 'error');
    }
}

// Close modal
function closeModal() {
    document.getElementById('bookModal').classList.remove('show');
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
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
    console.log('✅ Admin dashboard loaded');
    loadBooks();
});