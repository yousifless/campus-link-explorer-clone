import React from 'react';
import MatchIcebreaker from '@/components/icebreaker/MatchIcebreaker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Example component showing how to use the MatchIcebreaker
 * 
 * Usage:
 * <MatchIcebreakerExample matchId="match-123" />
 */
export const MatchIcebreakerExample = ({ matchId = '' }) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Using Real User Data for Icebreakers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This example shows how to generate icebreakers using real user data from a match.
            The system will fetch profile data, interests, languages, and goals for both users
            and pass it to the DistilGPT-2 model for personalized icebreaker generation.
          </p>

          <div className="p-4 border rounded-md bg-amber-50 dark:bg-amber-950/30">
            <h3 className="font-semibold mb-2">Implementation Details:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fetches complete user data from database tables</li>
              <li>Includes profile data, interests, languages, and goals</li>
              <li>Uses the specified prompt format for personalization</li>
              <li>Generates conversation starters specific to the users</li>
              <li>Automatically refreshes when match ID changes</li>
            </ul>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Current match ID: {matchId || "(not provided)"}</h3>
            {!matchId && (
              <Button 
                onClick={() => alert("Please provide a match ID to see this example in action")}
                className="mt-2"
              >
                Provide Match ID
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {matchId && <MatchIcebreaker matchId={matchId} />}
    </div>
  );
};

export default MatchIcebreakerExample; 