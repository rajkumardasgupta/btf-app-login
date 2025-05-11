import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { db } from '@/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

interface LocationItem {
  id: string;
  latitude: number;
  longitude: number;
  numberOfTrees: number;
  u_id: number;
  note: string;
  status: string;
  submittedBy: string; // This is the email
  name: string; // This will be replaced with real name
  timestamp: any;
}

export default function ExploreScreen() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'done'>('pending');

  useEffect(() => {
    fetchLocationsWithNames(); 
  }, []);

  const normalizeEmail = (email?: string): string =>
  email ? email.trim().toLowerCase() : '';

const fetchLocationsWithNames = async () => {
  try {
    // Step 1: Build a user map from 'users' collection (email -> name)
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const userMap: Record<string, { name: string; email: string }> = {};

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const email = normalizeEmail(data.email);
      if (email && data.name) {
        userMap[email] = {
          name: data.name,
          email: data.email,
        };
      }
    });

    // Step 2: Fetch from 'locations' and match submittedByEmail with user email
    const locationsSnapshot = await getDocs(collection(db, 'locations'));
    const fetchedLocations: LocationItem[] = [];

    locationsSnapshot.forEach(doc => {
      const data = doc.data();
      const rawEmail = data.submittedByEmail;
      const email = normalizeEmail(rawEmail);
      const userInfo = userMap[email];

      const name = userInfo?.name || 'Unknown';
      const matchedEmail = userInfo?.email || rawEmail || 'unknown@example.com';

      fetchedLocations.push({
        id: doc.id,
        latitude: data.latitude,
        longitude: data.longitude,
        numberOfTrees: data.numberOfTrees,
        u_id: data.u_id,
        status: data.status,
        note: data.note,
        submittedBy: matchedEmail, // Still saving email for traceability
        name,
        timestamp: data.timestamp,
      });
    });

    setLocations(fetchedLocations);
  } catch (error) {
    console.error('Error fetching joined user-location data:', error);
  } finally {
    setLoading(false);
  }
};



  const handleRefresh = () => {
    setLoading(true);
    fetchLocationsWithNames();
  };

  const filteredLocations = locations.filter(
    (item) => item.status === filterStatus
  );

  const renderItem = ({ item }: { item: LocationItem }) => (
    <ThemedView style={styles.card}>
      <ThemedText type="subtitle" style={styles.cardTitle}>
        Submitted By: {item.name}
      </ThemedText>
      <ThemedText style={styles.cardText}>Task id: {item.u_id}</ThemedText>
      <ThemedText style={styles.cardText}>Latitude: {item.latitude.toFixed(6)}</ThemedText>
      <ThemedText style={styles.cardText}>Longitude: {item.longitude.toFixed(6)}</ThemedText>
      <ThemedText style={styles.cardText}>Number of Trees: {item.numberOfTrees}</ThemedText>
      {item.note ? <ThemedText style={styles.cardText}>Note: {item.note}</ThemedText> : null}
      <ThemedText style={styles.cardText}>Status: {item.status}</ThemedText>

      <TouchableOpacity
        onPress={() => {
          const url = `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;
          Linking.openURL(url);
        }}
      >
        <ThemedText style={styles.mapLink}>Open in Google Maps</ThemedText>
      </TouchableOpacity>

      <ThemedText style={styles.cardTime}>
        {new Date(item.timestamp?.seconds * 1000).toLocaleString()}
      </ThemedText>
    </ThemedView>
  );

  const ListHeader = () => {
    const pendingCount = locations
      .filter((item) => item.status === 'pending')
      .reduce((sum, item) => sum + item.numberOfTrees, 0);

    const doneCount = locations
      .filter((item) => item.status === 'done')
      .reduce((sum, item) => sum + item.numberOfTrees, 0);

    return (
      <View style={{ alignItems: 'center', marginTop: 30 }}>
        <ThemedText type="title" style={styles.Title}>All Saved Locations</ThemedText>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === 'pending' && styles.filterButtonActive,
            ]}
            onPress={() => setFilterStatus('pending')}
          >
            <ThemedText style={styles.filterButtonText}>Pending ({pendingCount} trees)</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === 'done' && styles.filterButtonActive,
            ]}
            onPress={() => setFilterStatus('done')}
          >
            <ThemedText style={styles.filterButtonText}>Done ({doneCount} trees)</ThemedText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <ThemedText style={styles.refreshButtonText}>Refresh</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredLocations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <ThemedText style={{ textAlign: 'center', marginTop: 20 }}>
            No {filterStatus} locations found.
          </ThemedText>
        }
      />
      {loading && (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#f51612',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#f6fcf1',
  },
  Title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
    color: '#f6fcf1',
  },
  cardText: {
    fontSize: 16,
    color: '#cde5bd',
    marginBottom: 4,
  },
  cardTime: {
    fontSize: 12,
    color: '#f51612',
    marginTop: 8,
    textAlign: 'right',
  },
  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  refreshButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f51612',
    borderRadius: 5,
  },
  refreshButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  mapLink: {
    color: '#1e90ff',
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  filterButtonActive: {
    backgroundColor: '#f51612',
    borderColor: '#f51612',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});


