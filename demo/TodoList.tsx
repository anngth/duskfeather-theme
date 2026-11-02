import { useEffect, useMemo, useState } from "react";
import type { Todo } from "./types";

interface Props {
  title: string;
  initial?: Todo[];
}

const STORAGE_KEY = "duskfeather.todos";

export function TodoList({ title, initial = [] }: Props) {
  const [todos, setTodos] = useState<Todo[]>(initial);
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");

  // Persist every change so a reload keeps the list.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const visible = useMemo(
    () => todos.filter((t) => (filter === "all" ? true : filter === "done" ? t.done : !t.done)),
    [todos, filter],
  );

  const toggle = (id: number) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <section className="todo-list">
      <h2>
        {title} <small>({visible.length} of {todos.length})</small>
      </h2>
      <ul>
        {visible.map((todo) => (
          <li key={todo.id} className={todo.done ? "done" : undefined} onClick={() => toggle(todo.id)}>
            {todo.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
