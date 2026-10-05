document.addEventListener("DOMContentLoaded", async () => {

  /* =========================================================
     NOVELORA MONEY
     SUPABASE — EARNINGS + WITHDRAWAL REQUESTS
  ========================================================= */

  const SUPABASE_URL =
    "https://fydjmfdtvdtkyjmsdubd.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_VwkLSv5ixhNHtAUhNdDnqA_tJWSF9S8";


  /* =========================================================
     LOAD SUPABASE
  ========================================================= */

  function loadSupabase() {

    return new Promise((resolve, reject) => {

      if (window.supabase) {
        resolve(
          window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
          )
        );
        return;
      }


      const script =
        document.createElement("script");

      script.src =
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";


      script.onload = () => {

        if (!window.supabase) {

          reject(
            new Error(
              "Supabase failed to load."
            )
          );

          return;
        }


        resolve(
          window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
          )
        );

      };


      script.onerror = () => {

        reject(
          new Error(
            "Unable to load Supabase."
          )
        );

      };


      document.head.appendChild(script);

    });

  }


  let supabaseClient;


  try {

    supabaseClient =
      await loadSupabase();

  } catch (error) {

    console.error(
      "Novelora Money:",
      error
    );

    showPageError(
      "Unable to connect to Novelora finance."
    );

    return;

  }


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


  function setText(id, value) {

    const element =
      document.getElementById(id);

    if (element) {
      element.textContent = value;
    }

  }


  function isSuccessful(status) {

    const value =
      String(status || "")
        .toLowerCase()
        .trim();

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
      String(status || "")
        .toLowerCase()
        .trim();

    return [
      "pending",
      "processing",
      "awaiting"
    ].includes(value);

  }


  function showPageError(message) {

    const chartText =
      document.querySelector(
        ".chart-placeholder span"
      );

    if (chartText) {
      chartText.textContent =
        message;
    }

  }


  /* =========================================================
     DATA
  ========================================================= */

  let allPurchases = [];
  let allWithdrawals = [];


  /* =========================================================
     PURCHASES
  ========================================================= */

  async function loadPurchases() {

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
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    allPurchases =
      data || [];

  }


  /* =========================================================
     WITHDRAWALS
  ========================================================= */

  async function loadWithdrawals() {

    const { data, error } =
      await supabaseClient
        .from("withdrawals")
        .select(`
          id,
          user_id,
          amount,
          currency,
          method,
          status,
          account_name,
          bank_name,
          account_number,
          swift_code,
          routing_number,
          bank_country,
          provider,
          provider_reference,
          failure_reason,
          requested_at,
          processed_at,
          created_at,
          updated_at
        `)
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    allWithdrawals =
      data || [];

  }


  /* =========================================================
     FINANCE CALCULATIONS
  ========================================================= */

  function calculateFinance() {

    const successful =
      allPurchases.filter(
        item =>
          isSuccessful(item.status)
      );


    const pending =
      allPurchases.filter(
        item =>
          isPending(item.status)
      );


    const totalEarnings =
      successful.reduce(
        (sum, item) =>
          sum +
          Number(item.amount || 0),
        0
      );


    const monthStart =
      new Date();

    monthStart.setDate(1);
    monthStart.setHours(
      0,
      0,
      0,
      0
    );


    const monthlyEarnings =
      successful
        .filter(item =>
          new Date(item.created_at)
            >= monthStart
        )
        .reduce(
          (sum, item) =>
            sum +
            Number(item.amount || 0),
          0
        );


    const pendingPurchases =
      pending.reduce(
        (sum, item) =>
          sum +
          Number(item.amount || 0),
        0
      );


    /*
      Money that has already been requested
      for withdrawal but has not completed.
    */

    const activeWithdrawals =
      allWithdrawals.filter(
        item => {

          const status =
            String(item.status || "")
              .toLowerCase();

          return [
            "pending",
            "processing"
          ].includes(status);

        }
      );


    const withdrawnOrProcessing =
      activeWithdrawals.reduce(
        (sum, item) =>
          sum +
          Number(item.amount || 0),
        0
      );


    const availableBalance =
      Math.max(
        0,
        totalEarnings -
        withdrawnOrProcessing
      );


    return {

      totalEarnings,

      monthlyEarnings,

      pendingBalance:
        pendingPurchases,

      availableBalance

    };

  }


  /* =========================================================
     UPDATE DASHBOARD
  ========================================================= */

  function updateDashboard() {

    const finance =
      calculateFinance();


    setText(
      "totalEarnings",
      money(
        finance.totalEarnings
      )
    );


    setText(
      "monthlyEarnings",
      money(
        finance.monthlyEarnings
      )
    );


    setText(
      "availableBalance",
      money(
        finance.availableBalance
      )
    );


    setText(
      "pendingBalance",
      money(
        finance.pendingBalance
      )
    );


    setText(
      "withdrawBalance",
      money(
        finance.availableBalance
      )
    );


    updateChart();

  }


  /* =========================================================
     EARNINGS PERIOD
  ========================================================= */

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
      date.getDate() -
      (days - 1)
    );


    return date;

  }


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


    const start =
      getPeriodStart(
        selector.value
      );


    const earnings =
      allPurchases
        .filter(item =>
          isSuccessful(item.status)
        )
        .filter(item => {

          if (!start) {
            return true;
          }

          return new Date(
            item.created_at
          ) >= start;

        })
        .reduce(
          (sum, item) =>
            sum +
            Number(item.amount || 0),
          0
        );


    chartTotal.textContent =
      money(earnings);

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
     BANK DETAILS
  ========================================================= */

  let bankAccount =
    null;


  const bankForm =
    document.getElementById(
      "bankForm"
    );


  const bankMessage =
    document.getElementById(
      "bankMessage"
    );


  if (bankForm) {

    bankForm.addEventListener(
      "submit",
      event => {

        event.preventDefault();


        const accountName =
          document
            .getElementById(
              "accountName"
            )
            .value.trim();


        const bankName =
          document
            .getElementById(
              "bankName"
            )
            .value.trim();


        const accountNumber =
          document
            .getElementById(
              "accountNumber"
            )
            .value.trim();


        const swiftCode =
          document
            .getElementById(
              "swiftCode"
            )
            .value.trim();


        const routingNumber =
          document
            .getElementById(
              "routingNumber"
            )
            .value.trim();


        const bankCountry =
          document
            .getElementById(
              "bankCountry"
            )
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


        bankAccount = {

          accountName,

          bankName,

          accountNumber,

          swiftCode,

          routingNumber,

          bankCountry,

          method:
            selectedMethod

        };


        bankMessage.textContent =
          "Payout account ready.";

        bankMessage.style.color =
          "#65d89a";

      }
    );

  }


  /* =========================================================
     WITHDRAW MONEY
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
      async event => {

        event.preventDefault();


        withdrawMessage.textContent =
          "";


        const amount =
          Number(
            document.getElementById(
              "withdrawAmount"
            ).value
          );


        const method =
          document.querySelector(
            'input[name="withdrawMethod"]:checked'
          )?.value || "SWIFT";


        const finance =
          calculateFinance();


        /* -------------------------
           VALIDATION
        ------------------------- */

        if (!bankAccount) {

          withdrawMessage.textContent =
            "Please save your payout account first.";

          withdrawMessage.style.color =
            "#ff6b9f";

          return;

        }


        if (
          !amount ||
          amount < 10
        ) {

          withdrawMessage.textContent =
            "The minimum withdrawal is $10.00.";

          withdrawMessage.style.color =
            "#ff6b9f";

          return;

        }


        if (
          amount >
          finance.availableBalance
        ) {

          withdrawMessage.textContent =
            "You do not have enough available earnings.";

          withdrawMessage.style.color =
            "#ff6b9f";

          return;

        }


        /* -------------------------
           DISABLE BUTTON
        ------------------------- */

        const button =
          withdrawForm.querySelector(
            "button[type='submit']"
          );


        if (button) {

          button.disabled =
            true;

          button.textContent =
            "Submitting...";

        }


        /* -------------------------
           CREATE WITHDRAWAL
        ------------------------- */

        const withdrawalData = {

          amount,

          currency: "USD",

          method,

          status: "pending",

          account_name:
            bankAccount.accountName,

          bank_name:
            bankAccount.bankName,

          account_number:
            bankAccount.accountNumber,

          swift_code:
            bankAccount.swiftCode ||
            null,

          routing_number:
            bankAccount.routingNumber ||
            null,

          bank_country:
            bankAccount.bankCountry,

          provider: null,

          provider_reference: null,

          failure_reason: null

        };


        const {
          data,
          error
        } =
          await supabaseClient
            .from("withdrawals")
            .insert(
              withdrawalData
            )
            .select()
            .single();


        /* -------------------------
           RESULT
        ------------------------- */

        if (error) {

          console.error(
            "Withdrawal error:",
            error
          );


          withdrawMessage.textContent =
            "Withdrawal request could not be submitted.";

          withdrawMessage.style.color =
            "#ff6b9f";


          if (button) {

            button.disabled =
              false;

            button.textContent =
              "Withdraw Money";

          }


          return;

        }


        console.log(
          "Withdrawal created:",
          data
        );


        withdrawMessage.textContent =
          `${money(amount)} withdrawal request submitted successfully.`;

        withdrawMessage.style.color =
          "#65d89a";


        withdrawForm.reset();

        updateBankFields();


        /* -------------------------
           REFRESH DATA
        ------------------------- */

        try {

          await loadWithdrawals();

          updateDashboard();

          renderWithdrawals();

        } catch (refreshError) {

          console.error(
            refreshError
          );

        }


        if (button) {

          button.disabled =
            false;

          button.textContent =
            "Withdraw Money";

        }

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


    if (!allWithdrawals.length) {

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
      allWithdrawals
        .map(item => {

          const date =
            new Date(
              item.created_at ||
              item.requested_at
            ).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric"
              }
            );


          const status =
            String(
              item.status ||
              "Pending"
            );


          const amount =
            money(
              item.amount
            );


          return `

            <tr>

              <td>
                ${escapeHTML(date)}
              </td>

              <td>
                <strong>
                  ${escapeHTML(amount)}
                </strong>
              </td>

              <td>
                ${escapeHTML(
                  item.method || "—"
                )}
              </td>

              <td>
                ${escapeHTML(
                  item.bank_name || "—"
                )}
              </td>

              <td>

                <span class="status-pill">
                  ${escapeHTML(
                    status
                  )}
                </span>

              </td>

            </tr>

          `;

        })
        .join("");

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
      purchases currently has no book_id,
      so we do NOT invent book revenue.
    */

    container.innerHTML = `

      <div class="money-empty">

        <div>♡</div>

        <strong>
          Book earnings not available yet
        </strong>

        <span>
          Book revenue will appear here once
          purchases can be linked to individual books.
        </span>

      </div>

    `;

  }


  /* =========================================================
     INITIAL LOADING
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


  try {

    await Promise.all([
      loadPurchases(),
      loadWithdrawals()
    ]);


    updateDashboard();

    renderWithdrawals();

    renderBookEarnings();


  } catch (error) {

    console.error(
      "Novelora Money loading error:",
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


    showPageError(
      "Unable to load finance data from Supabase."
    );

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

});
