import { db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, StyleSheet, Text, View } from 'react-native';

type UserTreeData = {
  name: string;
  email: string;
  totalTrees: number;
  createdAt?: string;
};

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<UserTreeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedInEmail, setLoggedInEmail] = useState('');

  useEffect(() => {
    loadEmail();
    fetchLeaderboard();
  }, []);

  const loadEmail = async () => {
    const email = await AsyncStorage.getItem('userEmail');
    if (email) setLoggedInEmail(email);
  };

  const fetchLeaderboard = async () => {
    try {
      // Step 1: Aggregate tree counts by email
      const snapshot = await getDocs(collection(db, 'locations'));
      const treeCounts: Record<string, number> = {};

      snapshot.forEach(doc => {
        const data = doc.data();
        const email = (data.submittedByEmail || '').trim().toLowerCase();
        const trees = parseInt(data.numberOfTrees) || 0;
        const status = (data.status || '').trim().toLowerCase();

        if (email && status === 'done') {
          treeCounts[email] = (treeCounts[email] || 0) + trees;
        }

      });

      // Step 2: Fetch user names and createdAt from 'users'
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersMap: Record<string, { name: string; createdAt: string }> = {};

      usersSnapshot.forEach(doc => {
        const data = doc.data();
        const email = (data.email || '').trim().toLowerCase();
        if (email && data.name) {
          usersMap[email] = {
            name: data.name,
            createdAt: data.createdAt
              ? new Date(data.createdAt.seconds * 1000).toDateString()
              : 'Unknown',
          };
        }
      });

      // Step 3: Build leaderboard from usersMap + treeCounts
      const leaderboardArray: UserTreeData[] = Object.entries(treeCounts).map(
        ([email, totalTrees]) => {
          const user = usersMap[email];
          return {
            email,
            name: user?.name || email,
            totalTrees,
            createdAt: user?.createdAt || 'Unknown',
          };
        }
      );

      leaderboardArray.sort((a, b) => b.totalTrees - a.totalTrees);
      setLeaderboard(leaderboardArray);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchLeaderboard();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#004520" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌿 Tree Planters Leaderboard</Text>
      <Text style={styles.subtitle}>Only completed plantations are counted in the leaderboard</Text>
      <FlatList
        data={leaderboard}
        keyExtractor={(item, index) => `${item.email}-${index}`}
        renderItem={({ item, index }) => {
          const isCurrentUser = item.email === loggedInEmail;
          return (
            <View style={[styles.item, isCurrentUser && styles.highlightedItem]}>
              <Text style={styles.serial}>{index + 1}.</Text>
              <Ionicons
                name="trophy"
                size={24}
                color={index < 3 ? '#FFD700' : '#8FBC8F'}
                style={{ marginHorizontal: 6 }}
              />
              <View style={styles.info}>
                <Text style={[styles.name, isCurrentUser && styles.highlightedText]}>
                  {item.name}
                </Text>
                <Text style={styles.memberSince}>Member since: {item.createdAt}</Text>
              </View>
              <Text style={styles.trees}>{item.totalTrees} 🌱</Text>
            </View>
          );
        }}
      />
      <View style={styles.refreshButton}>
        <Button title="Refresh" onPress={handleRefresh} color="#004520" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#004520',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#004510',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: 'gray',
  },
  trees: {
    fontSize: 16,
    fontWeight: '600',
    color: '#228B22',
  },
  serial: {
    width: 24,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  refreshButton: {
    padding: 5,
    backgroundColor: '#eaeaea',
  },
  memberSince: {
    fontSize: 12,
    color: '#666',
  },
  highlightedItem: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#004520',
  },
  highlightedText: {
    color: '#004520',
    fontWeight: 'bold',
  },
});
