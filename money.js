document.addEventListener("DOMContentLoaded", async () => {

  /* =========================================================
     NOVELORA MONEY — SUPABASE
  ========================================================= */

  const SUPABASE_URL =
    "https://fydjmfdtvdtkyjmsdubd.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_VwkLSv5ixhNHtAUhNdDnqA_tJWSF9S8";


  /* =========================================================
     LOAD SUPABASE
  ========================================================= */

  if (!window.supabase) {

    const script = document.createElement("script");

    script.src =
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

    script.onload = () => initializeMoney();

    document.head.appendChild(script);

  } else {

    initializeMoney();

  }


  async function initializeMoney() {

    const supabaseClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );


    /* =========================================================
       HELPERS
    ========================================================= */

    function money(value) {

      return "$" +
        Number(value || 0).toLocaleString(
          "en-US",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }
        );

    }


    function escapeHTML(value) {

      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    }


    function isSuccessful(status) {

      const value =
        String(status || "").toLowerCase().trim();

      return [
        "successful",
        "success",
        "completed",
        "complete",
        "paid"
      ].includes(value);

    }


    function isPending(status) {

      const value =
        String(status || "").toLowerCase().trim();

      return [
        "pending",
        "processing",
        "awaiting"
      ].includes(value);

    }


    function setText(id, value) {

      const element =
        document.getElementById(id);

      if (element) {
        element.textContent = value;
      }

    }


    /* =========================================================
       FETCH ALL PURCHASES
    ========================================================= */

    async function getPurchases() {

      const { data, error } =
        await supabaseClient
          .from("purchases")
          .select(`
            id,
            user_id,
            coins,
            amount,
            currency,
            provider,
            provider_reference,
            status,
            created_at
          `)
          .order("created_at", {
            ascending: false
          });


      if (error) {

        console.error(
          "Money: purchase query failed",
          error
        );

        throw error;

      }

      return data || [];

    }


    /* =========================================================
       DATE HELPERS
    ========================================================= */

    function startOfMonth() {

      const date = new Date();

      return new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      );

    }


    function getPeriodStart(period) {

      if (period === "all") {
        return null;
      }

      const days =
        Number(period);

      const date =
        new Date();

      date.setHours(
        0,
        0,
        0,
        0
      );

      date.setDate(
        date.getDate() - (days - 1)
      );

      return date;

    }


    /* =========================================================
       CALCULATE FINANCES
    ========================================================= */

    function calculateFinance(purchases) {

      const successful =
        purchases.filter(item =>
          isSuccessful(item.status)
        );


      const pending =
        purchases.filter(item =>
          isPending(item.status)
        );


      const totalEarnings =
        successful.reduce(
          (sum, item) =>
            sum + Number(item.amount || 0),
          0
        );


      const monthlyStart =
        startOfMonth();


      const monthlyEarnings =
        successful
          .filter(item =>
            new Date(item.created_at) >= monthlyStart
          )
          .reduce(
            (sum, item) =>
              sum + Number(item.amount || 0),
            0
          );


      const pendingBalance =
        pending.reduce(
          (sum, item) =>
            sum + Number(item.amount || 0),
          0
        );


      return {

        totalEarnings,

        monthlyEarnings,

        pendingBalance,

        /*
          Until a real withdrawal/payout system exists,
          successful earnings are treated as available.
        */
        availableBalance:
          totalEarnings

      };

    }


    /* =========================================================
       UPDATE TOP CARDS
    ========================================================= */

    function updateDashboard(finance) {

      setText(
        "totalEarnings",
        money(finance.totalEarnings)
      );

      setText(
        "monthlyEarnings",
        money(finance.monthlyEarnings)
      );

      setText(
        "availableBalance",
        money(finance.availableBalance)
      );

      setText(
        "pendingBalance",
        money(finance.pendingBalance)
      );

      setText(
        "withdrawBalance",
        money(finance.availableBalance)
      );

    }


    /* =========================================================
       EARNINGS PERIOD
    ========================================================= */

    let allPurchases = [];


    function updateChart() {

      const selector =
        document.getElementById(
          "earningsPeriod"
        );

      const chartTotal =
        document.getElementById(
          "chartTotal"
        );

      if (!selector || !chartTotal) {
        return;
      }


      const selectedPeriod =
        selector.value;


      const periodStart =
        getPeriodStart(
          selectedPeriod
        );


      const earnings =
        allPurchases
          .filter(item =>
            isSuccessful(item.status)
          )
          .filter(item => {

            if (!periodStart) {
              return true;
            }

            return new Date(item.created_at)
              >= periodStart;

          })
          .reduce(
            (sum, item) =>
              sum + Number(item.amount || 0),
            0
          );


      chartTotal.textContent =
        money(earnings);

    }


    /* =========================================================
       BOOK EARNINGS
    ========================================================= */

    function renderBookEarnings() {

      const container =
        document.getElementById(
          "bookEarnings"
        );

      if (!container) {
        return;
      }


      /*
        IMPORTANT:

        purchases currently does NOT contain book_id.

        Therefore we cannot honestly assign a coin
        purchase to a particular book.

        We keep the original empty state instead
        of inventing revenue data.
      */

      container.innerHTML = `

        <div class="money-empty">

          <div>♡</div>

          <strong>Book earnings not available yet</strong>

          <span>
            Book revenue will appear here once purchases
            can be linked to individual books.
          </span>

        </div>

      `;

    }


    /* =========================================================
       BANK METHOD SWITCHING
    ========================================================= */

    const methodInputs =
      document.querySelectorAll(
        'input[name="withdrawMethod"]'
      );


    const swiftField =
      document.getElementById(
        "swiftField"
      );


    const achField =
      document.getElementById(
        "achField"
      );


    function updateBankFields() {

      const selected =
        document.querySelector(
          'input[name="withdrawMethod"]:checked'
        );


      if (!selected) {
        return;
      }


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


    methodInputs.forEach(input => {

      input.addEventListener(
        "change",
        updateBankFields
      );

    });


    updateBankFields();


    /* =========================================================
       BANK ACCOUNT
       
       Temporary frontend-only storage.
       This should NOT be used for real banking details
       in the production version.
    ========================================================= */

    const bankForm =
      document.getElementById(
        "bankForm"
      );


    const bankMessage =
      document.getElementById(
        "bankMessage"
      );


    let temporaryBankAccount =
      null;


    if (bankForm) {

      bankForm.addEventListener(
        "submit",
        event => {

          event.preventDefault();


          const accountName =
            document
              .getElementById("accountName")
              .value.trim();


          const bankName =
            document
              .getElementById("bankName")
              .value.trim();


          const accountNumber =
            document
              .getElementById("accountNumber")
              .value.trim();


          const swiftCode =
            document
              .getElementById("swiftCode")
              .value.trim();


          const routingNumber =
            document
              .getElementById("routingNumber")
              .value.trim();


          const bankCountry =
            document
              .getElementById("bankCountry")
              .value.trim();


          const selectedMethod =
            document.querySelector(
              'input[name="withdrawMethod"]:checked'
            )?.value || "SWIFT";


          if (
            !accountName ||
            !bankName ||
            !accountNumber ||
            !bankCountry
          ) {

            bankMessage.textContent =
              "Please complete all required bank details.";

            bankMessage.style.color =
              "#ff6b9f";

            return;

          }


          if (
            selectedMethod === "SWIFT" &&
            !swiftCode
          ) {

            bankMessage.textContent =
              "Please enter your SWIFT / BIC code.";

            bankMessage.style.color =
              "#ff6b9f";

            return;

          }


          if (
            selectedMethod === "ACH" &&
            !routingNumber
          ) {

            bankMessage.textContent =
              "Please enter your routing number.";

            bankMessage.style.color =
              "#ff6b9f";

            return;

          }


          temporaryBankAccount = {

            accountName,

            bankName,

            accountNumber,

            swiftCode,

            routingNumber,

            bankCountry,

            method: selectedMethod

          };


          bankMessage.textContent =
            "Payout account details entered successfully.";

          bankMessage.style.color =
            "#65d89a";

        }
      );

    }


    /* =========================================================
       WITHDRAW MONEY
       
       IMPORTANT:
       There is currently no withdrawal table/backend
       payout system, so this does NOT actually transfer money.
    ========================================================= */

    const withdrawForm =
      document.getElementById(
        "withdrawForm"
      );


    const withdrawMessage =
      document.getElementById(
        "withdrawMessage"
      );


    if (withdrawForm) {

      withdrawForm.addEventListener(
        "submit",
        event => {

          event.preventDefault();


          withdrawMessage.textContent =
            "Withdrawals are not connected yet. The payout system will be enabled after the withdrawal table and payment provider are added.";

          withdrawMessage.style.color =
            "#e5b94e";

        }
      );

    }


    /* =========================================================
       WITHDRAWAL HISTORY
    ========================================================= */

    function renderWithdrawals() {

      const container =
        document.getElementById(
          "withdrawalHistory"
        );


      if (!container) {
        return;
      }


      container.innerHTML = `

        <tr>

          <td colspan="5">

            <div class="table-empty">
              No withdrawals yet.
            </div>

          </td>

        </tr>

      `;

    }


    /* =========================================================
       LOADING STATE
    ========================================================= */

    setText(
      "totalEarnings",
      "Loading..."
    );

    setText(
      "monthlyEarnings",
      "Loading..."
    );

    setText(
      "availableBalance",
      "Loading..."
    );

    setText(
      "pendingBalance",
      "Loading..."
    );

    setText(
      "withdrawBalance",
      "Loading..."
    );

    setText(
      "chartTotal",
      "Loading..."
    );


    /* =========================================================
       LOAD REAL DATA
    ========================================================= */

    try {

      allPurchases =
        await getPurchases();


      const finance =
        calculateFinance(
          allPurchases
        );


      updateDashboard(
        finance
      );


      updateChart();

      renderBookEarnings();

      renderWithdrawals();


    } catch (error) {

      console.error(
        "Novelora Money Error:",
        error
      );


      setText(
        "totalEarnings",
        "$0.00"
      );

      setText(
        "monthlyEarnings",
        "$0.00"
      );

      setText(
        "availableBalance",
        "$0.00"
      );

      setText(
        "pendingBalance",
        "$0.00"
      );

      setText(
        "withdrawBalance",
        "$0.00"
      );

      setText(
        "chartTotal",
        "$0.00"
      );


      const chart =
        document.querySelector(
          ".chart-placeholder span"
        );


      if (chart) {

        chart.textContent =
          "Unable to load earnings from Supabase.";

      }

    }


    /* =========================================================
       PERIOD SELECTOR
    ========================================================= */

    const earningsPeriod =
      document.getElementById(
        "earningsPeriod"
      );


    if (earningsPeriod) {

      earningsPeriod.addEventListener(
        "change",
        updateChart
      );

    }

  }

});
