
export interface Show {
  id: number;
  title: string;
  seller: string;
  thumbnail: string;
  isLive: boolean;
  viewers: string;
  price: string;
  category: string;
}

// Note: This static data is no longer used for the main buyer homepage grid.
// The grid is now populated with real data scheduled by the seller.
export const liveShows: Show[] = [];
