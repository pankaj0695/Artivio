import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { db } from "./firebase";

// Products
export const createProduct = async (productData) => {
  try {
    const docRef = await addDoc(collection(db, "products"), {
      ...productData,
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
      updatedAt: new Date(),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export const getProducts = async (filters = {}) => {
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

    // client sorts by createdAt; avoid Firestore composite index

    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    const snapshot = await getDocs(q);
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { products, error: null };
  } catch (error) {
    return { products: [], error: error.message };
  }
};

export const getProduct = async (productId) => {
  try {
    const docSnapshot = await getDoc(doc(db, "products", productId));
    if (docSnapshot.exists()) {
      return {
        product: { id: docSnapshot.id, ...docSnapshot.data() },
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
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
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
