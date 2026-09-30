document.addEventListener("DOMContentLoaded", function () {

  /* =========================
     GET ADMIN DATA
  ========================= */

  const books =
    JSON.parse(localStorage.getItem("noveloraAdminBooks")) || [];

  const chapters =
    JSON.parse(localStorage.getItem("noveloraAdminChapters")) || [];

  const readers =
    JSON.parse(localStorage.getItem("noveloraReaders")) || [];


  /* =========================
     BOOKS
  ========================= */

  document.getElementById("totalBooks").textContent =
    books.length;

  document.getElementById("overviewBooks").textContent =
    books.length;


  /* =========================
     CHAPTERS
  ========================= */

  document.getElementById("totalChapters").textContent =
    chapters.length;

  document.getElementById("overviewChapters").textContent =
    chapters.length;


  /* =========================
     READERS
  ========================= */

  document.getElementById("totalReaders").textContent =
    readers.length;

  document.getElementById("overviewReaders").textContent =
    readers.length;


  /* =========================
     EARNINGS
  ========================= */

  const earnings =
    Number(
      localStorage.getItem("noveloraTotalEarnings")
    ) || 0;

  const formattedEarnings =
    "$" + earnings.toFixed(2);

  document.getElementById("totalEarnings").textContent =
    formattedEarnings;

  document.getElementById("overviewRevenue").textContent =
    formattedEarnings;

});
