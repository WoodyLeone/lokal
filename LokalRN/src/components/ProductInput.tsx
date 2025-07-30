import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProductInputProps {
  manualProductName: string;
  setManualProductName: (name: string) => void;
  affiliateLink: string;
  setAffiliateLink: (link: string) => void;
  onToggle: () => void;
  isExpanded: boolean;
}

export const ProductInput: React.FC<ProductInputProps> = ({
  manualProductName,
  setManualProductName,
  affiliateLink,
  setAffiliateLink,
  onToggle,
  isExpanded
}) => {
  const [isValidLink, setIsValidLink] = useState(true);

  const validateUrl = (url: string) => {
    if (!url) return true; // Empty is valid
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleAffiliateLinkChange = (link: string) => {
    setAffiliateLink(link);
    setIsValidLink(validateUrl(link));
  };

  return (
    <View style={styles.container}>
      {/* Header with toggle */}
      <TouchableOpacity onPress={onToggle} style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons 
            name="bag-outline" 
            size={20} 
            color="#6366f1" 
            style={styles.headerIcon}
          />
          <Text style={styles.headerText}>Product Information (Optional)</Text>
        </View>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#94a3b8" 
        />
      </TouchableOpacity>

      {/* Expandable content */}
      {isExpanded && (
        <View style={styles.content}>
          {/* Product Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name</Text>
            <TextInput
              value={manualProductName}
              onChangeText={setManualProductName}
              placeholder="Enter product name (optional)"
              placeholderTextColor="#64748b"
              style={styles.textInput}
            />
            <Text style={styles.helperText}>
              If provided, this will be used as the primary product match
            </Text>
          </View>

          {/* Affiliate Link Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Affiliate Link</Text>
            <TextInput
              value={affiliateLink}
              onChangeText={handleAffiliateLinkChange}
              placeholder="https://example.com/product"
              placeholderTextColor="#64748b"
              style={[
                styles.textInput,
                !isValidLink && affiliateLink && styles.errorInput
              ]}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            {!isValidLink && affiliateLink && (
              <Text style={styles.errorText}>
                Please enter a valid URL
              </Text>
            )}
            <Text style={styles.helperText}>
              Optional affiliate link for the product
            </Text>
          </View>

          {/* Info box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#6366f1" />
            <Text style={styles.infoText}>
              If you don't provide a product name, our AI will detect objects in your video and suggest matches.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    color: '#f8fafc',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  errorInput: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
}); 