export interface User {
  id: string;
  username: string;
  status: 'active' | 'banned' | 'deleted';
}