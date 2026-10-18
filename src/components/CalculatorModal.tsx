import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

interface CalculatorModalProps {
  visible: boolean;
  onClose: () => void;
  onUseResult?: (amount: number, currency: 'IQD' | 'USD') => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  visible,
  onClose,
  onUseResult,
}) => {
  const [expression, setExpression] = useState<string>('');
  const [result, setResult] = useState<string>('0');
  const [exchangeRate, setExchangeRate] = useState<number>(1530); // 1 USD = 1,530 IQD (100$ = 153,000)
  const [mode, setMode] = useState<'calc' | 'converter'>('calc');
  const [copiedToast, setCopiedToast] = useState(false);

  // Calculator Logic
  const handlePressNum = (val: string) => {
    if (result !== '0' && expression === '') {
      setResult(val);
      setExpression(val);
      return;
    }
    const newExpr = expression + val;
    setExpression(newExpr);
    calculatePreview(newExpr);
  };

  const handlePressOp = (op: string) => {
    if (!expression && result !== '0') {
      setExpression(result + op);
      return;
    }
    if (!expression) return;
    const lastChar = expression[expression.length - 1];
    if (['+', '-', '×', '÷'].includes(lastChar)) {
      setExpression(expression.slice(0, -1) + op);
    } else {
      const newExpr = expression + op;
      setExpression(newExpr);
    }
  };

  const calculatePreview = (expr: string) => {
    try {
      const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');
      // eslint-disable-next-line no-eval
      const res = eval(sanitized);
      if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
        setResult(res.toString());
      }
    } catch {}
  };

  const handleEquals = () => {
    if (!expression) return;
    try {
      const sanitized = expression.replace(/×/g, '*').replace(/÷/g, '/');
      // eslint-disable-next-line no-eval
      const res = eval(sanitized);
      if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
        setResult(res.toString());
        setExpression(res.toString());
      }
    } catch {
      setResult('خطأ');
    }
  };

  const handleClear = () => {
    setExpression('');
    setResult('0');
  };

  const handleDelete = () => {
    if (expression.length > 0) {
      const newExpr = expression.slice(0, -1);
      setExpression(newExpr);
      if (newExpr) calculatePreview(newExpr);
      else setResult('0');
    }
  };

  const handlePercentage = () => {
    if (!result || result === '0') return;
    const num = parseFloat(result) / 100;
    setResult(num.toString());
    setExpression(num.toString());
  };

  const handleToggleSign = () => {
    if (!result || result === '0') return;
    const num = parseFloat(result) * -1;
    setResult(num.toString());
    setExpression(num.toString());
  };

  // Currency Converter Helpers
  const currentNum = parseFloat(result) || 0;
  const inIQD = mode === 'converter' ? (currentNum * exchangeRate).toLocaleString() : '0';
  const inUSD = mode === 'converter' ? (currentNum / exchangeRate).toFixed(2) : '0';

  const formatNumberWithCommas = (str: string) => {
    const parts = str.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.calculatorCard}>
          <View style={styles.sheetHandle} />

          {/* Top Bar */}
          <View style={styles.calcHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[styles.modeTab, mode === 'calc' && styles.modeTabActive]}
                onPress={() => setMode('calc')}
              >
                <Feather
                  name="cpu"
                  size={14}
                  color={mode === 'calc' ? '#ffffff' : Colors.textMuted}
                />
                <Text style={[styles.modeTabText, mode === 'calc' && styles.modeTabTextActive]}>
                  حاسبة ذكية
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, mode === 'converter' && styles.modeTabActive]}
                onPress={() => setMode('converter')}
              >
                <Feather
                  name="repeat"
                  size={14}
                  color={mode === 'converter' ? '#ffffff' : Colors.textMuted}
                />
                <Text style={[styles.modeTabText, mode === 'converter' && styles.modeTabTextActive]}>
                  محول صرف ($ ⇋ د.ع)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* OLED Digital Display */}
          <View style={styles.displayArea}>
            <Text style={styles.expressionText} numberOfLines={1}>
              {expression || ' '}
            </Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultText} numberOfLines={1}>
                {formatNumberWithCommas(result)}
              </Text>
            </View>

            {/* Currency Converter Live Card */}
            {mode === 'converter' && (
              <View style={styles.converterStrip}>
                <View style={styles.conversionBox}>
                  <Text style={styles.conversionLabel}>إذا كان المبلغ دولار ($)</Text>
                  <Text style={styles.conversionValue}>{inIQD} د.ع</Text>
                </View>
                <View style={styles.conversionDivider} />
                <View style={styles.conversionBox}>
                  <Text style={styles.conversionLabel}>إذا كان دينار (د.ع)</Text>
                  <Text style={styles.conversionValue}>${inUSD}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Quick Action Bar (Use in Wallet) */}
          {onUseResult && (
            <View style={styles.useResultRow}>
              <TouchableOpacity
                style={[styles.useBtn, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)' }]}
                onPress={() => {
                  const val = parseFloat(result);
                  if (val > 0) {
                    onUseResult(val, 'IQD');
                    onClose();
                  }
                }}
              >
                <Feather name="arrow-down-left" size={13} color={Colors.emerald} />
                <Text style={[styles.useBtnText, { color: Colors.emerald }]}>
                  استخدام كدينار (د.ع)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.useBtn, { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.4)' }]}
                onPress={() => {
                  const val = parseFloat(result);
                  if (val > 0) {
                    onUseResult(val, 'USD');
                    onClose();
                  }
                }}
              >
                <Feather name="dollar-sign" size={13} color={Colors.salary} />
                <Text style={[styles.useBtnText, { color: Colors.salary }]}>
                  استخدام كدولار ($)
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Keypad Grid */}
          <View style={styles.keypad}>
            {/* Row 1 */}
            <View style={styles.keyRow}>
              <TouchableOpacity style={[styles.key, styles.fnKey]} onPress={handleClear}>
                <Text style={[styles.keyText, styles.fnKeyText]}>AC</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.key, styles.fnKey]} onPress={handleToggleSign}>
                <Text style={[styles.keyText, styles.fnKeyText]}>±</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.key, styles.fnKey]} onPress={handlePercentage}>
                <Text style={[styles.keyText, styles.fnKeyText]}>%</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.key, styles.opKey]} onPress={() => handlePressOp('÷')}>
                <Text style={[styles.keyText, styles.opKeyText]}>÷</Text>
              </TouchableOpacity>
            </View>

            {/* Row 2 */}
            <View style={styles.keyRow}>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNum('7')}>
                <Text style={styles.keyText}>7</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNum('8')}>
                <Text style={styles.keyText}>8</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNum('9')}>
                <Text style={styles.keyText}>9</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.key, styles.opKey]} onPress={() => handlePressOp('×')}>
                <Text style={[styles.keyText, styles.opKeyText]}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Row 3 */}
            <View style={styles.keyRow}>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNum('4')}>
                <Text style={styles.keyText}>4</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNum('5')}>
                <Text style={styles.keyText}>5</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNum('6')}>
                <Text style={styles.keyText}>6</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.key, styles.opKey]} onPress={() => handlePressOp('-')}>
                <Text style={[styles.keyText, styles.opKeyText]}>−</Text>
              </TouchableOpacity>
            </View>

            {/* Row 4 */}
            <View style={styles.keyRow}>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNum('1')}>
                <Text style={styles.keyText}>1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNum('2')}>
                <Text style={styles.keyText}>2</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNum('3')}>
                <Text style={styles.keyText}>3</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.key, styles.opKey]} onPress={() => handlePressOp('+')}>
                <Text style={[styles.keyText, styles.opKeyText]}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Row 5 */}
            <View style={styles.keyRow}>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNum('0')}>
                <Text style={styles.keyText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNum('000')}>
                <Text style={[styles.keyText, { fontSize: 18 }]}>000</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.key} onPress={() => handlePressNum('.')}>
                <Text style={styles.keyText}>.</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.key, styles.equalKey]} onPress={handleEquals}>
                <Text style={[styles.keyText, styles.equalKeyText]}>=</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'flex-end',
  },
  calculatorCard: {
    backgroundColor: '#0f0f16',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    backgroundColor: Colors.borderHighlight,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  calcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: Colors.primary,
  },
  modeTabText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },

  // Display
  displayArea: {
    backgroundColor: '#161622',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 14,
    minHeight: 110,
    justifyContent: 'flex-end',
  },
  expressionText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    letterSpacing: 1,
    marginBottom: 6,
  },
  resultRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  resultText: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'right',
    flex: 1,
  },
  converterStrip: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.bgElevated,
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  conversionBox: {
    alignItems: 'center',
    flex: 1,
  },
  conversionLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  conversionValue: {
    color: Colors.primaryLight,
    fontSize: 14,
    fontWeight: '800',
  },
  conversionDivider: {
    width: 1,
    height: '80%',
    backgroundColor: Colors.border,
    alignSelf: 'center',
  },

  // Use Result
  useResultRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 14,
  },
  useBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  useBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Keypad
  keypad: {
    gap: 10,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  key: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#1b1b26',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#28283a',
  },
  keyText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  fnKey: {
    backgroundColor: '#262638',
  },
  fnKeyText: {
    color: Colors.silver,
    fontSize: 18,
    fontWeight: '800',
  },
  opKey: {
    backgroundColor: 'rgba(227, 27, 35, 0.15)',
    borderColor: 'rgba(227, 27, 35, 0.4)',
  },
  opKeyText: {
    color: Colors.primaryLight,
    fontSize: 24,
    fontWeight: '800',
  },
  equalKey: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  equalKeyText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
  },
});

