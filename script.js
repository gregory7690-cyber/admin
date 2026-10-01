/* =========================================
   NOVELORA ADMIN — DASHBOARD ENGINE
========================================= */

const STORAGE = {
  books: "noveloraAdminBooks",
  chapters: "noveloraAdminChapters",
  readers: "noveloraReaders",
  authors: "noveloraAuthors",
  activities: "noveloraAdminActivities",
  transactions: "noveloraTransactions",
  unlocks: "noveloraChapterUnlocks"
};

/* =========================
   DATA HELPERS
========================= */

function getData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getBooks() {
  return getData(STORAGE.books);
}

function getChapters() {
  return getData(STORAGE.chapters);
}

function getReaders() {
  return getData(STORAGE.readers);
}

function getAuthors() {
  return getData(STORAGE.authors);
}

function getTransactions() {
  return getData(STORAGE.transactions);
}

function getUnlocks() {
  return getData(STORAGE.unlocks);
}

/* =========================
   ACTIVITY
========================= */

function addActivity(message, type = "system") {
  const activities = getData(STORAGE.activities);

  activities.unshift({
    id: Date.now(),
    message,
    type,
    date: new Date().toISOString()
  });

  saveData(
    STORAGE.activities,
    activities.slice(0, 50)
  );
}

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();

  const seconds = Math.floor(
    (now - date) / 1000
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString();
}

/* =========================
   DASHBOARD TOTALS
========================= */

function calculateStats() {
  const books = getBooks();
  const chapters = getChapters();
  const readers = getReaders();
  const unlocks = getUnlocks();
  const transactions = getTransactions();

  const coinsSpent = unlocks.reduce(
    (total, unlock) =>
      total + Number(unlock.coins || 0),
    0
  );

  const revenue = transactions.reduce(
    (total, transaction) =>
      total + Number(transaction.amount || 0),
    0
  );

  return {
    books: books.length,
    chapters: chapters.length,
    readers: readers.length,
    coinsSpent,
    revenue
  };
}

/* =========================
   UPDATE STAT CARDS
========================= */

function updateStats() {
  const stats = calculateStats();

  const booksEl =
    document.querySelector("#totalBooks");

  const readersEl =
    document.querySelector("#totalReaders");

  const chaptersEl =
    document.querySelector("#totalChapters");

  const coinsEl =
    document.querySelector("#totalCoinsSpent");

  const revenueEl =
    document.querySelector("#totalRevenue");

  if (booksEl) {
    booksEl.textContent = stats.books;
  }

  if (readersEl) {
    readersEl.textContent = stats.readers;
  }

  if (chaptersEl) {
    chaptersEl.textContent = stats.chapters;
  }

  if (coinsEl) {
    coinsEl.textContent =
      stats.coinsSpent.toLocaleString();
  }

  if (revenueEl) {
    revenueEl.textContent =
      `$${stats.revenue.toFixed(2)}`;
  }

  updateSnapshot();
}

/* =========================
   PLATFORM SNAPSHOT
========================= */

function updateSnapshot() {
  const books = getBooks();
  const chapters = getChapters();
  const authors = getAuthors();

  const publishedBooks =
    books.filter(book => book.published).length;

  const publishedChapters =
    chapters.filter(chapter => chapter.published).length;

  const freeBooks =
    books.filter(book => book.freeBook).length;

  const featuredBooks =
    books.filter(book => book.featured).length;

  const activeAuthors =
    authors.filter(author =>
      author.status === "active" ||
      author.status === "approved"
    ).length;

  setText(
    "#publishedBooks",
    publishedBooks
  );

  setText(
    "#publishedChapters",
    publishedChapters
  );

  setText(
    "#freeBooks",
    freeBooks
  );

  setText(
    "#featuredBooks",
    featuredBooks
  );

  setText(
    "#activeAuthors",
    activeAuthors
  );
}

function setText(selector, value) {
  const element =
    document.querySelector(selector);

  if (element) {
    element.textContent = value;
  }
}

/* =========================
   RECENT BOOKS
========================= */

