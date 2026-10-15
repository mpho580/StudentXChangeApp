import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { API_BASE_URL } from '../config';

// --- Same rules as website register.php ---

function isStrongPassword(password) {
  if (password.length < 6) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

function isStudentEmail(email) {
  const e = email.trim().toLowerCase();
  if (!e.includes('@')) return false;
  return e.endsWith('@my.richfield.ac.za');
}

function studentNumberMatchesEmail(studentNumber, email) {
  const cleanNum = String(studentNumber).replace(/[^a-z0-9]/gi, '').toLowerCase();
  const local = email.trim().toLowerCase().split('@')[0] || '';
  return cleanNum !== '' && local.includes(cleanNum);
}

function isLettersOnly(value) {
  return /^[a-zA-Z\s'-]+$/.test(value.trim());
}

function isNumbersOnly(value) {
  return /^[0-9]+$/.test(value.trim());
}

export default function RegisterScreen({ navigation }) {
  const [studentNumber, setStudentNumber] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};

    if (!studentNumber.trim()) {
      errors.student_number = 'Student number is required.';
    } else if (!isNumbersOnly(studentNumber)) {
      errors.student_number = 'Student number can only contain numbers.';
    }

    if (!name.trim()) {
      errors.name = 'Name is required.';
    } else if (!isLettersOnly(name)) {
      errors.name = 'Name can only contain letters (no numbers).';
    }

    if (!surname.trim()) {
      errors.surname = 'Surname is required.';
    } else if (!isLettersOnly(surname)) {
      errors.surname = 'Surname can only contain letters (no numbers).';
    }

    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    } else if (!isStudentEmail(email)) {
      errors.email = 'Only institutional student emails are allowed (e.g. @my.richfield.ac.za).';
    }

    if (!errors.student_number && !errors.email) {
      if (!studentNumberMatchesEmail(studentNumber, email)) {
        errors.student_number = 'Student number must match the number in your institutional email.';
        errors.email = 'Your email must contain your student number.';
      }
    }

    if (!phone.trim()) {
      errors.phone = 'Cellphone number is required.';
    } else if (!isNumbersOnly(phone)) {
      errors.phone = 'Phone number can only contain numbers.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (!isStrongPassword(password)) {
      errors.password =
        'Must be at least 6 characters and contain 1 uppercase, 1 lowercase, 1 number and 1 special character.';
    }

    if (!confirmPassword) {
      errors.confirm_password = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirm_password = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      Alert.alert('Check the form', 'Please fix the highlighted fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_number: studentNumber.trim(),
          name: name.trim(),
          surname: surname.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Registration successful', 'You can now log in.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        // Map server message to fields when possible
        const msg = data.message || 'Please try again.';
        const next = { ...fieldErrors };
        if (/email/i.test(msg)) next.email = msg;
        else if (/student/i.test(msg)) next.student_number = msg;
        else if (/password/i.test(msg)) next.password = msg;
        setFieldErrors(next);
        Alert.alert('Registration failed', msg);
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

  const inputStyle = (key) => [
    styles.input,
    fieldErrors[key] ? styles.inputError : null,
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>
          Student<Text style={styles.logoX}>X</Text>Change
        </Text>
        <Text style={styles.subtitle}>
          Create a campus-verified peer-to-peer trading account
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Student Number *</Text>
          <TextInput
            style={inputStyle('student_number')}
            placeholder="e.g. 21908472"
            placeholderTextColor="#adb5bd"
            value={studentNumber}
            onChangeText={setStudentNumber}
            keyboardType="number-pad"
            autoCapitalize="none"
          />
          {fieldErrors.student_number ? (
            <Text style={styles.errorText}>{fieldErrors.student_number}</Text>
          ) : null}

          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={inputStyle('name')}
            placeholder="First name"
            placeholderTextColor="#adb5bd"
            value={name}
            onChangeText={setName}
          />
          {fieldErrors.name ? (
            <Text style={styles.errorText}>{fieldErrors.name}</Text>
          ) : null}

          <Text style={styles.label}>Surname *</Text>
          <TextInput
            style={inputStyle('surname')}
            placeholder="Surname"
            placeholderTextColor="#adb5bd"
            value={surname}
            onChangeText={setSurname}
          />
          {fieldErrors.surname ? (
            <Text style={styles.errorText}>{fieldErrors.surname}</Text>
          ) : null}

          <Text style={styles.label}>Institutional Email *</Text>
          <TextInput
            style={inputStyle('email')}
            placeholder="e.g. 21908472@my.richfield.ac.za"
            placeholderTextColor="#adb5bd"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
          {fieldErrors.email ? (
            <Text style={styles.errorText}>{fieldErrors.email}</Text>
          ) : (
            <Text style={styles.helper}>Requires institutional university domains.</Text>
          )}

          <Text style={styles.label}>WhatsApp / Phone Number *</Text>
          <TextInput
            style={inputStyle('phone')}
            placeholder="e.g. 0712345678"
            placeholderTextColor="#adb5bd"
            value={phone}
            onChangeText={setPhone}
            keyboardType="number-pad"
          />
          {fieldErrors.phone ? (
            <Text style={styles.errorText}>{fieldErrors.phone}</Text>
          ) : (
            <Text style={styles.helper}>Numbers only.</Text>
          )}

          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={inputStyle('password')}
            placeholder="Strong password"
            placeholderTextColor="#adb5bd"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {fieldErrors.password ? (
            <Text style={styles.errorText}>{fieldErrors.password}</Text>
          ) : (
            <Text style={styles.helper}>
              6+ chars, uppercase, lowercase, number, special character.
            </Text>
          )}

          <Text style={styles.label}>Confirm Password *</Text>
          <TextInput
            style={inputStyle('confirm_password')}
            placeholder="Re-enter password"
            placeholderTextColor="#adb5bd"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          {fieldErrors.confirm_password ? (
            <Text style={styles.errorText}>{fieldErrors.confirm_password}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Register Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>
            Already have a verified account?{' '}
            <Text style={styles.linkBold}>Sign In</Text>
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
  },
  logoX: {
    color: '#f0ad4e',
  },
  subtitle: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 24,
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
    marginTop: 4,
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
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginBottom: 8,
  },
  helper: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#0d6efd',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
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