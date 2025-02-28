import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { GroupsService } from '../services/groups';

interface Member {
  id: string;
  rank: number;
  score: number;
  topTrackId?: string;
  topTrackName?: string;
  topTrackArtist?: string;
  topTrackImage?: string;
  currentTrackId?: string;
  currentTrackName?: string;
  currentTrackArtist?: string;
  currentTrackImage?: string;
  lastUpdated?: Date;
  user: {
    id: string;
    displayName?: string;
    email: string;
    photoUrl?: string;
  };
}

export function GroupDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: group, isLoading } = useQuery({
    queryKey: ['groups', id],
    queryFn: () => GroupsService.getGroupDetails(id!),
    refetchInterval: 10000, // Atualiza a cada 10 segundos
    refetchOnWindowFocus: true,
    staleTime: 0, // Sempre considera os dados como stale
  });

  const generateInviteCodeMutation = useMutation({
    mutationFn: GroupsService.generateInviteCode,
  });

  const updateTracksMutation = useMutation({
    mutationFn: () => GroupsService.updateTracks(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', id] });
    },
  });

  const handleGenerateInviteCode = async () => {
    if (id) {
      const result = await generateInviteCodeMutation.mutateAsync(id);
      // You could show this code in a modal or copy to clipboard
      alert(`Invite code: ${result.code}`);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!group) return <div>Group not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-spotify-white">{group.name}</h1>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => updateTracksMutation.mutate()}
            disabled={updateTracksMutation.isPending}
            className="bg-spotify-gray hover:bg-opacity-80 text-spotify-white px-4 py-2 rounded-full font-semibold flex items-center gap-2"
          >
            {updateTracksMutation.isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Updating...</span>
              </>
            ) : (
              'Refresh Tracks'
            )}
          </button>
          <button
            onClick={handleGenerateInviteCode}
            className="bg-spotify-green hover:bg-opacity-80 text-spotify-white px-6 py-2 rounded-full font-semibold transition-all transform hover:scale-105"
          >
            Invite Friends
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-spotify-white">Members</h2>
        <div className="grid gap-4">
          {group.members?.map((member: Member) => (
            <div
              key={member.id}
              className="bg-spotify-gray rounded-lg p-6"
            >
              {/* Member Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {member.user.photoUrl ? (
                    <img
                      src={member.user.photoUrl}
                      alt={member.user.displayName || 'User'}
                      className="w-12 h-12 rounded-full object-cover border-2 border-spotify-green"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-spotify-green flex items-center justify-center">
                      <span className="text-spotify-black text-xl font-bold">
                        {(member.user.displayName || member.user.email || '?')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-spotify-white text-lg">
                      {member.user.displayName || member.user.email}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-spotify-lightgray">Rank</span>
                      <span className="text-spotify-green font-bold">#{member.rank}</span>
                      <span className="text-spotify-lightgray mx-2">•</span>
                      <span className="text-spotify-lightgray">Score</span>
                      <span className="text-spotify-white font-bold">{member.score}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tracks Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Top Track */}
                {member.topTrackImage && (
                  <div className="flex items-center gap-4 bg-spotify-black bg-opacity-40 p-3 rounded-lg overflow-hidden">
                    <img
                      src={member.topTrackImage}
                      alt={member.topTrackName}
                      className="w-16 h-16 flex-shrink-0 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs uppercase tracking-wider text-spotify-lightgray mb-1">
                        Most Played
                      </div>
                      <p className="font-medium text-spotify-white text-lg truncate">
                        {member.topTrackName}
                      </p>
                      <p className="text-sm text-spotify-lightgray truncate">
                        {member.topTrackArtist}
                      </p>
                    </div>
                  </div>
                )}

                {/* Current/Recent Track */}
                {member.currentTrackName && (
                  <div className="flex items-center gap-4 bg-spotify-black bg-opacity-40 p-3 rounded-lg overflow-hidden">
                    <img
                      src={member.currentTrackImage}
                      alt={member.currentTrackName}
                      className="w-16 h-16 flex-shrink-0 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs uppercase tracking-wider text-spotify-lightgray mb-1">
                        {new Date(member.lastUpdated).getTime() > Date.now() - 1000 * 60 * 5
                          ? 'Now Playing'
                          : 'Recently Played'}
                      </div>
                      <p className="font-medium text-spotify-white text-lg truncate">
                        {member.currentTrackName}
                      </p>
                      <p className="text-sm text-spotify-lightgray truncate">
                        {member.currentTrackArtist}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 