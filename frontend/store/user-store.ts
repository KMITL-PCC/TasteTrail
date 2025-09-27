import { create } from "zustand";

export type userInfoProps = {
  username: string;
  email: string;
  role: string;
  profilePictureUrl: string;
};

type State = {
  user: userInfoProps | null;
};

type Actions = {
  setUser: (user: userInfoProps) => void;
  clearUser: () => void;
};

export const useUser = create<State & Actions>((set) => ({
  user: null,
  setUser: (user: userInfoProps) => set({ user }),
  clearUser: () => set({ user: null }),
}));
