const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy 
} = require('firebase/firestore');

class DBService {
  constructor(firebaseConfig) {
    // Initialize Firebase
    this.app = initializeApp(firebaseConfig);
    this.db = getFirestore(this.app);
    
    // Collection references
    this.tokensCollection = 'nft_tokens';
    this.provenanceCollection = 'provenance_events';
  }

  /**
   * Save NFT token data to Firestore
   */
  async saveTokenData(tokenData) {
    try {
      const tokenRef = doc(this.db, this.tokensCollection, tokenData.tokenId);
      
      const data = {
        ...tokenData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(tokenRef, data);
      console.log(`Token ${tokenData.tokenId} saved successfully`);
      return data;
    } catch (error) {
      console.error('Error saving token data:', error);
      throw new Error(`Failed to save token data: ${error.message}`);
    }
  }

  /**
   * Get NFT token data by tokenId
   */
  async getTokenData(tokenId) {
    try {
      const tokenRef = doc(this.db, this.tokensCollection, tokenId);
      const tokenSnap = await getDoc(tokenRef);

      if (tokenSnap.exists()) {
        return { id: tokenSnap.id, ...tokenSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting token data:', error);
      throw new Error(`Failed to get token data: ${error.message}`);
    }
  }

  /**
   * Update existing token data
   */
  async updateTokenData(tokenId, updateData) {
    try {
      const tokenRef = doc(this.db, this.tokensCollection, tokenId);
      
      // Check if token exists first
      const tokenSnap = await getDoc(tokenRef);
      if (!tokenSnap.exists()) {
        throw new Error('Token not found');
      }

      const updatedData = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(tokenRef, updatedData);
      console.log(`Token ${tokenId} updated successfully`);
      
      // Return updated document
      const updatedSnap = await getDoc(tokenRef);
      return { id: updatedSnap.id, ...updatedSnap.data() };
    } catch (error) {
      console.error('Error updating token data:', error);
      throw new Error(`Failed to update token data: ${error.message}`);
    }
  }

  /**
   * Get all tokens (with optional filtering)
   */
  async getAllTokens(filters = {}) {
    try {
      let tokensQuery = collection(this.db, this.tokensCollection);
      
      // Add filters if provided
      if (filters.artisanAddress) {
        tokensQuery = query(tokensQuery, where('artisanAddress', '==', filters.artisanAddress));
      }
      if (filters.kind) {
        tokensQuery = query(tokensQuery, where('kind', '==', filters.kind));
      }
      if (filters.sku) {
        tokensQuery = query(tokensQuery, where('sku', '==', filters.sku));
      }

      // Order by creation date (newest first)
      tokensQuery = query(tokensQuery, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(tokensQuery);
      const tokens = [];
      
      querySnapshot.forEach((doc) => {
        tokens.push({ id: doc.id, ...doc.data() });
      });

      return tokens;
    } catch (error) {
      console.error('Error getting all tokens:', error);
      throw new Error(`Failed to get tokens: ${error.message}`);
    }
  }

  /**
   * Get tokens by artisan address
   */
  async getTokensByArtisan(artisanAddress) {
    try {
      return await this.getAllTokens({ artisanAddress });
    } catch (error) {
      console.error('Error getting artisan tokens:', error);
      throw new Error(`Failed to get artisan tokens: ${error.message}`);
    }
  }

  /**
   * Get tokens by SKU
   */
  async getTokensBySKU(sku) {
    try {
      return await this.getAllTokens({ sku });
    } catch (error) {
      console.error('Error getting SKU tokens:', error);
      throw new Error(`Failed to get SKU tokens: ${error.message}`);
    }
  }

  /**
   * Save provenance event
   */
  async saveProvenanceEvent(eventData) {
    try {
      const newEvent = {
        ...eventData,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };

      const docRef = await addDoc(collection(this.db, this.provenanceCollection), newEvent);
      console.log(`Provenance event saved with ID: ${docRef.id}`);
      
      return { firebaseId: docRef.id, ...newEvent };
    } catch (error) {
      console.error('Error saving provenance event:', error);
      throw new Error(`Failed to save provenance event: ${error.message}`);
    }
  }

  /**
   * Get provenance events for a specific token
   */
  async getProvenanceEvents(tokenId) {
    try {
      const eventsQuery = query(
        collection(this.db, this.provenanceCollection),
        where('tokenId', '==', tokenId),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(eventsQuery);
      const events = [];
      
      querySnapshot.forEach((doc) => {
        events.push({ firebaseId: doc.id, ...doc.data() });
      });

      return events;
    } catch (error) {
      console.error('Error getting provenance events:', error);
      throw new Error(`Failed to get provenance events: ${error.message}`);
    }
  }

  /**
   * Get all provenance events (for admin/analytics)
   */
  async getAllProvenanceEvents() {
    try {
      const eventsQuery = query(
        collection(this.db, this.provenanceCollection),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(eventsQuery);
      const events = [];
      
      querySnapshot.forEach((doc) => {
        events.push({ firebaseId: doc.id, ...doc.data() });
      });

      return events;
    } catch (error) {
      console.error('Error getting all provenance events:', error);
      throw new Error(`Failed to get all provenance events: ${error.message}`);
    }
  }

  /**
   * Check if token exists
   */
  async tokenExists(tokenId) {
    try {
      const tokenData = await this.getTokenData(tokenId);
      return tokenData !== null;
    } catch (error) {
      console.error('Error checking token existence:', error);
      return false;
    }
  }

  /**
   * Delete token (for testing/cleanup - use carefully)
   */
  async deleteToken(tokenId) {
    try {
      const tokenRef = doc(this.db, this.tokensCollection, tokenId);
      await deleteDoc(tokenRef);
      console.log(`Token ${tokenId} deleted successfully`);
      return true;
    } catch (error) {
      console.error('Error deleting token:', error);
      throw new Error(`Failed to delete token: ${error.message}`);
    }
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats() {
    try {
      const [allTokens, allEvents] = await Promise.all([
        this.getAllTokens(),
        this.getAllProvenanceEvents()
      ]);

      const coaTokens = allTokens.filter(t => t.kind === 'CoA');
      const rightsTokens = allTokens.filter(t => t.kind === 'Rights');
      
      // Get unique artisans
      const uniqueArtisans = new Set(allTokens.map(t => t.artisanAddress));

      return {
        totalTokens: allTokens.length,
        totalCoA: coaTokens.length,
        totalRights: rightsTokens.length,
        totalArtisans: uniqueArtisans.size,
        totalEvents: allEvents.length,
        recentTokens: allTokens.slice(0, 5), // Latest 5 tokens
        recentEvents: allEvents.slice(0, 10) // Latest 10 events
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }
}

module.exports = DBService;
