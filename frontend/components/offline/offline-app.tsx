"use client";

import { useState, useEffect } from 'react';
import { 
  WifiOff, 
  Plus, 
  Users, 
  Calculator, 
  Receipt, 
  ArrowLeft,
  Trash2,
  Upload,
  Sparkles,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OfflineStorage, OfflineGroup } from '@/lib/offline/storage';
import CreateGroupModal from './create-group-modal';
import GroupDetailView from './group-detail-view';
import AddExpenseModal from './add-expense-modal';
import SettlementView from './settlement-view';

type OfflineView = 'home' | 'group-detail' | 'settlement';

export default function OfflineApp() {
  const [currentView, setCurrentView] = useState<OfflineView>('home');
  const [groups, setGroups] = useState<OfflineGroup[]>([]);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsVisible(true);
    loadGroups();
    const interval = setInterval(() => {
      setPulseAnimation((prev) => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadGroups = () => {
    const storedGroups = OfflineStorage.getAllGroups();
    // Sort groups by creation date - most recent first
    const sortedGroups = storedGroups.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setGroups(sortedGroups);
  };

  const handleCreateGroup = (name: string, members: string[]) => {
    const newGroup = OfflineStorage.createGroup(name, members);
    loadGroups();
    setCurrentGroupId(newGroup.id);
    setCurrentView('group-detail');
    setShowCreateGroup(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      OfflineStorage.deleteGroup(groupId);
      loadGroups();
      if (currentGroupId === groupId) {
        setCurrentView('home');
        setCurrentGroupId(null);
      }
    }
  };

  const handleGroupSelect = (groupId: string) => {
    setCurrentGroupId(groupId);
    setCurrentView('group-detail');
  };

  const handleAddExpense = (expense: Omit<any, 'id'>) => {
    if (currentGroupId) {
      OfflineStorage.addExpense(currentGroupId, expense);
      loadGroups();
      setShowAddExpense(false);
    }
  };

  const handleViewSettlement = () => {
    setCurrentView('settlement');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setCurrentGroupId(null);
  };

  const handleBackToGroup = () => {
    setCurrentView('group-detail');
  };

  const currentGroup = currentGroupId ? groups.find(g => g.id === currentGroupId) : null;

  if (!mounted) {
    return <div className="min-h-screen relative overflow-hidden" style={{ background: "rgb(234, 246, 255)" }}>
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "rgb(234, 246, 255)" }}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/60 to-indigo-300/60 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-200/60 to-blue-300/60 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-gradient-to-br from-indigo-200/60 to-purple-300/60 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>
      <div
        className={`relative z-10 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        {/* Header */}
        <div className="rounded-b-2xl bg-white pl-2 backdrop-blur-md shadow-xl border-b border-blue-200/30">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {currentView !== 'home' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={currentView === 'settlement' ? handleBackToGroup : handleBackToHome}
                    className="p-2 hover:bg-blue-100/50 rounded-lg"
                  >
                    <ArrowLeft className="h-5 w-5" style={{ color: '#192168' }} />
                  </Button>
                )}
                <div className="flex items-center gap-3">
                 
                  <div>
                    <h1 className="text-xl font-bold bg-[#192168] bg-clip-text text-transparent">
                      {currentView === 'home' && 'HisabKitab'}
                      {currentView === 'group-detail' && currentGroup?.name}
                      {currentView === 'settlement' && 'Settlement'}
                    </h1>
                    <div className="flex items-center space-x-2 text-sm">
                     
                       
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-md mx-auto px-6 py-6">
          {currentView === 'home' && (
            <div className="space-y-8">
              {/* Offline Notice */}
              <Card className="bg-gradient-to-r from-red-50 to-pink-50 backdrop-blur-md border border-red-200/50 shadow-xl rounded-3xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                      <WifiOff className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                        You're Offline
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        You can still create groups, add expenses, and calculate settlements. Data will be stored locally on your device with military-grade security.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Button 
                  onClick={() => setShowCreateGroup(true)}
                  className="h-20 bg-[#192168] hover:bg-blue-100 font-bold text-lg shadow-2xl transform hover:scale-105 transition-all duration-300 border border-blue-200 relative overflow-hidden group text-[#eaf6ff] rounded-4xl "
                >
                  <div className="absolute inset-0 bg-white/10 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <Plus className="w-8 h-8 mr-3 animate-pulse" />
                  Create Group
                </Button>
               
              </div>

              {/* Groups List */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#192168] flex items-center gap-3">
                  <Users className="w-8 h-8 text-[#192168]" />
                  Your Groups
                  <div className="flex-1 h-px bg-gradient-to-r from-blue-400/50 to-transparent"></div>
                </h2>
                {groups.length === 0 ? (
                  <Card className="bg-gradient-to-br from-white/80 to-blue-50/80 backdrop-blur-md border border-blue-200/30 shadow-xl">
                    <CardContent className="p-12 text-center">
                      <div
                        className={`w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg ${pulseAnimation ? "scale-110" : "scale-100"}`}
                      >
                        <Users className="w-12 h-12 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-4">No Groups Yet</h3>
                      <p className="text-gray-600 mb-8 text-lg leading-relaxed max-w-md mx-auto">
                        Create your first group to start tracking expenses offline with style and precision.
                      </p>
                      <Button 
                        onClick={() => setShowCreateGroup(true)} 
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 font-semibold text-lg transition-all duration-300 transform hover:scale-105"
                      >
                        <Plus className="w-5 h-5 mr-2 animate-pulse" />
                        Create Group
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {groups.map((group) => (
                      <Card key={group.id} className="bg-white rounded-4xl backdrop-blur-sm border border-blue-200/30 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-102 hover:bg-white/80 cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div 
                              className="flex-1"
                              onClick={() => handleGroupSelect(group.id)}
                            >
                              <h3 className="font-bold text-gray-800 text-lg mb-1">{group.name}</h3>
                              <p className="text-gray-600 font-medium">
                                {group.members.length} members • {group.expenses.length} expenses
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Created {new Date(group.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                             
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteGroup(group.id);
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Features Info */}
              <div>
                <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center gap-3">
                  Offline Features
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-300/50 to-transparent"></div>
                </h2>
                
                <Card className="bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-md border border-gray-300/30 shadow-lg rounded-4xl">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {[
                        { icon: Users, text: "Create and manage groups", description: "Organize expenses with friends, family, or colleagues" },
                        { icon: Receipt, text: "Add and track expenses", description: "Record purchases and shared costs instantly" },
                        { icon: Calculator, text: "Calculate fair settlements", description: "Smart algorithms ensure everyone pays their fair share" },
                      ].map((feature, index) => (
                        <div key={index} className="flex items-start gap-3 group hover:bg-gray-100/50 p-2 rounded-lg transition-all duration-300">
                          <div className="relative">
                            <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                              <feature.icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base font-bold text-gray-700 mb-1 group-hover:text-gray-800 transition-colors duration-300">
                              {feature.text}
                            </h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                              {feature.description}
                            </p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-300/30">
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">All data stored securely on your device</span>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse animation-delay-500"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {currentView === 'group-detail' && currentGroup && (
            <GroupDetailView
              group={currentGroup}
              onAddExpense={() => setShowAddExpense(true)}
              onViewSettlement={handleViewSettlement}
              onRefresh={loadGroups}
            />
          )}

          {currentView === 'settlement' && currentGroup && (
            <SettlementView
              group={currentGroup}
              onBack={handleBackToGroup}
            />
          )}
        </div>

        {/* Modals */}
        {showCreateGroup && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCreateGroup(false);
              }
            }}
          >
            <CreateGroupModal
              onClose={() => setShowCreateGroup(false)}
              onCreateGroup={handleCreateGroup}
            />
          </div>
        )}

        {showAddExpense && currentGroup && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAddExpense(false);
              }
            }}
          >
            <AddExpenseModal
              group={currentGroup}
              onClose={() => setShowAddExpense(false)}
              onAddExpense={handleAddExpense}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
        
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
      `}</style>
    </div>
  );
}

