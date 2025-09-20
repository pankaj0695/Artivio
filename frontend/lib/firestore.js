import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { db } from "./firebase";
// Users
export async function createUserProfile(uid, data) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, data, { merge: true });
  return data;
}

export async function getUserProfile(uid) {
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function updateUserProfile(uid, data) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, data);
  return data;
}
// Products
export const createProduct = async (productData) => {
  try {
    const docRef = await addDoc(collection(db, "products"), {
      ...productData,
      type: productData?.type || "product",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    return { id: null, error: error.message };
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    await updateDoc(doc(db, "products", productId), {
      ...productData,
      type: productData?.type || "product",
      updatedAt: new Date(),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export const getProducts = async (filters = {}) => {
  console.log("Fetching products with filters:", filters);
  try {
    let q = collection(db, "products");

    if (filters.category) {
      q = query(q, where("category", "==", filters.category));
    }

    if (filters.status) {
      q = query(q, where("status", "==", filters.status));
    }

    if (filters.artisanId) {
      q = query(q, where("artisanId", "==", filters.artisanId));
    }

    if (filters.type) {
      q = query(q, where("type", "==", filters.type));
    }

    // client sorts by createdAt; avoid Firestore composite index

    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    const snapshot = await getDocs(q);
    const products = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data?.type || "product",
        ...data,
      };
    });

    return { products, error: null };
  } catch (error) {
    return { products: [], error: error.message };
  }
};

export const getProduct = async (productId) => {
  try {
    const docSnapshot = await getDoc(doc(db, "products", productId));
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      return {
        product: { id: docSnapshot.id, type: data?.type || "product", ...data },
        error: null,
      };
    }
    return { product: null, error: "Product not found" };
  } catch (error) {
    return { product: null, error: error.message };
  }
};

export const deleteProduct = async (productId) => {
  try {
    await deleteDoc(doc(db, "products", productId));
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Orders
export const createOrder = async (orderData) => {
  try {
    const docRef = await addDoc(collection(db, "orders"), {
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    return { id: null, error: error.message };
  }
};

export const getUserOrders = async (userId) => {
  try {
    const q = query(
      collection(db, "orders"),
      where("userId", "==", userId)
      // orderBy("createdAt", "desc") // Uncomment if you have a composite index set up
    );

    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { orders, error: null };
  } catch (error) {
    return { orders: [], error: error.message };
  }
};

export const getArtisanStats = async (artisanId) => {
  try {
    // Get products count
    const productsQuery = query(
      collection(db, "products"),
      where("artisanId", "==", artisanId)
    );
    const productsSnapshot = await getDocs(productsQuery);

    // Get orders for artisan's products
    const ordersQuery = query(collection(db, "orders"));
    const ordersSnapshot = await getDocs(ordersQuery);

    let totalRevenue = 0;
    let totalOrders = 0;

    ordersSnapshot.docs.forEach((orderDoc) => {
      const order = orderDoc.data();
      const hasArtisanProducts = order.items?.some((item) =>
        productsSnapshot.docs.some(
          (productDoc) => productDoc.id === item.productId
        )
      );

      if (hasArtisanProducts) {
        totalOrders++;
        totalRevenue += order.amount || 0;
      }
    });

    const lowStockProducts = productsSnapshot.docs.filter((doc) => {
      const product = doc.data();
      return product.stock < 10;
    }).length;

    return {
      stats: {
        totalProducts: productsSnapshot.docs.length,
        lowStockProducts,
        totalOrders,
        totalRevenue,
      },
      error: null,
    };
  } catch (error) {
    return { stats: null, error: error.message };
  }
};
export const getArtisanOrders = async (artisanId, limitCount = 5) => {
  try {
    // 1. Get artisan products
    const productsQuery = query(
      collection(db, "products"),
      where("artisanId", "==", artisanId)
    );
    const productsSnapshot = await getDocs(productsQuery);
    const artisanProductIds = productsSnapshot.docs.map((doc) => doc.id);

    if (artisanProductIds.length === 0) {
      return { orders: [], error: null };
    }

    // 2. Get latest orders with limit
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const ordersSnapshot = await getDocs(ordersQuery);

    // 3. Filter + attach buyer data
    const artisanOrders = await Promise.all(
      ordersSnapshot.docs.map(async (docSnap) => {
        const order = { id: docSnap.id, ...docSnap.data() };

        const hasArtisanProduct = order.items?.some((item) =>
          artisanProductIds.includes(item.productId)
        );

        if (!hasArtisanProduct) return null;

        // fetch buyer details
        let buyer = null;
        if (order.userId) {
          const userDoc = await getDoc(doc(db, "users", order.userId));
          if (userDoc.exists()) {
            buyer = { id: userDoc.id, ...userDoc.data() };
          }
        }

        return { ...order, buyer };
      })
    );

    return { orders: artisanOrders.filter(Boolean), error: null };
  } catch (error) {
    return { orders: [], error: error.message };
  }
};

export const getUserAddresses = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    return userDoc.exists() ? userDoc.data().addresses || [] : [];
  } catch (error) {
    return [];
  }
};
export const addUserAddress = async (userId, address) => {
  try {
    const userRef = doc(db, "users", userId);
    const currentAddresses = await getUserAddresses(userId);
    const updatedAddresses = [...currentAddresses, address];
    await updateDoc(userRef, { addresses: updatedAddresses });
    return { addresses: updatedAddresses, error: null };
  } catch (error) {
    return { addresses: null, error: error.message };
  }
};

// ---------------- Artisan Public Profile (Public Collection) ----------------

// Read public artisan profile
export async function getArtisanPublic(uid) {
  try {
    const ref = doc(db, "artisanPublic", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: uid, ...snap.data() } : null;
  } catch (error) {
    console.error("getArtisanPublic error:", error);
    return null;
  }
}

// Create/update public artisan profile (creates collection/doc on first write)
export async function upsertArtisanPublic(uid, data) {
  try {
    const ref = doc(db, "artisanPublic", uid);
    const now = new Date();
    await setDoc(
      ref,
      { ...data, updatedAt: now, createdAt: data?.createdAt || now },
      { merge: true }
    );
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

// Portfolio subcollection helpers
export async function listPortfolio(uid, count = 12) {
  try {
    const ref = collection(db, "artisanPublic", uid, "portfolio");
    const snap = await getDocs(query(ref, limit(count)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("listPortfolio error:", error);
    return [];
  }
}

// List all public artisans (for directory)
export async function listArtisans(count = 50) {
  try {
    const ref = collection(db, "artisanPublic");
    let q = query(ref, orderBy("createdAt", "desc"));
    if (count) {
      q = query(q, limit(count));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("listArtisans error:", error);
    return [];
  }
}

export const getAllArtisanOrders = async (artisanId) => {
  try {
    // 1. Get artisan products
    const productsQuery = query(
      collection(db, "products"),
      where("artisanId", "==", artisanId)
    );
    const productsSnapshot = await getDocs(productsQuery);
    const artisanProductIds = productsSnapshot.docs.map((doc) => doc.id);

    if (artisanProductIds.length === 0) {
      return { orders: [], error: null };
    }

    // 2. Get all orders sorted by createdAt
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );
    const ordersSnapshot = await getDocs(ordersQuery);

    // 3. Filter orders containing artisan products + attach buyer
    const artisanOrders = await Promise.all(
      ordersSnapshot.docs.map(async (docSnap) => {
        const order = { id: docSnap.id, ...docSnap.data() };

        const hasArtisanProduct = order.items?.some((item) =>
          artisanProductIds.includes(item.productId)
        );

        if (!hasArtisanProduct) return null;

        // fetch buyer details
        let buyer = null;
        if (order.userId) {
          const userDoc = await getDoc(doc(db, "users", order.userId));
          if (userDoc.exists()) {
            buyer = { id: userDoc.id, ...userDoc.data() };
          }
        }

        return { ...order, buyer };
      })
    );

    return { orders: artisanOrders.filter(Boolean), error: null };
  } catch (error) {
    return { orders: [], error: error.message };
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: new Date(),
    });

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
