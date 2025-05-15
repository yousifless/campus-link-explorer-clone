import React from 'react';
import { Modal, View, StyleSheet, TouchableWithoutFeedback } from 'react-native';

interface DialogProps {
  visible?: boolean;
  onRequestClose?: () => void;
  children?: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ visible = false, onRequestClose, children }) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <TouchableWithoutFeedback onPress={onRequestClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View style={styles.container}>{children}</View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 4,
  },
});

export { Dialog };
export default Dialog; 