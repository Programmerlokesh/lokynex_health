/**
 * Undo/redo with two stacks. push/undo/redo are O(1) (amortised); the undo
 * stack is capped so a long typing session cannot eat memory.
 */
export class UndoHistory {
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private limit: number;

  constructor(initial: string, limit = 100) {
    this.limit = limit;
    this.undoStack.push(initial);
  }

  get current(): string {
    return this.undoStack[this.undoStack.length - 1];
  }

  push(snapshot: string): void {
    if (snapshot === this.current) return;
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.limit) this.undoStack.shift();
    this.redoStack.length = 0; // a new edit kills the redo branch
  }

  undo(): string | null {
    if (this.undoStack.length < 2) return null;
    this.redoStack.push(this.undoStack.pop() as string);
    return this.current;
  }

  redo(): string | null {
    const next = this.redoStack.pop();
    if (next === undefined) return null;
    this.undoStack.push(next);
    return next;
  }
}
