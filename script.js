/* =========================================
   NOVELORA ADMIN — MONEY ENGINE
========================================= */

const MONEY_STORAGE = {
  transactions: "noveloraTransactions",
  unlocks: "noveloraChapterUnlocks",
  books: "noveloraAdminBooks",
  finance: "noveloraFinance"
};


/* =========================
   DATA HELPERS
========================= */

function moneyGetData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function moneySaveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function formatMoney(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}


/* =========================
   TRANSACTIONS
========================= */

function getMoneyTransactions() {
  const data = moneyGetData(MONEY_STORAGE.transactions);

  return Array.isArray(data) ? data : [];
}


/*
   Supports common transaction formats such as:

   {
     amount: 5,
     date: "...",
     type: "purchase"
   }

   or

   {
     amount: 5,
     createdAt: "...",
     bookTitle: "..."
   }
*/

function getTransactionAmount(transaction) {

  const possibleAmounts = [
    transaction.amount,
    transaction.revenue,
    transaction.total,
    transaction.price
  ];

  for (const value of possibleAmounts) {

    const number = Number(value);

    if (Number.isFinite(number)) {
      return number;
    }

  }

  return 0;
}


function getTransactionDate(transaction) {

  return (
    transaction.date ||
    transaction.createdAt ||
    transaction.timestamp ||
    transaction.created ||
    null
  );

}


/* =========================
   EARNINGS CALCULATION
========================= */

function calculateMoney() {

  const transactions = getMoneyTransactions();

  let total = 0;
  let monthly = 0;
  let pending = 0;
  let available = 0;

  const now = new Date();

  transactions.forEach(transaction => {

    const amount =
      getTransactionAmount(transaction);

    if (amount <= 0) return;

    total += amount;

    const dateString =
      getTransactionDate(transaction);

    if (dateString) {

      const date = new Date(dateString);

      if (
        !Number.isNaN(date.getTime()) &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      ) {
        monthly += amount;
      }

    }


    const status =
      String(transaction.status || "completed")
        .toLowerCase();


    if (
      status === "pending" ||
      status === "processing"
    ) {

      pending += amount;

    } else if (
      status !== "refunded" &&
      status !== "failed" &&
      status !== "cancelled"
    ) {

      available += amount;

    }

  });


  /*
     Existing withdrawal requests are deducted
     from the available balance.
  */

  const finance =
    moneyGetData(MONEY_STORAGE.finance) || {};

  const withdrawals =
    Array.isArray(finance.withdrawals)
      ? finance.withdrawals
      : [];


  withdrawals.forEach(withdrawal => {

    const amount =
      Number(withdrawal.amount || 0);

    const status =
      String(withdrawal.status || "")
        .toLowerCase();

    if (
      status === "pending" ||
      status === "processing" ||
      status === "completed"
    ) {

      available -= amount;

    }

  });


  available = Math.max(0, available);


  return {
    total,
    monthly,
    available,
    pending
  };

}


/* =========================
   UPDATE MONEY CARDS
========================= */

function updateMoneyDashboard() {

  const earnings =
    calculateMoney();


  const totalEl =
    document.querySelector("#totalEarnings");

  const monthlyEl =
    document.querySelector("#monthlyEarnings");

  const availableEl =
    document.querySelector("#availableBalance");

  const pendingEl =
    document.querySelector("#pendingBalance");

  const withdrawEl =
    document.querySelector("#withdrawBalance");

  const chartEl =
    document.querySelector("#chartTotal");


  if (totalEl) {
    totalEl.textContent =
      formatMoney(earnings.total);
  }

  if (monthlyEl) {
    monthlyEl.textContent =
      formatMoney(earnings.monthly);
  }

  if (availableEl) {
    availableEl.textContent =
      formatMoney(earnings.available);
  }

  if (pendingEl) {
    pendingEl.textContent =
      formatMoney(earnings.pending);
  }

  if (withdrawEl) {
    withdrawEl.textContent =
      formatMoney(earnings.available);
  }

  if (chartEl) {
    chartEl.textContent =
      formatMoney(earnings.monthly);
  }

}


/* =========================
   EARNINGS BY BOOK
========================= */

