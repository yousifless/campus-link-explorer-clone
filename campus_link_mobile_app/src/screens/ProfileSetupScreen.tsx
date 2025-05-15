import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Snackbar } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';

const ProfileSetupScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      first_name: firstName,
      last_name: lastName,
    });
    setLoading(false);
    if (error) {
      setError(error.message || 'Failed to save profile');
      setShowError(true);
    } else {
      navigation.navigate('Main');
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Profile Setup</Text>
      <TextInput
        label="First Name"
        value={firstName}
        onChangeText={setFirstName}
        style={styles.input}
      />
      <TextInput
        label="Last Name"
        value={lastName}
        onChangeText={setLastName}
        style={styles.input}
      />
      <Button mode="contained" onPress={handleSave} loading={loading} style={styles.button}>
        Save
      </Button>
      <Snackbar visible={showError} onDismiss={() => setShowError(false)}>{error}</Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { marginBottom: 24, textAlign: 'center' },
  input: { marginBottom: 16 },
  button: { marginTop: 8 },
});

export default ProfileSetupScreen; 