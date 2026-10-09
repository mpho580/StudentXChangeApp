import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { API_BASE_URL } from '../config';

export default function RegisterScreen({ navigation }) {
  const [studentNumber, setStudentNumber] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!studentNumber || !name || !surname || !email || !password) {
      Alert.alert('Missing info', 'Please fill in all mandatory fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_number: studentNumber,
          name: name,
          surname: surname,
          email: email,
          phone: phone,
          password: password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Registration successful', 'You can now log in.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert('Registration failed', data.message || 'Please try again.');
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logo}>
        Student<Text style={styles.logoX}>X</Text>Change
      </Text>
      <Text style={styles.subtitle}>Create a campus-verified account</Text>

      <TextInput
        style={styles.input}
        placeholder="Student Number"
        value={studentNumber}
        onChangeText={setStudentNumber}
      />

      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Surname"
        value={surname}
        onChangeText={setSurname}
      />

      <TextInput
        style={styles.input}
        placeholder="Institutional Email (@my.richfield.ac.za)"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="WhatsApp/Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0d6efd',
    textAlign: 'center',
    marginBottom: 5,
  },
  logoX: {
    color: '#f0ad4e',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  subtitle: {
    textAlign: 'center',
    color: '#6c757d',
    marginBottom: 24,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    fontSize: 15,
  },
  button: {
    backgroundColor: '#0d6efd',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  link: {
    textAlign: 'center',
    color: '#0d6efd',
    marginTop: 18,
    fontWeight: '600',
  },
});