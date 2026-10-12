import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

export default function LoginScreen({ navigation }) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginId.trim() || !password) {
      Alert.alert('Missing info', 'Please fill in both fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login_id: loginId.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        navigation.replace('Home');
      } else {
        Alert.alert(
          'Login failed',
          data.message || 'The email/student number or password is incorrect.'
        );
      }
    } catch (err) {
      Alert.alert(
        'Connection error',
        'Could not reach the server. Check that XAMPP is running and API_BASE_URL in config.js is correct.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <Text style={styles.logo}>
          Student<Text style={styles.logoAccent}>X</Text>Change
        </Text>
        <Text style={styles.subtitle}>Sign in to your campus account</Text>

        {/* Card */}
        <View style={styles.card}>
          {/* Email / Student Number */}
          <Text style={styles.label}>Email or student number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 21908472 or studentnum@richfield.ac.za"
            placeholderTextColor="#adb5bd"
            value={loginId}
            onChangeText={setLoginId}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            maxLength={100}
          />
          <Text style={styles.helper}>
            Use your email address or student number.
          </Text>

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#adb5bd"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Forgot password */}
          <TouchableOpacity
            style={styles.forgotWrap}
            onPress={() =>
              Alert.alert(
                'Forgot password',
                'Password reset will be available soon. For now, contact support or use the website.'
              )
            }
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Sign in button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>
            Don't have an account?{' '}
            <Text style={styles.linkBold}>Register as a student</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#0d6efd',
    letterSpacing: 0.5,
  },
  logoAccent: {
    color: '#f0ad4e',
  },
  subtitle: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 28,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#212529',
    marginBottom: 6,
  },
  helper: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 16,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: 4,
  },
  forgotText: {
    color: '#0d6efd',
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#0d6efd',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  link: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 14,
  },
  linkBold: {
    color: '#0d6efd',
    fontWeight: '700',
  },
});