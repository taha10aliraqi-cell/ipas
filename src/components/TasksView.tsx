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
import { Feather } from '@expo/vector-icons';
import { Task, TaskStatus, TaskPriority } from '../api/types';
import { TaskStorage } from '../utils/storage';
import { Colors } from '../theme/colors';

interface TasksViewProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
}

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; icon: keyof typeof Feather.glyphMap; color: string }
> = {
  pending: { label: 'في الانتظار', icon: 'clock', color: Colors.statusPending },
  in_progress: { label: 'قيد التنفيذ', icon: 'zap', color: Colors.amber },
  done: { label: 'مكتملة', icon: 'check-circle', color: Colors.emerald },
  cancelled: { label: 'ملغاة', icon: 'x-circle', color: Colors.statusCancelled },
};

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; icon: keyof typeof Feather.glyphMap }
> = {
  low: { label: 'عادية', color: Colors.textMuted, icon: 'arrow-down' },
  medium: { label: 'متوسطة', color: Colors.cyan, icon: 'minus' },
  high: { label: 'عالية', color: Colors.amber, icon: 'arrow-up' },
  urgent: { label: 'عاجلة جداً', color: Colors.primary, icon: 'alert-triangle' },
};

const CATEGORIES = [
  { name: 'محتوى تقني', icon: 'video' as const },
  { name: 'برمجة وتطوير', icon: 'code' as const },
  { name: 'تدريب وكورسات', icon: 'book' as const },
  { name: 'وظيفة حكومية', icon: 'briefcase' as const },
  { name: 'مهام عامة', icon: 'grid' as const },
];

