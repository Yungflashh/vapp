import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../services/api.config';

interface VersionConfig {
  latestVersion: string;
  minVersion: string;
  iosStoreUrl: string;
  androidStoreUrl: string;
  updateMessage: string;
  isForceUpdate: boolean;
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const a = parts1[i] ?? 0;
    const b = parts2[i] ?? 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

export default function AppUpdateChecker() {
  const [config, setConfig] = useState<VersionConfig | null>(null);
  const [updateState, setUpdateState] = useState<'none' | 'optional' | 'force'>('none');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkVersion();
  }, []);

  const checkVersion = async () => {
    try {
      const res = await api.get('/app/version');
      if (!res.data.success) return;
      const cfg: VersionConfig = res.data.data;
      setConfig(cfg);

      const currentVersion = Constants.expoConfig?.version ?? '1.0.0';

      if (compareVersions(currentVersion, cfg.minVersion) < 0) {
        setUpdateState('force');
      } else if (compareVersions(currentVersion, cfg.latestVersion) < 0) {
        setUpdateState('optional');
      }
    } catch {
      // Silently fail — never block the app if the version check itself fails
    }
  };

  const openStore = () => {
    if (!config) return;
    const url = Platform.OS === 'ios' ? config.iosStoreUrl : config.androidStoreUrl;
    if (url) Linking.openURL(url);
  };

  if (!config || updateState === 'none') return null;
  if (updateState === 'optional' && dismissed) return null;

  const isForce = updateState === 'force';

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.65)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 24,
            padding: 28,
            width: '100%',
            maxWidth: 360,
            alignItems: 'center',
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#FFF0F5',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Icon name="rocket" size={40} color="#CC3366" />
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: '#111827',
              textAlign: 'center',
              marginBottom: 10,
            }}
          >
            {isForce ? 'Update Required' : 'New Update Available'}
          </Text>

          {/* Message */}
          <Text
            style={{
              fontSize: 14,
              color: '#6B7280',
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 28,
            }}
          >
            {config.updateMessage ||
              (isForce
                ? 'This version of VendorSpot is no longer supported. Please update to continue.'
                : 'A new version of VendorSpot is available with improvements and new features.')}
          </Text>

          {/* Update button */}
          <TouchableOpacity
            onPress={openStore}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#CC3366',
              borderRadius: 14,
              paddingVertical: 15,
              width: '100%',
              alignItems: 'center',
              marginBottom: isForce ? 0 : 12,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              {Platform.OS === 'ios' ? 'Update on App Store' : 'Update on Play Store'}
            </Text>
          </TouchableOpacity>

          {/* Dismiss — only for optional updates */}
          {!isForce && (
            <TouchableOpacity
              onPress={() => setDismissed(true)}
              style={{ paddingVertical: 10 }}
            >
              <Text style={{ color: '#9CA3AF', fontSize: 14 }}>Maybe Later</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}
