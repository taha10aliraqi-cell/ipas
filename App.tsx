import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from './src/theme/colors';
import { Task, ContentItem, Transaction } from './src/api/types';
import { TaskStorage, ContentStorage, TransactionStorage } from './src/utils/storage';
import { Header } from './src/components/Header';
import { TasksView } from './src/components/TasksView';
import { ContentView } from './src/components/ContentView';
import { FinanceView } from './src/components/FinanceView';
import { CalculatorModal } from './src/components/CalculatorModal';

type ActiveTab = 'finance' | 'tasks' | 'content';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('finance');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isCalculatorVisible, setIsCalculatorVisible] = useState<boolean>(false);

  // Load data from Supabase VPS on startup
  const loadAllData = async () => {
    setIsSyncing(true);
    try {
      const [tData, cData, fData] = await Promise.all([
        TaskStorage.getAll(),
        ContentStorage.getAll(),
        TransactionStorage.getAll(),
      ]);
      setTasks(tData);
      setContentItems(cData);
      setTransactions(fData);
    } catch {} finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDoneTasks = tasks.filter(
    t => t.status === 'done' && t.completed_at && t.completed_at.startsWith(todayStr)
  ).length;

  const TABS: { key: ActiveTab; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: 'finance', label: 'المالية والمحفظة', icon: 'credit-card' },
    { key: 'tasks', label: 'المهام اليومية', icon: 'check-square' },
    { key: 'content', label: 'صناعة المحتوى', icon: 'video' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />

      {/* App Header with Brand Logo & Profile & Supabase Sync & Calculator */}
      <Header
        activeTab={activeTab}
        tasksCount={tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled').length}
        todayTasksDone={todayDoneTasks}
        onRefresh={loadAllData}
        isSyncing={isSyncing}
        onOpenCalculator={() => setIsCalculatorVisible(true)}
      />

      {/* Main Tab Navigation Bar with Large Easy Touch Targets */}
      <View style={styles.tabsNav}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.navTab, isActive && styles.navTabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Feather
                name={tab.icon}
                size={17}
                color={isActive ? Colors.primaryLight : Colors.textMuted}
              />
              <Text style={[styles.navTabText, isActive && styles.navTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Viewport Container */}
      <View style={styles.contentContainer}>
        {activeTab === 'finance' && (
          <FinanceView transactions={transactions} onTransactionsChange={setTransactions} />
        )}
        {activeTab === 'tasks' && (
          <TasksView tasks={tasks} onTasksChange={setTasks} />
        )}
        {activeTab === 'content' && (
          <ContentView items={contentItems} onItemsChange={setContentItems} />
        )}
      </View>

      {/* Professional In-App Calculator & Currency Converter */}
      <CalculatorModal
        visible={isCalculatorVisible}
        onClose={() => setIsCalculatorVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  tabsNav: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.border,
    paddingHorizontal: 8,
  },
  navTab: {
    flex: 1,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    gap: 8,
  },
  navTabActive: {
    borderBottomColor: Colors.primary,
    backgroundColor: 'rgba(227, 27, 35, 0.06)',
  },
  navTabText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  navTabTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  contentContainer: {
    flex: 1,
  },
});
