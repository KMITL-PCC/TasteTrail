import { create } from "zustand";

export type UserInfo = {
  username: string;
  email: string;
  role: string;
  profilePictureUrl: string;
  restaurantId: string;
};

type State = {
  user: UserInfo | null;
};

type Actions = {
  setUser: (user: UserInfo) => void;
  clearUser: () => void;
};

export const useUser = create<State & Actions>((set) => ({
  user: null,
  setUser: (user: UserInfo) => set({ user }),
  clearUser: () => set({ user: null }),
}));
