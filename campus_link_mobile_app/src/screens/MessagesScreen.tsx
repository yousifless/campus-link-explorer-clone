import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useConversations } from '../contexts/ConversationContext';
import MessageCard from '../components/MessageCard';
import { useNavigation } from '@react-navigation/native';

const MessagesScreen = () => {
  const { conversations, loading } = useConversations();
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Messages</Text>
      {loading ? <ActivityIndicator /> : (
        conversations.length === 0 ? <Text>No conversations found.</Text> :
        conversations.map(conv => (
          <MessageCard
            key={conv.id}
            conversation={conv}
            onOpen={() => navigation.navigate('Chat', { conversationId: conv.id })}
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

export default MessagesScreen; 