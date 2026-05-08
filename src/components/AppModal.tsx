import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export interface AppModalButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AppModalProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AppModalButton[];
  icon?: string;
  iconColor?: string;
  onClose?: () => void;
}

const AppModal = ({ visible, title, message, buttons, icon, iconColor = '#CC3366', onClose }: AppModalProps) => {
  const isTwo = buttons.length === 2;

  const btnStyle = (btn: AppModalButton) => {
    if (btn.style === 'cancel') return { bg: '#F3F4F6', text: '#374151' };
    if (btn.style === 'destructive') return { bg: '#EF4444', text: '#FFFFFF' };
    return { bg: '#CC3366', text: '#FFFFFF' };
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ width: '100%', maxWidth: 340 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center' }}>
            {icon ? (
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${iconColor}18`, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon name={icon} size={30} color={iconColor} />
              </View>
            ) : null}

            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: message ? 8 : 20 }}>
              {title}
            </Text>

            {message ? (
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 20 }}>
                {message}
              </Text>
            ) : null}

            {isTwo ? (
              <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                {buttons.map((btn, idx) => {
                  const s = btnStyle(btn);
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={btn.onPress}
                      style={{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', backgroundColor: s.bg }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: s.text }}>{btn.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={{ width: '100%', gap: 8 }}>
                {buttons.map((btn, idx) => {
                  const s = btnStyle(btn);
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={btn.onPress}
                      style={{ paddingVertical: 13, borderRadius: 12, alignItems: 'center', backgroundColor: s.bg }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: s.text }}>{btn.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default AppModal;
