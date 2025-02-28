import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GroupsService } from '../services/groups';
import { Link } from 'react-router-dom';

export function GroupsPage() {
  const queryClient = useQueryClient();

  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: GroupsService.getMyGroups,
  });

  const createGroupMutation = useMutation({
    mutationFn: GroupsService.createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    if (name) {
      await createGroupMutation.mutateAsync(name);
      e.currentTarget.reset();
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-spotify-white mb-8">My Groups</h1>

      <form onSubmit={handleCreateGroup} className="mb-8">
        <div className="flex gap-3">
          <input
            type="text"
            name="name"
            placeholder="New group name"
            className="flex-1 px-4 py-3 rounded-md bg-spotify-gray border border-gray-700 text-spotify-white placeholder-spotify-lightgray focus:outline-none focus:border-spotify-green"
          />
          <button
            type="submit"
            disabled={createGroupMutation.isPending}
            className="bg-spotify-green hover:bg-opacity-80 text-spotify-white px-6 py-3 rounded-md font-semibold transition-colors"
          >
            Create Group
          </button>
        </div>
      </form>

      <div className="grid gap-4">
        {groups?.map((group) => (
          <Link
            key={group.id}
            to={`/groups/${group.id}`}
            className="block p-6 bg-spotify-gray rounded-lg hover:bg-opacity-75 transition-all transform hover:scale-[1.02]"
          >
            <h2 className="text-xl font-bold text-spotify-white mb-2">{group.name}</h2>
            <p className="text-spotify-lightgray">
              {group.members.length} member{group.members.length !== 1 && 's'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
} 