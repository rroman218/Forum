 export interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export interface QuestionRow {
  id: number;
  title: string;
  body: string;
  discipline: string;
  author_id: number;
  tags: string[];
  score: number;
  moderation_status: string;
  created_at: Date;
  updated_at: Date;
}

export interface AnswerRow {
  id: number;
  body: string;
  question_id: number;
  author_id: number;
  is_accepted: boolean;
  moderation_status: string;
  created_at: Date;
  updated_at: Date;
}