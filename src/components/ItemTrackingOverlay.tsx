import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrackedItem } from '../types';

interface ItemTrackingOverlayProps {
  trackedItems: TrackedItem[];
  onItemToggle: (itemId: string) => void;
  onItemPositionUpdate: (itemId: string, x: number, y: number) => void;
  onItemTimingUpdate: (itemId: string, startTime: number, endTime: number) => void;
  currentTime: number;
  videoDuration: number;
  style?: any;
}

const { width: screenWidth } = Dimensions.get('window');

export const ItemTrackingOverlay: React.FC<ItemTrackingOverlayProps> = ({
  trackedItems,
  onItemToggle,
  onItemPositionUpdate,
  onItemTimingUpdate,
  currentTime,
  videoDuration,
  style
}) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleItemPress = (itemId: string) => {
    if (selectedItem === itemId) {
      setSelectedItem(null);
    } else {
      setSelectedItem(itemId);
    }
  };

  const handleItemLongPress = (itemId: string) => {
    setIsDragging(true);
    setSelectedItem(itemId);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[{ position: 'relative' }, style]}>
      {/* Tracking overlays on video */}
      {trackedItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={{
            position: 'absolute',
            left: `${item.x}%`,
            top: `${item.y}%`,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: item.isSelected 
              ? 'rgba(99, 102, 241, 0.9)' 
              : selectedItem === item.id 
                ? 'rgba(255, 193, 7, 0.9)'
                : 'rgba(255, 255, 255, 0.8)',
            borderWidth: 3,
            borderColor: item.isSelected 
              ? '#6366f1' 
              : selectedItem === item.id 
                ? '#ffc107'
                : '#64748b',
            justifyContent: 'center',
            alignItems: 'center',
            transform: [{ translateX: -30 }, { translateY: -30 }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
            zIndex: selectedItem === item.id ? 10 : 1,
          }}
          onPress={() => onItemToggle(item.id)}
          onLongPress={() => handleItemLongPress(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={item.isSelected ? "checkmark" : "add"} 
            size={24} 
            color={item.isSelected ? "#ffffff" : "#6366f1"} 
          />
          
          {/* Selection indicator */}
          {item.isSelected && (
            <View style={{
              position: 'absolute',
              top: -5,
              right: -5,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: '#22c55e',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#ffffff',
            }}>
              <Ionicons name="checkmark" size={12} color="#ffffff" />
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* Item selection panel */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
      }}>
        <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
          Detected Items ({trackedItems.filter(item => item.isSelected).length} selected)
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {trackedItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={{
                backgroundColor: item.isSelected ? '#6366f1' : '#374151',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 20,
                marginRight: 12,
                borderWidth: 2,
                borderColor: item.isSelected ? '#6366f1' : '#4b5563',
                minWidth: 80,
                alignItems: 'center',
              }}
              onPress={() => onItemToggle(item.id)}
            >
              <Text style={{ 
                color: item.isSelected ? '#ffffff' : '#f8fafc', 
                fontSize: 14, 
                fontWeight: '600',
                textAlign: 'center',
              }}>
                {item.name}
              </Text>
              {item.isSelected && (
                <Ionicons name="checkmark" size={16} color="#ffffff" style={{ marginTop: 4 }} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Timeline indicator */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>
            Current Time: {formatTime(currentTime)} / {formatTime(videoDuration)}
          </Text>
          
          <View style={{ 
            height: 6, 
            backgroundColor: '#374151', 
            borderRadius: 3,
            overflow: 'hidden',
          }}>
            <View style={{
              height: '100%',
              backgroundColor: '#6366f1',
              width: `${(currentTime / videoDuration) * 100}%`,
              borderRadius: 3,
            }} />
          </View>
        </View>

        {/* Instructions */}
        <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="information-circle-outline" size={16} color="#6366f1" />
          <Text style={{ color: '#94a3b8', fontSize: 12, marginLeft: 8, flex: 1 }}>
            Tap items to select/deselect • Long press to reposition • Selected items will be made shoppable
          </Text>
        </View>
      </View>

      {/* Selected item details */}
      {selectedItem && (
        <View style={{
          position: 'absolute',
          top: 20,
          right: 20,
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          padding: 16,
          borderRadius: 12,
          maxWidth: 200,
        }}>
          <Text style={{ color: '#f8fafc', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
            {trackedItems.find(item => item.id === selectedItem)?.name}
          </Text>
          
          <View style={{ marginBottom: 8 }}>
            <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>
              Position: {Math.round(trackedItems.find(item => item.id === selectedItem)?.x || 0)}%, {Math.round(trackedItems.find(item => item.id === selectedItem)?.y || 0)}%
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>
              Timing: {formatTime(trackedItems.find(item => item.id === selectedItem)?.startTime || 0)} - {formatTime(trackedItems.find(item => item.id === selectedItem)?.endTime || 0)}
            </Text>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: '#6366f1',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 6,
              alignItems: 'center',
            }}
            onPress={() => setSelectedItem(null)}
          >
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}; 