function renderRecentBooks() {
  const container =
    document.querySelector("#recentBooks");

  if (!container) return;

  const books = getBooks();

  if (!books.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <strong>No books yet</strong>
        <p>
          Add your first Novelora book and
          it will appear here.
        </p>
      </div>
    `;
    return;
  }

  const recentBooks =
    [...books].reverse().slice(0, 5);

  container.innerHTML = `
    <div class="book-list">
      ${recentBooks.map(book => `
        <div class="book-row">

          <div class="book-cover">
            ${
              book.cover
                ? `<img
                    src="${book.cover}"
                    alt=""
                    style="
                      width:100%;
                      height:100%;
                      object-fit:cover;
                      border-radius:7px;
                    "
                  >`
                : "📖"
            }
          </div>

          <div class="book-info">
            <strong>
              ${escapeHTML(book.title || "Untitled")}
            </strong>

            <span>
              ${escapeHTML(book.author || "Unknown author")}
            </span>
          </div>

          <span class="book-status">
            ${
              book.published
                ? "Published"
                : "Draft"
            }
          </span>

        </div>
      `).join("")}
    </div>
  `;
}

/* =========================
   RECENT ACTIVITY
========================= */

function renderRecentActivity() {
  const container =
    document.querySelector("#recentActivity");

  if (!container) return;

  const activities =
    getData(STORAGE.activities);

  if (!activities.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✨</div>
        <strong>No activity yet</strong>
        <p>
          Admin actions and reader activity
          will appear here.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="activity-list">

      ${activities.slice(0, 7).map(activity => `
        <div class="activity-item">

          <div class="activity-dot"></div>

          <div>
            <strong>
              ${escapeHTML(activity.message)}
            </strong>

            <p>
              ${timeAgo(activity.date)}
            </p>
          </div>

        </div>
      `).join("")}

    </div>
  `;
}

/* =========================
   REVENUE
========================= */

function updateRevenueOverview() {
  const transactions = getTransactions();

  const revenue =
    transactions.reduce(
      (total, transaction) =>
        total + Number(transaction.amount || 0),
      0
    );

  setText(
    "#revenueOverview",
    `$${revenue.toFixed(2)}`
  );
}

/* =========================
   COINS
========================= */

function updateCoinsDistributed() {
  const unlocks = getUnlocks();

  const coins =
    unlocks.reduce(
      (total, unlock) =>
        total + Number(unlock.coins || 0),
      0
    );

  setText(
    "#coinsDistributed",
    coins.toLocaleString()
  );
}

/* =========================
   MODERATION
========================= */

function updateModeration() {
  const reports =
    getData("noveloraAdminReports");

  const pending =
    reports.filter(report =>
      report.status === "pending"
    ).length;

  setText(
    "#moderationCount",
    pending
  );
}

/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(value) {
  const div = document.createElement("div");

  div.textContent = value ?? "";

  return div.innerHTML;
}

/* =========================
   MOBILE SIDEBAR
========================= */

function setupMobileMenu() {
  const button =
    document.querySelector(
      "#mobileMenuButton"
    );

  const sidebar =
    document.querySelector(".sidebar");

  if (!button || !sidebar) return;

  button.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  document
    .querySelectorAll(".nav-link")
    .forEach(link => {
      link.addEventListener("click", () => {
        sidebar.classList.remove("open");
      });
    });
}

/* =========================
   QUICK ACTIONS
========================= */

function setupQuickActions() {
  const addBook =
    document.querySelector("#addBookButton");

  const addChapter =
    document.querySelector("#addChapterButton");

  const notification =
    document.querySelector(
      "#notificationButton"
    );

  const promotion =
    document.querySelector(
      "#promotionButton"
    );

  if (addBook) {
    addBook.addEventListener("click", () => {
      window.location.href = "books.html";
    });
  }

  if (addChapter) {
    addChapter.addEventListener("click", () => {
      window.location.href = "chapters.html";
    });
  }

  if (notification) {
    notification.addEventListener("click", () => {
      window.location.href =
        "notifications.html";
    });
  }

  if (promotion) {
    promotion.addEventListener("click", () => {
      window.location.href =
        "promotions.html";
    });
  }
}

/* =========================
   DASHBOARD REFRESH
========================= */

function refreshDashboard() {
  updateStats();
  renderRecentBooks();
  renderRecentActivity();
  updateRevenueOverview();
  updateCoinsDistributed();
  updateModeration();
}

/* =========================
   INITIALIZE
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    setupMobileMenu();
    setupQuickActions();
    refreshDashboard();
  }
);

/*
   Allow other admin pages to refresh
   the dashboard after changing data.
*/

window.NoveloraAdmin = {
  refreshDashboard,
  addActivity,
  getBooks,
  getChapters,
  getReaders,
  getAuthors,
  getTransactions,
  getUnlocks,
  calculateStats
};
