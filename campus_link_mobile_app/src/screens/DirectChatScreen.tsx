import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const DirectChatScreen = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium">Direct Chat coming soon</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default DirectChatScreen; 