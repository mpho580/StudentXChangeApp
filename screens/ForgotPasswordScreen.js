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
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

// Same limits as the website's forms
const LOGIN_ID_MAX = 100;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 1024;

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState('find'); // 'find' -> 'reset'
  const [loginId, setLoginId] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const postJson = async (endpoint, body) => {
    const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const handleFind = async () => {
    const id = loginId.trim();
    if (!id) {
      setError('Please enter your email or student number.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = await postJson('forgot_password.php', { login_id: id });
      if (data.success && data.reset_token) {
        setResetToken(data.reset_token);
        setStep('reset');
      } else {
        setError(data.message || 'No account was found with those details.');
      }
    } catch (e) {
      setError('Could not reach the server. Check that XAMPP is running and API_BASE_URL in config.js is correct.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (newPassword === '' || confirmPassword === '') {
      setError('Please enter and confirm your new password.');
      return;
    }
    if (newPassword.length < PASSWORD_MIN) {
      setError('Your new password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = await postJson('reset_password.php', {
        reset_token: resetToken,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (data.success) {
        Alert.alert(
          'Password changed',
          data.message || 'Your password has been changed successfully. You can now sign in.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else if (data.expired) {
        // Same as the website sending you back to start again
        setResetToken('');
        setNewPassword('');
        setConfirmPassword('');
        setStep('find');
        setError(data.message || 'Please start the password reset process again.');
      } else {
        setError(data.message || 'Unable to change your password. Please try again.');
      }
    } catch (e) {
      setError('Could not reach the server. Check that XAMPP is running and API_BASE_URL in config.js is correct.');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    if (error) setError('');
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
        <Text style={styles.subtitle}>
          {step === 'find' ? 'Reset your password' : 'Create a new password'}
        </Text>

        <View style={styles.card}>
          <Text style={styles.heading}>
            {step === 'find' ? 'Forgot your password?' : 'Create a new password'}
          </Text>
          <Text style={styles.sub}>
            {step === 'find'
              ? 'Enter your email address or student number to create a new password.'
              : 'Enter your new password below.'}
          </Text>

          {error !== '' && (
            <View style={styles.alert}>
              <Ionicons name="warning" size={16} color="#842029" style={{ marginRight: 8 }} />
              <Text style={styles.alertText}>{error}</Text>
            </View>
          )}

          {step === 'find' ? (
            <>
              <Text style={styles.label}>Email or student number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email or student number"
                placeholderTextColor="#adb5bd"
                value={loginId}
                onChangeText={(t) => {
                  setLoginId(t);
                  clearError();
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                maxLength={LOGIN_ID_MAX}
                returnKeyType="go"
                onSubmitEditing={handleFind}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleFind}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.buttonInner}>
                    <Ionicons name="key" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>Continue</Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>New password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={(t) => {
                  setNewPassword(t);
                  clearError();
                }}
                secureTextEntry
                autoComplete="new-password"
                maxLength={PASSWORD_MAX}
              />
              <Text style={styles.helper}>Password must be at least 6 characters.</Text>

              <Text style={styles.label}>Confirm new password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  clearError();
                }}
                secureTextEntry
                autoComplete="new-password"
                maxLength={PASSWORD_MAX}
                returnKeyType="go"
                onSubmitEditing={handleReset}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleReset}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.buttonInner}>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>Create New Password</Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.backWrap}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="arrow-back" size={14} color="#0d6efd" />
            <Text style={styles.backText}>Back to login</Text>
          </TouchableOpacity>
        </View>
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
  logoAccent: { color: '#f0ad4e' },
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
  },
  heading: { fontSize: 18, fontWeight: '800', color: '#212529', marginBottom: 6 },
  sub: { fontSize: 13, color: '#6c757d', marginBottom: 16, lineHeight: 19 },
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
  label: { fontSize: 13, fontWeight: '700', color: '#212529', marginBottom: 6 },
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
  helper: { fontSize: 12, color: '#6c757d', marginBottom: 14 },
  button: {
    backgroundColor: '#0d6efd',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonInner: { flexDirection: 'row', alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  backWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
  },
  backText: { color: '#0d6efd', fontSize: 13, fontWeight: '600' },
});