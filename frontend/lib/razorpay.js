export function openRazorpayCheckout(order, onSuccess, onError) {
  if (!window || !window.Razorpay) {
    console.error("Razorpay SDK not loaded");
    return;
  }

  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: order.currency,
    name: "Artivio",
    description: "Complete your purchase",
    order_id: order.id,
    handler: function (response) {
      onSuccess?.(response);
    },
    prefill: {
      name: order.customerName || "Guest User",
      email: order.customerEmail || "guest@example.com",
      contact: order.customerPhone || "9999999999",
    },
    theme: {
      color: "#6366f1",
    },
    modal: {
      ondismiss: () => {
        onError?.("Payment popup closed");
      },
    },
  };

  const razor = new window.Razorpay(options);
  razor.open();
}
