interface TrieNode<T> {
  next: Map<string, TrieNode<T>>;
  values: T[];
}

function makeNode<T>(): TrieNode<T> {
  return { next: new Map(), values: [] };
}

/**
 * Prefix tree. insert = O(len(key)); startsWith = O(len(prefix) + results),
 * independent of how many keys are stored. BFS keeps shorter keys first.
 */
export class Trie<T> {
  private root: TrieNode<T> = makeNode<T>();

  insert(key: string, value: T): void {
    let node = this.root;
    for (const ch of key.toLowerCase()) {
      let child = node.next.get(ch);
      if (!child) {
        child = makeNode<T>();
        node.next.set(ch, child);
      }
      node = child;
    }
    node.values.push(value);
  }

  startsWith(prefix: string, limit = Number.POSITIVE_INFINITY): T[] {
    let node = this.root;
    for (const ch of prefix.toLowerCase()) {
      const child = node.next.get(ch);
      if (!child) return [];
      node = child;
    }

    const out: T[] = [];
    const queue: TrieNode<T>[] = [node];
    // index pointer instead of queue.shift() -> O(1) dequeue
    for (let head = 0; head < queue.length && out.length < limit; head++) {
      const cur = queue[head];
      for (const v of cur.values) {
        if (out.length >= limit) break;
        out.push(v);
      }
      for (const child of cur.next.values()) queue.push(child);
    }
    return out;
  }
}
