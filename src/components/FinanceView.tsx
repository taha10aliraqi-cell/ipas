import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Transaction, IncomeType, TransactionType } from '../api/types';
import { TransactionStorage } from '../utils/storage';
import { Colors } from '../theme/colors';

interface FinanceViewProps {
  transactions: Transaction[];
  onTransactionsChange: (txns: Transaction[]) => void;
}

type CurrencyType = 'IQD' | 'USD';

const INCOME_TYPE_CONFIG: Record<
  IncomeType,
  { label: string; icon: keyof typeof Feather.glyphMap; color: string; desc: string }
> = {
  salary: { label: 'راتب وظيفي', icon: 'briefcase', color: Colors.salary, desc: 'الوظيفة الحكومية' },
  courses: { label: 'كورسات تدريب', icon: 'book-open', color: Colors.courses, desc: 'تدريب ومحاضرات' },
  projects: { label: 'مشاريع برمجية', icon: 'code', color: Colors.projects, desc: 'أنظمة وتطبيقات' },
  other: { label: 'عوائد أخرى', icon: 'layers', color: Colors.other, desc: 'استشارات وغيرها' },
};

const EXPENSE_CATEGORIES = [
  { name: 'إيجار ومقر', icon: 'home' as const },
  { name: 'سيرفرات وإنترنت', icon: 'server' as const },
  { name: 'معدات وتقنيات', icon: 'cpu' as const },
  { name: 'اشتراكات برامج', icon: 'shield' as const },
  { name: 'مواصلات ونقل', icon: 'navigation' as const },
  { name: 'أكل ومصروفات', icon: 'coffee' as const },
  { name: 'عام وأخرى', icon: 'grid' as const },
];

