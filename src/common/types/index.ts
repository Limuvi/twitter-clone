export type CurrentUserData = {
  id: number;
  profileId: string;
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
