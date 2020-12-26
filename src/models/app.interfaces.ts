export interface ContentInfo {
  folder: string;
  name: string;
  contentType: string;
}

export interface AppLink extends ContentInfo {
  contentId?: number;
  description?: string;
  content?: string;
  queryString?: string;
}

export interface AppContentInfo extends ContentInfo {
  appOwnerName: string;
  appName: string;
}

export interface PathHash {
  [path: string]: {
    hash: string;
    contentId: number;
  };
}

export interface SaveAppLink {
  appOwnerName: string;
  appName: string;
  appContent: AppLink;
}
