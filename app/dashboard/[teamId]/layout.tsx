'use client';

import SidebarLayout, { SidebarItem } from "@/components/sidebar-layout";
import { SelectedTeamSwitcher, useUser } from "@stackframe/stack";
import { FileText, MessageSquare, Settings2, Users, BarChart3, Upload } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TeamResolver } from "@/lib/utils/team-resolver";
import { TeamSlugService } from "@/lib/services/team-slug-service";

const navigationItems: SidebarItem[] = [
  {
    name: "Overview",
    href: "/",
    icon: BarChart3,
    type: "item",
  },
  {
    type: 'label',
    name: 'HR Management',
  },
  {
    name: "Candidates",
    href: "/candidates",
    icon: Users,
    type: "item",
    subItems: [
      {
        name: "Upload CV",
        href: "/candidates/upload",
        icon: Upload,
        type: "subitem",
      }
    ],
  },
  {
    name: "Documents",
    href: "/documents",
    icon: FileText,
    type: "item",
    subItems: [
      {
        name: "Upload Documents",
        href: "/documents/upload",
        icon: Upload,
        type: "subitem",
      }
    ],
  },
  {
    name: "AI Assistant",
    href: "/assistant",
    icon: MessageSquare,
    type: "item",
  },
  {
    type: 'label',
    name: 'Settings',
  },
  {
    name: "Configuration",
    href: "/configuration",
    icon: Settings2,
    type: "item",
  },
];

export default function Layout(props: { children: React.ReactNode }) {
  const params = useParams<{ teamId: string }>();
  const user = useUser({ or: 'redirect' });
  const router = useRouter();
  const [resolvedTeamId, setResolvedTeamId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);

  // Resolve team identifier (slug or UUID) to actual team ID
  useEffect(() => {
    const resolveTeam = async () => {
      if (!params.teamId) return;
      
      setIsResolving(true);
      let teamId = await TeamResolver.resolveTeamId(params.teamId);
      
      if (!teamId) {
        router.push('/dashboard');
        return;
      }
      
      setResolvedTeamId(teamId);
      setIsResolving(false);
    };

    resolveTeam();
  }, [params.teamId, router]);

  // Auto-create slug and redirect if team is accessed via UUID
  useEffect(() => {
    const ensureSlugAndRedirect = async () => {
      if (!resolvedTeamId || isResolving) return;
      
      // Check if current URL is using UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(params.teamId)) {
        // This is a UUID URL, let's create slug and redirect
        const teams = user.useTeams();
        const currentTeam = teams.find((t: any) => t.id === resolvedTeamId);
        
        if (currentTeam) {
          console.log('Creating slug for team:', currentTeam.displayName);
          
          // Create slug for this team
          const result = await TeamSlugService.createOrUpdateTeamSlug(resolvedTeamId, {
            displayName: currentTeam.displayName
          });
          
          if (result.success && result.slug) {
            console.log('Redirecting to slug URL:', result.slug);
            // Redirect to the slug URL
            const currentPath = window.location.pathname.replace(`/dashboard/${params.teamId}`, '');
            router.replace(`/dashboard/${result.slug}${currentPath}`);
          }
        }
      }
    };

    ensureSlugAndRedirect();
  }, [resolvedTeamId, isResolving, params.teamId, router]);

  const team = user.useTeam(resolvedTeamId || '');

  if (isResolving || !resolvedTeamId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-sm text-muted-foreground">Loading team...</div>
      </div>
    );
  }

  if (!team) {
    router.push('/dashboard');
    return null;
  }

  const teamSlugOrId = params.teamId; // Use the slug from URL

  return (
    <SidebarLayout 
      items={navigationItems}
      basePath={`/dashboard/${teamSlugOrId}`}
      sidebarTop={<SelectedTeamSwitcher 
        selectedTeam={team}
        urlMap={(team) => {
          // For now, use team ID since urlMap needs to be synchronous
          // The redirect logic will handle converting to slug
          return `/dashboard/${team.id}`;
        }}
      />}
      baseBreadcrumb={[{
        title: team.displayName,
        href: `/dashboard/${teamSlugOrId}`,
      }]}
    >
      {props.children}
    </SidebarLayout>
  );
}