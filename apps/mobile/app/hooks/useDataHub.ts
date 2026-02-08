/**
 * useDataHub - Data Dashboard ViewModel Hook
 *
 * Aggregates data from multiple stores for the Profile/Dashboard screen.
 * Follows the "관계는 중복 저장하지 말고 조합" principle.
 */

import { useMemo } from 'react';
import { usePlaceStore } from '@/app/stores/placeStore';
import { useGroupBuyStore } from '@/app/stores/groupBuyStore';
import { usePeerGroupStore } from '@/app/stores/peerGroupStore';
import { useProfileStore } from '@/app/stores/profileStore';

export interface Activity {
  id: string;
  type: 'visit' | 'save' | 'group_join' | 'groupbuy_join';
  title: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface DashboardViewModel {
  // Rollups
  visitCount: number;
  savedCount: number;
  groupCount: number;
  groupBuyCount: number;

  // Trends
  visitTrend: number; // This week's change

  // Timeline
  recentActivities: Activity[];

  // Meta
  totalDataBlocks: number;
  lastUpdate: Date;

  // Child info
  childName: string;
  childAgeMonths: number;
}

function calculateTrend(visits: Array<{ visitedAt: string }>, days: number): number {
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return visits.filter((v) => new Date(v.visitedAt) >= cutoff).length;
}

function combineActivities(
  recentVisits: Array<{ placeId: string; placeName: string; visitedAt: string }>,
  favoritePlaces: Array<{ id: string; name: string }>,
  myGroups: Array<{ id: string; name: string; created_at?: string }>,
  _joinedGroupBuyIds: string[]
): Activity[] {
  const activities: Activity[] = [];

  // Add visits
  recentVisits.slice(0, 5).forEach((visit) => {
    activities.push({
      id: `visit-${visit.placeId}-${visit.visitedAt}`,
      type: 'visit',
      title: `${visit.placeName} 방문`,
      timestamp: new Date(visit.visitedAt),
    });
  });

  // Add saves (use current time as we don't track save time)
  favoritePlaces.slice(0, 3).forEach((place) => {
    activities.push({
      id: `save-${place.id}`,
      type: 'save',
      title: `${place.name} 저장`,
      timestamp: new Date(),
    });
  });

  // Add group joins
  myGroups.slice(0, 3).forEach((group) => {
    activities.push({
      id: `group-${group.id}`,
      type: 'group_join',
      title: `${group.name} 모임 참여`,
      timestamp: group.created_at ? new Date(group.created_at) : new Date(),
    });
  });

  // Sort by timestamp descending
  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
}

export function useDataHub(): DashboardViewModel {
  // Store selectors
  const favoritePlaces = usePlaceStore((state) => state.favoritePlaces);
  const recentVisits = usePlaceStore((state) => state.recentVisits);
  const joinedGroupBuyIds = useGroupBuyStore((state) => state.joinedGroupBuyIds);
  const myGroups = usePeerGroupStore((state) => state.myGroups);
  const childName = useProfileStore((state) => state.childName);
  const getChildAgeMonths = useProfileStore((state) => state.getChildAgeMonths);

  return useMemo(() => {
    const visitCount = recentVisits.length;
    const savedCount = favoritePlaces.length;
    const groupCount = myGroups.length;
    const groupBuyCount = joinedGroupBuyIds.length;
    const visitTrend = calculateTrend(recentVisits, 7);
    const recentActivities = combineActivities(
      recentVisits,
      favoritePlaces,
      myGroups,
      joinedGroupBuyIds
    );

    // Total data blocks = sum of all tracked items
    const totalDataBlocks = visitCount + savedCount + groupCount + groupBuyCount;

    return {
      visitCount,
      savedCount,
      groupCount,
      groupBuyCount,
      visitTrend,
      recentActivities,
      totalDataBlocks,
      lastUpdate: new Date(),
      childName,
      childAgeMonths: getChildAgeMonths(),
    };
  }, [favoritePlaces, recentVisits, joinedGroupBuyIds, myGroups, childName, getChildAgeMonths]);
}
