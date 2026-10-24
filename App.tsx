import React, { useEffect, useState } from 'react';
import {
  View,
  Text as NativeText,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Transaction = {
  id: number;
  title: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: string;
};

type Screen = 'Home' | 'Transactions' | 'Insights' | 'Settings';

const STORAGE_KEY = 'personal_expense_tracker_transactions';
const PREFERENCES_KEY = 'personal_expense_tracker_preferences';

const themeOptions = [
  { name: 'Blue', value: '#3157D5' },
  { name: 'Purple', value: '#7C3AED' },
  { name: 'Green', value: '#13834B' },
  { name: 'Pink', value: '#DB2777' },
  { name: 'Teal', value: '#0F766E' },
  { name: 'Orange', value: '#EA580C' },
];

const categories = [
  'Food',
  'Transport',
  'Salary',
  'Shopping',
  'Bills',
  'Other',
];

const initialTransactions: Transaction[] = [
  {
    id: 1,
    title: 'Salary',
    amount: 20000,
    type: 'Income',
    category: 'Salary',
  },
  {
    id: 2,
    title: 'Lunch',
    amount: 500,
    type: 'Expense',
    category: 'Food',
  },
  {
    id: 3,
    title: 'Transport',
    amount: 200,
    type: 'Expense',
    category: 'Transport',
  },
];

const navigation: { name: Screen; icon: string }[] = [
  { name: 'Home', icon: '⌂' },
  { name: 'Transactions', icon: '⇄' },
  { name: 'Insights', icon: '▥' },
  { name: 'Settings', icon: '⚙' },
];

const money = (amount: number) =>
  `KSh ${amount.toLocaleString('en-KE', {
    maximumFractionDigits: 2,
  })}`;

export default function App() {
  const { width } = useWindowDimensions();
  const wideScreen = width >= 850;

  const [screen, setScreen] = useState<Screen>('Home');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [isLoaded, setIsLoaded] = useState(false);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [category, setCategory] = useState('Food');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Holds the transaction awaiting delete confirmation.
  const [pendingDelete, setPendingDelete] =
    useState<Transaction | null>(null);

  const [appearance, setAppearance] = useState('Light');
  const [themeColor, setThemeColor] = useState('#3157D5');
  const [customColor, setCustomColor] = useState('#3157D5');
  const [fontPreference, setFontPreference] = useState('System');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  function AppText(props: React.ComponentProps<typeof NativeText>) {
    const chosenFont =
      fontPreference === 'Serif'
        ? 'serif'
        : fontPreference === 'Monospace'
          ? 'monospace'
          : undefined;

    return (
      <NativeText
        {...props}
        style={[{ fontFamily: chosenFont }, props.style]}
      />
    );
  }

  // Load appearance preferences.
  useEffect(() => {
    async function loadPreferences() {
      try {
        const saved = await AsyncStorage.getItem(PREFERENCES_KEY);

        if (saved) {
          const prefs = JSON.parse(saved) as {
            appearance?: string;
            themeColor?: string;
            fontPreference?: string;
          };

          if (['Light', 'Dark'].includes(prefs.appearance ?? '')) {
            setAppearance(prefs.appearance!);
          }

          if (
            typeof prefs.themeColor === 'string' &&
            /^#[0-9A-Fa-f]{6}$/.test(prefs.themeColor)
          ) {
            setThemeColor(prefs.themeColor);
            setCustomColor(prefs.themeColor);
          }

          if (
            ['System', 'Serif', 'Monospace'].includes(
              prefs.fontPreference ?? '',
            )
          ) {
            setFontPreference(prefs.fontPreference!);
          }
        }
      } catch (error) {
        console.error('Could not load preferences:', error);
      } finally {
        setPreferencesLoaded(true);
      }
    }

    loadPreferences();
  }, []);

  // Automatically save appearance preferences on this device.
  useEffect(() => {
    if (!preferencesLoaded) return;

    AsyncStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({
        appearance,
        themeColor,
        fontPreference,
      }),
    ).catch((error) =>
      console.error('Could not save preferences:', error),
    );
  }, [
    appearance,
    themeColor,
    fontPreference,
    preferencesLoaded,
  ]);

  // Load saved transactions.
  useEffect(() => {
    async function loadTransactions() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (saved !== null) {
          const parsed: unknown = JSON.parse(saved);

          if (Array.isArray(parsed)) {
            setTransactions(parsed as Transaction[]);
          }
        }
      } catch (error) {
        console.error('Could not load transactions:', error);
      } finally {
        setIsLoaded(true);
      }
    }

    loadTransactions();
  }, []);

  // Save transactions whenever they change.
  useEffect(() => {
    if (!isLoaded) return;

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(transactions),
    ).catch((error) =>
      console.error('Could not save transactions:', error),
    );
  }, [transactions, isLoaded]);

  const income = transactions
    .filter((item) => item.type === 'Income')
    .reduce((sum, item) => sum + item.amount, 0);

  const expenses = transactions
    .filter((item) => item.type === 'Expense')
    .reduce((sum, item) => sum + item.amount, 0);

  const balance = income - expenses;
  const dark = appearance === 'Dark';

  const colors = {
    background: dark ? '#101522' : '#F5F7FB',
    surface: dark ? '#1B2333' : '#FFFFFF',
    text: dark ? '#F4F6FC' : '#172033',
    muted: dark ? '#AAB4C8' : '#737D90',
    border: dark ? '#354056' : '#E0E5EF',
    primary: themeColor,
    green: '#13834B',
    red: '#D14343',
  };

  function navigate(destination: Screen) {
    setScreen(destination);
    setDrawerOpen(false);
  }

  function resetForm() {
    setTitle('');
    setAmount('');
    setType('Expense');
    setCategory('Food');
    setEditingId(null);
  }

  function addTransaction() {
    const numericAmount = Number(amount);

    if (
      !title.trim() ||
      !amount.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      Alert.alert(
        'Check your details',
        'Enter a description and an amount greater than zero.',
      );
      return;
    }

    // Update an existing transaction.
    if (editingId !== null) {
      setTransactions((current) =>
        current.map((item) =>
          item.id === editingId
            ? {
                ...item,
                title: title.trim(),
                amount: numericAmount,
                type,
                category,
              }
            : item,
        ),
      );

      resetForm();

      Alert.alert(
        'Changes saved',
        'Your transaction has been updated.',
      );

      return;
    }

    // Add a new transaction.
    const newTransaction: Transaction = {
      id: Date.now(),
      title: title.trim(),
      amount: numericAmount,
      type,
      category,
    };

    setTransactions((current) => [
      newTransaction,
      ...current,
    ]);

    resetForm();

    Alert.alert(
      'Saved',
      'Your transaction has been added.',
    );
  }

  function startEditing(item: Transaction) {
    setEditingId(item.id);
    setTitle(item.title);
    setAmount(String(item.amount));
    setType(item.type);
    setCategory(item.category);
    setScreen('Transactions');
    setDrawerOpen(false);
  }

  // Open our custom delete confirmation dialog.
  function deleteTransaction(item: Transaction) {
    setPendingDelete(item);
  }

  // Delete only after the user confirms.
  function confirmDelete() {
    if (!pendingDelete) return;

    const id = pendingDelete.id;

    setTransactions((current) =>
      current.filter(
        (transaction) => transaction.id !== id,
      ),
    );

    if (editingId === id) {
      resetForm();
    }

    setPendingDelete(null);
  }

  // Save settings and return to Home.
  async function applySettings() {
    try {
      await AsyncStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify({
          appearance,
          themeColor,
          fontPreference,
        }),
      );

      setScreen('Home');
      setDrawerOpen(false);
    } catch (error) {
      console.error('Could not save settings:', error);

      Alert.alert(
        'Could not save settings',
        'Please try again.',
      );
    }
  }

  function renderSidebar() {
    return (
      <View
        style={[
          styles.sidebar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          !wideScreen && styles.drawer,
        ]}
      >
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <AppText style={styles.brandIconText}>₭</AppText>
          </View>

          <View>
            <AppText
              style={[
                styles.brandName,
                { color: colors.text },
              ]}
            >
              PocketTrack
            </AppText>

            <AppText
              style={[
                styles.smallMuted,
                { color: colors.muted },
              ]}
            >
              PERSONAL FINANCE
            </AppText>
          </View>
        </View>

        <AppText
          style={[
            styles.navLabel,
            { color: colors.muted },
          ]}
        >
          WORKSPACE
        </AppText>

        {navigation.map((item) => {
          const selected = screen === item.name;

          return (
            <TouchableOpacity
              key={item.name}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => navigate(item.name)}
              style={[
                styles.navItem,
                selected && [
                  styles.navItemSelected,
                  { backgroundColor: themeColor },
                ],
              ]}
            >
              <AppText
                style={[
                  styles.navIcon,
                  {
                    color: selected
                      ? '#FFFFFF'
                      : colors.muted,
                  },
                ]}
              >
                {item.icon}
              </AppText>

              <AppText
                style={[
                  styles.navText,
                  {
                    color: selected
                      ? '#FFFFFF'
                      : colors.text,
                  },
                ]}
              >
                {item.name}
              </AppText>

              {selected && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}

        <View style={styles.sidebarFooter}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>R</AppText>
          </View>

          <View style={{ flex: 1 }}>
            <AppText
              style={[
                styles.profileName,
                { color: colors.text },
              ]}
            >
              My finances
            </AppText>

            <AppText
              style={[
                styles.smallMuted,
                { color: colors.muted },
              ]}
            >
              Personal account
            </AppText>
          </View>
        </View>
      </View>
    );
  }

  function renderSummaryCards() {
    return (
      <View style={styles.summaryRow}>
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <AppText
            style={[
              styles.cardLabel,
              { color: colors.muted },
            ]}
          >
            Total income
          </AppText>

          <AppText
            style={[
              styles.summaryAmount,
              { color: colors.green },
            ]}
          >
            {money(income)}
          </AppText>
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <AppText
            style={[
              styles.cardLabel,
              { color: colors.muted },
            ]}
          >
            Total expenses
          </AppText>

          <AppText
            style={[
              styles.summaryAmount,
              { color: colors.red },
            ]}
          >
            {money(expenses)}
          </AppText>
        </View>
      </View>
    );
  }

  function renderTransaction(item: Transaction) {
    return (
      <View
        key={item.id}
        style={[
          styles.transactionRow,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.transactionIcon}>
          <AppText style={styles.transactionIconText}>
            {item.type === 'Income' ? '↙' : '↗'}
          </AppText>
        </View>

        <View style={styles.transactionDetails}>
          <AppText
            style={[
              styles.transactionTitle,
              { color: colors.text },
            ]}
          >
            {item.title}
          </AppText>

          <AppText
            style={[
              styles.smallMuted,
              { color: colors.muted },
            ]}
          >
            {item.category} · {item.type}
          </AppText>

          <View style={styles.transactionActions}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.title}`}
              onPress={() => startEditing(item)}
              style={[
                styles.smallActionButton,
                { borderColor: themeColor },
              ]}
            >
              <AppText
                style={{
                  color: themeColor,
                  fontWeight: '700',
                  fontSize: 12,
                }}
              >
                Edit
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.title}`}
              onPress={() => deleteTransaction(item)}
              style={[
                styles.smallActionButton,
                { borderColor: colors.red },
              ]}
            >
              <AppText
                style={{
                  color: colors.red,
                  fontWeight: '700',
                  fontSize: 12,
                }}
              >
                Delete
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        <AppText
          style={{
            color:
              item.type === 'Income'
                ? colors.green
                : colors.red,
            fontWeight: '700',
            textAlign: 'right',
            flexShrink: 0,
          }}
        >
          {item.type === 'Income' ? '+' : '−'}
          {money(item.amount)}
        </AppText>
      </View>
    );
  }

  function renderHome() {
    return (
      <>
        <View
          style={[
            styles.balanceCard,
            { backgroundColor: colors.primary },
          ]}
        >
          <AppText style={styles.balanceLabel}>
            AVAILABLE BALANCE
          </AppText>

          <AppText style={styles.balanceAmount}>
            {money(balance)}
          </AppText>

          <AppText style={styles.balanceNote}>
            Income minus recorded expenses
          </AppText>
        </View>

        {renderSummaryCards()}

        <View style={styles.sectionHeadingRow}>
          <AppText
            style={[
              styles.sectionTitle,
              { color: colors.text },
            ]}
          >
            Recent transactions
          </AppText>

          <TouchableOpacity
            onPress={() => navigate('Transactions')}
          >
            <AppText
              style={[
                styles.linkText,
                { color: themeColor },
              ]}
            >
              View all →
            </AppText>
          </TouchableOpacity>
        </View>

        {transactions.length === 0 ? (
          <AppText
            style={[
              styles.emptyText,
              { color: colors.muted },
            ]}
          >
            No transactions yet. Add your first transaction.
          </AppText>
        ) : (
          transactions.slice(0, 5).map(renderTransaction)
        )}
      </>
    );
  }

  function renderTransactions() {
    const inputFont =
      fontPreference === 'Serif'
        ? 'serif'
        : fontPreference === 'Monospace'
          ? 'monospace'
          : undefined;

    return (
      <>
        <AppText
          style={[
            styles.sectionTitle,
            { color: colors.text },
          ]}
        >
          {editingId !== null
            ? 'Edit transaction'
            : 'Add a transaction'}
        </AppText>

        {editingId !== null && (
          <View
            style={[
              styles.editingNotice,
              {
                backgroundColor: colors.surface,
                borderColor: themeColor,
              },
            ]}
          >
            <AppText
              style={{
                color: colors.text,
                fontWeight: '700',
              }}
            >
              Editing existing transaction
            </AppText>

            <TouchableOpacity onPress={resetForm}>
              <AppText
                style={{
                  color: themeColor,
                  fontWeight: '700',
                }}
              >
                Cancel editing
              </AppText>
            </TouchableOpacity>
          </View>
        )}

        <View
          style={[
            styles.form,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <AppText
            style={[
              styles.cardLabel,
              { color: colors.muted },
            ]}
          >
            Description
          </AppText>

          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                fontFamily: inputFont,
              },
            ]}
            placeholder="e.g. Groceries"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
            accessibilityLabel="Transaction description"
          />

          <AppText
            style={[
              styles.cardLabel,
              { color: colors.muted },
            ]}
          >
            Amount in KSh
          </AppText>

          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                fontFamily: inputFont,
              },
            ]}
            placeholder="e.g. 500"
            placeholderTextColor={colors.muted}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            accessibilityLabel="Transaction amount"
          />

          <AppText
            style={[
              styles.cardLabel,
              { color: colors.muted },
            ]}
          >
            Transaction type
          </AppText>

          <View style={styles.optionRow}>
            {(['Expense', 'Income'] as const).map(
              (option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => setType(option)}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: colors.background,
                    },
                    type === option && [
                      styles.optionSelected,
                      { backgroundColor: themeColor },
                    ],
                  ]}
                >
                  <AppText
                    style={{
                      color:
                        type === option
                          ? '#FFFFFF'
                          : colors.text,
                      fontWeight: '600',
                    }}
                  >
                    {option}
                  </AppText>
                </TouchableOpacity>
              ),
            )}
          </View>

          <AppText
            style={[
              styles.cardLabel,
              { color: colors.muted },
            ]}
          >
            Category
          </AppText>

          <View style={styles.categoryRow}>
            {categories.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => setCategory(option)}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: colors.background,
                  },
                  category === option && [
                    styles.optionSelected,
                    { backgroundColor: themeColor },
                  ],
                ]}
              >
                <AppText
                  style={{
                    color:
                      category === option
                        ? '#FFFFFF'
                        : colors.text,
                    fontWeight: '600',
                  }}
                >
                  {option}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: themeColor },
            ]}
            onPress={addTransaction}
          >
            <AppText style={styles.primaryButtonText}>
              {editingId !== null
                ? 'Save changes'
                : '+ Add transaction'}
            </AppText>
          </TouchableOpacity>

          {editingId !== null && (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { borderColor: colors.border },
              ]}
              onPress={resetForm}
            >
              <AppText
                style={[
                  styles.secondaryButtonText,
                  { color: colors.text },
                ]}
              >
                Cancel
              </AppText>
            </TouchableOpacity>
          )}
        </View>

        <AppText
          style={[
            styles.sectionTitle,
            { color: colors.text },
          ]}
        >
          All transactions ({transactions.length})
        </AppText>

        {transactions.length === 0 ? (
          <AppText
            style={[
              styles.emptyText,
              { color: colors.muted },
            ]}
          >
            Your transaction history will appear here.
          </AppText>
        ) : (
          transactions.map(renderTransaction)
        )}
      </>
    );
  }

  function renderInsights() {
    const expenseTransactions = transactions.filter(
      (item) => item.type === 'Expense',
    );

    const categoryTotals =
      expenseTransactions.reduce<Record<string, number>>(
        (totals, item) => {
          totals[item.category] =
            (totals[item.category] || 0) + item.amount;
          return totals;
        },
        {},
      );

    const expenseCategories = Object.entries(
      categoryTotals,
    ).sort((a, b) => b[1] - a[1]);

    return (
      <>
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <AppText
            style={[
              styles.cardLabel,
              { color: colors.muted },
            ]}
          >
            MONEY LEFT
          </AppText>

          <AppText
            style={[
              styles.insightAmount,
              { color: colors.text },
            ]}
          >
            {money(balance)}
          </AppText>

          <AppText
            style={[
              styles.smallMuted,
              { color: colors.muted },
            ]}
          >
            Based on all transactions currently recorded.
          </AppText>
        </View>

        {renderSummaryCards()}

        <AppText
          style={[
            styles.sectionTitle,
            { color: colors.text },
          ]}
        >
          Expenses by category
        </AppText>

        {expenseCategories.length === 0 ? (
          <AppText
            style={[
              styles.emptyText,
              { color: colors.muted },
            ]}
          >
            Add expense transactions to see your category breakdown.
          </AppText>
        ) : (
          expenseCategories.map(([name, total]) => {
            const percentage =
              expenses > 0 ? (total / expenses) * 100 : 0;

            return (
              <View
                key={name}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.sectionHeadingRow}>
                  <AppText
                    style={[
                      styles.transactionTitle,
                      { color: colors.text },
                    ]}
                  >
                    {name}
                  </AppText>

                  <AppText
                    style={[
                      styles.transactionTitle,
                      { color: colors.text },
                    ]}
                  >
                    {money(total)}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.progressTrack,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${percentage}%`,
                        backgroundColor: themeColor,
                      },
                    ]}
                  />
                </View>

                <AppText
                  style={[
                    styles.smallMuted,
                    { color: colors.muted },
                  ]}
                >
                  {percentage.toFixed(1)}% of recorded expenses
                </AppText>
              </View>
            );
          })
        )}
      </>
    );
  }

  function renderSettings() {
    const inputFont =
      fontPreference === 'Serif'
        ? 'serif'
        : fontPreference === 'Monospace'
          ? 'monospace'
          : undefined;

    return (
      <>
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <AppText
            style={[
              styles.sectionTitle,
              { color: colors.text },
            ]}
          >
            Appearance
          </AppText>

          <AppText
            style={[
              styles.smallMuted,
              { color: colors.muted },
            ]}
          >
            Choose how PocketTrack looks on this device.
          </AppText>

          <View style={styles.optionRow}>
            {['Light', 'Dark'].map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => setAppearance(option)}
                style={[
                  styles.optionButton,
                  { backgroundColor: colors.background },
                  appearance === option && [
                    styles.optionSelected,
                    { backgroundColor: themeColor },
                  ],
                ]}
              >
                <AppText
                  style={{
                    color:
                      appearance === option
                        ? '#FFFFFF'
                        : colors.text,
                    fontWeight: '600',
                  }}
                >
                  {option}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>

          <AppText
            style={[
              styles.smallMuted,
              { color: colors.muted },
            ]}
          >
            Your light or dark appearance preference is saved on this device.
          </AppText>
        </View>

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <AppText
            style={[
              styles.sectionTitle,
              { color: colors.text },
            ]}
          >
            Theme colour
          </AppText>

          <AppText
            style={[
              styles.smallMuted,
              { color: colors.muted },
            ]}
          >
            Pick an accent colour for buttons, highlights and navigation.
          </AppText>

          <View style={styles.themeOptionsRow}>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                accessibilityRole="button"
                accessibilityLabel={`${option.name} theme colour`}
                accessibilityState={{
                  selected: themeColor === option.value,
                }}
                onPress={() => {
                  setThemeColor(option.value);
                  setCustomColor(option.value);
                }}
                style={[
                  styles.themeSwatch,
                  { backgroundColor: option.value },
                  themeColor === option.value &&
                    styles.themeSwatchSelected,
                ]}
              >
                {themeColor === option.value && (
                  <NativeText style={styles.swatchCheck}>
                    ✓
                  </NativeText>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <AppText
            style={[
              styles.smallMuted,
              {
                color: colors.muted,
                marginTop: 6,
              },
            ]}
          >
            Custom colour (hex code)
          </AppText>

          <View style={styles.customColorRow}>
            <TextInput
              value={customColor}
              onChangeText={setCustomColor}
              autoCapitalize="characters"
              maxLength={7}
              placeholder="#E85D9E"
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                styles.customColorInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  fontFamily: inputFont,
                },
              ]}
            />

            <TouchableOpacity
              onPress={() => {
                if (
                  /^#[0-9A-Fa-f]{6}$/.test(customColor.trim())
                ) {
                  setThemeColor(
                    customColor.trim().toUpperCase(),
                  );
                } else {
                  Alert.alert(
                    'Invalid colour',
                    'Enter a hex code like #E85D9E.',
                  );
                }
              }}
              style={[
                styles.applyColorButton,
                { backgroundColor: themeColor },
              ]}
            >
              <NativeText style={styles.primaryButtonText}>
                Apply
              </NativeText>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <AppText
            style={[
              styles.sectionTitle,
              { color: colors.text },
            ]}
          >
            Font preference
          </AppText>

          <AppText
            style={[
              styles.smallMuted,
              { color: colors.muted },
            ]}
          >
            Preview the font style and choose the one that's easiest for you to read.
          </AppText>

          <View style={styles.fontOptions}>
            {(
              [
                {
                  name: 'System',
                  sample: 'Aa',
                  description: 'Clean and familiar',
                },
                {
                  name: 'Serif',
                  sample: 'Aa',
                  description: 'Classic, book-like',
                },
                {
                  name: 'Monospace',
                  sample: 'Aa',
                  description: 'Technical, fixed-width',
                },
              ] as const
            ).map((option) => (
              <TouchableOpacity
                key={option.name}
                onPress={() =>
                  setFontPreference(option.name)
                }
                style={[
                  styles.fontOption,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                  fontPreference === option.name && {
                    borderColor: themeColor,
                    borderWidth: 2,
                  },
                ]}
              >
                <NativeText
                  style={{
                    color: colors.text,
                    fontSize: 24,
                    fontFamily:
                      option.name === 'Serif'
                        ? 'serif'
                        : option.name === 'Monospace'
                          ? 'monospace'
                          : undefined,
                  }}
                >
                  {option.sample}
                </NativeText>

                <AppText
                  style={[
                    styles.transactionTitle,
                    { color: colors.text },
                  ]}
                >
                  {option.name}
                </AppText>

                <AppText
                  style={[
                    styles.smallMuted,
                    { color: colors.muted },
                  ]}
                >
                  {option.description}
                </AppText>

                {fontPreference === option.name && (
                  <AppText
                    style={{
                      color: themeColor,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    Selected
                  </AppText>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <AppText
            style={[
              styles.smallMuted,
              {
                color: colors.muted,
                marginTop: 10,
              },
            ]}
          >
            Your theme and font choices are saved on this device.
          </AppText>
        </View>

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <AppText
            style={[
              styles.sectionTitle,
              { color: colors.text },
            ]}
          >
            Your data
          </AppText>

          <AppText
            style={[
              styles.smallMuted,
              { color: colors.muted },
            ]}
          >
            Transactions are stored locally on this device using AsyncStorage. They do not automatically sync between your phone and computer.
          </AppText>

          <AppText
            style={[
              styles.smallMuted,
              {
                color: colors.muted,
                marginTop: 12,
              },
            ]}
          >
            Transactions recorded: {transactions.length}
          </AppText>
        </View>

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <AppText
            style={[
              styles.sectionTitle,
              { color: colors.text },
            ]}
          >
            Feedback
          </AppText>

          <AppText
            style={[
              styles.smallMuted,
              { color: colors.muted },
            ]}
          >
            Enjoying the app? Feedback and rating options will be added as we develop the settings screen.
          </AppText>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={applySettings}
          style={[
            styles.primaryButton,
            {
              backgroundColor: themeColor,
              marginBottom: 20,
            },
          ]}
        >
          <AppText style={styles.primaryButtonText}>
            Apply changes &amp; go Home
          </AppText>
        </TouchableOpacity>
      </>
    );
  }

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <AppText style={styles.loadingText}>
          Loading your transactions...
        </AppText>
      </View>
    );
  }

  const pageTitle: Record<Screen, string> = {
    Home: 'Your financial overview',
    Transactions: 'Manage your money',
    Insights: 'Understand your spending',
    Settings: 'Make it yours',
  };

  return (
    <View
      style={[
        styles.app,
        { backgroundColor: colors.background },
      ]}
    >
      {wideScreen && renderSidebar()}

      {!wideScreen && drawerOpen && (
        <View style={styles.drawerLayer}>
          <TouchableOpacity
            accessibilityLabel="Close navigation menu"
            style={styles.drawerBackdrop}
            onPress={() => setDrawerOpen(false)}
          />

          {renderSidebar()}
        </View>
      )}

      <View style={styles.main}>
        <View
          style={[
            styles.topbar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {!wideScreen && (
            <TouchableOpacity
              accessibilityLabel="Open navigation menu"
              onPress={() => setDrawerOpen(true)}
              style={styles.menuButton}
            >
              <AppText
                style={[
                  styles.menuText,
                  { color: colors.text },
                ]}
              >
                ☰
              </AppText>
            </TouchableOpacity>
          )}

          <View style={{ flex: 1 }}>
            <AppText
              style={[
                styles.topbarTitle,
                { color: colors.text },
              ]}
            >
              {screen}
            </AppText>

            <AppText
              style={[
                styles.smallMuted,
                { color: colors.muted },
              ]}
            >
              {pageTitle[screen]}
            </AppText>
          </View>

          <View style={styles.topbarBadge}>
            <AppText style={styles.topbarBadgeText}>
              R
            </AppText>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <AppText
            style={[
              styles.greeting,
              { color: colors.muted },
            ]}
          >
            Hello, Rue!
          </AppText>

          <AppText
            style={[
              styles.pageHeading,
              { color: colors.text },
            ]}
          >
            {screen === 'Home'
              ? 'Personal Expense Tracker'
              : pageTitle[screen]}
          </AppText>

          {screen === 'Home' && renderHome()}
          {screen === 'Transactions' && renderTransactions()}
          {screen === 'Insights' && renderInsights()}
          {screen === 'Settings' && renderSettings()}

          <AppText
            style={[
              styles.footer,
              { color: colors.muted },
            ]}
          >
            PocketTrack · Your money, made clearer
          </AppText>
        </ScrollView>
      </View>

      {/* Custom delete confirmation dialog */}
      {pendingDelete !== null && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            elevation: 20,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 380,
              padding: 24,
              borderRadius: 18,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
            }}
          >
            <AppText
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: colors.text,
                marginBottom: 10,
              }}
            >
              Delete transaction?
            </AppText>

            <AppText
              style={{
                color: colors.muted,
                fontSize: 14,
                lineHeight: 21,
                marginBottom: 22,
              }}
            >
              Are you sure you want to delete "{pendingDelete.title}"?
              This action cannot be undone.
            </AppText>

            <View
              style={{
                flexDirection: 'row',
                gap: 10,
              }}
            >
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setPendingDelete(null)}
                style={{
                  flex: 1,
                  padding: 13,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                }}
              >
                <AppText
                  style={{
                    color: colors.text,
                    fontWeight: '700',
                  }}
                >
                  Cancel
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                onPress={confirmDelete}
                style={{
                  flex: 1,
                  padding: 13,
                  borderRadius: 10,
                  backgroundColor: colors.red,
                  alignItems: 'center',
                }}
              >
                <AppText
                  style={{
                    color: '#FFFFFF',
                    fontWeight: '800',
                  }}
                >
                  Delete
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    flexDirection: 'row',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
  },
  loadingText: {
    color: '#172033',
    fontSize: 16,
  },
  sidebar: {
    width: 245,
    borderRightWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 32,
    paddingBottom: 20,
  },
  drawer: {
    position: 'absolute',
    zIndex: 3,
    top: 0,
    bottom: 0,
    left: 0,
    width: 270,
    elevation: 12,
  },
  drawerLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 5,
    justifyContent: 'flex-start',
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 16, 30, 0.48)',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 42,
  },
  brandIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#3157D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconText: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: 'bold',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
  },
  smallMuted: {
    fontSize: 12,
    lineHeight: 18,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: 11,
    marginBottom: 7,
    gap: 12,
  },
  navItemSelected: {
    backgroundColor: '#3157D5',
  },
  navIcon: {
    width: 25,
    textAlign: 'center',
    fontSize: 23,
  },
  navText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  sidebarFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E5EF',
    paddingTop: 18,
    marginTop: 'auto',
  },
  avatar: {
    width: 37,
    height: 37,
    borderRadius: 19,
    backgroundColor: '#E6ECFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#3157D5',
    fontSize: 17,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  topbar: {
    minHeight: 76,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  topbarTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  topbarBadge: {
    height: 38,
    width: 38,
    borderRadius: 19,
    backgroundColor: '#E6ECFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbarBadgeText: {
    color: '#3157D5',
    fontWeight: '800',
    fontSize: 16,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 25,
  },
  content: {
    padding: 25,
    paddingBottom: 45,
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
  },
  greeting: {
    fontSize: 14,
    marginBottom: 5,
  },
  pageHeading: {
    fontSize: 25,
    fontWeight: '800',
    marginBottom: 22,
  },
  balanceCard: {
    padding: 25,
    borderRadius: 18,
    marginBottom: 18,
  },
  balanceLabel: {
    color: '#E5EAFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '800',
    marginTop: 10,
  },
  balanceNote: {
    color: '#E5EAFF',
    fontSize: 12,
    marginTop: 9,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 13,
    marginBottom: 22,
  },
  summaryCard: {
    flex: 1,
    minWidth: 0,
    padding: 17,
    borderWidth: 1,
    borderRadius: 14,
  },
  cardLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 17,
    fontWeight: '800',
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 13,
  },
  linkText: {
    color: '#3157D5',
    fontWeight: '700',
    fontSize: 13,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 13,
    borderWidth: 1,
    marginBottom: 9,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionIconText: {
    color: '#3157D5',
    fontSize: 22,
    fontWeight: '800',
  },
  transactionDetails: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  transactionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 6,
  },
  smallActionButton: {
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  emptyText: {
    textAlign: 'center',
    padding: 22,
    lineHeight: 21,
  },
  form: {
    padding: 17,
    borderRadius: 15,
    borderWidth: 1,
    gap: 10,
    marginBottom: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 15,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: '#3157D5',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 5,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 9,
  },
  primaryButton: {
    backgroundColor: '#3157D5',
    padding: 15,
    borderRadius: 11,
    alignItems: 'center',
    marginTop: 7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    padding: 13,
    borderRadius: 11,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 2,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  editingNotice: {
    padding: 13,
    borderRadius: 11,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  themeOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  themeSwatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeSwatchSelected: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.08 }],
  },
  swatchCheck: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  customColorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  customColorInput: {
    flex: 1,
    marginBottom: 0,
  },
  applyColorButton: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  fontOption: {
    flex: 1,
    minWidth: 0,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  infoCard: {
    padding: 19,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 14,
  },
  insightAmount: {
    fontSize: 27,
    fontWeight: '800',
    marginBottom: 6,
  },
  categoryCard: {
    padding: 15,
    borderRadius: 13,
    borderWidth: 1,
    marginBottom: 10,
    gap: 10,
  },
  progressTrack: {
    height: 8,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
    borderRadius: 5,
    backgroundColor: '#3157D5',
  },
  footer: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 30,
  },
});