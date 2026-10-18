import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

interface HeaderProps {
  activeTab: string;
  tasksCount: number;
  todayTasksDone: number;
  onRefresh?: () => void;
  isSyncing?: boolean;
  onOpenCalculator?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tasksCount,
  todayTasksDone,
  onRefresh,
  isSyncing,
  onOpenCalculator,
}) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-IQ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.container}>
      {/* Top Identity Row */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <Image
            source={require('../../assets/logo-ta.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
          <View style={styles.brandDetails}>
            <View style={styles.nameBadgeRow}>
              <Text style={styles.personName}>طه سعد</Text>
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="check-decagram" size={17} color={Colors.primary} />
              </View>
            </View>
            <Text style={styles.rolesSubtitle}>صانع محتوى • مدرب تقني • مبرمج • موظف</Text>
          </View>
        </View>

        {/* Profile Avatar & Calculator Button */}
        <View style={styles.topActionsGroup}>
          {onOpenCalculator && (
            <TouchableOpacity
              style={styles.calcHeaderBtn}
              onPress={onOpenCalculator}
              activeOpacity={0.8}
            >
              <Feather name="cpu" size={18} color={Colors.primaryLight} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={onRefresh}
            activeOpacity={0.8}
          >
            <Image
              source={require('../../assets/profile.jpg')}
              style={styles.profileImage}
            />
            <View style={styles.onlineDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Date & Server Sync Strip */}
      <View style={styles.statsStrip}>
        <View style={styles.dateBlock}>
          <Feather name="calendar" size={16} color={Colors.primaryLight} />
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>

        <TouchableOpacity style={styles.syncStatusPill} onPress={onRefresh} activeOpacity={0.7}>
          <View style={[styles.serverDot, isSyncing && { backgroundColor: Colors.amber }]} />
          <Text style={styles.serverText}>
            {isSyncing ? 'مزامنة سوبابيس...' : 'سيرفر VPS متصل'}
          </Text>
          <Feather name="refresh-cw" size={12} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  topRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
  },
  logoImage: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(227, 27, 35, 0.45)',
  },
  brandDetails: {
    alignItems: 'flex-end',
  },
  nameBadgeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  personName: {
    color: Colors.textPrimary,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  verifiedBadge: {
    marginTop: 2,
  },
  rolesSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  topActionsGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  calcHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(227, 27, 35, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(227, 27, 35, 0.35)',
  },
  avatarWrapper: {
    position: 'relative',
    padding: 3,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.bgCard,
  },
  profileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.emerald,
    borderWidth: 2.5,
    borderColor: Colors.bgSecondary,
  },
  statsStrip: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  dateBlock: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    color: Colors.silver,
    fontSize: 13,
    fontWeight: '700',
  },
  syncStatusPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serverDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.emerald,
  },
  serverText: {
    color: Colors.silverMuted,
    fontSize: 11,
    fontWeight: '700',
  },
});
