import React, { useState, useEffect } from 'react';
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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

// Same limits as the website's login form
const LOGIN_ID_MAX = 100;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 1024;

// The website pages live next to the api folder, e.g. .../student_marketplace/public/
const WEBSITE_PUBLIC_URL = API_BASE_URL.replace(/\/api\/?$/, '/public');

export default function LoginScreen({ navigation }) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Like the website: someone who is already logged in skips the login page
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const stored = await AsyncStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          if (Number(u?.id || u?.user_id)) {
            navigation.replace('Home');
          }
        }
      } catch (e) {
        // ignore, just show the form
      }
    };
    checkLoggedIn();
  }, []);

  const validate = () => {
    const id = loginId.trim();

    if (!id || !password) {
      return 'Please fill in both fields.';
    }
    if (id.length > LOGIN_ID_MAX) {
      return `Email or student number must be ${LOGIN_ID_MAX} characters or fewer.`;
    }
    if (password.length < PASSWORD_MIN) {
      return `Password must be at least ${PASSWORD_MIN} characters.`;
    }
    if (password.length > PASSWORD_MAX) {
      return 'Password is too long.';
    }
    return '';
  };

  const handleLogin = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login.php`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
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
        setError(
          data.message || 'The email/student number or password is incorrect.'
        );
      }
    } catch (err) {
      setError(
        'Could not reach the server. Check that XAMPP is running and API_BASE_URL in config.js is correct.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Linking.openURL(`${WEBSITE_PUBLIC_URL}/forgotPassword.php`).catch(() =>
      Alert.alert('Error', 'Could not open the password reset page.')
    );
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
        <View style={styles.logoRow}>
          <Ionicons name="storefront" size={26} color="#f0ad4e" />
          <Text style={styles.logo}>
            Student<Text style={styles.logoAccent}>X</Text>Change
          </Text>
        </View>
        <Text style={styles.subtitle}>Sign in to your campus account</Text>

        {/* Card */}
        <View style={styles.card}>
          {/* Error banner (same as the website's red alert) */}
          {error !== '' && (
            <View style={styles.alert}>
              <Ionicons name="warning" size={16} color="#842029" style={{ marginRight: 8 }} />
              <Text style={styles.alertText}>{error}</Text>
            </View>
          )}

          {/* Email / Student Number */}
          <Text style={styles.label}>Email or student number</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Ionicons name="mail-outline" size={18} color="#6c757d" />
            </View>
            <TextInput
              style={styles.inputInner}
              placeholder="student number or email"
              placeholderTextColor="#adb5bd"
              value={loginId}
              onChangeText={(t) => {
                setLoginId(t);
                if (error) setError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="username"
              maxLength={LOGIN_ID_MAX}
              returnKeyType="next"
            />
          </View>
          <Text style={styles.helper}>
            Use your email address or student number.
          </Text>

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (error) setError('');
            }}
            secureTextEntry
            autoComplete="current-password"
            maxLength={PASSWORD_MAX}
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />

          {/* Forgot password */}
          <TouchableOpacity
            style={styles.forgotWrap}
            onPress={() => navigation.navigate('ForgotPassword')}
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
              <View style={styles.buttonInner}>
                <Ionicons name="log-in-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Sign in</Text>
              </View>
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
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    borderWidth: 1,
    borderColor: '#f5c2c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  alertText: { color: '#842029', fontSize: 13, flex: 1 },
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
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    marginBottom: 6,
    overflow: 'hidden',
  },
  inputIcon: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#ced4da',
  },
  inputInner: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#212529',
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
  buttonInner: { flexDirection: 'row', alignItems: 'center' },
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