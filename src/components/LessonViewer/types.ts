
export interface Section {
  id: string;
  name: string;
  overview: string;
  order: number;
  mainLessons: any[];
}

export type TabType = 'overview' | 'resources' | 'qa' | 'chat' | 'students' | 'contents';
