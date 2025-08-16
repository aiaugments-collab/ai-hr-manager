"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { TeamSlugService } from "@/lib/services/team-slug-service";
import { TeamResolver } from "@/lib/utils/team-resolver";

export function PageClient() {
  const router = useRouter();
  const user = useUser({ or: "redirect" });
  const teams = user.useTeams();
  const [teamDisplayName, setTeamDisplayName] = React.useState("");

  React.useEffect(() => {
    if (teams.length > 0 && !user.selectedTeam) {
      user.setSelectedTeam(teams[0]);
    }
  }, [teams, user]);

  // Redirect to team dashboard with slug
  React.useEffect(() => {
    const redirectToTeamDashboard = async () => {
      if (user.selectedTeam) {
        // Create slug if it doesn't exist, then redirect
        const result = await TeamSlugService.createOrUpdateTeamSlug(user.selectedTeam.id, {
          displayName: user.selectedTeam.displayName
        });
        
        const slug = result.success && result.slug ? result.slug : user.selectedTeam.id;
        router.push(`/dashboard/${slug}`);
      }
    };

    if (user.selectedTeam) {
      redirectToTeamDashboard();
    }
  }, [user.selectedTeam, router]);

  if (teams.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <div className="max-w-xs w-full">
          <h1 className="text-center text-2xl font-semibold">Welcome!</h1>
          <p className="text-center text-gray-500">
            Create a team to get started
          </p>
          <form
            className="mt-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const newTeam = await user.createTeam({ displayName: teamDisplayName });
              
              // Create slug for the new team
              if (newTeam) {
                await TeamSlugService.createOrUpdateTeamSlug(newTeam.id, {
                  displayName: teamDisplayName
                });
              }
            }}
          >
            <div>
              <Label className="text-sm">Team name</Label>
              <Input
                placeholder="Team name"
                value={teamDisplayName}
                onChange={(e) => setTeamDisplayName(e.target.value)}
              />
            </div>
            <Button className="mt-4 w-full">Create team</Button>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
