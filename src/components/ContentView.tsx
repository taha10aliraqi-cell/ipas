import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { ContentItem, ContentStatus, ContentPlatform } from '../api/types';
import { ContentStorage } from '../utils/storage';
import { Colors } from '../theme/colors';

interface ContentViewProps {
  items: ContentItem[];
  onItemsChange: (items: ContentItem[]) => void;
}

const STATUS_CONFIG: Record<
  ContentStatus,
  { label: string; icon: keyof typeof Feather.glyphMap; color: string }
> = {
  idea: { label: 'فكرة فيديو', icon: 'zap', color: Colors.textMuted },
  scripting: { label: 'كتابة السكربت', icon: 'edit-3', color: Colors.cyan },
  shooting: { label: 'قيد التصوير', icon: 'video', color: Colors.amber },
  editing: { label: 'قيد المونتاج', icon: 'scissors', color: '#ec4899' },
  ready: { label: 'جاهز للنشر', icon: 'send', color: Colors.violet },
  published: { label: 'تم النشر', icon: 'check-circle', color: Colors.emerald },
};

const PLATFORM_CONFIG: Record<
  ContentPlatform,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  instagram: { label: 'Instagram', icon: 'logo-instagram', color: '#e1306c' },
  tiktok: { label: 'TikTok', icon: 'logo-tiktok', color: '#ffffff' },
  youtube: { label: 'YouTube', icon: 'logo-youtube', color: '#ff0000' },
  telegram: { label: 'Telegram', icon: 'paper-plane', color: '#0088cc' },
  other: { label: 'أخرى', icon: 'globe-outline', color: Colors.cyan },
};

const STATUS_ORDER: ContentStatus[] = [
  'idea',
  'scripting',
  'shooting',
  'editing',
  'ready',
  'published',
];

