import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { GroupsService } from '../services/groups';
import { useState, useEffect, useRef } from 'react';
import { RecommendTrackModal } from '../components/RecommendTrackModal';
import { MemberCard } from '../components/MemberCard';
import ColorThief from 'colorthief';
import { generateShareImage, downloadImage, shareOnMobile } from '../utils/shareUtils';
import { motion } from 'framer-motion';

interface Recommendation {
  id: string;
  trackId: string;
  trackName: string;
  trackArtist: string;
  trackImage?: string;
  trackUrl: string;
  createdAt: Date;
}

interface User {
  id: string;
  displayName?: string;
  email: string;
  photoUrl?: string;
}

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
  user: User;
  recommendedTrackId?: string;
  recommendedTrackName?: string;
  recommendedTrackArtist?: string;
  recommendedTrackImage?: string;
  recommendedTrackUrl?: string;
  recommendations: Recommendation[];
}

interface Group {
  id: string;
  name: string;
  members?: Member[];
  createdAt?: Date;
  updatedAt?: Date;
  ownerId?: string;
}

export function GroupDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const currentUserId = localStorage.getItem('userId');
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const userExpandedRef = useRef(false);

  const { data: group, isLoading } = useQuery({
    queryKey: ['groups', id],
    queryFn: () => GroupsService.getGroupDetails(id!),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: true,
    retryDelay: 1000,
  }) as UseQueryResult<Group, Error>;

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
    if (!id) return;

    const result = await generateInviteCodeMutation.mutateAsync(id);
    alert(`Invite code: ${result.code}`);
  };

  useEffect(() => {
    if (!group || userExpandedRef.current) return;

    const firstPlace = group.members?.find(m => m.rank === 1);
    if (firstPlace) {
      setExpandedMembers(new Set([firstPlace.id]));
    }
  }, [group]);

  if (isLoading) return <div>Loading...</div>;
  if (!group) return <div>Group not found</div>;

  const handleTrackRecommend = (memberId: string) => {
    setSelectedMemberId(memberId);
    setShowRecommendModal(true);
  };

  const handleToggleExpand = (memberId: string) => {
    userExpandedRef.current = true;

    const newExpandedMembers = new Set(expandedMembers);

    if (newExpandedMembers.has(memberId)) {
      newExpandedMembers.delete(memberId);
    } else {
      newExpandedMembers.add(memberId);
    }

    setExpandedMembers(newExpandedMembers);
  };

  const isRecentlyPlayed = (lastUpdated: Date | undefined) => {
    return lastUpdated && new Date(lastUpdated).getTime() > Date.now() - 1000 * 60 * 5;
  };

  const handleShareMember = async (memberId: string) => {
    const member = group.members?.find(m => m.id === memberId);
    if (!member) return;

    if (member.user.id !== currentUserId) {
      alert('Você só pode compartilhar seu próprio perfil.');
      return;
    }

    const memberElement = document.getElementById(`member-card-${memberId}`);
    if (!memberElement) return;

    try {
      const imageUrl = await generateShareImage(memberElement);
      if (!imageUrl) throw new Error('Failed to generate image');

      const fileName = `spotify-${member?.user.displayName || 'share'}.png`;

      if (navigator && 'share' in navigator) {
        shareOnMobile(imageUrl, `${member?.user.displayName}'s Spotify Stats`);
      } else {
        downloadImage(imageUrl, fileName);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to generate share image. Please try again.');
    }
  };

  // Função para renderizar badges de ranking
  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center ml-1 w-5 h-5 rounded-full bg-yellow-500 text-black font-bold text-xs" title="First Place">
          1
        </span>
      );
    } else if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center ml-1 w-5 h-5 rounded-full bg-gray-300 text-black font-bold text-xs" title="Second Place">
          2
        </span>
      );
    } else if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center ml-1 w-5 h-5 rounded-full bg-amber-700 text-white font-bold text-xs" title="Third Place">
          3
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-spotify-black text-spotify-white py-10 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between animate-fade-in">
          <h1 className="text-3xl font-bold text-spotify-white hover:scale-[1.02] transition-transform">
            {group.name}
          </h1>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => updateTracksMutation.mutate()}
              disabled={updateTracksMutation.isPending}
              className="bg-spotify-gray hover:bg-opacity-80 text-spotify-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 transition-all hover:shadow-lg hover:-translate-y-0.5"
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
              className="bg-spotify-green hover:bg-opacity-80 text-spotify-white px-6 py-2 rounded-full font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
            >
              Invite Friends
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-spotify-white">Members</h2>
          <div className="space-y-4 max-w-7xl mx-auto">
            {group.members
              ?.sort((a, b) => a.rank - b.rank)
              .map((member, index) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  index={index}
                  id={`member-card-${member.id}`}
                >
                  <div className="pb-2">
                    <div className="flex items-center gap-4 mb-4">
                      {member.user.photoUrl ? (
                        <img
                          src={member.user.photoUrl}
                          alt={member.user.displayName || 'User'}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-spotify-green"
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-spotify-green flex items-center justify-center">
                          <span className="text-spotify-black text-lg sm:text-xl font-bold">
                            {(member.user.displayName || member.user.email || '?')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-bold text-spotify-white text-base sm:text-lg truncate flex items-center gap-2">
                          {member.user.displayName || member.user.email}
                          {String(member.user.id) === String(currentUserId) && (
                            <button
                              onClick={() => handleShareMember(member.id)}
                              className="text-spotify-lightgray hover:text-spotify-green p-1 rounded-full transition-colors"
                              title="Share this profile"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                              </svg>
                            </button>
                          )}
                          {member.rank === 1 && (
                            <motion.span
                              className="text-base sm:text-lg"
                              animate={{ rotate: [0, 5, 0, -5, 0] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                              👑
                            </motion.span>
                          )}
                        </h3>
                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                          <span className="text-spotify-lightgray">Rank</span>
                          <span className="text-spotify-green font-bold flex items-center">
                            #{member.rank}
                            {member.rank <= 3 && (
                              <span className="ml-1 text-base">
                                {member.rank === 1 ? '🥇' : member.rank === 2 ? '🥈' : '🥉'}
                              </span>
                            )}
                          </span>
                          <span className="text-spotify-lightgray mx-1 sm:mx-2">•</span>
                          <span className="text-spotify-lightgray">Score</span>
                          <span className="text-spotify-white font-bold">{member.score}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      <div className="flex items-center gap-2 sm:gap-4 bg-spotify-black bg-opacity-40 p-2 sm:p-3 rounded-lg overflow-hidden hover:bg-opacity-60 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                        onClick={() => window.open(`https://open.spotify.com/track/${member.topTrackId}`, '_blank')}
                      >
                        <img
                          src={member.topTrackImage}
                          alt={member.topTrackName}
                          className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 rounded object-cover transition-transform hover:rotate-3"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs uppercase tracking-wider text-spotify-lightgray mb-1">
                            Most Played
                          </div>
                          <p className="font-medium text-spotify-white text-sm sm:text-lg truncate">
                            {member.topTrackName}
                          </p>
                          <p className="text-xs sm:text-sm text-spotify-lightgray truncate">
                            {member.topTrackArtist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4 bg-spotify-black bg-opacity-40 p-2 sm:p-3 rounded-lg overflow-hidden hover:bg-opacity-60 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                        onClick={() => window.open(`https://open.spotify.com/track/${member.currentTrackId}`, '_blank')}
                      >
                        <img
                          src={member.currentTrackImage}
                          alt={member.currentTrackName}
                          className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 rounded object-cover transition-transform hover:rotate-3"
                        />
                        <div className="min-w-0 flex-1">
                          <div className={`text-xs uppercase tracking-wider mb-1 ${isRecentlyPlayed(member.lastUpdated)
                            ? 'text-spotify-green pulse'
                            : 'text-spotify-lightgray'
                            }`}>
                            {isRecentlyPlayed(member.lastUpdated) ? 'Now Playing' : 'Recently Played'}
                          </div>
                          <p className="font-medium text-spotify-white text-sm sm:text-lg truncate">
                            {member.currentTrackName}
                          </p>
                          <p className="text-xs sm:text-sm text-spotify-lightgray truncate">
                            {member.currentTrackArtist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4 bg-spotify-black bg-opacity-40 p-2 sm:p-3 rounded-lg overflow-hidden hover:bg-opacity-60 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                        onClick={() => member.recommendations?.[0]?.trackUrl && window.open(member.recommendations[0].trackUrl, '_blank')}
                      >
                        {member.recommendations?.[0] ? (
                          <>
                            <img
                              src={member.recommendations[0].trackImage}
                              alt={member.recommendations[0].trackName}
                              className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 rounded object-cover transition-transform hover:rotate-3"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-xs uppercase tracking-wider text-spotify-lightgray">
                                  Latest Recommendation
                                </div>
                                {member.user.id === currentUserId && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTrackRecommend(member.id);
                                    }}
                                    className="text-xs text-spotify-green hover:text-spotify-white transition-all hover:scale-110 active:scale-95"
                                  >
                                    + Add
                                  </button>
                                )}
                              </div>
                              <p className="font-medium text-spotify-white text-sm sm:text-lg truncate">
                                {member.recommendations[0].trackName}
                              </p>
                              <p className="text-xs sm:text-sm text-spotify-lightgray truncate">
                                {member.recommendations[0].trackArtist}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-center w-full text-spotify-lightgray py-4 sm:py-8">
                            {member.user.id === currentUserId ? (
                              <button
                                onClick={() => handleTrackRecommend(member.id)}
                                className="bg-spotify-green hover:bg-opacity-80 text-spotify-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all"
                              >
                                + Add Rec
                              </button>
                            ) : (
                              <span className="text-xs sm:text-sm">No recommendations</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {member.recommendations?.length > 1 && (
                    <div className="bg-spotify-black bg-opacity-40 p-3 rounded-lg overflow-hidden">
                      <button
                        onClick={() => handleToggleExpand(member.id)}
                        className="w-full flex items-center justify-between text-xs uppercase tracking-wider text-spotify-lightgray mb-3 hover:text-spotify-white transition-colors"
                      >
                        <span>Previous Recommendations</span>
                        <svg
                          className={`w-4 h-4 transform transition-transform duration-200 ${expandedMembers.has(member.id) ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <div
                        className={`space-y-2 transition-all duration-300 ease-in-out overflow-hidden ${expandedMembers.has(member.id) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}
                      >
                        {member.recommendations.slice(1, 4).map((rec) => (
                          <div
                            key={rec.id}
                            onClick={() => window.open(rec.trackUrl, '_blank')}
                            className="flex items-center gap-3 p-2 hover:bg-spotify-gray rounded cursor-pointer transition-colors"
                          >
                            <img
                              src={rec.trackImage}
                              alt={rec.trackName}
                              className="w-10 h-10 flex-shrink-0 rounded"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-spotify-white truncate">
                                {rec.trackName}
                              </p>
                              <p className="text-sm text-spotify-lightgray truncate">
                                {rec.trackArtist}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </MemberCard>
              ))}
          </div>
        </div>

        <RecommendTrackModal
          isOpen={showRecommendModal}
          onClose={() => setShowRecommendModal(false)}
          memberId={selectedMemberId!}
          groupId={id!}
        />
      </div>
    </div>
  );
} 