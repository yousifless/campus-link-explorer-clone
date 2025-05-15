import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { useMatching } from '../contexts/MatchingContext';
import MatchCard from '../components/MatchCard';

const MatchesScreen = () => {
  const { matches, loading } = useMatching();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Your Matches</Text>
      {loading ? <ActivityIndicator /> : (
        matches.length === 0 ? <Text>No matches found.</Text> :
        matches.map(match => (
          <MatchCard
            key={match.id}
            profile={match.otherUser}
            onMessage={() => {}}
            onView={() => {}}
          />
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { marginBottom: 16, textAlign: 'center' },
  card: { marginBottom: 16 },
});

export default MatchesScreen; 