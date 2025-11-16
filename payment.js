// Get the Pay Button
const payButton = document.getElementById("payButton");

// Backend endpoints
const BACKEND_INITIATE = "http://127.0.0.1:8000/api/payments/initiate/";
const BACKEND_VERIFY = "http://127.0.0.1:8000/api/payments/verify/";

// Get JWT token from localStorage
function getAuthToken() {
  return localStorage.getItem("accessToken");
}

// Payment click handler
payButton.addEventListener("click", async () => {
  const fullname = document.getElementById("fullname").value;
  const email = document.getElementById("email").value;
  const amount = document.getElementById("amount").value;

  if (!fullname || !email || !amount) {
    alert("Please fill in all fields");
    return;
  }

  const token = getAuthToken();
  if (!token) { alert("⚠️ You must be logged in to make a payment."); return; }

  try {
    // 1️⃣ Initiate payment on backend
    const response = await fetch(BACKEND_INITIATE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ fullname, email, amount })
    });

    const data = await response.json();

    if (!response.ok) {
      alert("Failed to initiate payment: " + (data.detail || JSON.stringify(data)));
      return;
    }

    // 2️⃣ Open Paystack popup
    const handler = PaystackPop.setup({
      key: data.public_key,
      email: data.email,
      amount: data.amount * 100, // convert to kobo
      currency: "NGN",
      ref: data.reference,
      metadata: {
        custom_fields: [
          { display_name: "Full Name", variable_name: "full_name", value: fullname }
        ]
      },
      callback: async function (resp) {
        // 3️⃣ Verify payment with backend
        const verifyResp = await fetch(`${BACKEND_VERIFY}${resp.reference}/`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}` }
        });
        const result = await verifyResp.json();

        if (verifyResp.ok && result.status === "success") {
          alert("✅ Payment Successful!");
          console.log("Payment verified:", result);
        } else {
          alert("❌ Payment verification failed!");
        }
      },
      onClose: function () {
        alert("Payment window closed.");
      }
    });

    handler.openIframe();

  } catch (err) {
    console.error("Error initiating payment:", err);
    alert("Could not connect to backend.");
  }
});
