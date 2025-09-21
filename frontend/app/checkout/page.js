"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { createOrder, getUserAddresses, addUserAddress } from "@/lib/firestore";

export default function CheckoutPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      getUserAddresses(user.uid).then(setAddresses);
    }
  }, [user]);

  if (!user) {
    if (loading) return;
    router.push("/sign-in");
    return null;
  }

  const handleAddAddress = async () => {
    if (!newAddress.trim()) return;
    const { addresses: updatedAddresses } = await addUserAddress(user.uid, newAddress.trim());
    setAddresses(updatedAddresses);
    setSelectedAddress(newAddress.trim());
    setShowNewAddress(false);
    setNewAddress("");
  };

  const getSelectedAddress = () => {
    return showNewAddress ? newAddress.trim() : selectedAddress;
  };

  const validateOrder = () => {
    const address = getSelectedAddress();
    if (!address) {
      alert("Please select or add an address");
      return false;
    }
    if (items.length === 0) {
      alert("Your cart is empty");
      return false;
    }
    return true;
  };

  const createRazorpayOrder = async () => {
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: getTotalPrice(),
          currency: "INR",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      return data;
    } catch (error) {
      throw new Error(`Failed to create Razorpay order: ${error.message}`);
    }
  };

  const verifyPayment = async (paymentData) => {
    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("Payment verification failed:", error);
      return false;
    }
  };

  const createFirestoreOrder = async (paymentData = null) => {
    const order = {
      userId: user.uid,
      items: items.map((i) => ({
        productId: i.id,
        title: i.title,
        price: i.price,
        quantity: i.quantity,
        image: i.images?.[0] || null,
      })),
      amount: getTotalPrice(),
      currency: "INR",
      status: paymentData ? "paid" : "pending",
      shippingAddress: getSelectedAddress(),
      ...(paymentData && {
        paymentId: paymentData.razorpay_payment_id,
        razorpayOrderId: paymentData.razorpay_order_id,
        razorpaySignature: paymentData.razorpay_signature,
      }),
    };

    const { id, error } = await createOrder(order);
    if (error) throw new Error(error);
    
    return id;
  };

  const handlePaymentSuccess = async (paymentResponse) => {
    try {
      // Verify payment signature
      const isVerified = await verifyPayment(paymentResponse);
      
      if (!isVerified) {
        throw new Error("Payment verification failed");
      }

      // Create order in Firestore
      await createFirestoreOrder(paymentResponse);
      
      // Clear cart and redirect
      clearCart();
      router.push("/orders");
      
    } catch (error) {
      console.error("Payment success handling failed:", error);
      alert("Payment was successful but order creation failed. Please contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error) => {
    console.error("Payment failed:", error);
    alert("Payment failed. Please try again.");
    setIsProcessing(false);
  };

  const handlePlaceOrder = async () => {
    if (!validateOrder()) return;

    setIsProcessing(true);

    try {
      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        throw new Error("Payment system not loaded. Please refresh the page.");
      }

      // Create Razorpay order
      const razorpayOrder = await createRazorpayOrder();

      // Open Razorpay checkout for payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Artivio",
        description: "Purchase from Artivio",
        order_id: razorpayOrder.id,
        handler: handlePaymentSuccess,
        prefill: {
          name: user.displayName || user.email,
          email: user.email,
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', handlePaymentError);
      rzp.open();

    } catch (error) {
      console.error("Order placement failed:", error);
      alert("Failed to place order. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      
      <Card className="rounded-2xl border-0 shadow-sm mb-6">
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold text-lg mb-2">Shipping Address</h2>
          {addresses.length > 0 && !showNewAddress && (
            <div className="space-y-2 mb-4">
              {addresses.map((address, idx) => (
                <label key={idx} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddress === address}
                    onChange={() => setSelectedAddress(address)}
                  />
                  <span>{address}</span>
                </label>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => setShowNewAddress((v) => !v)}
            className="mb-2"
          >
            {showNewAddress ? "Cancel" : "Add New Address"}
          </Button>
          {showNewAddress && (
            <div className="space-y-2 mb-4">
              <input
                className="border p-2 w-full rounded"
                placeholder="Enter address"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
              />
              <Button
                onClick={handleAddAddress}
                className="w-1/2 rounded-full text-sm py-1"
                size="sm"
                disabled={!newAddress.trim()}
              >
                Save Address
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>Items</div>
            <div className="font-semibold">{items.length}</div>
          </div>
          <div className="flex items-center justify-between">
            <div>Total</div>
            <div className="text-xl font-bold">
              ₹{getTotalPrice().toFixed(2)}
            </div>
          </div>
          
          <Button
            onClick={handlePlaceOrder}
            className="w-full rounded-full"
            disabled={isProcessing}
          >
            {isProcessing ? "Processing Payment..." : "Place Order"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}`Ze`