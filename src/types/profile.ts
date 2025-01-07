interface UserDetails {
  nickName: string | null;
  email: string | null;
  _id: string;
}

export interface ProfileType {
  details: UserDetails;
}
