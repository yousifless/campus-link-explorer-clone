import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TextInput as RNTextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, ActivityIndicator, Avatar, IconButton } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useConversations } from '../contexts/ConversationContext';

const ConversationScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { getConversation, getMessages, sendMessage } = useConversations();
  const { conversationId } = route.params || {};
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const conv = await getConversation(conversationId);
    setConversation(conv);
    const msgs = await getMessages(conversationId);
    setMessages(msgs);
    setLoading(false);
  }, [conversationId, getConversation, getMessages]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    const newMsg = await sendMessage(conversationId, message);
    if (newMsg) setMessages(prev => [...prev, newMsg]);
    setMessage('');
    setSending(false);
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 48 }} />;
  }

  if (!conversation) {
    return (
      <View style={styles.emptyState}>
        <Text variant="titleMedium">Conversation not found</Text>
        <Button onPress={() => navigation.goBack()}>Go back</Button>
      </View>
    );
  }

  // TODO: Replace with actual user info from conversation
  const otherUser = conversation.other_user || { first_name: 'User', last_name: '', avatar_url: '' };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Avatar.Image size={40} source={{ uri: otherUser.avatar_url || undefined }} />
        <Text variant="titleMedium" style={{ marginLeft: 8 }}>{otherUser.first_name} {otherUser.last_name}</Text>
      </View>
      <ScrollView style={styles.messagesContainer} contentContainerStyle={{ padding: 16 }}>
        {messages.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#888' }}>No messages yet. Start the conversation!</Text>
        ) : (
          messages.map(msg => (
            <View key={msg.id} style={[styles.messageBubble, msg.sender_id === otherUser.id ? styles.received : styles.sent]}>
              <Text style={{ color: msg.sender_id === otherUser.id ? '#222' : '#fff' }}>{msg.content}</Text>
              <Text style={styles.timestamp}>{new Date(msg.created_at).toLocaleTimeString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
      <View style={styles.inputContainer}>
        <RNTextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          editable={!sending}
        />
        <Button mode="contained" onPress={handleSend} loading={sending} disabled={sending || !message.trim()} style={styles.sendButton}>
          Send
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  messagesContainer: { flex: 1, backgroundColor: '#f9f9f9' },
  messageBubble: { borderRadius: 16, padding: 10, marginBottom: 8, maxWidth: '75%' },
  sent: { alignSelf: 'flex-end', backgroundColor: '#4f8cff' },
  received: { alignSelf: 'flex-start', backgroundColor: '#e5e5ea' },
  timestamp: { fontSize: 10, color: '#888', marginTop: 4, textAlign: 'right' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 8, borderTopWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  sendButton: { borderRadius: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default ConversationScreen; 