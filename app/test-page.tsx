import React from 'react';
import { View, Text } from 'react-native';

export default function TestPage() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text style={{ fontSize: 28, fontWeight: '700', color: '#0B1F3A' }}>TEST PAGE WORKS</Text>
      <Text style={{ fontSize: 14, color: '#666', marginTop: 12 }}>If you see this, basic routing is OK.</Text>
    </View>
  );
}
