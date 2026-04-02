export interface CustomField {
  key: string;
  value: string;
  secret: boolean;
  field_type: string;
}

export interface Credential {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  custom_fields: CustomField[];
}

export interface VaultMetadata {
  last_modified: string;
}

export interface Vault {
  version: number;
  credentials: Credential[];
  metadata: VaultMetadata;
}
