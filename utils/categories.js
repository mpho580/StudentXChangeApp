import { API_BASE_URL } from '../config';

const HIDDEN_WORDS = ['sport', 'accom'];

// Used only if the server can't be reached. Ids match the website's create form.
export const FALLBACK_CATEGORIES = [
  { id: 1, name: 'Textbooks' },
  { id: 2, name: 'Electronics & Gadgets' },
  { id: 4, name: 'Apparel & Clothing' },
  { id: 3, name: 'Dorm Furniture' },
  { id: 5, name: 'Stationery' },
  { id: 8, name: 'Other Services' },
];

const isHidden = (name) =>
  HIDDEN_WORDS.some((w) => String(name).toLowerCase().includes(w));

export async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/categories.php`);
    const data = await res.json();
    if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
      return data.categories
        .map((c) => ({ id: Number(c.id), name: String(c.name) }))
        .filter((c) => !isHidden(c.name));
    }
  } catch (e) {
    // fall through to the fallback list
  }
  return FALLBACK_CATEGORIES;
}

export function iconForCategory(name) {
  const n = String(name).toLowerCase();
  if (n.includes('book')) return 'book';
  if (n.includes('electronic')) return 'laptop-outline';
  if (n.includes('apparel') || n.includes('cloth')) return 'pricetag';
  if (n.includes('furniture')) return 'home';
  if (n.includes('stationery')) return 'pencil';
  if (n.includes('service')) return 'briefcase';
  return 'grid';
}