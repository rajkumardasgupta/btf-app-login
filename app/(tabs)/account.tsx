import { db } from '@/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function AccountScreen() {
  const [userData, setUserData] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [updating, setUpdating] = useState(false);
  const [userDocId, setUserDocId] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      if (!email) {
        Alert.alert('Error', 'User email not found.');
        return;
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const userDoc = docSnap.data();
        setUserData({ name: userDoc.name, email: userDoc.email });
        setNewName(userDoc.name);
        setUserDocId(docSnap.id);
      } else {
        Alert.alert('Error', 'User not found in database.');
      }
    } catch (error) {
      console.error('Fetch user error:', error);
      Alert.alert('Error', 'Failed to fetch user data.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('isLoggedIn');
    await AsyncStorage.removeItem('userEmail');
    router.replace('/(auth)/auth');
  };

  const handleNameUpdate = async () => {
    if (!newName.trim()) {
      Alert.alert('Validation', 'Name cannot be empty.');
      return;
    }

    try {
      setUpdating(true);
      if (userDocId) {
        const userRef = doc(db, 'users', userDocId);
        await updateDoc(userRef, { name: newName });
        setUserData((prev) => prev ? { ...prev, name: newName } : null);
        setEditMode(false);
        Alert.alert('Success', 'Name updated successfully!');
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update name.');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#f51612" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {userData ? (
        <>
          {/* Name section */}
          <Text style={styles.label}>Name:</Text>
          {editMode ? (
            <>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                style={styles.input}
                placeholder="Enter new name"
                placeholderTextColor="#888"
              />
              <View style={styles.buttonRow}>
                <Button title="Save" onPress={handleNameUpdate} disabled={updating} />
                <View style={{ width: 10 }} />
                <Button title="Cancel" onPress={() => setEditMode(false)} color="#888" />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.value}>{userData.name}</Text>
              <Button title="Edit Name" onPress={() => setEditMode(true)} />
            </>
          )}

          {/* Email section */}
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{userData.email}</Text>
        </>
      ) : (
        <Text style={styles.errorText}>User data not available.</Text>
      )}

      <Button title="Logout" onPress={handleLogout} color="#f51612" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#000',
    flex: 1,
  },
  label: {
    fontSize: 18,
    color: '#ccc',
    marginTop: 16,
  },
  value: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    marginVertical: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    borderColor: '#888',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    color: '#fff',
    marginVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 16,
    marginTop: 4,
  },
});
