import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

export default function LoginScreen({ navigation }) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginId || !password) {
      Alert.alert('Missing info', 'Please fill in both fields.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: loginId, password }),
      });
      const data = await response.json();
      if (data.success) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        navigation.replace('Home');
      } else {
        Alert.alert('Login failed', data.message || 'Invalid credentials.');
      }
    } catch (err) {
      Alert.alert('Connection error', 'Could not reach the server. Check that XAMPP is running and API_BASE_URL in config.js is correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Student<Text style={{ color: '#f0ad4e' }}>X</Text>Change</Text>
      <Text style={styles.subtitle}>Sign in to your verified campus account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email or Student Number"
        value={loginId}
        onChangeText={setLoginId}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don't have an account? Register as a Student</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f8f9fa' },
  logo: { fontSize: 26, fontWeight: '800', textAlign: 'center', color: '#0d6efd' },
  subtitle: { textAlign: 'center', color: '#6c757d', marginBottom: 24, marginTop: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, padding: 14, marginBottom: 14, fontSize: 15 },
  button: { backgroundColor: '#0d6efd', borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { textAlign: 'center', color: '#0d6efd', marginTop: 18, fontWeight: '600' },
});