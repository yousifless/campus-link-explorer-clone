import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, ActivityIndicator, Button, Avatar, ProgressBar } from 'react-native-paper';
import { useProfile } from '../contexts/ProfileContext';
import { useNavigation } from '@react-navigation/native';

const getCompletion = (profile) => {
  let fields = [profile.first_name, profile.last_name, profile.email, profile.university_id, profile.major_id, profile.student_type, profile.bio, profile.languages, profile.interests];
  let filled = fields.filter(f => f && (Array.isArray(f) ? f.length > 0 : true)).length;
  return filled / fields.length;
};

const ProfileScreen = () => {
  const { profile, loading } = useProfile();
  const navigation = useNavigation();

  if (loading) {
    return <ActivityIndicator style={{ flex: 1, marginTop: 32 }} />;
  }

  if (!profile) {
    return <Text style={{ margin: 32 }}>No profile found.</Text>;
  }

  const completion = getCompletion(profile);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title
          title={`${profile.first_name} ${profile.last_name}`}
          left={() => (
            <Avatar.Text size={48} label={profile.first_name[0] + profile.last_name[0]} />
            // TODO: Add avatar upload/change functionality
          )}
        />
        <Card.Content>
          <ProgressBar progress={completion} style={styles.progress} />
          <Text style={styles.completionText}>{Math.round(completion * 100)}% Profile Complete</Text>
          <Text>Email: {profile.email || 'N/A'}</Text>
          <Text>University: {profile.university_id || 'N/A'}</Text>
          <Text>Major: {profile.major_id || 'N/A'}</Text>
          <Text>Type: {profile.student_type || 'N/A'}</Text>
          <Text>Bio: {profile.bio || 'N/A'}</Text>
          <Text>Languages: {Array.isArray(profile.languages) ? profile.languages.join(', ') : 'N/A'}</Text>
          <Text>Interests: {Array.isArray(profile.interests) ? profile.interests.join(', ') : 'N/A'}</Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="outlined" onPress={() => navigation.navigate('ProfileSetup')}>Edit Profile</Button>
        </Card.Actions>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginBottom: 16 },
  progress: { marginVertical: 8 },
  completionText: { marginBottom: 8 },
});

export default ProfileScreen; 