document.addEventListener("DOMContentLoaded", () => {

  const STORAGE_KEY = "noveloraFinance";

  let finance = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    totalEarnings: 0,
    monthlyEarnings: 0,
    availableBalance: 0,
    pendingBalance: 0,
    bank: null,
    withdrawals: [],
    bookEarnings: []
  };

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finance));
  }

  function money(value) {
    return "$" + Number(value || 0).toFixed(2);
  }

  function updateDashboard() {

    const total = document.getElementById("totalEarnings");
    const monthly = document.getElementById("monthlyEarnings");
    const available = document.getElementById("availableBalance");
    const pending = document.getElementById("pendingBalance");
    const withdrawBalance = document.getElementById("withdrawBalance");
    const chartTotal = document.getElementById("chartTotal");

    if (total) total.textContent = money(finance.totalEarnings);
    if (monthly) monthly.textContent = money(finance.monthlyEarnings);
    if (available) available.textContent = money(finance.availableBalance);
    if (pending) pending.textContent = money(finance.pendingBalance);
    if (withdrawBalance) withdrawBalance.textContent = money(finance.availableBalance);
    if (chartTotal) chartTotal.textContent = money(finance.monthlyEarnings);

  }


  /* =========================
     BANK METHOD SWITCHING
  ========================= */

  const methodInputs = document.querySelectorAll(
    'input[name="withdrawMethod"]'
  );

  const swiftField = document.getElementById("swiftField");
  const achField = document.getElementById("achField");

  function updateBankFields() {

    const selected = document.querySelector(
      'input[name="withdrawMethod"]:checked'
    );

    if (!selected) return;

    if (selected.value === "SWIFT") {

      swiftField.classList.remove("hidden-field");
      achField.classList.add("hidden-field");

    } else {

      swiftField.classList.add("hidden-field");
      achField.classList.remove("hidden-field");

    }

  }

  methodInputs.forEach(input => {
    input.addEventListener("change", updateBankFields);
  });

  updateBankFields();


  /* =========================
     SAVE BANK ACCOUNT
  ========================= */

  const bankForm = document.getElementById("bankForm");
  const bankMessage = document.getElementById("bankMessage");

  if (bankForm) {

    bankForm.addEventListener("submit", event => {

      event.preventDefault();

      const accountName =
        document.getElementById("accountName").value.trim();

      const bankName =
        document.getElementById("bankName").value.trim();

      const accountNumber =
        document.getElementById("accountNumber").value.trim();

      const swiftCode =
        document.getElementById("swiftCode").value.trim();

      const routingNumber =
        document.getElementById("routingNumber").value.trim();

      const bankCountry =
        document.getElementById("bankCountry").value.trim();

      const selectedMethod =
        document.querySelector(
          'input[name="withdrawMethod"]:checked'
        )?.value || "SWIFT";


      if (!accountName || !bankName || !accountNumber || !bankCountry) {

        bankMessage.textContent =
          "Please complete all required bank details.";

        bankMessage.style.color = "#ff6b9f";

        return;
      }


      if (selectedMethod === "SWIFT" && !swiftCode) {

        bankMessage.textContent =
          "Please enter your SWIFT / BIC code.";

        bankMessage.style.color = "#ff6b9f";

        return;
      }


      if (selectedMethod === "ACH" && !routingNumber) {

        bankMessage.textContent =
          "Please enter your routing number.";

        bankMessage.style.color = "#ff6b9f";

        return;
      }


      finance.bank = {
        accountName,
        bankName,
        accountNumber,
        swiftCode,
        routingNumber,
        bankCountry,
        method: selectedMethod
      };

      save();


      bankMessage.textContent =
        "Payout account saved successfully.";

      bankMessage.style.color = "#65d89a";

    });

  }


  /* =========================
     WITHDRAW MONEY
  ========================= */

  const withdrawForm = document.getElementById("withdrawForm");
  const withdrawMessage = document.getElementById("withdrawMessage");

  if (withdrawForm) {

    withdrawForm.addEventListener("submit", event => {

      event.preventDefault();

      const amount =
        Number(document.getElementById("withdrawAmount").value);

      const method =
        document.querySelector(
          'input[name="withdrawMethod"]:checked'
        )?.value || "SWIFT";


      if (!finance.bank) {

        withdrawMessage.textContent =
          "Please save a payout account before withdrawing.";

        withdrawMessage.style.color = "#ff6b9f";

        return;
      }


      if (!amount || amount < 10) {

        withdrawMessage.textContent =
          "The minimum withdrawal is $10.00.";

        withdrawMessage.style.color = "#ff6b9f";

        return;
      }


      if (amount > finance.availableBalance) {

        withdrawMessage.textContent =
          "You do not have enough available earnings.";

        withdrawMessage.style.color = "#ff6b9f";

        return;
      }


      const withdrawal = {

        id: "WD-" + Date.now(),

        date: new Date().toISOString(),

        amount: amount,

        method: method,

        bank: finance.bank.bankName,

        status: "Pending"

      };


      finance.availableBalance -= amount;

      finance.withdrawals.unshift(withdrawal);

      save();

      updateDashboard();

      renderWithdrawals();


      withdrawForm.reset();

      updateBankFields();


      withdrawMessage.textContent =
        `${money(amount)} withdrawal request submitted successfully.`;

      withdrawMessage.style.color = "#65d89a";

    });

  }


  /* =========================
     WITHDRAWAL HISTORY
  ========================= */

  function renderWithdrawals() {

    const container =
      document.getElementById("withdrawalHistory");

    if (!container) return;


    if (!finance.withdrawals.length) {

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


    container.innerHTML = finance.withdrawals.map(item => {

      const date =
        new Date(item.date).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric"
          }
        );


      return `
        <tr>

          <td>${date}</td>

          <td>
            <strong>${money(item.amount)}</strong>
          </td>

          <td>${item.method}</td>

          <td>${item.bank}</td>

          <td>
            <span class="status-pill">
              ${item.status}
            </span>
          </td>

        </tr>
      `;

    }).join("");

  }


  /* =========================
     BOOK EARNINGS
  ========================= */

  function renderBookEarnings() {

    const container =
      document.getElementById("bookEarnings");

    if (!container) return;


    if (!finance.bookEarnings.length) {

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
      finance.bookEarnings.map(book => `

        <div class="book-earning-row">

          <div>

            <div class="book-earning-title">
              ${book.title}
            </div>

            <div class="book-earning-author">
              ${book.author || "Novelora Author"}
            </div>

          </div>

          <div class="book-earning-value">
            ${money(book.earnings)}
          </div>

        </div>

      `).join("");

  }


  /* =========================
     INITIAL LOAD
  ========================= */

  updateDashboard();

  renderWithdrawals();

  renderBookEarnings();

});
