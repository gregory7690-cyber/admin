document.addEventListener("DOMContentLoaded", function () {

  const books =
    JSON.parse(localStorage.getItem("noveloraAdminBooks")) || [];

  const chapters =
    JSON.parse(localStorage.getItem("noveloraAdminChapters")) || [];


  /* =========================
     DASHBOARD COUNTS
  ========================= */

  const totalBooks =
    document.getElementById("totalBooks");

  const overviewBooks =
    document.getElementById("overviewBooks");

  const totalChapters =
    document.getElementById("totalChapters");

  const overviewChapters =
    document.getElementById("overviewChapters");


  if (totalBooks) {
    totalBooks.textContent = books.length;
  }

  if (overviewBooks) {
    overviewBooks.textContent = books.length;
  }

  if (totalChapters) {
    totalChapters.textContent = chapters.length;
  }

  if (overviewChapters) {
    overviewChapters.textContent = chapters.length;
  }


  /* =========================
     PLACEHOLDER READER COUNT
  ========================= */

  const totalReaders =
    document.getElementById("totalReaders");

  if (totalReaders) {
    const readers =
      JSON.parse(localStorage.getItem("noveloraReaders")) || [];

    totalReaders.textContent = readers.length;
  }


  /* =========================
     PLACEHOLDER EARNINGS
  ========================= */

  const totalEarnings =
    document.getElementById("totalEarnings");

  if (totalEarnings) {

    const earnings =
      Number(
        localStorage.getItem("noveloraTotalEarnings")
      ) || 0;

    totalEarnings.textContent =
      "$" + earnings.toFixed(2);
  }

});
