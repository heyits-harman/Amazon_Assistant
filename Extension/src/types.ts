export interface Review {
  title: string;
  body: string;
  rating: number | null;
  verified: boolean;
  date: string;
}

export interface UserProfile {
  age: string;
  gender: string;
  useCase: string;
}