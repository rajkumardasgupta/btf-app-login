import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { db } from '@/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function HomeScreen() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [temperature, setTemperature] = useState<string | null>(null);
  const [weatherDetails, setWeatherDetails] = useState<any>(null);
  const [userList, setUserList] = useState<{ name: string; email: string }[]>([]);
  const [numberOfTrees, setNumberOfTrees] = useState('');
  const [note, setNote] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [submittedByEmail, setSubmittedByEmail] = useState('');
  
  useEffect(() => {
  const getUserInfo = async () => {
    try {
      const storedEmail = await AsyncStorage.getItem('userEmail');
      if (storedEmail) {
        setSubmittedByEmail(storedEmail);

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', storedEmail));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0].data();
          setSubmittedBy(userDoc.name);
        } else {
          console.warn('No user found with that email');
        }
      }
    } catch (err) {
      console.error('Failed to fetch user from storage/firestore', err);
    }
  };

  getUserInfo();
}, []);



  const fetchLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required!');
        setLoading(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      fetchTemperature(loc.coords.latitude, loc.coords.longitude);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not fetch location.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemperature = async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
      const data = await res.json();
  
      if (data.current_weather) {
        setTemperature(`${data.current_weather.temperature}°C`);
        setWeatherDetails(data.current_weather);
      } else {
        setTemperature('Unavailable');
        setWeatherDetails(null);
      }
    } catch (err) {
      console.error('Error fetching temperature:', err);
      setTemperature('Error');
      setWeatherDetails(null);
    }
  };

  const saveLocationToFirestore = async () => {
    if (!location) {
      Alert.alert('No location', 'Please fetch location first!');
      return;
    }

    if (!numberOfTrees || !submittedBy) {
      Alert.alert('Missing Fields', 'Please fill all required fields.');
      return;
    }
    
    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, "locations"), {
        latitude: location.latitude,
        longitude: location.longitude,
        numberOfTrees: parseInt(numberOfTrees),
        status: 'pending',
        note,
        submittedBy,
        submittedByEmail,
        timestamp: new Date(),
        u_id: Date.now(),
      });


      Alert.alert('Success', 'Location and data saved successfully!');
      setNumberOfTrees('');
      setNote('');
      setSubmittedBy('');
      setLocation(null);
      setTemperature(null);
    } catch (e) {
      console.error("Error adding document: ", e);
      Alert.alert('Error', 'Failed to save location.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <StatusBar style="light" backgroundColor="#004520" />
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#004520', dark: '#004520' }}
        headerImage={
          <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={styles.reactLogo}
          />
        }
      >
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">
            Save Potential Sites for Tree Plantation or Tree Care
          </ThemedText>
        </ThemedView>

        <View style={{ marginTop: 3, marginBottom: 3, alignItems: 'center', paddingHorizontal: 20 }}>
          <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={fetchLocation}>
            <Text style={styles.text}>Fetch Current Location</Text>
          </Pressable>
          {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 10 }} />}

          {location && (
            <View style={styles.infoBox}>
              <View style={styles.row}>
                <Text>Latitude: {location.latitude.toFixed(6)}</Text>
                <Text style={styles.tempText}>{temperature ?? '...'}</Text>
              </View>
              <View style={styles.row}>
                <Text>Longitude: {location.longitude.toFixed(6)}</Text>
              </View>

              <TextInput
                placeholder="Number of Trees"
                value={numberOfTrees}
                onChangeText={setNumberOfTrees}
                keyboardType="numeric"
                style={styles.input}
              />
              <TextInput
                placeholder="Note (in details)"
                value={note}
                onChangeText={setNote}
                style={styles.input}
              />
              {/* <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Submitted By</Text> */}
              <View style={styles.infoBox}>
                <Text style={{ fontWeight: 'bold', marginBottom: 0 }}>Submitted By:- {submittedBy || 'Name not found'}</Text>
                <Text></Text>
              </View>

            </View>
          )}
          {location && (
            <View style={{ marginTop: 20, width: '100%' }}>
              <Button title={saving ? "Saving..." : "Save Location Data"} onPress={saveLocationToFirestore} disabled={saving} />
            </View>
          )}
        </View>

        <ThemedView style={styles.stepContainer}>
          <ThemedText style={{ color: 'white' }}>
            Find a site where trees can be planted, or identify existing trees where old tree guards need to be removed.{"\n"}
            <Text style={{ color: '#00FF00' }}>Fetch the current location</Text> of the site by pressing the{" "}
            <Text style={{ color: '#FFD700' }}>"Fetch Current Location"</Text> button, then save the following details:{"\n"}
            • <Text style={{ color: '#00FFFF' }}>Number of trees</Text> that can be planted or actions required (e.g., tree guard removal){"\n"}
            • <Text style={{ color: '#00FFFF' }}>Notes</Text> describing the plantation site{"\n"}
            The submitted data will be visible in the <Text style={{ color: '#FFA500' }}>Explore List</Text> tab and on the <Text style={{ color: '#FFA500' }}>Explore Map</Text>.
          </ThemedText>
        </ThemedView>
      </ParallaxScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 200,
    width: 390,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    width: '100%',
  },
  infoBox: {
    marginTop: 10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tempText: {
    fontSize: 16,
    color: '#f51612',
    fontWeight: 'bold',
    paddingLeft: 10,
  },
  button: {
    backgroundColor: '#004520',       // Deep green
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,                 // Rounded edges
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,                     // Android shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pressed: {
    opacity: 0.8,                     // Slight dim when pressed
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

