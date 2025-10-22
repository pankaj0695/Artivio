"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { createOrder } from "@/lib/firestore";

export default function AppointmentCheckoutPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [bookingDate, setBookingDate] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [productData, setProductData] = useState({
    productId: "",
    title: "",
    price: 0,
    image: null,
  });

  // Get product info from query params
  useEffect(() => {
    const productId = searchParams.get("productId");
    const title = searchParams.get("title");
    const price = Number(searchParams.get("price")) || 0;
    const image = searchParams.get("image");

    if (!productId) {
      router.push("/"); // redirect if no product
      return;
    }

    setProductData({ productId, title, price, image });
  }, [searchParams, router]);

  if (!user) {
    if (loading) return null;
    router.push("/sign-in");
    return null;
  }

  const validateBooking = () => {
    if (!bookingDate) {
      alert("Please select a booking date");
      return false;
    }
    return true;
  };

  const createRazorpayOrder = async () => {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: productData.price,
        currency: "INR",
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  };

  const verifyPayment = async (paymentData) => {
    const response = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    });
    const data = await response.json();
    return data.success;
  };

  const createFirestoreAppointmentOrder = async (paymentData = null) => {
    const order = {
      userId: user.uid,
      items: [
        {
            productId: productData.productId,
          title: productData.title,
          price: productData.price,
          image: productData.image,
        },
      ],
      amount: productData.price,
      currency: "INR",
      status: paymentData ? "paid" : "pending",
      bookingDate: bookingDate?.toISOString(),
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
      const isVerified = await verifyPayment(paymentResponse);
      if (!isVerified) throw new Error("Payment verification failed");

      await createFirestoreAppointmentOrder(paymentResponse);
      router.push("/orders");
    } catch (error) {
      console.error(error);
      alert("Payment successful but booking creation failed. Contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error) => {
    console.error(error);
    alert("Payment failed. Please try again.");
    setIsProcessing(false);
  };

  const handleBookAppointment = async () => {
    if (!validateBooking()) return;

    setIsProcessing(true);

    try {
      if (!window.Razorpay) throw new Error("Payment system not loaded.");

      const razorpayOrder = await createRazorpayOrder();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Artivio",
        description: "Appointment Booking",
        order_id: razorpayOrder.id,
        handler: handlePaymentSuccess,
        prefill: { name: user.displayName || user.email, email: user.email },
        theme: { color: "#3399cc" },
        modal: { ondismiss: () => setIsProcessing(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", handlePaymentError);
      rzp.open();
    } catch (error) {
      console.error(error);
      alert("Failed to book appointment. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Book Appointment</h1>

      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="p-6 space-y-6">
          <h2 className="font-semibold text-lg mb-2">{productData.title}</h2>

          <label className="block font-semibold text-lg mb-2">
            Select Booking Date
          </label>
          <DatePicker
            selected={bookingDate}
            onChange={(date) => setBookingDate(date)}
            minDate={new Date()}
            placeholderText="Select a date"
            className="border border-gray-300 p-2 w-full rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            dateFormat="dd/MM/yyyy"
          />

          <Button
            type="button"
            onClick={handleBookAppointment}
            className="w-full rounded-full mt-4 bg-black text-white hover:bg-black/90 active:bg-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black disabled:opacity-60 disabled:pointer-events-none"
            disabled={isProcessing}
            aria-busy={isProcessing}
            aria-disabled={isProcessing}
          >
            {isProcessing ? "Processing Payment..." : `Book & Pay ₹${productData.price}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