export const TasksView: React.FC<TasksViewProps> = ({ tasks, onTasksChange }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newCategory, setNewCategory] = useState('برمجة وتطوير');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTasks =
    filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await TaskStorage.add({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        status: 'pending',
        priority: newPriority,
        category: newCategory,
      });
      const fresh = await TaskStorage.getAll();
      onTasksChange(fresh);
      setNewTitle('');
      setNewDesc('');
      setShowAddModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    await TaskStorage.updateStatus(id, status);
    const fresh = await TaskStorage.getAll();
    onTasksChange(fresh);
  };

  const handleDelete = async (id: string) => {
    await TaskStorage.delete(id);
    const fresh = await TaskStorage.getAll();
    onTasksChange(fresh);
  };

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= LARGE KPI METRICS ROW ================= */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiTop}>
              <Feather name="clock" size={16} color={Colors.silverMuted} />
              <Text style={styles.kpiTitle}>انتظار</Text>
            </View>
            <Text style={[styles.kpiNumber, { color: Colors.silver }]}>{pendingCount}</Text>
            <Text style={styles.kpiSub}>مهام قادمة</Text>
          </View>

          <View style={[styles.kpiCard, styles.kpiActiveCard]}>
            <View style={styles.kpiTop}>
              <Feather name="zap" size={16} color={Colors.amber} />
              <Text style={[styles.kpiTitle, { color: Colors.amber }]}>قيد التنفيذ</Text>
            </View>
            <Text style={[styles.kpiNumber, { color: Colors.amber }]}>{inProgressCount}</Text>
            <Text style={styles.kpiSub}>العمل الجاري</Text>
          </View>

          <View style={[styles.kpiCard, styles.kpiDoneCard]}>
            <View style={styles.kpiTop}>
              <Feather name="check-circle" size={16} color={Colors.emerald} />
              <Text style={[styles.kpiTitle, { color: Colors.emerald }]}>مكتملة</Text>
            </View>
            <Text style={[styles.kpiNumber, { color: Colors.emerald }]}>{doneCount}</Text>
            <Text style={styles.kpiSub}>تم إنجازها</Text>
          </View>
        </View>

        {/* Quick Add Banner Button */}
        <TouchableOpacity
          style={styles.quickAddBanner}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.85}
        >
          <View style={styles.quickAddIconBox}>
            <Feather name="plus" size={20} color="#ffffff" />
          </View>
          <View style={styles.quickAddTextWrap}>
            <Text style={styles.quickAddTitle}>إضافة مهمة جديدة للجدول</Text>
            <Text style={styles.quickAddSub}>تنظيم وتحديد الأولويات ومزامنتها بسوبابيس</Text>
          </View>
        </TouchableOpacity>

        {/* ================= LARGE FILTER TABS ================= */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsScroll}
        >
          <TouchableOpacity
            style={[styles.filterTab, filterStatus === 'all' && styles.filterTabActive]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[styles.filterTabText, filterStatus === 'all' && styles.filterTabTextActive]}>
              الكل ({tasks.length})
            </Text>
          </TouchableOpacity>

          {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(s => {
            const cfg = STATUS_CONFIG[s];
            const isSelected = filterStatus === s;
            const count = tasks.filter(t => t.status === s).length;
            return (
              <TouchableOpacity
                key={s}
                style={[
                  styles.filterTab,
                  isSelected && {
                    backgroundColor: Colors.bgCardHover,
                    borderColor: cfg.color,
                  },
                ]}
                onPress={() => setFilterStatus(s)}
              >
                <Feather
                  name={cfg.icon}
                  size={14}
                  color={isSelected ? cfg.color : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    isSelected && { color: '#ffffff', fontWeight: '800' },
                  ]}
                >
                  {cfg.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ================= TASKS LIST ================= */}
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Feather name="inbox" size={36} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>لا توجد مهام مسجلة حالياً</Text>
            <Text style={styles.emptyDesc}>
              اضغط على زر (إضافة مهمة جديدة) أعلاه لإدراج أول مهمة ومزامنتها مع السيرفر
            </Text>
          </View>
        ) : (
          filteredTasks.map(task => {
            const statusInfo = STATUS_CONFIG[task.status];
            const priorityInfo = PRIORITY_CONFIG[task.priority];

            return (
              <View
                key={task.id}
                style={[
                  styles.taskCard,
                  task.status === 'done' && styles.taskCardDone,
                ]}
              >
                <View style={[styles.taskSideBar, { backgroundColor: statusInfo.color }]} />

                <View style={styles.taskCardMain}>
                  {/* Category & Priority Badge Row */}
                  <View style={styles.taskHeaderRow}>
                    <View style={styles.taskBadgesGroup}>
                      <View style={[styles.priorityBadge, { backgroundColor: `${priorityInfo.color}15` }]}>
                        <Feather name={priorityInfo.icon} size={11} color={priorityInfo.color} />
                        <Text style={[styles.priorityBadgeText, { color: priorityInfo.color }]}>
                          {priorityInfo.label}
                        </Text>
                      </View>

                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>{task.category}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDelete(task.id)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={styles.deleteAction}
                    >
                      <Feather name="trash-2" size={15} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {/* Task Big Title */}
                  <Text
                    style={[
                      styles.taskTitleText,
                      task.status === 'done' && styles.taskTitleDone,
                    ]}
                  >
                    {task.title}
                  </Text>

                  {task.description ? (
                    <Text style={styles.taskDescText}>{task.description}</Text>
                  ) : null}

                  {/* Actions & Status Row */}
                  <View style={styles.taskFooterRow}>
                    <View style={styles.statusInfoBox}>
                      <Feather name={statusInfo.icon} size={13} color={statusInfo.color} />
                      <Text style={[styles.statusInfoLabel, { color: statusInfo.color }]}>
                        {statusInfo.label}
                      </Text>
                    </View>

                    <View style={styles.taskActionBtnsCluster}>
                      {task.status !== 'in_progress' && task.status !== 'done' && (
                        <TouchableOpacity
                          style={[styles.taskActionBtn, styles.startActionBtn]}
                          onPress={() => handleStatusChange(task.id, 'in_progress')}
                          activeOpacity={0.8}
                        >
                          <Feather name="play" size={12} color={Colors.amber} />
                          <Text style={[styles.taskActionBtnText, { color: Colors.amber }]}>
                            بدء العمل
                          </Text>
                        </TouchableOpacity>
                      )}

                      {task.status !== 'done' && (
                        <TouchableOpacity
                          style={[styles.taskActionBtn, styles.doneActionBtn]}
                          onPress={() => handleStatusChange(task.id, 'done')}
                          activeOpacity={0.8}
                        >
                          <Feather name="check" size={13} color={Colors.emerald} />
                          <Text style={[styles.taskActionBtnText, { color: Colors.emerald }]}>
                            تم الإنجاز
                          </Text>
                        </TouchableOpacity>
                      )}

                      {task.status === 'done' && (
                        <TouchableOpacity
                          style={[styles.taskActionBtn, styles.redoActionBtn]}
                          onPress={() => handleStatusChange(task.id, 'pending')}
                          activeOpacity={0.8}
                        >
                          <Feather name="rotate-ccw" size={12} color={Colors.cyan} />
                          <Text style={[styles.taskActionBtnText, { color: Colors.cyan }]}>
                            إعادة فتح
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ================= LARGE ADD TASK MODAL ================= */}
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
              <Text style={styles.modalTitleText}>إضافة مهمة جديدة</Text>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.largeInputLabel}>عنوان وموضوع المهمة</Text>
              <TextInput
                style={styles.largeInput}
                placeholder="مثال: تجهيز خطة الكورس البرمجي..."
                placeholderTextColor={Colors.textMuted}
                value={newTitle}
                onChangeText={setNewTitle}
                textAlign="right"
              />

              <Text style={[styles.largeInputLabel, { marginTop: 18 }]}>تفاصيل وملاحظات (اختياري)</Text>
              <TextInput
                style={styles.largeNotesInput}
                placeholder="أضف تفاصيل إضافية عن المهمة..."
                placeholderTextColor={Colors.textMuted}
                value={newDesc}
                onChangeText={setNewDesc}
                multiline
                textAlign="right"
              />

              <Text style={[styles.largeInputLabel, { marginTop: 18 }]}>درجة الأولوية</Text>
              <View style={styles.chipsWrap}>
                {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map(p => {
                  const cfg = PRIORITY_CONFIG[p];
                  const isSelected = newPriority === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.largeChoiceChip,
                        isSelected && {
                          backgroundColor: `${cfg.color}25`,
                          borderColor: cfg.color,
                        },
                      ]}
                      onPress={() => setNewPriority(p)}
                    >
                      <Feather
                        name={cfg.icon}
                        size={15}
                        color={isSelected ? cfg.color : Colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.largeChoiceChipText,
                          isSelected && { color: cfg.color, fontWeight: '800' },
                        ]}
                      >
                        {cfg.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.largeInputLabel, { marginTop: 18 }]}>مجال وتصنيف المهمة</Text>
              <View style={styles.chipsWrap}>
                {CATEGORIES.map(cat => {
                  const isSelected = newCategory === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.name}
                      style={[
                        styles.largeChoiceChip,
                        isSelected && {
                          backgroundColor: Colors.primaryGlow,
                          borderColor: Colors.primary,
                        },
                      ]}
                      onPress={() => setNewCategory(cat.name)}
                    >
                      <Feather
                        name={cat.icon}
                        size={15}
                        color={isSelected ? Colors.primaryLight : Colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.largeChoiceChipText,
                          isSelected && { color: '#ffffff', fontWeight: '800' },
                        ]}
                      >
                        {cat.name}
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
                  {isSubmitting ? 'جاري الحفظ في سوبابيس...' : 'حفظ المهمة في السيرفر'}
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

  // KPI Row
  kpiRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    alignItems: 'center',
  },
  kpiActiveCard: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
  },
  kpiDoneCard: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  kpiTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  kpiTitle: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  kpiNumber: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  kpiSub: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
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

  // Filter Tabs
  filterTabsScroll: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 7,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  filterTabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
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

  // Task Cards
  taskCard: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  taskCardDone: {
    opacity: 0.65,
  },
  taskSideBar: {
    width: 5,
  },
  taskCardMain: {
    flex: 1,
    padding: 16,
  },
  taskHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskBadgesGroup: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  priorityBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryPill: {
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryPillText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  deleteAction: {
    padding: 4,
  },
  taskTitleText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: 6,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  taskDescText: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'right',
    lineHeight: 19,
    marginBottom: 12,
  },
  taskFooterRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusInfoBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  statusInfoLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  taskActionBtnsCluster: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  taskActionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
  },
  startActionBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  doneActionBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  redoActionBtn: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  taskActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
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
