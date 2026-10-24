import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Transaction = {
  id: number;
  title: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: string;
};

const STORAGE_KEY = 'personal_expense_tracker_transactions';

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

export default function App() {
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [category, setCategory] = useState('Food');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved transactions when the app starts.
  useEffect(() => {
    async function loadTransactions() {
      try {
        const savedTransactions = await AsyncStorage.getItem(STORAGE_KEY);

        if (savedTransactions !== null) {
          const parsedTransactions: unknown = JSON.parse(savedTransactions);

          if (Array.isArray(parsedTransactions)) {
            setTransactions(parsedTransactions as Transaction[]);
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

  // Save transactions whenever the list changes.
  useEffect(() => {
    if (!isLoaded) return;

    async function saveTransactions() {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(transactions)
        );
      } catch (error) {
        console.error('Could not save transactions:', error);
      }
    }

    saveTransactions();
  }, [transactions, isLoaded]);

  const income = transactions
    .filter((item) => item.type === 'Income')
    .reduce((total, item) => total + item.amount, 0);

  const expenses = transactions
    .filter((item) => item.type === 'Expense')
    .reduce((total, item) => total + item.amount, 0);

  const balance = income - expenses;

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
        'Enter a description and an amount greater than zero.'
      );
      return;
    }

    const newTransaction: Transaction = {
      id: Date.now(),
      title: title.trim(),
      amount: numericAmount,
      type,
      category,
    };

    setTransactions((current) => [newTransaction, ...current]);
    setTitle('');
    setAmount('');
  }

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Loading your transactions...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Hello, Rue!</Text>
      <Text style={styles.heading}>Personal Expense Tracker</Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balance}>
          KSh {balance.toLocaleString('en-KE')}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.cardLabel}>Income</Text>
          <Text style={styles.income}>
            KSh {income.toLocaleString('en-KE')}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.cardLabel}>Expenses</Text>
          <Text style={styles.expense}>
            KSh {expenses.toLocaleString('en-KE')}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Add Transaction</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Description (e.g. Groceries)"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={styles.input}
          placeholder="Amount in KSh"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        <Text style={styles.cardLabel}>Transaction Type</Text>

        <View style={styles.summaryRow}>
          {(['Expense', 'Income'] as const).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.typeButton,
                type === option && styles.selectedButton,
              ]}
              onPress={() => setType(option)}
            >
              <Text
                style={[
                  styles.typeText,
                  type === option && styles.selectedText,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.cardLabel}>Category</Text>

        <View style={styles.categoryRow}>
          {['Food', 'Transport', 'Salary', 'Other'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.categoryButton,
                category === option && styles.selectedButton,
              ]}
              onPress={() => setCategory(option)}
            >
              <Text
                style={[
                  styles.typeText,
                  category === option && styles.selectedText,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={addTransaction}
        >
          <Text style={styles.addButtonText}>Add Transaction</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent Transactions</Text>

      {transactions.length === 0 ? (
        <Text style={styles.emptyText}>
          No transactions yet. Add your first one above!
        </Text>
      ) : (
        transactions.map((item) => (
          <View key={item.id} style={styles.transactionRow}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionTitle}>{item.title}</Text>
              <Text style={styles.cardLabel}>{item.category}</Text>
            </View>

            <Text
              style={
                item.type === 'Income' ? styles.income : styles.expense
              }
            >
              {item.type === 'Income' ? '+' : '-'} KSh{' '}
              {item.amount.toLocaleString('en-KE')}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 55,
    backgroundColor: '#F5F7FB',
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
  },
  loadingText: {
    fontSize: 16,
    color: '#172033',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 20,
    color: '#172033',
  },
  balanceCard: {
    backgroundColor: '#3157D5',
    padding: 22,
    borderRadius: 16,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  cardLabel: {
    fontSize: 13,
    color: '#777',
  },
  balance: {
    fontSize: 29,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  income: {
    color: '#13834B',
    fontWeight: 'bold',
    fontSize: 16,
  },
  expense: {
    color: '#D14343',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 12,
    color: '#172033',
  },
  form: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D9DFEA',
    borderRadius: 9,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#FFF',
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 9,
    alignItems: 'center',
    backgroundColor: '#EEF1F7',
  },
  selectedButton: {
    backgroundColor: '#3157D5',
  },
  typeText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 12,
  },
  selectedText: {
    color: '#FFF',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: '#EEF1F7',
  },
  addButton: {
    backgroundColor: '#172033',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  transactionInfo: {
    flex: 1,
    gap: 4,
  },
  transactionTitle: {
    fontWeight: '600',
    fontSize: 15,
    color: '#172033',
  },
  emptyText: {
    color: '#666',
    padding: 16,
    textAlign: 'center',
  },
});
