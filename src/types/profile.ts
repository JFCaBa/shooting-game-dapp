interface UserDetails {
  nickname: string | null;
  email: string | null;
  _id: string;
}

export interface ProfileResponse {
  details: UserDetails;
}
