export function isMatchId(id: string): boolean {
  // Match IDs are expected to be in the format: uuid-uuid
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id);
}

export function extractUserIdsFromMatchId(matchId: string): string[] {
  if (!isMatchId(matchId)) {
    throw new Error('Invalid match ID format');
  }
  return matchId.split('-');
}

export function createMatchId(userId1: string, userId2: string): string {
  // Sort user IDs to ensure consistent match IDs regardless of order
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}-${sortedIds[1]}`;
} 