function renderBookEarnings() {

  const container =
    document.querySelector("#bookEarnings");

  if (!container) return;


  const transactions =
    getMoneyTransactions();


  const books =
    moneyGetData(MONEY_STORAGE.books);


  const bookTotals = {};


  transactions.forEach(transaction => {

    const amount =
      getTransactionAmount(transaction);

    if (amount <= 0) return;


    const bookId =
      transaction.bookId ||
      transaction.bookID ||
      null;


    const bookTitle =
      transaction.bookTitle ||
      transaction.title ||
      transaction.book ||
      null;


    const book =
      books.find(item =>
        bookId &&
        String(item.id) === String(bookId)
      );


    const title =
      book?.title ||
      bookTitle ||
      "Unknown Book";


    const author =
      book?.author ||
      transaction.author ||
      "Novelora Author";


    const key =
      bookId
        ? `id-${bookId}`
        : `title-${title}`;


    if (!bookTotals[key]) {

      bookTotals[key] = {
        title,
        author,
        earnings: 0
      };

    }


    bookTotals[key].earnings += amount;

  });


  const results =
    Object.values(bookTotals)
      .sort((a, b) =>
        b.earnings - a.earnings
      );


  if (!results.length) {

    container.innerHTML = `
      <div class="money-empty">

        <div>♡</div>

        <strong>No book earnings yet</strong>

        <span>
          Book revenue will appear here after readers unlock chapters.
        </span>

      </div>
    `;

    return;

  }


  container.innerHTML =
    results.map(book => `

      <div class="book-earning-row">

        <div>

          <div class="book-earning-title">
            ${escapeMoneyHTML(book.title)}
          </div>

          <div class="book-earning-author">
            ${escapeMoneyHTML(book.author)}
          </div>

        </div>

        <div class="book-earning-value">
          ${formatMoney(book.earnings)}
        </div>

      </div>

    `).join("");

}


/* =========================
   WITHDRAWAL HISTORY
========================= */

