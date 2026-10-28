import { Complaint, DuplicateMatch } from '../types';

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'isn', 'it', 'its', 'itself', 'just', 'me', 'more',
  'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn', 'we', 'were',
  'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'won', 'would', 'you', 'your'
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

export function detectDuplicates(
  title: string,
  description: string,
  category: string,
  existingComplaints: Complaint[],
  threshold = 0.28
): DuplicateMatch[] {
  const queryTokens = new Set([...tokenize(title), ...tokenize(description)]);
  if (queryTokens.size === 0) return [];

  const matches: DuplicateMatch[] = [];

  for (const item of existingComplaints) {
    // Priority bonus if in same category
    const sameCategory = item.category === category;
    const itemTokens = new Set([...tokenize(item.title), ...tokenize(item.description)]);

    const intersection: string[] = [];
    for (const t of queryTokens) {
      if (itemTokens.has(t)) {
        intersection.push(t);
      }
    }

    const unionSize = new Set([...queryTokens, ...itemTokens]).size;
    let jaccard = unionSize > 0 ? intersection.length / unionSize : 0;

    // Title match boost
    const titleTokens = new Set(tokenize(title));
    const itemTitleTokens = new Set(tokenize(item.title));
    let titleIntersection = 0;
    for (const t of titleTokens) {
      if (itemTitleTokens.has(t)) titleIntersection++;
    }
    const titleScore = titleTokens.size > 0 ? titleIntersection / titleTokens.size : 0;

    let overallSimilarity = jaccard * 0.6 + titleScore * 0.4;
    if (sameCategory) {
      overallSimilarity = Math.min(1, overallSimilarity * 1.25);
    }

    if (overallSimilarity >= threshold && intersection.length >= 2) {
      matches.push({
        complaint: item,
        similarity: Math.round(overallSimilarity * 100),
        matchedWords: Array.from(new Set(intersection)).slice(0, 6),
      });
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity);
}
