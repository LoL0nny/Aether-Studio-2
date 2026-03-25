export interface GenerationParams {
  lyrics: string;
  style: string;
  key: string;
  scale: 'Major' | 'Minor';
  vocalGender: string;
  vocalStyle: string;
  instruments: string[];
}

export interface SearchResult {
  text: string;
  sources: { title: string; uri: string }[];
}