export const ContentView: React.FC<ContentViewProps> = ({ items, onItemsChange }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ContentStatus | 'all'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPlatforms, setNewPlatforms] = useState<ContentPlatform[]>(['instagram']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredItems =
    filterStatus === 'all' ? items : items.filter(i => i.status === filterStatus);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await ContentStorage.add({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        status: 'idea',
        platforms: newPlatforms,
      });
      const fresh = await ContentStorage.getAll();
      onItemsChange(fresh);
      setNewTitle('');
      setNewDesc('');
      setNewPlatforms(['instagram']);
      setShowAddModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStatus = async (id: string, currentStatus: ContentStatus) => {
    const idx = STATUS_ORDER.indexOf(currentStatus);
    if (idx < STATUS_ORDER.length - 1) {
      await ContentStorage.update(id, { status: STATUS_ORDER[idx + 1] });
      const fresh = await ContentStorage.getAll();
      onItemsChange(fresh);
    }
  };

  const handleDelete = async (id: string) => {
    await ContentStorage.delete(id);
    const fresh = await ContentStorage.getAll();
    onItemsChange(fresh);
  };

  const togglePlatform = (p: ContentPlatform) => {
    setNewPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const statusCounts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = items.filter(i => i.status === s).length;
    return acc;
  }, {} as Record<ContentStatus, number>);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Add Content Banner */}
        <TouchableOpacity
          style={styles.quickAddBanner}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.85}
        >
          <View style={styles.quickAddIconBox}>
            <Feather name="video" size={20} color="#ffffff" />
          </View>
          <View style={styles.quickAddTextWrap}>
            <Text style={styles.quickAddTitle}>إضافة فكرة أو فيديو جديد</Text>
            <Text style={styles.quickAddSub}>تتبع مسار الإنتاج من الهوك حتى النشر بسوبابيس</Text>
          </View>
        </TouchableOpacity>

        {/* ================= LARGE HORIZONTAL PIPELINE ================= */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>مراحل خط الإنتاج</Text>
          <Text style={styles.sectionSubtitle}>اضغط للفلترة السريعة</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pipelineScroll}
        >
          {STATUS_ORDER.map(s => {
            const cfg = STATUS_CONFIG[s];
            const isSelected = filterStatus === s;
            return (
              <TouchableOpacity
                key={s}
                style={[
                  styles.largeStageCard,
                  isSelected && {
                    borderColor: cfg.color,
                    backgroundColor: Colors.bgCardHover,
                  },
                ]}
                onPress={() => setFilterStatus(filterStatus === s ? 'all' : s)}
                activeOpacity={0.8}
              >
                <View style={[styles.largeStageIconCircle, { backgroundColor: `${cfg.color}18` }]}>
                  <Feather name={cfg.icon} size={16} color={cfg.color} />
                </View>
                <Text style={[styles.largeStageCount, { color: cfg.color }]}>
                  {statusCounts[s]}
                </Text>
                <Text style={styles.largeStageLabel}>{cfg.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ================= CONTENT ITEMS FEED ================= */}
        <View style={[styles.sectionHeaderRow, { marginTop: 18 }]}>
          <Text style={styles.sectionTitle}>قائمة المحتوى</Text>
          <Text style={styles.sectionSubtitle}>
            {filterStatus === 'all' ? 'جميع الفيديوهات' : STATUS_CONFIG[filterStatus]?.label}
          </Text>
        </View>

        {filteredItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Feather name="film" size={36} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>لا يوجد محتوى في هذا المسار</Text>
            <Text style={styles.emptyDesc}>
              أضف أفكارك الجديدة ليتم حفظها مباشرة على سيرفر سوبابيس VPS
            </Text>
          </View>
        ) : (
          filteredItems.map(item => {
            const statusInfo = STATUS_CONFIG[item.status];
            const currentIdx = STATUS_ORDER.indexOf(item.status);
            const nextStatus =
              currentIdx < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIdx + 1] : null;

            return (
              <View key={item.id} style={styles.largeContentCard}>
                <View style={[styles.accentSideBar, { backgroundColor: statusInfo.color }]} />

                <View style={styles.cardContentMain}>
                  {/* Status & Delete */}
                  <View style={styles.cardTopRow}>
                    <View
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor: `${statusInfo.color}15`,
                          borderColor: `${statusInfo.color}40`,
                        },
                      ]}
                    >
                      <Feather name={statusInfo.icon} size={13} color={statusInfo.color} />
                      <Text style={[styles.statusChipText, { color: statusInfo.color }]}>
                        {statusInfo.label}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDelete(item.id)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={styles.deleteBtnBox}
                    >
                      <Feather name="trash-2" size={15} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {/* Title & Desc */}
                  <Text style={styles.largeContentTitle}>{item.title}</Text>
                  {item.description ? (
                    <Text style={styles.largeContentDesc}>{item.description}</Text>
                  ) : null}

                  {/* Bottom Platforms & Action */}
                  <View style={styles.cardBottomRow}>
                    <View style={styles.platformsCluster}>
                      {item.platforms.map(p => {
                        const plat = PLATFORM_CONFIG[p];
                        if (!plat) return null;
                        return (
                          <View key={p} style={styles.largePlatformPill}>
                            <Ionicons name={plat.icon} size={13} color={plat.color} />
                            <Text style={styles.largePlatformText}>{plat.label}</Text>
                          </View>
                        );
                      })}
                    </View>

                    {nextStatus && (
                      <TouchableOpacity
                        style={styles.largeAdvanceBtn}
                        onPress={() => handleNextStatus(item.id, item.status)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.largeAdvanceBtnText}>
                          {STATUS_CONFIG[nextStatus].label}
                        </Text>
                        <Feather name="arrow-left" size={14} color={Colors.primaryLight} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ================= LARGE ADD CONTENT MODAL ================= */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.modalCloseBtn}
              >
                <Feather name="x" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.modalTitleText}>إضافة فكرة أو فيديو جديد</Text>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.largeInputLabel}>عنوان وموضوع المحتوى</Text>
              <TextInput
                style={styles.largeInput}
                placeholder="مثال: أفضل 5 مكتبات ذكاء اصطناعي في 2026..."
                placeholderTextColor={Colors.textMuted}
                value={newTitle}
                onChangeText={setNewTitle}
                textAlign="right"
              />

              <Text style={[styles.largeInputLabel, { marginTop: 18 }]}>
                الهوك / فكرة المحتوى (اختياري)
              </Text>
              <TextInput
                style={styles.largeNotesInput}
                placeholder="اكتب هوك البداية أو محاور الفيديو..."
                placeholderTextColor={Colors.textMuted}
                value={newDesc}
                onChangeText={setNewDesc}
                multiline
                textAlign="right"
              />

              <Text style={[styles.largeInputLabel, { marginTop: 18 }]}>منصات النشر المستهدفة</Text>
              <View style={styles.chipsWrap}>
                {(Object.keys(PLATFORM_CONFIG) as ContentPlatform[]).map(p => {
                  const plat = PLATFORM_CONFIG[p];
                  const isSelected = newPlatforms.includes(p);
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.largeChoiceChip,
                        isSelected && {
                          backgroundColor: Colors.bgCardHover,
                          borderColor: plat.color,
                        },
                      ]}
                      onPress={() => togglePlatform(p)}
                    >
                      <Ionicons
                        name={plat.icon}
                        size={16}
                        color={isSelected ? plat.color : Colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.largeChoiceChipText,
                          isSelected && { color: '#ffffff', fontWeight: '800' },
                        ]}
                      >
                        {plat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.largeSubmitBtn, isSubmitting && { opacity: 0.6 }]}
                onPress={handleAdd}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Feather name="check-circle" size={18} color="#ffffff" />
                <Text style={styles.largeSubmitBtnText}>
                  {isSubmitting ? 'جاري الحفظ في سوبابيس...' : 'حفظ في مسار الإنتاج'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90,
  },

  // Quick Add Banner
  quickAddBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(227, 27, 35, 0.35)',
    padding: 16,
    marginBottom: 18,
    gap: 14,
  },
  quickAddIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  quickAddTextWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  quickAddTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  quickAddSub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 3,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },

  // Pipeline Horizontal Cards
  pipelineScroll: {
    flexDirection: 'row-reverse',
    gap: 10,
    paddingBottom: 6,
  },
  largeStageCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    minWidth: 86,
  },
  largeStageIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  largeStageCount: {
    fontSize: 18,
    fontWeight: '900',
  },
  largeStageLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },

  // Empty State
  emptyCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 32,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Content Cards
  largeContentCard: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  accentSideBar: {
    width: 5,
  },
  cardContentMain: {
    flex: 1,
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteBtnBox: {
    padding: 4,
  },
  largeContentTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: 6,
  },
  largeContentDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'right',
    lineHeight: 19,
    marginBottom: 12,
  },
  cardBottomRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  platformsCluster: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  largePlatformPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  largePlatformText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  largeAdvanceBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(227, 27, 35, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(227, 27, 35, 0.35)',
    gap: 6,
  },
  largeAdvanceBtnText: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '800',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    backgroundColor: Colors.borderHighlight,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitleText: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  modalScroll: {
    padding: 20,
  },
  largeInputLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 8,
  },
  largeInput: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  largeNotesInput: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 80,
    textAlignVertical: 'top',
  },
  chipsWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
  largeChoiceChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.bgCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 8,
  },
  largeChoiceChipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  largeSubmitBtn: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  largeSubmitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
});
