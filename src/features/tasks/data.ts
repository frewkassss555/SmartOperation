import { useLiveQuery } from 'dexie-react-hooks';
import { notify, removeWithUndo } from '../../app/undo';
import { db, newId } from '../../db/db';
import { requestPersistenceOnce } from '../../db/settings';
import type { Task } from '../../db/types';

export function useTasks(): Task[] | undefined {
  return useLiveQuery(() => db.tasks.toArray(), []);
}

export type TaskInput = Pick<Task, 'title' | 'due' | 'subjectId'>;

export async function saveTask(input: TaskInput, existing?: Task) {
  if (existing) await db.tasks.put({ ...existing, ...input });
  else await db.tasks.add({ ...input, id: newId(), done: false });
  void requestPersistenceOnce();
}

export async function setTaskDone(task: Task, done: boolean) {
  await db.tasks.update(task.id, { done, doneAt: done ? Date.now() : undefined });
  // A finished task moves to the collapsed "done" list: offer a way back.
  if (done) notify(`Выполнено: ${task.title}`, () => db.tasks.update(task.id, { done: false, doneAt: undefined }).then(() => undefined));
}

export async function deleteTask(task: Task) {
  await removeWithUndo(`Удалён дедлайн «${task.title}»`, [{ table: 'tasks', ids: [task.id] }]);
}