export const FinanceView: React.FC<FinanceViewProps> = ({
  transactions,
  onTransactionsChange,
}) => {
  // Dual Wallet Currency State (IQD or USD)
  const [activeCurrency, setActiveCurrency] = useState<CurrencyType>('IQD');
  const [showAddModal, setShowAddModal] = useState(false);
  const [txnType, setTxnType] = useState<TransactionType>('income');
  const [amount, setAmount] = useState('');
  const [formCurrency, setFormCurrency] = useState<CurrencyType>('IQD');
  const [category, setCategory] = useState('سيرفرات وإنترنت');
  const [incomeType, setIncomeType] = useState<IncomeType>('salary');
  const [description, setDescription] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterCurrency, setFilterCurrency] = useState<CurrencyType | 'all'>('IQD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate separate summaries for IQD and USD
  const fullSummary = TransactionStorage.getSummary(transactions);
  const currentSummary = activeCurrency === 'IQD' ? fullSummary.iqd : fullSummary.usd;
  const otherSummary = activeCurrency === 'IQD' ? fullSummary.usd : fullSummary.iqd;
  const otherCurrency: CurrencyType = activeCurrency === 'IQD' ? 'USD' : 'IQD';

  const filteredTxns = transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesCurrency =
      filterCurrency === 'all' || (t.currency || 'IQD') === filterCurrency;
    return matchesType && matchesCurrency;
  });

  const handleOpenAdd = (type: TransactionType) => {
    setTxnType(type);
    setFormCurrency(activeCurrency);
    setAmount('');
    setDescription('');
    setShowAddModal(true);
  };

  const handleAdd = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await TransactionStorage.add({
        type: txnType,
        amount: numAmount,
        currency: formCurrency,
        category: txnType === 'income' ? INCOME_TYPE_CONFIG[incomeType].label : category,
        income_type: txnType === 'income' ? incomeType : undefined,
        description: description.trim() || undefined,
        date: new Date().toISOString().split('T')[0],
      });
      const fresh = await TransactionStorage.getAll();
      onTransactionsChange(fresh);
      setShowAddModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await TransactionStorage.delete(id);
    const fresh = await TransactionStorage.getAll();
    onTransactionsChange(fresh);
  };

  const formatAmount = (num: number, cur: string) => {
    if (cur === 'USD') return `$${num.toLocaleString()}`;
    return `${num.toLocaleString()} د.ع`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= DUAL WALLET SELECTOR BAR ================= */}
        <View style={styles.walletCurrencyBar}>
          <TouchableOpacity
            style={[
              styles.walletCurrencyTab,
              activeCurrency === 'IQD' && styles.walletCurrencyTabActive,
            ]}
            onPress={() => {
              setActiveCurrency('IQD');
              setFilterCurrency('IQD');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.currencyFlagCircle, activeCurrency === 'IQD' && styles.currencyFlagCircleActive]}>
              <Text style={styles.flagText}>🇮🇶</Text>
            </View>
            <View style={styles.tabTextWrap}>
              <Text style={[styles.tabCurrencyName, activeCurrency === 'IQD' && styles.tabCurrencyNameActive]}>
                محفظة الدينار العراقي
              </Text>
              <Text style={styles.tabCurrencySub}>
                الرصيد: {fullSummary.iqd.balance.toLocaleString()} د.ع
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.walletCurrencyTab,
              activeCurrency === 'USD' && styles.walletCurrencyTabActive,
            ]}
            onPress={() => {
              setActiveCurrency('USD');
              setFilterCurrency('USD');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.currencyFlagCircle, activeCurrency === 'USD' && styles.currencyFlagCircleActive]}>
              <Text style={styles.flagText}>🇺🇸</Text>
            </View>
            <View style={styles.tabTextWrap}>
              <Text style={[styles.tabCurrencyName, activeCurrency === 'USD' && styles.tabCurrencyNameActive]}>
                محفظة الدولار (USD)
              </Text>
              <Text style={styles.tabCurrencySub}>
                الرصيد: ${fullSummary.usd.balance.toLocaleString()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ================= HERO WALLET CARD (FinTech SuperKey Style) ================= */}
        <View style={styles.heroWalletCard}>
          <View style={styles.heroGlowStripe} />

          <View style={styles.heroTopRow}>
            <View style={styles.walletBadge}>
              <Feather name="shield" size={14} color={Colors.primaryLight} />
              <Text style={styles.walletBadgeText}>
                {activeCurrency === 'IQD' ? 'محفظة الدينار • IQD' : 'محفظة الدولار • USD'}
              </Text>
            </View>

            {/* Other Wallet Quick Switch Pill */}
            <TouchableOpacity
              style={styles.otherWalletChip}
              onPress={() => {
                setActiveCurrency(otherCurrency);
                setFilterCurrency(otherCurrency);
              }}
            >
              <Text style={styles.otherWalletLabel}>المحفظة الثانية:</Text>
              <Text style={styles.otherWalletVal}>
                {otherCurrency === 'IQD'
                  ? `${otherSummary.balance.toLocaleString()} د.ع`
                  : `$${otherSummary.balance.toLocaleString()}`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Big Bold Clean Balance Number */}
          <Text style={styles.balanceHeaderLabel}>الرصيد الصافي المتاح ({activeCurrency})</Text>
          <View style={styles.balanceRow}>
            <Text
              style={[
                styles.balanceFigure,
                { color: currentSummary.balance >= 0 ? '#ffffff' : Colors.expense },
              ]}
            >
              {currentSummary.balance.toLocaleString()}
            </Text>
            <Text style={styles.balanceCurrency}>
              {activeCurrency === 'IQD' ? 'د.ع' : 'USD $'}
            </Text>
          </View>

          {/* Quick Dual Action Buttons */}
          <View style={styles.heroActionsRow}>
            <TouchableOpacity
              style={[styles.heroActionBtn, styles.heroIncomeBtn]}
              onPress={() => handleOpenAdd('income')}
              activeOpacity={0.85}
            >
              <View style={styles.heroActionIconCircle}>
                <Feather name="arrow-down-left" size={18} color={Colors.emerald} />
              </View>
              <Text style={styles.heroActionBtnText}>
                + إضافة دخل ({activeCurrency === 'IQD' ? 'دينار' : 'دولار'})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.heroActionBtn, styles.heroExpenseBtn]}
              onPress={() => handleOpenAdd('expense')}
              activeOpacity={0.85}
            >
              <View style={[styles.heroActionIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Feather name="arrow-up-right" size={18} color={Colors.expense} />
              </View>
              <Text style={styles.heroActionBtnText}>
                - تسجيل صرف ({activeCurrency === 'IQD' ? 'دينار' : 'دولار'})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ================= DUAL KPI CARDS (Calculated for Active Currency) ================= */}
        <View style={styles.kpiCardsRow}>
          {/* Income Card */}
          <View style={[styles.kpiCard, styles.kpiIncomeCard]}>
            <View style={styles.kpiCardHeader}>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Feather name="trending-up" size={18} color={Colors.emerald} />
              </View>
              <Text style={styles.kpiCardTitle}>وارد ({activeCurrency})</Text>
            </View>
            <Text style={[styles.kpiCardAmount, { color: Colors.emerald }]}>
              +{currentSummary.totalIncome.toLocaleString()} {activeCurrency === 'IQD' ? 'د.ع' : '$'}
            </Text>
            <Text style={styles.kpiCardSub}>إجمالي الأرباح والرواتب</Text>
          </View>

          {/* Expense Card */}
          <View style={[styles.kpiCard, styles.kpiExpenseCard]}>
            <View style={styles.kpiCardHeader}>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Feather name="trending-down" size={18} color={Colors.expense} />
              </View>
              <Text style={styles.kpiCardTitle}>مصروف ({activeCurrency})</Text>
            </View>
            <Text style={[styles.kpiCardAmount, { color: Colors.expense }]}>
              -{currentSummary.totalExpenses.toLocaleString()} {activeCurrency === 'IQD' ? 'د.ع' : '$'}
            </Text>
            <Text style={styles.kpiCardSub}>النفقات والاشتراكات</Text>
          </View>
        </View>

        {/* ================= INCOME BREAKDOWN (By Active Currency) ================= */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>مصادر دخل محفظة ({activeCurrency})</Text>
          <Text style={styles.sectionSubtitle}>مفصولة بالكامل</Text>
        </View>

        <View style={styles.incomeSourcesGrid}>
          {(Object.keys(INCOME_TYPE_CONFIG) as IncomeType[]).map(type => {
            const cfg = INCOME_TYPE_CONFIG[type];
            const amountVal = currentSummary.incomeByType[type];

            return (
              <View key={type} style={styles.sourceGridItem}>
                <View style={styles.sourceItemTop}>
                  <View style={[styles.sourceIconSquare, { backgroundColor: `${cfg.color}15` }]}>
                    <Feather name={cfg.icon} size={18} color={cfg.color} />
                  </View>
                  <View style={styles.sourceTitles}>
                    <Text style={styles.sourceLabel}>{cfg.label}</Text>
                    <Text style={styles.sourceDesc}>{cfg.desc}</Text>
                  </View>
                </View>

                <View style={styles.sourceAmountRow}>
                  <Text style={[styles.sourceAmount, { color: cfg.color }]}>
                    {amountVal.toLocaleString()}
                  </Text>
                  <Text style={styles.sourceCurrency}>
                    {activeCurrency === 'IQD' ? 'د.ع' : '$'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ================= TRANSACTIONS LIST SECTION ================= */}
        <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
          <Text style={styles.sectionTitle}>سجل المعاملات والقيود</Text>
          <Text style={styles.sectionSubtitle}>حسب المحفظة والنوع</Text>
        </View>

        {/* Currency Filter Switcher */}
        <View style={styles.currencyFilterRow}>
          {(['IQD', 'USD', 'all'] as const).map(c => (
            <TouchableOpacity
              key={c}
              style={[
                styles.currencyFilterBtn,
                filterCurrency === c && styles.currencyFilterBtnActive,
              ]}
              onPress={() => setFilterCurrency(c)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.currencyFilterText,
                  filterCurrency === c && styles.currencyFilterTextActive,
                ]}
              >
                {c === 'IQD' ? '🇮🇶 دينار عراقي فقط' : c === 'USD' ? '🇺🇸 دولار فقط' : 'جميع العملات'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Type Filter Pills */}
        <View style={styles.filterPillsRow}>
          {(['all', 'income', 'expense'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.largeFilterPill, filterType === f && styles.largeFilterPillActive]}
              onPress={() => setFilterType(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.largeFilterText, filterType === f && styles.largeFilterTextActive]}>
                {f === 'all' ? 'الكل' : f === 'income' ? 'الوارد فقط' : 'المصروف فقط'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions Items */}
        {filteredTxns.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Feather name="credit-card" size={34} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>لا توجد معاملات مسجلة</Text>
            <Text style={styles.emptyDesc}>
              اضغط على زر (إضافة دخل) أو (تسجيل صرف) لحفظ المعاملة في محفظة {activeCurrency === 'IQD' ? 'الدينار' : 'الدولار'}
            </Text>
          </View>
        ) : (
          filteredTxns.map(txn => {
            const isIncome = txn.type === 'income';
            const themeColor = isIncome ? Colors.emerald : Colors.expense;
            const incCfg = isIncome && txn.income_type ? INCOME_TYPE_CONFIG[txn.income_type] : null;

            return (
              <View key={txn.id} style={styles.transactionCard}>
                <View style={[styles.txSideIndicator, { backgroundColor: themeColor }]} />

                <View style={styles.txContent}>
                  <View style={styles.txTopRow}>
                    <View style={styles.txMainInfo}>
                      <View style={[styles.txCategoryBadge, { backgroundColor: `${themeColor}12` }]}>
                        <Feather
                          name={isIncome ? 'arrow-down-left' : 'arrow-up-right'}
                          size={13}
                          color={themeColor}
                        />
                        <Text style={[styles.txCategoryText, { color: themeColor }]}>
                          {txn.category}
                        </Text>
                      </View>

                      {/* Currency Pill */}
                      <View
                        style={[
                          styles.currencyTag,
                          txn.currency === 'USD'
                            ? { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)' }
                            : { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.currencyTagText,
                            txn.currency === 'USD' ? { color: Colors.salary } : { color: Colors.emerald },
                          ]}
                        >
                          {txn.currency === 'USD' ? 'USD $' : 'IQD د.ع'}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDelete(txn.id)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={styles.txDeleteBtn}
                    >
                      <Feather name="trash-2" size={15} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.txBottomRow}>
                    <Text style={[styles.txAmountFigure, { color: themeColor }]}>
                      {isIncome ? '+' : '-'} {formatAmount(txn.amount, txn.currency)}
                    </Text>
                    <View style={styles.txDatePill}>
                      <Feather name="calendar" size={11} color={Colors.textMuted} />
                      <Text style={styles.txDateText}>{txn.date}</Text>
                    </View>
                  </View>

                  {txn.description ? (
                    <Text style={styles.txNotesText}>
                      ملاحظة: {txn.description}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ================= LARGE ADD MODAL SHEET ================= */}
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
              <Text style={styles.modalTitleText}>
                {txnType === 'income' ? 'تسجيل وارد / دخل مالي' : 'تسجيل صادر / مصروف'}
              </Text>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Type Switcher */}
              <View style={styles.modalSwitchRow}>
                <TouchableOpacity
                  style={[
                    styles.modalSwitchBtn,
                    txnType === 'income' && styles.modalSwitchBtnIncomeActive,
                  ]}
                  onPress={() => setTxnType('income')}
                >
                  <Feather
                    name="arrow-down-left"
                    size={16}
                    color={txnType === 'income' ? Colors.emerald : Colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.modalSwitchBtnText,
                      txnType === 'income' && { color: Colors.emerald, fontWeight: '800' },
                    ]}
                  >
                    وارد / دخل
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalSwitchBtn,
                    txnType === 'expense' && styles.modalSwitchBtnExpenseActive,
                  ]}
                  onPress={() => setTxnType('expense')}
                >
                  <Feather
                    name="arrow-up-right"
                    size={16}
                    color={txnType === 'expense' ? Colors.expense : Colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.modalSwitchBtnText,
                      txnType === 'expense' && { color: Colors.expense, fontWeight: '800' },
                    ]}
                  >
                    صادر / مصروف
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Currency Selection for the new Transaction */}
              <Text style={styles.largeInputLabel}>العملة المحددة للمعاملة</Text>
              <View style={styles.formCurrencyRow}>
                <TouchableOpacity
                  style={[
                    styles.formCurrencyBtn,
                    formCurrency === 'IQD' && styles.formCurrencyBtnActive,
                  ]}
                  onPress={() => setFormCurrency('IQD')}
                >
                  <Text style={styles.formFlag}>🇮🇶</Text>
                  <Text
                    style={[
                      styles.formCurrencyText,
                      formCurrency === 'IQD' && styles.formCurrencyTextActive,
                    ]}
                  >
                    الدينار العراقي (IQD د.ع)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.formCurrencyBtn,
                    formCurrency === 'USD' && styles.formCurrencyBtnActive,
                  ]}
                  onPress={() => setFormCurrency('USD')}
                >
                  <Text style={styles.formFlag}>🇺🇸</Text>
                  <Text
                    style={[
                      styles.formCurrencyText,
                      formCurrency === 'USD' && styles.formCurrencyTextActive,
                    ]}
                  >
                    الدولار الأمريكي (USD $)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Big Amount Field */}
              <Text style={[styles.largeInputLabel, { marginTop: 14 }]}>
                المبلغ ({formCurrency === 'IQD' ? 'بالدينار العراقي' : 'بالدولار الأمريكي'})
              </Text>
              <TextInput
                style={styles.largeAmountInput}
                placeholder={formCurrency === 'IQD' ? 'مثال: 500,000' : 'مثال: 350'}
                placeholderTextColor={Colors.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                textAlign="right"
              />

              {/* Category Options */}
              {txnType === 'income' ? (
                <>
                  <Text style={[styles.largeInputLabel, { marginTop: 18 }]}>نوع ومصدر الدخل</Text>
                  <View style={styles.chipsWrap}>
                    {(Object.keys(INCOME_TYPE_CONFIG) as IncomeType[]).map(type => {
                      const cfg = INCOME_TYPE_CONFIG[type];
                      const isSelected = incomeType === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.largeChoiceChip,
                            isSelected && {
                              backgroundColor: `${cfg.color}25`,
                              borderColor: cfg.color,
                            },
                          ]}
                          onPress={() => setIncomeType(type)}
                        >
                          <Feather
                            name={cfg.icon}
                            size={16}
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
                </>
              ) : (
                <>
                  <Text style={[styles.largeInputLabel, { marginTop: 18 }]}>تصنيف المصروف</Text>
                  <View style={styles.chipsWrap}>
                    {EXPENSE_CATEGORIES.map(cat => {
                      const isSelected = category === cat.name;
                      return (
                        <TouchableOpacity
                          key={cat.name}
                          style={[
                            styles.largeChoiceChip,
                            isSelected && {
                              backgroundColor: 'rgba(239, 68, 68, 0.2)',
                              borderColor: Colors.expense,
                            },
                          ]}
                          onPress={() => setCategory(cat.name)}
                        >
                          <Feather
                            name={cat.icon}
                            size={16}
                            color={isSelected ? Colors.expense : Colors.textMuted}
                          />
                          <Text
                            style={[
                              styles.largeChoiceChipText,
                              isSelected && { color: Colors.expense, fontWeight: '800' },
                            ]}
                          >
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Notes */}
              <Text style={[styles.largeInputLabel, { marginTop: 18 }]}>ملاحظات وبيان (اختياري)</Text>
              <TextInput
                style={styles.notesInputField}
                placeholder="أضف تفاصيل الفاتورة أو الجهة المحول منها..."
                placeholderTextColor={Colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                textAlign="right"
              />
            </ScrollView>

            {/* Bottom Submit Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.largeSubmitBtn, isSubmitting && { opacity: 0.6 }]}
                onPress={handleAdd}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Feather name="check-circle" size={18} color="#ffffff" />
                <Text style={styles.largeSubmitBtnText}>
                  {isSubmitting
                    ? 'جاري الحفظ في سوبابيس...'
                    : `حفظ المعاملة في محفظة ${formCurrency === 'IQD' ? 'الدينار' : 'الدولار'}`}
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
    paddingTop: 12,
    paddingBottom: 90,
  },


  // Dual Currency Switcher Bar
  walletCurrencyBar: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 16,
  },
  walletCurrencyTab: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 10,
  },
  walletCurrencyTabActive: {
    borderColor: Colors.primary,
    backgroundColor: '#161622',
  },
  currencyFlagCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyFlagCircleActive: {
    backgroundColor: 'rgba(227, 27, 35, 0.15)',
  },
  flagText: {
    fontSize: 18,
  },
  tabTextWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  tabCurrencyName: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  tabCurrencyNameActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  tabCurrencySub: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  // Hero Card
  heroWalletCard: {
    backgroundColor: '#12121a',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(227, 27, 35, 0.45)',
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  heroGlowStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.primary,
  },
  heroTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  walletBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(227, 27, 35, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(227, 27, 35, 0.25)',
  },
  walletBadgeText: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '800',
  },
  otherWalletChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  otherWalletLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  otherWalletVal: {
    color: Colors.silver,
    fontSize: 11,
    fontWeight: '800',
  },
  balanceHeaderLabel: {
    color: Colors.silverMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  balanceRow: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    gap: 8,
    marginVertical: 8,
  },
  balanceFigure: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  balanceCurrency: {
    color: Colors.primaryLight,
    fontSize: 18,
    fontWeight: '800',
  },
  heroActionsRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 14,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroActionBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
  },
  heroIncomeBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  heroExpenseBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  heroActionIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  // Dual KPI Cards
  kpiCardsRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
  },
  kpiIncomeCard: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  kpiExpenseCard: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  kpiCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  kpiIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiCardTitle: {
    color: Colors.silver,
    fontSize: 13,
    fontWeight: '700',
  },
  kpiCardAmount: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.3,
    textAlign: 'right',
  },
  kpiCardSub: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'right',
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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

  // 2x2 Income Sources Grid
  incomeSourcesGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  sourceGridItem: {
    width: (Dimensions.get('window').width - 44) / 2,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  sourceItemTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sourceIconSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceTitles: {
    flex: 1,
    alignItems: 'flex-end',
  },
  sourceLabel: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  sourceDesc: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  sourceAmountRow: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    gap: 4,
  },
  sourceAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  sourceCurrency: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },

  // Filter Currency Row
  currencyFilterRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 10,
  },
  currencyFilterBtn: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  currencyFilterBtnActive: {
    backgroundColor: Colors.bgCardHover,
    borderColor: Colors.primary,
  },
  currencyFilterText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  currencyFilterTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },

  // Filter Pills
  filterPillsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 14,
  },
  largeFilterPill: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  largeFilterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  largeFilterText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  largeFilterTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },

  // Empty State
  emptyCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 30,
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

  // Transaction Cards
  transactionCard: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  txSideIndicator: {
    width: 5,
  },
  txContent: {
    flex: 1,
    padding: 16,
  },
  txTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  txMainInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  txCategoryBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  txCategoryText: {
    fontSize: 12,
    fontWeight: '800',
  },
  currencyTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  currencyTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  txDeleteBtn: {
    padding: 4,
  },
  txBottomRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txAmountFigure: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  txDatePill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  txDateText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  txNotesText: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },

  // Modal Sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '92%',
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
  modalSwitchRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 16,
  },
  modalSwitchBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.bgCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 8,
  },
  modalSwitchBtnIncomeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.emerald,
  },
  modalSwitchBtnExpenseActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: Colors.expense,
  },
  modalSwitchBtnText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  formCurrencyRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 14,
  },
  formCurrencyBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 8,
  },
  formCurrencyBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  formFlag: {
    fontSize: 16,
  },
  formCurrencyText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  formCurrencyTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  largeInputLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 8,
  },
  largeAmountInput: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  notesInputField: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 70,
    textAlignVertical: 'top',
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