function renderWithdrawals() {

  const container =
    document.querySelector("#withdrawalHistory");

  if (!container) return;


  const finance =
    moneyGetData(MONEY_STORAGE.finance) || {};

  const withdrawals =
    Array.isArray(finance.withdrawals)
      ? finance.withdrawals
      : [];


  if (!withdrawals.length) {

    container.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="table-empty">
            No withdrawals yet.
          </div>
        </td>
      </tr>
    `;

    return;

  }


  container.innerHTML =
    withdrawals.map(withdrawal => {

      const date =
        new Date(withdrawal.date);


      const formattedDate =
        Number.isNaN(date.getTime())
          ? "—"
          : date.toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric"
              }
            );


      return `
        <tr>

          <td>${formattedDate}</td>

          <td>
            <strong>
              ${formatMoney(withdrawal.amount)}
            </strong>
          </td>

          <td>
            ${escapeMoneyHTML(withdrawal.method || "—")}
          </td>

          <td>
            ${escapeMoneyHTML(withdrawal.bank || "—")}
          </td>

          <td>
            <span class="status-pill">
              ${escapeMoneyHTML(withdrawal.status || "Pending")}
            </span>
          </td>

        </tr>
      `;

    }).join("");

}


/* =========================
   BANK METHOD
========================= */

function setupBankMethod() {

  const inputs =
    document.querySelectorAll(
      'input[name="withdrawMethod"]'
    );

  const swiftField =
    document.querySelector("#swiftField");

  const achField =
    document.querySelector("#achField");


  function update() {

    const selected =
      document.querySelector(
        'input[name="withdrawMethod"]:checked'
      );


    if (!selected) return;


    if (selected.value === "SWIFT") {

      swiftField?.classList.remove(
        "hidden-field"
      );

      achField?.classList.add(
        "hidden-field"
      );

    } else {

      swiftField?.classList.add(
        "hidden-field"
      );

      achField?.classList.remove(
        "hidden-field"
      );

    }

  }


  inputs.forEach(input => {

    input.addEventListener(
      "change",
      update
    );

  });


  update();

}


/* =========================
   SAVE PAYOUT ACCOUNT
========================= */

function setupBankForm() {

  const form =
    document.querySelector("#bankForm");

  if (!form) return;


  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const accountName =
        document.querySelector("#accountName")
          ?.value.trim();

      const bankName =
        document.querySelector("#bankName")
          ?.value.trim();

      const accountNumber =
        document.querySelector("#accountNumber")
          ?.value.trim();

      const swiftCode =
        document.querySelector("#swiftCode")
          ?.value.trim();

      const routingNumber =
        document.querySelector("#routingNumber")
          ?.value.trim();

      const bankCountry =
        document.querySelector("#bankCountry")
          ?.value.trim();


      const method =
        document.querySelector(
          'input[name="withdrawMethod"]:checked'
        )?.value || "SWIFT";


      const message =
        document.querySelector("#bankMessage");


      if (
        !accountName ||
        !bankName ||
        !accountNumber ||
        !bankCountry
      ) {

        if (message) {

          message.textContent =
            "Please complete all required bank details.";

          message.style.color =
            "#ff6b9f";

        }

        return;

      }


      if (method === "SWIFT" && !swiftCode) {

        if (message) {

          message.textContent =
            "Please enter your SWIFT / BIC code.";

          message.style.color =
            "#ff6b9f";

        }

        return;

      }


      if (
        method === "ACH" &&
        !routingNumber
      ) {

        if (message) {

          message.textContent =
            "Please enter your routing number.";

          message.style.color =
            "#ff6b9f";

        }

        return;

      }


      const finance =
        moneyGetData(
          MONEY_STORAGE.finance
        ) || {};


      finance.bank = {
        accountName,
        bankName,
        accountNumber,
        swiftCode,
        routingNumber,
        bankCountry,
        method
      };


      moneySaveData(
        MONEY_STORAGE.finance,
        finance
      );


      if (message) {

        message.textContent =
          "Payout account saved successfully.";

        message.style.color =
          "#65d89a";

      }

    }
  );

}


/* =========================
   WITHDRAW MONEY
========================= */

function setupWithdrawal() {

  const form =
    document.querySelector("#withdrawForm");

  if (!form) return;


  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const amount =
        Number(
          document.querySelector("#withdrawAmount")
            ?.value
        );


      const method =
        document.querySelector(
          'input[name="withdrawMethod"]:checked'
        )?.value || "SWIFT";


      const message =
        document.querySelector(
          "#withdrawMessage"
        );


      const finance =
        moneyGetData(
          MONEY_STORAGE.finance
        ) || {};


      const earnings =
        calculateMoney();


      if (!finance.bank) {

        showWithdrawalMessage(
          message,
          "Please save a payout account before withdrawing.",
          false
        );

        return;

      }


      if (!amount || amount < 10) {

        showWithdrawalMessage(
          message,
          "The minimum withdrawal is $10.00.",
          false
        );

        return;

      }


      if (amount > earnings.available) {

        showWithdrawalMessage(
          message,
          "You do not have enough available earnings.",
          false
        );

        return;

      }


      if (!Array.isArray(finance.withdrawals)) {
        finance.withdrawals = [];
      }


      finance.withdrawals.unshift({

        id:
          "WD-" +
          Date.now(),

        date:
          new Date().toISOString(),

        amount,

        method,

        bank:
          finance.bank.bankName,

        status:
          "Pending"

      });


      moneySaveData(
        MONEY_STORAGE.finance,
        finance
      );


      updateMoneyDashboard();

      renderWithdrawals();


      document.querySelector(
        "#withdrawAmount"
      ).value = "";


      showWithdrawalMessage(
        message,
        `${formatMoney(amount)} withdrawal request submitted successfully.`,
        true
      );

    }
  );

}


/* =========================
   MESSAGE
========================= */

function showWithdrawalMessage(
  element,
  message,
  success
) {

  if (!element) return;

  element.textContent = message;

  element.style.color =
    success
      ? "#65d89a"
      : "#ff6b9f";

}


/* =========================
   ESCAPE HTML
========================= */

function escapeMoneyHTML(value) {

  const div =
    document.createElement("div");

  div.textContent =
    value ?? "";

  return div.innerHTML;

}


/* =========================
   INITIALIZE
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    updateMoneyDashboard();

    renderBookEarnings();

    renderWithdrawals();

    setupBankMethod();

    setupBankForm();

    setupWithdrawal();

  }
);
