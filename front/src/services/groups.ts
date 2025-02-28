import api from './api';

export const GroupsService = {
  createGroup: async (name: string) => {
    const response = await api.post('/groups', { name });
    return response.data;
  },

  getMyGroups: async () => {
    const response = await api.get('/groups');
    return response.data;
  },

  getGroupDetails: async (groupId: string) => {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  },

  joinGroup: async (groupId: string) => {
    const response = await api.post('/groups/join', { groupId });
    return response.data;
  },

  generateInviteCode: async (groupId: string) => {
    const response = await api.post(`/groups/${groupId}/invite`);
    return response.data;
  },

  joinByCode: async (code: string) => {
    const response = await api.post('/groups/join-by-code', { code });
    return response.data;
  },

  updateTracks: async (groupId: string) => {
    const response = await api.post(`/groups/${groupId}/update-tracks`);
    return response.data;
  },
}; 