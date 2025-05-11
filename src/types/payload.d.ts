declare module 'payload/types' {
  export interface Field {
    name: string;
    type: string;
    label?: string;
    required?: boolean;
    admin?: {
      description?: string;
      position?: string;
      components?: {
        Field?: React.ComponentType<any>;
      };
    };
    validate?: (value: any) => boolean | string;
  }

  export interface CollectionConfig {
    slug: string;
    admin?: {
      useAsTitle?: string;
    };
    fields: Field[];
  }
}