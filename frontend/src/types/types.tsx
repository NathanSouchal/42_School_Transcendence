export interface Data {
  model: string;
  pk: number;
  fields: {
    name: string;
  };
}

export interface UserInfo {
  username: string;
  password: string;
}

export interface AccountInfo {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
  };
}

export interface LastDeleted {
  id: number;
}
