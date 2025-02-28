import { Dialog } from '@headlessui/react';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GroupsService } from '../services/groups';
import { useDebounce } from '../hooks/useDebounce';

interface RecommendTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  groupId: string;
}

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    images: { url: string }[];
  };
}

export function RecommendTrackModal({ isOpen, onClose, memberId, groupId }: RecommendTrackModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms delay

  const queryClient = useQueryClient();

  const recommendMutation = useMutation<any, Error, Track>({
    mutationFn: (track) => GroupsService.recommendTrack(memberId, track),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
      onClose();
    },
  });

  useEffect(() => {
    const searchTracks = async () => {
      if (debouncedSearchQuery) {
        setIsSearching(true);
        try {
          const results = await GroupsService.searchTracks(debouncedSearchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Error searching tracks:', error);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    };

    searchTracks();
  }, [debouncedSearchQuery]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-spotify-black rounded-lg p-6 max-w-md w-full">
          <Dialog.Title className="text-xl font-bold text-spotify-white mb-4">
            Recommend a Track
          </Dialog.Title>

          <div className="relative">
            <input
              type="text"
              placeholder="Search for a track..."
              className="w-full bg-spotify-gray p-3 rounded-lg text-spotify-white mb-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <div className="absolute right-3 top-3">
                <svg className="animate-spin h-5 w-5 text-spotify-green" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {searchResults.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-4 p-3 hover:bg-spotify-gray rounded-lg cursor-pointer"
                onClick={() => recommendMutation.mutate(track)}
              >
                <img
                  src={track.album.images[0]?.url}
                  alt={track.name}
                  className="w-12 h-12 rounded"
                />
                <div>
                  <p className="font-medium text-spotify-white">{track.name}</p>
                  <p className="text-sm text-spotify-lightgray">
                    {track.artists[0].name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 