export interface Todo {
  id: number;
  text: string;
  done: boolean;
  tags?: string[];
}

export type Filter = "all" | "open" | "done";
