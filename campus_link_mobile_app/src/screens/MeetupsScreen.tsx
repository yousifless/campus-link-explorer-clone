import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { useMeetups } from '../contexts/MeetupsContext';
import MeetupCard from '../components/MeetupCard';
import { useNavigation } from '@react-navigation/native';

const groupByStatus = (meetups) => {
  const groups = {};
  meetups.forEach(m => {
    if (!groups[m.status]) groups[m.status] = [];
    groups[m.status].push(m);
  });
  return groups;
};

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  sipped: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

const MeetupsScreen = () => {
  const { meetups, loading, acceptMeetup, declineMeetup } = useMeetups();
  const navigation = useNavigation();
  const grouped = groupByStatus(meetups);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Your Meetups</Text>
      <Button mode="contained" style={styles.scheduleBtn} onPress={() => {
        // TODO: Implement scheduling logic/modal for creating a new meetup
      }}>
        Schedule Meetup
      </Button>
      {loading ? <ActivityIndicator /> : (
        meetups.length === 0 ? <Text>No meetups found.</Text> :
        Object.entries(grouped).map(([status, items]) => (
          <View key={status} style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>{statusLabels[status] || status}</Text>
            {items.map(meetup => (
              <MeetupCard
                key={meetup.id}
                meetup={meetup}
                onView={() => navigation.navigate('EventDetails', { meetupId: meetup.id })}
              >
                {meetup.status === 'pending' && (
                  <>
                    <Button onPress={() => acceptMeetup(meetup.id)}>Accept</Button>
                    <Button onPress={() => declineMeetup(meetup.id)}>Decline</Button>
                  </>
                )}
                <Button onPress={() => navigation.navigate('Chat', { conversationId: meetup.match_id })}>
                  Message
                </Button>
              </MeetupCard>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { marginBottom: 16, textAlign: 'center' },
  scheduleBtn: { marginBottom: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { marginBottom: 8 },
});

export default MeetupsScreen; 