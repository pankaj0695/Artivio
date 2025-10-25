"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import UpdateProfileInline from "@/components/UpdateProfile/update";
import { Package, Heart, UserPen, LogOut } from "lucide-react";
import { getUserOrders } from "@/lib/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { logout } from "@/lib/auth.js"; 
import { useRouter } from "next/navigation";
import { useStaticTranslation } from "@/lib/use-static-translation";


// Badge colors for statuses
const statusColors = {
  pending: "bg-gray-100 text-gray-700",
  processing: "bg-gray-100 text-gray-700",
  shipped: "bg-gray-100 text-gray-700",
  "out-for-delivery": "bg-gray-100 text-gray-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

// Order tracking steps
const trackingSteps = ["processing", "shipped", "out-for-delivery", "delivered"];

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const { t } = useStaticTranslation();
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [activeOrders, setActiveOrders] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

const handleLogout = async () => {
  const { error } = await logout();
  if (error) {
    console.error("Logout failed:", error);
    return;
  }

  // Redirect user to login page after logout
  router.push("/login");
};

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      setLoadingOrders(true);
      const { orders, error } = await getUserOrders(user.uid);

      if (error) {
        setError(error);
        setLoadingOrders(false);
        return;
      }

      // Split into active and past orders
      const activeStatuses = ["pending", "paid", "processing"];
      const pastStatuses = ["delivered", "cancelled"];

      setActiveOrders(orders.filter(o => activeStatuses.includes(o.status)));
      setPastOrders(orders.filter(o => pastStatuses.includes(o.status)));
      setLoadingOrders(false);
    };

    fetchOrders();
  }, [user]);

  const handleCancelOrder = async (orderId) => {
  const orderToCancel = activeOrders.find((o) => o.id === orderId);
  if (!orderToCancel) return;

  try {
    // Update Firestore order status
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status: "cancelled", updatedAt: new Date() });

    // Update local state
    const updatedOrder = { ...orderToCancel, status: "cancelled" };
    setPastOrders((prev) => [updatedOrder, ...prev]);
    setActiveOrders((prev) => prev.filter((o) => o.id !== orderId));
    setSelectedOrder(null); // closes modal if open
  } catch (error) {
    console.error("Error cancelling order:", error);
  }
};

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-lg text-gray-700">
        {t("auth.signIn")} to view your profile.
      </div>
    );
  }

  if (loadingOrders) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-lg text-gray-700">
        {t("common.loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-lg text-red-600">
        {t("common.error")}: {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <Card className="w-full lg:w-64 p-6 shadow-lg rounded-2xl bg-white">
        <div className="flex flex-col items-center text-center">
          <div className="relative w-24 h-24 mb-3">
            <Image
              src={profile?.photoURL || user.photoURL || "/default-avatar.png"}
              alt="Profile"
              fill
              className="rounded-full object-cover border-4 border-gray-200"
            />
          </div>
          <h2 className="font-bold text-lg">{profile?.name || user.displayName}</h2>
          <p className="text-sm text-gray-500">{profile?.email || user.email}</p>
        </div>

        {/* Sidebar Menu */}
        <div className="mt-6 space-y-2">
          <SidebarItem
            icon={Package}
            label={t("dashboard.myOrders")}
            isActive={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
          />
          <SidebarItem
            icon={Heart}
            label={t("profile.wishlist")}
            isActive={activeTab === "wishlist"}
            onClick={() => setActiveTab("wishlist")}
          />
          <SidebarItem
            icon={UserPen}
            label={t("profile.editProfile")}
            isActive={activeTab === "updateProfile"}
            onClick={() => setActiveTab("updateProfile")}
          />
          <div className="border-t my-4" />
          <SidebarItem
  icon={LogOut}
  label={t("common.logout")}
  className="text-red-600 hover:bg-red-100"
  onClick={handleLogout} // <-- connect logout function
/>
        </div>
      </Card>

      {/* Main Content */}
      <Card className="flex-1 p-6 shadow-lg rounded-2xl bg-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "orders" && (
              <OrdersSection
                activeOrders={activeOrders}
                pastOrders={pastOrders}
                setSelectedOrder={setSelectedOrder}
                t={t}
              />
            )}

            {activeTab === "wishlist" && <EmptyState message={t("profile.wishlistEmpty")} />}

            {activeTab === "updateProfile" && (
              <div>
                <h2 className="text-2xl font-bold mb-4">{t("profile.editProfile")}</h2>
                <UpdateProfileInline />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>

      {/* ---- Order Details Modal ---- */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          trackingSteps={trackingSteps}
          onClose={() => setSelectedOrder(null)}
          onCancel={handleCancelOrder}
        />
      )}
    </div>
  );
}

// ---------- SidebarItem ----------
function SidebarItem({ icon: Icon, label, isActive, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full gap-3 px-4 py-2 rounded-lg text-sm font-medium transition ${
        isActive
          ? "bg-gray-100 text-gray-900 shadow-sm"
          : "text-gray-600 hover:bg-gray-100"
      } ${className}`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

// ---------- OrdersSection ----------
function OrdersSection({ activeOrders, pastOrders, setSelectedOrder, t }) {
  const [tab, setTab] = useState("active");

  const formatDate = (date) => {
    if (!date) return "-";
    if (date.seconds) date = new Date(date.seconds * 1000);
    return new Date(date).toLocaleDateString();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("dashboard.myOrders")}</h2>
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab("active")}
          className={`px-6 py-2 rounded-full font-medium ${
            tab === "active" ? "bg-black text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          {t("profile.activeOrders")}
          <span className="ml-2 text-sm bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
            {activeOrders.length}
          </span>
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-6 py-2 rounded-full font-medium ${
            tab === "history" ? "bg-black text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          {t("profile.orderHistory")}
          <span className="ml-2 text-sm bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
            {pastOrders.length}
          </span>
        </button>
      </div>

      {tab === "active" ? (
        activeOrders.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeOrders.map((order) => {
              const item = order.items[0];

              // Show "processing" instead of "paid" for display
              const displayStatus =
                order.status === "paid" ? "processing" : order.status;

              return (
                <Card
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="p-4 bg-white shadow-lg rounded-2xl hover:shadow-2xl transition-all cursor-pointer"
                >
                  <div className="relative w-full h-40 mb-4">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="rounded-lg object-cover"
                    />
                  </div>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Ordered on: {formatDate(order.createdAt)}
                  </p>
                  <p className="mt-2 text-gray-900 font-semibold">₹{order.amount}</p>

                  <span
                    className={`mt-2 inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      statusColors[displayStatus] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {displayStatus.replace("-", " ")}
                  </span>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState message="No active orders right now." />
        )
      ) : pastOrders.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pastOrders.map((order) => {
            const item = order.items[0];
            return (
              <Card key={order.id} className="p-4 bg-gray-50 border rounded-2xl shadow-sm">
                <div className="relative w-full h-40 mb-4">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
                <h3 className="font-bold">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Ordered on: {formatDate(order.createdAt)}
                </p>
                <p className="mt-2 text-gray-900 font-semibold">₹{order.amount}</p>
                <span
                  className={`mt-2 inline-block px-3 py-1 text-xs font-medium rounded-full ${
                    statusColors[order.status]
                  }`}
                >
                  {order.status.replace("-", " ")}
                </span>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState message="No past orders yet." />
      )}
    </div>
  );
}


// ---------- OrderDetailsModal ----------
function OrderDetailsModal({ order, trackingSteps, onClose, onCancel }) {
  // Find current status index
  const currentIndex = trackingSteps.indexOf(order.status);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative"
      >
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Title */}
        <h3 className="text-2xl font-bold mb-4">Order Details</h3>

        {/* Product Info */}
        <div className="flex gap-4 mb-4">
          <Image
            src={order.items[0].image}
            alt={order.items[0].title}
            width={100}
            height={100}
            className="rounded-lg object-cover"
          />
          <div>
            <p className="font-semibold">{order.items[0].title}</p>
            <p className="text-amber-700 font-bold">₹{order.amount}</p>
            <p className="text-sm text-gray-500">Qty: {order.items[0].quantity}</p>
          </div>
        </div>

        {/* Shipping Address */}
        <h4 className="font-semibold mb-2">Shipping Address</h4>
        <p className="text-sm text-gray-600 mb-4">{order.shippingAddress}</p>

        {/* Order Tracking */}
        <h4 className="font-semibold mb-2">Order Tracking</h4>
        <div className="relative flex justify-between items-center mt-6">

          {/* Gray Base Line */}
          <div className="absolute top-4 left-0 w-full h-1 bg-gray-300"></div>

          {/* Green Progress Line */}
          <div
            className="absolute top-4 left-0 h-1 bg-black transition-all duration-500"
            style={{
              width:
                currentIndex === -1
                  ? "0%"
                  : `${(currentIndex / (trackingSteps.length - 1)) * 100}%`,
            }}
          ></div>

          {/* Steps */}
          {trackingSteps.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div
                key={step}
                className="flex flex-col items-center flex-1 relative z-10"
              >
                {/* Step Circle */}
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full border-2 text-sm font-bold transition-colors duration-300 ${
                    isCompleted
                      ? "bg-black text-white border-black"
                      : isCurrent
                      ? "bg-black text-white border-black"
                      : "border-gray-300 text-gray-400 bg-white"
                  }`}
                >
                  {idx + 1}
                </div>

                {/* Step Label */}
                <span
                  className={`mt-2 text-xs text-center font-medium ${
                    isCompleted || isCurrent ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {step.replace("-", " ")}
                </span>
              </div>
            );
          })}
        </div>

        {/* Cancel Button */}
        <Button
          className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full py-2"
          onClick={() => onCancel(order.id)}
        >
          Cancel Order
        </Button>
      </motion.div>
    </div>
  );
}


// ---------- EmptyState ----------
function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Image
        src="/empty-state.svg"
        alt="Empty"
        width={120}
        height={120}
        className="mb-4"
      />
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
