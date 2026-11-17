const API_URL = "http://localhost:3000/api/books";
const NAME_URL = "http://localhost:3000/api/name";

const booksTable = document.getElementById("booksTable");
const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const categoryInput = document.getElementById("category");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const formTitle = document.getElementById("formTitle");
const apiResponse = document.getElementById("apiResponse");
const nameInput = document.getElementById("nameInput");

let editingId = null; // null = adding, string (MongoDB _id) = updating

// ===================================
// GET - Fetch all books
// ===================================
async function loadBooks() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Unable to load books");
    }

    const books = await response.json();

    displayBooks(books);
    updateStatistics(books);
  } catch (error) {
    booksTable.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">
          Unable to connect to server.
        </td>
      </tr>
    `;
    console.error(error);
  }
}

function displayBooks(books) {
  if (books.length === 0) {
    booksTable.innerHTML = `<tr><td colspan="4" class="empty-state">No books found.</td></tr>`;
    return;
  }

  booksTable.innerHTML = books
    .map(
      (book) => `
      <tr>
        <td class="title">${escapeHTML(book.title)}</td>
        <td>${escapeHTML(book.author)}</td>
        <td><span class="tag">${escapeHTML(book.category || "General")}</span></td>
        <td>
          <button class="row-btn edit" onclick="startEdit('${book._id}')">Edit</button>
          <button class="row-btn delete" onclick="deleteBook('${book._id}')">Delete</button>
        </td>
      </tr>`
    )
    .join("");
}

function updateStatistics(books) {
  const categories = new Set(books.map((b) => b.category || "General"));
  const authors = new Set(books.map((b) => b.author));

  document.getElementById("totalBooks").textContent = books.length;
  document.getElementById("totalCategories").textContent = categories.size;
  document.getElementById("totalAuthors").textContent = authors.size;
  document.getElementById("bookCount").textContent = `${books.length} Books`;
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ===================================
// POST (add) / PUT (update) - Save book
// ===================================
async function saveBook() {
  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  const category = categoryInput.value;

  if (!title || !author) {
    alert("Please enter book title and author name");
    return;
  }

  const isEditing = editingId !== null;
  const url = isEditing ? `${API_URL}/${editingId}` : API_URL;

  try {
    const response = await fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, author, category }),
    });

    const data = await response.json();
    alert(data.message);

    resetForm();
    loadBooks();
  } catch (error) {
    alert("Unable to connect to server.");
    console.error(error);
  }
}

// ===================================
// Edit - fill the form with the book data
// ===================================
async function startEdit(id) {
  const response = await fetch(API_URL);
  const books = await response.json();
  const book = books.find((b) => b._id === id);
  if (!book) return;

  editingId = id;
  titleInput.value = book.title;
  authorInput.value = book.author;
  categoryInput.value = book.category || "";

  formTitle.textContent = "Update Book";
  saveBtn.textContent = "Save Changes";
  cancelBtn.style.display = "inline-block";
  document.getElementById("add").scrollIntoView({ behavior: "smooth" });
}

function resetForm() {
  editingId = null;
  titleInput.value = "";
  authorInput.value = "";
  categoryInput.value = "";
  formTitle.textContent = "Add a New Book";
  saveBtn.textContent = "+ Add Book";
  cancelBtn.style.display = "none";
}

// ===================================
// DELETE - Delete book
// ===================================
async function deleteBook(id) {
  if (!confirm("Are you sure you want to delete this book?")) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    const data = await response.json();
    alert(data.message);
    loadBooks();
  } catch (error) {
    alert("Unable to connect to server.");
    console.error(error);
  }
}

// ===================================
// Name API demo (GET / POST / PUT / DELETE)
// ===================================
function showResponse(method, status, data) {
  apiResponse.textContent = `${method} /api/name  ->  ${status}\n` + JSON.stringify(data, null, 2);
}

async function nameRequest(method, withBody) {
  const options = { method };

  if (withBody) {
    const value = nameInput.value.trim();
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify({ name: value });
  }

  try {
    const response = await fetch(NAME_URL, options);
    const data = await response.json();
    showResponse(method, response.status, data);

    if (data.name) {
      document.getElementById("userName").textContent = data.name;
      document.getElementById("avatar").textContent = data.name.charAt(0).toUpperCase();
    }
  } catch (error) {
    apiResponse.textContent = "Unable to connect to server.";
  }
}

document.getElementById("getNameBtn").addEventListener("click", () => nameRequest("GET", false));
document.getElementById("postNameBtn").addEventListener("click", () => nameRequest("POST", true));
document.getElementById("putNameBtn").addEventListener("click", () => nameRequest("PUT", true));
document.getElementById("deleteNameBtn").addEventListener("click", () => nameRequest("DELETE", false));

saveBtn.addEventListener("click", saveBook);
cancelBtn.addEventListener("click", resetForm);

// Load books when the page opens
loadBooks();