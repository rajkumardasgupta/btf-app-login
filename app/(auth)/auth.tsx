import { HelloWave } from '@/components/HelloWave';
import { db } from '@/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router } from 'expo-router';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || (!isLogin && !name.trim())) {
      Alert.alert('Invalid Input', 'Name and email are required.');
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (isLogin) {
        if (!querySnapshot.empty) {
          await AsyncStorage.setItem('isLoggedIn', 'true');
          await AsyncStorage.setItem('userEmail', email.trim());
          router.replace('/(tabs)');
        } else {
          Alert.alert('Login failed', 'User not found.');
        }
      } else {
        if (!querySnapshot.empty) {
          Alert.alert('Registration failed', 'User already exists.');
        } else {
          await addDoc(usersRef, {
            name: name.trim(),
            email: email.trim(),
            createdAt: new Date(),
          });
          setIsLogin(true);
          Alert.alert('Success', 'User registered. Please log in.');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Image
            source={require('@/assets/images/login_page_image.png')}
            style={styles.image}
            resizeMode="contain"
          />

          <Text style={styles.foundationName}>Bengal Tree Foundation</Text>

          <View style={styles.formContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{isLogin ? 'User Login' : 'Register'}</Text>
              <HelloWave />
            </View>

            {!isLogin && (
              <TextInput
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholderTextColor="#666"
              />
            )}

            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              placeholderTextColor="#666"
            />

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Register'}</Text>
            </TouchableOpacity>

            <Text style={styles.toggleText} onPress={() => setIsLogin(!isLogin)}>
              {isLogin ? "Don't have an account? Register" : 'Already registered? Login'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 16,
  },
  image: {
    width: '80%',
    height: 160,
    marginBottom: 10,
  },
  foundationName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#004520',
    textAlign: 'center',
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004520',
    textAlign: 'center',
    marginRight: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    color: '#000',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  toggleText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#0077cc',
  },
  button: {
    backgroundColor: '#004520',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
