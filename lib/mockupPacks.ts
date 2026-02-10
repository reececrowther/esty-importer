/**
 * Mockup pack definitions.
 * Packs can be expanded and grouped in the future.
 * Each pack has vertical and horizontal PSD templates (paths relative to the pack folder).
 */

export interface MockupPackItem {
  /** Filename in the pack folder (e.g. vertical-1.psd) */
  filename: string;
  /** Display name for UI */
  name: string;
  /** 'vertical' | 'horizontal' for future grouping */
  orientation: 'vertical' | 'horizontal';
}

export interface MockupPack {
  id: string;
  name: string;
  description?: string;
  /** Vertical mockups (e.g. 5) – will be expanded */
  vertical: MockupPackItem[];
  /** Horizontal mockups (e.g. 5) – will be expanded */
  horizontal: MockupPackItem[];
}

const VERTICAL_MODERN_FRAME_PACK: MockupPack = {
  id: 'vertical-modern-frame',
  name: '5 Vertical Modern Frame Pack',
  description: '5 vertical mockup templates',
  vertical: [
    { filename: 'vertical-1.psd', name: 'Vertical 1', orientation: 'vertical' },
    { filename: 'vertical-2.psd', name: 'Vertical 2', orientation: 'vertical' },
    { filename: 'vertical-3.psd', name: 'Vertical 3', orientation: 'vertical' },
    { filename: 'vertical-4.psd', name: 'Vertical 4', orientation: 'vertical' },
    { filename: 'vertical-5.psd', name: 'Vertical 5', orientation: 'vertical' },
  ],
  horizontal: [],
};

const HORIZONTAL_MODERN_FRAME_PACK: MockupPack = {
  id: 'horizontal-modern-frame',
  name: '5 Horizontal Modern Frame Pack',
  description: '5 horizontal mockup templates',
  vertical: [],
  horizontal: [
    { filename: 'horizontal-1.psd', name: 'Horizontal 1', orientation: 'horizontal' },
    { filename: 'horizontal-2.psd', name: 'Horizontal 2', orientation: 'horizontal' },
    { filename: 'horizontal-3.psd', name: 'Horizontal 3', orientation: 'horizontal' },
    { filename: 'horizontal-4.psd', name: 'Horizontal 4', orientation: 'horizontal' },
    { filename: 'horizontal-5.psd', name: 'Horizontal 5', orientation: 'horizontal' },
  ],
};

/** All available mockup packs. Add more and group by category in the future. */
export const MOCKUP_PACKS: MockupPack[] = [VERTICAL_MODERN_FRAME_PACK, HORIZONTAL_MODERN_FRAME_PACK];

/** Get a pack by id */
export function getMockupPack(packId: string): MockupPack | undefined {
  return MOCKUP_PACKS.find((p) => p.id === packId);
}

/**
 * Get all mockup entries for a pack as path + originalName (for building MockupPSD-like objects in UI).
 * Order: vertical first, then horizontal. Will be expanded/grouped in the future.
 */
export function getPackEntries(packId: string): { path: string; originalName: string; name: string }[] {
  const pack = getMockupPack(packId);
  if (!pack) return [];
  const vertical = pack.vertical.map((item) => ({
    path: `${PACK_PATH_PREFIX}${packId}/${item.filename}`,
    originalName: item.filename,
    name: item.name,
  }));
  const horizontal = pack.horizontal.map((item) => ({
    path: `${PACK_PATH_PREFIX}${packId}/${item.filename}`,
    originalName: item.filename,
    name: item.name,
  }));
  return [...vertical, ...horizontal];
}

/**
 * Path prefix used in API: pack files are read from public/mockup-packs/{packId}/
 * Client and API use path like "pack:default/vertical-1.psd"
 */
export const PACK_PATH_PREFIX = 'pack:';

export function isPackPath(path: string): boolean {
  return path.startsWith(PACK_PATH_PREFIX);
}

/**
 * Resolve pack path to relative path under public/mockup-packs/
 * e.g. "pack:default/vertical-1.psd" -> "default/vertical-1.psd"
 */
export function getPackRelativePath(packPath: string): string {
  if (!isPackPath(packPath)) return '';
  return packPath.slice(PACK_PATH_PREFIX.length);
}
