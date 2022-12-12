export type CurrentUserData = {
  id: number;
};

export type PrivacyInfoData = {
  ip: string;
  userAgent: string;
};

export type PaginationOptions = {
  page: number;
  limit: number;
};

export type SortingOptions = {
  sortBy: string;
  orderBy: 'ASC' | 'DESC';
};
