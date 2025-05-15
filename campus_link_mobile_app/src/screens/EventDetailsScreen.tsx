import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Text, ActivityIndicator, Button, Card, Avatar } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useMeetups } from '../contexts/MeetupsContext';
import { useAuth } from '../contexts/AuthContext';

const EventDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { fetchMeetupById } = useMeetups();
  const { user } = useAuth();
  const { meetupId } = route.params || {};
  const [meetup, setMeetup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const m = await fetchMeetupById(meetupId);
      setMeetup(m);
      setLoading(false);
    };
    fetchData();
  }, [meetupId, fetchMeetupById]);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 48 }} />;
  }

  if (!meetup) {
    return (
      <View style={styles.emptyState}>
        <Text variant="titleMedium">Meetup not found</Text>
        <Button onPress={() => navigation.goBack()}>Go back</Button>
      </View>
    );
  }

  let otherUser = meetup.sender;
  if (user && meetup.sender_id === user.id) {
    otherUser = meetup.receiver;
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title
          title={`Meetup with ${otherUser.first_name} ${otherUser.last_name}`}
          subtitle={meetup.location_name}
          left={() => (
            <Avatar.Text size={48} label={otherUser.first_name[0] + otherUser.last_name[0]} />
          )}
        />
        <Card.Content>
          <Text>Date: {meetup.date}</Text>
          <Text>Status: {meetup.status}</Text>
          <Text>Location: {meetup.location_name}</Text>
          <Text>Notes: {meetup.notes || 'None'}</Text>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => navigation.navigate('Chat', { conversationId: meetup.match_id })}>Message</Button>
          {meetup.location_lat && meetup.location_lng && (
            <Button onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${meetup.location_lat},${meetup.location_lng}`)}>
              Directions
            </Button>
          )}
        </Card.Actions>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  card: { marginBottom: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default EventDetailsScreen; 