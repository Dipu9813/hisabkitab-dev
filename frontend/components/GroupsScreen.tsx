import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Info, LucideInfo, Users } from "lucide-react"
import InfoIcon from "@/components/ui/info-icon"
import { useRouter } from "next/navigation"

export default function GroupsScreen({
  userGroups,
  handleGroupClick,
  handleJoinGroup,
  onOpenGroupTransactionsModal
}: any) {
  // Debug: log all groups
  console.log("GroupsScreen userGroups:", userGroups)

  // Sort groups by phase: active first, then settlement, then others
  const sortedGroups = [...userGroups].sort((a, b) => {
    const phaseOrder: Record<string, number> = { active: 0, settlement: 1 };
    const aPhase = phaseOrder[a.phase] ?? 2;
    const bPhase = phaseOrder[b.phase] ?? 2;
    return aPhase - bPhase;
  });

  // Now filter after sorting
  const activeGroups = sortedGroups.filter((g: any) => !g.phase || g.phase === 'active');
  const settledGroups = sortedGroups.filter((g: any) => g.phase === 'settlement');
  const otherGroups = sortedGroups.filter((g: any) => g.phase && g.phase !== 'active' && g.phase !== 'settlement');

  const router = useRouter();

  return (
    <div className="px-6 relative z-10 pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-slate-800 text-3xl font-bold tracking-tight">Hisab Circles</h1>
        <Button
          onClick={() => handleGroupClick()}
          className="bg-[#192168] text-white rounded-2xl px-4 py-2 font-semibold shadow-lg shadow-emerald-200/50"
        >
          Create Group
        </Button>
      </div>
      {(activeGroups.length > 0 || settledGroups.length > 0 || otherGroups.length > 0) ? (
        <div className="space-y-8">
          {activeGroups.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-emerald-700 mb-3">Active Groups</h2>
              <div className="space-y-4">
                {activeGroups.map((group: any) => (
                  <Card
                    key={group.id}
                    className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl transition-colors"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 cursor-pointer"
                          onClick={() => {
                            onOpenGroupTransactionsModal(group.id);
                          }}>
                          <div className="w-16 h-16 bg-[#192168] to-pink-600 rounded-3xl flex items-center justify-center shadow-lg">
                            <Users className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-slate-800 font-bold text-xl max-w-[130px] truncate" title={group.name}>{group.name}</h3>
                            <p className="text-slate-600 text-sm">{group.members} members</p>
                            <p className="text-slate-600 text-sm">{group.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 min-w-[80px]">
                          <button
                            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                            onClick={e => { e.stopPropagation(); handleGroupClick(group); }}
                            title="Group Info"
                          >
                            <Info className="h-6 w-6 text-slate-500" />
                          </button>
                          {/* <p className="text-2xl font-bold text-emerald-600">₹{group.totalBalance}</p> */}
                          <p className="text-xs text-slate-600">{group.recentActivity}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {settledGroups.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-orange-700 mb-3">Settled Groups</h2>
              <div className="space-y-4">
                {settledGroups.map((group: any) => (
                  <Card
                    key={group.id}
                    className="bg-red-100/80 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl transition-colors"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 cursor-pointer"
                          onClick={() => router.push(`/groups/${group.id}/transactions`)}>
                          <div className="w-16 h-16 bg-[#192168] to-pink-600 rounded-3xl flex items-center justify-center shadow-lg">
                            <Users className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-slate-800 font-bold text-xl max-w-[180px] truncate" title={group.name}>{group.name}</h3>
                            <p className="text-slate-600 text-sm">{group.members} members</p>
                            <p className="text-slate-600 text-sm">{group.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 min-w-[80px]">
                          <button
                            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                            onClick={e => { e.stopPropagation(); handleGroupClick(group); }}
                            title="Group Info"
                          >
                            <InfoIcon className="h-6 w-6 text-slate-500" />
                          </button>
                          <p className="text-2xl font-bold text-emerald-600">₹{group.totalBalance}</p>
                          <p className="text-xs text-slate-600">{group.recentActivity}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {otherGroups.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-700 mb-3">Other Groups (Unknown Phase)</h2>
              <div className="space-y-4">
                {otherGroups.map((group: any) => (
                  <Card
                    key={group.id}
                    className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-slate-200/50 rounded-3xl transition-colors"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 cursor-pointer"
                          onClick={() => router.push(`/groups/${group.id}/transactions`)}>
                          <div className="w-16 h-16 bg-[#192168] to-pink-600 rounded-3xl flex items-center justify-center shadow-lg">
                            <Users className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-slate-800 font-bold text-xl max-w-[180px] truncate" title={group.name}>{group.name}</h3>
                            <p className="text-slate-600 text-sm">{group.members} members</p>
                            <p className="text-slate-600 text-sm">{group.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 min-w-[80px]">
                          <button
                            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                            onClick={e => { e.stopPropagation(); handleGroupClick(group); }}
                            title="Group Info"
                          >
                            <LucideInfo className="h-6 w-6 text-slate-500" />
                          </button>
                          {/* <p className="text-2xl font-bold text-emerald-600">₹{group.totalBalance}</p> */}
                          <p className="text-xs text-slate-600">{group.recentActivity}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto bg-[#192168] rounded-3xl flex items-center justify-center mb-6">
            <Users className="h-12 w-12 text-[#eaf6ff" />
          </div>
          <h3 className="text-slate-800 font-bold text-xl mb-2">No Groups Yet</h3>
          <p className="text-slate-600 mb-6">Create or join a group to start sharing expenses</p>
          <Button
            onClick={() => handleGroupClick()}
            className="bg-[#192168] hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl px-6 py-3 font-semibold shadow-lg shadow-emerald-200/50"
          >
            Create Your First Group
          </Button>
        </div>
      )}
    </div>
  )
}

