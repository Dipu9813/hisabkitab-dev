// Offline storage utilities for managing local data
export interface OfflineMember {
  id: string;
  name: string;
  color: string;
}

export interface OfflineExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  date: string;
  splitType: 'equal' | 'custom';
  customSplits?: { [memberId: string]: number };
}

export interface OfflineGroup {
  id: string;
  name: string;
  members: OfflineMember[];
  expenses: OfflineExpense[];
  createdAt: string;
  lastModified: string;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

const STORAGE_KEYS = {
  OFFLINE_GROUPS: 'hisabkitab_offline_groups',
  CURRENT_GROUP: 'hisabkitab_current_group'
};

// Generate random colors for members
const MEMBER_COLORS = [
  'bg-gradient-to-br from-blue-400 to-blue-600',
  'bg-gradient-to-br from-green-400 to-green-600',
  'bg-gradient-to-br from-purple-400 to-purple-600',
  'bg-gradient-to-br from-pink-400 to-rose-500',
  'bg-gradient-to-br from-yellow-400 to-orange-500',
  'bg-gradient-to-br from-red-400 to-red-600',
  'bg-gradient-to-br from-indigo-400 to-indigo-600',
  'bg-gradient-to-br from-teal-400 to-teal-600',
];

export class OfflineStorage {
  static getRandomColor(): string {
    return MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)];
  }

  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static getAllGroups(): OfflineGroup[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.OFFLINE_GROUPS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading offline groups:', error);
      return [];
    }
  }

  static saveGroups(groups: OfflineGroup[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_GROUPS, JSON.stringify(groups));
    } catch (error) {
      console.error('Error saving offline groups:', error);
    }
  }

  static createGroup(name: string, memberNames: string[]): OfflineGroup {
    const id = this.generateId();
    const members: OfflineMember[] = memberNames.map(name => ({
      id: this.generateId(),
      name: name.trim(),
      color: this.getRandomColor()
    }));

    const group: OfflineGroup = {
      id,
      name: name.trim(),
      members,
      expenses: [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    const groups = this.getAllGroups();
    groups.push(group);
    this.saveGroups(groups);
    
    return group;
  }

  static updateGroup(groupId: string, updates: Partial<OfflineGroup>): OfflineGroup | null {
    const groups = this.getAllGroups();
    const groupIndex = groups.findIndex(g => g.id === groupId);
    
    if (groupIndex === -1) return null;

    groups[groupIndex] = {
      ...groups[groupIndex],
      ...updates,
      lastModified: new Date().toISOString()
    };

    this.saveGroups(groups);
    return groups[groupIndex];
  }

  static deleteGroup(groupId: string): boolean {
    const groups = this.getAllGroups();
    const filteredGroups = groups.filter(g => g.id !== groupId);
    
    if (filteredGroups.length === groups.length) return false;
    
    this.saveGroups(filteredGroups);
    return true;
  }

  static getGroup(groupId: string): OfflineGroup | null {
    const groups = this.getAllGroups();
    return groups.find(g => g.id === groupId) || null;
  }

  static addExpense(groupId: string, expense: Omit<OfflineExpense, 'id'>): OfflineExpense | null {
    const group = this.getGroup(groupId);
    if (!group) return null;

    const newExpense: OfflineExpense = {
      ...expense,
      id: this.generateId()
    };

    group.expenses.push(newExpense);
    this.updateGroup(groupId, { expenses: group.expenses });
    
    return newExpense;
  }

  static deleteExpense(groupId: string, expenseId: string): boolean {
    const group = this.getGroup(groupId);
    if (!group) return false;

    const filteredExpenses = group.expenses.filter(e => e.id !== expenseId);
    
    if (filteredExpenses.length === group.expenses.length) return false;
    
    this.updateGroup(groupId, { expenses: filteredExpenses });
    return true;
  }

  static calculateSettlements(groupId: string): Settlement[] {
    const group = this.getGroup(groupId);
    if (!group || group.expenses.length === 0) return [];

    // Calculate net balances for each member
    const balances: { [memberId: string]: number } = {};
    
    // Initialize balances
    group.members.forEach(member => {
      balances[member.id] = 0;
    });

    // Process each expense
    group.expenses.forEach(expense => {
      if (expense.splitType === 'equal') {
        const splitAmount = expense.amount / expense.splitAmong.length;
        
        // Person who paid gets credited
        balances[expense.paidBy] += expense.amount;
        
        // Each person in split gets debited
        expense.splitAmong.forEach(memberId => {
          balances[memberId] -= splitAmount;
        });
      } else if (expense.splitType === 'custom' && expense.customSplits) {
        // Person who paid gets credited
        balances[expense.paidBy] += expense.amount;
        
        // Each person gets debited according to custom split
        Object.entries(expense.customSplits).forEach(([memberId, amount]) => {
          balances[memberId] -= amount;
        });
      }
    });

    // Convert balances to settlements
    const creditors: Array<{ id: string; amount: number; name: string }> = [];
    const debtors: Array<{ id: string; amount: number; name: string }> = [];

    Object.entries(balances).forEach(([memberId, balance]) => {
      const member = group.members.find(m => m.id === memberId);
      if (!member) return;

      if (balance > 0.01) { // Small threshold for floating point precision
        creditors.push({ id: memberId, amount: balance, name: member.name });
      } else if (balance < -0.01) {
        debtors.push({ id: memberId, amount: Math.abs(balance), name: member.name });
      }
    });

    // Calculate optimal settlements
    const settlements: Settlement[] = [];
    
    // Sort by amount for optimal settlement
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    let i = 0, j = 0;
    
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      
      const settleAmount = Math.min(creditor.amount, debtor.amount);
      
      if (settleAmount > 0.01) {
        settlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: Math.round(settleAmount * 100) / 100 // Round to 2 decimal places
        });
      }
      
      creditor.amount -= settleAmount;
      debtor.amount -= settleAmount;
      
      if (creditor.amount <= 0.01) i++;
      if (debtor.amount <= 0.01) j++;
    }

    return settlements;
  }

  static getCurrentGroup(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.CURRENT_GROUP);
  }

  static setCurrentGroup(groupId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CURRENT_GROUP, groupId);
  }

  static clearCurrentGroup(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_GROUP);
  }

  static exportGroupData(groupId: string): string | null {
    const group = this.getGroup(groupId);
    if (!group) return null;
    
    return JSON.stringify(group, null, 2);
  }

  static importGroupData(jsonData: string): OfflineGroup | null {
    try {
      const group = JSON.parse(jsonData) as OfflineGroup;
      
      // Validate structure
      if (!group.id || !group.name || !Array.isArray(group.members) || !Array.isArray(group.expenses)) {
        throw new Error('Invalid group data structure');
      }
      
      // Generate new ID to avoid conflicts
      group.id = this.generateId();
      group.lastModified = new Date().toISOString();
      
      const groups = this.getAllGroups();
      groups.push(group);
      this.saveGroups(groups);
      
      return group;
    } catch (error) {
      console.error('Error importing group data:', error);
      return null;
    }
  }
}
